import type { AnatomyItem } from "./anatomy";

export type EtymologyPiece = {
  key: string;
  form: string;
  meaning: string;
  origin: "Latince" | "Yunanca" | "Anatomik terim";
  known: boolean;
};

export type EtymologyResult = {
  pieces: EtymologyPiece[];
  meaning: string;
  complete: boolean;
};

type Root = Omit<EtymologyPiece, "key" | "form" | "known">;
type RootPart = Root & { form: string };

const latin = (meaning: string): Root => ({ meaning, origin: "Latince" });
const greek = (meaning: string): Root => ({ meaning, origin: "Yunanca" });

// Yalnızca anlamı güvenle eşleştirilebilen, sık kullanılan anatomik biçimler.
// Yeni terimler geldikçe bu sözlük genişletilebilir; bilinmeyen sözcükler tahmin edilmez.
const wordRoots: Record<string, Root> = {
  musculus: latin("kas"),
  os: latin("kemik"),
  ossa: latin("kemikler"),
  articulatio: latin("eklem"),
  articulationes: latin("eklemler"),
  ligamentum: latin("bağ"),
  ligamenta: latin("bağlar"),
  nervus: latin("sinir"),
  nervi: latin("sinirler"),
  arteria: latin("atardamar"),
  arteriae: latin("atardamarlar"),
  vena: latin("toplardamar"),
  venae: latin("toplardamarlar"),
  glandula: latin("bez"),
  plexus: latin("ağ, örgü"),
  ganglion: greek("sinir düğümü"),
  caput: latin("baş"),
  corpus: latin("gövde"),
  collum: latin("boyun"),
  facies: latin("yüz"),
  pars: latin("bölüm"),
  ramus: latin("dal"),
  sulcus: latin("oluk"),
  fossa: latin("çukur"),
  foramen: latin("delik, açıklık"),
  canalis: latin("kanal"),
  cavitas: latin("boşluk"),
  processus: latin("çıkıntı"),
  tuberculum: latin("küçük çıkıntı"),
  condylus: greek("eklem çıkıntısı"),
  apex: latin("uç, tepe"),
  basis: greek("taban"),
  dexter: latin("sağ"), dextra: latin("sağ"), dextrum: latin("sağ"),
  sinister: latin("sol"), sinistra: latin("sol"), sinistrum: latin("sol"),
  anterior: latin("ön"), anterius: latin("önde"),
  posterior: latin("arka"), posterius: latin("arkada"),
  superior: latin("üst"), superius: latin("üstte"),
  inferior: latin("alt"), inferius: latin("altta"),
  medialis: latin("orta hatta yakın"),
  medianus: latin("ortadaki"),
  lateralis: latin("yan, dış taraftaki"),
  proximalis: latin("gövdeye yakın"),
  distalis: latin("gövdeden uzak"),
  internus: latin("iç"), interna: latin("iç"), internum: latin("iç"),
  externus: latin("dış"), externa: latin("dış"), externum: latin("dış"),
  superficialis: latin("yüzeysel"),
  profundus: latin("derin"),
  communis: latin("ortak"),
  major: latin("daha büyük"), maximus: latin("en büyük"),
  minor: latin("daha küçük"), minimus: latin("en küçük"),
  magnus: latin("büyük"), parvus: latin("küçük"),
  longus: latin("uzun"), longum: latin("uzun"), brevis: latin("kısa"),
  rectus: latin("düz"), obliquus: latin("eğik"), transversus: latin("enine"),
  circularis: latin("dairesel"),
  primus: latin("birinci"), secundus: latin("ikinci"), tertius: latin("üçüncü"),
  quartus: latin("dördüncü"), quintus: latin("beşinci"),
  frontalis: latin("alına ait"), frontale: latin("alına ait"),
  parietalis: latin("duvara/yan duvara ait"), parietale: latin("duvara/yan duvara ait"),
  temporalis: latin("şakak bölgesine ait"), temporale: latin("şakak bölgesine ait"),
  occipitalis: latin("başın arkasına ait"), occipitale: latin("başın arkasına ait"),
  nasalis: latin("buruna ait"), nasale: latin("buruna ait"),
  orbitalis: latin("göz çukuruna ait"),
  zygomaticum: greek("elmacık kemiğine ait"),
  palatinum: latin("damağa ait"), lacrimale: latin("gözyaşına ait"),
  mandibula: latin("alt çene"), maxilla: latin("üst çene"),
  vertebra: latin("omur"),
  cervicalis: latin("boyuna ait"),
  thoracica: greek("göğüs kafesine ait"), thoracicus: greek("göğüs kafesine ait"),
  lumbalis: latin("bele ait"), sacrum: latin("sakrum, kutsal kemik"),
  costa: latin("kaburga"), sternum: greek("göğüs kemiği"),
  clavicula: latin("köprücük kemiği; küçük anahtar"),
  scapula: latin("kürek kemiği"), humerus: latin("üst kol kemiği"),
  radius: latin("ışın; ön kol kemiği"), ulna: latin("dirsek kemiği"),
  carpi: latin("el bileğinin"), metacarpi: greek("el tarağının"), manus: latin("elin"),
  phalanx: greek("parmak kemiği dizisi"), coxae: latin("kalçanın"),
  femur: latin("uyluk kemiği"), femoris: latin("uyluğun"),
  patella: latin("diz kapağı; küçük tabak"),
  tibia: latin("kaval kemiği"), fibula: latin("kamış kemiği; toka"),
  tarsi: greek("ayak bileğinin"), metatarsi: greek("ayak tarağının"), pedis: latin("ayağın"),
  brachii: latin("kolun"), brachialis: latin("kola ait"),
  radialis: latin("radiusa/ışın kemiğine ait"),
  ulnaris: latin("ulnaya/dirsek kemiğine ait"),
  tibialis: latin("tibiaya/kaval kemiğine ait"),
  gluteus: greek("kalçaya ait"), pectoralis: latin("göğse ait"),
  abdominis: latin("karnın"), oculi: latin("gözün"), oris: latin("ağzın"),
  lingua: latin("dil"), lingualis: latin("dile ait"),
  cor: latin("kalp"), aorta: greek("aort"),
  pulmonalis: latin("akciğere ait"), pulmo: latin("akciğer"),
  trachea: greek("soluk borusu"), bronchus: greek("bronş"), bronchi: greek("bronşlar"),
  larynx: greek("gırtlak"), pharynx: greek("yutak"), oesophagus: greek("yemek borusu"),
  hepar: greek("karaciğer"), ventriculus: latin("mide; küçük karıncık"),
  pancreas: greek("pankreas; bütünüyle et"), lien: latin("dalak"),
  intestinum: latin("bağırsak"), tenue: latin("ince"), crassum: latin("kalın"),
  rectum: latin("düz"), ren: latin("böbrek"), renalis: latin("böbreğe ait"),
  ureter: greek("üreter"), vesica: latin("kese, mesane"), urinaria: latin("idrara ait"),
  urethra: greek("üretra"), ovarium: latin("yumurtalık"), uterina: latin("rahme ait"),
  uterus: latin("rahim"), vagina: latin("kılıf; vajina"), testis: latin("testis"),
  penis: latin("penis"), prostata: greek("önde duran; prostat"),
  hypophysis: greek("altta büyüme; hipofiz"), epiphysis: greek("üzerinde büyüme; epifiz"),
  thymus: greek("timus"), retina: latin("ağsı tabaka"), cochlea: latin("salyangoz"),
  cutis: latin("deri"), encephalon: greek("beyin; başın içindeki"),
  cerebrum: latin("büyük beyin"), cerebellum: latin("küçük beyin; beyincik"),
  medulla: latin("öz, ilik"), spinalis: latin("omurgaya ait"),
};

