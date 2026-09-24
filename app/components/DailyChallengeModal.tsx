"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AnatomyItem } from "../data/anatomy";
import { localDateKey, previousLocalDateKey, stableDailySeed } from "../lib/daily";

type Props = { items: AnatomyItem[]; onStreakChange: (streak: number) => void };

function dailyQuestion(items: AnatomyItem[], dateKey: string) {
  const seed = stableDailySeed(dateKey);
  const correct = items[seed % items.length];
  const sameGroup = items.filter((item) => item.id !== correct.id && item.group === correct.group && item.latin !== correct.latin);
  const sameSystem = items.filter((item) => item.id !== correct.id && item.category === correct.category && item.group !== correct.group && item.latin !== correct.latin);
  const candidates = [...sameGroup, ...sameSystem];
  const first = candidates[seed % candidates.length];
  const second = candidates[(seed * 7 + 11) % candidates.length];
  const distractors = Array.from(new Map([first, second, ...candidates].filter(Boolean).map((item) => [item.latin, item])).values()).slice(0, 2);
  const options = [correct, ...distractors].sort((left, right) => stableDailySeed(`${dateKey}:${left.id}`) - stableDailySeed(`${dateKey}:${right.id}`));
  return { correct, options };
}

export default function DailyChallengeModal({ items, onStreakChange }: Props) {
  const dateKey = useMemo(() => localDateKey(), []);
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const question = useMemo(() => dailyQuestion(items, dateKey), [dateKey, items]);
  const dismissedKey = `anatomy101:daily-dismissed:${dateKey}`;
  const closeModal = useCallback(() => {
    if (answer === null) localStorage.setItem(dismissedKey, "1");
    setOpen(false);
  }, [answer, dismissedKey]);

  useEffect(() => {
    if (
      localStorage.getItem(`anatomy101:daily:${dateKey}`) === null
      && localStorage.getItem(dismissedKey) === null
    ) setOpen(true);
  }, [dateKey, dismissedKey]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeModal, open]);

  const submit = (latin: string) => {
    const correct = latin === question.correct.latin;
    const last = localStorage.getItem("anatomy101:last-correct-date");
    const current = Math.max(0, Number(localStorage.getItem("anatomy101:streak") || 0) || 0);
    const next = correct ? (last === previousLocalDateKey() ? current + 1 : 1) : 0;

    localStorage.setItem(`anatomy101:daily:${dateKey}`, latin);
    localStorage.setItem("anatomy101:last-daily-date", dateKey);
    if (correct) localStorage.setItem("anatomy101:last-correct-date", dateKey);
    localStorage.setItem("anatomy101:streak", String(next));
    onStreakChange(next);
    setAnswer(latin);
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="daily-title">
      <section className="daily-modal">
        <button type="button" className="daily-close" onClick={closeModal} aria-label="Günün sorusunu kapat">×</button>
        <span className="eyebrow">GÜNLÜK MİNİ TEST</span>
        <h2 id="daily-title">{question.correct.turkish} yapısının Latince adı nedir?</h2>
        <p>Doğru yanıt günlük serini ilerletir. Yanlış yanıt seriyi sıfırlar.</p>
        <div className="daily-options">
          {question.options.map((item, index) => (
            <button
              type="button"
              key={item.id}
              autoFocus={index === 0}
              disabled={answer !== null}
              className={answer ? (item.latin === question.correct.latin ? "correct" : item.latin === answer ? "wrong" : "") : ""}
              onClick={() => submit(item.latin)}
            >
              {item.latin}
            </button>
          ))}
        </div>
        {answer && (
          <div className="daily-result" aria-live="polite">
            <strong>{answer === question.correct.latin ? "Harika, doğru yanıt!" : `Doğru yanıt: ${question.correct.latin}`}</strong>
            <button type="button" onClick={closeModal}>Çalışmaya geç</button>
          </div>
        )}
      </section>
    </div>
  );
}
