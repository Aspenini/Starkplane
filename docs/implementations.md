# Implementations

**Everything is subject to change until v1.0.0**, including this layout and roadmap.

| Area | Status | Responsibility |
| --- | --- | --- |
| `packages/web` | Working, v0.1.0 | Public Sass, ESM, TypeScript declarations, controls, instruments, themes, and motion |
| `apps/site` | Working, v0.1.0 | Explain the language and demonstrate the web package through public imports |
| `packages/slint` | Reserved | Possible native Slint components; no implementation or build yet |
| `docs` | Working notes | Platform-independent principles, implementation plans, and research |

## Adding an implementation

Create its package under `packages/`, keep examples and platform-specific tooling with it, and describe its supported controls and limitations in its own README. Use the design language's token roles and state semantics. Generate platform-specific values from the canonical tokens rather than introducing another palette or motion specification.

A future Slint implementation could begin with surfaces, primary and secondary buttons, fields, switches, segmented controls, focus states, and reduced-motion behavior. This is a possible direction, not a commitment or a claim that components already exist. Add Slint's own manifest and checks only when implementation begins; it does not need to become a JavaScript package.

The web library must remain usable independently of the explanatory site. The site consumes its exported entry points rather than reaching into library source. Build output, local package archives, and prototype snapshots stay out of source directories.

## Web completion record

The v0.1.0 inventory and acceptance criteria are defined in the specification. See `docs/verification/README.md` for tests, browser checks, archived audit results, and verification limits. This is a complete provisional web scope; it remains subject to change until v1.0.0.
