import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

test("CT source remains byte-identical and has no procedural chest overlay", () => {
  const bytes = readFileSync("public/models/ct_derived_human_skeleton.glb");
  expect(createHash("sha256").update(bytes).digest("hex")).toBe("a1f277090209db09b4ebb9b468e6d3a3d4649ad26eac893b9bc7b2e90fb940e6");
  const scene = readFileSync("app/lib/skeleton-scene.ts", "utf8");
  expect(scene).not.toContain("addCostalCartilage");
  expect(scene).not.toContain("costal-cartilage-schematic");
});

for (const width of [1440, 390]) test(`original thorax renders at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("textbox", { name: "Anatomi menüsünü filtrele" }).fill("Sternum");
  await page.locator(".structure").filter({ has: page.locator("em", { hasText: /^Sternum$/ }) }).click();
  await page.getByRole("button", { name: "Model", exact: true }).click();
  await expect(page.locator(".skeleton-canvas")).toHaveAttribute("data-matched-meshes", "2");
  await page.getByRole("button", { name: "Seçili kemiğe odaklan", exact: true }).click();
  await page.getByRole("button", { name: "Uzaklaştır", exact: true }).click({ clickCount: 3 });
  await page.locator(".skeleton-viewport").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `artifacts/original-thorax-${width}.png`, fullPage: true });
  await expect(page.getByText("Kaburga kıkırdakları şematik olarak tamamlanmıştır.")).toHaveCount(0);
});
