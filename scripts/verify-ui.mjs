import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { createServer } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifacts = path.join(root, "artifacts");
const url = "http://127.0.0.1:5199/";

await mkdir(artifacts, { recursive: true });

const server = await createServer({
  root,
  logLevel: "silent",
  server: { host: "127.0.0.1", port: 5199, strictPort: true },
});
await server.listen();

let browser;
const errors = [];

try {
  browser = await chromium.launch({ channel: "chrome", headless: true });

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await desktop.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      errors.push(`response ${response.status()}: ${response.url()}`);
    }
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Keep Up", level: 1 }).waitFor();

  const followers = () => page.locator('[data-resource="followers"] .resource-value').innerText();
  const cash = () => page.locator('[data-resource="cash"] .resource-value').innerText();

  assert.equal(await followers(), "0");

  const you = page.getByRole("article", { name: "You" });
  await you.getByRole("button", { name: /Make content/ }).click();
  await page.waitForTimeout(2_500);
  const followersAfterTick = Number(await followers());
  assert.ok(followersAfterTick > 0, `followers should grow, got ${followersAfterTick}`);

  for (let i = 0; i < 4; i += 1) {
    await you.getByRole("button", { name: /Do it yourself/ }).click();
  }
  const followersAfterClick = Number(await followers());
  assert.ok(
    followersAfterClick >= followersAfterTick + 7,
    `active play should add followers, got ${followersAfterClick}`,
  );

  await you.getByRole("button", { name: /Day job tasks/ }).click();
  for (let i = 0; i < 34; i += 1) {
    await you.getByRole("button", { name: /Do it yourself/ }).click();
  }
  assert.ok(Number(await cash()) >= 40, `cash should reach 40, got ${await cash()}`);

  await page.getByRole("button", { name: /Hire Creator agent/ }).click();
  await page.getByRole("heading", { name: "Creator agent" }).waitFor();
  const creator = page.getByRole("article", { name: "Creator agent" });
  await creator.getByRole("button", { name: /Make content/ }).click();
  await page.waitForTimeout(5_500);

  const saved = await page.evaluate(() => localStorage.getItem("keep-up.save"));
  assert.ok(saved, "autosave should write to localStorage");
  const parsed = JSON.parse(saved);
  assert.equal(parsed.version, 3);
  assert.equal(parsed.state.workers.length, 2);

  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Creator agent" }).waitFor();

  await page.getByRole("article", { name: "You" }).getByRole("button", { name: /Learn/ }).click();
  for (let i = 0; i < 22; i += 1) {
    await page.getByRole("article", { name: "You" }).getByRole("button", { name: /Do it yourself/ }).click();
  }
  await page.waitForTimeout(38_000);

  await page.getByRole("article", { name: "You" }).getByRole("button", { name: /Build venture/ }).click();
  for (let i = 0; i < 36; i += 1) {
    await page.getByRole("article", { name: "You" }).getByRole("button", { name: /Do it yourself/ }).click();
  }
  await page.getByRole("heading", { name: "Newsletter" }).waitFor();
  assert.match(await page.locator(".venture-count").innerText(), /1 shipped/);

  await page.screenshot({ path: path.join(artifacts, "desktop.png"), fullPage: true });

  const minButton = await page.evaluate(() => {
    const heights = [...document.querySelectorAll("button")].map(
      (button) => button.getBoundingClientRect().height,
    );
    return heights.length ? Math.min(...heights) : 0;
  });
  assert.ok(minButton >= 44, `buttons should be at least 44px, got ${minButton}`);

  const desktopOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  assert.ok(desktopOverflow <= 1, `desktop horizontal overflow: ${desktopOverflow}`);

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobile.newPage();
  mobilePage.on("console", (message) => {
    if (message.type() === "error") errors.push(`mobile console: ${message.text()}`);
  });
  mobilePage.on("pageerror", (error) => errors.push(`mobile pageerror: ${error.message}`));
  mobilePage.on("response", (response) => {
    if (response.status() >= 400) {
      errors.push(`mobile response ${response.status()}: ${response.url()}`);
    }
  });
  await mobilePage.goto(url, { waitUntil: "networkidle" });
  await mobilePage.getByRole("heading", { name: "Keep Up", level: 1 }).waitFor();

  const mobileOverflow = await mobilePage.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  assert.ok(mobileOverflow <= 1, `mobile horizontal overflow: ${mobileOverflow}`);
  await mobilePage.screenshot({ path: path.join(artifacts, "mobile.png"), fullPage: true });

  assert.deepEqual(errors, [], `browser errors: ${errors.join("; ")}`);

  console.log(
    JSON.stringify(
      {
        desktop: { followersAfterTick, followersAfterClick, minButton, overflow: desktopOverflow },
        mobile: { overflow: mobileOverflow },
        screenshots: ["artifacts/desktop.png", "artifacts/mobile.png"],
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  await server.close();
}
