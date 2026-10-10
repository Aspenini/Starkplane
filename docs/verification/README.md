# Starkplane v0.1.0 verification

Verified locally on 2026-10-10. The overall project version is v0.1.0; the preview filenames preserve their capture labels from before this version correction. **Everything remains subject to change until v1.0.0.** The specified provisional web inventory is implemented; this record describes the evidence and its limits. No registry publication or site deployment was performed.

## Build and package

- Bun 1.4.0 with the workspace lockfile; frozen installation succeeds.
- Strict TypeScript checks cover the library, site, public consumer API, and rejected invalid option types.
- 41 automated tests pass. They cover spring convergence and numerical limits, cancellation and reduced motion, SSR imports, independent SVG IDs, keyboard navigation, form reset/validation, focus recovery, disabled states, cleanup and reentrant destruction, safe text feedback, Sass scoping/theming, logical-direction CSS, token consistency, and default semantic contrast.
- The library has no runtime dependencies. The site consumes public package exports. Sass helpers alone emit no CSS; component styles require an explicit mixin.
- The local archive installs into an independent Bun consumer. Its ESM imports without browser globals, declarations type-check, exported CSS and JSON resolve, and the Sass package importer emits the full component set with a theme override. The archive includes the specification, API reference, and standalone example, and excludes site source and development tests.

Reproduce the source checks with `bun install --frozen-lockfile`, `bun run check`, and `bun run test`. Create the local archive with `bun run pack:local`. These commands do not publish.

## Browser evidence

The tested browser was Chromium 155 in the Codex in-app browser on macOS. Intended targets also include current Firefox and Safari; those engines were not directly exercised in this pass.

| Check | Result | Evidence |
| --- | --- | --- |
| Five site sections at 320px and 1440px | Zero reported axe violations in all ten checks | [Site audits](site-audits.json) |
| Standalone library example | Two rendered independent instruments; isolation affects only the second instance; no warning/error logs; zero reported axe violations | [Standalone audit](standalone-audit.json) |
| Five sections at 320px, 768px, and 1440px | Page scroll width equals viewport width in all fifteen cases | [Responsive measurements](responsive.json) |
| Five sections at 720px | No page-level horizontal scroll; approximates the available layout width of a 1440px viewport at 200% zoom | [720px measurements](reflow-720.json) |
| Mobile menu and tooltip with motion enabled | Native popovers enter the top layer; both remain inside the 320×760 viewport | Manual browser inspection |
| Modal dialog | Native modal state, initial input focus, forward/reverse Tab boundary wrapping, Escape close, and opener focus restoration | Manual browser interaction and controller tests |
| Tabs and command menu | Arrow navigation, disabled skipping, selection, typeahead, Escape dismissal, and trigger focus restoration | Manual browser interaction and controller tests |
| Tooltip | Focus display and Escape dismissal; hover persistence and description preservation | Manual browser interaction and controller tests |
| Forms and native controls | Invalid email receives linked inline feedback and focus; correction clears it; switch and range keyboard changes update readouts | Manual browser interaction and controller tests |
| Visual review | Original rectangular geometry, lime actions, graphite surfaces, restrained cyan, and thin range track preserved | [Overview](../assets/previews/starkplane-v0.5.0-overview.png), [catalogue](../assets/previews/starkplane-v0.5.0-components.png) |

A follow-up pass on 2026-10-10 in a Chromium-based in-app browser on Windows re-ran axe on all five site sections at 320px and the standalone example (zero violations), measured page scroll width at 320, 800, 1000, 1200, and 1600px (no page-level horizontal scroll), confirmed the hero headline fits its column and the release stamp no longer overlaps the instrument workspace, checked switch and range direction under `dir="rtl"`, and checked that view navigation moves focus to the new view's heading. The archived JSON reports above are from the earlier pass.

The site audits were run with interpolated motion disabled and content settled. The standalone audit includes its SVG instrument content. Floating placement was separately exercised with motion enabled. Append `?audit=1` to a local preview URL to load the optional axe audit UI; it is not loaded during normal visits.

## Limits

Zero automated violations is not accessibility certification. The saved reports retain incomplete checks for gradient-backed controls, decorative glyphs, SVG/overlap contrast, hidden menu relationships, and icon-only accessible-name comparisons. Default text/background and essential boundary role combinations also have automated numeric contrast tests; those do not certify arbitrary custom themes.

Manual screen-reader testing, OS forced-color testing, Firefox/Safari checks, touch-device testing, and actual browser zoom were not performed. Reduced motion has automated behavioral coverage; forced-color adaptations are implemented in Sass. The 720px test is a layout approximation, not proof of every browser's zoom behavior. No finite test suite establishes perfect implementation.

The completed scope is the [v0.1.0 specification](../design-language.md). Slint remains a future placeholder. Rich text editors, calendar pickers, tree grids, and chart engines are explicitly outside this version's component inventory.
