# Web API and integration

**Provisional v0.1.0. Everything is subject to change until v1.0.0.**

## Installation and styles

Run `bun run pack:local` at the repository root, then install `artifacts/starkplane-0.1.0.tgz` into a consumer project with Bun. The package remains private and is not published.

```ts
import "starkplane/styles.css";
import { createTabs, createDialog, createRange } from "starkplane";
```

For Sass, use Dart Sass's Node package importer:

```scss
@use "pkg:starkplane/scss" as ui;
@include ui.styles;
```

Apply `.ui-theme` to a containing element. Choose compiled CSS or emitted Sass once; avoid emitting both. Theme mixins, `ui.token`, `ui.panel`, `ui.chamfer`, and `ui.focus-ring` are available independently. Importing helpers alone emits no CSS.

## Public controllers

All controllers have idempotent `destroy()`. Destroy on unmount to remove listeners and restore owned state. DOM controllers accept elements from the same document. Call them after the elements exist. Do not mount two controllers that own the same attributes on one element. The button/panel structure and values of tabs, menus, and segmented groups are fixed at mount; destroy and remount after structural changes. Enabled/disabled flags are evaluated during interaction. Caller-supplied callbacks are synchronous; invalid runtime inputs throw before updates.

| Export | Input and options | Returned interface |
| --- | --- | --- |
| `applyTheme(host, colors)` | Known color keys and nonempty CSS color strings, checked with native CSS support where available; consumer verifies theme contrast | Cleanup function restoring previous inline values and priorities |
| `createSpring(options)` | `initial`, `mass`, `stiffness`, `damping`, `enabled`, `respectReducedMotion`, `onUpdate`, `onRest`, injectable `scheduler` | `state`, `running`, `to`, `jump`, `configure`, `setEnabled`, `stop`, `destroy` |
| `stepSpring(state, config, seconds)` | Finite state, valid physical parameters, nonnegative elapsed time | New `{value, velocity, target}` snapshot; bounded integration |
| `validateSpring(config)` | Positive mass/stiffness, nonnegative damping, finite values; stiffness/mass ≤ 1e6 and damping/mass ≤ 1e4 | Throws for invalid parameters |
| `createSegmentedControl(root, options)` | Unique native `button[data-ui-value]`; labelled root; `value`, `orientation`, `onChange` | `value`, `setValue`, `clear`, `destroy` |
| `createTabs(root, options)` | Labelled `[data-ui-tablist]`, `button[data-ui-tab]`, matching `[data-ui-panel]`; `value`, `activation`, `orientation`, `onChange` | `value`, `setValue`, `destroy` |
| `createDisclosure(trigger, panel, options)` | Native trigger button; `open`, `onChange` | `open`, `setOpen`, `destroy` |
| `createDialog(dialog, options)` | Closed, labelled native dialog; optional contained `initialFocus`, `onChange` | `open`, `show`, `close(returnValue?)`, `destroy` |
| `createMenu(trigger, menu, options)` | Native button; unique `button[data-ui-menu-value]` commands; `onSelect` | `open`, `show(last?)`, `close`, `destroy` |
| `createTooltip(trigger, tooltip)` | Focusable trigger and text-only popup; existing descriptions preserved | `open`, `show`, `hide`, `destroy` |
| `createRange(input, options)` | Native range; optional `output`, `format`, `onChange` | `value`, `setValue`, `refresh`, `destroy` |
| `createField(input, options)` | Native input/textarea/select; `error` element; optional validator returning string or null | `validate` returning a boolean, `clear`, `destroy` |
| `createToastRegion(region)` | Persistent message container; sets polite live-region semantics | `show(message)`, `clear`, `destroy` |
| `createInstrument(host, options)` | `separation`, `intensity`, `rotation`, `layer`, `mode`, `motion`, `onChange` | `state`, `setSeparation`, `setIntensity`, `setRotation`, `selectLayer`, `setMode`, `setMotionEnabled`, `inspect`, `destroy` |
| `renderInstrumentSvg(idPrefix?)` | Optional valid unique ID prefix | SVG string; safe to import on a server |
| `renderIcon(name)` | One of the ten documented icon names | Decorative SVG string; unknown names throw |
| `designTokens` | Typed token object | Also exported as `starkplane/tokens.json` |

Segmented and tab setters notify only when selection changes. Segment `clear()` represents a custom choice with `value === ""`; it does not call `onChange`. Range `setValue` updates native value/fill/output without simulating user input or notifying `onChange`. Native range sanitization and step semantics still apply; call `refresh()` after changing min/max/step or the value directly. Range input events notify; form resets refresh after the native reset completes.

Field validation uses native validity first, then the optional custom validator. It begins after blur, a native invalid event, or explicit `validate()`, and revalidates edits once touched. `clear()` removes validation presentation without changing the field value. A form with custom validation uses `novalidate`, prevents submission, calls validators, and focuses its first invalid field. The library performs no network requests or submissions.

Menu commands support one level of button actions. Tooltips contain text, not controls. Dialogs rely on native modal support; the controller does not polyfill older browsers. Floating surfaces start closed. Native manual popovers keep their rendering independent of transformed ancestors; older untransformed contexts use fixed positioning. Programmatic popup calls update placement; viewport resize/scroll events reposition an open menu or tooltip.

Component styles use logical properties. In right-to-left contexts (`dir="rtl"`), status and toast accents sit on the inline start, switch thumbs travel toward the inline end, range fill follows the native thumb, and vertical tab indicators sit on the inline end.

Instrument separation/intensity are percentages clamped to 0–100; separation maps to 0–60px before the projection multiplier. Rotation is finite degrees normalized to 0–360, both initially and by its setter. Invalid initial options throw before the host is changed. Layers are `all`, `cover`, `core`, and `base`; modes are `blueprint` and `material`. Inspection reports the generated visual's layer/path/element counts, not physical equipment status. Each instrument owns independent SVG IDs and spring state. Callers providing explicit SVG prefixes must make them unique in the document.

## Semantic markup example

```html
<div class="ui-theme ui-tabs" id="details">
  <div data-ui-tablist class="ui-tabs__list" aria-label="Instrument details">
    <button type="button" data-ui-tab="geometry">Geometry</button>
    <button type="button" data-ui-tab="materials">Materials</button>
  </div>
  <div data-ui-panel="geometry">Geometry description</div>
  <div data-ui-panel="materials">Material description</div>
</div>
```

```ts
const tabs = createTabs(document.querySelector<HTMLElement>("#details")!, {
  activation: "automatic",
});
// On unmount:
tabs.destroy();
```

Native controls, tables, badges, status surfaces, layout primitives, and progress elements need only semantic HTML and their documented `.ui-*` classes. The site component catalogue is an executable markup reference. The standalone example verifies the package outside site composition.
