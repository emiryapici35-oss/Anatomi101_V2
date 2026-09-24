/*
 * Anatomi 101 genişletilmiş öğretim kataloğu.
 *
 * Sayım notu: Kas sayısı kaynaklar arasında; kasın iki tarafının, başlarının ve
 * segmentlerinin ayrı sayılıp sayılmamasına göre değişir. Bu katalog tarafı belli
 * anatomik birimleri ayrı soru birimi yapar. Terimler bölgesel tıp eğitimi
 * başlıklarına ayrılmıştır; uygulamadaki 206 kemik kataloğunu tamamlar.
 */

type Category = "joints" | "muscles" | "nervous" | "circulatory" | "respiratory" | "digestive" | "urinary" | "genital" | "endocrine" | "sensory";
type Accent = "coral" | "blue" | "mint";

export type ExpandedAnatomyItem = {
  id: string;
  latin: string;
  turkish: string;
  category: Category;
  group: string;
  note: string;
  accent: Accent;
  aliases: string[];
  x: number;
  y: number;
};

const accents: Record<Category, Accent> = {
  joints: "blue", muscles: "mint", nervous: "mint", circulatory: "coral",
  respiratory: "mint", digestive: "coral", urinary: "blue", genital: "coral",
  endocrine: "mint", sensory: "blue",
};

const slug = (value: string) => value
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const sideAdjective = (latin: string, left: boolean) => {
  const first = latin.trim().split(/\s+/)[0].toLocaleLowerCase("la");
  if (["articulationes", "arteriae", "venae", "glandulae", "cellulae", "fimbriae"].includes(first)) return left ? "sinistrae" : "dextrae";
  if (["musculi", "nervi", "bronchi", "ductuli", "tubuli"].includes(first)) return left ? "sinistri" : "dextri";
  if (["os", "corpus", "ligamentum", "ovarium", "atrium", "septum", "crus", "labium", "ganglion", "organum", "vestibulum"].includes(first)) return left ? "sinistrum" : "dextrum";
  if (["articulatio", "arteria", "vena", "glandula", "tuba", "pleura", "auricula", "retina", "cochlea", "capsula", "chorda", "amygdala", "insula", "radix", "pars", "phalanx"].includes(first)) return left ? "sinistra" : "dextra";
  return left ? "sinister" : "dexter";
};

const parse = (text: string) => text.trim().split("\n").map(line => {
  const [latin, turkish, alias = ""] = line.split("|").map(value => value.trim());
  return { latin, turkish, aliases: alias ? alias.split(",").map(value => value.trim()) : [] };
});

const singles = (category: Category, group: string, text: string, position: [number, number] = [50, 45]): ExpandedAnatomyItem[] =>
  parse(text).map(({ latin, turkish, aliases }, index) => ({
    id: `atlas-${category}-${slug(latin)}-${index + 1}`,
    latin, turkish, category, group,
    note: `${turkish}; ${group} başlığı altında, tıp fakültesi düzeyinde bölgesel anatomi ile birlikte çalışılır.`,
    accent: accents[category], aliases, x: position[0], y: position[1],
  }));

const paired = (category: Category, group: string, text: string, position: [number, number] = [43, 45]): ExpandedAnatomyItem[] =>
  parse(text).flatMap(({ latin, turkish, aliases }, index) => ([
    {
      id: `atlas-${category}-${slug(latin)}-dexter-${index + 1}`,
      latin: `${latin} ${sideAdjective(latin, false)}`, turkish: `Sağ ${turkish}`, category, group,
      note: `Sağ ${turkish}; ${group} içinde karşı taraf eşiyle birlikte değerlendirilir.`,
      accent: accents[category], aliases, x: position[0], y: position[1],
    },
    {
      id: `atlas-${category}-${slug(latin)}-sinister-${index + 1}`,
      latin: `${latin} ${sideAdjective(latin, true)}`, turkish: `Sol ${turkish}`, category, group,
      note: `Sol ${turkish}; ${group} içinde karşı taraf eşiyle birlikte değerlendirilir.`,
      accent: accents[category], aliases, x: 100 - position[0], y: position[1],
    },
  ]));

const numberedPairs = (category: Category, group: string, latin: string, turkish: string, count: number, position: [number, number]): ExpandedAnatomyItem[] =>
  Array.from({ length: count }, (_, index) => `${latin} ${index + 1}|${turkish} ${index + 1}`).flatMap(row => paired(category, group, row, position));

