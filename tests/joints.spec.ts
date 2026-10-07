import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import { Box3, Matrix4, Vector3 } from "three";
import { anatomyItems, catalogCounts } from "../app/data/anatomy";
import jointData from "../app/data/joint-model.json";
import { jointAtSurface, modelMeshNames, preferredModel } from "../app/lib/skeleton-model";
import { jointRegions, jointSurfaceWeight } from "../app/lib/joint-highlight";

test("surface highlights stay at the selected joint and leave long bone shafts neutral", async () => {
  const document = await new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder }).read("public/models/joints.glb");
  const surfaces = new Map<string, Vector3[]>();
  const sourceNames = new Map<string, string>();
  const bounds = new Map<string, Box3>();
  for (const node of document.getRoot().listNodes()) {
    const fma = node.getExtras().fma;
    if (typeof fma !== "string" || !node.getMesh()) continue;
    const points: Vector3[] = [];
    const matrix = new Matrix4().fromArray(node.getWorldMatrix());
    for (const primitive of node.getMesh()!.listPrimitives()) {
      const positions = primitive.getAttribute("POSITION")!;
      for (let i = 0; i < positions.getCount(); i++) points.push(new Vector3().fromArray(positions.getElement(i, [])).applyMatrix4(matrix));
    }
    surfaces.set(fma, points);
    sourceNames.set(fma, String(node.getExtras().sourceName));
    bounds.set(fma, new Box3().setFromPoints(points));
  }
  const hipId = Object.keys(jointData.mappings).find(key => key.includes("coxae-dexter"))!;
  for (const actualId of ["art-humeri", "art-cubiti", "art-genus", hipId]) {
    const regions = jointRegions(actualId, bounds);
    expect(regions.length, actualId).toBeGreaterThan(0);
    for (const bone of new Set(regions.flatMap(region => region.bones))) {
      const localRegions = regions.filter(region => region.bones.includes(bone));
      const weights = surfaces.get(bone)!.map(point => jointSurfaceWeight(point, localRegions));
      expect(weights.some(weight => weight > 0.5), `${actualId}: ${bone} has visible joint surface`).toBe(true);
      if (/humerus|femur|tibia|radius|ulna/i.test(sourceNames.get(bone)!)) {
        const box = bounds.get(bone)!;
        const height = box.max.y - box.min.y;
        const shaft = surfaces.get(bone)!.filter(point => point.y > box.min.y + height * 0.4 && point.y < box.min.y + height * 0.6);
        expect(shaft.length).toBeGreaterThan(0);
        expect(shaft.every(point => jointSurfaceWeight(point, localRegions) === 0), `${actualId}: shaft stays neutral`).toBe(true);
      }
    }
  }
  const shoulder = jointRegions("art-humeri", bounds)[0];
  const elbow = jointRegions("art-cubiti", bounds);
  expect(jointSurfaceWeight(shoulder.center, elbow)).toBe(0);
  expect(jointRegions("missing", bounds)).toEqual([]);
});

