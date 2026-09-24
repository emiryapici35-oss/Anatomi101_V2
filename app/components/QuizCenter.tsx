"use client";
/* Verified external medical illustrations are rendered directly with source attribution. */
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { AnatomyItem, SystemId } from "../data/anatomy";
import { systems } from "../data/anatomy";
import { getQuizVisual, type QuizVisual } from "../data/quiz-visuals";
import {
  buildQuestions,
  buildSpeedQuestions,
  getGroupStats,
  QUIZ_HISTORY_KEY,
  readQuizHistory,
  SPEED_DURATION_SECONDS,
  type QuizAnswer,
  type QuizAttempt,
  type QuizMode,
  type QuizQuestion,
} from "../lib/quiz";
import Icon from "./Icons";

type QuizView = "setup" | "count" | "speed-ready" | "quiz" | "result" | "history";
type Props = {
  items: AnatomyItem[];
  onFocusItem: (item: AnatomyItem) => void;
  onQuizGuardChange: (concealed: boolean) => void;
};

function QuizVisualFigure({ item, visual }: { item: AnatomyItem; visual: QuizVisual }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <figure className="quiz-image">
      <div className="quiz-visual-label">
        <Icon name="eye" size={14} />
        <span>GÖRSEL DESTEK</span>
        <strong>{item.turkish}</strong>
      </div>
      <img
        className={visual.mirror ? "mirrored" : ""}
        src={visual.src}
        alt={visual.alt}
        onError={() => setFailed(true)}
        decoding="async"
      />
      <figcaption>
        <a href={visual.sourceUrl} target="_blank" rel="noreferrer">{visual.source} ↗</a>
      </figcaption>
    </figure>
  );
}

