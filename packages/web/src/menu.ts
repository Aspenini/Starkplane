import { lifecycle, uniqueId, eventElement, disabled, floating } from "./lifecycle.js";
export interface MenuOptions { onSelect?: (value: string) => void; }
export interface MenuController { readonly open: boolean; show(last?: boolean): void; close(): void; destroy(): void; }
/** Single-level command menu: button[data-ui-menu-value] items, no embedded form controls. */
export function createMenu(trigger: HTMLButtonElement, menu: HTMLElement, options: MenuOptions = {}): MenuController {
  const items = [...menu.querySelectorAll<HTMLButtonElement>("button[data-ui-menu-value]")];
  if (!items.length) throw new Error("A menu requires command buttons.");
  const values = items.map(item => item.dataset.uiMenuValue!);
  if (values.some(value => !value) || new Set(values).size !== values.length) throw new Error("Menu values must be unique and nonempty.");
  const life = lifecycle();
  let open = false, search = "", searchTime = 0;
  const position = floating(trigger, menu, life);
  life.attr(trigger, "type", "button");
  life.attr(menu, "id", menu.id || uniqueId(menu, "ui-menu"));
  life.attr(trigger, "id", trigger.id || uniqueId(trigger, "ui-menu-trigger"));
  life.attr(trigger, "aria-haspopup", "menu"); life.attr(trigger, "aria-controls", menu.id);
  life.attr(menu, "role", "menu"); life.attr(menu, "aria-labelledby", trigger.id);
  items.forEach(item => { life.attr(item, "type", "button"); life.attr(item, "role", "menuitem"); life.attr(item, "tabindex", "-1"); });
  const close = (restore = true) => {
    life.assert(); open = false;
    life.attr(menu, "hidden", ""); life.attr(trigger, "aria-expanded", "false");
    position();
    if (restore && trigger.isConnected) trigger.focus();
  };
  const show = (last = false) => {
    life.assert(); if (disabled(trigger)) return;
    const available = items.filter(item => !disabled(item));
    if (!available.length) return;
    open = true; search = "";
    life.attr(menu, "hidden", null); life.attr(trigger, "aria-expanded", "true");
    position();
    (last ? available.at(-1)! : available[0]!).focus();
  };
  close(false);
  life.on(trigger, "click", () => open ? close() : show());
  life.on(trigger, "keydown", event => {
    const key = (event as KeyboardEvent).key;
    if (key === "ArrowDown" || key === "ArrowUp") { event.preventDefault(); show(key === "ArrowUp"); }
  });
  life.on(menu, "keydown", event => {
    const key = (event as KeyboardEvent).key;
    const available = items.filter(item => !disabled(item));
    if (key === "Escape") { event.preventDefault(); close(); return; }
    if (key === "Tab") { close(); return; }
    const index = available.findIndex(item => item === event.target);
    if (index < 0) return;
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(key)) {
      event.preventDefault();
      const next = key === "Home" ? available[0]! : key === "End" ? available.at(-1)! : available[(index + (key === "ArrowDown" ? 1 : -1) + available.length) % available.length]!;
      next.focus();
    } else if (key.length === 1 && key !== " " && !(event as KeyboardEvent).ctrlKey && !(event as KeyboardEvent).metaKey && !(event as KeyboardEvent).altKey) {
      const now = Date.now(); search = now - searchTime > 700 ? key : search + key; searchTime = now;
      const query = /^(.)(\1)*$/.test(search) ? key.toLowerCase() : search.toLowerCase();
      const ordered = [...available.slice(index + 1), ...available.slice(0, index + 1)];
      ordered.find(item => item.textContent?.trim().toLowerCase().startsWith(query))?.focus();
    }
  });
  life.on(menu, "click", event => {
    const item = eventElement(event)?.closest<HTMLButtonElement>("button[data-ui-menu-value]");
    if (item && items.includes(item) && !disabled(item)) {
      close(); options.onSelect?.(item.dataset.uiMenuValue!);
    }
  });
  life.on(trigger.ownerDocument, "pointerdown", event => {
    const target = event.target as Node | null;
    if (open && target && !menu.contains(target) && !trigger.contains(target)) close(false);
  });
  life.on(trigger.ownerDocument, "focusin", event => {
    const target = event.target as Node | null;
    if (open && target && !menu.contains(target) && !trigger.contains(target)) close(false);
  });
  return { get open() { return open; }, show, close: () => close(), destroy() { if (life.destroyed) return; if (open) close(); life.destroy(); } };
}
