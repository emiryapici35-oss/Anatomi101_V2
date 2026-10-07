import * as THREE from "three";
import { jointMappings } from "./skeleton-model";

export type JointRegion = { center: THREE.Vector3; radius: number; bones: string[] };

export function jointRegions(id: string, sourceBounds: Map<string, THREE.Box3>): JointRegion[] {
  return (jointMappings[id] ?? []).map(contact => {
    const sizes = contact.bones.flatMap(bone => {
      const bounds = sourceBounds.get(bone);
      return bounds ? [bounds.getSize(new THREE.Vector3()).toArray().sort((a, b) => a - b)[1]] : [];
    });
    // Scale the visual neighborhood to the smaller participating structure.
    // Contact locations and this falloff are locators, not cartilage segmentation.
    const radius = Math.max(THREE.MathUtils.clamp(Math.min(...sizes) * 0.65, 0.007, 0.045), contact.distance * 0.6);
    return { center: new THREE.Vector3(...contact.position), radius, bones: contact.bones };
  });
}

export function jointSurfaceWeight(point: THREE.Vector3, regions: JointRegion[]) {
  let weight = 0;
  for (const region of regions) {
    const distance = point.distanceTo(region.center) / region.radius;
    weight = Math.max(weight, 1 - THREE.MathUtils.smoothstep(distance, 0.4, 1));
  }
  return weight;
}

export function addJointSurfaceShader(material: THREE.MeshStandardMaterial, glow: { value: number }, contextOpacity: { value: number }) {
  material.onBeforeCompile = shader => {
    shader.uniforms.jointGlow = glow;
    shader.uniforms.jointContextOpacity = contextOpacity;
    shader.uniforms.jointColor = { value: new THREE.Color(0xff713f) };
    shader.uniforms.jointEmission = { value: new THREE.Color(0xff3c10) };
    shader.vertexShader = `attribute float jointWeight; varying float vJointWeight;\n${shader.vertexShader}`
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvJointWeight = jointWeight;");
    shader.fragmentShader = `varying float vJointWeight; uniform float jointGlow; uniform float jointContextOpacity; uniform vec3 jointColor; uniform vec3 jointEmission;\n${shader.fragmentShader}`
      .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, jointColor, vJointWeight);\ndiffuseColor.a *= mix(jointContextOpacity, 1.0, vJointWeight);")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += jointEmission * jointGlow * vJointWeight;");
  };
  material.customProgramCacheKey = () => "joint-surface-falloff-v1";
}