export default function QuizCenter({ items, onFocusItem, onQuizGuardChange }: Props) {
  const [view, setView] = useState<QuizView>("setup");
  const [quizMode, setQuizMode] = useState<QuizMode>("classic");
  const [systemId, setSystemId] = useState<SystemId | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [history, setHistory] = useState<QuizAttempt[]>(readQuizHistory);
  const [timeLeft, setTimeLeft] = useState(SPEED_DURATION_SECONDS);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSpeedRecord, setIsSpeedRecord] = useState(false);

  const deadlineRef = useRef(0);
  const answersRef = useRef<QuizAnswer[]>([]);
  const historyRef = useRef<QuizAttempt[]>(history);
  const finishedRef = useRef(false);
  const answerLockRef = useRef(false);
  const advanceTimerRef = useRef<number | null>(null);

  const currentSystem = systems.find((system) => system.id === systemId);
  const current = questions[index];
  const currentVisual = current && quizMode === "classic" ? getQuizVisual(current.item) : null;
  const systemItems = useMemo(
    () => items.filter((item) => item.category === systemId),
    [items, systemId],
  );
  const systemCounts = useMemo(
    () => Object.fromEntries(systems.map((system) => [
      system.id,
      items.filter((item) => item.category === system.id).length,
    ])) as Record<SystemId, number>,
    [items],
  );

  const score = answers.filter((answer) => answer.correct).length;
  const resultTotal = quizMode === "speed" ? answers.length : questions.length;
  const accuracy = resultTotal ? Math.round((score / resultTotal) * 100) : 0;
  const groupStats = useMemo(() => getGroupStats(answers), [answers]);
  const weakGroups = Object.entries(groupStats)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    .slice(0, 2)
    .map(([name]) => name);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => () => {
    if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
  }, []);

  const completeQuiz = useCallback((
    finalAnswers: QuizAnswer[],
    total: number,
    completedMode: QuizMode,
    durationSeconds?: number,
  ) => {
    if (finishedRef.current || !currentSystem || !systemId) return;
    finishedRef.current = true;
    answerLockRef.current = true;

    const finalScore = finalAnswers.filter((answer) => answer.correct).length;
    const previousSpeedBest = historyRef.current
      .filter((attempt) => attempt.mode === "speed")
      .reduce((best, attempt) => Math.max(best, attempt.score), 0);
    setIsSpeedRecord(completedMode === "speed" && finalScore > previousSpeedBest);
    setElapsedSeconds(durationSeconds ?? 0);
    setAnswers(finalAnswers);
    answersRef.current = finalAnswers;

    const attempt: QuizAttempt = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      date: new Date().toISOString(),
      systemId,
      systemName: currentSystem.name,
      score: finalScore,
      total,
      groups: getGroupStats(finalAnswers),
      mode: completedMode,
      durationSeconds,
    };
    const nextHistory = [attempt, ...historyRef.current].slice(0, 50);
    historyRef.current = nextHistory;
    setHistory(nextHistory);
    try {
      localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(nextHistory));
    } catch {
      // Quiz sonucu depolama kapalı olsa da sonuç ekranı çalışmaya devam eder.
    }
    onQuizGuardChange(false);
    setView("result");
  }, [currentSystem, onQuizGuardChange, systemId]);

  useEffect(() => {
    if (view !== "quiz" || quizMode !== "speed") return;
    if (deadlineRef.current === 0) {
      deadlineRef.current = performance.now() + SPEED_DURATION_SECONDS * 1000;
    }

    const updateTimer = () => {
      const remainingMs = Math.max(0, deadlineRef.current - performance.now());
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      setTimeLeft((currentValue) => currentValue === remainingSeconds ? currentValue : remainingSeconds);

      if (remainingMs <= 0) {
        completeQuiz(
          answersRef.current,
          answersRef.current.length,
          "speed",
          SPEED_DURATION_SECONDS,
        );
      }
    };

    updateTimer();
    const timer = window.setInterval(updateTimer, 200);
    return () => window.clearInterval(timer);
  }, [completeQuiz, quizMode, view]);

  const prepareRun = (nextQuestions: QuizQuestion[]) => {
    if (!nextQuestions.length) return false;
    if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
    finishedRef.current = false;
    answerLockRef.current = false;
    answersRef.current = [];
    setQuestions(nextQuestions);
    setIndex(0);
    setAnswers([]);
    setSelected(null);
    setIsSpeedRecord(false);
    return true;
  };

  const startClassic = (count: number) => {
    const nextQuestions = buildQuestions(systemItems, count);
    if (!prepareRun(nextQuestions)) return;
    setQuizMode("classic");
    onQuizGuardChange(true);
    setView("quiz");
  };

  const startSpeed = () => {
    const nextQuestions = buildSpeedQuestions(systemItems);
    if (!prepareRun(nextQuestions)) return;
    deadlineRef.current = 0;
    setTimeLeft(SPEED_DURATION_SECONDS);
    setElapsedSeconds(0);
    setQuizMode("speed");
    onQuizGuardChange(true);
    setView("quiz");
  };

  const chooseSystem = (id: SystemId) => {
    setSystemId(id);
    setView(quizMode === "speed" ? "speed-ready" : "count");
  };

  const chooseAnswer = (item: AnatomyItem) => {
    if (answerLockRef.current || selected || !current || finishedRef.current) return;
    answerLockRef.current = true;
    setSelected(item.id);

    const nextAnswers = [
      ...answersRef.current,
      { itemId: current.item.id, group: current.item.group, correct: item.id === current.item.id },
    ];
    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);

    if (quizMode === "classic") {
      // Yanıt verilmeden terim kartında doğru cevabın görünmesini engeller.
      onFocusItem(current.item);
      onQuizGuardChange(false);
      return;
    }

    advanceTimerRef.current = window.setTimeout(() => {
      if (finishedRef.current) return;
      const nextIndex = index + 1;
      if (nextIndex < questions.length) {
        setIndex(nextIndex);
        setSelected(null);
        answerLockRef.current = false;
        return;
      }

      completeQuiz(nextAnswers, nextAnswers.length, "speed", SPEED_DURATION_SECONDS);
    }, 320);
  };

  const nextClassicQuestion = () => {
    if (!selected || quizMode !== "classic") return;
    if (index + 1 < questions.length) {
      setIndex((currentIndex) => currentIndex + 1);
      setSelected(null);
      answerLockRef.current = false;
      onQuizGuardChange(true);
      return;
    }
    completeQuiz(answersRef.current, questions.length, "classic");
  };

  const reset = () => {
    if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
    finishedRef.current = false;
    answerLockRef.current = false;
    answersRef.current = [];
    setView("setup");
    setSystemId(null);
    setQuestions([]);
    setAnswers([]);
    setSelected(null);
    setTimeLeft(SPEED_DURATION_SECONDS);
    onQuizGuardChange(false);
  };

  const headerTitle = view === "history"
    ? "Çalışma analizin"
    : view === "result"
      ? quizMode === "speed" ? "Hız turu tamamlandı" : "Quiz tamamlandı"
      : view === "quiz" && quizMode === "speed"
        ? "60 saniyelik hız turu"
        : "Bilgini kalıcı hâle getir";

  return (
    <section className="quiz-center" id="quiz-main" tabIndex={-1}>
      <div className="quiz-top">
        <div>
          <span className="eyebrow">ANATOMİ QUIZ MERKEZİ</span>
          <h1>{headerTitle}</h1>
        </div>
        <div className="quiz-tabs">
          <button type="button" className={view !== "history" ? "active" : ""} onClick={reset}>Yeni quiz</button>
          <button type="button" className={view === "history" ? "active" : ""} onClick={() => { onQuizGuardChange(false); setView("history"); }}>Geçmiş & analiz</button>
        </div>
      </div>

      {view === "setup" && (
        <div className="quiz-setup">
          <div className="setup-intro">
            <span>1</span>
            <div>
              <h2>Quiz modunu seç</h2>
              <p>Klasik modda ayrıntılı geri bildirim al; hız turunda 60 saniyelik kişisel rekorunu geliştir.</p>
            </div>
          </div>
          <div className="quiz-mode-grid" role="group" aria-label="Quiz modu">
            <button
              type="button"
              className={quizMode === "classic" ? "active" : ""}
              aria-pressed={quizMode === "classic"}
              onClick={() => setQuizMode("classic")}
            >
              <span className="mode-icon"><Icon name="book" size={21} /></span>
              <span><strong>Klasik quiz</strong><small>5, 10 veya 20 soru · ayrıntılı geri bildirim</small></span>
              <b>Rahat tempo</b>
            </button>
            <button
              type="button"
              className={quizMode === "speed" ? "active speed" : "speed"}
              aria-pressed={quizMode === "speed"}
              onClick={() => setQuizMode("speed")}
            >
              <span className="mode-icon speed-bolt" aria-hidden="true">ϟ</span>
              <span><strong>60 saniye hız turu</strong><small>Süre dolana kadar durmadan soru çöz</small></span>
              <b>Rekor modu</b>
            </button>
          </div>

          <div className="setup-intro subject-step">
            <span>2</span>
            <div>
              <h2>Hangi konuda quiz olmak istersin?</h2>
              <p>Sorular yalnızca seçtiğin bölümün Türkçe–Latince terimlerinden hazırlanır.</p>
            </div>
          </div>
          <div className="subject-grid">
            {systems.map((system) => (
              <button type="button" key={system.id} onClick={() => chooseSystem(system.id)}>
                <span className={`subject-icon ${system.id}`}><Icon name={system.icon} size={20} /></span>
                <strong>{system.name}</strong>
                <small>{systemCounts[system.id]} yapı</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {view === "count" && currentSystem && (
        <div className="count-step">
          <button type="button" className="back-button" onClick={() => setView("setup")}>← Konulara dön</button>
          <SelectedSubject system={currentSystem} itemCount={systemItems.length} />
          <div className="setup-intro">
            <span>3</span>
            <div>
              <h2>Kaç soru çözmek istersin?</h2>
              <p>Sonuç ekranında grup bazlı güçlü ve geliştirilmesi gereken alanlarını göreceksin.</p>
            </div>
          </div>
          <div className="count-options">
            {[5, 10, 20].map((count) => (
              <button type="button" key={count} onClick={() => startClassic(count)}>
                <strong>{count}</strong><span>soru</span><small>≈ {count * 25} saniye</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {view === "speed-ready" && currentSystem && (
        <div className="count-step speed-ready">
          <button type="button" className="back-button" onClick={() => setView("setup")}>← Konulara dön</button>
          <SelectedSubject system={currentSystem} itemCount={systemItems.length} />
          <div className="speed-ready-card">
            <div className="speed-ready-clock"><strong>60</strong><span>saniye</span></div>
            <div>
              <span className="result-badge">HIZ TURU</span>
              <h2>Süre dolana kadar kaç doğru yapabilirsin?</h2>
              <ul>
                <li>Her soruda 5 Latince seçenek</li>
                <li>Yanıttan sonra otomatik olarak yeni soru</li>
                <li>Doğru sayın kişisel rekoruna kaydedilir</li>
              </ul>
              <button type="button" className="start-speed-button" onClick={startSpeed}>Turu başlat <span>→</span></button>
            </div>
          </div>
        </div>
      )}

      {view === "quiz" && current && (
        <div className={`quiz-session ${quizMode === "speed" ? "speed-session" : ""}`}>
          {quizMode === "speed" ? (
            <div className={`speed-hud ${timeLeft <= 10 ? "critical" : ""}`}>
              <div
                className="speed-timer"
                role="timer"
                aria-label={`${timeLeft} saniye kaldı`}
                style={{ "--time": `${(timeLeft / SPEED_DURATION_SECONDS) * 360}deg` } as CSSProperties}
              >
                <div><strong>{timeLeft}</strong><span>sn</span></div>
              </div>
              <div className="speed-live-stats">
                <span>{currentSystem?.name}</span>
                <div><strong>{answers.length}</strong><small>yanıt</small></div>
                <div><strong>{score}</strong><small>doğru</small></div>
                <p>Yanıtla, sıradaki soru otomatik gelsin.</p>
              </div>
            </div>
          ) : (
            <div className="quiz-progress">
              <div><span>{currentSystem?.name}</span><strong>{index + 1} / {questions.length}</strong></div>
              <div><i style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
            </div>
          )}

          <div className="question-card">
            <span className="question-type">{quizMode === "speed" ? "HIZ TURU · TÜRKÇEDEN LATİNCEYE" : "TÜRKÇEDEN LATİNCEYE"}</span>
            <h2><b>{current.item.turkish}</b> yapısının Latince adı hangisidir?</h2>
            {currentVisual && <QuizVisualFigure key={current.item.id} item={current.item} visual={currentVisual} />}
            <div className="answer-grid">
              {current.options.map((option, optionIndex) => {
                const answered = selected !== null;
                const isCorrect = option.id === current.item.id;
                const isWrong = option.id === selected && !isCorrect;
                const answerClass = answered ? isCorrect ? "correct" : isWrong ? "wrong" : "muted" : "";
                return (
                  <button
                    type="button"
                    key={option.id}
                    disabled={answered}
                    className={answerClass}
                    onClick={() => chooseAnswer(option)}
                  >
                    <span>{String.fromCharCode(65 + optionIndex)}</span>
                    <strong>{option.latin}</strong>
                    {answered && isCorrect && <em>Doğru</em>}
                  </button>
                );
              })}
            </div>
            {selected && quizMode === "classic" && (
              <div className="answer-feedback" aria-live="polite">
                <div>
                  <strong>{selected === current.item.id ? "Doğru bildin!" : "Bu kez olmadı."}</strong>
                  <p>{current.item.turkish} — <i>{current.item.latin}</i></p>
                </div>
                <button type="button" onClick={nextClassicQuestion}>
                  {index + 1 === questions.length ? "Sonuçları gör" : "Sonraki soru"} →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {view === "result" && (
        <div className={`quiz-result ${quizMode === "speed" ? "speed-result" : ""}`}>
          <div className="score-ring" style={{ "--score": `${accuracy * 3.6}deg` } as CSSProperties}>
            <div><strong>{score}/{resultTotal}</strong><span>%{accuracy}</span></div>
          </div>
          <div className="result-copy">
            <span className="result-badge">{quizMode === "speed" ? "60 SANİYE HIZ TURU" : "QUIZ TAMAMLANDI"}</span>
            <h2>{quizMode === "speed"
              ? isSpeedRecord ? "Yeni kişisel rekor!" : "Hız turunu tamamladın!"
              : accuracy >= 80 ? "Tebrikler, çok iyi gidiyorsun!" : accuracy >= 50 ? "Güzel bir başlangıç!" : "Bir tekrar turu çok işe yarayacak."}</h2>
            <p>{quizMode === "speed"
              ? `${elapsedSeconds} saniyede ${resultTotal} soruyu yanıtladın ve ${score} doğru yaptın.`
              : `${currentSystem?.name} konusunda ${resultTotal} sorunun ${score} tanesini doğru yanıtladın.`}</p>
          </div>

          {quizMode === "speed" && (
            <div className="speed-result-stats">
              <div><span>YANITLANAN</span><strong>{resultTotal}</strong><small>soru</small></div>
              <div><span>DOĞRU</span><strong>{score}</strong><small>cevap</small></div>
              <div><span>DOĞRULUK</span><strong>%{accuracy}</strong><small>başarı</small></div>
            </div>
          )}

          <div className="topic-analysis">
            <h3>Konu analizi</h3>
            {Object.keys(groupStats).length ? Object.entries(groupStats).map(([group, stat]) => (
              <div key={group}>
                <span>{group}</span>
                <div><i style={{ width: `${(stat.correct / stat.total) * 100}%` }} /></div>
                <strong>{stat.correct}/{stat.total}</strong>
              </div>
            )) : <p className="empty-analysis">Henüz cevaplanan soru yok. Yeni turda ilk doğruyu yakala.</p>}
          </div>
          <div className="study-advice">
            <Icon name="spark" size={19} />
            <p><strong>Çalışma önerisi</strong><br />{weakGroups.length
              ? `${weakGroups.join(" ve ")} başlıklarını menüden tekrar edip kısa bir klasik quiz çöz.`
              : "Başarılı sonuç! Aynı konuyu iki gün sonra tekrar ederek kalıcı öğrenmeyi güçlendir."}</p>
          </div>
          <div className="result-actions">
            <button type="button" onClick={quizMode === "speed" ? startSpeed : () => startClassic(questions.length)}>
              {quizMode === "speed" ? "Rekoru geliştir" : "Aynı konuda tekrar"}
            </button>
            <button type="button" onClick={reset}>Başka konu seç</button>
          </div>
        </div>
      )}

      {view === "history" && <HistoryView attempts={history} />}
    </section>
  );
}

function SelectedSubject({
  system,
  itemCount,
}: {
  system: (typeof systems)[number];
  itemCount: number;
}) {
  return (
    <div className="selected-subject">
      <span className={`subject-icon ${system.id}`}><Icon name={system.icon} size={24} /></span>
      <div>
        <span>SEÇİLEN KONU</span>
        <h2>{system.name}</h2>
        <p>{itemCount} yapıdan dengeli soru havuzu</p>
      </div>
    </div>
  );
}

function HistoryView({ attempts }: { attempts: QuizAttempt[] }) {
  const topics = useMemo(() => systems.map((system) => {
    const matches = attempts.filter((attempt) => attempt.systemId === system.id);
    const correct = matches.reduce((sum, attempt) => sum + attempt.score, 0);
    const total = matches.reduce((sum, attempt) => sum + attempt.total, 0);
    return { ...system, quizzes: matches.length, rate: total ? Math.round((correct / total) * 100) : 0 };
  }).filter((topic) => topic.quizzes), [attempts]);

  const groups = useMemo(() => {
    const aggregate: Record<string, { correct: number; total: number }> = {};
    attempts.forEach((attempt) => Object.entries(attempt.groups).forEach(([name, stat]) => {
      const current = aggregate[name] || { correct: 0, total: 0 };
      current.correct += stat.correct;
      current.total += stat.total;
      aggregate[name] = current;
    }));
    return Object.entries(aggregate)
      .filter(([, stat]) => stat.total > 0)
      .map(([name, stat]) => ({ name, ...stat, rate: Math.round((stat.correct / stat.total) * 100) }))
      .sort((a, b) => a.rate - b.rate || b.total - a.total);
  }, [attempts]);

  if (!attempts.length) {
    return (
      <div className="empty-history">
        <span>◎</span><h2>Henüz quiz geçmişin yok</h2>
        <p>İlk quizini tamamladığında konu performansın ve çalışma önerilerin burada görünecek.</p>
      </div>
    );
  }

  const best = [...topics].sort((a, b) => b.rate - a.rate)[0];
  const weak = [...topics].sort((a, b) => a.rate - b.rate)[0];
  const speedAttempts = attempts.filter((attempt) => attempt.mode === "speed");
  const speedRecord = speedAttempts.reduce((record, attempt) => Math.max(record, attempt.score), 0);

  return (
    <div className="history-view">
      <div className="insight-cards">
        <div><span>TOPLAM QUIZ</span><strong>{attempts.length}</strong><small>{attempts.reduce((sum, item) => sum + item.total, 0)} soru çözüldü</small></div>
        <div><span>EN İYİ KONU</span><strong>{best?.name ?? "—"}</strong><small>%{best?.rate ?? 0} başarı</small></div>
        <div><span>ÖNCELİKLİ TEKRAR</span><strong>{weak?.name ?? "—"}</strong><small>%{weak?.rate ?? 0} başarı</small></div>
        {speedAttempts.length > 0 && <div className="speed-record-card"><span>HIZ TURU REKORU</span><strong>{speedRecord} doğru</strong><small>{speedAttempts.length} hız turu</small></div>}
      </div>
      <h2>Sistem performansı</h2>
      <div className="performance-list">
        {topics.map((topic) => (
          <div key={topic.id}>
            <span>{topic.name}<small>{topic.quizzes} quiz</small></span>
            <div><i style={{ width: `${topic.rate}%` }} /></div>
            <strong>%{topic.rate}</strong>
          </div>
        ))}
      </div>
      {groups.length > 0 && (
        <>
          <h2>Alt başlık analizi · önce tekrar edilecekler</h2>
          <div className="performance-list subgroup-performance">
            {groups.slice(0, 8).map((group) => (
              <div key={group.name}>
                <span>{group.name}<small>{group.total} soru</small></span>
                <div><i style={{ width: `${group.rate}%` }} /></div>
                <strong>%{group.rate}</strong>
              </div>
            ))}
          </div>
        </>
      )}
      <h2>Son quizler</h2>
      <div className="attempt-list">
        {attempts.slice(0, 8).map((attempt) => (
          <div key={attempt.id}>
            <span>
              <strong>{attempt.systemName}</strong>
              <small>{new Date(attempt.date).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })} · {attempt.mode === "speed" ? "60 sn hız turu" : "Klasik"}</small>
            </span>
            <b>{attempt.score}/{attempt.total}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
