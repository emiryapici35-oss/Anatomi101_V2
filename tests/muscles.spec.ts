import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { anatomyItems, catalogCounts } from "../app/data/anatomy";
import muscleData from "../app/data/muscle-model.json";
import { meshBoneIndex, modelMeshNames, preferredModel } from "../app/lib/skeleton-model";

test("muscle mappings are exact source meshes, not invented substitutes", () => {
  const file = readFileSync("public/models/muscles.glb");
  const gltf = JSON.parse(file.toString("utf8", 20, 20 + file.readUInt32LE(12)));
  const nodes = gltf.nodes.filter((node: { mesh?: number }) => node.mesh !== undefined);
  const index = meshBoneIndex([], "muscles");
  expect(muscleData.coverage.catalog).toBe(catalogCounts.muscles);
  expect(muscleData.coverage.mapped).toBe(Object.keys(muscleData.mappings).length);
  expect(muscleData.parts).toHaveLength(muscleData.coverage.meshes);
  for (const part of muscleData.parts) {
    const node = nodes.find((node: { name: string }) => node.name === part.mesh);
    expect(node?.extras.fma).toBe(part.fma);
    expect(node?.extras.sourceName).toBe(part.name);
    expect(part.name).not.toMatch(/ligament|tendon|aponeurosis/);
    expect(index.get(part.mesh)).toBe(part.itemId);
    expect(anatomyItems.find(item => item.id === part.itemId)?.category).toBe("muscles");
  }
  for (const [id, meshes] of Object.entries(muscleData.mappings)) {
    expect(preferredModel(id)).toBe("muscles");
    expect(meshes.every(mesh => muscleData.parts.some(part => part.mesh === mesh))).toBe(true);
    expect(new Set(meshes).size).toBe(meshes.length);
  }
  expect(modelMeshNames("m-rectus-abdominis", "muscles")).toEqual(expect.arrayContaining(["fma13377", "fma13378"]));
  expect(anatomyItems.filter(item => item.category === "muscles" && item.latin.startsWith("Musculus arytenoideus transversus"))).toHaveLength(1);
  expect(anatomyItems.filter(item => item.category === "muscles" && item.latin.startsWith("Musculus sphincter ani externus"))).toHaveLength(1);
  expect(anatomyItems.filter(item => item.latin.startsWith("Musculus adductor minimus"))).toHaveLength(2);
  expect(file.byteLength).toBeLessThan(25_000_000);
});

async function choose(page: Page, latin: string) {
  await page.getByRole("textbox", { name: "Anatomi menüsünü filtrele" }).fill(latin);
  await page.locator(".structure").filter({ has: page.locator("em", { hasText: new RegExp(`^${latin}$`) }) }).click();
}

async function openMuscles(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await choose(page, "Musculus pectoralis major");
  await page.getByRole("button", { name: "Model", exact: true }).click();
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-model", "muscles", { timeout: 30000 });
  await expect(page.locator(".skeleton-canvas")).not.toHaveAttribute("data-matched-meshes", "0");
  await page.locator(".skeleton-viewport").scrollIntoViewIfNeeded();
}

async function pixels(page: Page) {
  const canvas = page.locator(".skeleton-canvas canvas");
  const { data, info } = await sharp(await canvas.screenshot({ mask: [page.locator(".skeleton-tools")], maskColor: "#000000" })).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const points: { x: number; y: number }[] = [];
  let red = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 1] > data[i] * 1.25 && data[i + 2] > data[i] * 1.2 && data[i + 1] > 90) points.push({ x: (i / info.channels) % info.width, y: Math.floor(i / info.channels / info.width) });
    if (data[i] > data[i + 1] * 1.2 && data[i] > data[i + 2] * 1.2) red++;
  }
  return { points, red, width: info.width, height: info.height };
}

