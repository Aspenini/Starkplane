import { lifecycle, eventElement, disabled } from "./lifecycle.js";
export interface SegmentedOptions {
  value?: string;
  orientation?: "horizontal" | "vertical";
  onChange?: (value: string) => void;
}
export interface SegmentedController {
  readonly value: string;
  setValue(value: string): void;
  /** Clear selection for a custom value; the first enabled option stays keyboard reachable. */
  clear(): void;
  destroy(): void;
}
/** Exclusive native toggle buttons, with a labelled group and roving keyboard focus. */
export function createSegmentedControl(root: HTMLElement, options: SegmentedOptions = {}): SegmentedController {
  if (!["horizontal", "vertical"].includes(options.orientation ?? "horizontal")) throw new RangeError("Unknown segmented orientation.");
  const buttons = [...root.querySelectorAll<HTMLButtonElement>("button[data-ui-value]")];
  const values = buttons.map(button => button.dataset.uiValue!);
  if (!buttons.length || values.some(value => !value) || new Set(values).size !== values.length)
    throw new Error("Segment values must be unique and nonempty.");
  let value = options.value ?? buttons.find(button => !disabled(button))?.dataset.uiValue ?? "";
  if (value && !buttons.some(button => button.dataset.uiValue === value && !disabled(button)))
    throw new RangeError(`Unavailable segment: ${value}`);
  const life = lifecycle();
  life.attr(root, "role", "group");
  for (const button of buttons) {
    life.attr(button, "type", "button");
    const active = button.classList.contains("is-active"), hadClass = button.hasAttribute("class");
    life.add(() => { button.classList.toggle("is-active", active); if (!hadClass && !button.classList.length) button.removeAttribute("class"); });
  }
  const paint = () => {
    const selected = buttons.find(button => button.dataset.uiValue === value);
    const tabstop = selected && !disabled(selected) ? selected : buttons.find(button => !disabled(button));
    buttons.forEach(button => {
      life.attr(button, "aria-pressed", String(button === selected));
      life.attr(button, "tabindex", button === tabstop ? "0" : "-1");
      button.classList.toggle("is-active", button === selected);
    });
  };
  const set = (next: string) => {
    life.assert();
    if (!buttons.some(button => button.dataset.uiValue === next && !disabled(button)))
      throw new RangeError(`Unavailable segment: ${next}`);
    const changed = value !== next; value = next; paint();
    if (changed) options.onChange?.(value);
  };
  life.on(root, "click", event => {
    const button = eventElement(event)?.closest<HTMLButtonElement>("button[data-ui-value]");
    if (button && buttons.includes(button) && !disabled(button)) set(button.dataset.uiValue!);
  });
  life.on(root, "keydown", event => {
    const key = (event as KeyboardEvent).key;
    const vertical = options.orientation === "vertical";
    const forward = vertical ? "ArrowDown" : "ArrowRight", backward = vertical ? "ArrowUp" : "ArrowLeft";
    if (![forward, backward, "Home", "End"].includes(key)) return;
    const available = buttons.filter(button => !disabled(button));
    const index = available.findIndex(button => button === event.target);
    if (index < 0) return;
    event.preventDefault();
    const rtl = !vertical && root.ownerDocument.defaultView?.getComputedStyle(root).direction === "rtl";
    const delta = (key === forward ? 1 : -1) * (rtl ? -1 : 1);
    const next = key === "Home" ? available[0]! : key === "End" ? available.at(-1)! : available[(index + delta + available.length) % available.length]!;
    set(next.dataset.uiValue!); if (!life.destroyed) next.focus();
  });
  paint();
  return {
    get value() { return value; }, setValue: set,
    clear() { life.assert(); value = ""; paint(); },
    destroy: () => life.destroy(),
  };
}
