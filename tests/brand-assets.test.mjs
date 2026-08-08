import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const htmlPath = "prototype/index.html";
const manifestPath = "prototype/manifest.webmanifest";
const html = fs.readFileSync(htmlPath, "utf8");
const expectedLogoHash = "291001d9b3c71018b4d9be811968bda8605affb489bb015862fdbaf4cfebb2d9";

const expectedLinks = [
  '<link rel="icon" type="image/png" sizes="16x16" href="./assets/icons/favicon-16.png" />',
  '<link rel="icon" type="image/png" sizes="32x32" href="./assets/icons/favicon-32.png" />',
  '<link rel="apple-touch-icon" sizes="180x180" href="./assets/icons/apple-touch-icon.png" />',
  '<link rel="manifest" href="./manifest.webmanifest" />',
  '<meta name="theme-color" content="#0b2a55" />'
];

for (const link of expectedLinks) {
  assert.ok(html.includes(link), `index.html should include ${link}`);
}

assert.ok(fs.existsSync(manifestPath), "web app manifest should exist");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

assert.equal(manifest.name, "Ana Tilim");
assert.equal(manifest.short_name, "Ana Tilim");
assert.equal(manifest.start_url, "./");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.background_color, "#fbf7f0");
assert.equal(manifest.theme_color, "#0b2a55");
assert.deepEqual(
  manifest.icons.map((icon) => ({ src: icon.src, sizes: icon.sizes })),
  [
    { src: "./assets/icons/icon-192.png", sizes: "192x192" },
    { src: "./assets/icons/icon-512.png", sizes: "512x512" }
  ],
  "manifest should list the 192px and 512px installable app icons"
);

for (const icon of manifest.icons) {
  assert.ok(!/^(?:https?:)?\/\//.test(icon.src), `icon should use a local relative path: ${icon.src}`);
  assert.ok(!icon.src.startsWith("/"), `icon should not use a root-absolute path: ${icon.src}`);
  assert.equal(icon.type, "image/png");
  assert.equal(icon.purpose, "any");
}

function readPngDimensions(path) {
  const bytes = fs.readFileSync(path);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.ok(bytes.subarray(0, 8).equals(signature), `${path} should be a PNG file`);
  assert.equal(bytes.subarray(12, 16).toString("ascii"), "IHDR", `${path} should contain a PNG IHDR header`);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20)
  };
}

const expectedDimensions = new Map([
  ["prototype/assets/logo.png", 1254],
  ["prototype/assets/icons/favicon-16.png", 16],
  ["prototype/assets/icons/favicon-32.png", 32],
  ["prototype/assets/icons/apple-touch-icon.png", 180],
  ["prototype/assets/icons/icon-192.png", 192],
  ["prototype/assets/icons/icon-512.png", 512]
]);

for (const [path, size] of expectedDimensions) {
  assert.ok(fs.existsSync(path), `${path} should exist`);
  assert.deepEqual(readPngDimensions(path), { width: size, height: size }, `${path} should be ${size}x${size}`);
}

const logoHash = crypto.createHash("sha256").update(fs.readFileSync("prototype/assets/logo.png")).digest("hex");
assert.equal(logoHash, expectedLogoHash, "logo should exactly match the user-provided source image");

console.log("brand asset checks passed");