const muscles: ExpandedAnatomyItem[] = [
  ...paired("muscles", "Baş · Mimik kasları", `
Musculus occipitofrontalis, venter frontalis|Oksipitofrontal kasın frontal karnı|alın kası
Musculus occipitofrontalis, venter occipitalis|Oksipitofrontal kasın oksipital karnı
Musculus temporoparietalis|Temporoparyetal kas
Musculus procerus|Proserus kası
Musculus nasalis, pars transversa|Nazal kasın transvers parçası
Musculus nasalis, pars alaris|Nazal kasın alar parçası
Musculus depressor septi nasi|Nazal septumu aşağı çeken kas
Musculus orbicularis oculi, pars orbitalis|Göz çevresi kasının orbital parçası
Musculus orbicularis oculi, pars palpebralis|Göz çevresi kasının palpebral parçası
Musculus corrugator supercilii|Kaş çatma kası
Musculus depressor supercilii|Kaşı aşağı çeken kas
Musculus auricularis anterior|Ön kulak kası
Musculus auricularis superior|Üst kulak kası
Musculus auricularis posterior|Arka kulak kası
Musculus orbicularis oris|Ağız çevresi kası
Musculus buccinator|Buccinator kası|yanak kası
Musculus levator labii superioris|Üst dudağı kaldıran kas
Musculus levator labii superioris alaeque nasi|Üst dudak ve burun kanadını kaldıran kas
Musculus zygomaticus major|Büyük zigomatik kas
Musculus zygomaticus minor|Küçük zigomatik kas
Musculus levator anguli oris|Ağız köşesini kaldıran kas
Musculus risorius|Risorius kası
Musculus depressor anguli oris|Ağız köşesini aşağı çeken kas
Musculus depressor labii inferioris|Alt dudağı aşağı çeken kas
Musculus mentalis|Mentalis kası|çene ucu kası
Musculus platysma|Platisma kası` , [46, 17]),

  ...paired("muscles", "Baş · Çiğneme ve göz kasları", `
Musculus temporalis|Temporal kas
Musculus masseter, pars superficialis|Masseter kasının yüzeyel parçası
Musculus masseter, pars profunda|Masseter kasının derin parçası
Musculus pterygoideus medialis|İç pterigoid kas
Musculus pterygoideus lateralis, caput superius|Dış pterigoid kasın üst başı
Musculus pterygoideus lateralis, caput inferius|Dış pterigoid kasın alt başı
Musculus levator palpebrae superioris|Üst göz kapağını kaldıran kas
Musculus rectus superior|Üst rektus kası
Musculus rectus inferior|Alt rektus kası
Musculus rectus medialis|İç rektus kası
Musculus rectus lateralis|Dış rektus kası
Musculus obliquus superior|Üst oblik kas
Musculus obliquus inferior|Alt oblik kas
Musculus orbitalis|Orbitalis kası`, [46, 16]),

  ...paired("muscles", "Baş · Dil, damak ve yutak", `
Musculus genioglossus|Genioglossus kası
Musculus hyoglossus|Hyoglossus kası
Musculus styloglossus|Styloglossus kası
Musculus palatoglossus|Palatoglossus kası
Musculus longitudinalis superior linguae|Dilin üst longitudinal kası
Musculus longitudinalis inferior linguae|Dilin alt longitudinal kası
Musculus transversus linguae|Dilin transvers kası
Musculus verticalis linguae|Dilin vertikal kası
Musculus tensor veli palatini|Yumuşak damak gerici kası
Musculus levator veli palatini|Yumuşak damak kaldırıcı kası
Musculus uvulae|Uvula kası
Musculus palatopharyngeus|Palatofaringeal kas
Musculus constrictor pharyngis superior|Üst farinks konstriktör kası
Musculus constrictor pharyngis medius|Orta farinks konstriktör kası
Musculus constrictor pharyngis inferior|Alt farinks konstriktör kası
Musculus stylopharyngeus|Stilofaringeal kas
Musculus salpingopharyngeus|Salpingofaringeal kas`, [47, 19]),

  ...paired("muscles", "Baş · Orta kulak ve larinks", `
Musculus tensor tympani|Kulak zarı gerici kası
Musculus stapedius|Stapes kası
Musculus cricothyroideus|Krikotiroid kas
Musculus cricoarytenoideus posterior|Arka krikoaritenoid kas
Musculus cricoarytenoideus lateralis|Dış krikoaritenoid kas
Musculus arytenoideus transversus|Transvers aritenoid kas
Musculus arytenoideus obliquus|Oblik aritenoid kas
Musculus thyroarytenoideus|Tiroaritenoid kas
Musculus vocalis|Vokal kas
Musculus aryepiglotticus|Ariepiglottik kas
Musculus thyroepiglotticus|Tiroepiglottik kas`, [47, 20]),

  ...paired("muscles", "Boyun · Suprahyoid ve infrahyoid", `
Musculus digastricus, venter anterior|Digastrik kasın ön karnı
Musculus digastricus, venter posterior|Digastrik kasın arka karnı
Musculus stylohyoideus|Stilohyoid kas
Musculus mylohyoideus|Milohyoid kas
Musculus geniohyoideus|Geniohyoid kas
Musculus sternohyoideus|Sternohyoid kas
Musculus omohyoideus, venter superior|Omohyoid kasın üst karnı
Musculus omohyoideus, venter inferior|Omohyoid kasın alt karnı
Musculus sternothyroideus|Sternotiroid kas
Musculus thyrohyoideus|Tirohyoid kas`, [47, 21]),

  ...paired("muscles", "Boyun · Yüzeyel, lateral ve prevertebral", `
Musculus sternocleidomastoideus, caput sternalis|Sternokleidomastoid kasın sternal başı
Musculus sternocleidomastoideus, caput clavicularis|Sternokleidomastoid kasın klavikular başı
Musculus scalenus anterior|Ön skalen kas
Musculus scalenus medius|Orta skalen kas
Musculus scalenus posterior|Arka skalen kas
Musculus scalenus minimus|En küçük skalen kas
Musculus longus colli, pars obliqua superior|Longus colli kasının üst oblik parçası
Musculus longus colli, pars obliqua inferior|Longus colli kasının alt oblik parçası
Musculus longus colli, pars recta|Longus colli kasının düz parçası
Musculus longus capitis|Longus capitis kası
Musculus rectus capitis anterior|Ön rektus capitis kası
Musculus rectus capitis lateralis|Lateral rektus capitis kası`, [47, 22]),

  ...paired("muscles", "Sırt · Yüzeyel ve orta tabaka", `
Musculus trapezius, pars descendens|Trapez kasının inen parçası
Musculus trapezius, pars transversa|Trapez kasının transvers parçası
Musculus trapezius, pars ascendens|Trapez kasının çıkan parçası
Musculus latissimus dorsi|Geniş sırt kası
Musculus levator scapulae|Skapula kaldırıcı kas
Musculus rhomboideus minor|Küçük romboid kas
Musculus rhomboideus major|Büyük romboid kas
Musculus serratus posterior superior|Üst arka testere kası
Musculus serratus posterior inferior|Alt arka testere kası`, [43, 31]),

  ...paired("muscles", "Sırt · Ense ve transversospinal grup", `
Musculus splenius capitis|Splenius capitis kası
Musculus splenius cervicis|Splenius cervicis kası
Musculus semispinalis capitis|Semispinalis capitis kası
Musculus semispinalis cervicis|Semispinalis cervicis kası
Musculus semispinalis thoracis|Semispinalis thoracis kası
Musculus multifidus cervicalis|Servikal multifidus kası
Musculus multifidus thoracis|Torakal multifidus kası
Musculus multifidus lumborum|Lumbal multifidus kası
Musculi rotatores cervicis breves|Kısa servikal rotator kaslar
Musculi rotatores cervicis longi|Uzun servikal rotator kaslar
Musculi rotatores thoracis breves|Kısa torakal rotator kaslar
Musculi rotatores thoracis longi|Uzun torakal rotator kaslar
Musculi rotatores lumborum breves|Kısa lumbal rotator kaslar
Musculi rotatores lumborum longi|Uzun lumbal rotator kaslar`, [45, 35]),

  ...paired("muscles", "Sırt · Erector spinae ve segmental kaslar", `
Musculus iliocostalis lumborum|İliocostalis lumborum kası
Musculus iliocostalis thoracis|İliocostalis thoracis kası
Musculus iliocostalis cervicis|İliocostalis cervicis kası
Musculus longissimus thoracis|Longissimus thoracis kası
Musculus longissimus cervicis|Longissimus cervicis kası
Musculus longissimus capitis|Longissimus capitis kası
Musculus spinalis thoracis|Spinalis thoracis kası
Musculus spinalis cervicis|Spinalis cervicis kası
Musculus spinalis capitis|Spinalis capitis kası
Musculi interspinales cervicis|Servikal interspinal kaslar
Musculi interspinales thoracis|Torakal interspinal kaslar
Musculi interspinales lumborum|Lumbal interspinal kaslar
Musculi intertransversarii anteriores cervicis|Ön servikal intertransvers kaslar
Musculi intertransversarii posteriores cervicis|Arka servikal intertransvers kaslar
Musculi intertransversarii mediales lumborum|Medial lumbal intertransvers kaslar
Musculi intertransversarii laterales lumborum|Lateral lumbal intertransvers kaslar
Musculi levatores costarum breves|Kısa kaburga kaldırıcı kaslar
Musculi levatores costarum longi|Uzun kaburga kaldırıcı kaslar`, [45, 40]),

  ...paired("muscles", "Ense · Suboksipital kaslar", `
Musculus rectus capitis posterior major|Büyük arka rektus capitis kası
Musculus rectus capitis posterior minor|Küçük arka rektus capitis kası
Musculus obliquus capitis superior|Üst oblik capitis kası
Musculus obliquus capitis inferior|Alt oblik capitis kası`, [47, 20]),

  ...paired("muscles", "Toraks · Göğüs duvarı ve solunum", `
Musculus pectoralis major, pars clavicularis|Büyük göğüs kasının klavikular parçası
Musculus pectoralis major, pars sternocostalis|Büyük göğüs kasının sternokostal parçası
Musculus pectoralis major, pars abdominalis|Büyük göğüs kasının abdominal parçası
Musculus pectoralis minor|Küçük göğüs kası
Musculus subclavius|Subklavius kası
Musculus serratus anterior|Ön testere kası
Musculi intercostales externi|Dış interkostal kaslar
Musculi intercostales interni|İç interkostal kaslar
Musculi intercostales intimi|En iç interkostal kaslar
Musculi subcostales|Subkostal kaslar
Musculus transversus thoracis|Transversus thoracis kası
Musculus diaphragma, pars sternalis|Diyaframın sternal parçası
Musculus diaphragma, pars costalis|Diyaframın kostal parçası
Musculus diaphragma, pars lumbalis|Diyaframın lumbal parçası`, [43, 35]),

  ...paired("muscles", "Karın duvarı ve posterior abdomen", `
Musculus obliquus externus abdominis|Dış oblik karın kası
Musculus obliquus internus abdominis|İç oblik karın kası
Musculus transversus abdominis|Transvers karın kası
Musculus rectus abdominis|Düz karın kası
Musculus pyramidalis|Piramidalis kası
Musculus quadratus lumborum|Kare bel kası
Musculus psoas major|Büyük psoas kası
Musculus psoas minor|Küçük psoas kası
Musculus iliacus|İliakus kası`, [44, 47]),

  ...paired("muscles", "Pelvis ve perine", `
Musculus piriformis|Piriformis kası
Musculus obturatorius internus|İç obturator kas
Musculus levator ani, pars puborectalis|Levator ani kasının puborektal parçası
Musculus levator ani, pars pubococcygea|Levator ani kasının pubokoksigeal parçası
Musculus levator ani, pars iliococcygea|Levator ani kasının iliokoksigeal parçası
Musculus coccygeus|Koksigeus kası
Musculus transversus perinei superficialis|Yüzeyel transvers perine kası
Musculus transversus perinei profundus|Derin transvers perine kası
Musculus ischiocavernosus|İskiokavernoz kas
Musculus bulbospongiosus|Bulbospongioz kas
Musculus sphincter ani externus|Dış anal sfinkter
Musculus sphincter urethrae externus|Dış üretral sfinkter
Musculus compressor urethrae|Üretra kompresör kası
Musculus sphincter urethrovaginalis|Üretrovajinal sfinkter`, [46, 59]),

  ...paired("muscles", "Omuz ve skapulohumeral kaslar", `
Musculus deltoideus, pars clavicularis|Deltoid kasın klavikular parçası
Musculus deltoideus, pars acromialis|Deltoid kasın akromial parçası
Musculus deltoideus, pars spinalis|Deltoid kasın spinal parçası
Musculus supraspinatus|Supraspinatus kası
Musculus infraspinatus|İnfraspinatus kası
Musculus teres minor|Küçük yuvarlak kas
Musculus subscapularis|Subskapular kas
Musculus teres major|Büyük yuvarlak kas`, [36, 28]),

  ...paired("muscles", "Kol kasları", `
Musculus biceps brachii, caput longum|Biseps brachii kasının uzun başı
Musculus biceps brachii, caput breve|Biseps brachii kasının kısa başı
Musculus coracobrachialis|Korakobrakialis kası
Musculus brachialis|Brakialis kası
Musculus triceps brachii, caput longum|Triseps brachii kasının uzun başı
Musculus triceps brachii, caput laterale|Triseps brachii kasının lateral başı
Musculus triceps brachii, caput mediale|Triseps brachii kasının medial başı
Musculus anconeus|Ankoneus kası`, [34, 38]),

  ...paired("muscles", "Ön kol · Fleksör-pronator grup", `
Musculus pronator teres, caput humerale|Pronator teres kasının humeral başı
Musculus pronator teres, caput ulnare|Pronator teres kasının ulnar başı
Musculus flexor carpi radialis|Radial el bileği fleksörü
Musculus palmaris longus|Uzun palmar kas
Musculus flexor carpi ulnaris, caput humerale|Ulnar el bileği fleksörünün humeral başı
Musculus flexor carpi ulnaris, caput ulnare|Ulnar el bileği fleksörünün ulnar başı
Musculus flexor digitorum superficialis, caput humeroulnare|Yüzeyel parmak fleksörünün humeroulnar başı
Musculus flexor digitorum superficialis, caput radiale|Yüzeyel parmak fleksörünün radial başı
Musculus flexor digitorum profundus|Derin parmak fleksörü
Musculus flexor pollicis longus|Uzun başparmak fleksörü
Musculus pronator quadratus|Kare pronator kas`, [31, 45]),

  ...paired("muscles", "Ön kol · Ekstansör-supinator grup", `
Musculus brachioradialis|Brakiyoradialis kası
Musculus extensor carpi radialis longus|Uzun radial el bileği ekstansörü
Musculus extensor carpi radialis brevis|Kısa radial el bileği ekstansörü
Musculus extensor digitorum|Parmak ekstansörü
Musculus extensor digiti minimi|Küçük parmak ekstansörü
Musculus extensor carpi ulnaris|Ulnar el bileği ekstansörü
Musculus supinator|Supinator kas
Musculus abductor pollicis longus|Uzun başparmak abdüktörü
Musculus extensor pollicis brevis|Kısa başparmak ekstansörü
Musculus extensor pollicis longus|Uzun başparmak ekstansörü
Musculus extensor indicis|İşaret parmağı ekstansörü`, [31, 45]),

  ...paired("muscles", "El · Thenar, hypothenar ve orta kompartıman", `
Musculus abductor pollicis brevis|Kısa başparmak abdüktörü
Musculus flexor pollicis brevis, caput superficiale|Kısa başparmak fleksörünün yüzeyel başı
Musculus flexor pollicis brevis, caput profundum|Kısa başparmak fleksörünün derin başı
Musculus opponens pollicis|Başparmak opponens kası
Musculus adductor pollicis, caput obliquum|Başparmak addüktörünün oblik başı
Musculus adductor pollicis, caput transversum|Başparmak addüktörünün transvers başı
Musculus palmaris brevis|Kısa palmar kas
Musculus abductor digiti minimi manus|El küçük parmak abdüktörü
Musculus flexor digiti minimi brevis manus|El küçük parmak kısa fleksörü
Musculus opponens digiti minimi|Küçük parmak opponens kası
Musculus lumbricalis primus manus|El birinci lumbrikal kası
Musculus lumbricalis secundus manus|El ikinci lumbrikal kası
Musculus lumbricalis tertius manus|El üçüncü lumbrikal kası
Musculus lumbricalis quartus manus|El dördüncü lumbrikal kası
Musculus interosseus palmaris primus|Birinci palmar interosseöz kas
Musculus interosseus palmaris secundus|İkinci palmar interosseöz kas
Musculus interosseus palmaris tertius|Üçüncü palmar interosseöz kas
Musculus interosseus dorsalis primus manus|El birinci dorsal interosseöz kası
Musculus interosseus dorsalis secundus manus|El ikinci dorsal interosseöz kası
Musculus interosseus dorsalis tertius manus|El üçüncü dorsal interosseöz kası
Musculus interosseus dorsalis quartus manus|El dördüncü dorsal interosseöz kası`, [28, 53]),

  ...paired("muscles", "Kalça ve derin gluteal bölge", `
Musculus gluteus maximus|Büyük gluteal kas
Musculus gluteus medius|Orta gluteal kas
Musculus gluteus minimus|Küçük gluteal kas
Musculus tensor fasciae latae|Fasya lata gerici kası
Musculus obturatorius externus|Dış obturator kas
Musculus gemellus superior|Üst gemellus kası
Musculus gemellus inferior|Alt gemellus kası
Musculus quadratus femoris|Kare femoral kas`, [43, 59]),

  ...paired("muscles", "Uyluk · Ön, medial ve arka kompartıman", `
Musculus sartorius|Sartorius kası|terzi kası
Musculus rectus femoris|Düz femoral kas
Musculus vastus lateralis|Dış vastus kası
Musculus vastus medialis|İç vastus kası
Musculus vastus intermedius|Ara vastus kası
Musculus articularis genus|Diz artiküler kası
Musculus pectineus|Pektineus kası
Musculus adductor longus|Uzun addüktör kas
Musculus adductor brevis|Kısa addüktör kas
Musculus adductor magnus, pars adductoria|Büyük addüktörün addüktör parçası
Musculus adductor magnus, pars hamstring|Büyük addüktörün hamstring parçası
Musculus gracilis|Grasilis kası
Musculus biceps femoris, caput longum|Biseps femoris kasının uzun başı
Musculus biceps femoris, caput breve|Biseps femoris kasının kısa başı
Musculus semitendinosus|Semitendinozus kası
Musculus semimembranosus|Semimembranozus kası`, [43, 67]),

  ...paired("muscles", "Bacak · Ön, lateral ve arka kompartıman", `
Musculus tibialis anterior|Ön tibial kas
Musculus extensor hallucis longus|Ayak başparmağı uzun ekstansörü
Musculus extensor digitorum longus|Uzun parmak ekstansörü
Musculus fibularis tertius|Üçüncü fibular kas
Musculus fibularis longus|Uzun fibular kas
Musculus fibularis brevis|Kısa fibular kas
Musculus gastrocnemius, caput mediale|Gastroknemius kasının medial başı
Musculus gastrocnemius, caput laterale|Gastroknemius kasının lateral başı
Musculus soleus|Soleus kası
Musculus plantaris|Plantaris kası
Musculus popliteus|Popliteus kası
Musculus tibialis posterior|Arka tibial kas
Musculus flexor hallucis longus|Ayak başparmağı uzun fleksörü
Musculus flexor digitorum longus|Uzun parmak fleksörü`, [43, 82]),

  ...paired("muscles", "Ayak · Dorsal ve plantar kaslar", `
Musculus extensor digitorum brevis|Kısa parmak ekstansörü
Musculus extensor hallucis brevis|Ayak başparmağı kısa ekstansörü
Musculus abductor hallucis|Ayak başparmağı abdüktörü
Musculus flexor digitorum brevis|Kısa parmak fleksörü
Musculus abductor digiti minimi pedis|Ayak küçük parmak abdüktörü
Musculus quadratus plantae|Kare taban kası
Musculus lumbricalis primus pedis|Ayak birinci lumbrikal kası
Musculus lumbricalis secundus pedis|Ayak ikinci lumbrikal kası
Musculus lumbricalis tertius pedis|Ayak üçüncü lumbrikal kası
Musculus lumbricalis quartus pedis|Ayak dördüncü lumbrikal kası
Musculus flexor hallucis brevis, caput mediale|Ayak başparmağı kısa fleksörünün medial başı
Musculus flexor hallucis brevis, caput laterale|Ayak başparmağı kısa fleksörünün lateral başı
Musculus adductor hallucis, caput obliquum|Ayak başparmağı addüktörünün oblik başı
Musculus adductor hallucis, caput transversum|Ayak başparmağı addüktörünün transvers başı
Musculus flexor digiti minimi brevis pedis|Ayak küçük parmak kısa fleksörü
Musculus interosseus plantaris primus|Birinci plantar interosseöz kas
Musculus interosseus plantaris secundus|İkinci plantar interosseöz kas
Musculus interosseus plantaris tertius|Üçüncü plantar interosseöz kas
Musculus interosseus dorsalis primus pedis|Ayak birinci dorsal interosseöz kası
Musculus interosseus dorsalis secundus pedis|Ayak ikinci dorsal interosseöz kası
Musculus interosseus dorsalis tertius pedis|Ayak üçüncü dorsal interosseöz kası
Musculus interosseus dorsalis quartus pedis|Ayak dördüncü dorsal interosseöz kası`, [42, 94]),
];

