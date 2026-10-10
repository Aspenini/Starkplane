import { lifecycle, uniqueId } from "./lifecycle.js";
export type FieldInput = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
export interface FieldOptions { error: HTMLElement; validate?: (input: FieldInput) => string | null; }
export interface FieldController { validate(): boolean; clear(): void; destroy(): void; }
/** Inline native constraint validation; caller supplies a visible label and error element. */
export function createField(input: FieldInput, options: FieldOptions): FieldController {
  const life = lifecycle(); let touched = false;
  const children = [...options.error.childNodes]; life.add(() => options.error.replaceChildren(...children));
  life.attr(options.error, "id", options.error.id || uniqueId(options.error, "ui-error"));
  const description = input.getAttribute("aria-describedby") ?? "";
  const clear = () => {
    life.assert(); touched = false;
    life.attr(input, "aria-invalid", null);
    life.attr(input, "aria-describedby", description || null);
    life.attr(options.error, "hidden", ""); options.error.textContent = "";
  };
  const validate = () => {
    life.assert(); touched = true;
    const message = input.disabled ? null : !input.validity.valid ? input.validationMessage : options.validate?.(input) ?? null;
    life.attr(input, "aria-invalid", String(!!message));
    life.attr(input, "aria-describedby", message ? [...new Set([...description.split(/\s+/).filter(Boolean), options.error.id])].join(" ") : description || null);
    options.error.textContent = message ?? ""; life.attr(options.error, "hidden", message ? null : "");
    return !message;
  };
  life.on(input, "blur", validate);
  life.on(input, "invalid", validate);
  life.on(input, "input", () => { if (touched) validate(); });
  life.on(input, "change", () => { if (touched) validate(); });
  if (input.form) life.on(input.form, "reset", () => { queueMicrotask(() => { if (!life.destroyed) clear(); }); });
  clear();
  return { validate, clear, destroy: () => life.destroy() };
}
