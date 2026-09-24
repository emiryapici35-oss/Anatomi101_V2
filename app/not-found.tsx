import Link from "next/link";

export default function NotFound() {
  return (
    <main className="status-page">
      <div className="status-card">
        <span className="status-code">404</span>
        <span className="eyebrow">SAYFA BULUNAMADI</span>
        <h1>Aradığın bölüm burada değil</h1>
        <p>Bağlantı değişmiş veya yanlış yazılmış olabilir.</p>
        <div><Link href="/">Quiz ekranına dön</Link></div>
      </div>
    </main>
  );
}