const joints: ExpandedAnatomyItem[] = [
  ...singles("joints", "Eklem bilimi · Yapısal sınıflama", `
Junctura fibrosa|Fibröz eklem
Sutura serrata|Testere dişli sütür
Sutura squamosa|Skuamöz sütür
Sutura plana|Düz sütür
Schindylesis|Şindilezis
Gomphosis|Gomfozis
Junctura cartilaginea|Kıkırdak eklem
Synchondrosis|Sinkondroz
Symphysis|Simfiz
Articulatio synovialis|Sinovyal eklem
Articulatio plana|Düz eklem
Ginglymus|Menteşe eklem
Articulatio trochoidea|Pivot eklem
Articulatio ellipsoidea|Elipsoid eklem
Articulatio sellaris|Eyer eklem
Articulatio spheroidea|Küresel eklem
Articulatio bicondylaris|Bikondiler eklem`, [50, 30]),
  ...singles("joints", "Kafatası sütürleri ve bağları", `
Sutura coronalis|Koronal sütür
Sutura sagittalis|Sagittal sütür
Sutura lambdoidea|Lambdoid sütür
Sutura squamosa|Skuamöz sütür
Sutura frontonasalis|Frontonazal sütür
Sutura internasalis|İnternazal sütür
Sutura nasomaxillaris|Nazomaksiller sütür
Sutura frontomaxillaris|Frontomaksiller sütür
Sutura zygomaticomaxillaris|Zigomatikomaksiller sütür
Sutura temporozygomatica|Temporozigomatik sütür
Sutura palatina mediana|Median palatin sütür
Sutura palatina transversa|Transvers palatin sütür
Fonticulus anterior|Ön fontanel
Fonticulus posterior|Arka fontanel`, [50, 16]),
  ...paired("joints", "Baş ve kraniyovertebral eklemler", `
Articulatio temporomandibularis|Temporomandibular eklem
Articulatio atlantooccipitalis|Atlanto-oksipital eklem
Articulatio atlantoaxialis lateralis|Lateral atlanto-aksiyal eklem`, [47, 20]),
  ...singles("joints", "Baş ve kraniyovertebral eklemler", `
Articulatio atlantoaxialis mediana|Median atlanto-aksiyal eklem
Ligamentum transversum atlantis|Atlasın transvers bağı
Ligamenta alaria|Alar bağlar
Membrana tectoria|Tektoryal membran`, [50, 21]),
  ...numberedPairs("joints", "Omurga · Zigapofizyal eklemler", "Articulatio zygapophysialis cervicalis", "Servikal faset eklemi", 7, [48, 27]),
  ...numberedPairs("joints", "Omurga · Zigapofizyal eklemler", "Articulatio zygapophysialis thoracica", "Torakal faset eklemi", 12, [48, 36]),
  ...numberedPairs("joints", "Omurga · Zigapofizyal eklemler", "Articulatio zygapophysialis lumbalis", "Lumbal faset eklemi", 5, [48, 48]),
  ...numberedPairs("joints", "Toraks · Kaburga eklemleri", "Articulatio capitis costae", "Kaburga başı eklemi", 12, [44, 34]),
  ...numberedPairs("joints", "Toraks · Kaburga eklemleri", "Articulatio costotransversaria", "Kostotransvers eklem", 10, [44, 34]),
  ...numberedPairs("joints", "Toraks · Kaburga eklemleri", "Articulatio sternocostalis", "Sternokostal eklem", 7, [46, 34]),
  ...paired("joints", "Omuz kuşağı ve omuz", `
Articulatio sternoclavicularis|Sternoklavikular eklem
Articulatio acromioclavicularis|Akromioklavikular eklem
Articulatio humeri|Glenohumeral eklem|omuz eklemi
Articulatio scapulothoracica functionalis|Fonksiyonel skapulotorasik eklem`, [37, 27]),
  ...paired("joints", "Dirsek ve ön kol", `
Articulatio humeroulnaris|Humeroulnar eklem
Articulatio humeroradialis|Humeroradial eklem
Articulatio radioulnaris proximalis|Proksimal radioulnar eklem
Articulatio radioulnaris distalis|Distal radioulnar eklem`, [33, 42]),
  ...paired("joints", "El bileği ve el", `
Articulatio radiocarpalis|Radiokarpal eklem
Articulatio mediocarpalis|Mediokarpal eklem
Articulationes intercarpales|İnterkarpal eklemler
Articulatio carpometacarpalis pollicis|Başparmak karpometakarpal eklemi
Articulationes carpometacarpales II-V|İkinci-beşinci karpometakarpal eklemler
Articulationes intermetacarpales|İntermetakarpal eklemler`, [29, 52]),
  ...numberedPairs("joints", "El · Parmak eklemleri", "Articulatio metacarpophalangea", "Metakarpofalangeal eklem", 5, [28, 55]),
  ...numberedPairs("joints", "El · Parmak eklemleri", "Articulatio interphalangea proximalis manus", "El proksimal interfalangeal eklemi", 4, [27, 57]),
  ...numberedPairs("joints", "El · Parmak eklemleri", "Articulatio interphalangea distalis manus", "El distal interfalangeal eklemi", 4, [27, 58]),
  ...paired("joints", "Pelvis ve kalça", `
Articulatio sacroiliaca|Sakroiliak eklem
Articulatio coxae|Kalça eklemi`, [45, 58]),
  ...singles("joints", "Pelvis ve kalça", `
Symphysis pubica|Pubik simfiz
Articulatio lumbosacralis|Lumbosakral eklem
Articulatio sacrococcygea|Sakrokoksigeal eklem`, [50, 57]),
  ...paired("joints", "Diz ve tibiofibular eklemler", `
Articulatio femorotibialis medialis|Medial femorotibial eklem
Articulatio femorotibialis lateralis|Lateral femorotibial eklem
Articulatio femoropatellaris|Femoropatellar eklem
Articulatio tibiofibularis|Proksimal tibiofibular eklem
Syndesmosis tibiofibularis|Distal tibiofibular sindezmoz`, [43, 77]),
  ...paired("joints", "Ayak bileği ve ayak", `
Articulatio talocruralis|Talokrural eklem|ayak bileği
Articulatio subtalaris|Subtalar eklem
Articulatio talocalcaneonavicularis|Talokalkaneonavikular eklem
Articulatio calcaneocuboidea|Kalkaneokuboid eklem
Articulatio tarsi transversa|Transvers tarsal eklem
Articulatio cuneonavicularis|Kuneonavikular eklem
Articulationes intercuneiformes|İnterkuneiform eklemler
Articulatio cuneocuboidea|Kuneokuboid eklem
Articulatio cuboideonavicularis|Kuboidonavikular eklem
Articulationes tarsometatarsales|Tarsometatarsal eklemler
Articulationes intermetatarsales|İntermetatarsal eklemler`, [43, 92]),
  ...numberedPairs("joints", "Ayak · Parmak eklemleri", "Articulatio metatarsophalangea", "Metatarsofalangeal eklem", 5, [42, 95]),
  ...numberedPairs("joints", "Ayak · Parmak eklemleri", "Articulatio interphalangea proximalis pedis", "Ayak proksimal interfalangeal eklemi", 4, [42, 97]),
  ...numberedPairs("joints", "Ayak · Parmak eklemleri", "Articulatio interphalangea distalis pedis", "Ayak distal interfalangeal eklemi", 4, [42, 98]),
];

