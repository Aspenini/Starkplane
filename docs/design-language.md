# Starkplane specification

**Version 0.1.0 — provisional. Everything is subject to change until v1.0.0**, including identity, visual direction, tokens, components, APIs, implementation, and this specification. “Required” below defines conformance to this version; it does not promise compatibility with a later version.

Starkplane imagines interfaces engineered like advanced physical instruments. Precision geometry establishes structure, machined surfaces communicate depth, illumination carries information, and motion explains changes in state.

## Scope and completion

This specification covers the foundations and general-purpose component set in the inventory below. A conforming web implementation supplies every listed component, state, semantic rule, and documented public API. The website must demonstrate the actual exported library rather than imitate its component styling. Application content, business logic, and domain-specific visualizations remain the application author's responsibility.

Slint is a reserved future implementation. Its existence is not part of this web version's completion criteria. Rich text editing, calendar pickers, tree grids, drag-and-drop canvases, and custom chart engines are separate future extensions; they are not represented as completed components.

## Identity and composition

Use the name Starkplane in prose and STARKPLANE for the display wordmark. The language is defined by exact alignment, rectangular framing, opposing action chamfers, graphite materials, and controlled response. Preserve open spacing and a clear reading order. Technical decoration must not conceal labels, obscure content, or imply external systems are connected when they are not.

Use a large geometric headline, a restrained supporting paragraph, and clear operational actions for introductory pages. Application layouts should prioritize task hierarchy rather than copy the workshop's decorative telemetry.

## Tokens and theme ownership

`packages/web/src/tokens.ts` is the current canonical source. The build derives Sass, JSON, and the token reference from it; do not maintain independent copies of token values. Public CSS variables use the `--ui-` prefix. The corresponding Sass helper is `ui.token(key)`.

The [token reference](tokens.md) lists every value. Consumers can override colors at runtime, any exposed CSS variable in a subtree, or the Sass `$theme` map at compilation. Default dark graphite is the specified reference theme. A custom theme must preserve the semantic roles and meet the contrast criteria below; arbitrary overrides are not automatically certified accessible.

### Color roles

Foundation anchors the page; surface encloses a region; raised identifies an elevated control; recess identifies input or embedded content. Seam is decorative separation. Boundary identifies an operable edge and has stronger contrast. Content and secondary are the only default text roles. Action is lime, schematic is cyan, attention is muted amber, and error is a restrained coral. Success uses action; information uses schematic; warning uses attention; failure uses error.

State must also be communicated by text, shape, position, or a native state indication. Decorative seams may have low contrast because they carry no essential information; essential control boundaries and focus indications must meet 3:1 contrast against their surroundings. Normal text must meet 4.5:1; large text may meet 3:1. Disabled controls are visually muted but remain identifiable.

### Geometry and spacing

The base spacing unit is 8px. The half-unit is 4px; compact spacing is 12px; control spacing is 16px; panel spacing is 24px; section spacing is 32px; wide spacing is 48px; major spacing is 64px. Use the spacing tokens for component and layout rhythm. Small optical offsets in native controls and vector drawings are permitted.

Standard surfaces have zero corner radius and a 1px seam. Primary actions have opposing 8px chamfers at top-right and bottom-left. Secondary actions use a shallow vertical bevel. Circles are reserved for radial diagrams and semantic native controls such as radio buttons; they do not soften panel geometry.

Interactive controls have a minimum 44px height. Icon buttons also have a minimum 44px width. Smaller visible glyphs, switch tracks, and slider thumbs retain a 44px interaction area. Table links and text links retain native inline behavior and adequate spacing.

### Materials and illumination

Use matte graphite for the foundation, an inset top highlight on enclosing surfaces, a shallow bevel on secondary buttons, and a darker recess for inputs. Boundaries establish hierarchy without depending on blur, transparency, or glow. Floating surfaces receive a restrained shadow and a visible boundary. Dialogs use an opaque dark scrim behind their surface.

Use light locally for actions, schematic strokes, selected states, and feedback. Decorative gradients may vary in a material specimen or instrument diagram; operational controls must use the shared tokens. No flashing, strobing, ambient pulse, or continuous decorative motion is required.

