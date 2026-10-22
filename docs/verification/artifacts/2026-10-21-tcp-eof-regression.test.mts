import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { once } from "node:events";
import { test } from "node:test";

const source = readFileSync(
  resolve("apps/docs/category/be/node-js/tcp-socket-endpoints-lab.mdx"),
  "utf8",
);
const parts = [
  ...source.matchAll(
    /^```ts filename="tcp-socket-endpoints.mts" part="(\d)\/5"\n([\s\S]*?)^```/gm,
  ),
];
assert.deepEqual(
  parts.map((part) => Number(part[1])),
  [1, 2, 3, 4, 5],
);
const code = parts.map((part) => part[2]).join("\n");

test(
  "capture mode cancels cleanly when stdin is already EOF",
  { timeout: 10000 },
  async () => {
    const directory = mkdtempSync(resolve(tmpdir(), "tcp-eof-"));
    const file = resolve(directory, "example.mts");
    writeFileSync(file, code);
    try {
      const result = spawnSync(process.execPath, [file], {
        env: { ...process.env, CAPTURE_TCP: "1" },
        input: "",
        encoding: "utf8",
        timeout: 5000,
      });
      assert.equal(result.error, undefined);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(
        result.stdout,
        "",
        "Cancellation must not fabricate a success JSON",
      );
      assert.match(result.stderr, /캡처 준비 후/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  },
);

test(
  "EOF after the capture prompt closes the listening socket",
  { timeout: 10000 },
  async () => {
    const directory = mkdtempSync(resolve(tmpdir(), "tcp-eof-after-prompt-"));
    const file = resolve(directory, "example.mts");
    writeFileSync(file, code);
    const child = spawn(process.execPath, [file], {
      env: { ...process.env, CAPTURE_TCP: "1" },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let output = "",
      errorOutput = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      errorOutput += chunk;
    });
    const exited = once(child, "close");
    const timer = setTimeout(() => child.kill(), 5000);
    try {
      while (!errorOutput.includes("캡처 준비 후")) {
        assert.equal(child.exitCode, null, errorOutput);
        await once(child.stderr, "data");
      }
      const match = /and port (\d+)'/.exec(errorOutput);
      assert.ok(match);
      const port = Number(match[1]);
      assert.equal(output, "");
      child.stdin.end();
      const [status, signal] = await exited;
      assert.equal(status, 0, errorOutput);
      assert.equal(signal, null);
      assert.equal(output, "");
      const probe = createServer();
      try {
        probe.listen(port, "127.0.0.1");
        await once(probe, "listening");
      } finally {
        if (probe.listening)
          await new Promise<void>((done, reject) =>
            probe.close((error) => (error ? reject(error) : done())),
          );
      }
    } finally {
      clearTimeout(timer);
      if (child.exitCode === null) child.kill();
      await exited;
      rmSync(directory, { recursive: true, force: true });
    }
  },
);
