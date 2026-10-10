# Working on Starkplane

The overall project version is **v0.1.0**. **Everything is subject to change until v1.0.0.** Packages remain private; publishing and deployment require a separate decision.

Use Bun 1.4.0, as recorded in the root `packageManager` field. Run commands from the repository root:

```sh
bun install --frozen-lockfile
bun run dev
```

Reusable web components, Sass, and motion belong in `packages/web`. The explanatory site belongs in `apps/site` and consumes the public package exports. The specification and API contracts belong in `docs`. `packages/slint` remains a future placeholder.

Edit canonical tokens in `packages/web/src/tokens.ts`, then run `bun run build`. Commit the generated `docs/tokens.md` and `packages/web/src/styles/_generated.scss` alongside token changes; these references support consumers and must stay in sync. Compiled libraries, sites, bundled package documents, dependencies, local hosting state, and archives are ignored. Keep `bun.lock` in Git and update it with Bun when dependencies change.

Before submitting a change:

```sh
bun run check
bun run --cwd packages/web test:unit
git diff --check
```

For package-delivery changes, also run `bun run pack:local` and check the resulting archive in an independent consumer. For visual or interaction changes, preview the actual public components, check keyboard behavior and narrow layouts, and update verification evidence when appropriate. Automated tests do not replace the browser and assistive-technology checks described in `docs/verification/README.md`.

The GitHub workflow runs frozen installation, build/type checks, library tests, generated-reference checks, and local packing. It uses [checkout](https://github.com/actions/checkout) and [setup-bun](https://github.com/oven-sh/setup-bun). It has no publication or deployment step.
