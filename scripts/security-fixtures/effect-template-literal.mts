import assert from "node:assert/strict";
import { createRequire } from "node:module";

const metadata = process.argv[2];
if (!metadata) throw new Error("Missing Effect fixture metadata");
const request = createRequire(metadata);
const { Schema, Effect } = request("effect");
console.log(`effect fixture loaded: ${request("effect/package.json").version}`);

const schema = Schema.TemplateLiteral(
  Schema.String,
  ":",
  Schema.String,
  ":",
  Schema.String,
  "X",
);
// The parent kills this process if synchronous regex work blocks its event loop.
const hostile = ":".repeat(5_000);
assert.equal(Schema.is(schema)(hostile), false);
assert.throws(() => Schema.decodeUnknownSync(schema)(hostile));
await assert.rejects(Effect.runPromise(Schema.decodeUnknown(schema)(hostile)));

for (const normal of [
  "one:two:threeX",
  "::X",
  "one\n:two:three🙂X",
  `${":".repeat(5_000)}X`,
]) {
  assert.equal(Schema.is(schema)(normal), true);
  assert.equal(Schema.decodeUnknownSync(schema)(normal), normal);
  assert.equal(
    await Effect.runPromise(Schema.decodeUnknown(schema)(normal)),
    normal,
  );
}
for (const invalid of [
  "one:two:three",
  "missing",
  "one:two:threeX\n",
  42,
  null,
])
  assert.equal(Schema.is(schema)(invalid), false);

const mixed = Schema.TemplateLiteral(
  "item-",
  Schema.Number,
  "-",
  Schema.String,
);
assert.equal(Schema.decodeUnknownSync(mixed)("item-42-note"), "item-42-note");
assert.equal(Schema.is(mixed)("item-NaN-note"), false);
console.log("bounded fixture completed");