const nervous: ExpandedAnatomyItem[] = [
  ...singles("nervous", "Beyin · Loblar, korteks ve komissürler", `
Telencephalon|Telensefalon
Lobus frontalis|Frontal lob
Lobus parietalis|Paryetal lob
Lobus temporalis|Temporal lob
Lobus occipitalis|Oksipital lob
Insula|İnsula
Lobus limbicus|Limbik lob
Gyrus precentralis|Precentral girus
Gyrus postcentralis|Postcentral girus
Sulcus centralis|Santral sulkus
Sulcus lateralis|Lateral sulkus
Corpus callosum|Korpus kallozum
Commissura anterior|Ön komissür
Fornix|Forniks
Capsula interna|İç kapsül
Corona radiata|Korona radiata`, [50, 14]),
  ...paired("nervous", "Beyin · Bazal çekirdekler ve limbik yapılar", `
Nucleus caudatus|Kaudat çekirdek
Putamen|Putamen
Globus pallidus externus|Dış globus pallidus
Globus pallidus internus|İç globus pallidus
Claustrum|Klaustrum
Nucleus accumbens|Nukleus accumbens
Amygdala|Amigdala
Hippocampus|Hipokampus`, [48, 15]),
  ...singles("nervous", "Diensefalon, beyin sapı ve beyincik", `
Thalamus|Talamus
Hypothalamus|Hipotalamus
Epithalamus|Epitalamus
Subthalamus|Subtalamus
Mesencephalon|Orta beyin
Pons|Pons
Medulla oblongata|Omurilik soğanı
Cerebellum|Beyincik
Vermis cerebelli|Beyincik vermisi
Pedunculus cerebellaris superior|Üst serebellar pedinkül
Pedunculus cerebellaris medius|Orta serebellar pedinkül
Pedunculus cerebellaris inferior|Alt serebellar pedinkül
Ventriculus lateralis|Lateral ventrikül
Ventriculus tertius|Üçüncü ventrikül
Aqueductus mesencephali|Serebral akuadukt
Ventriculus quartus|Dördüncü ventrikül`, [50, 17]),
  ...paired("nervous", "Kraniyal sinirler", `
Nervus olfactorius I|Birinci kraniyal sinir|koku siniri
Nervus opticus II|İkinci kraniyal sinir|görme siniri
Nervus oculomotorius III|Üçüncü kraniyal sinir
Nervus trochlearis IV|Dördüncü kraniyal sinir
Nervus trigeminus V|Beşinci kraniyal sinir|trigeminal sinir
Nervus abducens VI|Altıncı kraniyal sinir
Nervus facialis VII|Yedinci kraniyal sinir|yüz siniri
Nervus vestibulocochlearis VIII|Sekizinci kraniyal sinir
Nervus glossopharyngeus IX|Dokuzuncu kraniyal sinir
Nervus vagus X|Onuncu kraniyal sinir
Nervus accessorius XI|On birinci kraniyal sinir
Nervus hypoglossus XII|On ikinci kraniyal sinir`, [48, 19]),
  ...paired("nervous", "Trigeminal ve fasiyal sinir dalları", `
Nervus ophthalmicus|Oftalmik sinir
Nervus maxillaris|Maksiller sinir
Nervus mandibularis|Mandibular sinir
Nervus supraorbitalis|Supraorbital sinir
Nervus infraorbitalis|İnfraorbital sinir
Nervus mentalis|Mental sinir
Nervus lingualis|Lingual sinir
Nervus alveolaris inferior|Alt alveolar sinir
Nervus auriculotemporalis|Aurikulotemporal sinir
Nervus petrosus major|Büyük petrozal sinir
Chorda tympani|Korda timpani
Nervus auricularis posterior|Arka aurikular sinir`, [47, 18]),
  ...numberedPairs("nervous", "Spinal sinirler · Servikal", "Nervus spinalis cervicalis C", "Servikal spinal sinir C", 8, [47, 24]),
  ...numberedPairs("nervous", "Spinal sinirler · Torakal", "Nervus spinalis thoracicus T", "Torakal spinal sinir T", 12, [47, 36]),
  ...numberedPairs("nervous", "Spinal sinirler · Lumbal", "Nervus spinalis lumbalis L", "Lumbal spinal sinir L", 5, [47, 49]),
  ...numberedPairs("nervous", "Spinal sinirler · Sakral ve koksigeal", "Nervus spinalis sacralis S", "Sakral spinal sinir S", 5, [47, 57]),
  ...paired("nervous", "Spinal sinirler · Sakral ve koksigeal", "Nervus coccygeus Co1|Koksigeal spinal sinir Co1", [47, 59]),
  ...paired("nervous", "Boyun ve brakiyal pleksus", `
Plexus cervicalis|Servikal pleksus
Nervus occipitalis minor|Küçük oksipital sinir
Nervus auricularis magnus|Büyük aurikular sinir
Nervus transversus colli|Transvers servikal sinir
Nervi supraclaviculares|Supraklavikular sinirler
Nervus phrenicus|Frenik sinir
Plexus brachialis|Brakiyal pleksus
Truncus superior plexus brachialis|Brakiyal pleksus üst trunkusu
Truncus medius plexus brachialis|Brakiyal pleksus orta trunkusu
Truncus inferior plexus brachialis|Brakiyal pleksus alt trunkusu
Fasciculus lateralis|Lateral fasikül
Fasciculus medialis|Medial fasikül
Fasciculus posterior|Arka fasikül
Nervus dorsalis scapulae|Dorsal skapular sinir
Nervus thoracicus longus|Uzun torasik sinir
Nervus suprascapularis|Supraskapular sinir
Nervus pectoralis lateralis|Lateral pektoral sinir
Nervus pectoralis medialis|Medial pektoral sinir
Nervus thoracodorsalis|Torakodorsal sinir
Nervus axillaris|Aksiller sinir
Nervus musculocutaneus|Muskülokutanöz sinir
Nervus medianus|Median sinir
Nervus ulnaris|Ulnar sinir
Nervus radialis|Radial sinir`, [37, 34]),
  ...paired("nervous", "Lumbosakral pleksus ve alt ekstremite", `
Plexus lumbalis|Lumbal pleksus
Nervus iliohypogastricus|İliohipogastrik sinir
Nervus ilioinguinalis|İlioinguinal sinir
Nervus genitofemoralis|Genitofemoral sinir
Nervus cutaneus femoris lateralis|Lateral femoral kutanöz sinir
Nervus femoralis|Femoral sinir
Nervus obturatorius|Obturator sinir
Plexus sacralis|Sakral pleksus
Nervus gluteus superior|Üst gluteal sinir
Nervus gluteus inferior|Alt gluteal sinir
Nervus cutaneus femoris posterior|Arka femoral kutanöz sinir
Nervus pudendus|Pudendal sinir
Nervus ischiadicus|Siyatik sinir
Nervus tibialis|Tibial sinir
Nervus fibularis communis|Ortak fibular sinir
Nervus fibularis superficialis|Yüzeyel fibular sinir
Nervus fibularis profundus|Derin fibular sinir
Nervus plantaris medialis|Medial plantar sinir
Nervus plantaris lateralis|Lateral plantar sinir`, [43, 70]),
  ...singles("nervous", "Otonom sinir sistemi ve meninksler", `
Truncus sympathicus|Sempatik trunkus
Ganglion cervicale superius|Üst servikal ganglion
Ganglion cervicale medium|Orta servikal ganglion
Ganglion cervicothoracicum|Stellat ganglion
Nervi splanchnici thoracici|Torasik splanknik sinirler
Nervi splanchnici pelvici|Pelvik splanknik sinirler
Plexus coeliacus|Çölyak pleksus
Plexus mesentericus superior|Üst mezenterik pleksus
Plexus hypogastricus superior|Üst hipogastrik pleksus
Plexus hypogastricus inferior|Alt hipogastrik pleksus
Dura mater encephali|Beyin dura mater'i
Arachnoidea mater|Araknoid mater
Pia mater|Pia mater
Sinus sagittalis superior|Üst sagittal sinüs
Sinus cavernosus|Kavernöz sinüs`, [50, 37]),
];

