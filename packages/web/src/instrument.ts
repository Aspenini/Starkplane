import { designTokens } from "./tokens.js";
import { createSpring, type SpringController } from "./motion.js";
export type InstrumentLayer = "all" | "cover" | "core" | "base";
export type InstrumentMode = "blueprint" | "material";
export interface InstrumentState {
  separation: number;
  renderedSeparation: number;
  intensity: number;
  rotation: number;
  layer: InstrumentLayer;
  mode: InstrumentMode;
}
export interface InstrumentOptions {
  separation?: number;
  intensity?: number;
  rotation?: number;
  layer?: InstrumentLayer;
  mode?: InstrumentMode;
  motion?: boolean;
  onChange?: (state: Readonly<InstrumentState>) => void;
}
export interface InstrumentController {
  readonly state: Readonly<InstrumentState>;
  setSeparation(percent: number): void;
  setIntensity(percent: number): void;
  setRotation(degrees: number): void;
  selectLayer(layer: InstrumentLayer): void;
  setMode(mode: InstrumentMode): void;
  setMotionEnabled(enabled: boolean): void;
  inspect(): {
    layers: number;
    visibleLayers: number;
    paths: number;
    elements: number;
  };
  destroy(): void;
}
let nextInstrumentId = 0;
function point(radius: number, angle: number): string {
  const radians = (angle * Math.PI) / 180;
  return `${(200 + radius * Math.cos(radians)).toFixed(3)},${(200 + radius * Math.sin(radians)).toFixed(3)}`;
}
function arcSegment(
  inner: number,
  outer: number,
  start: number,
  end: number,
): string {
  return `M${point(outer, start)} A${outer},${outer} 0 0 1 ${point(outer, end)} L${point(inner, end)} A${inner},${inner} 0 0 0 ${point(inner, start)} Z`;
}
/** Render original SVG, with IDs unique to each instance. Safe to call on the server. */
export function renderInstrumentSvg(
  idPrefix = `ui-instrument-${++nextInstrumentId}`,
): string {
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(idPrefix))
    throw new TypeError(
      "An SVG ID prefix must start with a letter and contain only letters, digits, underscores, or hyphens.",
    );
  const prefix = idPrefix;
  const modelRing = (radius: number, stroke: string, width = 1, dash = "") =>
    `<circle cx="200" cy="200" r="${radius}" fill="none" stroke="${stroke}" stroke-width="${width}" ${dash ? `stroke-dasharray="${dash}"` : ""}/>`;
  let modelTicks = "",
    modelVanes = "",
    modelHoles = "",
    modelSpokes = "";
  for (let i = 0; i < 96; i++) {
    modelTicks += `<path d="M${point(163, i * 3.75)}L${point(i % 8 === 0 ? 176 : 169, i * 3.75)}"/>`;
  }

  for (let i = 0; i < 8; i++) {
    modelVanes += `<path class="model-surface" d="${arcSegment(82, 145, i * 45 + 4, i * 45 + 41)}"/><path class="inner-edge" d="${arcSegment(91, 135, i * 45 + 8, i * 45 + 36)}"/><path d="M${point(84, i * 45 + 22.5)}L${point(143, i * 45 + 22.5)}"/>`;
    const p = point(154, i * 45).split(",");
    modelHoles += `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="var(--ui-color-recess,#0d0f10)" stroke="currentColor"/><circle cx="${p[0]}" cy="${p[1]}" r="2" fill="currentColor"/>`;
    modelSpokes += `<path d="M${point(60, i * 45)}L${point(148, i * 45)}"/>`;
  }
  return `<svg viewBox="0 0 400 480" role="img" aria-label="An original exploded instrument assembly with three independently selectable layers: outer chassis, radial core, and mounting plate"><defs><linearGradient id="${prefix}-console-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#94b4be"/><stop offset=".3" stop-color="#3c6675"/><stop offset=".7" stop-color="#152f39"/><stop offset="1" stop-color="#6c919b"/></linearGradient><radialGradient id="${prefix}-console-core"><stop stop-color="#426773"/><stop offset=".7" stop-color="#122b35"/><stop offset="1" stop-color="#071820"/></radialGradient></defs><g class="model-projection"><g data-model-layer="base" class="model-layer model-base" transform="translate(0,48)"><g transform="translate(0,90) scale(1,.58)"><circle class="model-surface" cx="200" cy="200" r="164"/>${modelRing(160, "currentColor")}${modelRing(148, "currentColor", 0.6)}${modelRing(68, "currentColor")}${modelRing(62, "currentColor", 0.6)}<g class="model-wires">${modelSpokes}${modelTicks}${modelHoles}</g><path d="M174 181H226V219H174Z" fill="none" stroke="currentColor"/><path d="M183 181V219M192 181V219M201 181V219M210 181V219M219 181V219" stroke="currentColor" stroke-width=".5"/></g></g><g class="projection-guides" stroke="currentColor" stroke-width=".6" stroke-dasharray="3 5"><path id="${prefix}-projection-left" d="M37 161V249"/><path id="${prefix}-projection-right" d="M363 161V249"/><path id="${prefix}-projection-center" d="M200 105V300"/></g><g data-model-layer="core" class="model-layer model-core"><g transform="translate(0,90) scale(1,.58)"><g id="${prefix}-rotor" class="model-wires">${modelRing(154, "currentColor", 0.8)}${modelVanes}<circle class="model-surface center-surface" cx="200" cy="200" r="76"/>${modelRing(69, "currentColor")}${modelRing(60, "currentColor", 0.6, "2 4")}<path class="core-mark" d="M200 173L224 187V213L200 227L176 213V187ZM200 184L215 192V208L200 216L185 208V192Z"/><g class="signal">${modelRing(79, "var(--ui-color-attention,#dfa86c)", 1.8, "38 46")}</g></g></g></g><g data-model-layer="cover" class="model-layer model-cover" transform="translate(0,-48)"><g transform="translate(0,90) scale(1,.58)"><path class="model-surface" d="${arcSegment(139, 166, 0, 179.9)} ${arcSegment(139, 166, 180, 359.9)}"/>${modelRing(166, "currentColor", 1.2)}${modelRing(159, "currentColor", 0.7)}${modelRing(139, "currentColor", 1.2)}<g class="model-wires">${modelTicks}${modelHoles}</g></g></g><g class="technical-dimensions" fill="none" stroke="currentColor" stroke-width=".6"><path d="M25 325H375M25 317V333M375 317V333M25 325l7 -3m-7 3l7 3m343 -3l-7 -3m7 3l-7 3"/><path d="M13 168V266M8 168H18M8 266H18"/><path d="M195 350H205M200 345V355"/></g><g class="model-dimension-text" fill="currentColor" font-family="IBM Plex Mono,monospace" font-size="6" letter-spacing="1"><text x="180" y="339">Ø 332 PX</text><text x="8" y="157">Y / 03</text><text x="192" y="370">AX–01</text></g></g></svg>`;
}

