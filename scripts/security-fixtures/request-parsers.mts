import assert from "node:assert/strict";
import { once } from "node:events";
import { createRequire } from "node:module";
import { PassThrough } from "node:stream";
import { createServer, request as httpRequest } from "node:http";
import { deflateSync } from "node:zlib";

const [mode, manifest] = process.argv.slice(2);
const app = createRequire(manifest);
const dependency = (parent: NodeJS.Require, name: string) =>
  createRequire(parent.resolve(name));

if (mode === "toml") {
  const mdx = dependency(app, "mdx-bundler");
  const frontmatter = dependency(mdx, "remark-mdx-frontmatter");
  const toml = frontmatter("toml");
  assert.equal(
    toml.parse('title = "fixture"\n[author]\nname = "reader"').author.name,
    "reader",
  );
  const nested = toml.parse("a.".repeat(512) + "value = 1");
  let value = nested;
  for (let i = 0; i < 512; i++) value = value.a;
  assert.equal(value.value, 1);
  const tables = Array.from(
    { length: 256 },
    (_, i) => `[[t${i}]]\nvalue = ${i}\n`,
  ).join("");
  assert.equal(toml.parse(tables).t255[0].value, 255);
  // Only this bounded child overrides BigInt; no large conversion is executed.
  const original = globalThis.BigInt;
  globalThis.BigInt = ((value: string | number | bigint | boolean) => {
    assert.ok(String(value).length < 100, "oversized literal reached BigInt");
    return original(value);
  }) as BigIntConstructor;
  try {
    for (const literal of [
      "0x" + "f".repeat(1024),
      "0b" + "1".repeat(1024),
      "9".repeat(1024),
    ]) {
      assert.throws(
        () => toml.parse(`value = ${literal}`),
        /64-bit signed integer range/,
      );
    }
  } finally {
    globalThis.BigInt = original;
  }
} else if (mode === "body-parser") {
  const platform = dependency(app, "@nestjs/platform-express");
  const express = dependency(platform, "express");
  const parser = express("body-parser").json();
  const first = Buffer.concat([
    deflateSync(Buffer.from('{"fixture":true}')),
    Buffer.from([0]),
  ]);
  const tail = Buffer.alloc(1024);
  let client: ReturnType<typeof httpRequest>;
  const server = createServer((req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    parser(req, res, (error: Error | undefined) => {
      assert.ifError(error);
      // Send the tail only after the decoder has finished the valid frame.
      req.once("end", () => {
        assert.deepEqual((req as typeof req & { body: unknown }).body, {
          fixture: true,
        });
        res.end('{"fixture":true}');
      });
      client.end(tail);
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const result = await new Promise<{
      status: number | undefined;
      body: string;
    }>((resolve, reject) => {
      const address = server.address();
      assert.ok(address && typeof address !== "string");
      client = httpRequest(
        {
          hostname: "127.0.0.1",
          port: address.port,
          method: "POST",
          agent: false,
          headers: {
            "Content-Type": "application/json",
            "Content-Encoding": "deflate",
            "Content-Length": first.length + tail.length,
          },
        },
        (res) => {
          assert.equal(
            res.headers["content-type"],
            "application/json; charset=utf-8",
          );
          assert.equal(res.headers["x-content-type-options"], "nosniff");
          let body = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            body += chunk;
          });
          res.on("error", reject);
          res.on("end", () => resolve({ status: res.statusCode, body }));
        },
      );
      client.on("error", reject);
      client.setTimeout(3000, () =>
        client.destroy(new Error("local parser fixture timed out")),
      );
      client.write(first);
    });
    assert.equal(result.status, 200);
    assert.deepEqual(JSON.parse(result.body), { fixture: true });
  } finally {
    client!.destroy();
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
} else if (mode === "multer") {
  const platform = dependency(app, "@nestjs/platform-express");
  const multer = platform("multer");
  const req = new PassThrough() as PassThrough & {
    headers: Record<string, string | number>;
    files: unknown[];
  };
  const rejected = new Error("fixture filter rejection");
  let resume: (error: Error | null, accept?: boolean) => void;
  let parser: PassThrough;
  let callbacks = 0;
  const body = [
    "--fixture",
    'Content-Disposition: form-data; name="first"; filename="a.txt"',
    "",
    "a",
    "--fixture",
    'Content-Disposition: form-data; name="second"; filename="b.txt"',
    "",
    "b",
  ].join("\r\n");
  // Mirrors the upstream GHSA-q7qp-rjg7-q26m lifecycle, without disk writes.
  const upload = multer({
    fileHwm: 1,
    streamHandler(input: PassThrough, stream: PassThrough) {
      parser = stream;
      input.pipe(stream);
    },
    fileFilter(
      _req: unknown,
      file: { fieldname: string },
      next: typeof resume,
    ) {
      if (file.fieldname === "first") resume = next;
      else req.once("end", () => setImmediate(() => next(rejected)));
    },
  }).any();
  req.headers = {
    "content-type": "multipart/form-data; boundary=fixture",
    "content-length": Buffer.byteLength(body),
  };
  await new Promise<void>((resolve, reject) => {
    upload(req, null, (error: Error) => {
      callbacks++;
      try {
        assert.equal(error, rejected);
        assert.equal(typeof resume, "function");
      } catch (error) {
        reject(error);
        return;
      }
      setImmediate(() => {
        // Do not add an error handler: it would mask the original crash.
        parser.once("close", () => {
          try {
            assert.equal(callbacks, 1);
            assert.deepEqual(req.files, []);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
        resume(null, true);
      });
    });
    req.end(body);
  });
} else {
  throw new Error("Unknown security fixture mode");
}
console.log("security fixture completed");
