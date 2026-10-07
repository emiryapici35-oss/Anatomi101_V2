import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { anatomyItems } from "../app/data/anatomy";
import { normalizeMeshName, skeletonMeshNames, meshBoneIndex, modelMeshNames } from "../app/lib/skeleton-model";
import skullParts from "../app/data/skull-parts.json";

test("catalog mappings resolve to real, distinct GLB meshes", () => {
  const file = readFileSync("public/models/ct_derived_human_skeleton.glb");
  const json = JSON.parse(file.toString("utf8", 20, 20 + file.readUInt32LE(12)));
  const names = new Set<string>(json.nodes.filter((node: { mesh?: number }) => node.mesh !== undefined).map((node: { name: string }) => normalizeMeshName(node.name)));
  const assigned = new Map<string, string>();
  const missing: string[] = [];
  let matched = 0;
  for (const bone of anatomyItems.filter((item) => item.category === "bones")) {
    const targets = skeletonMeshNames(bone.id);
    if (!targets.length) { missing.push(bone.id); continue; }
    matched++;
    for (const target of targets) {
      expect(names.has(target), `${bone.id}: ${target}`).toBe(true);
      expect(assigned.has(target), `${target} assigned to two bones`).toBe(false);
      assigned.set(target, bone.id);
    }
  }
  expect(matched).toBe(179);
  expect(missing).toHaveLength(27);
  expect(missing.every((id) => anatomyItems.find((bone) => bone.id === id)?.group.match(/Kafa|Yüz|İşitme/))).toBe(true);
  expect(skeletonMeshNames("vertebra-cervicalis-1")).toEqual(["c3"]);
  expect(skeletonMeshNames("vertebra-cervicalis-5")).toEqual(["c7"]);
  expect(skeletonMeshNames("os-frontale")).toEqual([]);
  expect(skeletonMeshNames("m-deltoideus")).toEqual([]);
  console.log(`Model coverage: ${matched} bones; ${missing.length} unavailable skull/ear bones.`);
});

test("segmented skull contains all 22 named bones with source identifiers", () => {
  const file = readFileSync("public/models/skull-segmented.glb");
  const json = JSON.parse(file.toString("utf8", 20, 20 + file.readUInt32LE(12)));
  const nodes = json.nodes.filter((node: { mesh?: number }) => node.mesh !== undefined);
  expect(nodes).toHaveLength(22);
  const index = meshBoneIndex(anatomyItems.filter((item) => item.category === "bones").map((item) => item.id), "skull");
  for (const part of skullParts) {
    const node = nodes.find((candidate: { name: string }) => candidate.name === part.id);
    expect(node?.extras.fma).toBe(part.fma);
    expect(node?.extras.sourceName).toBe(part.name);
    expect(index.get(node.name)).toBe(part.id);
    const position = json.accessors[json.meshes[node.mesh].primitives[0].attributes.POSITION];
    expect(position.count).toBeGreaterThan(100);
    expect(anatomyItems.some((item) => item.id === part.id && item.category === "bones")).toBe(true);
  }
  expect(anatomyItems.filter((item) => item.category === "bones" && (skeletonMeshNames(item.id).length || modelMeshNames(item.id, "skull").length))).toHaveLength(200);
});

async function openModel(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Model", exact: true }).click();
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-matched-meshes", "1");
  await expect(page.locator(".skeleton-viewport")).toHaveAttribute("aria-busy", "false");
}

async function selectBone(page: Page, query: string, latin: string) {
  await page.getByRole("textbox", { name: "Anatomi menüsünü filtrele" }).fill(query);
  await page.locator(".structure").filter({ has: page.locator("em", { hasText: latin }) }).first().click();
}

async function warmPixels(page: Page) {
  const screenshot = await page.locator(".skeleton-canvas canvas").screenshot();
  const { data, info } = await sharp(screenshot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let count = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i] > 150 && data[i] > data[i + 1] * 1.2 && data[i + 1] > data[i + 2] * 1.1) count++;
  }
  return count;
}