## Typography and icons

Display text uses Space Grotesk with Arial/sans-serif fallbacks; technical labels and values use IBM Plex Mono with monospace fallback. Fonts are optional, consumer-provided assets. The library makes no remote font requests.

The type scale is 11px caption, 12px label, 14px body, 16px lead, 20px title, 28px heading, and 40px display. Body line height is 1.6; heading line height is 1.2. Display text can scale down to 28px on narrow screens. Site-specific introductory typography may use a larger responsive display size. Use sentence case for prose and action labels. Uppercase monospace is reserved for short technical labels; do not make long paragraphs all capitals.

Icons use a 20×20 viewBox, a 1.5px stroke, square line caps, and miter joins. The library includes arrow-right, chevron-down, check, close, plus, minus, menu, search, info, and warning. Icons inherit currentColor. Decorative SVGs are hidden from assistive technology; icon-only controls require a meaningful accessible name on the containing button. Icons must not be the sole explanation of an error or status.

## Functional motion

Numerical motion uses mass, stiffness, and damping. Precise is the default control response; weighted suggests heavier displacement; elastic is limited to deliberate demonstrations or interactions; instrument is the assembly separation preset. The token reference records their numerical parameters. Supported stiffness/mass is at most 1e6 and damping/mass at most 1e4; integration uses adaptive bounded substeps and rejects numerical overflow.

Small CSS feedback uses 160ms and state changes use 240ms with the shared easing curve. Hover lifts a button 1px; an active press displaces it 2px. Reduced motion removes interpolated visual response and reaches the same final state immediately. User-disabled motion must disable both CSS animations and JavaScript springs. A loading spinner may rotate while work is pending; under reduced motion it remains a static indication accompanied by text.

Spring controllers support retargeting, cancellation, immediate placement, reconfiguration, and destruction. Invalid finite-number inputs are rejected before state changes. Destroying a controller cancels its scheduled frames and preference subscriptions. No animated readout should continuously announce frame values to a screen reader.

## Layout, responsiveness, and layering

Use `ui-container` for a maximum 1200px content area, `ui-stack` for vertical groups, `ui-cluster` for wrapping controls, and `ui-grid` for intrinsic columns of at least 280px where space permits. Components must shrink with their containers and retain their reading order. The website switches to its compact navigation below 700px and further simplifies its wordmark at 360px.

At 320px width, no page-level horizontal scroll is permitted. Long tables and tab lists may scroll inside labelled, bounded containers. Dialogs stay within the viewport with 16px margins, retain their close control, and scroll internally. Menus and tooltips are positioned within the visual viewport and update on scrolling or resizing. Menus and tooltips use manual native popovers where available to escape transformed ancestors while retaining DOM relationships; they fall back to fixed positioning in untransformed containers. See the [native Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API). Floating content has layer 20; feedback has layer 40; native modal dialogs use the browser's top layer.

At 200% zoom, content must reflow without overlapping labels or hiding controls. A consumer must not place fixed-height clipping containers around variable text. Right-to-left layouts use logical spacing; horizontal tabs and segmented controls reverse their arrow direction accordingly.

## Component inventory and states

All interactive components require default, keyboard-focus, and disabled behavior where applicable. Hover is an enhancement; every operation must be available without hovering. Pressed, selected, invalid, expanded, checked, and busy states must use the appropriate native or ARIA state and must agree with the visible state.

