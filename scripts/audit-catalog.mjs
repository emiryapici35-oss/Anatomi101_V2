import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = await mkdtemp(path.join(tmpdir(), "anatomy101-catalog-"));
const categories = [
  "bones",
  "joints",
  "muscles",
  "nervous",
  "circulatory",
  "respiratory",
  "digestive",
  "urinary",
  "genital",
  "endocrine",
  "sensory",
];

try {
  const compiler = path.join(root, "node_modules", "typescript", "bin", "tsc");
  const compilation = spawnSync(
    process.execPath,
    [
      compiler,
      "app/data/anatomy.ts",
      "app/data/expanded-anatomy.ts",
      "app/data/quiz-visuals.ts",
      "app/lib/quiz.ts",
      "--outDir",
      outputDir,
      "--rootDir",
      "app",
      "--module",
      "commonjs",
      "--target",
      "es2022",
      "--esModuleInterop",
      "--skipLibCheck",
    ],
    { cwd: root, stdio: "inherit" },
  );

  if (compilation.status !== 0) {
    throw new Error("Katalog TypeScript derlemesi başarısız oldu.");
  }

  const catalog = require(path.join(outputDir, "data", "anatomy.js"));
  const quiz = require(path.join(outputDir, "lib", "quiz.js"));
  const failures = catalog.validateAnatomyCatalog();
  const warnings = [];

  for (const category of categories) {
    const count = catalog.catalogCounts[category] ?? 0;
    if (count < 5) failures.push(`${category}: quiz üretmek için en az 5 yapı gerekir; ${count} bulundu.`);

    const pool = catalog.anatomyItems.filter((item) => item.category === category);
    const classicQuestions = quiz.buildQuestions(pool, Math.min(20, pool.length));
    if (classicQuestions.length !== Math.min(20, pool.length)) {
      failures.push(`${category}: klasik quiz beklenen soru sayısını üretmedi.`);
    }
    const invalidQuestion = classicQuestions.find((question) => {
      const optionTerms = new Set(question.options.map((option) => option.latin));
      return question.options.length !== 5 || optionTerms.size !== 5 || !question.options.some((option) => option.id === question.item.id);
    });
    if (invalidQuestion) failures.push(`${category}: ${invalidQuestion.item.id} için 5 benzersiz ve doğru cevabı içeren şık üretilemedi.`);

    const speedQuestions = quiz.buildSpeedQuestions(pool);
    if (speedQuestions.length < 180) failures.push(`${category}: hız turu için 180 soruluk havuz üretilemedi.`);
  }

  const duplicateTranslations = new Map();
  for (const item of catalog.anatomyItems) {
    const key = `${item.category}:${catalog.normalize(item.turkish)}`;
    duplicateTranslations.set(key, [...(duplicateTranslations.get(key) ?? []), item.latin]);
  }
  for (const [key, terms] of duplicateTranslations) {
    if (terms.length > 1) warnings.push(`${key} → ${terms.join(" / ")}`);
  }

  console.log(`\nAnatomi 101 katalog sürümü: ${catalog.catalogVersion}`);
  console.table(
    Object.fromEntries(categories.map((category) => [category, catalog.catalogCounts[category]])),
  );
  console.log(`Toplam yapı: ${catalog.anatomyItems.length}`);

  if (warnings.length) {
    console.warn(`\nBilgilendirme: ${warnings.length} Türkçe ad birden fazla Latince terimde kullanılıyor.`);
    console.warn(warnings.slice(0, 12).map((warning) => `- ${warning}`).join("\n"));
    if (warnings.length > 12) console.warn(`- … ve ${warnings.length - 12} kayıt daha`);
  }

  if (failures.length) {
    console.error(`\nKatalog denetimi başarısız:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
    process.exitCode = 1;
  } else {
    console.log("\nKatalog ve quiz denetimi geçti (benzersiz kimlik/terim, koordinat, 206 kemik ve 5 şık)." );
  }
} finally {
  await rm(outputDir, { recursive: true, force: true });
}
