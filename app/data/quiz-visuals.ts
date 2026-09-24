import type { AnatomyItem } from "./anatomy";

export type QuizVisual = {
  key: string;
  src: string;
  source: string;
  sourceUrl: string;
  alt: string;
  mirror?: boolean;
};

const commons = (fileName: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName).replace(/%20/g, "_")}`;
const isRight = (item: AnatomyItem) => /\bdexter|\bdextra|\bdextrum/i.test(item.latin) || /^Sağ\b/i.test(item.turkish);

const visual = (
  item: AnatomyItem,
  key: string,
  src: string,
  fileName: string,
  source: string,
  mirror = false,
): QuizVisual => ({
  key,
  src,
  source,
  sourceUrl: commons(fileName),
  alt: `${item.turkish} için doğrulanmış anatomik görsel`,
  mirror,
});

export function getQuizVisual(item: AnatomyItem): QuizVisual | null {
  const latin = item.latin.trim();

  // Numaralı kaburga, falanks ve benzeri ayrıntılara genel iskelet görseli atanmaz.
  // Yalnızca görselin yapıyı güvenle temsil ettiği ana yapılar bu kataloğa girer.
  if (item.category === "bones" && /^Humerus\b/i.test(latin)) {
    return visual(
      item,
      "humerus",
      "https://upload.wikimedia.org/wikipedia/commons/3/3f/Left_humerus_-_anterior_view.png",
      "Left humerus - anterior view.png",
      "Anatomography / Wikimedia Commons · CC BY-SA",
      isRight(item),
    );
  }

  if (item.category === "bones" && /^Femur\b/i.test(latin)) {
    return visual(
      item,
      "femur",
      "https://upload.wikimedia.org/wikipedia/commons/1/14/Morris'_human_anatomy_(1898)_-_Fig_158.png",
      "Morris' human anatomy (1898) - Fig 158.png",
      "Morris' Human Anatomy / Wikimedia Commons · kamu malı",
      isRight(item),
    );
  }

  if (item.category === "bones" && /^Scapula\b/i.test(latin)) {
    return visual(
      item,
      "scapula",
      "https://upload.wikimedia.org/wikipedia/commons/1/19/Left_Scapula.jpg",
      "Left Scapula.jpg",
      "Gray's Anatomy / Wikimedia Commons · kamu malı",
      isRight(item),
    );
  }

  if (item.category === "bones" && /^Clavicula\b/i.test(latin)) {
    return visual(
      item,
      "clavicle",
      "https://upload.wikimedia.org/wikipedia/commons/8/82/Clavicle_-_anterior_view.png",
      "Clavicle - anterior view.png",
      "Anatomography / Wikimedia Commons · CC BY-SA",
    );
  }

  if (item.category === "bones" && /^Patella\b/i.test(latin)) {
    return visual(
      item,
      "patella",
      "https://upload.wikimedia.org/wikipedia/commons/1/18/Patella_ant.jpg",
      "Patella ant.jpg",
      "Wikimedia Commons · kamu malı",
      isRight(item),
    );
  }

  if (item.category === "nervous" && /^(Encephalon|Cerebrum)$/i.test(latin)) {
    return visual(
      item,
      "brain",
      "https://upload.wikimedia.org/wikipedia/commons/f/fd/Brain_Lateral_(NIH_BioArt_60).svg",
      "Brain Lateral (NIH BioArt 60).svg",
      "NIAID / Wikimedia Commons · kamu malı",
    );
  }

  if (item.category === "circulatory" && /^Cor$/i.test(latin)) {
    return visual(
      item,
      "heart",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Diagram_of_the_human_heart_%28no_labels%29.svg/1920px-Diagram_of_the_human_heart_%28no_labels%29.svg.png",
      "Diagram of the human heart (no labels).svg",
      "Wikimedia Commons · kalp anatomisi",
    );
  }

  if (item.category === "respiratory" && /^Pulmo (dexter|sinister)$/i.test(latin)) {
    return visual(
      item,
      "lungs",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Lungs_diagram_simple.svg/1920px-Lungs_diagram_simple.svg.png",
      "Lungs diagram simple.svg",
      "Wikimedia Commons · akciğer anatomisi",
    );
  }

  if (item.category === "urinary" && /^Ren (dexter|sinister)$/i.test(latin)) {
    return visual(
      item,
      "kidney",
      "https://upload.wikimedia.org/wikipedia/commons/f/fd/Kidney.svg",
      "Kidney.svg",
      "Flac / Wikimedia Commons · CC BY-SA",
      isRight(item),
    );
  }

  if (item.category === "urinary" && /^Vesica urinaria$/i.test(latin)) {
    return visual(
      item,
      "urinary-system",
      "https://upload.wikimedia.org/wikipedia/commons/3/30/Urinary_system.svg",
      "Urinary system.svg",
      "Jmarchn / Wikimedia Commons · CC BY-SA",
    );
  }

  if (item.category === "digestive" && /^Hepar$/i.test(latin)) {
    return visual(
      item,
      "liver",
      "https://upload.wikimedia.org/wikipedia/commons/d/d4/Liver.svg",
      "Liver.svg",
      "Mikael Häggström / Wikimedia Commons · kamu malı",
    );
  }

  if (item.category === "digestive" && /^Ventriculus$/i.test(latin)) {
    return visual(
      item,
      "stomach",
      "https://upload.wikimedia.org/wikipedia/commons/e/e0/Stomach_diagram.svg",
      "Stomach diagram.svg",
      "Wikimedia Commons · kamu malı",
    );
  }

  if (item.category === "digestive" && /^Pancreas$/i.test(latin)) {
    return visual(
      item,
      "pancreas",
      "https://upload.wikimedia.org/wikipedia/commons/1/12/Pancreas_2.png",
      "Pancreas 2.png",
      "Mikael Häggström / Wikimedia Commons · kamu malı",
    );
  }

  if (item.category === "digestive" && /^Lien$/i.test(latin)) {
    return visual(
      item,
      "spleen",
      "https://upload.wikimedia.org/wikipedia/commons/8/80/Spleen.gif",
      "Spleen.gif",
      "Mikael Häggström / Wikimedia Commons · kamu malı",
    );
  }

  if (item.category === "digestive" && /^Intestinum (tenue|crassum)$/i.test(latin)) {
    return visual(
      item,
      "intestines",
      "https://upload.wikimedia.org/wikipedia/commons/e/e2/Stomach_colon_rectum_diagram_unlabeled.svg",
      "Stomach colon rectum diagram unlabeled.svg",
      "Wikimedia Commons · sindirim sistemi şeması",
    );
  }

  if (item.category === "genital" && /^Uterus$/i.test(latin)) {
    return visual(
      item,
      "female-reproductive",
      "https://upload.wikimedia.org/wikipedia/commons/8/85/Female_genital_system.svg",
      "Female genital system.svg",
      "University of Geneva / Wikimedia Commons · CC BY-SA",
    );
  }

  if (item.category === "endocrine" && /^Glandula thyroidea$/i.test(latin)) {
    return visual(
      item,
      "thyroid",
      "https://upload.wikimedia.org/wikipedia/commons/d/d1/Thyroid_system.svg",
      "Thyroid system.svg",
      "Wikimedia Commons · tiroid anatomisi",
    );
  }

  if (item.category === "sensory" && /^Bulbus oculi$/i.test(latin)) {
    return visual(
      item,
      "eye",
      "https://upload.wikimedia.org/wikipedia/commons/a/a4/Diagram_of_human_eye_without_labels.svg",
      "Diagram of human eye without labels.svg",
      "Wikimedia Commons · göz anatomisi",
    );
  }

  return null;
}
