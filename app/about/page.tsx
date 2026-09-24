import Link from "next/link";
import { anatomyItems, catalogCounts, catalogVersion, systems } from "../data/anatomy";

export const metadata = {
  title: "İçerik ve Kaynaklar",
  description: "Anatomi 101 katalog kapsamı, terminoloji yaklaşımı ve kaynakları.",
};

export default function AboutPage() {
  return (
    <main className="info-page">
      <article className="info-card">
        <Link href="/" className="info-back">← Uygulamaya dön</Link>
        <span className="eyebrow">İÇERİK ŞEFFAFLIĞI</span>
        <h1>Anatomi 101 içerik ve kaynakları</h1>
        <p className="info-lead">Katalog {catalogVersion}, toplam <strong>{anatomyItems.length.toLocaleString("tr-TR")}</strong> benzersiz Türkçe–Latince öğrenme birimi içerir.</p>

        <section>
          <h2>Katalog kapsamı</h2>
          <div className="coverage-grid">
            {systems.map((system) => (
              <div key={system.id}><span>{system.name}</span><strong>{catalogCounts[system.id].toLocaleString("tr-TR")}</strong></div>
            ))}
          </div>
          <p>Kemik kataloğu yetişkin iskeletinin 206 kemiğini ayrı kayıtlar hâlinde içerir. Kas sayısı; sağ-sol tarafların, kas başlarının ve öğretim alt bölümlerinin ayrı sayılması nedeniyle “bağımsız kas sayısı” değildir.</p>
        </section>

        <section>
          <h2>Terminoloji standardı</h2>
          <p>Latince adlandırmada IFAA/FIPAT tarafından yayımlanan güncel <em>Terminologia Anatomica Humana (TAH)</em> portalı temel referanstır. Uygulama bir çalışma aracıdır; resmî terminolojinin veya fakültenizin ders kaynağının yerine geçmez.</p>
          <div className="source-links">
            <a href="https://ifaa.unifr.ch/Public/EntryPage/HomePublic.html" target="_blank" rel="noreferrer">IFAA · Güncel TAH portalı ↗</a>
            <a href="https://ifaa.unifr.ch/" target="_blank" rel="noreferrer">IFAA/FIPAT terminolojileri ↗</a>
          </div>
        </section>

        <section>
          <h2>Görseller ve eğitim sınırı</h2>
          <p>Quiz görselleri kaynak bağlantısıyla birlikte Wikimedia Commons üzerindeki kamu malı veya açık lisanslı dosyalardan gösterilir. Anatomi 101 yalnızca eğitim amaçlıdır; tanı, tedavi veya klinik karar desteği sunmaz.</p>
        </section>

        <div className="info-notice"><strong>Yayın ilkesi</strong><p>Yinelenen kimlikler, boş zorunlu alanlar, aynı sistemde yinelenen Latince terimler, geçersiz koordinatlar, quiz seçenekleri ve 206 kemik sayısı her sürümde otomatik denetlenir. Bu yapısal test, tüm kayıtların TAH birim kimlikleriyle satır satır eşleştirildiği anlamına gelmez.</p></div>
      </article>
    </main>
  );
}
