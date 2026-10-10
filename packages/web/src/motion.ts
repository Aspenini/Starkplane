import { designTokens } from "./tokens.js";
export interface SpringConfig {
  mass: number;
  stiffness: number;
  damping: number;
}
export interface SpringState {
  value: number;
  velocity: number;
  target: number;
}
export interface FrameScheduler {
  request(callback: (time: number) => void): number;
  cancel(id: number): void;
  now(): number;
}
export interface SpringOptions extends Partial<SpringConfig> {
  initial?: number;
  enabled?: boolean;
  /** Respect the OS preference by default; false is available for nonvisual simulations. */
  respectReducedMotion?: boolean;
  onUpdate?: (state: Readonly<SpringState>) => void;
  onRest?: (state: Readonly<SpringState>) => void;
  scheduler?: FrameScheduler;
}
export interface SpringController {
  readonly state: Readonly<SpringState>;
  readonly running: boolean;
  to(value: number): void;
  jump(value: number): void;
  configure(config: Partial<SpringConfig>): void;
  setEnabled(enabled: boolean): void;
  stop(): void;
  destroy(): void;
}
export function validateSpring(config: SpringConfig): void {
  if (
    !Number.isFinite(config.mass) ||
    config.mass <= 0 ||
    !Number.isFinite(config.stiffness) ||
    config.stiffness <= 0 ||
    !Number.isFinite(config.damping) ||
    config.damping < 0
  )
    throw new RangeError(
      "Mass and stiffness must be positive; damping must be nonnegative. All values must be finite.",
    );
  if (config.stiffness / config.mass > 1e6 || config.damping / config.mass > 1e4)
    throw new RangeError("Supported stiffness/mass is at most 1e6; damping/mass is at most 1e4.");
}
function finite(value: number): number {
  if (!Number.isFinite(value))
    throw new RangeError("Spring values must be finite.");
  return value;
}

/** Semi-implicit integration with bounded substeps to remain stable across slow frames. */
export function stepSpring(
  state: Readonly<SpringState>,
  config: SpringConfig,
  seconds: number,
): SpringState {
  validateSpring(config);
  finite(state.value);
  finite(state.velocity);
  finite(state.target);
  finite(seconds);
  if (seconds < 0) throw new RangeError("Time cannot be negative.");
  const dt = Math.min(seconds, 0.04),
    limit = Math.min(0.004, 0.5 / Math.sqrt(config.stiffness / config.mass), config.damping > 0 ? 0.5 * config.mass / config.damping : 0.004),
    steps = Math.max(1, Math.ceil(dt / limit)),
    h = dt / steps;
  let value = state.value,
    velocity = state.velocity;
  for (let i = 0; i < steps; i++) {
    velocity +=
      ((-config.stiffness * (value - state.target) -
        config.damping * velocity) /
        config.mass) *
      h;
    value += velocity * h;
    finite(value); finite(velocity);
  }
  return { value, velocity, target: state.target };
}

/** No DOM or browser globals are touched until this function is called. */
export function createSpring(options: SpringOptions = {}): SpringController {
  let config = {
    mass: options.mass ?? designTokens.motion.presets.precise.mass,
    stiffness: options.stiffness ?? designTokens.motion.presets.precise.stiffness,
    damping: options.damping ?? designTokens.motion.presets.precise.damping,
  };
  validateSpring(config);
  let state: SpringState = {
    value: finite(options.initial ?? 0),
    velocity: 0,
    target: options.initial ?? 0,
  };
  const scheduler = options.scheduler ?? {
    request: (fn: (time: number) => void) => requestAnimationFrame(fn),
    cancel: (id: number) => cancelAnimationFrame(id),
    now: () => performance.now(),
  };
  const media =
    options.respectReducedMotion !== false &&
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
  let frame: number | null = null,
    enabled = options.enabled ?? true,
    destroyed = false,
    last = 0,
    elapsed = 0,
    epoch = 0;
  const assertLive = () => {
    if (destroyed) throw new Error("This spring has been destroyed.");
  };
  const notify = () => options.onUpdate?.({ ...state });
  const cancel = () => {
    epoch++;
    if (frame !== null) scheduler.cancel(frame);
    frame = null;
  };
  const settle = () => {
    cancel();
    const generation = epoch;
    state = { value: state.target, velocity: 0, target: state.target };
    notify();
    if (!destroyed && epoch === generation) options.onRest?.({ ...state });
  };
  const animate = (time: number, generation: number) => {
    if (destroyed || generation !== epoch) return;
    frame = null;
    const dt = Math.max(0, (time - last) / 1000);
    last = time;
    elapsed += Math.min(dt, 0.04);
    state = stepSpring(state, config, dt);
    notify();
    // A callback may stop or destroy the controller.
    if (destroyed || generation !== epoch || !enabled) return;
    if (
      (Math.abs(state.value - state.target) < 0.0005 &&
        Math.abs(state.velocity) < 0.005) ||
      elapsed >= 20
    )
      settle();
    else schedule();
  };
  const schedule = () => {
    const generation = epoch;
    frame = scheduler.request((time) => animate(time, generation));
  };
  const onPreference = () => {
    if (media?.matches) settle();
  };
  media?.addEventListener("change", onPreference);
  return {
    get state() {
      return { ...state };
    },
    get running() {
      return frame !== null;
    },
    to(value) {
      assertLive();
      state.target = finite(value);
      cancel();
      elapsed = 0;
      if (!enabled || media?.matches) {
        settle();
        return;
      }
      last = scheduler.now();
      schedule();
    },
    jump(value) {
      assertLive();
      finite(value);
      cancel();
      state = { value, velocity: 0, target: value };
      notify();
    },
    configure(next) {
      assertLive();
      const merged = { ...config, ...next };
      validateSpring(merged);
      config = merged;
    },
    setEnabled(next) {
      assertLive();
      if (enabled === next) return;
      enabled = next;
      if (!enabled) settle();
    },
    stop() {
      assertLive();
      cancel();
      state = { ...state, target: state.value, velocity: 0 };
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancel();
      media?.removeEventListener("change", onPreference);
    },
  };
}
