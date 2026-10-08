import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// A standard ZIP (stored entries) requires no platform tools or dependencies.
const root = fileURLToPath(new URL("../dist/", import.meta.url));
const pkg = JSON.parse(await readFile(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"));
const releaseVersion = pkg.version.split(".").slice(0, 2).join(".");
async function files(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else if (!entry.name.endsWith(".apk") && !entry.name.endsWith(".zip") && entry.name !== "sw.js") result.push(path);
  }
  return result.sort();
}
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
const entries = [];
for (const path of await files(root)) entries.push({ name: relative(root, path).replaceAll("\\", "/"), data: await readFile(path) });
entries.push({ name: "README.txt", data: Buffer.from(`RotorCalculator ${releaseVersion} — Offline web application\r\n\r\nExtract this ZIP, then open index.html in a modern browser.\r\nKeep the assets folder and bundled manuals beside index.html.\r\nGeometry import/export and sweep CSV/PNG work offline.\r\nFor home-screen installation, use the hosted HTTPS web app.\r\n`) });
const chunks = [], directory = [];
let offset = 0;
for (const { name, data } of entries) {
  const filename = Buffer.from(name), crc = crc32(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4);
  local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(filename.length, 26);
  chunks.push(local, filename, data);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6);
  central.writeUInt32LE(crc, 16); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(filename.length, 28); central.writeUInt32LE(offset, 42);
  directory.push(central, filename); offset += local.length + filename.length + data.length;
}
const central = Buffer.concat(directory), end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
end.writeUInt32LE(central.length, 12); end.writeUInt32LE(offset, 16);
await writeFile(join(root, "rotorcalculator-offline.zip"), Buffer.concat([...chunks, central, end]));
