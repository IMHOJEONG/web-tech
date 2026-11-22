import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { brotliCompressSync } from "node:zlib";

// Reuse installed Nest dependencies without loading the application or its secrets.
const require = createRequire(
  new URL("../../../apps/docs-backend/package.json", import.meta.url),
);
const { NestFactory } = require("@nestjs/core");
const { Controller, Module, Post } = require("@nestjs/common");

class ProbeController {
  read() {
    throw new Error("The denying guard must prevent the handler");
  }
}
Controller("probe")(ProbeController);
Post()(
  ProbeController.prototype,
  "read",
  Object.getOwnPropertyDescriptor(ProbeController.prototype, "read"),
);
class ProbeModule {}
Module({ controllers: [ProbeController] })(ProbeModule);

let guardCalls = 0;
let decodedBeforeDenial = false;
const app = await NestFactory.create(ProbeModule, { logger: false });
app.useGlobalGuards({
  canActivate(context: {
    switchToHttp(): { getRequest(): { body?: { probe?: boolean } } };
  }) {
    guardCalls += 1;
    decodedBeforeDenial =
      context.switchToHttp().getRequest().body?.probe === true;
    return false;
  },
});

try {
  await app.listen(0, "127.0.0.1");
  const target = new URL("/probe", await app.getUrl());
  assert.equal(target.hostname, "127.0.0.1");
  const response = await fetch(target, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Encoding": "br",
    },
    body: brotliCompressSync(Buffer.from(JSON.stringify({ probe: true }))),
    signal: AbortSignal.timeout(5000),
  });
  await response.arrayBuffer();
  assert.equal(response.status, 403);
  assert.equal(guardCalls, 1);
  assert.equal(decodedBeforeDenial, true);
  console.log(
    JSON.stringify({
      node: process.version,
      brotli: process.versions.brotli,
      nest: require("@nestjs/core/package.json").version,
      status: response.status,
      guardCalls,
      decodedBeforeDenial,
      payload: "valid Brotli JSON only; no exploit or malformed input",
    }),
  );
} finally {
  await app.close();
}
