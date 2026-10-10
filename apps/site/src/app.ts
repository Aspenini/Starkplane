import { designTokens, createSpring, createToastRegion, createSegmentedControl, createRange, createField } from "starkplane";
import { $, $$ } from "./dom.js";
import { instrument } from "./instrument.js";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
export let effects = !reducedMotion.matches;
try {
  // Carry over the earlier prototype's motion preference.
  const saved =
    localStorage.getItem("starkplane-effects") ??
    localStorage.getItem("gritdatum-effects") ??
    localStorage.getItem("untitled-effects");
  if (saved !== null) effects = saved === "true" && !reducedMotion.matches;
} catch {}
const feedback = createToastRegion($("#toast"));
export function toast(message: string) { feedback.show(message); }
$("#dismiss-feedback").addEventListener("click", () => feedback.clear());
function setEffects(enabled: boolean, persist = true) {
  effects = enabled;
  instrument.setMotionEnabled(effects);
  simulationSpring.setEnabled(effects);
  document.body.classList.toggle("effects-off", !effects);
  document.body.classList.toggle("ui-motion-off", !effects);
  $("#effects-button").setAttribute("aria-pressed", String(effects));
  $("#effects-button").setAttribute(
    "aria-label",
    effects ? "Disable motion effects" : "Enable motion effects",
  );
  if (!effects) {
    $<SVGSVGElement>("#instrument-visual svg").style.transform = "";
    stopRotation();
    if (simulationSpring.running) {
      simulationSpring.jump(simulation.target);
      $("#motion-state").textContent = "SETTLED";
    }
  }
  if (persist) {
    try {
      localStorage.setItem("starkplane-effects", String(effects));
    } catch {}
  }
}
$("#effects-button").addEventListener("click", () => {
  if (reducedMotion.matches && !effects) {
    toast("Motion is disabled by your device preference.");
    return;
  }
  setEffects(!effects);
  toast(effects ? "Motion effects enabled." : "Motion effects disabled.");
});
reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) setEffects(false, false);
});

export let currentView = "overview";
function changeView(view: string | undefined, scroll = true) {
  view ??= "overview";
  if (!["overview", "materials", "motion", "components", "specification"].includes(view))
    view = "overview";
  currentView = view;
  $$(".view").forEach((section) => {
    section.hidden = section.id !== `${view}-view`;
  });
  $$(".nav-link").forEach((link) => {
    const active = link.dataset.view === view;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  $("#breadcrumb").textContent = view.toUpperCase();
  document.title = `STARKPLANE / 01 — ${view[0].toUpperCase() + view.slice(1)}`;
  if (view !== "overview") stopRotation();
  if (view === "motion") paintSimulation();
  if (scroll) window.scrollTo({ top: 0, behavior: "instant" });
}
$$("[data-go]").forEach((button) =>
  button.addEventListener("click", () => {
    const view = button.dataset.go;
    if (!view) return;
    if (location.hash === `#${view}`) changeView(view);
    else location.hash = view;
  }),
);
window.addEventListener("hashchange", () => changeView(location.hash.slice(1)));
$$(".nav-link, .brand").forEach((link) =>
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (href && location.hash === href) {
      event.preventDefault();
      changeView(href.slice(1));
    }
  }),
);
$(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  $("#content").focus({ preventScroll: true });
  $("#content").scrollIntoView({ behavior: "instant" });
});

let rotationFrame: number | null = null;
let rotation = 0,
  lastRotationTime = 0;
