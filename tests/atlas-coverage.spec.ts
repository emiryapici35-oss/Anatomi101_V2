import { expect, test, type Page } from "@playwright/test";
import atlas from "../app/data/image-atlas.json";
import { anatomyItems } from "../app/data/anatomy";

async function open(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
}
async function choose(page: Page, id: string) {
  const item = anatomyItems.find(item => item.id === id)!;
  await page.getByRole("textbox", { name: "Anatomi menüsünü filtrele" }).fill(item.latin);
  await page.locator(`#menu-${item.category} .structure`).filter({ has: page.getByText(item.latin, { exact: true }) }).click();
}

test("reviewed anatomical terminology stays distinct and grammatically consistent", () => {
  expect(anatomyItems.find(item => item.id === "papillae-linguales")?.turkish).toBe("Dil papillaları");
  expect(anatomyItems.find(item => item.id === "ovarium-dexter")?.latin).toBe("Ovarium dextrum");
  expect(anatomyItems.find(item => item.id === "arteria-tibialis")?.latin).toBe("Arteria tibialis anterior");
  expect(anatomyItems.filter(item => item.category === "genital" && item.latin.startsWith("Corpus spongiosum penis"))).toHaveLength(1);
  expect(anatomyItems.find(item => item.id === "atlas-genital-epididymis-caput-dexter-6")?.latin).toBe("Caput epididymidis dextrum");
  expect(anatomyItems.find(item => item.id === "larynx")?.group).toBe("Alt solunum yolları");
  expect(anatomyItems.find(item => item.id === "trachea")?.group).toBe("Alt solunum yolları");
});

test("every image submenu loads its own original reference", async ({ page }) => {
  test.setTimeout(180000);
  await open(page);
  const viewer = page.getByRole("region", { name: "Görsel anatomi atlası" });
  for (const [index, group] of atlas.coverage.groups.entries()) {
    const item = anatomyItems.find(item => item.category === group.category && item.group === group.group)!;
    await choose(page, item.id);
    if (index === 0) await page.getByRole("button", { name: "Görsel", exact: true }).click();
    await expect(viewer).toHaveAttribute("data-atlas-group", group.group);
    await expect.poll(() => viewer.locator("img").evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { message: group.group }).toBe(true);
    await expect(viewer.locator(".atlas-empty")).toHaveCount(0);
    await expect(page.locator(".skeleton-canvas")).toHaveCount(0);
  }
});

test("unmapped structures are not presented as exact matches", async ({ page }) => {
  const ids = new Set(atlas.plates.flatMap(plate => plate.items.map(item => item.id)));
  const item = anatomyItems.find(item => item.category === "endocrine" && !ids.has(item.id))!;
  await open(page);
  await choose(page, item.id);
  await page.getByRole("button", { name: "Görsel", exact: true }).click();
  await expect(page.locator(".atlas-missing")).toContainText("Seçilen yapı ayrı olarak gösterilmiyor");
  await expect(page.locator(".atlas-legend button[aria-pressed=true]")).toHaveCount(0);
});

test("light menu text meets AA contrast and selection is distinct", async ({ page }) => {
  await open(page);
  await choose(page, "ren-dexter");
  const colors = await page.locator(".structure.active").first().evaluate(el => {
    const style = getComputedStyle(el), latin = getComputedStyle(el.querySelector("em")!);
    return { text: style.color, latin: latin.color, background: style.backgroundColor, border: style.borderColor, shadow: style.boxShadow };
  });
  const luminance = (color: string) => {
    const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  };
  for (const color of [colors.text, colors.latin]) {
    const a = luminance(color), b = luminance(colors.background);
    expect((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toBeGreaterThanOrEqual(4.5);
  }
  expect(colors.shadow).not.toBe("none");
  expect(colors.border).not.toBe("rgba(0, 0, 0, 0)");
  await page.screenshot({ path: "artifacts/light-menu-contrast.png", fullPage: true });
});

for (const width of [1440, 390]) test(`view selector, zoom, pan and dark theme at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await open(page);
  await choose(page, "atlas-digestive-fundus-ventriculi-6");
  await page.getByRole("button", { name: "Görsel", exact: true }).click();
  const viewer = page.locator(".image-atlas");
  const selector = viewer.getByRole("combobox", { name: "Anatomik görünüm" });
  const options = await selector.locator("option").evaluateAll(options => options.map(option => (option as HTMLOptionElement).value));
  await selector.selectOption(options[1]);
  await expect(viewer.locator("img")).toHaveAttribute("src", /2411/);
  await selector.selectOption(options[0]);
  await viewer.getByRole("button", { name: "Yakınlaştır", exact: true }).click();
  await viewer.getByRole("button", { name: "Yakınlaştır", exact: true }).click();
  const scroll = viewer.locator(".atlas-image-scroll");
  await scroll.scrollIntoViewIfNeeded();
  if (width === 1440) {
    const box = (await scroll.boundingBox())!, old = await scroll.evaluate(el => el.scrollLeft);
    await page.mouse.move(box.x + box.width / 2, box.y + 80);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 90, box.y + 100, { steps: 5 });
    await page.mouse.up();
    expect(await scroll.evaluate(el => el.scrollLeft)).toBeGreaterThan(old);
  }
  await viewer.getByRole("button", { name: "Görseli sığdır" }).click();
  await expect(viewer.locator(".atlas-toolbar output")).toHaveText("%100");
  await page.getByRole("button", { name: "Koyu temaya geç" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await viewer.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `artifacts/atlas-dark-${width}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