async function highlightedPoint(page: Page) {
  const canvas = page.locator(".skeleton-canvas canvas");
  const { data, info } = await sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i] > 150 && data[i] > data[i + 1] * 1.2 && data[i + 1] > data[i + 2] * 1.1) {
      points.push({ x: (i / info.channels) % info.width, y: Math.floor(i / info.channels / info.width) });
    }
  }
  expect(points.length).toBeGreaterThan(50);
  const center = { x: points.reduce((sum, point) => sum + point.x, 0) / points.length, y: points.reduce((sum, point) => sum + point.y, 0) / points.length };
  const closest = points.reduce((best, point) => Math.hypot(point.x - center.x, point.y - center.y) < Math.hypot(best.x - center.x, best.y - center.y) ? point : best);
  const bounds = (await canvas.boundingBox())!;
  return { x: bounds.x + (closest.x + 0.5) / info.width * bounds.width, y: bounds.y + (closest.y + 0.5) / info.height * bounds.height };
}

test("model picks preserve menu filters and folds; dragging and empty space do not select", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openModel(page);
  const rightFemur = await highlightedPoint(page);
  await selectBone(page, "Tibia", "Tibia sinistra");
  const menuBefore = await page.locator(".sidebar button[aria-expanded]").evaluateAll(buttons => buttons.map(button => [button.textContent, button.getAttribute("aria-expanded")]));
  const scrollBefore = await page.locator(".sidebar").evaluate(panel => panel.scrollTop);
  await page.mouse.click(rightFemur.x, rightFemur.y);
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-selected-bone", "femur-dexter");
  expect(await page.locator(".sidebar button[aria-expanded]").evaluateAll(buttons => buttons.map(button => [button.textContent, button.getAttribute("aria-expanded")]))).toEqual(menuBefore);
  expect(await page.locator(".sidebar").evaluate(panel => panel.scrollTop)).toBe(scrollBefore);
  await expect(page.getByRole("textbox", { name: "Anatomi menüsünü filtrele" })).toHaveValue("Tibia");
  await expect(page.locator(".detail-panel h1")).toHaveAttribute("aria-label", "Femur dextrum");
  const canvas = page.locator(".skeleton-canvas canvas");
  const before = await canvas.screenshot();
  await page.mouse.move(rightFemur.x, rightFemur.y);
  await page.mouse.down();
  await page.mouse.move(rightFemur.x + 90, rightFemur.y - 20, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-selected-bone", "femur-dexter");
  expect((await canvas.screenshot()).equals(before)).toBe(false);
  const bounds = (await canvas.boundingBox())!;
  await page.mouse.click(bounds.x + 8, bounds.y + 8);
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-selected-bone", "femur-dexter");
});