export function stopRotation() {
  if (rotationFrame) cancelAnimationFrame(rotationFrame);
  rotationFrame = null;
  $("#rotate-button").setAttribute("aria-pressed", "false");
  $("#rotate-button").innerHTML = "Actuate <span>↻</span>";
}
export function resetRotation() {
  stopRotation();
  rotation = 0;
  instrument.setRotation(0);
}
$("#rotate-button").addEventListener("click", () => {
  if (rotationFrame) {
    stopRotation();
    return;
  }
  if (!effects) {
    rotation += 45;
    instrument.setRotation(rotation);
    toast("Instrument advanced 45°.");
    return;
  }
  $("#rotate-button").setAttribute("aria-pressed", "true");
  $("#rotate-button").innerHTML = "Stop <span>■</span>";
  lastRotationTime = performance.now();
  const frame = (time: number) => {
    rotation += Math.min(time - lastRotationTime, 40) * 0.018;
    lastRotationTime = time;
    instrument.setRotation(rotation);
    rotationFrame = requestAnimationFrame(frame);
  };
  rotationFrame = requestAnimationFrame(frame);
});
$("#instrument-panel").addEventListener("pointermove", (event) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect(),
    x = (event.clientX - rect.left) / rect.width - 0.5,
    y = (event.clientY - rect.top) / rect.height - 0.5;
  $("#coordinate-x").textContent = (x * 100).toFixed(2).padStart(6, "0");
  $("#coordinate-y").textContent = (y * 100).toFixed(2).padStart(6, "0");
  if (effects)
    $<SVGSVGElement>("#instrument-visual svg").style.transform =
      `rotateX(${18 - y * 14}deg) rotateY(${-14 + x * 18}deg) rotateZ(-16deg)`;
});
$("#instrument-panel").addEventListener("pointerleave", () => {
  $<SVGSVGElement>("#instrument-visual svg").style.transform = "";
  $("#coordinate-x").textContent = "000.00";
  $("#coordinate-y").textContent = "000.00";
});

const materialData: Record<
  string,
  {
    code: string;
    finish: string;
    depth: string;
    description: string;
    background: string;
    number: string;
  }
> = {
  graphite: {
    code: "M–01",
    finish: "MATTE / MICROTEXTURED",
    depth: "00 / FOUNDATION",
    description:
      "The foundation layer. A fine, matte grain absorbs light while a single bright edge makes the boundary unmistakable.",
    background:
      "repeating-linear-gradient(0deg,#ffffff03 0 1px,transparent 1px 3px),linear-gradient(135deg,#444b4d,#23292b 60%,#161b1d)",
    number: "#7d8888",
  },
  titanium: {
    code: "M–02",
    finish: "SATIN / DIRECTIONAL GRAIN",
    depth: "01 / CONTROL SURFACE",
    description:
      "The interaction layer. Directional grain and a crisp bevel distinguish controls from their surrounding foundation. Use only where the interface can be operated.",
    background:
      "repeating-linear-gradient(0deg,#ffffff12 0 1px,transparent 1px 3px),linear-gradient(135deg,#bfcac5,#657877 60%,#344944)",
    number: "#293b36",
  },
  ceramic: {
    code: "M–03",
    finish: "SMOOTH / DIFFUSE REFLECTION",
    depth: "02 / INSTRUMENT SURFACE",
    description:
      "The instrument layer. A dense, pale surface isolates essential readouts from the dark chassis. Use in small, purposeful areas where contrast improves understanding.",
    background: "linear-gradient(135deg,#ebeee3,#c4cfc2 60%,#a1b09f)",
    number: "#596957",
  },
};
$$("[data-material]").forEach((button) =>
  button.addEventListener("click", () => {
    const material = button.dataset.material,
      data = materialData[material!];
    $$("[data-material]").forEach((other) => {
      const active = other === button;
      other.classList.toggle("selected", active);
      other.setAttribute("aria-pressed", String(active));
    });
    $("#material-code").textContent = data.code;
    $("#material-finish").textContent = data.finish;
    $("#material-depth").textContent = data.depth;
    $("#material-description").textContent = data.description;
    $(".block-face").style.background = data.background;
    $(".block-face > span").style.color = data.number;
    $(".block-face > span").textContent = data.code.slice(-2);
  }),
);
$("#material-preview").addEventListener("pointermove", (event) => {
  if (!effects) return;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect(),
    x = (event.clientX - rect.left) / rect.width - 0.5,
    y = (event.clientY - rect.top) / rect.height - 0.5;
  $("#material-block").style.transform =
    `translate(-50%,-50%) rotateX(${30 - y * 15}deg) rotateY(${-22 + x * 18}deg) rotateZ(-20deg)`;
});
$("#material-preview").addEventListener("pointerleave", () => {
  $("#material-block").style.transform = "";
});
$$("[data-color]").forEach((button) =>
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.color!);
      toast(`${button.dataset.color!.toUpperCase()} copied to clipboard.`);
    } catch {
      toast(`Color value: ${button.dataset.color!.toUpperCase()}`);
    }
  }),
);

