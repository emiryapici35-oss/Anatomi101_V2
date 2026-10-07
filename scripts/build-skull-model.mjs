import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Box3, Group, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const parts = JSON.parse(await readFile(path.join(root, "app/data/skull-parts.json"), "utf8"));
const revision = "f0eeb6e843380cfe6b83797cf8c3e1af74de5e61";
const source = `https://raw.githubusercontent.com/Kevin-Mattheus-Moerman/BodyParts3D/${revision}/assets/BodyParts3D_data`;
const cache = path.join(root, "artifacts/bodyparts3d");
await mkdir(cache, { recursive: true });

async function download(name) {
  const target = path.join(cache, path.basename(name));
  try { return await readFile(target); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const response = await fetch(`${source}/${name}`, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(target, bytes);
  return bytes;
}

const labels = new Map((await download("parts_list_e.txt")).toString("utf8").trim().split(/\r?\n/).map((line) => line.split("\t")));
const group = new Group();
group.name = "BodyParts3D_skull";
group.userData = {
  title: "Segmented skull: 22 bones",
  author: "BodyParts3D, The Database Center for Life Science",
  license: "CC Attribution-Share Alike 2.1 Japan",
  source: "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html",
  mirror: `https://github.com/Kevin-Mattheus-Moerman/BodyParts3D/tree/${revision}`,
  changes: "STL to indexed GLB; welded vertices; recomputed normals; Z-up to Y-up; millimeters to meters. No segmentation or anatomical deformation.",
};
const material = new MeshStandardMaterial({ color: 0xc8cec8, roughness: 0.75 });
const manifest = [];
for (const part of parts) {
  if (labels.get(part.fma)?.trim() !== part.name) throw new Error(`Source label mismatch: ${part.fma} ${part.name}`);
  const bytes = await download(`stl/${part.fma}.stl`);
  const original = new STLLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  original.deleteAttribute("normal");
  const geometry = mergeVertices(original, 0.0001);
  original.dispose();
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);
  geometry.scale(0.001, 0.001, 0.001);
  const mesh = new Mesh(geometry, material);
  mesh.name = part.id;
  mesh.userData = { fma: part.fma, sourceName: part.name, anatomyId: part.id };
  group.add(mesh);
  manifest.push({ ...part, source: `${source}/stl/${part.fma}.stl`, sha256: createHash("sha256").update(bytes).digest("hex"), vertices: geometry.attributes.position.count });
  console.log(`${part.id}: ${geometry.attributes.position.count} vertices; center ${new Box3().setFromObject(mesh).getCenter(new Vector3()).toArray().map((v) => v.toFixed(3))}`);
}

// GLTFExporter uses FileReader for binary output, but Node already provides Blob.arrayBuffer().
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => { this.result = result; this.onloadend?.(); });
  }
};
const glb = await new GLTFExporter().parseAsync(group, { binary: true });
const output = path.join(root, "public/models");
await writeFile(path.join(output, "skull-segmented.glb"), Buffer.from(glb));
await writeFile(path.join(output, "skull-provenance.json"), JSON.stringify({ ...group.userData, revision, parts: manifest }, null, 2) + "\n");
console.log(`Built skull-segmented.glb: ${glb.byteLength} bytes, ${parts.length} bones.`);
