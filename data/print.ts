import { exec, execSync } from "child_process";
import playwright from "playwright";
import stripAnsi from "strip-ansi";

/** set up browser instance, page, etc */
const browser = await playwright.chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

/** preview poster */
const preview = exec(
  `bunx live-server --no-browser`,
  /** suppress console prints */
  () => null
);

/** wait for preview to be ready */
const url = await new Promise<string>((resolve, reject) => {
  preview.stdout?.on("data", (chunk: string) => {
    const [, url] = stripAnsi(chunk).match(/Serving .+? at (.+)/) ?? [];
    if (url) resolve(url);
  });
  setTimeout(() => reject("Waiting for preview timed out"), 5 * 1000);
});

/** go to preview  */
await page.goto(url + "/poster");

/** wait for app to render */
await page.emulateMedia({ media: "print" });

/** wait for full page load */
await page.waitForTimeout(3 * 1000);

/** print pdf */
const margin = 1 * 96;
await page.pdf({
  path: "poster.pdf",
  preferCSSPageSize: true,
  printBackground: true,
  margin: { left: margin, top: margin, right: margin, bottom: margin },
});

/** close */
preview.kill();
await browser.close();

/** open pdf */
execSync("open poster.pdf");
