import { createSegmentedControl, type InstrumentLayer, type InstrumentMode } from "starkplane";
import { $, $$ } from "./dom.js";
import {
  effects,
  currentView,
  updateRange,
  toast,
  resetRotation,
} from "./app.js";
import { instrument } from "./instrument.js";
const modelState = { history: [24], event: 3 };
const layerNames: Record<InstrumentLayer, string> = {
  all: "Complete assembly",
  cover: "Outer chassis",
  core: "Radial core",
  base: "Mounting plate",
};
function addModelEvent(message: string, state = "OK") {
  const item = document.createElement("li"),
    time = document.createElement("time"),
    text = document.createElement("span"),
    status = document.createElement("i");
  time.textContent = String(++modelState.event).padStart(3, "0");
  text.textContent = message;
  status.textContent = state;
  item.append(time, text, status);
  $("#activity-stream").append(item);
  while ($("#activity-stream").children.length > 5)
    $("#activity-stream").firstElementChild!.remove();
}
function paintLayers() {
  const offset = instrument.state.renderedSeparation;
  if (modelState.history.at(-1) !== offset) modelState.history.push(offset);
  if (modelState.history.length > 240) modelState.history.shift();
  $("#separation-readout").innerHTML = `${offset.toFixed(1)}<span>PX</span>`;
  $("#offset-readout").textContent = offset.toFixed(1);
  const history = modelState.history;
  $("#layer-trace").setAttribute(
    "d",
    history.length === 1
      ? `M0 ${75 - history[0]}H220`
      : history
          .map(
            (v, i) =>
              `${i ? "L" : "M"}${(i / (history.length - 1)) * 220},${75 - v}`,
          )
          .join(" "),
  );
}
$("#instrument-visual").addEventListener("ui:model-change", paintLayers);
function setSeparation(value: string | number, log = true) {
  $<HTMLInputElement>("#separation").value = String(value);
  updateRange($<HTMLInputElement>("#separation"));
  $("#separation-output").textContent = `${value}%`;
  modelState.history = [instrument.state.renderedSeparation];
  instrument.setSeparation(+value);
  if (log) addModelEvent(`Layer separation set to ${value}%`);
}
function selectModelLayer(layer: InstrumentLayer, log = true) {
  instrument.selectLayer(layer);
  $$("[data-layer]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.layer === layer);
    button.setAttribute("aria-pressed", String(button.dataset.layer === layer));
  });
  $(".annotation-upper").style.opacity =
    layer === "all" || layer === "cover" ? "1" : "0";
  $(".annotation-lower").style.opacity =
    layer === "all" || layer === "base" ? "1" : "0";
  $("#selection-telemetry").textContent = layer.toUpperCase();
  $("#layer-status").textContent = layerNames[layer].toUpperCase();
  $("#visible-layers").innerHTML =
    `${layer === "all" ? "03" : "01"}<span>/ 03</span>`;
  if (log) addModelEvent(`${layerNames[layer]} selected`);
}
function setModelMode(mode: InstrumentMode, log = true) {
  instrument.setMode(mode);
  $("#instrument-panel").classList.toggle("blueprint", mode === "blueprint");
  $("#instrument-panel").classList.toggle("material-mode", mode === "material");
  $$("[data-render]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.render === mode);
    button.setAttribute("aria-pressed", String(button.dataset.render === mode));
  });
  $("#mode-telemetry").textContent = mode.toUpperCase();
  $("#render-label").textContent =
    mode === "blueprint" ? "WIREFRAME / LIVE" : "SURFACE / LIVE";
  $("#view-mode-status").textContent =
    mode === "blueprint" ? "MODE / WIREFRAME" : "MODE / MATERIAL";
  if (log)
    addModelEvent(
      `${mode === "blueprint" ? "Blueprint" : "Material"} view enabled`,
    );
}
function setLineIntensity(value: string | number, log = false) {
  $<HTMLInputElement>("#detail").value = String(value);
  updateRange($<HTMLInputElement>("#detail"));
  $("#detail-output").textContent = `${value}%`;
  $("#intensity-telemetry").textContent = `${value}%`;
  instrument.setIntensity(+value);
  if (log) addModelEvent(`Line intensity set to ${value}%`);
}
$<HTMLInputElement>("#separation").addEventListener("input", (event) =>
  setSeparation((event.currentTarget as HTMLInputElement).value, false),
);
$<HTMLInputElement>("#separation").addEventListener("change", (event) =>
  addModelEvent(
    `Layer separation set to ${(event.currentTarget as HTMLInputElement).value}%`,
  ),
);
$<HTMLInputElement>("#detail").addEventListener("input", (event) =>
  setLineIntensity((event.currentTarget as HTMLInputElement).value),
);
$<HTMLInputElement>("#detail").addEventListener("change", (event) =>
  addModelEvent(
    `Line intensity set to ${(event.currentTarget as HTMLInputElement).value}%`,
  ),
);
const layerControl = createSegmentedControl($("#assembly-tree"), { value: "all", orientation: "vertical", onChange: value => selectModelLayer(value as InstrumentLayer) });
const modeControl = createSegmentedControl($("#render-mode"), { value: "blueprint", onChange: value => setModelMode(value as InstrumentMode) });
$("#reassemble-button").addEventListener("click", () => setSeparation(0));
$("#reset-workspace").addEventListener("click", () => {
  resetRotation();
  modeControl.setValue("blueprint");
  setModelMode("blueprint", false);
  layerControl.setValue("all");
  selectModelLayer("all", false);
  setLineIntensity(72);
  setSeparation(40, false);
  $("#model-health").textContent = "Ready to inspect";
  addModelEvent("Workspace calibration restored");
});
$("#analyze-button").addEventListener("click", async () => {
  const button = $<HTMLButtonElement>("#analyze-button");
  button.disabled = true;
  $("#instrument-panel").classList.add("analysis-running");
  $("#model-health").textContent = "Inspecting geometry…";
  addModelEvent("Geometry inspection initiated", "RUN");
  await new Promise((resolve) => setTimeout(resolve, effects ? 1400 : 100));
  const { layers, paths } = instrument.inspect();
  $("#model-health").textContent =
    layers === 3 && paths > 0 ? "Geometry verified" : "Geometry incomplete";
  $("#instrument-panel").classList.remove("analysis-running");
  addModelEvent(`${layers} layers / ${paths} paths verified`);
  button.disabled = false;
  toast("Inspection complete. Visual geometry verified.");
});
const syncMotion = () =>
  instrument.setMotionEnabled(
    effects && !document.hidden && currentView === "overview",
  );
$("#effects-button").addEventListener("click", syncMotion);
window.addEventListener("hashchange", syncMotion);
document.addEventListener("visibilitychange", syncMotion);
$("#element-count").innerHTML =
  `${String(instrument.inspect().elements).padStart(3, "0")}<span>SVG</span>`;
setLineIntensity(72);
$("#separation-output").textContent = "40%";
paintLayers();

window.addEventListener("pagehide", event => { if (event.persisted) return; layerControl.destroy(); modeControl.destroy(); instrument.destroy(); }, { once: true });
