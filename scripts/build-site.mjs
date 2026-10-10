import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile, copyFile, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";
import { build } from "esbuild";
import { marked } from "marked";

const workspace = fileURLToPath(new URL("../", import.meta.url));
const site = resolve(workspace, "apps/site");
const web = resolve(workspace, "packages/web");
execFileSync(process.execPath, [resolve(workspace, "scripts/build-web.mjs")], {
  stdio: "inherit",
});
process.chdir(site);
execFileSync(process.execPath, [resolve(workspace, "node_modules/typescript/bin/tsc"), "--noEmit", "-p", "tsconfig.json"], {
  stdio: "inherit",
});
await rm("dist", { recursive: true, force: true });
await mkdir("dist/library", { recursive: true });
await writeFile("dist/styles.css", sass.compile("src/styles/main.scss", {
  style: "expanded",
  importers: [new sass.NodePackageImporter(site)],
}).css);
const specification = (await Promise.all(["design-language.md", "tokens.md", "web-api.md"].map(name => readFile(resolve(workspace, "docs", name), "utf8")))).join("\n\n").replace("[token reference](tokens.md)", "token reference below");
let tableIndex = 0;
const labels = ["Component inventory", "Design tokens", "Spring presets", "Public controllers"];
const specHtml = (await marked.parse(specification))
  .replaceAll('<table>', () => `<div class="ui-table-region" tabindex="0" role="region" aria-label="${labels[tableIndex++] ?? "Specification table"}"><table class="ui-table">`)
  .replaceAll('</table>', '</table></div>')
  .replaceAll('<pre>', '<pre tabindex="0">');
await writeFile("dist/index.html", (await readFile("src/index.html", "utf8")).replace("<!-- STARKPLANE_SPEC -->", specHtml));
await copyFile(resolve(web, "lib/style.css"), "dist/library/style.css");
await build({
  entryPoints: ["src/main.ts"], bundle: true, format: "esm", target: "es2022",
  sourcemap: true, outfile: "dist/app.js",
});
// The standalone example uses the same public entry point as the site.
await build({
  stdin: { contents: 'export * from "starkplane";', resolveDir: site },
  bundle: true, format: "esm", target: "es2022", outfile: "dist/library/index.js",
});
await writeFile("dist/library-example.html",
  (await readFile(resolve(web, "examples/vanilla.html"), "utf8"))
    .replaceAll("../lib/style.css", "./library/style.css")
    .replaceAll("../lib/index.js", "./library/index.js"),
);
console.log("Built documentation site (apps/site/dist/) using Starkplane package exports. Nothing published.");

await build({ entryPoints: ["src/audit.ts"], bundle: true, format: "esm", target: "es2022", outfile: "dist/audit.js" });

for (const [pagePath, assets] of [
  ["dist/index.html", ["styles.css", "app.js", "audit.js"]],
  ["dist/library-example.html", ["library/style.css", "library/index.js", "audit.js"]],
]) {
  let page = await readFile(pagePath, "utf8");
  for (const asset of assets) {
    const hash = createHash("sha256").update(await readFile(`dist/${asset}`)).digest("hex").slice(0, 12);
    const escaped = asset.replaceAll(".", "\\.");
    page = page.replace(new RegExp(`${escaped}(?:\\?[^\"']*)?`, "g"), `${asset}?v=${hash}`);
  }
  await writeFile(pagePath, page);
}
