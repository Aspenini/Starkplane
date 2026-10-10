export function $<E extends Element = HTMLElement>(selector: string): E {
  const element = document.querySelector<E>(selector);
  if (!element) throw new Error(`Demo element missing: ${selector}`);
  return element;
}
export function $$<E extends Element = HTMLElement>(selector: string): E[] {
  return [...document.querySelectorAll<E>(selector)];
}
