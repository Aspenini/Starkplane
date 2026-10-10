import { execFileSync } from "node:child_process";
import { mkdir, writeFile, copyFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as sass from "sass";

const workspace = fileURLToPath(new URL("../", import.meta.url));
const root = resolve(workspace, "packages/web");
process.chdir(root);
await rm("lib", { recursive: true, force: true });
execFileSync(
  process.execPath,
  [resolve(workspace, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.json"],
  { stdio: "inherit" },
);
const { designTokens } = await import(
  pathToFileURL(resolve("lib/tokens.js")).href
);
const kebab = (key) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const flat = Object.fromEntries(
  ["color", "geometry", "spacing", "size", "focus", "typeScale", "lineHeight", "layer", "material"].flatMap((group) =>
    Object.entries(designTokens[group]).map(([key, value]) => [`${kebab(group)}-${kebab(key)}`, value]),
  ),
);
Object.assign(flat, {
  "font-display": designTokens.typography.display,
  "font-instrument": designTokens.typography.instrument,
  "motion-feedback": designTokens.motion.duration.feedback,
  "motion-state": designTokens.motion.duration.state,
  "motion-easing": designTokens.motion.easing,
});
await writeFile(
  "src/styles/_generated.scss",
  `// Generated from src/tokens.ts by bun run build.\n$tokens: (\n${Object.entries(
    flat,
  )
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
    .join(",\n")}\n);\n`,
);
const libraryCss = sass.compile("src/styles/compiled.scss", {
  style: "expanded",
}).css;
await writeFile("lib/style.css", libraryCss);
await writeFile(
  "lib/tokens.json",
  JSON.stringify(designTokens, null, 2) + "\n",
);
await writeFile(resolve(workspace, "docs/tokens.md"),
  `# Token reference\n\nGenerated from packages/web/src/tokens.ts. **Everything is subject to change until v1.0.0.** Current version: ${designTokens.version}.\n\n| CSS/Sass token | Default value |\n| --- | --- |\n${Object.entries(flat).map(([key, value]) => `| \`${key}\` | \`${value}\` |`).join("\n")}\n\n## Spring presets\n\n| Preset | Mass | Stiffness | Damping |\n| --- | --- | --- | --- |\n${Object.entries(designTokens.motion.presets).map(([key, value]) => `| ${key} | ${value.mass} | ${value.stiffness} | ${value.damping} |`).join("\n")}\n`,
);
await mkdir("docs", { recursive: true });
for (const name of ["design-language.md", "tokens.md", "web-api.md"]) await copyFile(resolve(workspace, "docs", name), `docs/${name}`);
console.log("Built Starkplane web library (packages/web/lib/). Nothing published.");
