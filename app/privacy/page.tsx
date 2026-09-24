import Link from "next/link";

export const metadata = {
  title: "Gizlilik",
  description: "Anatomi 101 veri saklama ve gizlilik açıklaması.",
};

export default function PrivacyPage() {
  return (
    <main className="info-page">
      <article className="info-card">
        <Link href="/" className="info-back">← Uygulamaya dön</Link>
        <span className="eyebrow">GİZLİLİK</span>
        <h1>Verilerin nasıl saklanır?</h1>
        <p className="info-lead">Anatomi 101’in misafir modu, öğrenme verilerini öncelikle kullandığın tarayıcıda saklar.</p>

        <section>
          <h2>Bu cihazda saklananlar</h2>
          <p>Tema tercihi, quiz geçmişi, günlük seri, cevaplanan günlük soru ve seçtiğin profil çerçevesi tarayıcının yerel depolama alanında tutulur. Tarayıcı verilerini temizlersen bu bilgiler silinir.</p>
        </section>
        <section>
          <h2>Hesap sistemi</h2>
          <p>Hesap özelliği etkinleştirildiğinde e-posta ve kimlik doğrulama verileri yapılandırılmış Supabase projesi tarafından işlenir. Şifre uygulama kodunda veya yerel quiz geçmişinde saklanmaz. Quiz geçmişi şu an hesaplar arasında otomatik eşitlenmez.</p>
        </section>
        <section>
          <h2>Harici içerik</h2>
          <p>Bazı quiz görselleri Wikimedia Commons üzerinden yüklenir. Bu istek sırasında standart bağlantı bilgileri görsel sağlayıcısına iletilebilir. Her görselin kaynak bağlantısı soru altında gösterilir.</p>
        </section>
        <section>
          <h2>Kontrol sende</h2>
          <p>Profil menüsünden hesabından çıkabilir; tarayıcı ayarlarından site verilerini silerek yerel ilerlemeyi kaldırabilirsin.</p>
        </section>
      </article>
    </main>
  );
}
