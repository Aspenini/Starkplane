import { lifecycle, eventElement, disabled } from "./lifecycle.js";
export interface DialogOptions { initialFocus?: HTMLElement; onChange?: (open: boolean) => void; }
export interface DialogController { readonly open: boolean; show(): void; close(returnValue?: string): void; destroy(): void; }
/** Native dialog supplies modal focus containment and inertness; caller provides its label. */
export function createDialog(dialog: HTMLDialogElement, options: DialogOptions = {}): DialogController {
  if (dialog.open) throw new Error("Initialize the controller with a closed dialog.");
  if (!dialog.hasAttribute("aria-label") && !dialog.hasAttribute("aria-labelledby"))
    throw new Error("A dialog requires aria-label or aria-labelledby.");
  if (options.initialFocus && !dialog.contains(options.initialFocus)) throw new Error("Initial focus must be inside the dialog.");
  const life = lifecycle();
  let opener: HTMLElement | null = null;
  let visible = false;
  life.attr(dialog, "tabindex", dialog.getAttribute("tabindex") ?? "-1");
  const finish = () => {
    if (!visible) return;
    visible = false;
    if (opener?.isConnected) opener.focus();
    options.onChange?.(false);
  };
  const close = (returnValue = "") => {
    life.assert(); if (!dialog.open) return;
    dialog.close(returnValue); finish();
  };
  life.on(dialog, "close", () => { if (!dialog.open) finish(); });
  life.on(dialog, "click", event => {
    const target = eventElement(event)?.closest("[data-ui-close]");
    if (target && dialog.contains(target)) { event.preventDefault(); close(); }
  });
  life.on(dialog, "keydown", event => {
    const keyboard = event as KeyboardEvent;
    if (keyboard.key !== "Tab" || keyboard.ctrlKey || keyboard.altKey || keyboard.metaKey || !dialog.open) return;
    const candidates = [...dialog.querySelectorAll<HTMLElement>('button, a[href], input:not([type="hidden"]), select, textarea, summary, [tabindex], [contenteditable="true"]')];
    const available = candidates.filter(node => {
      if (node.tabIndex < 0 || disabled(node) || node.closest("[hidden],[inert]") || !node.getClientRects().length) return false;
      const style = dialog.ownerDocument.defaultView?.getComputedStyle(node);
      if (style?.visibility === "hidden" || style?.visibility === "collapse") return false;
      if (node.matches('input[type="radio"]') && (node as HTMLInputElement).name) {
        const radio = node as HTMLInputElement;
        const group = candidates.filter(other => other.matches('input[type="radio"]') && (other as HTMLInputElement).name === radio.name && (other as HTMLInputElement).form === radio.form && !disabled(other));
        return (group.find(other => (other as HTMLInputElement).checked) ?? group[0]) === node;
      }
      return true;
    }).sort((a, b) => (a.tabIndex > 0 ? a.tabIndex : Infinity) - (b.tabIndex > 0 ? b.tabIndex : Infinity));
    const first = available[0], last = available.at(-1), active = dialog.ownerDocument.activeElement;
    if (!first || !last) { keyboard.preventDefault(); dialog.focus(); return; }
    if (keyboard.shiftKey && (active === first || active === dialog)) { keyboard.preventDefault(); last.focus(); }
    else if (!keyboard.shiftKey && (active === last || active === dialog)) { keyboard.preventDefault(); first.focus(); }
  });
  return {
    get open() { return dialog.open; },
    show() {
      life.assert(); if (dialog.open) return;
      opener = dialog.ownerDocument.activeElement as HTMLElement | null;
      dialog.showModal(); visible = true;
      options.initialFocus?.focus(); options.onChange?.(true);
    },
    close,
    destroy() { if (life.destroyed) return; close(); life.destroy(); },
  };
}