const compoundRoots: Record<string, RootPart[]> = {
  biceps: [{ form: "Bi", ...latin("iki") }, { form: "ceps", ...latin("başlı; caput ‘baş’ kökünden") }],
  triceps: [{ form: "Tri", ...latin("üç") }, { form: "ceps", ...latin("başlı; caput ‘baş’ kökünden") }],
  quadriceps: [{ form: "Quadri", ...latin("dört") }, { form: "ceps", ...latin("başlı; caput ‘baş’ kökünden") }],
  sternocleidomastoideus: [
    { form: "Sterno", ...greek("sternum, göğüs kemiği") },
    { form: "cleido", ...greek("klavikula, köprücük kemiği") },
    { form: "mastoideus", ...greek("meme biçimli mastoid çıkıntı") },
  ],
  brachioradialis: [{ form: "Brachio", ...latin("kol") }, { form: "radialis", ...latin("radiusa/ışın kemiğine ait") }],
  gastrocnemius: [{ form: "Gastro", ...greek("karın, şişkin bölüm") }, { form: "cnemius", ...greek("baldıra ait") }],
  intercostalis: [{ form: "Inter", ...latin("arasında") }, { form: "costalis", ...latin("kaburgaya ait") }],
  intervertebralis: [{ form: "Inter", ...latin("arasında") }, { form: "vertebralis", ...latin("omurlara ait") }],
  intervertebrales: [{ form: "Inter", ...latin("arasında") }, { form: "vertebrales", ...latin("omurlara ait") }],
  suprarenalis: [{ form: "Supra", ...latin("üstünde") }, { form: "renalis", ...latin("böbreğe ait") }],
  subclavia: [{ form: "Sub", ...latin("altında") }, { form: "clavia", ...latin("köprücük kemiğine ait") }],
  temporomandibularis: [{ form: "Temporo", ...latin("şakak kemiği") }, { form: "mandibularis", ...latin("alt çeneye ait") }],
  atlantooccipitalis: [{ form: "Atlanto", ...greek("atlas omuru") }, { form: "occipitalis", ...latin("başın arkasına ait") }],
  atlantoaxialis: [{ form: "Atlanto", ...greek("atlas omuru") }, { form: "axialis", ...latin("axis omuruna ait") }],
  sternoclavicularis: [{ form: "Sterno", ...greek("göğüs kemiği") }, { form: "clavicularis", ...latin("köprücük kemiğine ait") }],
  acromioclavicularis: [{ form: "Acromio", ...greek("omuzun en yüksek çıkıntısı") }, { form: "clavicularis", ...latin("köprücük kemiğine ait") }],
  sacroiliaca: [{ form: "Sacro", ...latin("sakruma ait") }, { form: "iliaca", ...latin("ilium/kalça kemiğine ait") }],
  tibiofibularis: [{ form: "Tibio", ...latin("tibia, kaval kemiği") }, { form: "fibularis", ...latin("fibula, kamış kemiğine ait") }],
  radiocarpalis: [{ form: "Radio", ...latin("radius, ışın kemiği") }, { form: "carpalis", ...greek("el bileğine ait") }],
};

const normalize = (value: string) =>
  value
    .toLocaleLowerCase("la")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");

export function analyzeEtymology(item: AnatomyItem): EtymologyResult {
  const words = item.latin.match(/[A-Za-zÀ-ž]+|\d+/g) ?? [item.latin];
  const pieces: EtymologyPiece[] = [];

  words.forEach((word, wordIndex) => {
    const normalized = normalize(word);
    const compound = compoundRoots[normalized];

    if (compound) {
      compound.forEach((part, partIndex) => {
        pieces.push({ ...part, key: `${wordIndex}-${partIndex}`, known: true });
      });
      return;
    }

    const root = wordRoots[normalized];
    pieces.push({
      key: `${wordIndex}-0`,
      form: word,
      meaning: root?.meaning ?? (/^\d+$/.test(word) ? `${word}. sıra/numara` : "özel anatomik ad"),
      origin: root?.origin ?? "Anatomik terim",
      known: Boolean(root) || /^\d+$/.test(word),
    });
  });

  return {
    pieces,
    meaning: item.turkish,
    complete: pieces.every((piece) => piece.known),
  };
}