| Component | Web primitive | Required behavior and states |
| --- | --- | --- |
| Layout and typography | `.ui-container`, `.ui-stack`, `.ui-cluster`, `.ui-grid`, `.ui-text` | Reflow, wrapping, type scale, muted and lead variants |
| Icons | `renderIcon`, `.ui-icon` | Decorative, inherited color; labelled containing controls |
| Buttons | `.ui-button` | Primary chamfer, secondary bevel, tertiary, danger, icon; hover, active, focus, disabled, busy |
| Panels | `.ui-panel` | Surface and recessed variants; optional technical label |
| Fields | `.ui-field`, `createField` | Visible label, hint, native constraints, inline invalid message, read-only, disabled |
| Text inputs and textareas | `.ui-field__input` | Native editing, multiline resizing, placeholders, focus, invalid, read-only, disabled |
| Select | native `select.ui-field__input` | Native popup, selection, required, focus, disabled |
| Checkbox and radio | `.ui-choice` | Native label association, checked, unchecked, disabled, focus; checkbox indeterminate property |
| Fieldset | `.ui-fieldset` | Native grouped inputs with a legend |
| Switch | `.ui-switch` | Native checkbox with switch role; checked, unchecked, focus, disabled |
| Range | `.ui-range`, `createRange` | Native min/max/step, keyboard values, fill, labelled output, disabled, form reset |
| Segmented choice | `.ui-segmented`, `createSegmentedControl` | Exclusive pressed state, roving focus, disabled skipping, cleared custom state |
| Tabs | `.ui-tabs`, `createTabs` | Linked tabs and panels, automatic or manual activation, orientation, disabled skipping |
| Navigation and breadcrumbs | `.ui-nav`, `.ui-breadcrumbs`, `.ui-link` | Native links, named navigation, current-page indication, visible focus |
| Disclosure / accordion | `.ui-disclosure`, `createDisclosure` or native details | Expanded/collapsed content, labelled trigger, focus recovery on collapse |
| Command menu | `.ui-menu`, `createMenu` | Single-level commands, enabled/disabled items, keyboard navigation, dismissal, selection |
| Tooltip | `.ui-tooltip`, `createTooltip` | Text-only description, hover and focus, hover persistence, Escape dismissal |
| Modal dialog | native `dialog.ui-dialog`, `createDialog` | Accessible name, initial focus, inert background, focus containment, Escape/close, focus restoration |
| Status / alert | `.ui-status` | Success/default, information, attention, error; visible explanatory text |
| Toast feedback | `.ui-toast`, `createToastRegion` | Polite atomic announcements, persistent message, explicit clear, no HTML insertion |
| Badge | `.ui-badge` | Textual default, action, attention, and error states |
| Progress and loading | native `.ui-progress`, `.ui-spinner` | Labelled determinate/indeterminate progress; loading text; reduced motion |
| Table | `.ui-table`, `.ui-table-region` | Native caption and headers, optional bounded scrolling, keyboard access to scroll region |
| Empty state | `.ui-empty` | Explanation and an appropriate next action; no simulated records |
| Instrument | `.ui-instrument`, `createInstrument`, `renderInstrumentSvg` | Independent instances, blueprint/material, layer selection, separation, intensity, rotation, cleanup |

### State rules

Use native `disabled` for buttons and form controls. It prevents activation and removes controls from sequential keyboard focus. `aria-disabled` is only a semantic supplement for custom controls; the application must also block their action. Read-only inputs remain focusable and copyable. Busy actions have `aria-busy="true"`, a meaningful loading label, and disabled activation while an operation cannot be repeated.

Invalid fields show an error message, set `aria-invalid="true"`, and associate the message through `aria-describedby`. Preserve existing hints. Clear the error when corrected. Do not report untouched fields as invalid on initial render. Form authors prevent submission for custom validation and focus the first invalid field; native constraints remain available without the controller.

Status and badge colors supplement their text. Use a polite status region for routine completion, an alert only for an immediate failure requiring attention, and avoid announcing every decorative update. Toast messages persist until replaced or explicitly cleared, allowing time to read them. An empty state describes what is absent and how to proceed. Table sorting, pagination, data loading, and network operations belong to the application.

## Keyboard and focus contracts

Native buttons activate with Enter or Space; links activate with Enter. Native form controls retain their platform keyboard behavior. Every enabled control shows a focus indication. The shared ring is 2px with a 3px offset; clipped primary buttons use an inset two-tone ring so clipping cannot hide it. Forced-color mode must retain operable boundaries and focus indications.

Segmented choices use their orientation's arrow keys, Home, and End to select and focus an enabled option. Exactly one enabled option is in the tab order; when selection is cleared, the first enabled option remains reachable. All-disabled groups have no tab stop. Tab leaves the group.

