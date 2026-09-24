"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="status-page">
      <div className="status-card">
        <span className="status-code">!</span>
        <span className="eyebrow">BEKLENMEYEN HATA</span>
        <h1>Bu bölüm yüklenemedi</h1>
        <p>İlerlemen tarayıcıda korunuyor. Bölümü yeniden deneyebilir veya ana ekrana dönebilirsin.</p>
        <div><button type="button" onClick={reset}>Yeniden dene</button><Link href="/">Ana ekrana dön</Link></div>
      </div>
    </main>
  );
}
