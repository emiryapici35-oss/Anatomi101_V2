import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { anatomyItems } from "../data/anatomy";
import { normalizeMeshName, modelMeshNames, meshBoneIndex, jointAtSurface, skeletonModels, type SkeletonModel } from "./skeleton-model";
import { addJointSurfaceShader, jointRegions, jointSurfaceWeight, type JointRegion } from "./joint-highlight";

export type SceneState = { phase: "loading" | "ready" | "error"; message?: string; matched: number; hidden?: number };
export type MuscleView = "solid" | "ghost";
export type SectionAxis = "off" | "sagittal" | "coronal" | "axial";
export type CameraView = "front" | "back" | "right" | "left";

function disposeObject(root: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  });
  materials.forEach((material) => {
    Object.values(material).forEach((value) => { if (value instanceof THREE.Texture) value.dispose(); });
    material.dispose();
  });
}

export function createSkeletonScene(host: HTMLElement, model: SkeletonModel, onState: (state: SceneState) => void, onPick: (id: string) => void, onOpenSkull: () => void, onInteraction: () => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.localClippingEnabled = true;
  renderer.domElement.setAttribute("aria-label", `${skeletonModels[model].label} 3D görünümü`);
  renderer.domElement.setAttribute("role", "img");
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.005, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.minDistance = 0.06;
  controls.maxDistance = 12;
  controls.autoRotateSpeed = 1;
  const stopRotation = () => { controls.autoRotate = false; onInteraction(); };
  controls.addEventListener("start", stopRotation);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x82928e, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2);
  key.position.set(-3, 4, 5);
  const fill = new THREE.DirectionalLight(0xddeeff, 1.3);
  fill.position.set(4, 1, -3);
  scene.add(key, fill);
  const boneMaterial = new THREE.MeshStandardMaterial({ color: 0xc8cec8, roughness: 0.75, metalness: 0 });
  const highlightMaterial = new THREE.MeshStandardMaterial({ color: model === "muscles" ? 0x29d9ce : 0xff713f, emissive: model === "muscles" ? 0x078b84 : 0xff3c10, emissiveIntensity: 0.65, roughness: 0.45, side: THREE.DoubleSide });
  const meshes: THREE.Mesh[] = [];
  const baseMaterials = new Map<THREE.Mesh, THREE.MeshStandardMaterial>();
  const sourceBounds = new Map<string, THREE.Box3>();
  const sourceTransforms = new Map<THREE.Mesh, THREE.Matrix4>();
  const jointContextOpacity = new Map<THREE.Mesh, { value: number }>();
  const jointGlow = { value: 0.65 };
  let regions: JointRegion[] = [];
  let weightedSelection: string | null = null;
  const originalPositions = new Map<THREE.Mesh, THREE.Vector3>();
  const explosionDirections = new Map<THREE.Mesh, THREE.Vector3>();
  const boneItems = new Map(anatomyItems.filter((item) => item.category === (model === "muscles" ? "muscles" : model === "joints" ? "joints" : "bones")).map((item) => [item.id, item]));
  const boneIndex = meshBoneIndex([...boneItems.keys()], model);
  let selected: THREE.Mesh[] = [];
  let root: THREE.Object3D | null = null;
  let selectedId = "";
  let isolated = false;
  let focused = false;
  let pickedId: string | null = null;
  let separation = 0;
  let disposed = false;
  let inView = true;
  let frame = 0;
  let fullBounds = new THREE.Box3();
  let lastTime = 0;
  let muscleView: MuscleView = "solid";
  let showBones = true;
  const hidden = new Set<THREE.Mesh>();
  const hideHistory: THREE.Mesh[][] = [];
  const opacityTargets = new Map<THREE.Mesh, number>();
  const sectionPlane = new THREE.Plane();
  let sectionAxis: SectionAxis = "off";
  let sectionPosition = 50;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const abort = new AbortController();

  function frameBounds(bounds: THREE.Box3, front = false) {
    if (bounds.isEmpty()) return;
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const distance = Math.max(size.y / 2 / Math.tan(halfFov), size.x / 2 / (Math.tan(halfFov) * camera.aspect), size.z) * 1.22 + size.z / 2;
    const direction = front ? new THREE.Vector3(0, 0, 1) : camera.position.clone().sub(controls.target).normalize();
    controls.target.copy(center);
    camera.position.copy(center).addScaledVector(direction, Math.max(distance, 0.12));
    camera.lookAt(center);
    controls.update();
  }

  function updateSelection() {
    const names = modelMeshNames(selectedId, model);
    selected = meshes.filter((mesh) => names.includes(normalizeMeshName(mesh.name)));
    const active = new Set(selected);
    if (model === "joints" && root && weightedSelection !== selectedId) {
      regions = jointRegions(selectedId, sourceBounds);
      const point = new THREE.Vector3();
      meshes.forEach(mesh => {
        const positions = mesh.geometry.getAttribute("position");
        const weights = mesh.geometry.getAttribute("jointWeight");
        const localRegions = regions.filter(region => region.bones.includes(mesh.userData.fma));
        for (let i = 0; i < positions.count; i++) {
          point.fromBufferAttribute(positions, i).applyMatrix4(sourceTransforms.get(mesh)!);
          weights.setX(i, jointSurfaceWeight(point, localRegions));
        }
        weights.needsUpdate = true;
      });
      weightedSelection = selectedId;
    }
    meshes.forEach((mesh) => {
      const jointOpacity = jointContextOpacity.get(mesh);
      if (jointOpacity) jointOpacity.value = active.has(mesh) && muscleView === "ghost" && !isolated ? 0.12 : 1;
      mesh.material = model !== "joints" && active.has(mesh) && !hidden.has(mesh) ? highlightMaterial : baseMaterials.get(mesh) ?? boneMaterial;
      const context = model === "joints" ? !active.has(mesh) && mesh.userData.structure === "bone" : Boolean(mesh.userData.context);
      if (model === "muscles" || model === "joints") {
        const target = hidden.has(mesh) || context && !showBones || isolated && selected.length && !active.has(mesh) ? 0 : !active.has(mesh) && muscleView === "ghost" ? context ? 0.06 : 0.09 : 1;
        opacityTargets.set(mesh, target);
        if (active.has(mesh) && !hidden.has(mesh)) mesh.visible = target > 0;
        else if (target > 0) mesh.visible = true;
      } else mesh.visible = !isolated || !selected.length || active.has(mesh);
    });
    host.dataset.matchedMeshes = String(selected.length);
    host.dataset.selectedBone = selectedId;
    host.dataset.selectedJoint = model === "joints" ? selectedId : "";
    host.dataset.model = model;
    host.dataset.hiddenMeshes = String(hidden.size);
    host.dataset.muscleView = muscleView;
    if (root) onState({ phase: "ready", matched: selected.length, hidden: hideHistory.length });
  }

  function focusSelection() {
    focused = selected.length > 0;
    if (!focused) { frameBounds(fullBounds, true); return; }
    const bounds = new THREE.Box3();
    if (model === "joints" && root && regions.length) {
      regions.forEach(region => {
        const extent = new THREE.Vector3().setScalar(region.radius * 1.8);
        bounds.union(new THREE.Box3(region.center.clone().sub(extent), region.center.clone().add(extent)));
      });
      bounds.applyMatrix4(root.matrixWorld);
    } else selected.forEach((mesh) => bounds.union(new THREE.Box3().setFromObject(mesh)));
    frameBounds(bounds);
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pointerIds = new Set<number>();
  let press: { id: number; x: number; y: number; moved: boolean } | null = null;
  let lastHover = 0;

  function hitAt(event: PointerEvent) {
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(meshes.filter((mesh) => mesh.visible && (model === "joints" || !mesh.userData.context) && !hidden.has(mesh) && (opacityTargets.get(mesh) ?? 1) > 0), false);
    return hits.find(result => sectionAxis === "off" || sectionPlane.distanceToPoint(result.point) >= 0);
  }

  function hitId(hit: THREE.Intersection | undefined) {
    if (!hit) return;
    if (model === "joints" && root) return jointAtSurface(hit.object.name, root.worldToLocal(hit.point.clone()).toArray());
    return boneIndex.get(normalizeMeshName(hit.object.name));
  }

  const pointerDown = (event: PointerEvent) => {
    pointerIds.add(event.pointerId);
    press = pointerIds.size === 1 && event.button === 0 ? { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false } : null;
  };
  const pointerMove = (event: PointerEvent) => {
    if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 6) press.moved = true;
    if (pointerIds.size) { renderer.domElement.style.cursor = "grabbing"; return; }
    if (performance.now() - lastHover < 60) return;
    lastHover = performance.now();
    const hit = hitAt(event);
    const id = hitId(hit);
    const cranium = model === "skeleton" && hit && normalizeMeshName(hit.object.name) === "cranium";
    renderer.domElement.style.cursor = id || cranium ? "pointer" : "grab";
    renderer.domElement.title = id ? `${boneItems.get(id)?.turkish} · ${boneItems.get(id)?.latin}` : cranium ? "Kafatası" : "";
  };
  const pointerUp = (event: PointerEvent) => {
    const clicked = press?.id === event.pointerId && !press.moved && Math.hypot(event.clientX - press.x, event.clientY - press.y) <= 6;
    pointerIds.delete(event.pointerId);
    press = null;
    renderer.domElement.style.cursor = "grab";
    if (!clicked || !root) return;
    const hit = hitAt(event);
    if (!hit) return;
    const name = normalizeMeshName(hit.object.name);
    const id = hitId(hit);
    if (id) {
      pickedId = id;
      onPick(id);
    } else if (model === "skeleton" && name === "cranium") onOpenSkull();
  };
  const pointerCancel = (event: PointerEvent) => { pointerIds.delete(event.pointerId); press = null; };
  const pointerLeave = () => { renderer.domElement.title = ""; };
  renderer.domElement.addEventListener("pointerdown", pointerDown);
  renderer.domElement.addEventListener("pointermove", pointerMove);
  renderer.domElement.addEventListener("pointerup", pointerUp);
  renderer.domElement.addEventListener("pointercancel", pointerCancel);
  renderer.domElement.addEventListener("pointerleave", pointerLeave);

  function applySeparation() {
    if (model !== "skull" || !root) return;
    meshes.forEach((mesh) => {
      mesh.position.copy(originalPositions.get(mesh)!).addScaledVector(explosionDirections.get(mesh)!, separation * 0.085);
    });
    root.updateMatrixWorld(true);
    fullBounds = new THREE.Box3().setFromObject(root);
    if (focused || isolated) focusSelection();
    else frameBounds(fullBounds);
  }

  function applySection() {
    if (model !== "muscles" && model !== "joints") return;
    const normals = { sagittal: new THREE.Vector3(-1, 0, 0), coronal: new THREE.Vector3(0, 0, -1), axial: new THREE.Vector3(0, -1, 0) };
    const axis = sectionAxis === "sagittal" ? "x" : sectionAxis === "axial" ? "y" : "z";
    const position = THREE.MathUtils.lerp(fullBounds.min[axis], fullBounds.max[axis], sectionPosition / 100);
    if (sectionAxis !== "off") sectionPlane.set(normals[sectionAxis], position);
    for (const material of [boneMaterial, highlightMaterial, ...baseMaterials.values()]) {
      material.clippingPlanes = sectionAxis === "off" ? [] : [sectionPlane];
      material.side = sectionAxis === "off" ? THREE.FrontSide : THREE.DoubleSide;
      material.needsUpdate = true;
    }
    host.dataset.section = sectionAxis;
  }

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  const resizeObserver = new ResizeObserver(() => {
    const previousAspect = camera.aspect;
    resize();
    // Preserve framing when the viewer crosses a responsive layout breakpoint.
    if (root && Math.abs(previousAspect - camera.aspect) > 0.1) {
      if (focused || isolated) focusSelection();
      else frameBounds(fullBounds);
    }
  });
  resizeObserver.observe(host);
  const intersection = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; });
  intersection.observe(host);
  resize();

  const animate = (time: number) => {
    frame = requestAnimationFrame(animate);
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    if (!inView || document.hidden) return;
    if (model === "muscles" || model === "joints") meshes.forEach(mesh => {
      if (mesh.material === highlightMaterial) return;
      const material = baseMaterials.get(mesh)!;
      const target = opacityTargets.get(mesh) ?? 1;
      material.opacity = reducedMotion.matches ? target : THREE.MathUtils.damp(material.opacity, target, 14, delta);
      if (Math.abs(material.opacity - target) < 0.005) material.opacity = target;
      const transparent = material.opacity < 1 || (jointContextOpacity.get(mesh)?.value ?? 1) < 1;
      if (material.transparent !== transparent) { material.transparent = transparent; material.needsUpdate = true; }
      material.depthWrite = !transparent;
      mesh.visible = material.opacity > 0.005;
    });
    highlightMaterial.emissiveIntensity = reducedMotion.matches ? 0.65 : 0.65 + Math.sin(time * 0.003) * 0.18;
    jointGlow.value = highlightMaterial.emissiveIntensity;
    controls.update(delta);
    renderer.render(scene, camera);
  };
  frame = requestAnimationFrame(animate);

  const contextLost = (event: Event) => {
    event.preventDefault();
    onState({ phase: "error", matched: 0, message: "3D bağlantısı kesildi. Modeli yeniden yükleyebilirsin." });
  };
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  onState({ phase: "loading", matched: 0 });

  void (async () => {
    try {
      const response = await fetch(skeletonModels[model].url, { signal: abort.signal });
      if (!response.ok) throw new Error(`Model: ${response.status}`);
      const data = await response.arrayBuffer();
      if (disposed) return;
      const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(data, "");
      if (disposed) { disposeObject(gltf.scene); return; }
      root = gltf.scene;
      if (model === "scan") root.rotation.x = -Math.PI / 2;
      root.updateMatrixWorld(true);
      const originalBounds = new THREE.Box3().setFromObject(root);
      const scale = 2 / originalBounds.getSize(new THREE.Vector3()).y;
      root.scale.multiplyScalar(scale);
      root.updateMatrixWorld(true);
      root.position.sub(new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3()));
      root.updateMatrixWorld(true);
      const originals = new Set<THREE.Material>();
      const skullCenter = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
      const colors = [0xb9d6d3, 0xd0c8df, 0xd3d9bd, 0xbecfe1, 0xdcd4c7];
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        meshes.push(object);
        (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => originals.add(material));
        object.material = boneMaterial;
        if (model === "skull") {
          const material = boneMaterial.clone();
          material.color.setHex(colors[(meshes.length - 1) % colors.length]);
          baseMaterials.set(object, material);
          originalPositions.set(object, object.position.clone());
          explosionDirections.set(object, new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3()).sub(skullCenter).normalize());
        }
        if (model === "muscles" || model === "joints") {
          const material = boneMaterial.clone();
          if (model === "muscles" && !object.userData.context) material.color.setHSL(0.005 + (meshes.length % 5) * 0.005, 0.37, 0.43 + (meshes.length % 4) * 0.035);
          if (model === "joints" && object.userData.structure === "joint tissue") material.color.setHex(0xb8d7d1);
          if (model === "joints") {
            const transform = root!.matrixWorld.clone().invert().multiply(object.matrixWorld);
            object.geometry.computeBoundingBox();
            sourceTransforms.set(object, transform);
            sourceBounds.set(object.userData.fma, object.geometry.boundingBox!.clone().applyMatrix4(transform));
            object.geometry.setAttribute("jointWeight", new THREE.BufferAttribute(new Float32Array(object.geometry.getAttribute("position").count), 1));
            const contextOpacity = { value: 1 };
            jointContextOpacity.set(object, contextOpacity);
            addJointSurfaceShader(material, jointGlow, contextOpacity);
          }
          material.side = THREE.FrontSide;
          baseMaterials.set(object, material);
        }
      });
      originals.forEach((material) => {
        Object.values(material).forEach((value) => { if (value instanceof THREE.Texture) value.dispose(); });
        material.dispose();
      });
      scene.add(root);
      fullBounds = new THREE.Box3().setFromObject(root);
      frameBounds(fullBounds, true);
      updateSelection();
      applySeparation();
      applySection();
    } catch {
      if (!disposed) onState({ phase: "error", matched: 0, message: "Model yüklenemedi. Bağlantını kontrol edip yeniden dene." });
    }
  })();

  return {
    select(id: string) {
      const preserveCamera = pickedId === id;
      pickedId = null;
      selectedId = id;
      if (model === "muscles" || model === "joints") {
        const names = modelMeshNames(id, model);
        meshes.filter(mesh => names.includes(normalizeMeshName(mesh.name))).forEach(mesh => hidden.delete(mesh));
      }
      updateSelection();
      if (root && !preserveCamera) {
        if (focused || isolated) focusSelection();
      }
    },
    home() { focused = false; frameBounds(fullBounds, true); },
    focus: focusSelection,
    zoom(factor: number) {
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
      camera.position.copy(controls.target).add(offset);
      controls.update();
    },
    isolate(value: boolean) {
      isolated = value;
      updateSelection();
      if (value && selected.length) focusSelection();
      else if (root) { focused = false; frameBounds(fullBounds); }
    },
    rotate(value: boolean) { controls.autoRotate = value; },
    separate(value: number) { separation = THREE.MathUtils.clamp(value, 0, 1); applySeparation(); },
    muscleView(value: MuscleView) { muscleView = value; updateSelection(); },
    bones(value: boolean) { showBones = value; updateSelection(); },
    section(axis: SectionAxis, position: number) { sectionAxis = axis; sectionPosition = position; applySection(); },
    hide() {
      const targets = selected.filter(mesh => !hidden.has(mesh));
      if (!targets.length) return;
      targets.forEach(mesh => hidden.add(mesh));
      hideHistory.push(targets);
      updateSelection();
    },
    undoHide() { hideHistory.pop()?.forEach(mesh => hidden.delete(mesh)); updateSelection(); },
    restore() { hidden.clear(); hideHistory.length = 0; updateSelection(); },
    direction(view: CameraView) {
      const distance = camera.position.distanceTo(controls.target);
      const directions = { front: [0, 0, 1], back: [0, 0, -1], right: [-1, 0, 0], left: [1, 0, 0] };
      camera.position.copy(controls.target).addScaledVector(new THREE.Vector3(...directions[view]), distance);
      camera.lookAt(controls.target);
      controls.update();
    },
    dispose() {
      disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      controls.removeEventListener("start", stopRotation);
      controls.dispose();
      if (root) disposeObject(root);
      baseMaterials.forEach((material) => material.dispose());
      boneMaterial.dispose();
      highlightMaterial.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointermove", pointerMove);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      renderer.domElement.removeEventListener("pointercancel", pointerCancel);
      renderer.domElement.removeEventListener("pointerleave", pointerLeave);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