test("muscles render, canvas picking syncs menu, deep layers and sections work", async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1440, height: 1100 });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await openMuscles(page);
  const initial = await pixels(page);
  expect(initial.points.length).toBeGreaterThan(100);
  expect(initial.red).toBeGreaterThan(1000);
  await page.screenshot({ path: "artifacts/muscles-desktop.png", fullPage: true });
  const bounds = (await page.locator("canvas").boundingBox())!;
  const point = initial.points[Math.floor(initial.points.length / 2)];
  const oldId = await page.locator(".skeleton-canvas").getAttribute("data-selected-bone");
  await page.mouse.click(bounds.x + point.x / initial.width * bounds.width, bounds.y + point.y / initial.height * bounds.height);
  await expect(page.locator(".skeleton-canvas")).not.toHaveAttribute("data-selected-bone", oldId!);
  await expect(page.locator(".skeleton-selection")).toContainText("pectoralis major");
  await expect(page.getByRole("textbox", { name: "Anatomi menüsünü filtrele" })).toHaveValue("Musculus pectoralis major");
  const beforeHide = await page.locator("canvas").screenshot();
  await page.getByRole("button", { name: "Seçili kası gizle", exact: true }).click();
  await expect(page.locator(".skeleton-canvas")).not.toHaveAttribute("data-hidden-meshes", "0");
  expect((await page.locator("canvas").screenshot()).equals(beforeHide)).toBe(false);
  await page.getByRole("button", { name: "Son gizlemeyi geri al", exact: true }).click();
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-hidden-meshes", "0");
  await choose(page, "Musculus pectoralis minor dexter");
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-matched-meshes", "1");
  await page.getByRole("button", { name: "Saydam", exact: true }).click();
  await page.getByRole("button", { name: "Seçili kasa odaklan", exact: true }).click();
  expect((await pixels(page)).points.length).toBeGreaterThan(1000);
  await page.screenshot({ path: "artifacts/muscles-deep.png", fullPage: true });
  await page.getByRole("button", { name: "Tek kas", exact: true }).click();
  await page.screenshot({ path: "artifacts/muscles-isolated.png", fullPage: true });
  const isolated = await pixels(page);
  expect(isolated.points.length).toBeGreaterThan(1000);
  await expect.poll(async () => (await pixels(page)).red).toBeLessThan(30);
  await page.getByRole("button", { name: "Görünümü sıfırla", exact: true }).click();
  const front = await page.locator("canvas").screenshot();
  await page.getByRole("button", { name: "Arka", exact: true }).click();
  expect((await page.locator("canvas").screenshot()).equals(front)).toBe(false);
  await page.getByRole("button", { name: "Ön", exact: true }).click();
  await page.getByRole("combobox", { name: "Kesit düzlemi" }).selectOption("sagittal");
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-section", "sagittal");
  await page.screenshot({ path: "artifacts/muscles-section.png", fullPage: true });
  const sectionImage = await page.locator("canvas").screenshot();
  await page.getByRole("slider", { name: "Kesit konumu" }).focus();
  await page.keyboard.press("Home");
  expect((await page.locator("canvas").screenshot()).equals(sectionImage)).toBe(false);
  await choose(page, "Musculus rectus superior dexter");
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-matched-meshes", "0");
  await expect(page.getByText("Bu kas veya alt parçası, kaynak modelde ayrı bir yapı olarak bulunmuyor.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Seçili kasa odaklan", exact: true })).toBeDisabled();
  expect(errors).toEqual([]);
});

test.describe("muscle touch view", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test("mobile model is nonblank, selectable and fits narrow screens", async ({ page }) => {
    test.setTimeout(90000);
    await openMuscles(page);
    const shot = await pixels(page);
    expect(shot.red).toBeGreaterThan(300);
    expect(shot.points.length).toBeGreaterThan(50);
    const bounds = (await page.locator("canvas").boundingBox())!;
    const point = shot.points[Math.floor(shot.points.length / 2)];
    await page.touchscreen.tap(bounds.x + point.x / shot.width * bounds.width, bounds.y + point.y / shot.height * bounds.height);
    await expect(page.locator(".skeleton-selection")).toContainText("pectoralis major");
    await page.getByRole("button", { name: "Saydam", exact: true }).click();
    await page.screenshot({ path: "artifacts/muscles-mobile.png", fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.setViewportSize({ width: 320, height: 740 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});

test("failed muscle download is retryable", async ({ page }) => {
  await page.route("**/models/muscles.glb", route => route.abort());
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await choose(page, "Musculus pectoralis major");
  await page.getByRole("button", { name: "Model", exact: true }).click();
  await expect(page.locator(".skeleton-viewer").getByRole("alert")).toContainText("Model yüklenemedi");
  await page.unroute("**/models/muscles.glb");
  await page.getByRole("button", { name: "Yeniden dene", exact: true }).click();
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-model", "muscles", { timeout: 30000 });
});
