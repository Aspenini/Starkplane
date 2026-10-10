# Starkplane

A framework-independent Sass and TypeScript library for precision-engineered interfaces. It provides scoped controls, graphite surfaces, lime actions, cyan schematics, muted amber selection, and motion with mass. The design language and its local package are named Starkplane.

The original geometry guides the workshop again: open spacing, large typography, rectangular instrument panels, 8px opposing action chamfers, and bevelled secondary controls. `color-action` drives lime controls; the separate `color-schematic` token keeps cyan in technical diagrams. Both can be themed independently.

**Everything is subject to change until v1.0.0:** identity, visual direction, tokens, Sass mixins, classes, components, APIs, implementation, and roadmap. Current version: **0.1.0**. This package is private and has not been published to npm or another registry. This update is local; the previously hosted prototype remains unchanged.

## Build locally

From the repository root:

```sh
bun install --frozen-lockfile
bun run build:web   # packages/web/lib/: reusable package
bun run dev         # build and preview the separate documentation site
bun run test        # build, consumer type checks, and library behavior tests
bun run pack:local  # artifacts/starkplane-0.1.0.tgz, created locally
```

This library is a Bun workspace package named `starkplane`. Build tooling lives in the repository's `scripts/` directory; the explanatory site lives in `apps/site/` and consumes the public package exports. From this package directory, `bun run build`, `bun run test`, and `bun run pack:local` also work.

`pack:local` uses `bun pm pack`, which creates a local archive without publishing. `private: true` remains enabled. The standalone example is served at `/library-example.html` by the root preview server. Fonts are optional consumer-provided assets; the library loads no remote assets and has no runtime dependencies.

## Use the local package

After building and packing, install the archive into another project:

```sh
bun add /path/to/starkplane-0.1.0.tgz
```

Import the compiled CSS through your bundler:

```ts
import "starkplane/styles.css";
import { createInstrument } from "starkplane";

const host = document.querySelector<HTMLElement>("#instrument")!;
const instrument = createInstrument(host, {
  mode: "blueprint",
  separation: 40,
  onChange(state) {
    console.log(state.renderedSeparation);
  },
});

instrument.selectLayer("core");
instrument.setMode("material");
instrument.setSeparation(70); // spring response
instrument.destroy(); // cancel motion and restore original host contents
```

Wrap controls in `.ui-theme` to apply the default tokens. Styles affect opted-in components; application routing, page composition, storage, and initialization remain with the consumer. The library provides no global reset.

```html
<section class="ui-theme ui-panel">
  <h2 class="ui-panel__label">Instrument controls</h2>
  <button class="ui-button ui-button--primary">Engage</button>
  <label class="ui-field">
    <span class="ui-field__label">Instrument name</span>
    <input class="ui-field__input" value="UNIT–001" />
  </label>
  <label class="ui-switch">
    Precision mode
    <input type="checkbox" role="switch" checked />
    <span class="ui-switch__track"></span>
  </label>
  <div id="instrument"></div>
</section>
```

Without a bundler, serve the package's `lib/` directory and import `lib/index.js` in a module script. See `examples/vanilla.html`. JavaScript consumers do not need TypeScript; declarations are included for typed consumers.

## Sass modules and themes

Use Dart Sass with its Node package importer:

```sh
bunx --bun sass --pkg-importer=node app.scss app.css
```

```scss
@use "pkg:starkplane/scss" as ui with (
  $theme: (
    "color-action": #80e8ff,
    "color-attention": #ffb86a,
  )
);

@include ui.styles; // emit scoped components once

.custom-instrument-panel {
  @include ui.panel($recessed: true);
  padding: 24px;
}

.alternate-theme {
  @include ui.theme(
    (
      "color-action": #ffcc00,
    )
  );
}

.custom-action {
  @include ui.chamfer(8px);
  &:focus-visible {
    @include ui.focus-ring;
  }
}
```

Importing the Sass module alone emits no CSS. Use only its mixins or explicitly include `ui.styles`. The compiled CSS alternative already includes those styles; choose one route to avoid duplicates. `ui.token('color-action')` supplies a CSS variable with a configured Sass fallback. Unknown theme keys are rejected.

Instance themes also work with CSS variables and TypeScript:

