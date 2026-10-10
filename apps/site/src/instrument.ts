import { createInstrument, type InstrumentState } from "starkplane";
import { $ } from "./dom.js";

const root = $("#instrument-visual");
export const instrument = createInstrument(root, {
  onChange(state: Readonly<InstrumentState>) {
    root.dispatchEvent(new CustomEvent("ui:model-change", { detail: state }));
  },
});
