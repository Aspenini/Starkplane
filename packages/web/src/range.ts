import { lifecycle } from "./lifecycle.js";
export interface RangeOptions { output?: HTMLOutputElement; format?: (value: number) => string; onChange?: (value: number) => void; }
export interface RangeController { readonly value: number; setValue(value: number): void; refresh(): void; destroy(): void; }
/** Native range retains keyboard, form, min/max/step semantics. */
export function createRange(input: HTMLInputElement, options: RangeOptions = {}): RangeController {
  if (input.type !== "range") throw new TypeError("createRange requires input[type=range].");
  const life = lifecycle();
  const originalStyle = input.style.getPropertyValue("--ui-range-fill"), priority = input.style.getPropertyPriority("--ui-range-fill");
  const text = options.output?.textContent ?? "";
  life.add(() => {
    if (originalStyle) input.style.setProperty("--ui-range-fill", originalStyle, priority); else input.style.removeProperty("--ui-range-fill");
    if (options.output) options.output.textContent = text;
  });
  if (options.output) life.attr(options.output, "for", [...new Set([...((options.output.getAttribute("for") ?? "").split(/\s+/).filter(Boolean)), input.id].filter(Boolean))].join(" "));
  const refresh = () => {
    life.assert();
    const min = input.min === "" ? 0 : Number(input.min), max = input.max === "" ? 100 : Number(input.max);
    const value = input.valueAsNumber;
    input.style.setProperty("--ui-range-fill", `${max > min ? Math.min(100, Math.max(0, (value - min) / (max - min) * 100)) : 0}%`);
    const formatted = options.format?.(value) ?? String(value);
    if (options.format) life.attr(input, "aria-valuetext", formatted);
    if (options.output) options.output.textContent = formatted;
  };
  life.on(input, "input", () => { refresh(); options.onChange?.(input.valueAsNumber); });
  if (input.form) life.on(input.form, "reset", () => { queueMicrotask(() => { if (!life.destroyed) refresh(); }); });
  refresh();
  return { get value() { return input.valueAsNumber; }, setValue(value) { life.assert(); if (!Number.isFinite(value)) throw new RangeError("Range value must be finite."); input.value = String(value); refresh(); }, refresh, destroy: () => life.destroy() };
}
