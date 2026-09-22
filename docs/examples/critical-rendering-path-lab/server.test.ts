import assert from "node:assert/strict";
import type { Server } from "node:http";
import { after, before, test } from "node:test";

import { createLabServer } from "./server.ts";

let baseUrl = "";
let server: Server;

before(async () => {
  server = createLabServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Lab server did not expose a TCP port.");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("redirects the root route to the baseline experiment", async () => {
  const response = await fetch(`${baseUrl}/`, { redirect: "manual" });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "/baseline");
});

test("renders immediate and late LCP discovery as different pages", async () => {
  const baseline = await fetch(`${baseUrl}/baseline`).then((response) =>
    response.text(),
  );
  const lateLcp = await fetch(`${baseUrl}/late-lcp`).then((response) =>
    response.text(),
  );

  assert.match(baseline, /class="hero" src="\/assets\/hero\.svg"/);
  assert.doesNotMatch(lateLcp, /class="hero" src="\/assets\/hero\.svg"/);
  assert.match(lateLcp, /id="hero-slot" data-delay="1200"/);
});

test("serves stripped browser TypeScript as JavaScript", async () => {
  const response = await fetch(`${baseUrl}/assets/late-lcp.js`);
  const source = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/javascript/);
  assert.doesNotMatch(source, /HTMLElement/);
  assert.match(source, /document\.querySelector/);
});

test("reports an injected asset delay through Server-Timing", async () => {
  const response = await fetch(`${baseUrl}/assets/styles.css?delay=10`);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("server-timing"), "injected-delay;dur=10");
  assert.match(await response.text(), /font-family/);
});

test("accepts a bounded delay override for browser automation", async () => {
  const overridden = await fetch(`${baseUrl}/late-lcp?delay=25`).then(
    (response) => response.text(),
  );
  const bounded = await fetch(`${baseUrl}/slow-css?delay=9999`).then(
    (response) => response.text(),
  );

  assert.match(overridden, /id="hero-slot" data-delay="25"/);
  assert.match(bounded, /styles\.css\?delay=3000/);
});

test("rejects routes outside the experiment allowlist", async () => {
  const response = await fetch(`${baseUrl}/unknown`);

  assert.equal(response.status, 404);
});
