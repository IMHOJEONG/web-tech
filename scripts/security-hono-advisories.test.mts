import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = process.env.HONO_SECURITY_WORKSPACE
  ? resolve(process.env.HONO_SECURITY_WORKSPACE)
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const local = (app: string) =>
  createRequire(join(root, "apps", app, "package.json"));
const prisma = createRequire(
  local("vuln-radar-backend").resolve("prisma/package.json"),
);
// Resolve Prisma's actual dependency without starting the development server.
const dev = createRequire(prisma.resolve("@prisma/dev"));
const { Hono } = dev("hono");
const { RegExpRouter } = dev("hono/router/reg-exp-router");
const yaml = local("docs-backend")("yaml");
const semver = local("docs")("next/dist/compiled/semver");
const origin = "https://application.invalid";
const floor = ">=4.13.16 <5";
type Context = {
  text: (value: string, status?: number) => Response;
  json: (value: unknown, status?: number) => Response;
  req: {
    valid: (target: string) => Record<string, unknown>;
    parseBody: () => Promise<Record<string, unknown>>;
  };
};
const denied = (context: Context) => context.text("denied fixture", 401);
const protectedResponse = (context: Context) =>
  context.text("protected fixture");
const publicResponse = (context: Context) => context.text("public fixture");

test("Hono override, every locked copy and Prisma's installed copy satisfy the security floor", () => {
  const workspace = yaml.parse(
    readFileSync(join(root, "pnpm-workspace.yaml"), "utf8"),
  );
  const lock = yaml
    .parseAllDocuments(readFileSync(join(root, "pnpm-lock.yaml"), "utf8"))
    .at(-1)
    .toJSON();
  assert.ok(semver.subset(workspace.overrides.hono, floor));
  const copies = Object.keys(lock.packages).filter((key) =>
    key.startsWith("hono@"),
  );
  assert.ok(copies.length > 0);
  for (const copy of copies)
    assert.ok(semver.satisfies(copy.slice("hono@".length), floor), copy);
  assert.equal(semver.satisfies("4.13.16-rc.1", floor), false);
  let directory = dirname(dev.resolve("hono"));
  while (directory !== dirname(directory)) {
    const metadataPath = join(directory, "package.json");
    try {
      const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
      if (metadata.name === "hono") {
        assert.ok(semver.satisfies(metadata.version, floor));
        assert.ok(
          semver.satisfies(process.versions.node, metadata.engines.node),
        );
        return;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    directory = dirname(directory);
  }
  assert.fail("Installed Hono metadata not found");
});

test("CSRF rejects cross-origin text/ping and accepts a same-origin control", async () => {
  const { csrf } = dev("hono/csrf");
  const app = new Hono();
  app.use("*", csrf());
  app.post("/toggle", publicResponse);
  for (const [source, site, status] of [
    ["https://untrusted.invalid", "cross-site", 403],
    [origin, "same-origin", 200],
  ] as const) {
    const response = await app.request(`${origin}/toggle`, {
      method: "POST",
      headers: {
        Origin: source,
        "Sec-Fetch-Site": site,
        "Content-Type": "text/ping",
      },
      body: "PING",
    });
    assert.equal(response.status, status);
  }
});

test("multipart validation sees fields despite extra parameters or whitespace", async () => {
  const { validator } = dev("hono/validator");
  const app = new Hono();
  app.post(
    "/form",
    validator("form", (value: Record<string, unknown>, context: Context) => {
      if (value.role === "forbidden")
        return context.text("rejected fixture", 400);
      return value;
    }),
    async (context: Context) =>
      context.json({
        validated: context.req.valid("form"),
        parsed: await context.req.parseBody(),
      }),
  );
  for (const contentType of [
    "multipart/form-data; boundary=fixture-boundary",
    "multipart/form-data; boundary=fixture-boundary; charset=utf-8",
    "multipart/form-data;  boundary=fixture-boundary",
  ]) {
    for (const role of ["forbidden", "reader"]) {
      const response = await app.request(`${origin}/form`, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body: `--fixture-boundary\r\nContent-Disposition: form-data; name="role"\r\n\r\n${role}\r\n--fixture-boundary--\r\n`,
      });
      assert.equal(response.status, role === "forbidden" ? 400 : 200);
      if (role === "reader") {
        assert.deepEqual(await response.json(), {
          validated: { role },
          parsed: { role },
        });
      }
    }
  }
});

for (const api of ["app.mount", "mount"] as const) {
  test(`${api}: dynamic prefixes cannot truncate a public path into a protected child route`, async () => {
    const child = new Hono();
    child.get("/admin/secret", protectedResponse);
    child.get("/public", publicResponse);
    const app = new Hono();
    app.use("/api/:tenant/admin/*", denied);
    if (api === "app.mount") {
      // app.mount appends its wildcard; pass the base prefix only.
      app.mount("/api/:tenant", child.fetch);
    } else {
      const { mount } = dev("hono/mount");
      app.all("/api/:tenant/*", mount(child.fetch));
    }
    assert.equal(
      (await app.request(`${origin}/api/a/xxxxx/admin/secret`)).status,
      404,
    );
    assert.equal(
      (await app.request(`${origin}/api/team/admin/secret`)).status,
      401,
    );
    assert.equal(
      await (await app.request(`${origin}/api/team/public`)).text(),
      "public fixture",
    );
  });
}

test("mount forwarding cannot normalize encoded backslashes into a protected child route", async () => {
  const child = new Hono();
  child.get("/admin/secret", protectedResponse);
  child.get("/public", publicResponse);
  const app = new Hono();
  app.use("/app/admin/*", denied);
  app.mount("/app", child.fetch);
  const encoded = await app.request(`${origin}/app/public%5C..%5Cadmin/secret`);
  assert.equal(encoded.status, 404);
  assert.doesNotMatch(await encoded.text(), /protected fixture/);
  assert.equal((await app.request(`${origin}/app/admin/secret`)).status, 401);
  assert.equal(
    await (await app.request(`${origin}/app/public`)).text(),
    "public fixture",
  );
});

test("RegExpRouter applies equivalent default-parameter middleware", async () => {
  const app = new Hono({ router: new RegExpRouter() });
  app.use("/api/:tenant{[^/]+}/admin/*", denied);
  app.get("/api/:tenant/admin/:id", protectedResponse);
  app.get("/public", publicResponse);
  assert.equal((await app.request(`${origin}/api/team/admin/1`)).status, 401);
  assert.equal((await app.request(`${origin}/public`)).status, 200);
});

test("RegExpRouter keeps wildcard middleware for a wildcard route", async () => {
  const app = new Hono({ router: new RegExpRouter() });
  app.use("/admin/*", denied);
  app.get("/admin*", protectedResponse);
  app.get("/public", publicResponse);
  assert.equal((await app.request(`${origin}/admin/secret`)).status, 401);
  assert.equal((await app.request(`${origin}/public`)).status, 200);
});

test("encoded line terminators cannot skip wildcard middleware before not-found", async () => {
  const app = new Hono({ router: new RegExpRouter() });
  app.use("*", denied);
  app.notFound((context: Context) => context.text("not-found fixture", 404));
  for (const terminator of ["%0A", "%0D", "%E2%80%A8", "%E2%80%A9"]) {
    assert.equal(
      (await app.request(`${origin}/missing${terminator}path`)).status,
      401,
    );
  }
});

for (const split of ["template", "adjacent-values"] as const) {
  test(`CSS ${split} interpolation cannot terminate its style element`, () => {
    const { css, Style } = dev("hono/css");
    const value = "/style><i data-security-fixture>fixture</i>";
    const generated =
      split === "template"
        ? css`
            body::before {
              content: "<${value}";
            }
          `
        : css`
            body::before {
              content: "${"<"}${value}";
            }
          `;
    // Inspect text only; never evaluate or open the synthetic HTML fragment.
    const output = String(Style({ children: generated }));
    assert.equal(output.match(/<\/style>/gi)?.length, 1);
    assert.doesNotMatch(output, /<\/style><i data-security-fixture>/i);
    assert.match(
      String(
        Style({
          children: css`
            body {
              color: ${"red"};
            }
          `,
        }),
      ),
      /color:\s*red/,
    );
  });
}
