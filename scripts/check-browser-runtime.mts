import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

export type BrowserLauncher = {
  launch(options: { headless: boolean }): Promise<{
    version(): string;
    newPage(): Promise<{
      setContent(html: string): Promise<void>;
      textContent(selector: string): Promise<string | null>;
    }>;
    close(): Promise<void>;
  }>;
};

export async function verifyBrowserRuntime(launcher: BrowserLauncher) {
  const browser = await launcher.launch({ headless: true });
  let version: string;
  try {
    const page = await browser.newPage();
    await page.setContent('<p id="ci-browser-probe">chromium-ready</p>');
    if ((await page.textContent("#ci-browser-probe")) !== "chromium-ready") {
      throw new Error("Chromium did not render the runtime probe.");
    }
    version = browser.version();
  } catch (error) {
    try {
      await browser.close();
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "Browser verification and cleanup failed.",
      );
    }
    throw error;
  }
  await browser.close();
  return version;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const require = createRequire(
      new URL("../apps/docs/package.json", import.meta.url),
    );
    const { chromium } = require("@playwright/test") as {
      chromium: BrowserLauncher;
    };
    const { version } = require("@playwright/test/package.json") as {
      version: string;
    };
    const chromiumVersion = await verifyBrowserRuntime(chromium);
    console.log(
      `Browser runtime ready: Playwright ${version}, Chromium ${chromiumVersion}`,
    );
  } catch (error) {
    console.error("Browser runtime verification failed:", error);
    process.exitCode = 1;
  }
}
