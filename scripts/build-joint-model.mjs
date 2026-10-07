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
const source = "https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20110915/";
await mkdir(cache, { recursive: true });
async function cached(name) {
  try { return await readFile(path.join(cache, name)); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const response = await fetch(source + name, { signal: AbortSignal.timeout(300_000) });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(path.join(cache, name), bytes);
  return bytes;
}

const compilation = spawnSync(process.execPath, [path.join(root, "node_modules/typescript/bin/tsc"), "app/data/anatomy.ts", "--outDir", "artifacts/joint-catalog", "--module", "commonjs", "--target", "es2022", "--skipLibCheck"], { cwd: root, stdio: "inherit" });
if (compilation.status) throw new Error("Catalog compilation failed");
const { anatomyItems } = createRequire(import.meta.url)(path.join(root, "artifacts/joint-catalog/anatomy.js"));
const joints = anatomyItems.filter(item => item.category === "joints");
const labels = new Map((await cached("parts_list_e.txt")).toString("utf8").trim().split(/\r?\n/).slice(1).map(line => line.split("\t")));
const byName = new Map([...labels].map(([id, name]) => [name.toLowerCase(), id]));
const zip = await cached("BodyParts3D_3.0_obj_99.zip");
const available = new Set();
unzipSync(zip, { filter: file => { if (file.name.endsWith(".obj")) available.add(path.basename(file.name, ".obj")); return false; } });

const ordinals = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];
const vertebra = (region, number) => region === "cervical" && number === 1 ? "atlas" : region === "cervical" && number === 2 ? "axis" : `${ordinals[number - 1]} ${region} vertebra`;
const sided = (side, name) => `${side} ${name}`;
const foot = (side, name) => name === "navicular" ? `navicular bone of ${side} foot` : sided(side, name);
const finger = ["thumb", "index finger", "middle finger", "ring finger", "little finger"];
const toe = ["big toe", "second toe", "third toe", "fourth toe", "little toe"];
const phalanx = (side, segment, region, digit) => `${segment} phalanx of ${side} ${region === "hand" ? finger[digit - 1] : toe[digit - 1]}`;
const metapodial = (side, region, digit) => sided(side, `${ordinals[digit - 1]} ${region === "hand" ? "metacarpal" : "metatarsal"} bone`);
const disk = (region, number) => `intervertebral disk of ${vertebra(region, number)}`;
const sutures = {
  "sutura coronalis": [["frontal bone", "right parietal bone"], ["frontal bone", "left parietal bone"]],
  "sutura sagittalis": [["right parietal bone", "left parietal bone"]],
  "sutura lambdoidea": [["occipital bone", "right parietal bone"], ["occipital bone", "left parietal bone"]],
  "sutura squamosa": [["right temporal bone", "right parietal bone"], ["left temporal bone", "left parietal bone"]],
  "sutura frontonasalis": [["frontal bone", "right nasal bone"], ["frontal bone", "left nasal bone"]],
  "sutura internasalis": [["right nasal bone", "left nasal bone"]],
  "sutura nasomaxillaris": [["right nasal bone", "right maxilla"], ["left nasal bone", "left maxilla"]],
  "sutura frontomaxillaris": [["frontal bone", "right maxilla"], ["frontal bone", "left maxilla"]],
  "sutura zygomaticomaxillaris": [["right zygomatic bone", "right maxilla"], ["left zygomatic bone", "left maxilla"]],
  "sutura temporozygomatica": [["right temporal bone", "right zygomatic bone"], ["left temporal bone", "left zygomatic bone"]],
  "sutura palatina mediana": [["right palatine bone", "left palatine bone"]],
  "sutura palatina transversa": [["right palatine bone", "right maxilla"], ["left palatine bone", "left maxilla"]],
};
const handPairs = (side, mode) => Array.from({ length: mode === "mcp" ? 5 : 4 }, (_, i) => {
  const digit = mode === "mcp" ? i + 1 : i + 2;
  return mode === "mcp" ? [metapodial(side, "hand", digit), phalanx(side, "proximal", "hand", digit)]
    : mode === "pip" ? [phalanx(side, "proximal", "hand", digit), phalanx(side, "middle", "hand", digit)]
      : [phalanx(side, "middle", "hand", digit), phalanx(side, "distal", "hand", digit)];
});
const footPairs = (side, mode) => Array.from({ length: mode === "mtp" ? 5 : 4 }, (_, i) => {
  const digit = mode === "mtp" ? i + 1 : i + 2;
  return mode === "mtp" ? [metapodial(side, "foot", digit), phalanx(side, "proximal", "foot", digit)]
    : mode === "pip" ? [phalanx(side, "proximal", "foot", digit), phalanx(side, "middle", "foot", digit)]
      : [phalanx(side, "middle", "foot", digit), phalanx(side, "distal", "foot", digit)];
});

