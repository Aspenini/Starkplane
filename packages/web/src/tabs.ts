import { lifecycle, uniqueId, eventElement, disabled } from "./lifecycle.js";
export interface TabsOptions {
  value?: string;
  activation?: "automatic" | "manual";
  orientation?: "horizontal" | "vertical";
  onChange?: (value: string) => void;
}
export interface TabsController {
  readonly value: string;
  setValue(value: string): void;
  destroy(): void;
}
/** One labelled [data-ui-tablist], buttons[data-ui-tab], and panels[data-ui-panel]. */
export function createTabs(root: HTMLElement, options: TabsOptions = {}): TabsController {
  if (!["horizontal", "vertical"].includes(options.orientation ?? "horizontal") || !["automatic", "manual"].includes(options.activation ?? "automatic"))
    throw new RangeError("Unknown tab orientation or activation mode.");
  const list = root.querySelector<HTMLElement>("[data-ui-tablist]");
  if (!list) throw new Error("Tabs require a data-ui-tablist.");
  const tabs = [...list.querySelectorAll<HTMLButtonElement>("button[data-ui-tab]")];
  const panels = [...root.querySelectorAll<HTMLElement>("[data-ui-panel]")];
  const values = tabs.map(tab => tab.dataset.uiTab!);
  if (!tabs.length || values.some(value => !value) || new Set(values).size !== values.length || panels.length !== tabs.length ||
      values.some(value => panels.filter(panel => panel.dataset.uiPanel === value).length !== 1))
    throw new Error("Tabs require unique, nonempty values and one matching panel per tab.");
  let value = options.value ?? tabs.find(tab => !disabled(tab))?.dataset.uiTab ?? "";
  if (!tabs.some(tab => tab.dataset.uiTab === value && !disabled(tab)))
    throw new RangeError(`Unavailable tab: ${value}`);
  const life = lifecycle();
  const orientation = options.orientation ?? "horizontal";
  life.attr(list, "role", "tablist"); life.attr(list, "aria-orientation", orientation);
  tabs.forEach(tab => {
    life.attr(tab, "type", "button");
    const panel = panels.find(panel => panel.dataset.uiPanel === tab.dataset.uiTab)!;
    life.attr(tab, "role", "tab");
    life.attr(tab, "id", tab.id || uniqueId(tab, "ui-tab"));
    life.attr(panel, "id", panel.id || uniqueId(panel, "ui-panel"));
    life.attr(tab, "aria-controls", panel.id);
    life.attr(panel, "role", "tabpanel"); life.attr(panel, "aria-labelledby", tab.id);
    life.attr(panel, "tabindex", "0");
  });
  const set = (next: string, notify = true) => {
    life.assert();
    const selected = tabs.find(tab => tab.dataset.uiTab === next);
    if (!selected || disabled(selected)) throw new RangeError(`Unavailable tab: ${next}`);
    const changed = value !== next; value = next;
    tabs.forEach(tab => {
      life.attr(tab, "aria-selected", String(tab === selected));
      life.attr(tab, "tabindex", tab === selected ? "0" : "-1");
    });
    panels.forEach(panel => life.attr(panel, "hidden", panel.dataset.uiPanel === value ? null : ""));
    if (notify && changed) options.onChange?.(value);
  };
  life.on(list, "click", event => {
    const tab = eventElement(event)?.closest<HTMLButtonElement>("button[data-ui-tab]");
    if (tab && tabs.includes(tab) && !disabled(tab)) set(tab.dataset.uiTab!);
  });
  life.on(list, "keydown", event => {
    const key = (event as KeyboardEvent).key;
    const available = tabs.filter(tab => !disabled(tab));
    const index = available.findIndex(tab => tab === event.target);
    if (index < 0) return;
    const forward = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
    const backward = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
    if (![forward, backward, "Home", "End", "Enter", " "].includes(key)) return;
    event.preventDefault();
    if (key === "Enter" || key === " ") { set(available[index]!.dataset.uiTab!); return; }
    const rtl = orientation === "horizontal" && root.ownerDocument.defaultView?.getComputedStyle(list).direction === "rtl";
    const delta = (key === forward ? 1 : -1) * (rtl ? -1 : 1);
    const next = key === "Home" ? available[0]! : key === "End" ? available.at(-1)! : available[(index + delta + available.length) % available.length]!;
    tabs.forEach(tab => life.attr(tab, "tabindex", tab === next ? "0" : "-1"));
    next.focus();
    if (!life.destroyed && options.activation !== "manual") set(next.dataset.uiTab!);
  });
  life.on(list, "focusin", event => {
    const tab = event.target as HTMLButtonElement;
    if (options.activation !== "manual" && tabs.includes(tab) && !disabled(tab)) set(tab.dataset.uiTab!);
  });
  life.on(list, "focusout", event => {
    if (list.contains((event as FocusEvent).relatedTarget as Node | null)) return;
    tabs.forEach(tab => life.attr(tab, "tabindex", tab.dataset.uiTab === value ? "0" : "-1"));
  });
  set(value, false);
  return { get value() { return value; }, setValue: set, destroy: () => life.destroy() };
}
