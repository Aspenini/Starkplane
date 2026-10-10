import { lifecycle } from "./lifecycle.js";
export interface ToastController { show(message: string): void; clear(): void; destroy(): void; }
/** Persistent, polite live region. Messages persist until replaced or explicitly cleared. */
export function createToastRegion(region: HTMLElement): ToastController {
  const life = lifecycle(); const children = [...region.childNodes];
  life.add(() => region.replaceChildren(...children));
  life.attr(region, "role", "status"); life.attr(region, "aria-live", "polite"); life.attr(region, "aria-atomic", "true");
  return {
    show(message) { life.assert(); region.textContent = message; life.attr(region, "data-ui-visible", "true"); },
    clear() { life.assert(); region.textContent = ""; life.attr(region, "data-ui-visible", null); },
    destroy: () => life.destroy(),
  };
}
