import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

async function open(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
}

test("menus start closed and closing or switching a system resets its groups", async ({ page }) => {
  await open(page);
  const expandedSystems = page.locator('.system-title[aria-expanded="true"]');
  const expandedGroups = page.locator('.structure-group-title[aria-expanded="true"]');
  const bones = page.locator(".system-title").filter({ hasText: "Kemikler" });
  const muscles = page.locator(".system-title").filter({ hasText: "Kaslar" });
  await expect(expandedSystems).toHaveCount(0);
  await bones.click();
  await expect(expandedGroups).toHaveCount(0);
  await page.locator(".structure-group-title").first().click();
  await expect(expandedGroups).toHaveCount(1);
  await page.locator(".structure").first().click();
  await expect(expandedGroups).toHaveCount(1);
  await bones.click();
  await bones.click();
  await expect(expandedGroups).toHaveCount(0);
  await page.locator(".structure-group-title").first().click();
  await muscles.click();
  await expect(expandedGroups).toHaveCount(0);
  await bones.click();
  await expect(expandedGroups).toHaveCount(0);
  await page.getByRole("button", { name: "Tüm menüleri kapat" }).click();
  await expect(expandedSystems).toHaveCount(0);
  await page.screenshot({ path: "artifacts/menus-closed.png", fullPage: true });
});

test("filtered systems and groups can be folded and cleared without stale state", async ({ page }) => {
  await open(page);
  const search = page.getByRole("textbox", { name: "Anatomi menüsünü filtrele" });
  await search.fill("Femur");
  const bones = page.locator(".system-title").filter({ hasText: "Kemikler" });
  await expect(bones).toHaveAttribute("aria-expanded", "true");
  const group = page.locator(".structure-group-title").first();
  await group.click();
  await expect(group).toHaveAttribute("aria-expanded", "false");
  await group.click();
  await expect(page.locator(".structure").first()).toBeVisible();
  await bones.click();
  await expect(bones).toHaveAttribute("aria-expanded", "false");
  await bones.click();
  await expect(page.locator(".structure").first()).toBeVisible();
  await search.focus();
  await page.keyboard.press("Escape");
  await expect(search).toHaveValue("");
  await expect(page.locator('.system-title[aria-expanded="true"]')).toHaveCount(0);
  await bones.click();
  await expect(page.locator('.structure-group-title[aria-expanded="true"]')).toHaveCount(0);
  await search.fill("Tibia");
  await page.getByRole("button", { name: "Tüm menüleri kapat" }).click();
  await expect(search).toHaveValue("");
  await expect(page.locator('.system-title[aria-expanded="true"]')).toHaveCount(0);
});

async function highlightedSurface(page: Page) {
  const canvas = page.locator(".skeleton-canvas canvas");
  const { data, info } = await sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i] > 150 && data[i] > data[i + 1] * 1.2 && data[i + 1] > data[i + 2] * 1.1) points.push({ x: (i / info.channels) % info.width, y: Math.floor(i / info.channels / info.width) });
  }
  expect(points.length).toBeGreaterThan(100);
  const point = points[Math.floor(points.length / 2)];
  const bounds = (await canvas.boundingBox())!;
  return { x: bounds.x + (point.x + 0.5) / info.width * bounds.width, y: bounds.y + (point.y + 0.5) / info.height * bounds.height };
}

for (const width of [1440, 390]) test(`model navigation preserves closed menus and works at ${width}px`, async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await open(page);
  await page.getByRole("button", { name: "Model", exact: true }).click();
  await expect(page.locator(".skeleton-viewport")).toHaveAttribute("aria-busy", "false");
  await page.locator(".skeleton-viewport").scrollIntoViewIfNeeded();
  const point = await highlightedSurface(page);
  await page.mouse.click(point.x, point.y);
  await expect(page.locator('.system-title[aria-expanded="true"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Seçili kemiğe odaklan" }).click();
  await page.getByRole("button", { name: "Yalnızca seçili kemik", exact: true }).click();
  const canvas = page.locator(".skeleton-canvas canvas");
  const front = await canvas.screenshot();
  await page.getByRole("button", { name: "Sağ", exact: true }).click();
  expect((await canvas.screenshot()).equals(front)).toBe(false);
  await page.getByRole("button", { name: "Sağ", exact: true }).click();
  await page.getByRole("button", { name: "Modeli genişlet" }).click();
  await expect(page.locator(".sidebar")).toBeHidden();
  await expect(page.locator(".detail-panel")).toBeHidden();
  await expect(page.getByRole("button", { name: "Sağ", exact: true })).toHaveAttribute("aria-pressed", "true");
  await highlightedSurface(page);
  await page.screenshot({ path: `artifacts/model-expanded-${width}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator(".sidebar")).toBeVisible();
  await expect(page.locator('.system-title[aria-expanded="true"]')).toHaveCount(0);
  const rotate = page.getByRole("button", { name: "Otomatik döndür", exact: true });
  await rotate.click();
  await expect(rotate).toHaveAttribute("aria-pressed", "true");
  await page.locator(".skeleton-viewport").scrollIntoViewIfNeeded();
  const bounds = (await canvas.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 40, bounds.y + bounds.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(rotate).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Görünümü sıfırla" }).click();
  await expect(page.getByRole("button", { name: "Ön", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Yalnızca seçili kemik", exact: true })).toHaveAttribute("aria-pressed", "false");
});
