import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { type TestContext } from "node:test";
import { assertTraceZipIntegrity } from "../apps/docs/scripts/trace-zip-integrity.ts";

// A generated, single-entry DEFLATE archive containing only "synthetic-trace".
const archive = Buffer.from(
  "UEsDBBQAAAAIAAADbF1+YLUeEQAAAA8AAAALAAAAdHJhY2UudHJhY2UrrswryUgtyUzWLSlKTE4FAFBLAQIUAxQAAAAIAAADbF1+YLUeEQAAAA8AAAALAAAAAAAAAAAAAACAAQAAAAB0cmFjZS50cmFjZVBLBQYAAAAAAQABADkAAAA6AAAAAAA=",
  "base64",
);

function fixture(t: TestContext, bytes: Buffer) {
  const directory = mkdtempSync(join(tmpdir(), "trace-zip-integrity-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = join(directory, "trace archive.zip");
  writeFileSync(file, bytes);
  return { directory, file };
}

test("ZIP integrity checks read every entry without extracting files", (t) => {
  const { directory, file } = fixture(t, archive);
  assert.doesNotThrow(() => assertTraceZipIntegrity(file));
  assert.deepEqual(readdirSync(directory), ["trace archive.zip"]);
});

test("a parseable archive with a corrupted CRC fails", (t) => {
  const corrupt = Buffer.from(archive);
  const centralDirectory = corrupt.indexOf(Buffer.from([0x50, 0x4b, 1, 2]));
  assert.ok(centralDirectory >= 0);
  corrupt[centralDirectory + 16] = corrupt[centralDirectory + 16]! ^ 1;
  assert.throws(
    () => assertTraceZipIntegrity(fixture(t, corrupt).file),
    /Trace ZIP CRC validation failed/,
  );
});

test("truncated and non-ZIP evidence fail closed", (t) => {
  for (const bytes of [archive.subarray(0, -10), Buffer.from("not a ZIP")]) {
    assert.throws(
      () => assertTraceZipIntegrity(fixture(t, bytes).file),
      /BadZipFile/,
    );
  }
});

test("an empty but structurally valid ZIP cannot count as a trace", (t) => {
  const empty = Buffer.alloc(22);
  empty.writeUInt32LE(0x06054b50);
  assert.throws(
    () => assertTraceZipIntegrity(fixture(t, empty).file),
    /Trace ZIP is empty/,
  );
});

test("missing evidence is not successful integrity verification", (t) => {
  const { file } = fixture(t, archive);
  assert.throws(
    () => assertTraceZipIntegrity(file + ".missing"),
    /FileNotFoundError/,
  );
});

test("missing Python is an error rather than an integrity bypass", (t) => {
  const { directory, file } = fixture(t, archive);
  const helper = new URL(
    "../apps/docs/scripts/trace-zip-integrity.ts",
    import.meta.url,
  ).href;
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import {assertTraceZipIntegrity} from ${JSON.stringify(helper)}; assertTraceZipIntegrity(${JSON.stringify(file)});`,
    ],
    { encoding: "utf8", env: { ...process.env, PATH: directory } },
  );
  assert.ifError(result.error);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ENOENT/);
});
