import sharp from "sharp";
import fs from "fs";

const path = "./assets/images/icon.png";

if (!fs.existsSync(path)) {
  throw new Error(`Icon not found at ${path}`);
}

const img = sharp(path);

const meta = await img.metadata();

console.log("Icon metadata:", meta);

// Must be PNG, 1024x1024, no alpha (flattened)

let work = img;

// Resize if not 1024x1024
if (meta.width !== 1024 || meta.height !== 1024) {
  console.log(`Resizing from ${meta.width}x${meta.height} to 1024x1024...`);
  work = work.resize(1024, 1024, { fit: "cover" });
}

// Flatten to remove transparency (choose a background close to brand color)
work = work.flatten({ background: "#4B2A88" });

await work.png({ compressionLevel: 9 }).toFile("./assets/images/icon.fixed.png");

// Replace original if changed
fs.copyFileSync("./assets/images/icon.fixed.png", path);
fs.unlinkSync("./assets/images/icon.fixed.png");

console.log("Icon validated and normalized to 1024x1024 PNG with no alpha.");