Tabs use the same directional navigation with `aria-selected`, `aria-controls`, and labelled tab panels. Automatic activation changes the panel when arrow focus moves; manual activation requires Enter or Space. Horizontal tabs leave Up and Down for normal page scrolling. Disabled options are skipped. Each panel is keyboard reachable.

Disclosures use a native button or summary. A controlled collapse returns focus to its trigger if focus was inside the closing content. Multiple disclosures form an accordion without forcing a single-open policy.

A command menu opens on Enter, Space, click, or Down; Up opens at the last item. Up/Down, Home/End, and printable-character search move focus between available items. Escape and selection close it and restore focus to the trigger. Tab closes it and continues normal page navigation; outside interaction closes it without taking focus away from the destination. Menus contain command buttons, not arbitrary form controls or nested submenus.

A tooltip supplements a visible explanation; it contains no interactive elements. It opens on focus or hover, remains available while the trigger or tooltip is hovered, and closes on Escape or when focus/hover leaves. Escape keeps it dismissed until the current hover/focus interaction ends. `aria-describedby` must preserve any existing descriptions.

A modal dialog uses native `showModal()`, so focus stays inside and the background is inert. The application supplies its name and chooses initial focus appropriate to the task. Escape closes it unless the application deliberately handles native cancellation for an unsaved task. Closing restores focus to the connected opener. Destructive dialogs initially focus the least destructive action. Background clicks do not dismiss a dialog by default.

These interaction contracts follow the relevant [WAI-ARIA patterns](https://www.w3.org/WAI/ARIA/apg/patterns/), particularly [tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), [menu buttons](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/), [modal dialogs](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), and [tooltips](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/).

## Web delivery contract

The `starkplane` package supplies ESM, TypeScript declarations, compiled scoped CSS, Sass mixins, and token JSON. Importing the ESM entry must not require `window` or `document`. DOM controllers are explicitly mounted in the browser; there is no automatic scanning or initialization. The library has no runtime dependencies, remote asset requests, application storage, or global page reset.

Sass import alone emits no styles. `@include ui.styles` explicitly emits the component set. Components use `.ui-*` classes; page resets and site composition remain in the consuming app. Controllers accept caller-owned elements and return state/mutation methods and an idempotent `destroy()`. Destruction removes subscriptions and listeners and restores controller-owned attributes, styles, and content. User-edited form values are preserved. Mutating a destroyed controller throws. Invalid initialization must not leave a partially mounted widget.

The current native baseline requires ES2022 modules, CSS custom properties, `:focus-visible`, `:has`, `color-mix`, native dialog, manual popovers, and modern DOM events. Current Chromium, Firefox, and Safari are the intended targets. Record engines actually tested separately from targets; a passing build is not proof of all-browser compatibility. Unsupported legacy engines require a consumer-chosen fallback and are not part of this version's baseline.

## Acceptance checklist

A completed implementation of this version must:

1. Generate every documented token from one canonical source and reject unknown token keys.
2. Implement every component in the inventory with its required states and keyboard contract.
3. Supply visible labels, valid accessible relationships, contrast-tested default text and control roles, and forced-color/reduced-motion adaptations.
4. Demonstrate the public package in the explanatory site's specimens, with no independent replacement styles for those controls.
5. Pass strict library and consumer TypeScript checks, server-import checks, controller lifecycle and keyboard tests, and theme/Sass tests.
6. Pass a browser check of dialog focus containment, focus restoration, menu/tab navigation, tooltip dismissal, inline validation, and native controls.
7. Pass automated accessibility checks of each visible site section and the standalone library example, with manual checks documented separately.
8. Reflow at 320px, intermediate widths, desktop widths, and 200% zoom equivalent; keep floating surfaces bounded.
9. Produce a local archive whose CSS, Sass, ESM, and declarations work in an independent consumer project.
10. Keep all release notices provisional until v1.0.0 and avoid publishing until explicitly requested.

The implementation record documents the evidence and any verification limits. No finite test suite is a guarantee of perfection or a substitute for usability testing with people.
