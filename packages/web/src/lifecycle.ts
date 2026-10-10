/** Internal bookkeeping for controllers; never reads browser globals on import. */
export function lifecycle() {
  let destroyed = false;
  const cleanups: (() => void)[] = [];
  const saved = new WeakMap<Element, Set<string>>();
  return {
    get destroyed() { return destroyed; },
    assert() { if (destroyed) throw new Error("This controller has been destroyed."); },
    add(cleanup: () => void) { cleanups.push(cleanup); },
    attr(node: Element, key: string, value: string | null) {
      let keys = saved.get(node);
      if (!keys) { keys = new Set(); saved.set(node, keys); }
      if (!keys.has(key)) {
        keys.add(key);
        const original = node.getAttribute(key);
        cleanups.push(() => original === null ? node.removeAttribute(key) : node.setAttribute(key, original));
      }
      if (value === null) node.removeAttribute(key); else node.setAttribute(key, value);
    },
    on(node: EventTarget, event: string, listener: EventListener) {
      node.addEventListener(event, listener);
      cleanups.push(() => node.removeEventListener(event, listener));
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const cleanup of cleanups.reverse()) cleanup();
    },
  };
}
let nextId = 0;
export function uniqueId(node: Element, prefix: string): string {
  let id: string;
  do { id = `${prefix}-${++nextId}`; } while (node.ownerDocument.getElementById(id));
  return id;
}
export function eventElement(event: Event): Element | null {
  const node = event.target as Element | null;
  return node && typeof node.closest === "function" ? node : null;
}
export function disabled(node: HTMLElement): boolean {
  return node.matches(":disabled") || node.getAttribute("aria-disabled") === "true" || !!node.closest("[inert]");
}

/** Keep a floating surface inside the visual viewport without a runtime dependency. */
export function floating(trigger: HTMLElement, surface: HTMLElement, life: ReturnType<typeof lifecycle>) {
  const nativePopover = typeof surface.showPopover === "function" && typeof surface.hidePopover === "function";
  let shown = false;
  if (nativePopover) {
    if (surface.matches(":popover-open")) throw new Error("Initialize floating surfaces while closed.");
    life.attr(surface, "popover", "manual");
    life.add(() => { if (shown) surface.hidePopover(); });
  }
  const properties = ["left", "top", "max-height", "overflow-y", "max-width", "min-width", "width"];
  const originalStyle = surface.hasAttribute("style");
  const original = properties.map(key => [key, surface.style.getPropertyValue(key), surface.style.getPropertyPriority(key)] as const);
  life.add(() => {
    for (const [key, value, priority] of original) {
      if (value) surface.style.setProperty(key, value, priority); else surface.style.removeProperty(key);
    }
    if (!originalStyle && !surface.style.length) surface.removeAttribute("style");
  });
  const update = () => {
    if (surface.hidden) {
      if (nativePopover && shown) { surface.hidePopover(); shown = false; }
      return;
    }
    if (nativePopover && !shown && surface.isConnected) { surface.showPopover(); shown = true; }
    const view = trigger.ownerDocument.defaultView;
    if (!view) return;
    const viewport = view.visualViewport;
    const width = viewport?.width ?? view.innerWidth;
    const height = viewport?.height ?? view.innerHeight;
    const ox = viewport?.offsetLeft ?? 0, oy = viewport?.offsetTop ?? 0;
    surface.style.maxHeight = `${Math.max(44, height - 16)}px`;
    surface.style.maxWidth = `${Math.max(0, Math.min(surface.getAttribute("role") === "tooltip" ? 260 : width, width - 16))}px`;
    surface.style.minWidth = `${surface.getAttribute("role") === "menu" ? Math.max(0, Math.min(200, width - 16)) : 0}px`;
    surface.style.width = "max-content";
    surface.style.overflowY = "auto";
    const rect = trigger.getBoundingClientRect(), box = surface.getBoundingClientRect();
    const rtl = view.getComputedStyle(trigger).direction === "rtl";
    const preferredX = rtl ? rect.right - box.width : rect.left;
    const x = Math.max(ox + 8, Math.min(preferredX, ox + width - box.width - 8));
    const below = rect.bottom;
    const above = rect.top - box.height;
    const y = Math.max(oy + 8, Math.min(below + box.height <= oy + height - 8 ? below : above, oy + height - box.height - 8));
    surface.style.left = `${x}px`; surface.style.top = `${y}px`;
  };
  const view = trigger.ownerDocument.defaultView;
  if (view) {
    life.on(view, "resize", update);
    // One capturing listener observes document and nested scroll containers.
    trigger.ownerDocument.addEventListener("scroll", update, true);
    life.add(() => trigger.ownerDocument.removeEventListener("scroll", update, true));
    if (view.visualViewport) { life.on(view.visualViewport, "resize", update); life.on(view.visualViewport, "scroll", update); }
  }
  return update;
}
