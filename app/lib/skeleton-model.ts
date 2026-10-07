import skullParts from "../data/skull-parts.json";
import muscleData from "../data/muscle-model.json";
import jointData from "../data/joint-model.json";
import { anatomyItems } from "../data/anatomy";

export type SkeletonModel = "skeleton" | "skull" | "scan" | "muscles" | "joints";

export const skeletonModels = {
  skeleton: { url: "/models/ct_derived_human_skeleton.glb", label: "İskelet" },
  skull: { url: "/models/skull-segmented.glb", label: "Kafatası" },
  scan: { url: "/models/SKULL_NIH3D.glb", label: "Tarama" },
  muscles: { url: "/models/muscles.glb", label: "Kaslar" },
  joints: { url: "/models/joints.glb", label: "Eklemler" },
} as const;

const skullIds = new Set(skullParts.map((part) => part.id));
const muscleIds = new Set(anatomyItems.filter(item => item.category === "muscles").map(item => item.id));
const jointIds = new Set(anatomyItems.filter(item => item.category === "joints").map(item => item.id));
export const muscleCoverage = muscleData.coverage;
export const jointCoverage = jointData.coverage;
export const jointMappings: Record<string, typeof jointData.mappings[keyof typeof jointData.mappings]> = jointData.mappings;
const muscleMappings: Record<string, string[]> = muscleData.mappings;
const jointSurfaces = new Map<string, { id: string; position: number[]; count: number }[]>();
for (const [id, contacts] of Object.entries(jointMappings)) {
  for (const contact of contacts) for (const bone of contact.bones) {
    const name = `context_${bone.toLowerCase()}`;
    const candidates = jointSurfaces.get(name) ?? [];
    candidates.push({ id, position: contact.position, count: contacts.length });
    jointSurfaces.set(name, candidates);
  }
}

// A source bone can participate in several joints. Resolve the clicked surface
// against contact coordinates in the source model, without rendering locators.
export function jointAtSurface(name: string, point: readonly number[]) {
  let closest: { id: string; distance: number; count: number } | undefined;
  for (const candidate of jointSurfaces.get(normalizeMeshName(name)) ?? []) {
    const distance = candidate.position.reduce((sum, value, axis) => sum + (value - point[axis]) ** 2, 0);
    if (!closest || distance < closest.distance - 1e-10 || Math.abs(distance - closest.distance) <= 1e-10 && candidate.count < closest.count) {
      closest = { id: candidate.id, distance, count: candidate.count };
    }
  }
  return closest?.id;
}

export function modelMeshNames(id: string, model: SkeletonModel): string[] {
  if (model === "joints") return [...new Set(jointMappings[id]?.flatMap(contact => contact.bones.map(bone => `context_${bone.toLowerCase()}`)) ?? [])];
  if (model === "muscles") return muscleMappings[id] ?? [];
  if (model === "skull") return skullIds.has(id) ? [id] : [];
  return model === "skeleton" ? skeletonMeshNames(id) : [];
}

export function meshBoneIndex(boneIds: string[], model: SkeletonModel) {
  if (model === "joints") return new Map([...jointSurfaces].map(([name, candidates]) => [name, candidates[0].id]));
  if (model === "muscles") return new Map(muscleData.parts.map(part => [part.mesh, part.itemId]));
  return new Map(boneIds.flatMap((id) => modelMeshNames(id, model).map((name) => [name, id] as const)));
}

export function preferredModel(id: string): SkeletonModel {
  if (jointIds.has(id)) return "joints";
  if (muscleIds.has(id)) return "muscles";
  return skullIds.has(id) ? "skull" : "skeleton";
}

export function normalizeMeshName(name: string) {
  return name.toLowerCase().replace(/_beige_0$/, "").replace(/\s+/g, "_");
}

const central: Record<string, string[]> = {
  mandibula: ["mandible"],
  "os-hyoideum": ["hyoid"],
  atlas: ["c1"],
  axis: ["c2"],
  "os-sacrum": ["sacrum"],
  coccyx: ["coccyx"],
  sternum: ["sternum", "xiphoid_process"],
};

const paired: Record<string, string> = {
  clavicula: "clavicle", scapula: "scapula", humerus: "humerus",
  radius: "radius", ulna: "ulna", "os-coxae": "oscoxa", femur: "femur",
  patella: "patella", tibia: "tibia", fibula: "fibula",
};
const carpals = ["scaphoid", "lunate", "triquetral", "pisiform", "trapezium", "trapezoid", "capitate", "hamate"];
const tarsals = ["talus", "calcaneus", "navicular", "cuboid", "medial_cuneiform", "intermediate_cuneiform", "lateral_cuneiform"];

// Use exact mesh names: this asset distinguishes hand/foot phalanges by a space before the digit.
export function skeletonMeshNames(id: string): string[] {
  if (central[id]) return central[id];
  const vertebra = id.match(/^vertebra-(cervicalis|thoracica|lumbalis)-(\d+)$/);
  if (vertebra) {
    const number = Number(vertebra[2]) + (vertebra[1] === "cervicalis" ? 2 : 0);
    return [`${{ cervicalis: "c", thoracica: "t", lumbalis: "l" }[vertebra[1]]}${number}`];
  }
  const rib = id.match(/^costa-(dexter|sinister)-(\d+)$/);
  if (rib) return [`${rib[1] === "dexter" ? "r" : "l"}_rib${rib[2]}`];
  const sideMatch = id.match(/^(.*)-(dexter|sinister)$/);
  if (!sideMatch) return [];
  const [, bone, sideName] = sideMatch;
  const side = sideName === "dexter" ? "r" : "l";
  if (paired[bone]) return [`${side}_${paired[bone]}`];
  const smallBone = bone.match(/^os-(carpi|tarsi|metacarpale|metatarsale)-(\d+)$/);
  if (smallBone) {
    const number = Number(smallBone[2]);
    const name = smallBone[1] === "carpi" ? carpals[number - 1]
      : smallBone[1] === "tarsi" ? tarsals[number - 1]
      : smallBone[1] === "metacarpale" ? `metacarpal${number}` : `metatarsal_${number}`;
    return name ? [`${side}_${name}`] : [];
  }
  const phalanx = bone.match(/^phalanx-(manus|pedis)-(\d+)-(\d+)$/);
  if (phalanx) {
    const [, region, digit, segment] = phalanx;
    const segments = digit === "1" ? ["proximal", "distal"] : ["proximal", "intermediate", "distal"];
    let name = segments[Number(segment) - 1];
    if (!name) return [];
    // The left fifth toe's middle phalanx is misspelled in the supplied GLB.
    if (region === "pedis" && side === "l" && digit === "5" && name === "intermediate") name = "interemediate";
    return [`${side}_${name}_phalange${region === "pedis" ? "_" : ""}${digit}`];
  }
  return [];
}