test("joint locations reference distinct source surfaces", () => {
  const file = readFileSync("public/models/joints.glb");
  const gltf = JSON.parse(file.toString("utf8", 20, 20 + file.readUInt32LE(12)));
  const source = new Set<string>(gltf.nodes.filter((node: { mesh?: number }) => node.mesh !== undefined).map((node: { extras: { fma: string } }) => node.extras.fma));
  const meshNames = new Set<string>(gltf.nodes.filter((node: { mesh?: number }) => node.mesh !== undefined).map((node: { name: string }) => node.name));
  expect(jointData.coverage.catalog).toBe(catalogCounts.joints);
  expect(jointData.coverage.mapped).toBe(260);
  expect(jointData.coverage.markers).toBe(397);
  expect(file.byteLength).toBeLessThan(5_000_000);
  for (const [id, markers] of Object.entries(jointData.mappings)) {
    expect(anatomyItems.find(item => item.id === id)?.category).toBe("joints");
    expect(preferredModel(id)).toBe("joints");
    const surfaces = modelMeshNames(id, "joints");
    expect(surfaces.length).toBeGreaterThan(0);
    expect(surfaces.every(name => meshNames.has(name))).toBe(true);
    expect(new Set(surfaces).size).toBe(surfaces.length);
    for (const marker of markers) {
      expect(surfaces).not.toContain(marker.name);
      expect(marker.bones.length).toBeGreaterThan(0);
      expect(marker.bones.every(bone => source.has(bone))).toBe(true);
      expect(marker.position.every(Number.isFinite)).toBe(true);
      expect(marker.distance).toBeLessThan(0.08);
      const picked = jointAtSurface(`context_${marker.bones[0].toLowerCase()}`, marker.position);
      const contacts = jointData.mappings[picked as keyof typeof jointData.mappings];
      expect(contacts.some(contact => contact.bones.includes(marker.bones[0]) && contact.position.every((value, axis) => value === marker.position[axis]))).toBe(true);
    }
  }
  expect(jointData.mappings["art-humeri"]).toHaveLength(2);
  expect(jointData.mappings["atlas-joints-symphysis-pubica-1"]).toHaveLength(1);
  const medial = jointData.mappings["atlas-joints-articulatio-femorotibialis-medialis-dexter-1"][0].position;
  const lateral = jointData.mappings["atlas-joints-articulatio-femorotibialis-lateralis-dexter-2"][0].position;
  expect(medial[0] - lateral[0]).toBeGreaterThan(0.01);
  const rightAtlas = jointData.mappings["atlas-joints-articulatio-atlantooccipitalis-dexter-2"][0].position;
  const leftAtlas = jointData.mappings["atlas-joints-articulatio-atlantooccipitalis-sinister-2"][0].position;
  expect(leftAtlas[0] - rightAtlas[0]).toBeGreaterThan(0.01);
  const fourthTarsometatarsal = jointData.mappings["atlas-joints-articulationes-tarsometatarsales-dexter-10"][3];
  expect(fourthTarsometatarsal.bones).toContain("FMA24528");
  expect("atlas-joints-fonticulus-anterior-13" in jointData.mappings).toBe(false);
  const shoulder = jointData.mappings["art-humeri"][0];
  const elbow = jointData.mappings["art-cubiti"].find(contact => contact.bones.some(bone => shoulder.bones.includes(bone)))!;
  const sharedBone = shoulder.bones.find(bone => elbow.bones.includes(bone))!;
  expect(jointAtSurface(`context_${sharedBone.toLowerCase()}`, shoulder.position)).not.toBe(jointAtSurface(`context_${sharedBone.toLowerCase()}`, elbow.position));
  expect(jointAtSurface("unmapped", [0, 0, 0])).toBeUndefined();
});

async function selectJoint(page: Page, latin: string) {
  await page.getByRole("textbox", { name: "Anatomi menüsünü filtrele" }).fill(latin);
  await page.locator(".structure").filter({ has: page.locator("em", { hasText: new RegExp(`^${latin}$`) }) }).click();
}

async function openJoints(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await selectJoint(page, "Articulatio humeri");
  await page.getByRole("button", { name: "Model", exact: true }).click();
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-model", "joints", { timeout: 30000 });
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-matched-meshes", "4");
  await page.locator(".skeleton-viewport").scrollIntoViewIfNeeded();
}

async function surfacePixels(page: Page) {
  const canvas = page.locator(".skeleton-canvas canvas");
  const { data, info } = await sharp(await canvas.screenshot({ mask: [page.locator(".skeleton-tools")], maskColor: "#000000" })).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const orangePoints: { x: number; y: number }[] = [];
  let orange = 0;
  let neutral = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 140 && r > g * 1.25 && g > b * 1.1) { orange++; orangePoints.push({ x: (i / info.channels) % info.width, y: Math.floor(i / info.channels / info.width) }); }
    if (r > 50 && r < 215 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20) neutral++;
  }
  return { orange, neutral, orangePoints, width: info.width, height: info.height };
}

