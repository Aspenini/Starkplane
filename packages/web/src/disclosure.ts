import { lifecycle, uniqueId, disabled } from "./lifecycle.js";
export interface DisclosureOptions { open?: boolean; onChange?: (open: boolean) => void; }
export interface DisclosureController { readonly open: boolean; setOpen(open: boolean): void; destroy(): void; }
/** Native button controls a content region. Compose multiple instances for an accordion. */
export function createDisclosure(trigger: HTMLButtonElement, panel: HTMLElement, options: DisclosureOptions = {}): DisclosureController {
  const life = lifecycle();
  let open = options.open ?? !panel.hidden;
  life.attr(trigger, "type", "button");
  life.attr(panel, "id", panel.id || uniqueId(panel, "ui-disclosure"));
  life.attr(trigger, "aria-controls", panel.id);
  const set = (next: boolean, notify = true) => {
    life.assert(); const changed = open !== next; open = next;
    if (!open && panel.contains(panel.ownerDocument.activeElement)) trigger.focus();
    life.attr(trigger, "aria-expanded", String(open)); life.attr(panel, "hidden", open ? null : "");
    if (notify && changed) options.onChange?.(open);
  };
  life.on(trigger, "click", () => { if (!disabled(trigger)) set(!open); });
  set(open, false);
  return { get open() { return open; }, setOpen: set, destroy: () => life.destroy() };
}
