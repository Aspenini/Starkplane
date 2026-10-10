import { lifecycle, uniqueId, floating } from "./lifecycle.js";
export interface TooltipController { readonly open: boolean; show(): void; hide(): void; destroy(): void; }
/** Text-only tooltip; keep essential information visible outside the tooltip too. */
export function createTooltip(trigger: HTMLElement, tooltip: HTMLElement): TooltipController {
  const life = lifecycle();
  let open = false, hovered = false, focused = false, dismissed = false;
  const position = floating(trigger, tooltip, life);
  life.attr(tooltip, "id", tooltip.id || uniqueId(tooltip, "ui-tooltip"));
  life.attr(tooltip, "role", "tooltip");
  life.attr(trigger, "aria-describedby", [...new Set([...(trigger.getAttribute("aria-describedby")?.split(/\s+/).filter(Boolean) ?? []), tooltip.id])].join(" "));
  const hide = () => { life.assert(); open = false; life.attr(tooltip, "hidden", ""); position(); };
  const show = () => { life.assert(); open = true; life.attr(tooltip, "hidden", null); position(); };
  const sync = () => { if (!hovered && !focused) dismissed = false; if ((hovered || focused) && !dismissed) show(); else hide(); };
  life.on(trigger, "pointerenter", () => { hovered = true; sync(); });
  life.on(trigger, "pointerleave", event => {
    hovered = tooltip.contains((event as PointerEvent).relatedTarget as Node | null); sync();
  });
  life.on(tooltip, "pointerenter", () => { hovered = true; sync(); });
  life.on(tooltip, "pointerleave", event => {
    hovered = trigger.contains((event as PointerEvent).relatedTarget as Node | null); sync();
  });
  life.on(trigger, "focus", () => { focused = true; sync(); });
  life.on(trigger, "blur", () => { focused = false; sync(); });
  life.on(trigger.ownerDocument, "keydown", event => {
    if ((event as KeyboardEvent).key === "Escape" && open) { dismissed = true; hide(); }
  });
  hide();
  return { get open() { return open; }, show, hide, destroy: () => life.destroy() };
}
