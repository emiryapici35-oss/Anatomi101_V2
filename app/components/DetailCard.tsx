"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnatomyItem } from "../data/anatomy";
import { systems } from "../data/anatomy";
import { analyzeEtymology } from "../data/etymology";
import { getLatinPronunciation } from "../data/latin-pronunciation";
import Icon from "./Icons";

export default function DetailCard({ item, concealed = false }: { item: AnatomyItem; concealed?: boolean }) {
  const system = systems.find((candidate) => candidate.id === item.category);
  const etymology = useMemo(() => analyzeEtymology(item), [item]);
  const pronunciation = useMemo(() => getLatinPronunciation(item.latin), [item.latin]);
  const [activeRootKey, setActiveRootKey] = useState("");
  const [speechState, setSpeechState] = useState<"idle" | "speaking" | "unsupported">("idle");
  const [spokenTerm, setSpokenTerm] = useState("");
  const activeRoot = etymology.pieces.find((piece) => piece.key === activeRootKey) ?? etymology.pieces[0];
  const isSpeaking = speechState === "speaking" && spokenTerm === item.latin;
  const latinWords = item.latin.trim().split(/\s+/);
  const longestLatinWord = Math.max(...latinWords.map((word) => word.length));
  const titleDensity =
    item.latin.length > 68 || longestLatinWord > 22
      ? "title-xsmall"
      : item.latin.length > 44 || longestLatinWord > 18
        ? "title-small"
        : item.latin.length > 28 || longestLatinWord > 14
          ? "title-medium"
          : "title-normal";

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [concealed, item.id]);

  const speakLatin = () => {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setSpeechState("unsupported");
      return;
    }

    const synthesis = window.speechSynthesis;
    if (isSpeaking) {
      synthesis.cancel();
      setSpeechState("idle");
      return;
    }

    synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(pronunciation.phonetic);
    const voices = synthesis.getVoices();
    const turkishVoice = voices.find((voice) => /^tr(?:-|_|$)/i.test(voice.lang));
    const fallbackVoice = voices.find((voice) => /^it(?:-|_|$)/i.test(voice.lang));
    const voice = turkishVoice ?? fallbackVoice;

    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? "tr-TR";
    utterance.rate = 0.72;
    utterance.pitch = 1;
    utterance.onstart = () => {
      setSpokenTerm(item.latin);
      setSpeechState("speaking");
    };
    utterance.onend = () => setSpeechState("idle");
    utterance.onerror = () => setSpeechState("idle");

    setSpokenTerm(item.latin);
    setSpeechState("speaking");
    synthesis.speak(utterance);
  };

  if (concealed) {
    return (
      <aside className="detail-panel quiz-concealed-card" aria-live="polite">
        <div className="detail-glow" />
        <span className="eyebrow">QUIZ MODU</span>
        <div className="concealed-illustration" aria-hidden="true">
          <span>?</span>
          <Icon name="book" size={27} />
        </div>
        <h2>Cevap şimdilik gizli</h2>
        <p>Önce soruyu yanıtla. Klasik modda doğru terim ve kelime kökleri cevabından sonra burada açılır.</p>
        <div className="concealed-tip"><Icon name="spark" size={18} /><span>Hatırlamaya çalışmak, yalnızca yeniden okumaktan daha kalıcıdır.</span></div>
      </aside>
    );
  }

  return (
    <aside className={`detail-panel ${item.accent}`}>
      <div className="detail-glow" />
      <span className="eyebrow">TERİM KARTI</span>

      <div className={`latin-card ${titleDensity}`}>
        <span>{system?.name.toLocaleUpperCase("tr-TR")}</span>
        <div className="latin-title-row">
          <h1 aria-label={item.latin}>
            {latinWords.map((word, index) => (
              <span key={`${word}-${index}`} aria-hidden="true">{word}</span>
            ))}
          </h1>
          <button
            className={`pronounce-button${isSpeaking ? " speaking" : ""}`}
            type="button"
            onClick={speakLatin}
            aria-label={isSpeaking ? "Telaffuzu durdur" : `${item.latin} telaffuzunu dinle`}
            aria-pressed={isSpeaking}
            title={isSpeaking ? "Telaffuzu durdur" : "Latince telaffuzu dinle"}
          >
            <Icon name="volume" size={17} />
            <span>{isSpeaking ? "Durdur" : "Dinle"}</span>
          </button>
        </div>
        {speechState === "unsupported" && (
          <p className="speech-warning">Bu tarayıcı sesli telaffuzu desteklemiyor.</p>
        )}
        <div className="pronunciation-preview">
          <span>TIBBİ LATİNCE OKUNUŞ</span>
          <strong>{pronunciation.syllabified}</strong>
        </div>
        <div className="card-mark"><Icon name="book" size={17} /></div>
      </div>

      <section className="etymology-card" aria-labelledby="etymology-title">
        <div className="etymology-head">
          <div>
            <span>KELİME PARÇALAYICI</span>
            <h2 id="etymology-title">Latince kök ve etimoloji</h2>
          </div>
          <Icon name="spark" size={17} />
        </div>

        <div className="etymology-word" aria-label={`${item.latin} kelime kökleri`}>
          {etymology.pieces.map((piece) => (
            <button
              key={piece.key}
              className={`${piece.key === activeRoot.key ? "active" : ""}${piece.known ? "" : " unknown"}${piece.form.length > 25 ? " root-xlong" : piece.form.length > 17 ? " root-long" : ""}`}
              type="button"
              onClick={() => setActiveRootKey(piece.key)}
              title={`${piece.form}: ${piece.meaning}`}
            >
              {piece.form}
            </button>
          ))}
        </div>

        <div className="root-explanation" aria-live="polite">
          <span>{activeRoot.form}</span>
          <strong>{activeRoot.meaning}</strong>
          <small>{activeRoot.origin}</small>
        </div>

        <div className="root-equation">
          <div>
            {etymology.pieces.map((piece, index) => (
              <span className="equation-piece" key={piece.key}>
                {index > 0 && <i>+</i>}
                <b>{piece.form}</b>
                <em>({piece.meaning})</em>
              </span>
            ))}
          </div>
          <p>= “{etymology.meaning}”</p>
        </div>

        {!etymology.complete && (
          <p className="etymology-caution">
            Tanımlı kökler gösteriliyor; özel anatomik adlar için tahmine dayalı köken üretilmez.
          </p>
        )}
      </section>

      <div className="translation">
        <span>TÜRKÇE KARŞILIĞI</span>
        <h2>{item.turkish}</h2>
        <p className="detail-group">{item.group}</p>
      </div>

      <div className="note"><Icon name="spark" size={19} /><p>{item.note}</p></div>
      {item.aliases.length > 0 && (
        <div className="alias-box">
          <span>ARAMA EŞ ANLAMLILARI</span>
          <p>{item.aliases.join(" · ")}</p>
        </div>
      )}
      <div className="memory-tip">
        <strong>Hafıza ipucu</strong>
        <p>Köklerin üzerine dokun, anlamını gör; ardından hoparlörle terimi dinleyip üç kez sesli tekrar et.</p>
      </div>
    </aside>
  );
}