const circulatory: ExpandedAnatomyItem[] = [
  ...singles("circulatory", "Kalp · Boşluklar, kapaklar ve ileti sistemi", `
Atrium dextrum|Sağ atriyum
Auricula dextra|Sağ aurikula
Ventriculus dexter|Sağ ventrikül
Atrium sinistrum|Sol atriyum
Auricula sinistra|Sol aurikula
Ventriculus sinister|Sol ventrikül
Septum interatriale|Atriyumlar arası septum
Septum interventriculare|Ventriküller arası septum
Valva tricuspidalis|Triküspit kapak
Valva trunci pulmonalis|Pulmoner kapak
Valva mitralis|Mitral kapak
Valva aortae|Aort kapağı
Nodus sinuatrialis|Sinoatriyal düğüm
Nodus atrioventricularis|Atriyoventriküler düğüm
Fasciculus atrioventricularis|His demeti
Crus dextrum fasciculi atrioventricularis|His demetinin sağ dalı
Crus sinistrum fasciculi atrioventricularis|His demetinin sol dalı`, [50, 36]),
  ...singles("circulatory", "Aorta ve ana arterler", `
Aorta ascendens|Çıkan aort
Arcus aortae|Aort yayı
Aorta thoracica|Torasik aort
Aorta abdominalis|Abdominal aort
Truncus brachiocephalicus|Brakiyosefalik trunkus
Truncus coeliacus|Çölyak trunkus
Arteria mesenterica superior|Üst mezenterik arter
Arteria mesenterica inferior|Alt mezenterik arter
Arteria sacralis mediana|Median sakral arter`, [50, 42]),
  ...paired("circulatory", "Baş-boyun arterleri", `
Arteria carotis communis|Ortak karotis arteri
Arteria carotis externa|Dış karotis arteri
Arteria thyroidea superior|Üst tiroid arteri
Arteria lingualis|Lingual arter
Arteria facialis|Fasiyal arter
Arteria occipitalis|Oksipital arter
Arteria auricularis posterior|Arka aurikular arter
Arteria maxillaris|Maksiller arter
Arteria temporalis superficialis|Yüzeyel temporal arter
Arteria carotis interna|İç karotis arteri
Arteria ophthalmica|Oftalmik arter
Arteria cerebri anterior|Ön serebral arter
Arteria cerebri media|Orta serebral arter
Arteria vertebralis|Vertebral arter
Arteria cerebri posterior|Arka serebral arter`, [47, 20]),
  ...paired("circulatory", "Üst ekstremite arterleri", `
Arteria subclavia|Subklavyen arter
Arteria thoracica interna|İç torasik arter
Arteria axillaris|Aksiller arter
Arteria thoracoacromialis|Torakoakromiyal arter
Arteria thoracica lateralis|Lateral torasik arter
Arteria subscapularis|Subskapular arter
Arteria circumflexa humeri anterior|Ön humeral sirkumfleks arter
Arteria circumflexa humeri posterior|Arka humeral sirkumfleks arter
Arteria brachialis|Brakiyal arter
Arteria profunda brachii|Derin brakiyal arter
Arteria ulnaris|Ulnar arter
Arteria radialis|Radial arter
Arcus palmaris superficialis|Yüzeyel palmar ark
Arcus palmaris profundus|Derin palmar ark`, [34, 42]),
  ...paired("circulatory", "Toraks, abdomen ve pelvis arterleri", `
Arteria intercostalis posterior|Arka interkostal arter
Arteria phrenica inferior|Alt frenik arter
Arteria renalis|Renal arter
Arteria suprarenalis media|Orta sürrenal arter
Arteria gonadalis|Gonadal arter
Arteria iliaca communis|Ortak iliak arter
Arteria iliaca interna|İç iliak arter
Arteria glutea superior|Üst gluteal arter
Arteria glutea inferior|Alt gluteal arter
Arteria pudenda interna|İç pudendal arter
Arteria obturatoria|Obturator arter
Arteria iliaca externa|Dış iliak arter`, [46, 53]),
  ...paired("circulatory", "Alt ekstremite arterleri", `
Arteria femoralis|Femoral arter
Arteria profunda femoris|Derin femoral arter
Arteria circumflexa femoris medialis|Medial femoral sirkumfleks arter
Arteria circumflexa femoris lateralis|Lateral femoral sirkumfleks arter
Arteria poplitea|Popliteal arter
Arteria tibialis anterior|Ön tibial arter
Arteria dorsalis pedis|Dorsalis pedis arteri
Arteria tibialis posterior|Arka tibial arter
Arteria fibularis|Fibular arter
Arteria plantaris medialis|Medial plantar arter
Arteria plantaris lateralis|Lateral plantar arter
Arcus plantaris profundus|Derin plantar ark`, [43, 78]),
  ...singles("circulatory", "Ana venler ve portal sistem", `
Vena cava superior|Üst ana toplardamar
Vena cava inferior|Alt ana toplardamar
Sinus coronarius|Koroner sinüs
Vena portae hepatis|Hepatik portal ven
Vena mesenterica superior|Üst mezenterik ven
Vena mesenterica inferior|Alt mezenterik ven
Vena splenica|Splenik ven
Vena azygos|Azigos veni
Vena hemiazygos|Hemiazigos veni
Vena hemiazygos accessoria|Aksesuar hemiazigos veni`, [50, 43]),
  ...paired("circulatory", "Baş-boyun ve üst ekstremite venleri", `
Vena jugularis interna|İç juguler ven
Vena jugularis externa|Dış juguler ven
Vena vertebralis|Vertebral ven
Vena brachiocephalica|Brakiyosefalik ven
Vena subclavia|Subklavyen ven
Vena axillaris|Aksiller ven
Vena brachialis|Brakiyal ven
Vena cephalica|Sefalik ven
Vena basilica|Bazilik ven
Vena mediana cubiti|Median kubital ven
Vena radialis|Radial ven
Vena ulnaris|Ulnar ven
Arcus venosus palmaris superficialis|Yüzeyel palmar venöz ark
Arcus venosus palmaris profundus|Derin palmar venöz ark`, [35, 39]),
  ...paired("circulatory", "Abdomen, pelvis ve alt ekstremite venleri", `
Vena hepatica|Hepatik ven
Vena renalis|Renal ven
Vena gonadalis|Gonadal ven
Vena iliaca communis|Ortak iliak ven
Vena iliaca interna|İç iliak ven
Vena iliaca externa|Dış iliak ven
Vena femoralis|Femoral ven
Vena profunda femoris|Derin femoral ven
Vena poplitea|Popliteal ven
Vena saphena magna|Büyük safen ven
Vena saphena parva|Küçük safen ven
Vena tibialis anterior|Ön tibial ven
Vena tibialis posterior|Arka tibial ven
Vena fibularis|Fibular ven`, [43, 70]),
  ...singles("circulatory", "Koroner ve pulmoner dolaşım", `
Arteria coronaria dextra|Sağ koroner arter
Arteria coronaria sinistra|Sol koroner arter
Arteria interventricularis anterior|Ön interventriküler arter
Arteria circumflexa|Sirkumfleks arter
Arteria interventricularis posterior|Arka interventriküler arter`, [50, 36]),
  ...paired("circulatory", "Koroner ve pulmoner dolaşım", `
Arteria pulmonalis|Pulmoner arter
Vena pulmonalis superior|Üst pulmoner ven
Vena pulmonalis inferior|Alt pulmoner ven`, [48, 36]),
];

