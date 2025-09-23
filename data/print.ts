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

/** set page styles */
await page.emulateMedia({ media: "print" });

/** wait for app to fully load and render */
await page.waitForTimeout(1 * 1000);

/** print pdf */
await page.pdf({
  path: "poster.pdf",
  preferCSSPageSize: true,
  printBackground: true,
  pageRanges: "1",
});

/** close */
preview.kill();
await browser.close();

/** open pdf */
execSync("open poster.pdf");
