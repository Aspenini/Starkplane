/** Every public token and API remains provisional until v1.0.0. */
export const designTokens = {
  name: "Starkplane",
  version: "0.1.0",
  releaseStatus: {
    status: "provisional",
    subjectToChange: true,
    stableFrom: "1.0.0",
    scope: "all",
    notice: "Everything is subject to change until v1.0.0.",
  },
  color: {
    foundation: "#111314",
    surface: "#191c1e",
    raised: "#232729",
    recess: "#0d0f10",
    seam: "#303537",
    content: "#eceee9",
    secondary: "#8c9599",
    action: "#d6ef79",
    schematic: "#76def2",
    attention: "#dfa86c",
    error: "#f29b88",
    boundary: "#718086",
  },
  geometry: {
    spacingUnit: "8px",
    seamWidth: "1px",
    actionChamfer: "8px",
    cornerRadius: "0px",
  },
  spacing: { half: "4px", unit: "8px", compact: "12px", control: "16px", panel: "24px", section: "32px", wide: "48px", major: "64px" },
  size: { target: "44px", icon: "20px", switchWidth: "44px", switchHeight: "28px", switchThumb: "18px", container: "1200px", dialog: "560px" },
  focus: { width: "2px", offset: "3px" },
  typeScale: { caption: "11px", label: "12px", body: "14px", lead: "16px", title: "20px", heading: "28px", display: "40px" },
  lineHeight: { tight: "1.2", body: "1.6" },
  layer: { base: "0", floating: "20", toast: "40" },
  material: { highlight: "rgb(255 255 255 / 4%)", shadow: "rgb(0 0 0 / 24%)", scrim: "rgb(0 0 0 / 72%)", schematicFill: "rgb(118 222 242 / 9%)" },
  typography: {
    display: '"Space Grotesk", Arial, sans-serif',
    instrument: '"IBM Plex Mono", monospace',
  },
  motion: {
    model: "mass-spring-damper",
    duration: { feedback: "160ms", state: "240ms" },
    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    presets: {
      instrument: { mass: 1, stiffness: 140, damping: 23 },
      precise: { mass: 1, stiffness: 180, damping: 24 },
      weighted: { mass: 3, stiffness: 120, damping: 34 },
      elastic: { mass: 0.8, stiffness: 220, damping: 9 },
    },
  },
} as const;

export type ThemeColors = { [K in keyof typeof designTokens.color]?: string };

/** Apply an instance theme; the returned cleanup restores its previous inline values. */
export function applyTheme(
  element: HTMLElement,
  colors: ThemeColors,
): () => void {
  const previous = new Map<string, { value: string; priority: string }>();
  for (const [key, value] of Object.entries(colors)) {
    if (!Object.hasOwn(designTokens.color, key) || (typeof value !== "string" || !value.trim()))
      throw new TypeError(`Invalid theme color: ${key}`);
    if (element.ownerDocument.defaultView?.CSS?.supports && !element.ownerDocument.defaultView.CSS.supports("color", value))
      throw new TypeError(`Invalid CSS color for ${key}`);
  }
  for (const [key, value] of Object.entries(colors)) {
    const property = `--ui-color-${key}`;
    previous.set(property, {
      value: element.style.getPropertyValue(property),
      priority: element.style.getPropertyPriority(property),
    });
    element.style.setProperty(property, value);
  }
  return () => {
    for (const [property, old] of previous) {
      if (old.value)
        element.style.setProperty(property, old.value, old.priority);
      else element.style.removeProperty(property);
    }
  };
}
