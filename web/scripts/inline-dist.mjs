import { readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const distPath = fileURLToPath(new URL("../dist/", import.meta.url));
const indexPath = resolve(distPath, "index.html");
let html = await readFile(indexPath, "utf8");

const scriptMatch = html.match(/<script[^>]*type="module"[^>]*src="([^"]+)"[^>]*><\/script>/);
if (scriptMatch) {
  const scriptPath = resolve(distPath, scriptMatch[1].replace(/^\.\//, ""));
  try {
    let js = await readFile(scriptPath, "utf8");
    js = js.replace(/<\/script/gi, "<\\/script");
    html = html.replace(scriptMatch[0], () => `<script type="module">\n${js}\n</script>`);
  } catch (err) {
    console.warn("Could not inline script, keeping external reference:", err.message);
  }
}

const styleMatch = html.match(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
if (styleMatch) {
  const stylePath = resolve(distPath, styleMatch[1].replace(/^\.\//, ""));
  try {
    let css = await readFile(stylePath, "utf8");
    css = css.replace(/<\/style/gi, "<\\/style");
    html = html.replace(styleMatch[0], () => `<style>\n${css}\n</style>`);
  } catch (err) {
    console.warn("Could not inline stylesheet, keeping external reference:", err.message);
  }
}

await writeFile(indexPath, html, "utf8");
