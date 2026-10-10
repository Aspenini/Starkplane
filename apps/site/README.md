# Starkplane site

The website explains the design language through materials, motion, component examples, and an interactive instrument workshop. Everything is subject to change until v1.0.0.

This app depends on the local `starkplane` workspace package. TypeScript imports use its public entry point; Sass uses `pkg:starkplane/scss` through the Sass package importer. The build compiles the library first so the site uses the distributable ESM and declarations.

`src/` contains the page, app behavior, and site-specific Sass. `dist/` is generated and ignored. Shared component styles and controllers belong in `packages/web`, rather than being copied here.

From the repository root:

```sh
bun run dev
bun run build:site
```

Open `http://127.0.0.1:4173` for the site or `/library-example.html` for the standalone library example. From this workspace directory, `bun run build` also builds its library dependency. All commands are local; none publishes or deploys.

The Specification view renders `docs/design-language.md`, the generated `docs/tokens.md`, and `docs/web-api.md`. Component specimens use the library classes and controllers. `src/catalogue.ts` wires the general-purpose interactive examples; page framing and domain-specific diagrams remain site content.

Use `/?audit=1#components` locally to opt into the accessibility audit. It is bundled separately and not requested by normal visits. The audit reports violations and items needing manual review; it does not claim accessibility certification.