const respiratory: ExpandedAnatomyItem[] = [
  ...singles("respiratory", "Burun ve paranazal sinüsler", `
Vestibulum nasi|Burun vestibülü
Cavitas nasi|Burun boşluğu
Septum nasi|Nazal septum
Concha nasalis superior|Üst burun konkası
Concha nasalis media|Orta burun konkası
Concha nasalis inferior|Alt burun konkası
Meatus nasi superior|Üst burun yolu
Meatus nasi medius|Orta burun yolu
Meatus nasi inferior|Alt burun yolu
Sinus maxillaris|Maksiller sinüs
Sinus frontalis|Frontal sinüs
Sinus sphenoidalis|Sfenoid sinüs
Cellulae ethmoidales|Etmoid hava hücreleri`, [50, 16]),
  ...singles("respiratory", "Farinks, larinks ve trakea", `
Nasopharynx|Nazofarinks
Oropharynx|Orofarinks
Laryngopharynx|Laringofarinks
Epiglottis|Epiglot
Cartilago thyroidea|Tiroid kıkırdak
Cartilago cricoidea|Krikoid kıkırdak
Cartilago arytenoidea|Aritenoid kıkırdak
Plica vestibularis|Vestibüler plika
Plica vocalis|Vokal plika
Rima glottidis|Glottis aralığı
Trachea|Trakea
Carina tracheae|Trakeal karina`, [50, 24]),
  ...singles("respiratory", "Bronş ağacı", `
Bronchus principalis dexter|Sağ ana bronş
Bronchus principalis sinister|Sol ana bronş
Bronchus lobaris superior dexter|Sağ üst lob bronşu
Bronchus lobaris medius dexter|Sağ orta lob bronşu
Bronchus lobaris inferior dexter|Sağ alt lob bronşu
Bronchus lobaris superior sinister|Sol üst lob bronşu
Bronchus lobaris inferior sinister|Sol alt lob bronşu`, [50, 32]),
  ...paired("respiratory", "Bronş ağacı · Distal hava yolları", `
Bronchus segmentalis|Segmental bronş
Bronchiolus|Bronşiol
Bronchiolus terminalis|Terminal bronşiol
Bronchiolus respiratorius|Respiratuvar bronşiol
Ductus alveolaris|Alveoler kanal
Saccus alveolaris|Alveoler kese
Alveolus pulmonis|Akciğer alveolü`, [45, 34]),
  ...singles("respiratory", "Akciğer lob ve segmentleri", `
Lobus superior pulmonis dextri|Sağ akciğer üst lobu
Lobus medius pulmonis dextri|Sağ akciğer orta lobu
Lobus inferior pulmonis dextri|Sağ akciğer alt lobu
Lobus superior pulmonis sinistri|Sol akciğer üst lobu
Lingula pulmonis sinistri|Sol akciğer lingulası
Lobus inferior pulmonis sinistri|Sol akciğer alt lobu
Segmentum apicale S1|Apikal bronkopulmoner segment
Segmentum posterius S2|Posterior bronkopulmoner segment
Segmentum anterius S3|Anterior bronkopulmoner segment
Segmentum laterale S4|Lateral bronkopulmoner segment
Segmentum mediale S5|Medial bronkopulmoner segment
Segmentum superius S6|Superior bronkopulmoner segment
Segmentum basale mediale S7|Medial bazal segment
Segmentum basale anterius S8|Anterior bazal segment
Segmentum basale laterale S9|Lateral bazal segment
Segmentum basale posterius S10|Posterior bazal segment`, [50, 35]),
  ...paired("respiratory", "Pleura ve pulmoner hilus", `
Pleura visceralis|Visseral plevra
Pleura parietalis|Paryetal plevra
Cupula pleurae|Plevra kubbesi
Recessus costodiaphragmaticus|Kostodiyafragmatik reses
Recessus costomediastinalis|Kostomediastinal reses
Hilum pulmonis|Akciğer hilusu
Radix pulmonis|Akciğer kökü`, [44, 37]),
];

