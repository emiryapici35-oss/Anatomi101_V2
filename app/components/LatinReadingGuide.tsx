"use client";

import { useEffect, useState } from "react";
import Icon from "./Icons";

type Section = "sesler" | "birlesimler" | "vurgu" | "pratik";
type Props = { open: boolean; onClose: () => void };

const vowels = [
  ["a", "a", "scapula → skapula"], ["e", "e", "femur → femur"],
  ["i", "i", "tibia → tibia"], ["o", "o", "costa → kosta"],
  ["u", "u", "ulna → ulna"], ["y", "i/ü arası", "hypophysis → hipofizis"],
];

const combinations = [
  ["ae, oe", "çoğunlukla e", "vertebrae → vertebre; oesophagus → ezofagus"],
  ["c + e/i/ae/oe/y", "s", "cervix → serviks; caecum → sekum"],
  ["c + a/o/u veya ünsüz", "k", "costa → kosta; clavicula → klavikula"],
  ["ch", "k", "bronchus → bronkus"],
  ["ph", "f", "pharynx → farinks"],
  ["th", "t", "thorax → toraks"],
  ["rh", "r", "rhaphe → rafe"],
  ["qu", "kv", "quadriceps → kvadriseps"],
  ["x", "ks", "flexor → fleksor"],
  ["ngu + ünlü", "ngv", "lingua → lingva"],
  ["ti + ünlü", "çoğunlukla tsi", "articulatio → artikulatsio"],
  ["s/t/x + ti + ünlü", "ti korunur", "ostium → ostium"],
];

const practice = [
  ["Musculus sternocleidomastoideus", "muskulus sternokleidomastoideus", "sternum + clavicula + mastoid"],
  ["Articulatio temporomandibularis", "artikulatsio temporomandibularis", "şakak–alt çene eklemi"],
  ["Nervus glossopharyngeus", "nervus glossofaringeus", "dil–yutak siniri"],
  ["Arteria brachiocephalica", "arteria brakiosefalika", "kol–başla ilişkili arter"],
  ["Musculus quadratus lumborum", "muskulus kvadratus lumborum", "kare bel kası"],
  ["Foramen intervertebrale", "foramen intervertebrale", "omurlar arası delik"],
  ["Vagina tendinis musculi", "vagina tendinis muskuli", "kas tendonunun kılıfı"],
  ["Facies articularis", "fasies artikularis", "eklem yüzü"],
];