const simulation = {
  x: 0,
  v: 0,
  target: 0,
  history: [0],
};
function paintSimulation() {
  const width = $(".motion-track").clientWidth - 70;
  $("#motion-object").style.transform =
    `translateX(${simulation.x * Math.max(width, 0)}px)`;
  $("#displacement").textContent = simulation.x.toFixed(2);
  $("#velocity").textContent =
    Math.abs(simulation.v) < 0.005 ? "0.00" : simulation.v.toFixed(2);
  const samples = simulation.history;
  $("#graph-path").setAttribute(
    "d",
    samples
      .map(
        (x, index) =>
          `${index ? "L" : "M"}${samples.length === 1 ? 0 : (index / (samples.length - 1)) * 600},${100 - x * 75}`,
      )
      .join(" "),
  );
}
const simulationSpring = createSpring({
  initial: 0,
  onUpdate(state) {
    simulation.x = state.value;
    simulation.v = state.velocity;
    simulation.history.push(state.value);
    if (simulation.history.length > 360) simulation.history.shift();
    paintSimulation();
  },
  onRest() {
    $("#motion-state").textContent = "SETTLED";
  },
});
function applyImpulse() {
  simulation.target = simulation.target === 1 ? 0 : 1;
  simulation.history = [simulation.x];
  simulationSpring.configure({
    mass: +$<HTMLInputElement>("#mass").value,
    stiffness: +$<HTMLInputElement>("#stiffness").value,
    damping: +$<HTMLInputElement>("#damping").value,
  });
  simulationSpring.setEnabled(effects);
  $("#motion-state").textContent = effects ? "IN MOTION" : "SETTLED";
  simulationSpring.to(simulation.target);
}
$("#impulse-button").addEventListener("click", applyImpulse);
$("#motion-object").addEventListener("click", applyImpulse);
function resetMotion() {
  simulationSpring.jump(0);
  Object.assign(simulation, {
    x: 0,
    v: 0,
    target: 0,
    history: [0],
  });
  $("#motion-state").textContent = "READY";
  paintSimulation();
}
$("#reset-motion").addEventListener("click", resetMotion);
const presets: Record<string, readonly [number, number, number]> =
  Object.fromEntries(
    Object.entries(designTokens.motion.presets).map(([name, p]) => [
      name,
      [p.mass, p.stiffness, p.damping],
    ]),
  );
export function updateRange(input: HTMLInputElement) {
  input.style.setProperty(
    "--ui-range-fill",
    `${((+input.value - +input.min) / (+input.max - +input.min)) * 100}%`,
  );
  const output = $(`#${input.id}-output`);
  if (output)
    output.textContent =
      input.id === "mass"
        ? `${(+input.value).toFixed(1)} kg`
        : `${input.value} ${input.id === "stiffness" ? "N/m" : input.id === "damping" ? "Ns/m" : "Hz"}`;
}
const rangeControllers = $$<HTMLInputElement>("input[type=range]").map((input) => createRange(input));
$$<HTMLInputElement>("input[type=range]").forEach((input) => {
  updateRange(input);
  input.addEventListener("input", () => {
    updateRange(input);
    if (["mass", "stiffness", "damping"].includes(input.id))
      presetControl.clear();
  });
});
const presetControl = createSegmentedControl($("#motion-presets"), {
  value: "precise",
  onChange(value) {
    ["mass", "stiffness", "damping"].forEach((id, index) => {
      $<HTMLInputElement>(`#${id}`).value = String(presets[value][index]);
      updateRange($<HTMLInputElement>(`#${id}`));
    });
    resetMotion();
  },
});