```css
.my-console {
  --ui-color-action: #80e8ff;
}
```

```ts
import { applyTheme } from "starkplane";
const restoreTheme = applyTheme(host, { action: "#ffcc00" });
restoreTheme(); // restores previous inline values and priorities
```

## Complete provisional component set

The web implementation covers the [specification](docs/design-language.md): layout and typography, icons, buttons, panels, fields, textareas, selects, checkbox/radio groups, switches, ranges, segmented choices, tabs, navigation, disclosures, command menus, tooltips, modal dialogs, status/toast feedback, badges, progress/loading, tables, empty states, and independent instrument visualizations.

Read the bundled [API reference](docs/web-api.md) for options, markup, keyboard contracts, return types, and cleanup. [Token values](docs/tokens.md) are generated from the canonical source. The explanatory site's catalogue uses these public styles and controllers directly.

```ts
import { createTabs, createDialog, createMenu, createTooltip, createDisclosure,
  createRange, createField, createToastRegion, renderIcon } from "starkplane";
```

Prefer native controls and visible labels. Modal dialogs retain native inertness and explicit boundary focus wrapping. Fields support native constraints and linked inline errors. Tooltips supplement visible information; menu commands are single-level buttons. Feedback persists until cleared. Default text and boundary colors are contrast-tested; custom themes require their own verification.

## Core API

| Export                                  | Use                                                                                                       |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `designTokens`                          | Typed colors, geometry, fonts, motion presets, and provisional metadata. Also available as `tokens.json`. |
| `applyTheme(element, colors)`           | Apply instance colors and return a cleanup function.                                                      |
| `createSpring(options)`                 | Animate numbers with mass, stiffness, and damping.                                                        |
| `stepSpring(state, config, seconds)`    | Integrate the spring without DOM access.                                                                  |
| `validateSpring(config)`                | Validate finite spring parameters.                                                                        |
| `createInstrument(host, options)`       | Mount an independent SVG assembly with rendering modes and selectable layers.                             |
| `renderInstrumentSvg(idPrefix?)`        | Render SVG as a string with unique IDs; usable on the server.                                             |
| `createSegmentedControl(root, options)` | Initialize native buttons with keyboard navigation and state.                                             |

Instrument controllers expose `state`, `setMode`, `selectLayer`, `setSeparation`, `setIntensity`, `setRotation`, `setMotionEnabled`, `inspect`, and `destroy`. Separation and intensity are percentages clamped to 0–100; rotation is in degrees. `state.renderedSeparation` reports displacement in pixels. Layer names: `all`, `cover`, `core`, `base`. Modes: `blueprint`, `material`. Inspection describes the visual model, not an external instrument. Each instance has independent SVG IDs and animation state.

Spring controllers expose `state`, `running`, `to`, `jump`, `configure`, `setEnabled`, `stop`, and `destroy`. State snapshots contain `value`, `velocity`, and `target`. Visual motion respects the OS reduced-motion preference by default. Disabling motion settles immediately. Destroy controllers on unmount. Package imports do not touch browser globals; mount DOM controllers in the browser.

Segmented controls use a labelled `role="group"` wrapper with native `button[data-ui-value]` children. They set `aria-pressed` and a roving tab stop; arrow keys, Home, and End select enabled buttons. `destroy()` removes listeners and restores original button state. Native inputs and switches need no JavaScript controller.

The bundled API reference lists all component classes and variants. Use labelled native controls. `.ui-motion-off` disables CSS transitions in its subtree; pair it with `setEnabled(false)` or `setMotionEnabled(false)` for JavaScript motion. `createRange` synchronizes `--ui-range-fill` with the native value, including form reset.

## Source layout

Paths below are relative to `packages/web/`:

```text
src/              Strict TypeScript library and Sass API
src/styles/       Theme, geometry/material mixins, scoped components
examples/         Standalone consumer example
tests/            Motion, package, Sass, SSR, consumer type checks
lib/              Generated ESM, declarations, CSS, token JSON (ignored)
```

`src/tokens.ts` is the source of truth. The build generates the Sass token map and JSON from it. The site's layouts and branding live separately in `apps/site/` and are excluded from the consumer archive. Platform-independent principles and future implementation plans live in `docs/`. All design and API decisions remain provisional until v1.0.0.