function regionOf(item) {
  const name = `${item.group} ${item.latin}`.toLowerCase();
  if (item.id === "art-intervertebrales" || item.id === "art-sacrococcygea") return "spine";
  if (item.id === "art-temporomandibularis") return "head";
  if (/atlanto|lumbosacral|sacrococcygea|intervertebr/.test(name)) return "spine";
  if (/kafa|baş ve kraniyo|temporomandibular|sutura|fonticulus/.test(name)) return "head";
  if (/omurga|atlanto|lumbosacral|sacrococcygea|intervertebr/.test(name)) return "spine";
  if (/toraks|costa|sternocostal/.test(name)) return "thorax";
  if (/omuz|dirsek|el bileği|el ·|humer|radiocarp|metacarp|interphalangeae-manus/.test(name)) return "upper";
  return "lower";
}

function pairsFor(item) {
  const latin = item.latin.toLowerCase();
  const sideMatch = latin.match(/ (dexter|dextra|dextrae|dextrum|dextri|sinister|sinistra|sinistrae|sinistrum|sinistri)$/);
  const sides = sideMatch ? [sideMatch[1].startsWith("dext") ? "right" : "left"] : ["right", "left"];
  const name = sideMatch ? latin.slice(0, -sideMatch[0].length) : latin;
  if (sutures[name]) return sutures[name];
  if (name === "symphysis pubica") return [["right hip bone", "left hip bone"]];
  if (name === "articulatio lumbosacralis") return [[vertebra("lumbar", 5), "sacrum"]];
  if (name === "articulatio sacrococcygea") return [["sacrum", "coccyx"]];
  if (name === "articulatio atlantoaxialis mediana" || name === "articulatio atlantoaxialis") return [["atlas", "axis"]];
  if (name === "articulatio atlantooccipitalis") return sides.map(side => ["atlas", "occipital bone", { lateral: side }]);
  if (name === "articulationes intervertebrales") return [...["cervical", "thoracic", "lumbar"].flatMap(region => Array.from({ length: region === "cervical" ? 5 : region === "thoracic" ? 12 : 5 }, (_, i) => [disk(region, i + (region === "cervical" ? 3 : 1))]))];
  const numbered = name.match(/^(articulatio (?:zygapophysialis (?:cervicalis|thoracica|lumbalis)|capitis costae|costotransversaria|sternocostalis|metacarpophalangea|metatarsophalangea|interphalangea (?:proximalis|distalis) (?:manus|pedis))) (\d+)$/);
  if (numbered) {
    const number = Number(numbered[2]);
    const kind = numbered[1];
    if (kind.includes("zygapophysialis")) {
      const region = kind.includes("cervicalis") ? "cervical" : kind.includes("thoracica") ? "thoracic" : "lumbar";
      const first = vertebra(region, number);
      const second = region === "cervical" && number === 7 ? vertebra("thoracic", 1) : region === "thoracic" && number === 12 ? vertebra("lumbar", 1) : region === "lumbar" && number === 5 ? "sacrum" : vertebra(region, number + 1);
      return sides.map(side => [first, second, { facet: side }]);
    }
    if (kind.includes("capitis costae")) return sides.map(side => [sided(side, `${ordinals[number - 1]} rib`), vertebra("thoracic", number)]);
    if (kind.includes("costotransversaria")) return sides.map(side => [sided(side, `${ordinals[number - 1]} rib`), vertebra("thoracic", number), { facet: side }]);
    if (kind.includes("sternocostalis")) return sides.map(side => [sided(side, `${ordinals[number - 1]} costal cartilage`), number === 1 ? "manubrium" : "body of sternum"]);
    if (kind.includes("metacarpophalangea")) return sides.map(side => handPairs(side, "mcp")[number - 1]);
    if (kind.includes("metatarsophalangea")) return sides.map(side => footPairs(side, "mtp")[number - 1]);
    const body = kind.includes("manus") ? "hand" : "foot";
    const digit = number + 1;
    return sides.map(side => [phalanx(side, kind.includes("proximalis") ? "proximal" : "middle", body, digit), phalanx(side, kind.includes("proximalis") ? "middle" : "distal", body, digit)]);
  }
  const base = {
    "articulatio temporomandibularis": side => [["mandible", sided(side, "temporal bone")]],
    "articulatio atlantoaxialis lateralis": side => [["atlas", "axis", { lateral: side }]],
    "articulatio sternoclavicularis": side => [[sided(side, "clavicle"), "manubrium"]],
    "articulatio acromioclavicularis": side => [[sided(side, "clavicle"), sided(side, "scapula")]],
    "articulatio humeri": side => [[sided(side, "humerus"), sided(side, "scapula")]],
    "articulatio scapulothoracica functionalis": () => [],
    "articulatio humeroulnaris": side => [[sided(side, "humerus"), sided(side, "ulna")]],
    "articulatio humeroradialis": side => [[sided(side, "humerus"), sided(side, "radius")]],
    "articulatio radioulnaris proximalis": side => [[sided(side, "radius"), sided(side, "ulna"), { end: "proximal" }]],
    "articulatio radioulnaris distalis": side => [[sided(side, "radius"), sided(side, "ulna"), { end: "distal" }]],
    "articulatio radiocarpalis": side => [[sided(side, "radius"), sided(side, "scaphoid")], [sided(side, "radius"), sided(side, "lunate")]],
    "articulatio mediocarpalis": side => [[sided(side, "scaphoid"), sided(side, "capitate")]],
    "articulationes intercarpales": side => [[sided(side, "scaphoid"), sided(side, "lunate")], [sided(side, "lunate"), sided(side, "triquetral")]],
    "articulatio carpometacarpalis pollicis": side => [[sided(side, "trapezium"), metapodial(side, "hand", 1)]],
    "articulationes carpometacarpales ii-v": side => [2, 3, 4, 5].map((n, i) => [sided(side, ["trapezoid", "capitate", "hamate", "hamate"][i]), metapodial(side, "hand", n)]),
    "articulationes intermetacarpales": side => [2, 3, 4].map(n => [metapodial(side, "hand", n), metapodial(side, "hand", n + 1)]),
    "articulatio sacroiliaca": side => [["sacrum", sided(side, "hip bone")]],
    "articulatio coxae": side => [[sided(side, "hip bone"), sided(side, "femur")]],
    "articulatio femorotibialis medialis": side => [[sided(side, "femur"), sided(side, "tibia"), { knee: "medial", side }]],
    "articulatio femorotibialis lateralis": side => [[sided(side, "femur"), sided(side, "tibia"), { knee: "lateral", side }]],
    "articulatio femoropatellaris": side => [[sided(side, "femur"), sided(side, "patella")]],
    "articulatio tibiofibularis": side => [[sided(side, "tibia"), sided(side, "fibula"), { end: "proximal" }]],
    "syndesmosis tibiofibularis": side => [[sided(side, "tibia"), sided(side, "fibula"), { end: "distal" }]],
    "articulatio talocruralis": side => [[sided(side, "tibia"), sided(side, "talus")], [sided(side, "fibula"), sided(side, "talus")]],
    "articulatio subtalaris": side => [[sided(side, "talus"), sided(side, "calcaneus")]],
    "articulatio talocalcaneonavicularis": side => [[sided(side, "talus"), foot(side, "navicular")], [sided(side, "talus"), sided(side, "calcaneus")]],
    "articulatio calcaneocuboidea": side => [[sided(side, "calcaneus"), sided(side, "cuboid bone")]],
    "articulatio tarsi transversa": side => [[sided(side, "talus"), foot(side, "navicular")], [sided(side, "calcaneus"), sided(side, "cuboid bone")]],
    "articulatio cuneonavicularis": side => ["medial", "intermediate", "lateral"].map(section => [foot(side, "navicular"), sided(side, `${section} cuneiform bone`)]),
    "articulationes intercuneiformes": side => [[sided(side, "medial cuneiform bone"), sided(side, "intermediate cuneiform bone")], [sided(side, "intermediate cuneiform bone"), sided(side, "lateral cuneiform bone")]],
    "articulatio cuneocuboidea": side => [[sided(side, "lateral cuneiform bone"), sided(side, "cuboid bone")]],
    "articulatio cuboideonavicularis": side => [[sided(side, "cuboid bone"), foot(side, "navicular")]],
    "articulationes tarsometatarsales": side => [1, 2, 3, 4, 5].map((n, i) => [i < 3 ? sided(side, `${["medial", "intermediate", "lateral"][i]} cuneiform bone`) : sided(side, "cuboid bone"), metapodial(side, "foot", n)]),
    "articulationes intermetatarsales": side => [2, 3, 4].map(n => [metapodial(side, "foot", n), metapodial(side, "foot", n + 1)]),
    "articulationes interphalangeae manus": side => [...handPairs(side, "pip"), ...handPairs(side, "dip")],
    "articulationes interphalangeae pedis": side => [...footPairs(side, "pip"), ...footPairs(side, "dip")],
    "articulationes metacarpophalangeae": side => handPairs(side, "mcp"),
  };
  if (base[name]) return sides.flatMap(side => base[name](side));
  const core = {
    "art-cubiti": side => [[sided(side, "humerus"), sided(side, "ulna")], [sided(side, "humerus"), sided(side, "radius")]],
    "art-genus": side => [[sided(side, "femur"), sided(side, "tibia")], [sided(side, "femur"), sided(side, "patella")]],
    "art-radiocarpalis": side => base["articulatio radiocarpalis"](side),
    "art-talocruralis": side => base["articulatio talocruralis"](side),
    "art-subtalaris": side => base["articulatio subtalaris"](side),
    "art-tibiofibularis": side => base["articulatio tibiofibularis"](side),
    "art-tarsometatarsales": side => base["articulationes tarsometatarsales"](side),
    "art-metacarpophalangeae": side => handPairs(side, "mcp"),
  };
  return core[item.id] ? sides.flatMap(side => core[item.id](side)) : [];
}