test("joint selection, model picking and view controls stay in sync", async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" && /WebGL|shader/i.test(message.text())) errors.push(message.text()); });
  await openJoints(page);
  const initial = await surfacePixels(page);
  expect(initial.orange).toBeGreaterThan(300);
  expect(initial.neutral).toBeGreaterThan(initial.orange * 4);
  expect(Math.max(...initial.orangePoints.map(point => point.y)) - Math.min(...initial.orangePoints.map(point => point.y))).toBeLessThan(initial.height * 0.12);
  await page.screenshot({ path: "artifacts/joints-desktop.png", fullPage: true });
  const canvas = page.locator(".skeleton-canvas canvas");
  const before = await canvas.screenshot();
  await page.getByRole("button", { name: "Saydam", exact: true }).click();
  expect((await canvas.screenshot()).equals(before)).toBe(false);
  await page.getByRole("button", { name: "Seçili eklemi gizle", exact: true }).click();
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-hidden-meshes", "4");
  await expect.poll(async () => (await surfacePixels(page)).orange).toBeLessThan(10);
  await page.getByRole("button", { name: "Son gizlemeyi geri al", exact: true }).click();
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-hidden-meshes", "0");
  expect((await surfacePixels(page)).orange).toBeGreaterThan(300);
  await selectJoint(page, "Articulatio coxae dextra");
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-matched-meshes", "2");
  await page.getByRole("button", { name: "Tek eklem", exact: true }).click();
  const focusedHip = await surfacePixels(page);
  expect(focusedHip.orange).toBeGreaterThan(initial.orange * 3);
  expect(focusedHip.neutral).toBeGreaterThan(focusedHip.orange);
  await page.screenshot({ path: "artifacts/joints-hip.png", fullPage: true });
  await page.getByRole("button", { name: "Saydam", exact: true }).click();
  await page.getByRole("button", { name: "Seçili ekleme odaklan", exact: true }).click();
  await page.screenshot({ path: "artifacts/joints-hip-ghost.png", fullPage: true });
  await page.getByRole("button", { name: "Görünümü sıfırla", exact: true }).click();
  const front = await canvas.screenshot();
  await page.getByRole("button", { name: "Arka", exact: true }).click();
  expect((await canvas.screenshot()).equals(front)).toBe(false);
  await page.getByRole("button", { name: "Ön", exact: true }).click();
  await page.getByRole("combobox", { name: "Kesit düzlemi" }).selectOption("sagittal");
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-section", "sagittal");
  const sectionImage = await canvas.screenshot();
  await page.getByRole("slider", { name: "Kesit konumu" }).focus();
  await page.keyboard.press("Home");
  expect((await canvas.screenshot()).equals(sectionImage)).toBe(false);
  await page.getByRole("button", { name: "Görünümü sıfırla", exact: true }).click();
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-section", "off");
  await selectJoint(page, "Articulatio humeri");
  await page.getByRole("button", { name: "Seçili ekleme odaklan", exact: true }).click();
  const hit = (await surfacePixels(page)).orangePoints;
  expect(hit.length).toBeGreaterThan(300);
  const bounds = (await canvas.boundingBox())!;
  const candidates = [...new Map(hit.map(point => [`${Math.round(point.x / 12)},${Math.round(point.y / 12)}`, point])).values()];
  let target: { x: number; y: number } | undefined;
  for (const point of candidates) {
    await page.mouse.move(bounds.x + point.x / initial.width * bounds.width, bounds.y + point.y / initial.height * bounds.height);
    await page.waitForTimeout(65);
    const title = await canvas.getAttribute("title");
    if (title && /Articulatio humeri (dextra|sinistra)/.test(title)) { target = point; break; }
  }
  expect(target).toBeDefined();
  await page.mouse.click(bounds.x + target!.x / initial.width * bounds.width, bounds.y + target!.y / initial.height * bounds.height);
  await expect(page.locator(".skeleton-canvas")).not.toHaveAttribute("data-selected-joint", "art-humeri");
  await expect(page.getByRole("textbox", { name: "Anatomi menüsünü filtrele" })).toHaveValue("Articulatio humeri");
  await expect(page.locator(".skeleton-selection")).toContainText("Articulatio");
  await selectJoint(page, "Junctura fibrosa");
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-matched-meshes", "0");
  await expect(page.getByText("Bu ekleme ait yapılar kaynak modelde bulunmuyor.")).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe("joint touch view", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test("joint model renders and controls fit a narrow screen", async ({ page }) => {
    test.setTimeout(75000);
    await openJoints(page);
    const initial = await surfacePixels(page);
    expect(initial.orange).toBeGreaterThan(100);
    await page.screenshot({ path: "artifacts/joints-mobile.png", fullPage: true });
    await page.locator(".skeleton-viewport").scrollIntoViewIfNeeded();
    const point = initial.orangePoints[Math.floor(initial.orangePoints.length / 2)];
    const bounds = (await page.locator(".skeleton-canvas canvas").boundingBox())!;
    await page.touchscreen.tap(bounds.x + point.x / initial.width * bounds.width, bounds.y + point.y / initial.height * bounds.height);
    await expect(page.getByRole("textbox", { name: "Anatomi menüsünü filtrele" })).toHaveValue("Articulatio humeri");
    await expect(page.locator(".skeleton-canvas")).not.toHaveAttribute("data-selected-joint", "art-humeri");
    await page.getByRole("button", { name: "Saydam", exact: true }).click();
    await page.getByRole("button", { name: "Seçili ekleme odaklan", exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.setViewportSize({ width: 320, height: 740 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});
