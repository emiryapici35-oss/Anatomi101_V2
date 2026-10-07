import Link from "next/link";
import { anatomyItems, catalogCounts, catalogVersion, systems } from "../data/anatomy";
import muscleModel from "../data/muscle-model.json";
import jointModel from "../data/joint-model.json";
import imageAtlas from "../data/image-atlas.json";

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
          <h2>İnternetten alınan anatomi görselleri</h2>
          <p>Görsel atlasında {new Set(imageAtlas.plates.map(plate => plate.src)).size} özgün kaynak görseli, {imageAtlas.plates.length} alt menü levhasında kullanılır. OpenStax Anatomy &amp; Physiology ders kitabının CC BY 4.0 lisanslı arşiv baskısı, Servier Medical Art ve Wikimedia Commons kaynaklarından alınan dosyalar değiştirilmeden saklanır. Her görselin yazarı, özgün sayfası ve lisansı görüntüleyicide belirtilir.</p>
          <p>{imageAtlas.coverage.groups.length} alt menünün tamamında bölgesel kaynak görseli vardır. {imageAtlas.coverage.catalog} kaydın {imageAtlas.coverage.mapped} tanesi yapısal olarak eşleştirilmiştir. Şematik bir kesit, sağ-sol tarafın birebir gösterimi anlamına gelmez. Komşu yapılar konum için görünebilir; seçilebilir Türkçe–Latince karşılıklar yalnızca ilgili alt menüye aittir. Ayrı gösterilmeyen yapılar açıkça belirtilir. Bu kapsam, eksiksiz bir tıp fakültesi atlası veya eğitmen onayı iddiası değildir; içerik müfredat kullanımı öncesinde bir anatomi eğitmeni tarafından değerlendirilmelidir.</p>
          <div className="source-links"><a href="https://github.com/openstax/osbooks-anatomy-physiology/tree/b0058a743bdd2cc08196abaaa7d5469970c0d80c" target="_blank" rel="noreferrer">OpenStax · Kaynak baskı ↗</a><a href="https://smart.servier.com/" target="_blank" rel="noreferrer">Servier Medical Art ↗</a><a href="/atlas/provenance.json" target="_blank" rel="noreferrer">Görsel kaynak ve lisans kaydı ↗</a></div>
        </section>

        <section>
          <h2>3D iskelette kaburga kıkırdakları</h2>
          <p>İskelet, kullanıcı tarafından sağlanan CT modelinin özgün kemik yüzeylerini kullanır. Kaynak dosyada kostal kıkırdak yüzeyleri bulunmaz; kaburga ile sternum arasındaki boşluklar tahmini geometrilerle doldurulmaz.</p>
          <div className="source-links"><a href="https://open.oregonstate.education/anatomy2e/chapter/thoracic-cage/" target="_blank" rel="noreferrer">OpenStax · The Thoracic Cage ↗</a></div>
        </section>

        <section>
          <h2>3D eklem atlasının kapsamı</h2>
          <p>Aynı BodyParts3D örneğinden alınan kemik, kostal kıkırdak ve omurlar arası diskler kullanılır. {jointModel.coverage.mapped}/{jointModel.coverage.catalog} eklem kaydı incelenebilir. Vurgu, kaynak temas konumlarının çevresindeki yüzeylerde yoğunlaşır ve uzaklaştıkça azalır; kemik gövdeleri doğal renginde kalır. Bu yaklaşık bölgesel vurgu, eklem kıkırdağının veya eklem yüzeylerinin kesin sınırlarını temsil etmez. Model yüzeyine tıklamak, o kemiğin tıklanan bölgesine en yakın eşleştirilmiş eklemi seçer. Odaklanma eklem çevresini yakınlaştırır; saydamlık, tek eklem, gizleme ve yüzey kesiti görünümleri bulunur. Bağ ve kapsül yüzeyleri kaynakta bulunmadığı için gösterilmez; sınıflama terimleri ve eşleştirilemeyen kayıtlar için vurgulama yapılmaz.</p>
          <div className="source-links">
            <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html" target="_blank" rel="noreferrer">BodyParts3D kaynak verisi ↗</a>
            <a href="/models/joints-provenance.json" target="_blank" rel="noreferrer">Eklem modeli kaynak kaydı ↗</a>
          </div>
        </section>

        <section>
          <h2>3D kas atlasının kapsamı</h2>
          <p>BodyParts3D kaynaklı model, {muscleModel.coverage.meshes} ayrı kas parçasıyla {muscleModel.coverage.mapped}/{muscleModel.coverage.catalog} kas kaydını temsil eder. Aynı model parçası, bütün-kas ve alt-parça kayıtlarında yer alabilir. Kaynakta bulunmayan yapılar için yaklaşık bir eşleştirme yapılmaz. Kesit görünümü bir yüzey kesitidir; doku içi ayrıntı veya cerrahi simülasyon içermez.</p>
          <p>BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. Kaynak OBJ geometrisi GLB biçimine dönüştürülmüş, basitleştirilmiş ve sıkıştırılmıştır. Modelin anatomik doğruluğu ve müfredat kapsamı bir anatomi eğitmeni tarafından ayrıca değerlendirilmelidir.</p>
          <div className="source-links">
            <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html" target="_blank" rel="noreferrer">BodyParts3D kaynak verisi ↗</a>
            <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noreferrer">Lisans ve atıf koşulları ↗</a>
            <a href="/models/muscles-provenance.json" target="_blank" rel="noreferrer">Model parça kimlikleri ve kaynak kaydı ↗</a>
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
