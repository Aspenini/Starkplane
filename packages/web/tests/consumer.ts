import {
  createInstrument,
  createSpring,
  createSegmentedControl,
  applyTheme,
  type InstrumentMode,
} from "starkplane";

declare const host: HTMLElement;
const instrument = createInstrument(host, {
  separation: 40,
  mode: "blueprint",
});
const restore = applyTheme(host, { action: "#ffcc00" });
const modes = createSegmentedControl(host, {
  onChange(value) {
    instrument.setMode(value as InstrumentMode);
  },
});
const spring = createSpring({
  onUpdate(state) {
    host.style.opacity = String(state.value);
  },
});
instrument.setSeparation(80);
// @ts-expect-error Unknown layers should fail type checking.
instrument.selectLayer("unknown");
// @ts-expect-error Theme keys are part of the public typed contract.
applyTheme(host, { unknownToken: "red" });
spring.destroy();
instrument.destroy();
modes.destroy();
restore();

import { createTabs, createDialog, createMenu, createTooltip, createRange, createField, createDisclosure, createToastRegion, renderIcon } from "starkplane";
declare const nativeButton: HTMLButtonElement;
declare const nativeDialog: HTMLDialogElement;
declare const nativeInput: HTMLInputElement;
const tabs = createTabs(host, { activation: "manual", orientation: "vertical" });
const dialog = createDialog(nativeDialog, { initialFocus: host });
const menu = createMenu(nativeButton, host, { onSelect: value => console.log(value) });
const tooltip = createTooltip(nativeButton, host);
const range = createRange(nativeInput, { format: value => `${value}%` });
const field = createField(nativeInput, { error: host });
const disclosure = createDisclosure(nativeButton, host);
const feedback = createToastRegion(host);
renderIcon("warning");
// @ts-expect-error Activation modes are constrained.
createTabs(host, { activation: "unknown" });
// @ts-expect-error Native dialog is required.
createDialog(nativeButton);
// @ts-expect-error Unknown icons are rejected.
renderIcon("logo");
[tabs, dialog, menu, tooltip, range, field, disclosure, feedback].forEach(controller => controller.destroy());
