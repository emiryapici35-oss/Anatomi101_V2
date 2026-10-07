import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Group, Mesh, MeshStandardMaterial } from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeVertices, mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { unzipSync } from "three/addons/libs/fflate.module.js";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { meshopt, simplify } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cache = path.join(root, "artifacts/bodyparts3d");
await mkdir(cache, { recursive: true });
const sourceRoot = "https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/";
async function cached(name) {
  try { return await readFile(path.join(cache, name)); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const response = await fetch(sourceRoot + name, { signal: AbortSignal.timeout(300_000) });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(path.join(cache, name), bytes);
  return bytes;
}
const compilation = spawnSync(process.execPath, [path.join(root, "node_modules/typescript/bin/tsc"), "app/data/anatomy.ts", "--outDir", "artifacts/muscle-catalog", "--module", "commonjs", "--target", "es2022", "--skipLibCheck"], { cwd: root, stdio: "inherit" });
if (compilation.status) throw new Error("Catalog compilation failed");
const { anatomyItems } = createRequire(import.meta.url)(path.join(root, "artifacts/muscle-catalog/anatomy.js"));
const items = anatomyItems.filter((item) => item.category === "muscles");
const labels = new Map((await cached("parts_list_e.txt")).toString("utf8").trim().split(/\r?\n/).slice(1).map((line) => line.split("\t")));
const byLabel = new Map([...labels].map(([id, name]) => [name.trim().toLowerCase(), id]));
const composites = new Map();
for (const line of (await cached("composite_parts.txt")).toString("utf8").trim().split(/\r?\n/).slice(1)) {
  const [parent, , child] = line.split("\t");
  if (!composites.has(parent)) composites.set(parent, new Set());
  composites.get(parent).add(child);
}
const zip = await cached("BodyParts3D_3.0_obj_99.zip");
const available = new Set();
unzipSync(zip, { filter: file => {
  if (file.name.endsWith(".obj")) available.add(path.basename(file.name, ".obj"));
  return false;
} });

// Explicit nomenclature translations, never fuzzy anatomical matching.
const bases = {
  "sternocleidomastoideus": "sternocleidomastoid", "stylohyoideus": "stylohyoid", "mylohyoideus": "mylohyoid", "digastricus": "digastric", "omohyoideus": "omohyoid",
  "geniohyoideus": "geniohyoid", "sternohyoideus": "sternohyoid", "sternothyroideus": "sternothyroid", "thyrohyoideus": "thyrohyoid",
  "rhomboideus minor": "rhomboid minor", "rhomboideus major": "rhomboid major", "deltoideus": "deltoid",
  "pterygoideus medialis": "medial pterygoid", "pterygoideus lateralis": "lateral pterygoid",
  "obliquus externus abdominis": "external oblique", "obliquus externus": "external oblique", "obliquus internus abdominis": "internal oblique",
  "obturatorius internus": "obturator internus", "obturatorius externus": "obturator externus", "quadratus plantae": "flexor accessorius",
  "sphincter ani externus": "external anal sphincter", "diaphragma": "diaphragm",
};
const modifiers = {
  "pars orbitalis": "orbital part", "pars palpebralis": "palpebral part", "pars superficialis": "superficial part", "pars profunda": "deep part",
  "pars clavicularis": "clavicular part", "pars acromialis": "acromial part", "pars spinalis": "spinal part", "pars sternocostalis": "sternocostal part", "pars abdominalis": "abdominal part",
  "pars descendens": "descending part", "pars transversa": "transverse part", "pars ascendens": "ascending part",
  "pars obliqua superior": "superior oblique part", "pars obliqua inferior": "inferior oblique part", "pars recta": "vertical intermediate part",
  "caput longum": "long head", "caput breve": "short head", "caput mediale": "medial head", "caput laterale": "lateral head",
  "caput superius": "upper head", "caput inferius": "lower head", "caput humerale": "humeral head", "caput ulnare": "ulnar head",
  "caput humeroulnare": "humeroulnar head", "caput radiale": "radial head", "caput superficiale": "superficial head", "caput profundum": "deep head",
  "caput obliquum": "oblique head", "caput transversum": "transverse head", "venter anterior": "anterior belly", "venter posterior": "posterior belly",
};

function sourceNames(latin) {
  let value = latin.toLowerCase().replace(/^muscul(?:us|i) /, "");
  const sideMatch = value.match(/ (dexter|dextra|dextrum|dextri|sinister|sinistra|sinistrum|sinistri)$/);
  const side = sideMatch ? sideMatch[1].startsWith("dext") ? "right" : "left" : "";
  if (sideMatch) value = value.slice(0, -sideMatch[0].length);
  let [base, modifier] = value.split(/,\s*/);
  if (base === "occipitofrontalis") { base = modifier === "venter frontalis" ? "frontalis" : "occipitalis"; modifier = undefined; }
  if (base === "levator ani") { base = { "pars puborectalis": "puborectalis", "pars pubococcygea": "pubococcygeus", "pars iliococcygea": "iliococcygeus" }[modifier]; modifier = undefined; }
  base = bases[base] ?? base;
  if (modifier && !modifiers[modifier]) return [];
  const ordinal = { primus: "first", secundus: "second", tertius: "third", quartus: "fourth" };
  const digit = base.match(/^(lumbricalis|interosseus dorsalis|interosseus palmaris|interosseus plantaris) (primus|secundus|tertius|quartus)(?: (manus|pedis))?$/);
  if (digit) {
    const [, muscle, number, region] = digit;
    const kind = muscle === "lumbricalis" ? "lumbrical" : { "interosseus dorsalis": "dorsal interosseous", "interosseus palmaris": "palmar interosseous", "interosseus plantaris": "plantar interosseous" }[muscle];
    return [`${ordinal[number]} ${kind} of ${side ? side + " " : ""}${region === "pedis" || muscle === "interosseus plantaris" ? "foot" : "hand"}`];
  }
  const limb = base.match(/^(.*?) (manus|pedis)$/);
  let name = limb ? `${limb[1]} of ${side ? side + " " : ""}${limb[2] === "manus" ? "hand" : "foot"}` : `${side ? side + " " : ""}${base}`;
  if (base === "opponens digiti minimi") name = `opponens digiti minimi of ${side ? side + " " : ""}hand`;
  if (modifier) name = `${modifiers[modifier]} of ${name}`;
  return [name, `${name} muscle`, `set of ${name}`];
}

const mappings = {};
const exact = new Map();
const unsupported = [];
function leavesOf(fma) {
  if (!fma) return [];
  if (available.has(fma)) return [fma];
  if (fma === "FMA38507") return ["BP45", "BP47"];
  if (fma === "FMA38508") return ["BP44", "BP46"];
  return [...(composites.get(fma) ?? [])].filter((id) => available.has(id) && !/ligament|tendon|aponeurosis|retinaculum/i.test(labels.get(id) ?? ""));
}
for (const item of items) {
  const candidates = sourceNames(item.latin);
  const fma = candidates.map((name) => byLabel.get(name)).find(Boolean);
  let leaves = leavesOf(fma);
  if (!leaves.length && fma && !/ (dexter|sinister)$/.test(item.latin)) {
    const sides = ["dexter", "sinister"].map(side => sourceNames(`${item.latin} ${side}`).map(name => byLabel.get(name)).find(Boolean));
    if (sides.every(Boolean)) leaves = sides.flatMap(leavesOf);
  }
  if (!leaves.length) { unsupported.push({ id: item.id, latin: item.latin, candidates }); continue; }
  mappings[item.id] = [...new Set(leaves)].map((id) => id.toLowerCase());
  if (available.has(fma)) exact.set(fma.toLowerCase(), item.id);
}
const used = new Set(Object.values(mappings).flat());
const parts = [...used].sort().map((id) => ({
  mesh: id, fma: id.toUpperCase(), name: labels.get(id.toUpperCase()),
  itemId: exact.get(id) ?? Object.entries(mappings).filter(([, ids]) => ids.includes(id)).sort((a, b) => a[1].length - b[1].length)[0][0],
}));
const report = { catalog: items.length, mapped: Object.keys(mappings).length, meshes: parts.length, unsupported };
await writeFile(path.join(root, "artifacts/muscle-coverage.json"), JSON.stringify(report, null, 2));
console.log(`Catalog ${items.length}; mapped ${report.mapped}; separate meshes ${parts.length}; unsupported ${unsupported.length}`);
if (process.argv.includes("--audit")) process.exit(0);

console.log("Loading official OBJ 99 archive...");
const contextParts = [...(composites.get("FMA23881") ?? [])].filter(id => available.has(id)).map(fma => ({ fma, mesh: `context_${fma.toLowerCase()}`, name: labels.get(fma), context: true }));
const allParts = [...parts, ...contextParts];
const wanted = new Set(allParts.map((part) => `${part.fma}.obj`));
const files = unzipSync(zip, { filter: (file) => wanted.has(path.basename(file.name)) });
const objects = new Map(Object.entries(files).map(([name, data]) => [path.basename(name), data]));
const group = new Group();
group.name = "BodyParts3D_muscles";
group.userData = { author: "BodyParts3D, The Database Center for Life Science", source: sourceRoot, license: "CC BY 4.0", changes: "OBJ 99 to indexed GLB; recomputed smooth normals; Z-up to Y-up; mm to meters; meshoptimizer simplification (ratio 0.35, error 0.001), quantization and compression. Original anatomical positions retained." };
const material = new MeshStandardMaterial({ color: 0xb46463, roughness: 0.72 });
const provenance = [];
let triangles = 0;
for (const part of allParts) {
  const bytes = objects.get(`${part.fma}.obj`);
  if (!bytes) throw new Error(`Missing archive entry ${part.fma}`);
  const object = new OBJLoader().parse(new TextDecoder().decode(bytes));
  const geometries = [];
  object.traverse((node) => { if (node.isMesh) { node.geometry.deleteAttribute("normal"); node.geometry.deleteAttribute("uv"); geometries.push(node.geometry); } });
  const original = mergeGeometries(geometries);
  const geometry = mergeVertices(original, 0.0001);
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);
  geometry.scale(0.001, 0.001, 0.001);
  const mesh = new Mesh(geometry, material);
  mesh.name = part.mesh;
  mesh.userData = { fma: part.fma, anatomyId: part.itemId, sourceName: part.name, context: part.context ?? false };
  group.add(mesh);
  triangles += geometry.index.count / 3;
  provenance.push({ ...part, sha256: createHash("sha256").update(bytes).digest("hex"), triangles: geometry.index.count / 3 });
  geometries.forEach((geometry) => geometry.dispose());
  original.dispose();
}
globalThis.FileReader = class { readAsArrayBuffer(blob) { blob.arrayBuffer().then((result) => { this.result = result; this.onloadend?.(); }); } };
const glb = await new GLTFExporter().parseAsync(group, { binary: true });
await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const document = await io.readBinary(new Uint8Array(glb));
await document.transform(simplify({ simplifier: MeshoptSimplifier, ratio: 0.35, error: 0.001 }), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
const optimized = await io.writeBinary(document);
await writeFile(path.join(root, "public/models/muscles.glb"), optimized);
await writeFile(path.join(root, "public/models/muscles-provenance.json"), JSON.stringify({ ...group.userData, archive: sourceRoot + "BodyParts3D_3.0_obj_99.zip", archiveSha256: createHash("sha256").update(zip).digest("hex"), parts: provenance }, null, 2) + "\n");
await writeFile(path.join(root, "app/data/muscle-model.json"), JSON.stringify({ mappings, parts, coverage: { catalog: items.length, mapped: report.mapped, meshes: parts.length } }, null, 2) + "\n");
console.log(`Built muscles.glb: ${(optimized.byteLength / 1e6).toFixed(1)} MB (source ${(glb.byteLength / 1e6).toFixed(1)} MB); ${triangles} source triangles; ${parts.length} muscle meshes.`);
