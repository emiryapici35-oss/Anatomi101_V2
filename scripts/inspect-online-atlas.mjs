import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { createHash } from "node:crypto";
const files = process.argv.length > 2 ? process.argv.slice(2) : [
  "Diagram showing the parts of the brain CRUK 476.svg",
  "Central nervous system 2.svg",
  "Diagram showing the parts of the female reproductive system CRUK 327.svg",
  "Blausen 0399 FemaleReproSystem tr.svg",
  "Diagram of the male urinary system CRUK 042.svg",
];
await mkdir("artifacts/online-atlas", { recursive: true });
const results = [];
for (const file of files) {
  const index = createHash("sha256").update(file).digest("hex").slice(0, 12);
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.search = new URLSearchParams({ action: "query", format: "json", prop: "imageinfo", iiprop: "url|size|extmetadata", titles: `File:${file}` });
  const response = await fetch(api, { signal: AbortSignal.timeout(30000) });
  const page = Object.values((await response.json()).query.pages)[0];
  const info = page.imageinfo?.[0];
  if (!info) { console.log("NOT FOUND", file); continue; }
  const original = await fetch(info.url, { signal: AbortSignal.timeout(30000) });
  if (!original.ok) throw new Error(`${file}: ${original.status}`);
  const bytes = Buffer.from(await original.arrayBuffer());
  const extension = new URL(info.url).pathname.toLowerCase().endsWith(".png") ? "png" : "svg";
  await writeFile(`artifacts/online-atlas/${index}.${extension}`, bytes);
  await sharp(bytes, { density: 144 }).resize({ width: 900 }).png().toFile(`artifacts/online-atlas/${index}.png`);
  results.push({ file, index, extension, ...info });
  await writeFile(`artifacts/online-atlas/${index}.json`, JSON.stringify({ file, index, extension, ...info }, null, 2));
  console.log(index, file);
}
await writeFile("artifacts/online-atlas/candidates.json", JSON.stringify(results, null, 2));
