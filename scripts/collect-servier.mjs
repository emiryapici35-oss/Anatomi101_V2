import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import sharp from "sharp";
const dir = "artifacts/servier";
await mkdir(dir, { recursive: true });
const categories = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
async function links(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const html = await response.text();
  return page.evaluate(html => [...new DOMParser().parseFromString(html, "text/html").querySelectorAll("a[href]")].map(a => ({ url: a.getAttribute("href"), title: a.textContent.trim() })), html);
}
let existing = [];
try { existing = JSON.parse(await readFile(`${dir}/index.json`, "utf8")); } catch {}
try {
  for (const category of categories) {
    const found = await links(`https://smart.servier.com/category/anatomy-and-the-human-body/${category}/`);
    const candidates = [...new Map(found.filter(a => a.url.includes("/smart_image/") && a.title && !/disease|aneurysm|regurgitation|alzheimer|nephropathy|cancer|cyst|ischemi|infarct|maladie/i.test(a.title)).map(a => [a.url, a])).values()];
    console.log(category, candidates.length);
    for (const candidate of candidates) {
      if (existing.some(entry => entry.page === candidate.url)) continue;
      const detail = await links(candidate.url);
      const original = detail.find(a => a.title === "Download the image" && /\.(png|jpg)$/i.test(a.url));
      if (!original) continue;
      const id = String(existing.length).padStart(3, "0");
      const response = await fetch(original.url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`${original.url}: ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      await writeFile(`${dir}/${id}.png`, bytes);
      const { width, height } = await sharp(bytes).metadata();
      existing.push({ id, category, title: candidate.title, page: candidate.url, image: original.url, width, height });
      await writeFile(`${dir}/index.json`, JSON.stringify(existing, null, 2));
      console.log(id, candidate.title, candidate.url);
    }
  }
  // This contact sheet is only for source review, never an application asset.
  for (let start = 0; start < existing.length; start += 20) {
    const batch = existing.slice(start, start + 20);
    const tiles = [];
    for (const [index, entry] of batch.entries()) {
      const thumb = await sharp(`${dir}/${entry.id}.png`).resize({ width: 240, height: 225, fit: "contain", background: "white" }).flatten({ background: "white" }).png().toBuffer();
      const label = Buffer.from(`<svg width="250" height="25"><rect width="250" height="25" fill="white"/><text x="8" y="18" font-size="15">${entry.id}: ${entry.title.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</text></svg>`);
      tiles.push({ input: thumb, left: index % 4 * 250, top: Math.floor(index / 4) * 260 });
      tiles.push({ input: label, left: index % 4 * 250, top: Math.floor(index / 4) * 260 + 225 });
    }
    await sharp({ create: { width: 1000, height: Math.ceil(batch.length / 4) * 260, channels: 3, background: "white" } }).composite(tiles).png().toFile(`${dir}/review-${start}.png`);
  }
} finally { await browser.close(); }
