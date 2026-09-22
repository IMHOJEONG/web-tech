import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const article = readFileSync(
  new URL("../../../apps/docs/data/canvas/readme.md", import.meta.url),
  "utf8",
);
const solution = article
  .split("### 해결 방법")[1]
  .match(/```js\n([\s\S]*?)```/)[1];

function fixture({ draw = true, paint = true, context = true } = {}) {
  const calls = [];
  const handlers = [];
  const button = { style: {} };
  const ctx = {
    clearRect: (...args) => calls.push(["clear", ...args]),
    ...(draw
      ? {
          drawElementImage: (...args) => {
            calls.push(["draw", ...args]);
            return { toString: () => "matrix(1, 0, 0, 1, 280, 140)" };
          },
        }
      : {}),
  };
  const canvas = {
    width: 640,
    height: 360,
    getContext: () => (context ? ctx : null),
    querySelector: () => button,
    addEventListener: (name, handler) => {
      assert.equal(name, "paint");
      handlers.push(handler);
    },
    ...(paint ? { requestPaint: () => calls.push(["request"]) } : {}),
  };
  return {
    calls,
    handlers,
    button,
    canvas,
    run: () =>
      runInNewContext(solution, {
        document: { querySelector: () => canvas },
      }),
  };
}

test("article explicitly sets drawing size and transform origin", () => {
  assert.match(article, /<canvas width="640" height="360" layoutsubtree>/);
  assert.match(article, /transform-origin: left top/);
});

test("solution waits for paint and registers only one handler", () => {
  const f = fixture();
  f.run();
  assert.deepEqual(f.calls, [["request"]]);
  assert.equal(f.handlers.length, 1);
  assert.equal(f.canvas.onpaint, undefined);
});

test("each paint clears, draws and synchronizes DOM transform", () => {
  const f = fixture();
  f.run();
  for (let count = 0; count < 2; count += 1) {
    f.calls.length = 0;
    f.handlers[0]();
    assert.deepEqual(f.calls, [
      ["clear", 0, 0, 640, 360],
      ["draw", f.button, 280, 140],
    ]);
    assert.equal(f.button.style.transform, "matrix(1, 0, 0, 1, 280, 140)");
  }
});

test("unsupported environments stop without registering or retrying", () => {
  for (const options of [
    { draw: false },
    { paint: false },
    { context: false },
  ]) {
    const f = fixture(options);
    assert.throws(f.run, /HTML-in-Canvas/);
    assert.equal(f.handlers.length, 0);
    assert.deepEqual(f.calls, []);
  }
});
