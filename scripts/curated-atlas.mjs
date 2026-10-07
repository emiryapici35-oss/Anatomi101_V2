// Reviewed internet illustrations. Coordinates mark visible anatomy, not inferred structures.
// Contextual neighbours may be visible; interactive labels stay inside one submenu.
export const curatedAtlas = [
  { source: "smart-brain-overview", title: "Beyin - lateral görünüm", items: [
    ["encephalon", null], ["cerebrum", [55, 30]], ["cerebellum", [34, 71]], ["truncus-encephali", [46, 87]],
  ] },
  { source: "brain", title: "Büyük beyin - lateral görünüm", items: [["atlas-nervous-telencephalon-1", null]] },
  { source: "heart-ov", title: "Kalp - ön görünüm", items: [
    ["cor", null], ["aorta", [52, 17]], ["vena-cava-superior", [26, 30]], ["vena-cava-inferior", [27, 85]], ["arteria-pulmonalis", [58, 33]],
  ] },
  { source: "smart-heart-ov", title: "Kalp - arka görünüm", items: [
    ["cor", null], ["aorta", [42, 13]], ["venae-pulmonales", [68, 55]],
  ] },
  { source: "bronchi-section-ov", title: "Sağlıklı bronş - enine kesit", items: [["bronchi", null]] },
  { source: "smart-liver", title: "Karaciğer", items: [["hepar", null]] },
  { source: "pancreas-overview", title: "Pankreas", items: [["pancreas", null]] },
  { source: "intestine-overview", title: "İnce bağırsak", items: [["intestinum-tenue", null]] },
  { source: "colon-overview", title: "Kalın bağırsak ve rektum", items: [["intestinum-crassum", [56, 17]], ["rectum", [58, 85]]] },
  { source: "stomach-overview", title: "Mide", items: [["ventriculus", null]] },
  { source: "parotid-gland", title: "Parotis bezi", items: [["glandula-parotis", null]] },
  { source: "esophagus", title: "Yemek borusu", items: [["oesophagus", null]] },
  { source: "gallbladder-organ", title: "Safra kesesi", items: [["vesica-biliaris", null]] },
  { source: "urinary-tract", title: "Böbrekler ve idrar yolları - ön görünüm", items: [
    ["ren-dexter", [15, 16]], ["ren-sinister", [83, 15]],
    ["ureter-dexter", [35, 52]], ["ureter-sinister", [67, 52]],
    ["vesica-urinaria", [50, 80]], ["urethra", [50, 96]],
  ] },
  { commons: "34c21dda85d4", source: "female-reproductive-anterior", title: "Kadın üreme sistemi - ön görünüm", items: [
    ["ovarium-dexter", [15, 27]], ["ovarium-sinister", [84, 25]],
    ["tuba-uterina", [26, 14]], ["uterus", [50, 42]], ["vagina", [51, 78]],
  ] },
  { source: "longitudinal-section-adrenal", title: "Böbreküstü bezi - kesit", items: [["glandula-suprarenalis", null]] },
  { source: "thymus", title: "Timus", items: [["thymus", null]] },
  { source: "pituitary-gland", title: "Hipofiz bezi", items: [["hypophysis", null]] },
  { source: "smart-islet-of-langerhans", title: "Pankreas adacığı - kesit", items: [["insulae-pancreaticae", null]] },
  { source: "thyroid", title: "Tiroid bezi - ön görünüm", items: [["glandula-thyroidea", null]] },
  { source: "thyroid-overview", title: "Tiroid ve paratiroid bezleri - arka görünüm", items: [
    ["glandula-thyroidea", [49, 53]], ["glandula-parathyroidea", [80, 76]],
  ] },
  { source: "eye-vitreous-body", title: "Göz küresi - kesit", items: [
    ["bulbus-oculi", null], ["retina", [57, 10]], ["nervus-opticus", [90, 62]],
  ] },
  { source: "taste", title: "Tat tomurcukları - kesit", items: [["atlas-sensory-caliculus-gustatorius-7", null]] },
  { source: "stomach-overview", title: "Mide - anatomik bölümler", items: [
    ["atlas-digestive-cardia-ventriculi-5", [35, 23]],
    ["atlas-digestive-fundus-ventriculi-6", [71, 20]],
    ["atlas-digestive-corpus-ventriculi-7", [63, 53]],
    ["atlas-digestive-antrum-pyloricum-9", [27, 79]],
    ["atlas-digestive-pylorus-11", [7, 73]],
    ["atlas-digestive-curvatura-major-12", [78, 85]],
    ["atlas-digestive-curvatura-minor-13", [39, 52]],
  ] },
  { source: "smart-liver", title: "Karaciğer lobları", items: [
    ["atlas-digestive-lobus-hepatis-dexter-1", [30, 42]],
    ["atlas-digestive-lobus-hepatis-sinister-2", [80, 32]],
  ] },
  { source: "gallbladder-ov", title: "Safra kesesi ve kanalları", items: [
    ["atlas-digestive-fundus-vesicae-biliaris-7", [12, 50]],
    ["atlas-digestive-corpus-vesicae-biliaris-8", [43, 49]],
    ["atlas-digestive-collum-vesicae-biliaris-9", [62, 49]],
    ["atlas-digestive-ductus-cysticus-10", [69, 52]],
    ["atlas-digestive-ductus-hepaticus-communis-13", [77, 12]],
    ["atlas-digestive-ductus-choledochus-14", [76, 82]],
  ] },
  { source: "pancreas-overview", title: "Pankreasın ana kısımları", items: [
    ["atlas-digestive-caput-pancreatis-15", [15, 62]],
    ["atlas-digestive-corpus-pancreatis-18", [49, 38]],
    ["atlas-digestive-cauda-pancreatis-19", [88, 24]],
  ] },
  { source: "pancreas-anatomy", title: "Pankreas kanalı - kesit", items: [
    ["atlas-digestive-ductus-pancreaticus-20", [45, 44]],
  ] },
];
