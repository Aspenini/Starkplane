import { test } from "bun:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as sass from "sass";
import {
  createSpring,
  stepSpring,
  designTokens,
  renderInstrumentSvg,
} from "../lib/index.js";

function clock() {
  let time = 0,
    next = 0;
  const callbacks = new Map();
  return {
    scheduler: {
      now: () => time,
      request: (fn) => {
        const id = ++next;
        callbacks.set(id, fn);
        return id;
      },
      cancel: (id) => callbacks.delete(id),
    },
    tick(milliseconds = 16) {
      time += milliseconds;
      const jobs = [...callbacks.values()];
      callbacks.clear();
      jobs.forEach((fn) => fn(time));
    },
    get pending() {
      return callbacks.size;
    },
  };
}

test("package entry imports on the server without DOM or window globals", () => {
  assert.equal(typeof globalThis.window, "undefined");
  assert.equal(designTokens.releaseStatus.subjectToChange, true);
  assert.match(renderInstrumentSvg(), /viewBox="0 0 400 480"/);
});

test("weighted and elastic presets both converge under slow frame delivery", () => {
  for (const config of Object.values(designTokens.motion.presets)) {
    let state = { value: 0, velocity: 0, target: 1 };
    for (let i = 0; i < 1200; i++)
      state = stepSpring(state, config, i % 8 === 0 ? 0.25 : 0.016);
    assert.ok(Math.abs(state.value - 1) < 0.001);
    assert.ok(Math.abs(state.velocity) < 0.001);
  }
});

test("a spring retargets, settles exactly, and calls onRest once", () => {
  const c = clock();
  let rests = 0;
  const spring = createSpring({
    scheduler: c.scheduler,
    onRest: () => rests++,
  });
  spring.to(1);
  for (let i = 0; i < 10; i++) c.tick();
  spring.to(-2);
  for (let i = 0; i < 400; i++) c.tick();
  assert.deepEqual(spring.state, { value: -2, velocity: 0, target: -2 });
  assert.equal(spring.running, false);
  assert.equal(rests, 1);
  spring.destroy();
});

test("stopping or destroying inside onUpdate does not schedule another frame", () => {
  for (const action of ["stop", "destroy"]) {
    const c = clock();
    let spring;
    spring = createSpring({
      scheduler: c.scheduler,
      onUpdate: () => spring[action](),
    });
    spring.to(1);
    c.tick();
    assert.equal(c.pending, 0);
    assert.equal(spring.running, false);
    spring.destroy();
  }
});

test("disabled motion jumps to the target and destruction rejects further mutation", () => {
  const c = clock(),
    spring = createSpring({ scheduler: c.scheduler, enabled: false });
  spring.to(42);
  assert.deepEqual(spring.state, { value: 42, velocity: 0, target: 42 });
  assert.equal(c.pending, 0);
  spring.destroy();
  assert.throws(() => spring.to(2), /destroyed/);
});

test("a reduced-motion preference change settles and destroys its subscription", () => {
  const c = clock(),
    listeners = new Set();
  let reduced = false;
  globalThis.window = {
    matchMedia: () => ({
      get matches() {
        return reduced;
      },
      addEventListener: (_, fn) => listeners.add(fn),
      removeEventListener: (_, fn) => listeners.delete(fn),
    }),
  };
  try {
    const spring = createSpring({ scheduler: c.scheduler });
    spring.to(10);
    c.tick();
    reduced = true;
    listeners.forEach((fn) => fn());
    assert.equal(spring.state.value, 10);
    assert.equal(c.pending, 0);
    spring.destroy();
    assert.equal(listeners.size, 0);
  } finally {
    delete globalThis.window;
  }
});

test("invalid spring input cannot poison the animation state", () => {
  assert.throws(() => createSpring({ mass: 0 }), RangeError);
  assert.throws(
    () =>
      stepSpring(
        { value: 0, target: 1, velocity: 0 },
        designTokens.motion.presets.precise,
        -1,
      ),
    RangeError,
  );
  const spring = createSpring({ enabled: false });
  assert.throws(() => spring.to(NaN), RangeError);
  assert.equal(spring.state.value, 0);
  spring.destroy();
});

test("instrument SVG IDs and gradient references are unique across instances", () => {
  const a = renderInstrumentSvg(),
    b = renderInstrumentSvg(),
    ids = (s) => [...s.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(ids(a).length > 2);
  assert.equal(
    ids(a).some((id) => ids(b).includes(id)),
    false,
  );
  assert.throws(() => renderInstrumentSvg('bad" onclick="oops'), TypeError);
});

test("Sass @use allows theme overrides without leaking global selectors", async () => {
  const result = sass.compileString(
    '@use "src/styles/index" as ui with ($theme: ("color-action": #ffcc00)); @include ui.styles;',
    { loadPaths: [process.cwd()] },
  ).css;
  assert.match(result, /--ui-color-action: #ffcc00/);
  assert.doesNotMatch(
    result,
    /(?:^|\n)(?:body|html|:root|button|input|nav|h1)\s*[{,]/,
  );
  const noCss = sass.compileString('@use "src/styles/index" as ui;', {
    loadPaths: [process.cwd()],
  }).css;
  assert.equal(noCss.trim(), "");
  const css = await readFile(
    new URL("../lib/style.css", import.meta.url),
    "utf8",
  );
  assert.match(css, /\.ui-instrument/);
});

test("package remains private and token output matches the public module", async () => {
  const metadata = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  const json = JSON.parse(
    await readFile(new URL("../lib/tokens.json", import.meta.url), "utf8"),
  );
  assert.equal(metadata.private, true);
  assert.equal(metadata.version, designTokens.version);
  assert.deepEqual(json, designTokens);
});

test("extreme damping remains finite and numerically unsupported ratios are rejected", () => {
  assert.throws(() => createSpring({ mass: 1e-12 }), RangeError);
  let state = { value: 0, velocity: 0, target: 1 };
  for (let i = 0; i < 1000; i++) state = stepSpring(state, { mass: 1, stiffness: 10000, damping: 10000 }, 0.1);
  assert.ok(Number.isFinite(state.value)); assert.ok(Math.abs(state.value - 1) < 0.001);
});

test("unknown Sass theme tokens fail before generating misleading CSS", () => {
  assert.throws(() => sass.compileString('@use "src/styles/index" as ui with ($theme: ("color-typo": red)); @include ui.styles;', { loadPaths: [process.cwd()] }), /Unknown interface token/);
});
