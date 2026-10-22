import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";

const root = process.cwd();
const base = process.argv[2] ?? "http://127.0.0.1:3021";
const output = process.argv[3] ?? "/tmp/tcp-publication-local-20261021";
assert.ok(["http://127.0.0.1:3021", "https://heap-forge.app"].includes(base));
mkdirSync(output, { recursive: true });
const { chromium, expect } = createRequire(`${root}/apps/docs/package.json`)(
  "@playwright/test",
);
const articlePath = "/docs/category/be/node-js/tcp-socket-endpoints-lab";
const title = "HTTP 연결 안의 소켓: 주소와 포트 직접 확인하기";
const result = {
  observedAt: new Date().toISOString(),
  origin: base,
  views: [] as unknown[],
  discovery: null as unknown,
  failure: null as string | null,
};
const browser = await chromium.launch();
try {
  for (const [locale, width] of [
    ["ko", 320],
    ["ko", 390],
    ["ko", 670],
    ["ko", 1280],
    ["en", 390],
    ["en", 1280],
  ] as const) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error: Error) => errors.push(error.message));
    const response = await page.goto(`${base}/${locale}${articlePath}`, {
      waitUntil: "load",
      timeout: 60000,
    });
    assert.equal(response?.status(), 200);
    const body = page.locator(".mdx-wrapper");
    await expect(body).toBeVisible();
    await expect(page.locator("h1")).toHaveText(title);
    assert.equal(await page.locator("h1").count(), 1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${base}/${locale}${articlePath}`,
    );
    const robots = await page
      .locator('meta[name="robots"]')
      .evaluateAll((nodes: HTMLMetaElement[]) =>
        nodes.map((node) => node.content),
      );
    assert.ok(robots.every((value) => !value.includes("noindex")));
    const text = await body.innerText();
    for (const marker of [
      "HTTP 연결을 구성하는 두 끝점",
      "60187",
      "60116",
      "다음 글: CPU 작업과 수신 콜백",
      "패킷 도착 시각은 아닙니다",
    ])
      assert.ok(text.includes(marker), marker);
    const images = body.locator("img");
    assert.equal(await images.count(), 2);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(async (element: HTMLImageElement) => {
        await element.decode();
      });
    }
    if (locale === "ko" && [390, 1280].includes(width))
      await page.screenshot({
        path: `${output}/packet-${width}.jpg`,
        type: "jpeg",
        quality: 85,
      });
    for (const label of [
      "단계별 관측 기록 펼치기",
      "seq와 ack 숫자 해석",
      "실행 코드 다섯 부분 펼치기",
      "macOS의 두 터미널에서 캡처하기",
    ]) {
      const summary = body.locator("summary").filter({ hasText: label });
      await expect(summary).toHaveCount(1);
      const details = summary.locator("..");
      assert.equal(await details.getAttribute("open"), null);
      await summary.click();
      await expect(details).toHaveAttribute("open", "");
      if (label.startsWith("실행 코드")) {
        const frame = details
          .locator(".mdx-code-frame")
          .filter({ hasText: "createServer" })
          .first();
        const copy = frame.locator(".mdx-code-copy-button");
        await copy.click();
        await expect(copy).toHaveAttribute("data-copy-state", "copied");
        assert.match(
          await page.evaluate(() => navigator.clipboard.readText()),
          /import \{ createServer, get \} from 'node:http'/,
        );
      }
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      await summary.click();
    }
    await page.evaluate(() => scrollTo(0, 0));
    if (locale === "ko" && [390, 1280].includes(width))
      await page.screenshot({
        path: `${output}/top-${width}.jpg`,
        type: "jpeg",
        quality: 85,
      });
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - innerWidth,
      nestedParagraphs: document.querySelectorAll(".mdx-wrapper p p").length,
      images: Array.from(
        document.querySelectorAll<HTMLImageElement>(".mdx-wrapper img"),
      ).map((image) => ({
        decoded: image.complete && image.naturalWidth > 0,
        width: image.getBoundingClientRect().width,
      })),
    }));
    assert.ok(metrics.overflow <= 1);
    assert.equal(metrics.nestedParagraphs, 0);
    assert.deepEqual(errors, []);
    result.views.push({
      locale,
      width,
      status: response?.status(),
      indexable: true,
      disclosureChecks: 4,
      clipboard: true,
      pageErrors: errors,
      ...metrics,
    });
    await context.close();
  }
  const context = await browser.newContext();
  const page = await context.newPage();
  const response = await context.request.get(
    `${base}/api/search?q=${encodeURIComponent(title)}`,
  );
  assert.equal(response.status(), 200);
  const search = await response.json();
  const matching = search.results.filter(
    (item: { href: string }) => item.href === articlePath,
  );
  assert.equal(matching.length, 1);
  assert.equal(matching[0].title, title);
  const sitemapResponse = await context.request.get(`${base}/sitemap.xml`);
  assert.equal(sitemapResponse.status(), 200);
  const sitemap = await sitemapResponse.text();
  for (const locale of ["ko", "en"])
    assert.ok(sitemap.includes(`${base}/${locale}${articlePath}`));
  await page.goto(`${base}/ko/docs?q=${encodeURIComponent(title)}`, {
    waitUntil: "load",
  });
  const link = page.locator(`main a[href="/ko${articlePath}"]`).first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page.locator(".mdx-wrapper")).toBeVisible();
  await expect(page.locator("h1")).toHaveText(title);
  result.discovery = {
    search: true,
    uniqueSearchResult: true,
    sitemapLocales: ["ko", "en"],
    listLinkNavigation: true,
  };
  await context.close();
  console.log(
    "PASS: six public article views, diagrams, disclosures, clipboard, canonical, indexability, search, sitemap and list Link navigation",
  );
} catch (error) {
  result.failure = String(error);
  process.exitCode = 1;
  console.error(result.failure);
} finally {
  await browser.close();
  writeFileSync(
    `${output}/result.json`,
    JSON.stringify(result, null, 2) + "\n",
  );
}
