import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docs = createRequire(join(root, "apps/docs/package.json"));
const backend = createRequire(join(root, "apps/docs-backend/package.json"));
const radar = createRequire(join(root, "apps/vuln-radar/package.json"));
const prisma = createRequire(
  createRequire(join(root, "apps/vuln-radar-backend/package.json")).resolve(
    "prisma/package.json",
  ),
);
const prismaDev = createRequire(prisma.resolve("@prisma/dev"));

function packageVersion(request: NodeJS.Require, name: string): string {
  let directory = dirname(request.resolve(name));
  while (directory !== dirname(directory)) {
    try {
      const metadata = JSON.parse(
        readFileSync(join(directory, "package.json"), "utf8"),
      );
      if (metadata.name === name) return metadata.version;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    directory = dirname(directory);
  }
  throw new Error(`Cannot locate ${name}`);
}

const sanitize: (html: string, options: Record<string, unknown>) => string =
  docs("sanitize-html");

test("sanitize-html rejects namespaced SMIL URL sinks without executing markup", () => {
  for (const prefix of ["svg", "xml", "xlink", "SVG"]) {
    for (const tag of [
      "animate",
      "animateColor",
      "animateMotion",
      "animateTransform",
      "set",
    ]) {
      const html = `<svg><a href="#fixture"><${prefix}:${tag} attributeName="href" values="javascript:void(0)" /></a></svg>`;
      const result = sanitize(html, {
        allowedTags: ["svg", "a", `${prefix}:${tag}`.toLowerCase()],
        allowedAttributes: false,
        allowedSchemes: ["https"],
      });
      assert.doesNotMatch(result, /javascript:/i, `${prefix}:${tag}`);
    }
  }
  const [major, minor] = packageVersion(docs, "sanitize-html")
    .split(".")
    .map(Number);
  assert.equal(major, 2);
  assert.ok(minor >= 18);
});

test("sanitize-html does not emit noscript discard content or unsafe refresh URLs", () => {
  const result = sanitize(
    '<div><noscript></div><img src="https://example.invalid/fixture.png"></noscript>',
    {
      allowedTags: ["div", "img"],
      allowedAttributes: { img: ["src"] },
      nonTextTags: ["script", "style", "textarea", "option", "noscript"],
    },
  );
  assert.doesNotMatch(result, /<img\b/i);
  for (const url of ["javascript:void(0)", "data:text/html,fixture"]) {
    assert.doesNotMatch(
      sanitize(`<meta http-equiv="refresh" content="0;url=${url}">`, {
        allowedTags: ["meta"],
        allowedAttributes: { meta: ["http-equiv", "content"] },
      }),
      /javascript:|data:text\/html/i,
    );
  }
  assert.equal(
    sanitize('<p><a href="https://example.invalid">fixture</a></p>', {
      allowedTags: ["p", "a"],
      allowedAttributes: { a: ["href"] },
    }),
    '<p><a href="https://example.invalid">fixture</a></p>',
  );
});

test("Vite stays on the patched 8.2 release lane", () => {
  const version = packageVersion(radar, "vite");
  const [major, minor, patch] = version.split(".").map(Number);
  assert.equal(major, 8);
  assert.equal(minor, 2);
  assert.ok(patch >= 4, "Vite must include the three launch-editor fixes");
});

test("Prisma's Hono static adapter does not decode past prefix authentication", async () => {
  const { Hono } = prismaDev("hono");
  const { serveStatic } = prismaDev("hono/serve-static");
  let reads = 0;
  const app = new Hono();
  app.use(
    "/files/private/*",
    (context: { text: (body: string, status: number) => Response }) =>
      context.text("denied", 401),
  );
  app.use(
    "/files/*",
    serveStatic({
      getContent: async (path: string) => {
        reads += 1;
        return `fixture:${path}`;
      },
    }),
  );
  const protectedResponse = await app.request("/files/private/fixture.txt");
  assert.equal(protectedResponse.status, 401);
  const encodedResponse = await app.request("/files/%%37%30rivate/fixture.txt");
  assert.equal(encodedResponse.status, 404);
  assert.equal(reads, 0);
  const publicResponse = await app.request("/files/public/fixture.txt");
  assert.equal(publicResponse.status, 200);
  assert.match(await publicResponse.text(), /fixture/);
});

test("markdown-it processes bounded pathological inputs in an isolated child", () => {
  const version = packageVersion(backend, "markdown-it");
  assert.ok(version.startsWith("14.3."));
  assert.ok(Number(version.split(".")[2]) >= 3);
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      String.raw`
    import { createRequire } from 'node:module';
    const MarkdownIt = createRequire(${JSON.stringify(join(root, "apps/docs-backend/package.json"))})('markdown-it');
    const plain = new MarkdownIt();
    const html = new MarkdownIt({ html: true });
    const typography = new MarkdownIt({ typographer: true });
    for (const opener of ['<!--', '<?x', '<!A', '<![CDATA[']) html.render('fixture ' + opener.repeat(8000));
    plain.render('[fixture]: /target "' + 'line\n'.repeat(12000));
    plain.render('[' + 'label\n'.repeat(4000));
    typography.render('"a '.repeat(4000) + "b' ".repeat(4000));
    if (!plain.render('# Fixture\n\n[link](/safe)').includes('<h1>Fixture</h1>')) process.exit(1);
    console.log('bounded fixtures completed');
  `,
    ],
    { timeout: 10000, encoding: "utf8", maxBuffer: 1024 * 1024 },
  );
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /bounded fixtures completed/);
});
