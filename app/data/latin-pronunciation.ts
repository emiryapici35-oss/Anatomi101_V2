export type LatinPronunciation = {
  phonetic: string;
  syllabified: string;
  appliedRules: string[];
};

const vowelPattern = /[aeıioöuü]/i;
const vowelPairPattern = /[aeıioöuü]{2}/i;
const onsetClusters = new Set([
  "bl", "br", "dr", "fl", "fr", "gl", "gr", "kl", "kr", "pl", "pr", "tr",
  "ts",
]);

const exactReadings: Record<string, string> = {
  caecum: "sekum",
  coeliacum: "seliakum",
  coccyx: "koksiks",
  encephalon: "ensefalon",
  hypophysis: "hipofizis",
  oesophagus: "ezofagus",
  pharynx: "farinks",
  sphenoidale: "sfenoidale",
  zygomaticum: "zigomatikum",
};

const normalizeWord = (word: string) =>
  word
    .toLocaleLowerCase("la")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function pronounceWord(originalWord: string, appliedRules: Set<string>) {
  const normalized = normalizeWord(originalWord);
  if (exactReadings[normalized]) {
    appliedRules.add("sözlük doğrulaması");
    return exactReadings[normalized];
  }

  let word = normalized;

  const replace = (pattern: RegExp, replacement: string, label: string) => {
    if (pattern.test(word)) {
      appliedRules.add(label);
      word = word.replace(pattern, replacement);
    }
  };

  // Önce birleşik sesler çözülür; daha sonra tek harf kuralları uygulanır.
  replace(/ae|oe/g, "e", "ae/oe → e");
  replace(/sch/g, "sk", "sch → sk");
  replace(/ch/g, "k", "ch → k");
  replace(/ph/g, "f", "ph → f");
  replace(/th/g, "t", "th → t");
  replace(/rh/g, "r", "rh → r");
  replace(/qu/g, "kv", "qu → kv");
  replace(/ngu(?=[aeiouy])/g, "ngv", "ngu + ünlü → ngv");
  replace(/su(?=[aeiouy])/g, "sv", "su + ünlü → sv");

  // Kaynak metindeki s iki ünlü arasındaysa ötümlüleşir. c'den üretilen s bu kurala girmez.
  replace(/([aeiouy])s(?=[aeiouy])/g, "$1z", "iki ünlü arasında s → z");
  replace(/(^|[^stx])ti(?=[aeouy])/g, "$1tsi", "ti + ünlü → tsi");
  replace(/c(?=[eiy])/g, "s", "c + e/i/y → s");
  replace(/c/g, "k", "c → k");
  replace(/x/g, "ks", "x → ks");
  replace(/j/g, "y", "j → y");
  replace(/y/g, "i", "y → i");
  replace(/w/g, "v", "w → v");
  replace(/q/g, "k", "q → k");

  return word;
}

function syllabifyWord(word: string) {
  if (!vowelPattern.test(word)) return word;

  const chars = [...word];
  const nuclei: Array<{ start: number; end: number }> = [];

  for (let index = 0; index < chars.length; index += 1) {
    if (!vowelPattern.test(chars[index])) continue;
    const pair = `${chars[index]}${chars[index + 1] ?? ""}`;
    const isPair = vowelPairPattern.test(pair) && ["au", "eu"].includes(pair);
    nuclei.push({ start: index, end: isPair ? index + 1 : index });
    if (isPair) index += 1;
  }

  if (nuclei.length < 2) return word;

  const boundaries: number[] = [];
  for (let index = 0; index < nuclei.length - 1; index += 1) {
    const current = nuclei[index];
    const next = nuclei[index + 1];
    const consonants = chars.slice(current.end + 1, next.start).join("");

    if (consonants.length <= 1) {
      boundaries.push(current.end + 1);
      continue;
    }

    const lastTwo = consonants.slice(-2);
    const onsetLength = onsetClusters.has(lastTwo) ? 2 : 1;
    boundaries.push(next.start - onsetLength);
  }

  const syllables: string[] = [];
  let start = 0;
  boundaries.forEach((boundary) => {
    const safeBoundary = Math.max(start + 1, boundary);
    syllables.push(chars.slice(start, safeBoundary).join(""));
    start = safeBoundary;
  });
  syllables.push(chars.slice(start).join(""));

  return syllables.filter(Boolean).join("-");
}

export function getLatinPronunciation(term: string): LatinPronunciation {
  const appliedRules = new Set<string>();
  const spokenTerm = term.replace(/\b([CTLS])(\d+)\b/gi, (_match, region: string, level: string) => {
    const regionNames: Record<string, string> = { c: "se", t: "te", l: "le", s: "se" };
    appliedRules.add("omurga düzeyi Türkçe okunur");
    return `${regionNames[region.toLowerCase()]} ${level}`;
  });
  const tokens = spokenTerm.match(/[A-Za-zÀ-ž]+|\d+|[^A-Za-zÀ-ž\d]+/g) ?? [spokenTerm];

  const phonetic = tokens
    .map((token) => {
      if (/^[A-Za-zÀ-ž]+$/.test(token)) return pronounceWord(token, appliedRules);
      return token;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();

  const syllabified = phonetic
    .split(/\s+/)
    .map((word) => syllabifyWord(word))
    .join(" ");

  return {
    phonetic,
    syllabified,
    appliedRules: [...appliedRules],
  };
}
