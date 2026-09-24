"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { auth } from "../lib/supabase/auth";

export default function AuthCard({ mode }: { mode: "login" | "register" | "forgot" }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [busy, setBusy] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState("");
  const configured = auth.isConfigured();

  useEffect(() => {
    if (mode !== "forgot") return;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("type") === "recovery" && hash.get("access_token")) {
      setRecoveryToken(hash.get("access_token") ?? "");
    }
  }, [mode]);

  const title = recoveryToken
    ? "Yeni şifreni belirle"
    : mode === "login"
      ? "Tekrar hoş geldin"
      : mode === "register"
        ? "Öğrenme yolculuğuna başla"
        : "Şifreni yenile";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");

    try {
      if (mode === "register" && password !== String(form.get("passwordConfirm") ?? "")) {
        throw new Error("Şifreler birbiriyle eşleşmiyor.");
      }
      if (recoveryToken) {
        await auth.updatePassword(password, recoveryToken);
        window.history.replaceState({}, "", "/forgot-password");
        setMessageTone("success");
        setMessage("Şifren güncellendi. Giriş sayfasına yönlendiriliyorsun.");
        window.setTimeout(() => router.replace("/login"), 900);
      } else if (mode === "login") {
        const { session } = await auth.signIn(String(form.get("email")), password);
        if (!session) throw new Error("Oturum oluşturulamadı. E-posta doğrulamanı kontrol et.");
        setMessageTone("success");
        setMessage("Giriş başarılı. Uygulama açılıyor.");
        router.replace("/");
      } else if (mode === "register") {
        const { session } = await auth.signUp(String(form.get("email")), password);
        setMessageTone("success");
        setMessage(session ? "Hesabın oluşturuldu. Uygulama açılıyor." : "Hesabın oluşturuldu. E-postandaki doğrulama bağlantısını aç.");
        if (session) router.replace("/");
      } else {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || window.location.origin;
        await auth.forgotPassword(String(form.get("email")), `${siteUrl}/forgot-password`);
        setMessageTone("success");
        setMessage("Sıfırlama bağlantısı gönderildi. Gelen kutunu ve spam klasörünü kontrol et.");
      }
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="brand">
          <span className="brand-mark"><i /><i /><i /></span><span>Anatomi <b>101</b></span>
        </Link>
        <span className="eyebrow">KİŞİSEL ÇALIŞMA ALANIN</span>
        <h1>{title}</h1>
        <p>{recoveryToken
          ? "En az sekiz karakterden oluşan yeni şifreni gir."
          : mode === "forgot"
            ? "E-posta adresini gir; güvenli yenileme bağlantısı gönderelim."
            : "Hesabınla giriş yap; bu cihazdaki öğrenme deneyimine devam et."}</p>

        {!configured && (
          <div className="auth-config-warning" role="status">
            Hesap sistemi bu kurulumda etkin değil. <Link href="/">Misafir olarak devam et</Link>.
          </div>
        )}

        <form onSubmit={submit}>
          {!recoveryToken && (
            <label>E-posta
              <input name="email" type="email" required autoComplete="email" placeholder="ornek@universite.edu" />
            </label>
          )}
          {(mode !== "forgot" || recoveryToken) && (
            <label>{recoveryToken ? "Yeni şifre" : "Şifre"}
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete={mode === "login" && !recoveryToken ? "current-password" : "new-password"}
                placeholder="En az 8 karakter"
              />
            </label>
          )}
          {mode === "register" && (
            <label>Şifreyi doğrula
              <input
                name="passwordConfirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Şifreni yeniden gir"
              />
            </label>
          )}
          <button type="submit" disabled={busy || !configured}>
            {busy
              ? "İşleniyor..."
              : recoveryToken
                ? "Şifreyi güncelle"
                : mode === "login"
                  ? "Giriş yap"
                  : mode === "register"
                    ? "Hesap oluştur"
                    : "Yenileme bağlantısı gönder"}
          </button>
        </form>

        {mode === "register" && (
          <p className="auth-consent">Hesap oluşturarak <Link href="/privacy">gizlilik açıklamasını</Link> okuduğunu kabul edersin.</p>
        )}

        {message && <p className={`auth-message ${messageTone}`} aria-live="polite">{message}</p>}
        <div className="auth-links">
          {mode === "login" ? (
            <><Link href="/forgot-password">Şifremi unuttum</Link><span>·</span><Link href="/register">Kayıt ol</Link></>
          ) : <Link href="/login">Giriş sayfasına dön</Link>}
        </div>
      </section>
    </main>
  );
}
