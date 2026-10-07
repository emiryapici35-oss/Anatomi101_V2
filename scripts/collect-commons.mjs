import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

const directory = "artifacts/commons";
await mkdir(directory, { recursive: true });
const index = JSON.parse(await readFile(`${directory}/index.json`, "utf8").catch(() => "[]"));
for (const name of process.argv.slice(2)) {
  if (index.some(entry => entry.name === name)) continue;
  const query = new URLSearchParams({ action: "query", format: "json", prop: "imageinfo", iiprop: "url|size|extmetadata", titles: `File:${name}` });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${query}`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Commons: ${response.status}`);
  const page = Object.values((await response.json()).query.pages)[0];
  const info = page.imageinfo?.[0];
  if (!info) { console.log(`NOT FOUND: ${name}`); continue; }
  const original = await fetch(info.url, { signal: AbortSignal.timeout(30000) });
  if (!original.ok) throw new Error(`${name}: ${original.status}`);
  const bytes = Buffer.from(await original.arrayBuffer());
  const id = createHash("sha256").update(name).digest("hex").slice(0, 12);
  const extension = path.extname(new URL(info.url).pathname).toLowerCase();
  const file = `${id}${extension}`;
  await writeFile(`${directory}/${file}`, bytes);
  await sharp(bytes).resize({ width: 1100, withoutEnlargement: true }).png().toFile(`${directory}/${id}-review.png`);
  index.push({ name, file, ...info });
  await writeFile(`${directory}/index.json`, JSON.stringify(index, null, 2));
  console.log(name, id, info.extmetadata.LicenseShortName?.value);
}
