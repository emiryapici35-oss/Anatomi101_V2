import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// This archived edition was published under CC BY 4.0.
const revision = "b0058a743bdd2cc08196abaaa7d5469970c0d80c";
const repository = "openstax/osbooks-anatomy-physiology";
const directory = "artifacts/openstax";
const base = `https://raw.githubusercontent.com/${repository}/${revision}/`;
await mkdir(directory, { recursive: true });
async function download(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (response.ok) return Buffer.from(await response.arrayBuffer());
    if (![429, 502, 503].includes(response.status)) throw new Error(`${response.status}: ${url}`);
    await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 3000));
  }
  throw new Error(`Download failed: ${url}`);
}
let tree;
try { tree = JSON.parse(await readFile(`${directory}/tree.json`, "utf8")); }
catch {
  tree = JSON.parse(await download(`https://api.github.com/repos/${repository}/git/trees/${revision}?recursive=1`));
  await writeFile(`${directory}/tree.json`, JSON.stringify(tree, null, 2));
}
const license = await download(`${base}LICENSE`);
if (!license.toString().startsWith("Attribution 4.0 International")) throw new Error("Unexpected source license");
await writeFile(`${directory}/LICENSE.txt`, license);
const prefixes = process.argv.slice(2);
const files = tree.tree.filter(file => file.path.startsWith("media/") && prefixes.some(prefix => path.basename(file.path).startsWith(prefix)));
const index = [];
for (const file of files) {
  const name = path.basename(file.path);
  const destination = `${directory}/${name}`;
  try { await access(destination); } catch { await writeFile(destination, await download(base + encodeURI(file.path))); }
  const metadata = await sharp(destination).metadata();
  index.push({ name, width: metadata.width, height: metadata.height, original: base + encodeURI(file.path), page: `https://github.com/${repository}/blob/${revision}/${file.path}`, revision, license: "CC BY 4.0", author: "OpenStax, Rice University" });
  console.log(name);
}
const old = JSON.parse(await readFile(`${directory}/index.json`, "utf8").catch(() => "[]"));
const combined = [...new Map([...old, ...index].map(item => [item.name, item])).values()];
await writeFile(`${directory}/index.json`, JSON.stringify(combined, null, 2));
if (prefixes.includes("--modules")) {
  await mkdir(`${directory}/modules`, { recursive: true });
  for (const file of tree.tree.filter(file => /^modules\/[^/]+\/index.cnxml$/.test(file.path))) {
    const destination = `${directory}/modules/${file.path.split("/")[1]}.xml`;
    try { await access(destination); } catch { await writeFile(destination, await download(base + file.path)); }
  }
}
console.log(`${combined.length} source images cached.`);