const digestive: ExpandedAnatomyItem[] = [
  ...singles("digestive", "Ağız boşluğu ve dişler", `
Vestibulum oris|Ağız vestibülü
Cavitas oris propria|Asıl ağız boşluğu
Palatum durum|Sert damak
Palatum molle|Yumuşak damak
Uvula palatina|Damak küçük dili
Lingua|Dil
Papillae filiformes|Filiform papillalar
Papillae fungiformes|Fungiform papillalar
Papillae vallatae|Sirkumvallat papillalar
Papillae foliatae|Foliat papillalar
Tonsilla palatina|Palatin tonsil
Dens incisivus centralis|Santral kesici diş
Dens incisivus lateralis|Lateral kesici diş
Dens caninus|Köpek dişi
Dens premolaris primus|Birinci küçük azı dişi
Dens premolaris secundus|İkinci küçük azı dişi
Dens molaris primus|Birinci büyük azı dişi
Dens molaris secundus|İkinci büyük azı dişi
Dens molaris tertius|Üçüncü büyük azı dişi`, [50, 18]),
  ...paired("digestive", "Tükürük bezleri", `
Glandula parotidea|Parotis bezi
Ductus parotideus|Parotis kanalı
Glandula submandibularis|Submandibular bez
Ductus submandibularis|Submandibular kanal
Glandula sublingualis|Sublingual bez
Ductus sublingualis major|Büyük sublingual kanal`, [46, 20]),
  ...singles("digestive", "Farinks, özofagus ve mide", `
Pharynx|Farinks
Oesophagus, pars cervicalis|Özofagusun servikal parçası
Oesophagus, pars thoracica|Özofagusun torakal parçası
Oesophagus, pars abdominalis|Özofagusun abdominal parçası
Cardia ventriculi|Mide kardiyası
Fundus ventriculi|Mide fundusu
Corpus ventriculi|Mide gövdesi
Pars pylorica|Pilorik parça
Antrum pyloricum|Pilorik antrum
Canalis pyloricus|Pilorik kanal
Pylorus|Pilor
Curvatura major|Büyük kurvatur
Curvatura minor|Küçük kurvatur`, [52, 45]),
  ...singles("digestive", "İnce ve kalın bağırsak", `
Duodenum, pars superior|Duodenumun üst parçası
Duodenum, pars descendens|Duodenumun inen parçası
Duodenum, pars horizontalis|Duodenumun yatay parçası
Duodenum, pars ascendens|Duodenumun çıkan parçası
Jejunum|Jejunum
Ileum|İleum
Caecum|Çekum
Appendix vermiformis|Apendiks
Colon ascendens|Çıkan kolon
Flexura coli dextra|Sağ kolik fleksura
Colon transversum|Transvers kolon
Flexura coli sinistra|Sol kolik fleksura
Colon descendens|İnen kolon
Colon sigmoideum|Sigmoid kolon
Rectum|Rektum
Canalis analis|Anal kanal
Taeniae coli|Kolon tenyaları
Haustra coli|Kolon haustraları
Appendices epiploicae|Epiploik uzantılar`, [50, 57]),
  ...singles("digestive", "Karaciğer, safra yolları ve pankreas", `
Lobus hepatis dexter|Karaciğer sağ lobu
Lobus hepatis sinister|Karaciğer sol lobu
Lobus caudatus|Kaudat lob
Lobus quadratus|Kuadrat lob
Porta hepatis|Karaciğer kapısı
Vesica biliaris|Safra kesesi
Fundus vesicae biliaris|Safra kesesi fundusu
Corpus vesicae biliaris|Safra kesesi gövdesi
Collum vesicae biliaris|Safra kesesi boynu
Ductus cysticus|Sistik kanal
Ductus hepaticus dexter|Sağ hepatik kanal
Ductus hepaticus sinister|Sol hepatik kanal
Ductus hepaticus communis|Ortak hepatik kanal
Ductus choledochus|Koledok
Caput pancreatis|Pankreas başı
Processus uncinatus pancreatis|Pankreas unsinat çıkıntısı
Collum pancreatis|Pankreas boynu
Corpus pancreatis|Pankreas gövdesi
Cauda pancreatis|Pankreas kuyruğu
Ductus pancreaticus|Pankreatik kanal
Ductus pancreaticus accessorius|Aksesuar pankreatik kanal`, [49, 50]),
  ...singles("digestive", "Periton ve mezenterler", `
Peritoneum parietale|Paryetal periton
Peritoneum viscerale|Visseral periton
Omentum majus|Büyük omentum
Omentum minus|Küçük omentum
Mesenterium|Mezenter
Mesocolon transversum|Transvers mezokolon
Mesocolon sigmoideum|Sigmoid mezokolon
Bursa omentalis|Omental bursa
Foramen omentale|Omental foramen
Ligamentum hepatoduodenale|Hepatoduodenal bağ
Ligamentum falciforme hepatis|Karaciğer falsiform bağı`, [50, 52]),
];

const urinary: ExpandedAnatomyItem[] = [
  ...paired("urinary", "Böbrek · Makroskopik yapılar", `
Ren|Böbrek
Capsula fibrosa renis|Böbrek fibröz kapsülü
Cortex renalis|Böbrek korteksi
Medulla renalis|Böbrek medullası
Columna renalis|Böbrek kolonu
Pyramis renalis|Böbrek piramidi
Papilla renalis|Böbrek papillası
Calix renalis minor|Küçük böbrek kaliksi
Calix renalis major|Büyük böbrek kaliksi
Pelvis renalis|Böbrek pelvisi
Hilum renale|Böbrek hilusu
Sinus renalis|Böbrek sinüsü`, [43, 51]),
  ...paired("urinary", "Nefron ve toplayıcı sistem", `
Corpusculum renale|Renal korpüskül
Glomerulus|Glomerül
Capsula glomerularis|Bowman kapsülü
Tubulus contortus proximalis|Proksimal kıvrımlı tübül
Ansa nephroni|Henle kulpu
Tubulus contortus distalis|Distal kıvrımlı tübül
Tubulus reuniens|Birleştirici tübül
Ductus colligens|Toplayıcı kanal
Apparatus juxtaglomerularis|Jukstaglomerüler aygıt`, [43, 51]),
  ...paired("urinary", "Üreter", `
Ureter, pars abdominalis|Üreterin abdominal parçası
Ureter, pars pelvica|Üreterin pelvik parçası
Ureter, pars intramuralis|Üreterin intramural parçası
Ostium ureteris|Üreter ağzı`, [46, 59]),
  ...singles("urinary", "Mesane ve üretra", `
Apex vesicae urinariae|Mesane tepesi
Corpus vesicae urinariae|Mesane gövdesi
Fundus vesicae urinariae|Mesane tabanı
Cervix vesicae urinariae|Mesane boynu
Trigonum vesicae|Mesane üçgeni
Urethra feminina|Kadın üretrası
Urethra masculina, pars intramuralis|Erkek üretrasının intramural parçası
Urethra masculina, pars prostatica|Erkek üretrasının prostatik parçası
Urethra masculina, pars membranacea|Erkek üretrasının membranöz parçası
Urethra masculina, pars spongiosa|Erkek üretrasının spongiyöz parçası`, [50, 68]),
];

const genital: ExpandedAnatomyItem[] = [
  ...paired("genital", "Kadın · Over ve uterin tüp", `
Ovarium|Over|yumurtalık
Cortex ovarii|Over korteksi
Medulla ovarii|Over medullası
Ligamentum ovarii proprium|Overin kendi bağı
Ligamentum suspensorium ovarii|Overin asıcı bağı
Tuba uterina, infundibulum|Uterin tüp infundibulumu
Fimbriae tubae uterinae|Uterin tüp fimbriaları
Ampulla tubae uterinae|Uterin tüp ampullası
Isthmus tubae uterinae|Uterin tüp istmusu
Pars uterina tubae|Uterin tüpün uterin parçası`, [45, 64]),
  ...singles("genital", "Kadın · Uterus, vajina ve dış genital organlar", `
Fundus uteri|Uterus fundusu
Corpus uteri|Uterus gövdesi
Isthmus uteri|Uterus istmusu
Cervix uteri|Uterus serviksi
Endometrium|Endometrium
Myometrium|Miyometrium
Perimetrium|Perimetrium
Ligamentum latum uteri|Uterusun geniş bağı
Ligamentum teres uteri|Uterusun yuvarlak bağı
Ligamentum cardinale|Kardinal bağ
Vagina|Vajina
Fornix vaginae|Vajinal forniks
Mons pubis|Mons pubis
Labium majus pudendi|Büyük pudendal dudak
Labium minus pudendi|Küçük pudendal dudak
Clitoris|Klitoris
Vestibulum vaginae|Vajina vestibülü
Bulbus vestibuli|Vestibül bulbusu
Glandula vestibularis major|Büyük vestibüler bez`, [50, 68]),
  ...paired("genital", "Erkek · Testis, epididim ve kanal sistemi", `
Testis|Testis
Tunica albuginea testis|Testisin tunika albugineası
Tubuli seminiferi contorti|Kıvrımlı seminifer tübüller
Rete testis|Rete testis
Ductuli efferentes testis|Testisin efferent kanalcıkları
Epididymis, caput|Epididim başı
Epididymis, corpus|Epididim gövdesi
Epididymis, cauda|Epididim kuyruğu
Ductus deferens|Ductus deferens
Ampulla ductus deferentis|Ductus deferens ampullası
Funiculus spermaticus|Spermatik kordon`, [46, 72]),
  ...paired("genital", "Erkek · Aksesuar bezler ve dış genital organlar", `
Vesicula seminalis|Seminal vezikül
Ductus ejaculatorius|Ejakülatuvar kanal
Glandula bulbourethralis|Bulboüretral bez
Corpus cavernosum penis|Penis kavernöz cismi
Corpus spongiosum penis|Penis spongiyöz cismi
Crus penis|Penis krusu`, [47, 70]),
  ...singles("genital", "Erkek · Prostat, penis ve skrotum", `
Prostata|Prostat
Zona centralis prostatae|Prostat santral zonu
Zona transitionis prostatae|Prostat transizyonel zonu
Zona peripherica prostatae|Prostat periferik zonu
Radix penis|Penis kökü
Corpus penis|Penis gövdesi
Glans penis|Glans penis
Preputium penis|Penis prepusyumu
Scrotum|Skrotum
Septum scroti|Skrotum septumu`, [50, 72]),
];

