import { readFile, writeFile } from "node:fs/promises";

// Help, symbols and engineering captions share the Android source of truth.
const source = await readFile(new URL("../../RotorNames.bas", import.meta.url), "utf8");
const entries = {};
for (const match of source.matchAll(/^\s*Add\(([^\r\n]+)\)/gm)) {
  const normalized = match[1]
    .replace(/"\s*&\s*CRLF\s*&\s*CRLF\s*&\s*"/g, "\n\n")
    .replace(/"\s*&\s*CRLF\s*&\s*"/g, "\n");
  const fields = [...normalized.matchAll(/"((?:[^"]|"")*)"/g)].map(m => m[1].replaceAll('""', '"'));
  if (fields.length !== 8) throw new Error(`Invalid nomenclature entry: ${match[0]}`);
  const [key, full, short, sym, unit, body, eq, range] = fields;
  entries[key] = { key, full, short, sym, unit: unit === "-" ? "–" : unit, body, eq, range };
}
if (Object.keys(entries).length < 90) throw new Error("Android nomenclature could not be parsed");
await writeFile(new URL("../src/apk-nomenclature.ts", import.meta.url),
  `// Generated from RotorNames.bas by scripts/sync-nomenclature.mjs.\nexport const APK_NOMENCLATURE = ${JSON.stringify(entries, null, 2)};\n`, "utf8");
