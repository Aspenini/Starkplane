const paths = {
  "arrow-right": "M4 10h12M11 5l5 5-5 5",
  "chevron-down": "M4 7l6 6 6-6",
  "check": "M3 10l4 4L17 4",
  "close": "M4 4l12 12M16 4L4 16",
  "plus": "M10 3v14M3 10h14",
  "minus": "M3 10h14",
  "menu": "M3 5h14M3 10h14M3 15h14",
  "search": "M14 14l4 4M15 9a6 6 0 1 1-12 0 6 6 0 0 1 12 0",
  "info": "M10 9v5M10 6v1M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  "warning": "M10 2l9 16H1ZM10 7v5M10 14v1",
} as const;
export type IconName = keyof typeof paths;
/** Decorative icons inherit currentColor. Label the containing button or link. */
export function renderIcon(name: IconName): string {
  if (!Object.hasOwn(paths, name)) throw new RangeError(`Unknown icon: ${name}`);
  return `<svg class="ui-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"><path d="${paths[name]}"/></svg>`;
}
