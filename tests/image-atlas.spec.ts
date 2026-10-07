import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";
import atlas from "../app/data/image-atlas.json";
import { anatomyItems } from "../app/data/anatomy";

async function choose(page: Page, id: string) {
  const item = anatomyItems.find(item => item.id === id)!;
  await page.getByRole("textbox", { name: "Anatomi menüsünü filtrele" }).fill(item.latin);
  await page.locator(".structure").filter({ has: page.getByText(item.latin, { exact: true }) }).first().click();
}

test("online atlas preserves source bytes, exact menu boundaries and honest coverage", async () => {
  const represented = new Set<string>();
  for (const plate of atlas.plates) {
    expect(plate.src).toMatch(/^\/atlas\/source-[a-z0-9-]+\.(png|svg|jpg)$/);
    const bytes = readFileSync(`public${plate.src}`);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(plate.source.sha256);
    expect(plate.source.original).toMatch(/^https:\/\/(smart\.servier\.com|upload\.wikimedia\.org|raw\.githubusercontent\.com)\//);
    expect(plate.source.license).toMatch(/CC BY 4.0|CC0 1.0|CC BY-SA 3.0|Public domain/);
    await sharp(bytes).resize({ width: 64 }).raw().toBuffer();
    for (const part of plate.items) {
      const item = anatomyItems.find(item => item.id === part.id)!;
      expect(item.category).toBe(plate.category);
      expect(item.group).toBe(plate.group);
      if (part.point) for (const coordinate of part.point) { expect(coordinate).toBeGreaterThan(0); expect(coordinate).toBeLessThan(100); }
      represented.add(part.id);
    }
  }
  expect(represented.size).toBe(atlas.coverage.mapped);
  expect(new Set(atlas.plates.map(plate => plate.category)).size).toBe(8);
  expect(new Set(atlas.plates.map(plate => plate.id)).size).toBe(atlas.plates.length);
  for (const group of atlas.coverage.groups) expect(atlas.plates.some(plate => plate.category === group.category && plate.group === group.group)).toBe(true);
});

for (const width of [1440, 390]) test(`online atlas loads originals and keeps menu state at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await choose(page, "ren-dexter");
  await page.getByRole("button", { name: "Görsel", exact: true }).click();
  const viewer = page.getByRole("region", { name: "Görsel anatomi atlası" });
  await expect(viewer.locator(".atlas-original img")).toHaveAttribute("src", /openstax-2608/);
  await expect.poll(() => viewer.locator("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.getByRole("textbox", { name: "Anatomi menüsünü filtrele" }).fill("");
  await expect(page.locator(".sidebar-result-summary")).toHaveCount(0);
  const menuBefore = await page.locator(".sidebar .system-title").evaluateAll(buttons => buttons.map(button => button.getAttribute("aria-expanded")));
  await viewer.locator(".atlas-legend").getByRole("button", { name: "Sol böbrek (Ren sinister) seç", exact: true }).click();
  await expect(viewer.locator(".skeleton-selection strong")).toHaveText("Sol böbrek");
  expect(await page.locator(".sidebar .system-title").evaluateAll(buttons => buttons.map(button => button.getAttribute("aria-expanded")))).toEqual(menuBefore);
  await viewer.getByRole("button", { name: "Yakınlaştır", exact: true }).click();
  await expect(viewer.locator(".atlas-toolbar output")).toHaveText("%150");
  await viewer.getByRole("button", { name: "Görseli sığdır" }).click();
  await viewer.getByRole("button", { name: "Geniş görünüm" }).click();
  await expect(page.locator(".sidebar")).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(page.locator(".sidebar")).toBeVisible();
  await viewer.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `artifacts/online-atlas-${width}.png`, fullPage: true });
  const { data, info } = await sharp(await viewer.locator(".atlas-original").screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let anatomyPixels = 0;
  for (let i = 0; i < data.length; i += info.channels) if (data[i] > data[i + 1] * 1.2 && data[i] > data[i + 2] * 1.1) anatomyPixels++;
  expect(anatomyPixels).toBeGreaterThan(100);
  await choose(page, "encephalon");
  await expect(viewer.locator(".atlas-original img")).toHaveAttribute("src", /openstax-1311/);
  await choose(page, "medulla-spinalis");
  await expect(viewer.locator(".atlas-missing")).toHaveCount(0);
  await expect(viewer.locator(".atlas-original img")).toHaveAttribute("src", /openstax-1313/);
  await choose(page, "hepar");
  await viewer.getByRole("button", { name: "Sonraki görsel" }).click();
  await expect(viewer.locator(".atlas-original img")).toHaveAttribute("src", /openstax-2208/);
  for (const id of ["cor", "bronchi", "uterus", "glandula-thyroidea", "bulbus-oculi"]) {
    await choose(page, id);
    await expect.poll(() => viewer.locator("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(viewer.getByRole("link", { name: /Servier Medical Art|Wikimedia Commons|OpenStax/ })).toBeVisible();
    expect(await page.locator(".skeleton-canvas").count()).toBe(0);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

for (const width of [1440, 390]) test(`digestive substructure plates remain inside their own submenu at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await choose(page, "atlas-digestive-fundus-ventriculi-6");
  await page.getByRole("button", { name: "Görsel", exact: true }).click();
  const viewer = page.getByRole("region", { name: "Görsel anatomi atlası" });
  await expect(viewer.locator(".atlas-original img")).toHaveAttribute("src", /openstax-2414/);
  await expect(viewer.locator(".atlas-legend li")).toHaveCount(9);
  await expect(viewer.locator(".atlas-legend")).not.toContainText("Karaciğer");
  await viewer.getByRole("button", { name: "Mide gövdesi (Corpus ventriculi) seç" }).click();
  await expect(viewer.locator(".skeleton-selection strong")).toHaveText("Mide gövdesi");
  await page.screenshot({ path: `artifacts/digestive-atlas-${width}.png`, fullPage: true });
  await choose(page, "atlas-digestive-fundus-vesicae-biliaris-7");
  await expect(viewer.locator(".atlas-original img")).toHaveAttribute("src", /openstax-2425/);
  await expect(viewer.locator(".atlas-pagination")).toContainText("2 / 7");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