function percent(value: number, min = 0): number {
  if (!Number.isFinite(value))
    throw new RangeError("Instrument values must be finite.");
  return Math.min(100, Math.max(min, value));
}
function validLayer(layer: InstrumentLayer): void {
  if (!["all", "cover", "core", "base"].includes(layer))
    throw new RangeError(`Unknown layer: ${layer}`);
}
function validMode(mode: InstrumentMode): void {
  if (!["blueprint", "material"].includes(mode))
    throw new RangeError(`Unknown mode: ${mode}`);
}

/** Mount an independent instrument; destroy() cancels motion and restores the host contents. */
export function createInstrument(
  root: HTMLElement,
  options: InstrumentOptions = {},
): InstrumentController {
  const state: InstrumentState = {
    separation: percent(options.separation ?? 40),
    renderedSeparation: percent(options.separation ?? 40) * 0.6,
    intensity: percent(options.intensity ?? 72, 0),
    rotation: options.rotation ?? 0,
    layer: options.layer ?? "all",
    mode: options.mode ?? "blueprint",
  };
  validLayer(state.layer);
  validMode(state.mode);
  if (!Number.isFinite(state.rotation))
    throw new RangeError("Rotation must be finite.");
  let prefix: string;
  do { prefix = `ui-instrument-${++nextInstrumentId}`; }
  while (root.ownerDocument.getElementById(`${prefix}-console-metal`));
  const original = [...root.childNodes],
    hadClass = root.classList.contains("ui-instrument"),
    hadClassAttribute = root.hasAttribute("class"),
    originalMode = root.getAttribute("data-ui-mode"),
    originalIntensity = root.style.getPropertyValue(
      "--ui-instrument-intensity",
    ),
    originalPriority = root.style.getPropertyPriority(
      "--ui-instrument-intensity",
    );
  root.innerHTML = renderInstrumentSvg(prefix);
  root.classList.add("ui-instrument");
  const query = <E extends Element>(selector: string): E => {
    const node = root.querySelector<E>(selector);
    if (!node) throw new Error(`Instrument node missing: ${selector}`);
    return node;
  };
  let destroyed = false;
  const assertLive = () => {
    if (destroyed) throw new Error("This instrument has been destroyed.");
  };
  const notify = () => options.onChange?.({ ...state });
  const paint = (offset: number) => {
    state.renderedSeparation = offset;
    query("[data-model-layer=cover]").setAttribute(
      "transform",
      `translate(0,${-offset * 1.9})`,
    );
    query("[data-model-layer=base]").setAttribute(
      "transform",
      `translate(0,${offset * 1.9})`,
    );
    query(`#${prefix}-projection-left`).setAttribute(
      "d",
      `M37 ${206 - offset * 1.9}V${206 + offset * 1.9}`,
    );
    query(`#${prefix}-projection-right`).setAttribute(
      "d",
      `M363 ${206 - offset * 1.9}V${206 + offset * 1.9}`,
    );
    query(`#${prefix}-projection-center`).setAttribute(
      "d",
      `M200 ${100 - offset * 1.9}V${300 + offset * 1.9}`,
    );
  };
  const paintSelection = () => {
    root.querySelectorAll<SVGGElement>("[data-model-layer]").forEach((part) => {
      part.style.display =
        state.layer === "all" || part.dataset.modelLayer === state.layer
          ? ""
          : "none";
      part.classList.toggle(
        "selected-part",
        state.layer !== "all" && part.dataset.modelLayer === state.layer,
      );
    });
    query<SVGGElement>(".projection-guides").style.display =
      state.layer === "all" ? "" : "none";
  };
  const paintMode = () => {
    root.setAttribute("data-ui-mode", state.mode);
    root.querySelectorAll<SVGElement>(".model-surface").forEach((surface) => {
      if (state.mode === "material")
        surface.style.fill = `url(#${prefix}-${surface.classList.contains("center-surface") ? "console-core" : "console-metal"})`;
      else surface.style.removeProperty("fill");
    });
  };
  const spring: SpringController = createSpring({
    initial: state.renderedSeparation,
    ...designTokens.motion.presets.instrument,
    enabled: options.motion ?? true,
    onUpdate(next) {
      if (destroyed) return;
      paint(next.value);
      notify();
    },
  });
  paintMode();
  root.style.setProperty(
    "--ui-instrument-intensity",
    String(state.intensity / 100),
  );
  paint(state.renderedSeparation);
  paintSelection();
  query(`#${prefix}-rotor`).setAttribute(
    "transform",
    `rotate(${state.rotation} 200 200)`,
  );
  return {
    get state() {
      return { ...state };
    },
    setSeparation(value) {
      assertLive();
      state.separation = percent(value);
      spring.to(state.separation * 0.6);
    },
    setIntensity(value) {
      assertLive();
      state.intensity = percent(value);
      root.style.setProperty(
        "--ui-instrument-intensity",
        String(state.intensity / 100),
      );
      notify();
    },
    setRotation(value) {
      assertLive();
      if (!Number.isFinite(value))
        throw new RangeError("Rotation must be finite.");
      state.rotation = ((value % 360) + 360) % 360;
      query(`#${prefix}-rotor`).setAttribute(
        "transform",
        `rotate(${state.rotation} 200 200)`,
      );
      notify();
    },
    selectLayer(layer) {
      assertLive();
      validLayer(layer);
      state.layer = layer;
      paintSelection();
      notify();
    },
    setMode(mode) {
      assertLive();
      validMode(mode);
      state.mode = mode;
      paintMode();
      notify();
    },
    setMotionEnabled(enabled) {
      assertLive();
      spring.setEnabled(enabled);
    },
    inspect() {
      assertLive();
      return {
        layers: root.querySelectorAll("[data-model-layer]").length,
        visibleLayers: state.layer === "all" ? 3 : 1,
        paths: root.querySelectorAll("path").length,
        elements: root.querySelectorAll("svg *").length,
      };
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      spring.destroy();
      root.replaceChildren(...original);
      if (!hadClass) root.classList.remove("ui-instrument");
      if (!hadClassAttribute && !root.classList.length) root.removeAttribute("class");
      if (originalMode === null) root.removeAttribute("data-ui-mode");
      else root.setAttribute("data-ui-mode", originalMode);
      if (originalIntensity)
        root.style.setProperty(
          "--ui-instrument-intensity",
          originalIntensity,
          originalPriority,
        );
      else root.style.removeProperty("--ui-instrument-intensity");
    },
  };
}