const requested = new Map();
const unsupported = [];
for (const item of joints) {
  const pairs = pairsFor(item);
  const valid = pairs.map(([first, second, options]) => {
    const a = byName.get(first);
    const b = second ? byName.get(second) : null;
    return a && available.has(a) && (!second || b && available.has(b)) ? { bones: b ? [a, b] : [a], options: options ?? {}, names: [first, second].filter(Boolean) } : null;
  }).filter(Boolean);
  if (valid.length !== pairs.length || !valid.length) { unsupported.push({ id: item.id, latin: item.latin, missing: pairs.filter(([a, b]) => !available.has(byName.get(a)) || b && !available.has(byName.get(b))) }); continue; }
  requested.set(item.id, { item, contacts: valid });
}

const usedBones = new Set([...requested.values()].flatMap(({ contacts }) => contacts.flatMap(contact => contact.bones)));
const context = [...labels].filter(([id, name]) => available.has(id) && (
  /^(?:right|left) (?:.*(?: bone| rib| costal cartilage|phalanx of .*|humerus|scapula|clavicle|radius|ulna|femur|tibia|fibula|talus|calcaneus|patella|hamate|capitate|trapezium|trapezoid|pisiform|triquetral|lunate|scaphoid))$/.test(name)
  || /^(?:atlas|axis|sacrum|coccyx|vomer|ethmoid|mandible|frontal bone|occipital bone|sphenoid bone|hyoid bone|manubrium|body of sternum|xiphoid process)$/.test(name)
  || /^(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth) (?:cervical|thoracic|lumbar) vertebra$/.test(name)
  || /^intervertebral disk of /.test(name)
  || /^navicular bone of (?:right|left) foot$/.test(name)
)).map(([id]) => id);
context.forEach(id => usedBones.add(id));
console.log(`Catalog ${joints.length}; candidate contacts ${requested.size}; source structures ${usedBones.size}; unmapped ${unsupported.length}`);
if (process.argv.includes("--audit")) {
  await writeFile(path.join(root, "artifacts/joint-audit.json"), JSON.stringify({ catalog: joints.length, mapped: requested.size, unsupported }, null, 2));
  process.exit(0);
}

