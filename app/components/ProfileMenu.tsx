"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { auth, type AuthSession } from "../lib/supabase/auth";

const frames = [
  { id: "starter", title: "Başlangıç", required: 0, tone: "mint" },
  { id: "coral-10", title: "Mercan Rozeti", required: 10, tone: "coral" },
  { id: "aqua-20", title: "Aqua Atlas", required: 20, tone: "aqua" },
  { id: "violet-50", title: "Violet Scholar", required: 50, tone: "violet" },
  { id: "gold-75", title: "Altın Anatomi", required: 75, tone: "gold" },
  { id: "platinum-100", title: "Platin Hekim", required: 100, tone: "platinum" },
];

export default function ProfileMenu({ streak }: { streak: number }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("starter");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const storedFrame = localStorage.getItem("anatomy101:frame") || "starter";
    const frame = frames.find((candidate) => candidate.id === storedFrame);
    const safeFrame = frame && streak >= frame.required ? storedFrame : "starter";
    setSelected(safeFrame);
    if (safeFrame !== storedFrame) localStorage.setItem("anatomy101:frame", safeFrame);
    setSession(auth.getSession());

    const refreshSession = () => setSession(auth.getSession());
    window.addEventListener("anatomy101:auth-change", refreshSession);
    return () => window.removeEventListener("anatomy101:auth-change", refreshSession);
  }, [streak]);

  useEffect(() => {
    if (!open) return;
    const closeMenu = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") setOpen(false);
      if (event instanceof PointerEvent && !wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeMenu);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeMenu);
    };
  }, [open]);

  const choose = (id: string, unlocked: boolean) => {
    if (!unlocked) return;
    setSelected(id);
    localStorage.setItem("anatomy101:frame", id);
  };

  const signOut = async () => {
    setSigningOut(true);
    try {
      await auth.signOut();
      setOpen(false);
    } finally {
      setSigningOut(false);
    }
  };

  const selectedTone = frames.find((frame) => frame.id === selected)?.tone ?? "mint";
  const initial = session?.user.email?.trim().charAt(0).toLocaleUpperCase("tr-TR") || "Ö";

  return (
    <div className="profile-wrap" ref={wrapperRef}>
      <button
        type="button"
        className={`avatar frame-${selectedTone}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Profil ve ödüller"
      >
        {initial}
      </button>
      {open && (
        <section className="profile-menu" aria-label="Profil ve ödül menüsü">
          <div className="profile-summary">
            <span className={`profile-avatar frame-${selectedTone}`}>{initial}</span>
            <div>
              <strong>{session?.user.email ?? "Misafir öğrenci"}</strong>
              <small>Seviye {Math.floor(streak / 5) + 1} · {streak} günlük seri</small>
            </div>
          </div>
          <div className="profile-auth-actions">
            {session ? (
              <button type="button" onClick={signOut} disabled={signingOut}>{signingOut ? "Çıkılıyor…" : "Çıkış yap"}</button>
            ) : (
              <><Link href="/login">Giriş yap</Link><Link href="/register">Kayıt ol</Link></>
            )}
          </div>
          <p className="profile-storage-note">Quiz geçmişi ve tercihler şu anda bu tarayıcıda saklanır.</p>
          <div className="reward-title">
            <span>PROFİL ÇERÇEVELERİ</span>
            <b>{frames.filter((frame) => streak >= frame.required).length} / {frames.length}</b>
          </div>
          <div className="frame-grid">
            {frames.map((frame) => {
              const unlocked = streak >= frame.required;
              return (
                <button
                  type="button"
                  key={frame.id}
                  onClick={() => choose(frame.id, unlocked)}
                  disabled={!unlocked}
                  title={unlocked ? `${frame.title} çerçevesini kullan` : `${frame.required} günlük seride açılır`}
                  className={`frame-choice ${frame.tone} ${selected === frame.id ? "selected" : ""} ${unlocked ? "" : "locked"}`}
                >
                  <i>{unlocked ? "✓" : "🔒"}</i>
                  <span>{frame.required === 0 ? "Başlangıç" : `${frame.required} gün`}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
