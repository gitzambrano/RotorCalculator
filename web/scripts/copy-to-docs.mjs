import { cp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const distPath = fileURLToPath(new URL("../dist/", import.meta.url));
const docsPath = resolve(distPath, "../../docs");

try {
  await rm(resolve(docsPath, "assets"), { recursive: true, force: true });
  await cp(distPath, docsPath, { recursive: true });
  console.log(`Successfully synced dist bundle to ${docsPath}`);
} catch (err) {
  console.error("Failed to copy dist to docs:", err);
  process.exit(1);
}