const endocrine: ExpandedAnatomyItem[] = [
  ...singles("endocrine", "Hipotalamus ve hipofiz", `
Nucleus supraopticus|Supraoptik çekirdek
Nucleus paraventricularis|Paraventriküler çekirdek
Eminentia mediana|Median eminens
Infundibulum hypophysis|Hipofiz infundibulumu
Adenohypophysis|Adenohipofiz
Pars distalis hypophysis|Hipofiz pars distalis'i
Pars intermedia hypophysis|Hipofiz pars intermedia'sı
Pars tuberalis hypophysis|Hipofiz pars tuberalis'i
Neurohypophysis|Nörohipofiz
Pars nervosa hypophysis|Hipofiz pars nervosa'sı`, [50, 14]),
  ...singles("endocrine", "Epifiz, tiroid, paratiroid ve timus", `
Glandula pinealis|Pineal bez|epifiz
Lobus dexter glandulae thyroideae|Tiroid bezinin sağ lobu
Lobus sinister glandulae thyroideae|Tiroid bezinin sol lobu
Isthmus glandulae thyroideae|Tiroid istmusu
Lobus pyramidalis glandulae thyroideae|Tiroid piramidal lobu
Glandula parathyroidea superior dextra|Sağ üst paratiroid bezi
Glandula parathyroidea superior sinistra|Sol üst paratiroid bezi
Glandula parathyroidea inferior dextra|Sağ alt paratiroid bezi
Glandula parathyroidea inferior sinistra|Sol alt paratiroid bezi
Lobus dexter thymi|Timusun sağ lobu
Lobus sinister thymi|Timusun sol lobu`, [50, 24]),
  ...paired("endocrine", "Sürrenal bez ve endokrin pankreas", `
Glandula suprarenalis|Sürrenal bez|böbreküstü bezi
Cortex glandulae suprarenalis|Sürrenal korteks
Zona glomerulosa|Zona glomeruloza
Zona fasciculata|Zona fasikülata
Zona reticularis|Zona retikülaris
Medulla glandulae suprarenalis|Sürrenal medulla`, [43, 49]),
  ...singles("endocrine", "Sürrenal bez ve endokrin pankreas", `
Insulae pancreaticae|Pankreas adacıkları
Cellula alpha pancreatica|Pankreas alfa hücresi
Cellula beta pancreatica|Pankreas beta hücresi
Cellula delta pancreatica|Pankreas delta hücresi
Cellula PP pancreatica|Pankreas PP hücresi`, [53, 51]),
  ...singles("endocrine", "Dağınık endokrin organlar", `
Cellula Leydig|Leydig hücresi
Cellula Sertoli|Sertoli hücresi
Folliculus ovaricus|Over folikülü
Corpus luteum|Korpus luteum
Placenta|Plasenta
Apparatus juxtaglomerularis|Jukstaglomerüler aygıt
Cellula enteroendocrina|Enteroendokrin hücre
Paraganglion|Paraganglion
Organum subfornicale|Subfornikal organ
Organum vasculosum laminae terminalis|Lamina terminalisin vasküler organı`, [50, 48]),
];

const sensory: ExpandedAnatomyItem[] = [
  ...paired("sensory", "Göz · Dış ve fibröz tabaka", `
Palpebra superior|Üst göz kapağı
Palpebra inferior|Alt göz kapağı
Conjunctiva palpebrarum|Palpebral konjonktiva
Conjunctiva bulbi|Bulber konjonktiva
Apparatus lacrimalis|Lakrimal aygıt
Glandula lacrimalis|Lakrimal bez
Sclera|Sklera
Cornea|Kornea
Limbus corneae|Kornea limbusu`, [46, 16]),
  ...paired("sensory", "Göz · Uvea, retina ve optik ortam", `
Choroidea|Koroid
Corpus ciliare|Siliyer cisim
Musculus ciliaris|Siliyer kas
Iris|İris
Pupilla|Pupilla
Retina|Retina
Macula lutea|Makula lutea
Fovea centralis|Fovea centralis
Discus nervi optici|Optik disk
Camera anterior bulbi|Göz ön kamarası
Camera posterior bulbi|Göz arka kamarası
Lens|Lens
Corpus vitreum|Vitreus cisim
Nervus opticus|Optik sinir`, [46, 16]),
  ...paired("sensory", "Kulak · Dış ve orta kulak", `
Auricula|Kulak kepçesi
Meatus acusticus externus|Dış kulak yolu
Membrana tympanica|Kulak zarı
Cavitas tympani|Timpanik boşluk
Malleus|Malleus|çekiç
Incus|İnkus|örs
Stapes|Stapes|üzengi
Tuba auditiva|Östaki tüpü
Cellulae mastoideae|Mastoid hava hücreleri`, [43, 17]),
  ...paired("sensory", "Kulak · İç kulak ve denge", `
Labyrinthus osseus|Kemik labirent
Vestibulum labyrinthi|Labirent vestibülü
Canalis semicircularis anterior|Ön kemik semisirküler kanal
Canalis semicircularis posterior|Arka kemik semisirküler kanal
Canalis semicircularis lateralis|Lateral kemik semisirküler kanal
Cochlea|Koklea
Labyrinthus membranaceus|Membranöz labirent
Utriculus|Utrikül
Sacculus|Sakkül
Ductus semicircularis anterior|Ön membranöz semisirküler kanal
Ductus semicircularis posterior|Arka membranöz semisirküler kanal
Ductus semicircularis lateralis|Lateral membranöz semisirküler kanal
Ductus cochlearis|Koklear kanal
Organum spirale|Corti organı
Nervus vestibularis|Vestibüler sinir
Nervus cochlearis|Koklear sinir`, [43, 17]),
  ...singles("sensory", "Koku ve tat", `
Regio olfactoria|Olfaktör bölge
Epithelium olfactorium|Olfaktör epitel
Bulbus olfactorius|Olfaktör bulbus
Tractus olfactorius|Olfaktör traktus
Trigonum olfactorium|Olfaktör trigon
Cortex olfactorius primarius|Birincil koku korteksi
Caliculus gustatorius|Tat tomurcuğu
Papilla fungiformis|Fungiform papilla
Papilla vallata|Sirkumvallat papilla
Papilla foliata|Foliat papilla
Nucleus tractus solitarii|Soliter traktus çekirdeği`, [50, 17]),
  ...singles("sensory", "Deri ve somatik duyu reseptörleri", `
Epidermis|Epidermis
Dermis|Dermis
Tela subcutanea|Deri altı dokusu
Folliculus pili|Kıl folikülü
Glandula sebacea|Sebase bez
Glandula sudorifera eccrina|Ekrin ter bezi
Glandula sudorifera apocrina|Apokrin ter bezi
Corpusculum tactile Meissneri|Meissner dokunma cisimciği
Corpusculum lamellosum Pacini|Pacini lamelli cisimciği
Discus tactilis Merkel|Merkel dokunma diski
Corpusculum bulboideum Ruffini|Ruffini cisimciği
Terminatio nervosa libera|Serbest sinir ucu
Fusus neuromuscularis|Kas iğciği
Organum tendineum Golgi|Golgi tendon organı`, [40, 45]),
];

export const expandedAnatomyItems: ExpandedAnatomyItem[] = [
  ...joints, ...muscles, ...nervous, ...circulatory, ...respiratory,
  ...digestive, ...urinary, ...genital, ...endocrine, ...sensory,
];