const wanted = new Set([...usedBones].map(id => `${id}.obj`));
const files = unzipSync(zip, { filter: file => wanted.has(path.basename(file.name)) });
const objects = new Map(Object.entries(files).map(([name, bytes]) => [path.basename(name), bytes]));
const group = new Group();
group.name = "BodyParts3D_joint_context";
group.userData = { attribution: "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International", source, license: "CC BY 4.0", changes: "Bone, cartilage and intervertebral disk OBJ surfaces converted to Y-up indexed GLB, mm to meters, simplified and meshopt compressed; contact markers computed separately from source surfaces." };
const material = new MeshStandardMaterial({ color: 0xd4dad8, roughness: 0.8 });
const positions = new Map();
const provenance = [];
for (const id of [...usedBones].sort()) {
  const bytes = objects.get(`${id}.obj`);
  if (!bytes) throw new Error(`Missing source mesh ${id}`);
  const sourceObject = new OBJLoader().parse(new TextDecoder().decode(bytes));
  const geometries = [];
  sourceObject.traverse(node => { if (node.isMesh) { node.geometry.deleteAttribute("normal"); node.geometry.deleteAttribute("uv"); geometries.push(node.geometry); } });
  const original = mergeGeometries(geometries);
  const geometry = mergeVertices(original, 0.0001);
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);
  geometry.scale(0.001, 0.001, 0.001);
  const position = geometry.getAttribute("position");
  const points = [];
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < position.count; i++) {
    const point = [position.getX(i), position.getY(i), position.getZ(i)];
    points.push(point);
    for (let axis = 0; axis < 3; axis++) { min[axis] = Math.min(min[axis], point[axis]); max[axis] = Math.max(max[axis], point[axis]); }
  }
  positions.set(id, { points, min, max });
  const mesh = new Mesh(geometry, material);
  mesh.name = `context_${id.toLowerCase()}`;
  mesh.userData = { fma: id, sourceName: labels.get(id), context: true, structure: /disk|cartilage/.test(labels.get(id)) ? "joint tissue" : "bone" };
  group.add(mesh);
  provenance.push({ fma: id, name: labels.get(id), sha256: createHash("sha256").update(bytes).digest("hex"), vertices: position.count });
  geometries.forEach(g => g.dispose());
  original.dispose();
}

