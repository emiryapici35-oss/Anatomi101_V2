import { readFile, mkdir } from "node:fs/promises";
import sharp from "sharp";

const source = "artifacts/openstax";
const entries = JSON.parse(await readFile(`${source}/index.json`, "utf8"));
const requested = process.argv.slice(2);
const images = entries.filter(entry => !requested.length || requested.some(prefix => entry.name.startsWith(prefix)));
await mkdir(`${source}/review`, { recursive: true });
for (let start = 0; start < images.length; start += 12) {
  const cells = [];
  for (const [offset, entry] of images.slice(start, start + 12).entries()) {
    const x = offset % 3 * 400;
    const y = Math.floor(offset / 3) * 350;
    const thumbnail = await sharp(`${source}/${entry.name}`).resize(390, 310, { fit: "contain", background: "white" }).png().toBuffer().catch(error => { console.log(`INVALID: ${entry.name}: ${error.message}`); return null; });
    if (!thumbnail) continue;
    cells.push({ input: thumbnail, top: y, left: x });
    const label = entry.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/_/g, " ");
    const lines = [label.slice(0, 48), label.slice(48, 96)];
    const caption = Buffer.from(`<svg width="400" height="40"><rect width="400" height="40" fill="white"/><text x="8" y="15" font-family="Arial" font-size="11" fill="black">${lines[0]}</text><text x="8" y="30" font-family="Arial" font-size="11" fill="black">${lines[1]}</text></svg>`);
    cells.push({ input: caption, top: y + 310, left: x });
  }
  const name = `${requested.join("-") || "all"}-${start / 12}`;
  await sharp({ create: { width: 1200, height: Math.ceil(Math.min(12, images.length - start) / 3) * 350, channels: 3, background: "#e4e8e6" } }).composite(cells).png().toFile(`${source}/review/${name}.png`);
  console.log(`${name}: ${images.slice(start, start + 12).map(item => item.name.split("_")[0]).join(", ")}`);
}
