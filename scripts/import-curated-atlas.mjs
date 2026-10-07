import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { curatedAtlas } from "./curated-atlas.mjs";
import { textbookAtlas } from "./textbook-atlas.mjs";
import path from "node:path";
import sharp from "sharp";
import { sourceLabel } from "./atlas-source-labels.mjs";

const compilation = spawnSync(process.execPath, ["node_modules/typescript/bin/tsc", "app/data/anatomy.ts", "--outDir", "artifacts/image-catalog", "--module", "commonjs", "--target", "es2022", "--skipLibCheck"], { stdio: "inherit" });
if (compilation.status) throw new Error("Catalog compilation failed");
const { anatomyItems } = createRequire(import.meta.url)("../artifacts/image-catalog/anatomy.js");
const sources = JSON.parse(await readFile("artifacts/servier/index.json", "utf8"));
const textbooks = JSON.parse(await readFile("artifacts/openstax/index.json", "utf8"));
const commons = JSON.parse(await readFile("artifacts/commons/index.json", "utf8"));
const plates = [];
await mkdir("public/atlas", { recursive: true });
for (const definition of [...textbookAtlas(anatomyItems), ...curatedAtlas]) {
  const parts = definition.items.map(([id, point]) => {
    const item = anatomyItems.find(item => item.id === id);
    if (!item) throw new Error(`Unknown anatomy: ${id}`);
    return { id, latin: item.latin, turkish: item.turkish, point, category: item.category, group: item.group };
  });
  const { category, group } = parts[0] ?? definition;
  if (parts.some(part => part.category !== category || part.group !== group)) throw new Error(`Cross-menu image: ${definition.source}`);
  let file, source, width, height, assetName = definition.source;
  if (definition.provider === "commons") {
    const info = commons.find(info => info.name === definition.image);
    if (!info) throw new Error(`Missing Commons source: ${definition.image}`);
    const license = info.extmetadata.LicenseShortName.value;
    if (!["Public domain", "CC BY 4.0", "CC BY-SA 3.0"].includes(license)) throw new Error(`Unreviewed license: ${license}`);
    const authors = {
      "Spinal cord details.jpg": "Sheryl Tan; Faull L; Curtis A",
      "Brachial plexus color.svg": "Selket; Marshall Strother (mcstrother)",
    };
    const author = authors[info.name] ?? (info.name.startsWith("Gray") ? "Henry Vandyke Carter; Henry Gray" : info.name.startsWith("Sobo") ? "Johannes Sobotta" : null);
    if (!author) throw new Error(`Review author: ${info.name}`);
    file = `artifacts/commons/${info.file}`;
    width = info.width; height = info.height;
    assetName = `commons-${path.parse(info.name).name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    source = { name: info.name.startsWith("Gray") ? "Gray's Anatomy · Wikimedia Commons" : "Wikimedia Commons", author, page: info.descriptionurl, original: info.url, license, licenseUrl: info.extmetadata.LicenseUrl?.value ?? `${info.descriptionurl}#Licensing`, changes: "Original drawing unchanged; application labels added separately." };
  } else if (definition.provider === "openstax") {
    const candidates = textbooks.filter(info => info.name.startsWith(definition.image));
    if (candidates.length !== 1) throw new Error(`Ambiguous source: ${definition.image}`);
    const info = candidates[0];
    file = `artifacts/openstax/${info.name}`;
    width = info.width; height = info.height;
    assetName = `openstax-${path.parse(info.name).name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    source = { name: "OpenStax Anatomy & Physiology", author: info.author, page: info.page, original: info.original, license: info.license, licenseUrl: "https://creativecommons.org/licenses/by/4.0/", licenseArchive: `https://github.com/openstax/osbooks-anatomy-physiology/blob/${info.revision}/LICENSE`, changes: "Original drawing unchanged; application labels added separately." };
  } else if (definition.commons) {
    const info = JSON.parse(await readFile(`artifacts/online-atlas/${definition.commons}.json`, "utf8"));
    if (info.extmetadata.LicenseShortName.value !== "CC0") throw new Error("Review Commons license before importing");
    file = `artifacts/online-atlas/${definition.commons}.svg`;
    width = info.width; height = info.height;
    source = { name: "Wikimedia Commons", author: "Mikael Häggström; LadyofHats", page: info.descriptionurl, original: info.url, license: "CC0 1.0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/", changes: "Original drawing unchanged; application labels added separately." };
  } else {
    const info = sources.find(source => source.page === `https://smart.servier.com/smart_image/${definition.source}/`);
    if (!info) throw new Error(`Unreviewed source: ${definition.source}`);
    file = `artifacts/servier/${info.id}.png`;
    width = info.width; height = info.height;
    source = { name: "Servier Medical Art", author: "Servier", page: info.page, original: info.image, license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", changes: "Original drawing unchanged; application labels added separately." };
  }
  const src = `/atlas/source-${assetName}${path.extname(file).toLowerCase()}`;
  const bytes = await readFile(file);
  // Decoding, rather than metadata alone, rejects truncated source images.
  await sharp(bytes).resize({ width: 64 }).raw().toBuffer();
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  await copyFile(file, `public${src}`);
  const id = `${assetName}-${createHash("sha256").update(`${category}/${group}`).digest("hex").slice(0, 8)}`;
  plates.push({ id, title: definition.title, category, group, src, width, height, schematic: definition.schematic ?? false, source: { ...source, sha256 }, items: parts.map(({ id, latin, turkish, point }) => ({ id, latin, turkish, point, sourceLabel: definition.provider === "openstax" ? sourceLabel(latin) : null })) });
}
const items = anatomyItems.filter(item => !["bones", "joints", "muscles"].includes(item.category));
const represented = new Set(plates.flatMap(plate => plate.items.map(item => item.id)));
const groups = Object.values(Object.groupBy(items, item => `${item.category}/${item.group}`)).map(members => ({ category: members[0].category, group: members[0].group, total: members.length, mapped: members.filter(item => represented.has(item.id)).length, plates: plates.filter(plate => plate.category === members[0].category && plate.group === members[0].group).length }));
if (new Set(plates.map(plate => plate.id)).size !== plates.length) throw new Error("Duplicate plate id");
if (groups.some(group => !group.plates)) throw new Error("A submenu has no reference image");
const manifest = { coverage: { catalog: items.length, mapped: represented.size, groups }, plates };
await writeFile("app/data/image-atlas.json", JSON.stringify(manifest, null, 2) + "\n");
await writeFile("public/atlas/provenance.json", JSON.stringify({ assets: plates.map(({ id, src, source }) => ({ id, src, ...source })) }, null, 2) + "\n");
console.log(`${new Set(plates.map(plate => plate.src)).size} original sources in ${plates.length} plates; ${represented.size}/${items.length} structures; ${groups.filter(group => group.plates).length}/${groups.length} groups.`);