const center = entry => entry.min.map((n, axis) => (n + entry.max[axis]) / 2);
function contactPoint(aId, bId, options) {
  const a = positions.get(aId);
  if (!bId) return { point: center(a), distance: 0 };
  const b = positions.get(bId);
  let aPoints = a.points;
  let bPoints = b.points;
  if (options.facet) {
    const mid = center(a)[0];
    const sign = options.facet === "right" ? -1 : 1;
    const keep = (p, entry) => (p[0] - mid) * sign > 0.005 && p[2] < center(entry)[2];
    const filteredA = aPoints.filter(p => keep(p, a));
    const filteredB = bPoints.filter(p => keep(p, b));
    if (filteredA.length && filteredB.length) { aPoints = filteredA; bPoints = filteredB; }
  }
  if (options.lateral) {
    const mid = center(a)[0];
    const sign = options.lateral === "right" ? -1 : 1;
    const filteredA = aPoints.filter(p => (p[0] - mid) * sign > 0.005);
    const filteredB = bPoints.filter(p => (p[0] - center(b)[0]) * sign > 0.005);
    if (filteredA.length && filteredB.length) { aPoints = filteredA; bPoints = filteredB; }
  }
  if (options.knee) {
    const lateralSign = options.side === "right" ? -1 : 1;
    const sign = options.knee === "medial" ? -lateralSign : lateralSign;
    const filteredA = aPoints.filter(p => (p[0] - center(a)[0]) * sign > 0.005);
    const filteredB = bPoints.filter(p => (p[0] - center(b)[0]) * sign > 0.005);
    if (filteredA.length && filteredB.length) { aPoints = filteredA; bPoints = filteredB; }
  }
  if (options.end) {
    const thresholdA = a.min[1] + (a.max[1] - a.min[1]) * (options.end === "proximal" ? 0.66 : 0.34);
    const thresholdB = b.min[1] + (b.max[1] - b.min[1]) * (options.end === "proximal" ? 0.66 : 0.34);
    aPoints = aPoints.filter(p => options.end === "proximal" ? p[1] >= thresholdA : p[1] <= thresholdA);
    bPoints = bPoints.filter(p => options.end === "proximal" ? p[1] >= thresholdB : p[1] <= thresholdB);
  }
  const size = 0.025;
  const key = p => p.map(value => Math.floor(value / size));
  const larger = aPoints.length > bPoints.length ? aPoints : bPoints;
  const smaller = aPoints.length > bPoints.length ? bPoints : aPoints;
  const grid = new Map();
  for (const point of larger) { const cell = key(point).join(","); if (!grid.has(cell)) grid.set(cell, []); grid.get(cell).push(point); }
  let best = { distance2: Infinity, point: null };
  for (const point of smaller) {
    const [x, y, z] = key(point);
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) for (let dz = -2; dz <= 2; dz++) {
      for (const other of grid.get(`${x + dx},${y + dy},${z + dz}`) ?? []) {
        const d2 = point.reduce((sum, value, axis) => sum + (value - other[axis]) ** 2, 0);
        if (d2 < best.distance2) best = { distance2: d2, point: point.map((value, axis) => (value + other[axis]) / 2) };
      }
    }
  }
  return { point: best.point, distance: Math.sqrt(best.distance2) };
}

