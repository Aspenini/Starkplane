# Starkplane

A design language for interfaces engineered like physical instruments: precision geometry, machined materials, restrained illumination, and functional motion with mass.

**Everything is subject to change until v1.0.0.** The current version is **0.1.0**. Identity, tokens, components, APIs, implementations, and plans are provisional. All packages are private; nothing is published to a registry by this repository's scripts.

## Repository

This is one Git repository and one Bun workspace. Run commands from this directory.

```text
apps/
  site/                  Explanatory website and interactive workshop
packages/
  web/                   Reusable Sass and TypeScript library (starkplane)
  slint/                 Reserved for a possible Slint implementation
docs/
  design-language.md     Complete provisional specification
  tokens.md              Generated token reference
  web-api.md             Public API and integration contracts
  verification/          Audit evidence and validation record
  implementations.md     Implementation boundaries and future work
  research/              Historical naming research
  assets/previews/       Historical interface screenshots
scripts/                 Shared build and local preview tooling
artifacts/               Ignored local archives and preserved old builds
```

The [site](apps/site/README.md) consumes the [web library](packages/web/README.md) through `starkplane` and `pkg:starkplane/scss`, including the package's exported TypeScript declarations. Site layouts and navigation belong to the app; reusable controls and motion belong to the library. New platform implementations belong under `packages/`.

## Local development

```sh
bun install --frozen-lockfile
bun run dev         # build and serve http://127.0.0.1:4173
bun run build       # packages/web/lib/ and apps/site/dist/
bun run build:web   # just the reusable web library
bun run build:site  # library, then site
bun run check       # library, site, and consumer type checks
bun run test        # build, consumer checks, and library tests
bun run pack:local  # artifacts/starkplane-0.1.0.tgz; no publishing
```

The site is served at `/`; `/library-example.html` demonstrates independent library instances. The preview server serves `apps/site/dist/`. Builds are separate from source and are ignored by Git. The committed `bun.lock` covers the whole workspace.

This repository starts from the current v0.1.0 source; prior Git history has been removed from this checkout. Historical previews are in `docs/assets/previews/`; naming notes are in `docs/research/`. Old generated site output and prototype archives are retained locally in ignored `artifacts/`. Existing hosting metadata now points at `apps/site/dist/` and stays local in ignored `.openai/`; reorganizing this repository does not deploy it.

Read the [specification](docs/design-language.md) and [implementation plan](docs/implementations.md) before adding another platform. The Slint directory is a documented placeholder; no Slint components exist yet.

The site includes a complete component catalogue and a Specification view generated from the documents above. Append `?audit=1` to the local site or standalone example URL to load an opt-in accessibility audit. The normal site does not load the audit bundle.

See [CONTRIBUTING.md](CONTRIBUTING.md) for source ownership, generated references, and validation. GitHub CI checks the Bun workspace and creates only a local archive. Git attributes normalize text to LF and preserve binary assets; editor settings follow the same conventions.