test("desktop selection, framing, rotation, missing bones and skull", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openModel(page);
  expect(await warmPixels(page)).toBeGreaterThan(200);
  await page.screenshot({ path: "artifacts/model-desktop.png", fullPage: true });
  await selectBone(page, "Femur", "Femur sinistrum");
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-selected-bone", "femur-sinister");
  expect(await warmPixels(page)).toBeGreaterThan(200);
  await page.getByRole("button", { name: "Seçili kemiğe odaklan", exact: true }).click();
  expect(await warmPixels(page)).toBeGreaterThan(2000);
  await page.getByRole("button", { name: "Yalnızca seçili kemik", exact: true }).click();
  const before = await page.locator("canvas").screenshot();
  await page.getByRole("button", { name: "Otomatik döndür", exact: true }).click();
  await page.waitForTimeout(800);
  expect((await page.locator("canvas").screenshot()).equals(before)).toBe(false);
  await page.getByRole("button", { name: "Görünümü sıfırla", exact: true }).click();
  await selectBone(page, "Phalanx proximalis pollicis", "Phalanx proximalis pollicis dextra");
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-matched-meshes", "1");
  await page.getByRole("button", { name: "Seçili kemiğe odaklan", exact: true }).click();
  expect(await warmPixels(page)).toBeGreaterThan(1000);
  await selectBone(page, "Tibia", "Tibia dextra");
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-selected-bone", "tibia-dexter");
  expect(await warmPixels(page)).toBeGreaterThan(1000);
  await selectBone(page, "Os frontale", "Os frontale");
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-model", "skull");
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-matched-meshes", "1");
  expect(await warmPixels(page)).toBeGreaterThan(1000);
  await page.screenshot({ path: "artifacts/model-skull.png", fullPage: true });
  const frontalPoint = await highlightedPoint(page);
  await selectBone(page, "Os occipitale", "Os occipitale");
  await page.mouse.click(frontalPoint.x, frontalPoint.y);
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-selected-bone", "os-frontale");
  await expect(page.locator(".skeleton-selection")).toContainText("Os frontale");
  await expect(page.getByRole("textbox", { name: "Anatomi menüsünü filtrele" })).toHaveValue("Os occipitale");
  await page.getByRole("slider", { name: "Kafatası kemiklerini ayır" }).focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("slider")).toHaveValue("100");
  await page.screenshot({ path: "artifacts/model-skull-exploded.png", fullPage: true });
  await selectBone(page, "Os ethmoidale", "Os ethmoidale");
  await page.getByRole("button", { name: "Yalnızca seçili kemik", exact: true }).click();
  expect(await warmPixels(page)).toBeGreaterThan(1000);
  await page.getByRole("button", { name: "Tarama", exact: true }).click();
  await expect(page.getByText("Orijinal tarama tek parça; ayrı kemik seçimi Kafatası modelinde mevcut.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Seçili kemiğe odaklan", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "İskelet", exact: true }).click();
  await selectBone(page, "Tibia", "Tibia dextra");
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-matched-meshes", "1");
  await page.getByRole("button", { name: "Koyu temaya geç", exact: true }).click();
  await page.screenshot({ path: "artifacts/model-dark.png", fullPage: true });
  expect(await warmPixels(page)).toBeGreaterThan(100);
  expect(errors).toEqual([]);
});

test.describe("touch selection", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test("tap selects the bone and skull controls fit the mobile viewport", async ({ page }) => {
    await openModel(page);
    await page.locator(".skeleton-viewer").scrollIntoViewIfNeeded();
    const rightFemur = await highlightedPoint(page);
    const originalBounds = (await page.locator("canvas").boundingBox())!;
    await selectBone(page, "Tibia", "Tibia sinistra");
    // Restore the same scroll position after the sidebar selection.
    await page.locator(".skeleton-viewer").scrollIntoViewIfNeeded();
    const newBounds = (await page.locator("canvas").boundingBox())!;
    await page.touchscreen.tap(newBounds.x + (rightFemur.x - originalBounds.x) / originalBounds.width * newBounds.width, newBounds.y + (rightFemur.y - originalBounds.y) / originalBounds.height * newBounds.height);
    await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-selected-bone", "femur-dexter");
    await selectBone(page, "Os frontale", "Os frontale");
    await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-model", "skull");
    await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-matched-meshes", "1");
    expect(await warmPixels(page)).toBeGreaterThan(1000);
    await page.screenshot({ path: "artifacts/model-skull-mobile.png", fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});

test("mobile model remains usable without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openModel(page);
  await page.locator(".skeleton-viewer").scrollIntoViewIfNeeded();
  expect(await warmPixels(page)).toBeGreaterThan(100);
  await page.screenshot({ path: "artifacts/model-mobile.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Seçili kemiğe odaklan", exact: true }).click();
  expect(await warmPixels(page)).toBeGreaterThan(1000);
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("failed model request can be retried", async ({ page }) => {
  await page.route("**/models/ct_derived_human_skeleton.glb", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Model", exact: true }).click();
  await expect(page.locator(".skeleton-viewer").getByRole("alert")).toContainText("Model yüklenemedi");
  await page.unroute("**/models/ct_derived_human_skeleton.glb");
  await page.getByRole("button", { name: "Yeniden dene", exact: true }).click();
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-matched-meshes", "1");
});