const mappings = {};
const skipped = [...unsupported];
for (const [id, { item, contacts }] of requested) {
  const markers = [];
  for (const contact of contacts) {
    const result = contactPoint(contact.bones[0], contact.bones[1], contact.options);
    if (!result.point || result.distance > 0.08) continue;
    markers.push({ name: `joint_${id}_${markers.length}`, position: result.point.map(n => Number(n.toFixed(5))), bones: contact.bones, distance: Number(result.distance.toFixed(5)), region: regionOf(item) });
  }
  if (markers.length === contacts.length) mappings[id] = markers;
  else skipped.push({ id, latin: item.latin, reason: "Source surfaces too far apart for a reliable marker" });
}

globalThis.FileReader = class { readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }); } };
const glb = await new GLTFExporter().parseAsync(group, { binary: true });
await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const document = await io.readBinary(new Uint8Array(glb));
await document.transform(simplify({ simplifier: MeshoptSimplifier, ratio: 0.45, error: 0.0005 }), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
const optimized = await io.writeBinary(document);
await writeFile(path.join(root, "public/models/joints.glb"), optimized);
await writeFile(path.join(root, "app/data/joint-model.json"), JSON.stringify({ coverage: { catalog: joints.length, mapped: Object.keys(mappings).length, markers: Object.values(mappings).flat().length, context: usedBones.size }, mappings }, null, 2) + "\n");
await writeFile(path.join(root, "public/models/joints-provenance.json"), JSON.stringify({ ...group.userData, archive: source + "BodyParts3D_3.0_obj_99.zip", archiveSha256: createHash("sha256").update(zip).digest("hex"), parts: provenance, unsupported: skipped }, null, 2) + "\n");
console.log(`Built joints.glb ${(optimized.byteLength / 1e6).toFixed(1)} MB; ${Object.keys(mappings).length}/${joints.length} catalog entries; ${Object.values(mappings).flat().length} contact markers; ${usedBones.size} source structures.`);
