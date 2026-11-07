import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
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
} else if (mode === "coverage") {
  const jest = createRequire(local.resolve("jest/package.json"));
  const core = createRequire(jest.resolve("@jest/core"));
  const transform = createRequire(core.resolve("@jest/transform"));
  const plugin = createRequire(transform.resolve("babel-plugin-istanbul"));
  const TestExclude = plugin("test-exclude");
  assert.equal(plugin("test-exclude/package.json").version.split(".")[0], "8");
  const directory = fs.realpathSync(
    fs.mkdtempSync(join(tmpdir(), "jest-coverage-security-")),
  );
  try {
    fs.mkdirSync(join(directory, "src"));
    fs.mkdirSync(join(directory, "node_modules"));
    // Generated CommonJS inputs exercise Jest's Babel instrumentation, not ts-jest caching.
    fs.writeFileSync(
      join(directory, "src/fixture.js"),
      "exports.sum = (a, b) => a + b;\n",
    );
    fs.writeFileSync(
      join(directory, "src/untested.js"),
      "exports.unused = () => 42;\n",
    );
    fs.writeFileSync(
      join(directory, "src/excluded.js"),
      "exports.excluded = true;\n",
    );
    fs.writeFileSync(
      join(directory, "node_modules/ignored.js"),
      "exports.ignored = true;\n",
    );
    fs.writeFileSync(
      join(directory, "src/fixture.test.js"),
      "const {sum} = require('./fixture'); test('synthetic addition', () => expect(sum(1, 2)).toBe(3));\n",
    );
    const exclude = new TestExclude({
      cwd: directory,
      include: ["src/**/*.js"],
      exclude: ["**/*.test.js", "**/excluded.js"],
      extension: [".js"],
    });
    const expected = ["src/fixture.js", "src/untested.js"];
    assert.deepEqual(exclude.globSync().sort(), expected);
    assert.deepEqual((await exclude.glob()).sort(), expected);
    assert.equal(
      exclude.shouldInstrument(join(directory, "src/fixture.js")),
      true,
    );
    assert.equal(
      exclude.shouldInstrument(join(directory, "src/excluded.js")),
      false,
    );
    assert.equal(
      exclude.shouldInstrument(join(directory, "node_modules/ignored.js")),
      false,
    );
    assert.equal(
      exclude.shouldInstrument(join(directory, "../outside.js")),
      false,
    );
    const resultPath = join(directory, "result.json");
    const result = spawnSync(
      process.execPath,
      [
        "--max-old-space-size=512",
        join(dirname(jest.resolve("./package.json")), "bin/jest.js"),
        "--config",
        JSON.stringify({
          rootDir: directory,
          transform: {},
          testEnvironment: "node",
          testMatch: ["**/fixture.test.js"],
          collectCoverageFrom: [
            "src/**/*.js",
            "!src/**/*.test.js",
            "!src/excluded.js",
          ],
          coverageProvider: "babel",
          coverageReporters: ["json"],
          coverageDirectory: join(directory, "coverage"),
        }),
        "--coverage",
        "--no-cache",
        "--runInBand",
        "--json",
        "--outputFile",
        resultPath,
      ],
      {
        cwd: directory,
        env: process.env,
        timeout: 20_000,
        maxBuffer: 64 * 1024,
        encoding: "utf8",
      },
    );
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(fs.readFileSync(resultPath, "utf8"));
    assert.equal(report.success, true);
    assert.equal(report.numPassedTestSuites, 1);
    assert.equal(report.numFailedTestSuites, 0);
    assert.equal(report.numPassedTests, 1);
    assert.equal(report.numFailedTests, 0);
    const coverage = JSON.parse(
      fs.readFileSync(join(directory, "coverage/coverage-final.json"), "utf8"),
    );
    assert.deepEqual(
      Object.keys(coverage).sort(),
      expected.map((file) => join(directory, file)).sort(),
    );
    assert.ok(
      Object.values(coverage[join(directory, "src/fixture.js")].s).some(
        (count) => Number(count) > 0,
      ),
    );
    const untestedStatements = Object.values(
      coverage[join(directory, "src/untested.js")].s,
    );
    assert.ok(untestedStatements.length > 0);
    assert.ok(untestedStatements.every((count) => count === 0));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
} else throw new Error("Unsupported synthetic mode");
console.log("bounded fixture completed");