export default function LatinReadingGuide({ open, onClose }: Props) {
  const [section, setSection] = useState<Section>("sesler");
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);
  if (!open) return null;

  return <div className="latin-overlay" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target) onClose(); }}>
    <section className="latin-guide" role="dialog" aria-modal="true" aria-labelledby="latin-guide-title">
      <header className="latin-guide-head">
        <div><span className="eyebrow">ANATOMİ 101 · DİL REHBERİ</span><h2 id="latin-guide-title">Latince okuma kuralları</h2><p>Türkiye’de anatomi eğitiminde yaygın kullanılan tıbbi Latince söyleyişe göre.</p></div>
        <button onClick={onClose} aria-label="Latince rehberini kapat"><Icon name="close" size={20}/></button>
      </header>
      <div className="latin-guide-body">
        <nav className="latin-guide-tabs" aria-label="Latince okuma bölümleri">
          <button className={section === "sesler" ? "active" : ""} onClick={() => setSection("sesler")}>Sesler</button>
          <button className={section === "birlesimler" ? "active" : ""} onClick={() => setSection("birlesimler")}>Harf birleşimleri</button>
          <button className={section === "vurgu" ? "active" : ""} onClick={() => setSection("vurgu")}>Hece & vurgu</button>
          <button className={section === "pratik" ? "active" : ""} onClick={() => setSection("pratik")}>Anatomi pratiği</button>
        </nav>
        <article className="latin-guide-content">
          {section === "sesler" && <>
            <div className="guide-callout"><Icon name="book" size={21}/><p><strong>Önce temel:</strong> Latince yazıldığı gibi okunmaya yakındır; her ünlü ayrı ve belirgin söylenir. Türkçe tıp kullanımında bazı kelimeler geleneksel biçimde Türkçeleşmiştir.</p></div>
            <h3>Ünlüler</h3><div className="pronunciation-grid">{vowels.map(([letters, sound, example]) => <div key={letters}><b>{letters}</b><span>{sound}</span><small>{example}</small></div>)}</div>
            <h3>Temel ünsüzler</h3><div className="rule-list">
              <p><b>j</b><span>Genellikle “y” okunur: <i>jejunum → yeyunum</i>.</span></p>
              <p><b>v</b><span>Tıbbi kullanımda “v” okunur: <i>vena → vena</i>.</span></p>
              <p><b>r</b><span>Türkçedeki gibi titreşimli söylenir: <i>radius</i>.</span></p>
              <p><b>s</b><span>Genellikle “s”; iki ünlü arasında bazı geleneklerde “z” duyulabilir.</span></p>
            </div>
          </>}
          {section === "birlesimler" && <>
            <div className="guide-callout warning"><Icon name="spark" size={21}/><p><strong>Önemli:</strong> Klasik, kilise ve ülkeden ülkeye tıbbi telaffuz farklıdır. Aşağıdaki tablo Türkiye’de derslerde duyacağın yaygın biçimi gösterir.</p></div>
            <div className="latin-rule-table"><div className="table-head"><b>Yazım</b><b>Okunuş</b><b>Örnek</b></div>{combinations.map(([letters, sound, example]) => <div key={letters}><strong>{letters}</strong><span>{sound}</span><small>{example}</small></div>)}</div>
          </>}
          {section === "vurgu" && <>
            <h3>Heceleme</h3>
            <ol className="stress-steps">
              <li><b>Her hecede bir ünlü çekirdeği vardır.</b><span>İki ünlü diftong değilse ayrılır: <i>ti-bi-a</i>.</span></li>
              <li><b>Tek ünsüz çoğunlukla sonraki heceye geçer.</b><span><i>fe-mur, sca-pu-la</i></span></li>
              <li><b>İki ünsüz genellikle ayrılır.</b><span><i>ver-te-bra</i>; ancak <i>br, tr, cl</i> gibi kümeler birlikte kalabilir.</span></li>
            </ol>
            <h3>Vurgu</h3>
            <div className="stress-cards"><div><b>2 heceli kelime</b><p>Vurgu ilk hecededir: <i>CÓR-pus, NÉR-vus</i>.</p></div><div><b>3+ heceli kelime</b><p>Sondan bir önceki hece uzunsa orası; kısaysa sondan üçüncü hece vurgulanır.</p></div></div>
            <p className="guide-note">Uzunluk her zaman yazımdan anlaşılmaz. Güvenilir sözlükte makron (ā) veya vurgu işareti kontrol edilmelidir. Anatomi sınavında öğretim üyesinin yerel telaffuz standardı önceliklidir.</p>
            <h3>Sık görülen son ekler</h3><div className="suffix-grid"><span><b>-alis / -aris</b> ilgili</span><span><b>-icus</b> ait</span><span><b>-ideus</b> biçiminde</span><span><b>-formis</b> şeklinde</span><span><b>-itis</b> iltihap</span><span><b>-osis</b> durum/süreç</span></div>
          </>}
          {section === "pratik" && <>
            <div className="practice-intro"><h3>Terimi parçala, sonra oku</h3><p>Uzun kelimeleri tek nefeste ezberleme. Kökleri bul, hecele ve anlamla eşleştir.</p></div>
            <div className="practice-list">{practice.map(([term, reading, meaning], index) => <div key={term}><span>{String(index + 1).padStart(2, "0")}</span><p><strong>{term}</strong><em>{reading}</em><small>{meaning}</small></p></div>)}</div>
            <div className="guide-callout"><Icon name="spark" size={21}/><p><strong>30 saniyelik yöntem:</strong> Terimi gör → kökleri ayır → yüksek sesle oku → Türkçesini söyle → menüde arat. Aynı terimi 1, 3 ve 7 gün sonra yeniden çağır.</p></div>
          </>}
        </article>
      </div>
      <footer className="latin-guide-foot"><span>Okunuşlar fonetik kolaylık için Türkçe harflerle yaklaşık gösterilmiştir.</span><button onClick={onClose}>Çalışmaya dön</button></footer>
    </section>
  </div>;
}
