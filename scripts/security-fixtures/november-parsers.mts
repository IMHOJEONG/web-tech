import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout } from "node:timers/promises";

const [, , mode, workspace] = process.argv;
if (!workspace) throw new Error("Missing synthetic workspace");
const local = createRequire(workspace);
const cli = createRequire(local.resolve("@nestjs/cli/package.json"));
if (mode === "minimatch") {
  const { Minimatch, minimatch } = cli("minimatch");
  const pattern = "a/{b,c}/**/../".repeat(10) + "*.ts";
  assert.throws(() => new Minimatch(pattern, { optimizationLevel: 2 }), {
    name: "RangeError",
    message: "optimizationLevel 2: too many patterns from '**/..'",
  });
  assert.equal(minimatch("src/fixture.ts", "src/**/*.ts"), true);
  assert.equal(minimatch("src/fixture.js", "src/**/*.ts"), false);
} else if (mode === "glob") {
  const { glob } = cli("glob");
  const directory = fs.mkdtempSync(join(tmpdir(), "glob-abort-security-"));
  try {
    for (let i = 0; i < 16; i++) {
      fs.mkdirSync(join(directory, `d${i}`));
      fs.writeFileSync(join(directory, `d${i}`, "fixture.txt"), "fixture");
    }
    const controller = new AbortController();
    const reason = new Error("synthetic abort");
    let reads = 0;
    const customFs = {
      ...fs,
      readdir: (...args: unknown[]) => {
        reads++;
        if (reads === 1) controller.abort(reason);
        return Reflect.apply(fs.readdir, fs, args);
      },
    };
    await assert.rejects(
      glob("**/*", { cwd: directory, signal: controller.signal, fs: customFs }),
      reason,
    );
    const atRejection = reads;
    await setTimeout(100);
    assert.equal(
      reads,
      atRejection,
      "No new directory reads after rejected cancellation",
    );
    assert.ok(reads <= 1);
    assert.equal((await glob("**/*.txt", { cwd: directory })).length, 16);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
} else throw new Error("Unsupported synthetic mode");
console.log("bounded fixture completed");