window.addEventListener("resize", paintSimulation);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopRotation();
    if (simulationSpring.running) {
      simulationSpring.jump(simulation.target);
      $("#motion-state").textContent = "SETTLED";
    }
  }
});

$("#engage-button").addEventListener("click", () => {
  $("#engage-status").textContent = "SYSTEM ENGAGED / READY";
  $("#engage-status").style.color = "var(--accent)";
  toast("System engaged. Controls are ready.");
});
$("#standby-button").addEventListener("click", () => {
  $("#engage-status").textContent = "SYSTEM IN STANDBY";
  $("#engage-status").style.color = "";
  toast("System returned to standby.");
});
function updateToggles() {
  const precision = $<HTMLInputElement>("#precision-toggle").checked,
    lighting = $<HTMLInputElement>("#lighting-toggle").checked;
  document.body.classList.toggle("light-off", !lighting);
  $("#toggle-readout").textContent =
    `ALIGNMENT ${precision ? "LOCKED" : "FREE"} / LIGHT ${lighting ? "ACTIVE" : "OFF"}`;
}
$<HTMLInputElement>("#precision-toggle").addEventListener(
  "change",
  updateToggles,
);
$<HTMLInputElement>("#lighting-toggle").addEventListener(
  "change",
  updateToggles,
);
const unitField = createField($<HTMLInputElement>("#unit-name"), {
  error: $("#input-check"), validate: input => input.value.trim() ? null : "Enter an instrument identifier.",
});
$<HTMLButtonElement>("#diagnostics-button").addEventListener(
  "click",
  async () => {
    const button = $<HTMLButtonElement>("#diagnostics-button");
    button.disabled = true;
    $("#diagnostic-label").textContent = "Checking instrument";
    $("#diagnostic-detail").textContent =
      "Inspecting identifier and control settings…";
    await new Promise((resolve) => setTimeout(resolve, effects ? 1000 : 200));
    const valid = unitField.validate();
    $("#diagnostic-label").closest(".ui-status")?.classList.toggle("ui-status--error", !valid);
    $("#diagnostic-label").textContent = valid
      ? "All systems nominal"
      : "Instrument ID required";
    $("#diagnostic-detail").textContent = valid
      ? `${$<HTMLInputElement>("#unit-name").value.trim()} · ${$<HTMLInputElement>("#frequency").value} Hz · ${$<HTMLInputElement>("#precision-toggle").checked ? "Alignment locked" : "Alignment free"}`
      : "Enter an instrument ID in the calibration specimen.";
    button.disabled = false;
    toast(
      valid
        ? "Diagnostics complete. All checks passed."
        : "Enter an instrument ID to complete diagnostics.",
    );
  },
);
$("#export-button").addEventListener("click", () => {
  const tokens = designTokens;
  const blob = new Blob([JSON.stringify(tokens, null, 2)], {
      type: "application/json",
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "starkplane-design-tokens.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Design tokens exported.");
});
$("#export-mobile").addEventListener("click", () =>
  $("#export-button").click(),
);
setEffects(effects, false);
changeView(location.hash.slice(1), false);

window.addEventListener("pagehide", event => { if (event.persisted) return; stopRotation(); simulationSpring.destroy(); feedback.destroy(); unitField.destroy(); presetControl.destroy(); rangeControllers.forEach(controller => controller.destroy()); }, { once: true });
