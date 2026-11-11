import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { createServer, preview } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifacts = path.join(root, "artifacts");
const port = Number(process.env.VERIFY_PORT ?? 5199);
if (!Number.isInteger(port) || port <= 0 || port >= 65536) {
  throw new Error(`VERIFY_PORT must be a valid port, got ${process.env.VERIFY_PORT}`);
}
const url = `http://127.0.0.1:${port}/`;
const usePreview = process.argv.includes("--preview");

await mkdir(artifacts, { recursive: true });

const server = usePreview
  ? await preview({
      root,
      logLevel: "silent",
      preview: { host: "127.0.0.1", port, strictPort: true },
    })
  : await createServer({
      root,
      logLevel: "silent",
      server: { host: "127.0.0.1", port, strictPort: true },
    });
if (!usePreview) await server.listen();

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
  await page.getByRole("heading", { name: "Ledger", level: 2 }).waitFor();
  await page.getByRole("heading", { name: "Stamps", level: 2 }).waitFor();
  assert.equal(await page.locator(".focus-row .venture").count(), 1);
  assert.equal(await page.locator(".side .venture").count(), 0);
  assert.equal(await page.locator("#venture-title").count(), 1);
  assert.equal(await page.locator(".ledger-entry").count(), 0);
  assert.match(await page.locator(".ledger-empty").innerText(), /Nothing recorded yet/);
  assert.match(await page.locator(".stamps").innerText(), /0 of 8/);
  assert.equal(
    await page.locator(".stamp", { hasText: "First ship" }).getAttribute("data-earned"),
    "false",
  );

  const followers = () => page.locator('[data-resource="followers"] .resource-value').innerText();
  const cash = () => page.locator('[data-resource="cash"] .resource-value').innerText();
  const releasePanel = page.locator(".release");
  const edgeBadge = page.locator(".edge-badge");

  assert.equal(await followers(), "0");
  assert.match(await page.locator(".release-generation").innerText(), /Generation 1 of 10/);
  assert.match(await edgeBadge.innerText(), /×1\.5/);
  assert.equal(
    await page.getByRole("button", { name: /Upgrade subscription/ }).isDisabled(),
    true,
    "the first upgrade should be unaffordable at the starting 15 Cash",
  );
  assert.equal(await page.locator(".next-move").getAttribute("data-hint"), "start");
  assert.match(await page.locator(".next-move").innerText(), /Put someone to work/);

  const you = page.getByRole("article", { name: "You" });
  assert.equal(await you.getByRole("button", { name: /Find clients/ }).isDisabled(), true);
  assert.equal(await you.getByRole("button", { name: /Client work/ }).isDisabled(), true);

  await you.getByRole("button", { name: /Make content/ }).click();
  await page.waitForTimeout(2_500);
  const followersAfterTick = Number(await followers());
  assert.ok(followersAfterTick > 0, `followers should grow, got ${followersAfterTick}`);
  assert.match(await you.locator(".worker-live").innerText(), /^\+.*Followers\/s$/);
  assert.equal(
    await you.locator(".worker-dot").evaluate((el) => getComputedStyle(el).animationName),
    "worker-pulse",
    "a working card should pulse its live dot",
  );

  const youDiy = you.getByRole("button", { name: /Do it yourself/ });
  await youDiy.hover();
  await page.mouse.down();
  const pressTransform = await youDiy.evaluate((el) => getComputedStyle(el).transform);
  await page.mouse.up();
  assert.match(
    pressTransform,
    /matrix\(1, 0, 0, 1, 0, 1\)/,
    `pressing the button should shift it by 1px, got ${pressTransform}`,
  );
  await page.waitForFunction(
    () =>
      document.querySelector(".worker-state.is-worked") !== null &&
      document.querySelector(".resource-row.is-flashing") !== null,
    null,
    { timeout: 2_000 },
  );
  assert.equal(await you.locator(".worker-state.is-worked").innerText(), "WORKED");
  await page.waitForFunction(
    () =>
      document.querySelector(".worker-state.is-worked") === null &&
      document.querySelector(".resource-row.is-flashing") === null,
    null,
    { timeout: 3_000 },
  );
  await you.getByRole("button", { name: /Make content/ }).click();
  await page.waitForTimeout(100);
  const noOpFlash = await page.locator(".resource-row.is-flashing").count();
  assert.equal(noOpFlash, 0, "re-selecting the current activity should not flash the strip");

  for (let i = 0; i < 4; i += 1) {
    await you.getByRole("button", { name: /Do it yourself/ }).click();
  }
  const followersAfterClick = Number(await followers());
  assert.ok(
    followersAfterClick >= followersAfterTick + 0.5,
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
  assert.equal(parsed.version, 6);
  assert.equal(parsed.state.workers.length, 2);

  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Creator agent" }).waitFor();

  await page.getByRole("article", { name: "You" }).getByRole("button", { name: /Learn/ }).click();
  for (let i = 0; i < 22; i += 1) {
    await page.getByRole("article", { name: "You" }).getByRole("button", { name: /Do it yourself/ }).click();
  }
  await page.waitForFunction(
    () => document.querySelector(".ledger")?.textContent?.includes("Learn"),
    null,
    { timeout: 2_000 },
  );
  assert.match(await page.locator(".ledger").innerText(), /Learn/);
  await page.waitForTimeout(38_000);

  await page.waitForTimeout(500);
  const buildSeed = await page.evaluate(() => {
    const raw = localStorage.getItem("keep-up.save");
    if (!raw) throw new Error("no save to seed for the build");
    const data = JSON.parse(raw);
    data.savedAt = Date.now();
    data.state.ventureProgress = 259;
    data.state.resources.credits = 1_000;
    data.state.resources.knowHow = 1_000;
    return JSON.stringify(data);
  });
  await page.addInitScript((save) => localStorage.setItem("keep-up.save", save), buildSeed);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("article", { name: "You" }).getByRole("button", { name: /Build venture/ }).click();
  await page.getByRole("article", { name: "You" }).getByRole("button", { name: /Do it yourself/ }).click();
  await page.locator(".ship-stamp").waitFor({ timeout: 3_000 });
  assert.equal(await page.locator(".ship-stamp").innerText(), "SHIPPED");
  await page.getByRole("heading", { name: "Newsletter" }).waitFor();
  assert.match(await page.locator(".venture-count").innerText(), /1 shipped/);
  assert.match(await page.locator(".ledger").innerText(), /Shipped Prompt pack/);
  assert.equal(
    await page.locator(".stamp", { hasText: "First ship" }).getAttribute("data-earned"),
    "true",
  );
  assert.equal(
    await page.locator(".stamp", { hasText: "Five ventures" }).getAttribute("data-earned"),
    "false",
  );
  await page.waitForFunction(() => document.querySelector(".ship-stamp") === null, null, {
    timeout: 3_000,
  });
  assert.equal(await you.getByRole("button", { name: /Find clients/ }).isDisabled(), false);

  await page.waitForTimeout(5_500);
  const seededSave = await page.evaluate(() => {
    const raw = localStorage.getItem("keep-up.save");
    if (!raw) throw new Error("no save to seed");
    const data = JSON.parse(raw);
    data.savedAt = Date.now();
    data.state.venturesShipped = 2;
    data.state.ventureProgress = 0;
    data.state.elapsedSeconds = 150;
    data.state.resources.cash = 100;
    data.state.resources.knowHow = 20;
    return JSON.stringify(data);
  });
  await page.addInitScript((save) => localStorage.setItem("keep-up.save", save), seededSave);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Template shop" }).waitFor();
  assert.equal(
    await page.locator(".ship-stamp").count(),
    0,
    "a reload should not replay the SHIPPED stamp",
  );
  assert.equal(
    await page.locator(".ledger-entry").count(),
    0,
    "a reload should not replay old events",
  );
  assert.equal(
    await page.locator(".stamp", { hasText: "First ship" }).getAttribute("data-earned"),
    "true",
  );
  assert.equal(
    await page.locator(".stamp", { hasText: "Five ventures" }).getAttribute("data-earned"),
    "false",
  );

  assert.match(await page.locator(".release-generation").innerText(), /Generation 2 of 10/);
  assert.match(await edgeBadge.innerText(), /×1\.25/);
  assert.match(await releasePanel.innerText(), /Generation 2 is live/);
  assert.equal(await page.locator("[data-credits-rate]").getAttribute("data-credits-rate"), "1");

  await releasePanel.getByRole("button", { name: /Upgrade subscription/ }).click();
  await page.waitForTimeout(300);
  assert.match(await releasePanel.innerText(), /Tier 2 of 10/);
  assert.match(await edgeBadge.innerText(), /×1\.5/);
  assert.equal(
    await page.locator("[data-credits-rate]").getAttribute("data-credits-rate"),
    "1.5",
  );
  const cashAfterUpgrade = Number(await cash());
  assert.ok(
    cashAfterUpgrade >= 75 && cashAfterUpgrade < 85,
    `the upgrade should charge 25 Cash, got ${cashAfterUpgrade}`,
  );
  const edgeAfterUpgrade = (await edgeBadge.innerText()).trim();

  const followersBeforeAutomation = Number(await followers());
  await creator.getByRole("button", { name: /Record automation/ }).click();
  await page.waitForTimeout(300);
  assert.match(await creator.innerText(), /Automates Make content/);
  await creator.getByRole("button", { name: /Day job tasks/ }).click();
  await page.waitForTimeout(2_200);
  const followersAfterAutomation = Number(await followers());
  assert.ok(
    followersAfterAutomation > followersBeforeAutomation,
    "the recorded automation should keep making Followers after the worker moves",
  );

  await page.getByRole("tab", { name: "Prompt library" }).click();
  assert.match(
    await page.getByRole("tabpanel", { name: "Prompt library" }).innerText(),
    /Level 0/,
  );

  await page.getByRole("tab", { name: "Skills" }).click();
  const skillsPanel = page.getByRole("tabpanel", { name: "Skills" });
  const knowHowBefore = Number(
    await page.locator('[data-resource="knowHow"] .resource-value').innerText(),
  );
  assert.ok(knowHowBefore >= 10, `Know-how should reach 10, got ${knowHowBefore}`);
  const ledgerBefore = await page.locator(".ledger-entry").count();
  await skillsPanel.getByRole("button", { name: /Buy Skills level/ }).click();
  await page.waitForTimeout(300);
  assert.match(await skillsPanel.innerText(), /Level 1/);
  assert.equal(
    await page.locator(".ledger-entry").count(),
    ledgerBefore + 1,
    "one purchase should add one ledger line",
  );
  assert.match(await page.locator(".ledger").innerText(), /Skills level 1/);
  const knowHowAfter = Number(
    await page.locator('[data-resource="knowHow"] .resource-value').innerText(),
  );
  assert.ok(knowHowAfter < knowHowBefore, "buying Skills should spend Know-how");

  await page.screenshot({ path: path.join(artifacts, "desktop.png"), fullPage: true });

  const minButton = await page.evaluate(() => {
    const heights = [...document.querySelectorAll("button")]
      .map((button) => button.getBoundingClientRect().height)
      .filter((height) => height > 0);
    return heights.length ? Math.min(...heights) : 0;
  });
  assert.ok(minButton >= 44, `buttons should be at least 44px, got ${minButton}`);

  const desktopOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  assert.ok(desktopOverflow <= 1, `desktop horizontal overflow: ${desktopOverflow}`);

  await page.getByRole("tab", { name: "Your data" }).click();
  const dataPanel = page.getByRole("tabpanel", { name: "Your data" });
  assert.match(await dataPanel.innerText(), /Clearing site data erases it/);
  await dataPanel.getByRole("button", { name: "Reset progress" }).click();
  assert.match(await page.getByRole("alertdialog").innerText(), /Reset all progress/);
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();
  assert.equal(await page.getByRole("button", { name: "Reset progress" }).count(), 1);
  await page.getByRole("button", { name: "Reset progress" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Yes, reset" }).click();
  await page.waitForTimeout(300);
  assert.equal(await cash(), "15");
  assert.match(await page.locator(".crew > .section-head p").innerText(), /1 of 6/);
  assert.equal(await page.locator(".ledger-entry").count(), 0, "reset should clear the ledger");
  assert.match(await page.locator(".stamps").innerText(), /0 of 8/);
  const resetWorked = true;

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
  assert.equal(await mobilePage.locator(".timeline li").count(), 10);
  assert.equal(await mobilePage.locator(".next-move").count(), 1);
  assert.match(await mobilePage.locator(".next-move").innerText(), /Put someone to work/);
  assert.equal(await mobilePage.getByRole("tab", { name: "Your data" }).count(), 1);
  assert.equal(await mobilePage.locator(".worker-live").innerText(), "Waiting for a task");
  assert.equal(await mobilePage.locator('.agent-mark[data-kind="you"]').innerText(), "Y");
  assert.equal(await mobilePage.locator(".ledger-entry").count(), 0);
  assert.match(await mobilePage.locator(".stamps").innerText(), /0 of 8/);
  const ventureBox = await mobilePage.locator(".venture").boundingBox();
  const crewBox = await mobilePage.locator(".crew").boundingBox();
  assert.ok(
    ventureBox !== null && crewBox !== null && ventureBox.y < crewBox.y,
    "the venture should precede the crew at 390",
  );
  assert.equal(await mobilePage.locator(".side .venture").count(), 0);
  assert.equal(await mobilePage.locator(".venture-eta").innerText(), "No ETA yet");
  assert.match(
    await mobilePage
      .getByRole("tabpanel", { name: "Prompt library" })
      .locator(".upgrade-preview")
      .innerText(),
    /Now \+0% → next \+8%/,
  );
  assert.equal(
    await mobilePage.locator(".worker-dot").evaluate((el) => getComputedStyle(el).animationName),
    "none",
    "an idle card should not pulse",
  );

  const mobileOverflow = await mobilePage.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  assert.ok(mobileOverflow <= 1, `mobile horizontal overflow: ${mobileOverflow}`);
  await mobilePage.screenshot({ path: path.join(artifacts, "mobile.png"), fullPage: true });

  await mobilePage.getByRole("tab", { name: "Your data" }).click();
  assert.match(
    await mobilePage.getByRole("tabpanel", { name: "Your data" }).innerText(),
    /Clearing site data erases it/,
  );
  assert.equal(await mobilePage.getByRole("button", { name: "Reset progress" }).count(), 1);
  const mobileMinButton = await mobilePage.evaluate(() => {
    const heights = [...document.querySelectorAll("button")]
      .map((button) => button.getBoundingClientRect().height)
      .filter((height) => height > 0);
    return heights.length ? Math.min(...heights) : 0;
  });
  assert.ok(mobileMinButton >= 44, `mobile buttons should be at least 44px, got ${mobileMinButton}`);

  const gateData = JSON.parse(seededSave);
  gateData.savedAt = Date.now();
  gateData.state.venturesShipped = 5;
  gateData.state.ventureProgress = 0;
  gateData.state.resources.followers = 0;
  const gateContext = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  await gateContext.addInitScript(
    (save) => localStorage.setItem("keep-up.save", save),
    JSON.stringify(gateData),
  );
  const gatePage = await gateContext.newPage();
  await gatePage.goto(url, { waitUntil: "networkidle" });
  await gatePage.getByRole("heading", { name: "Browser extension" }).waitFor();
  assert.match(await gatePage.locator(".gate").innerText(), /1\.1M Followers/);
  assert.equal(
    await gatePage.locator(".venture-eta").count(),
    0,
    "a gated venture should show no ETA",
  );
  assert.equal(
    await gatePage.getByRole("article", { name: "You" }).locator(".worker-live").innerText(),
    "Needs 1.1M Followers",
    "a gated builder should say why it is not working",
  );
  assert.equal(
    await gatePage
      .getByRole("article", { name: "You" })
      .getByRole("button", { name: /Build venture/ })
      .isDisabled(),
    true,
  );
  assert.equal(
    await gatePage
      .getByRole("article", { name: "You" })
      .getByRole("button", { name: /Do it yourself/ })
      .isDisabled(),
    true,
  );
  await gateContext.close();

  const crewKinds = ["you", "assistant", "creator", "scout", "tutor", "builder"];
  const crewActivities = ["content", "dayJob", "content", "findClients", "learn", "build"];
  const crewData = JSON.parse(seededSave);
  crewData.savedAt = Date.now();
  crewData.state.venturesShipped = 2;
  crewData.state.ventureProgress = 0;
  crewData.state.resources.followers = 10;
  crewData.state.resources.credits = 100;
  crewData.state.resources.knowHow = 100;
  crewData.state.resources.leads = 100;
  crewData.state.workers = crewKinds.map((kind, index) => ({
    ...crewData.state.workers[0],
    id: index === 0 ? "you" : `agent-${index}`,
    kind,
    activity: crewActivities[index],
    automation: null,
  }));
  crewData.state.nextAgentNumber = 6;
  const crewContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await crewContext.addInitScript(
    (save) => localStorage.setItem("keep-up.save", save),
    JSON.stringify(crewData),
  );
  const crewPage = await crewContext.newPage();
  crewPage.on("console", (message) => {
    if (message.type() === "error") errors.push(`crew console: ${message.text()}`);
  });
  crewPage.on("pageerror", (error) => errors.push(`crew pageerror: ${error.message}`));
  await crewPage.goto(url, { waitUntil: "networkidle" });
  await crewPage.getByRole("heading", { name: "Builder agent" }).waitFor();
  const crewMarks = await crewPage.locator(".agent-mark").evaluateAll((nodes) =>
    nodes.map((node) => ({
      mark: node.textContent,
      kind: node.getAttribute("data-kind"),
      hidden: node.getAttribute("aria-hidden"),
    })),
  );
  assert.deepEqual(
    crewMarks.map((node) => node.mark),
    ["Y", "A", "C", "S", "T", "B"],
    "every kind should render its monogram",
  );
  assert.deepEqual(crewMarks.map((node) => node.kind), crewKinds);
  assert.ok(crewMarks.every((node) => node.hidden === "true"), "monograms are decorative");
  const crewLive = await crewPage.locator(".worker-live").evaluateAll((nodes) =>
    nodes.map((node) => ({ state: node.getAttribute("data-state"), text: node.innerText })),
  );
  assert.equal(crewLive.length, 6);
  assert.ok(
    crewLive.every((node) => node.state === "working"),
    `all six should be working: ${JSON.stringify(crewLive)}`,
  );
  assert.ok(
    crewLive.every((node) => /^\+\S+ (Followers|Know-how|Leads|Cash|pts)\/s$/.test(node.text)),
    `every live chip should name a rate: ${JSON.stringify(crewLive)}`,
  );
  const unitByKind = {
    you: "Followers/s",
    assistant: "Cash/s",
    creator: "Followers/s",
    scout: "Leads/s",
    tutor: "Know-how/s",
    builder: "pts/s",
  };
  assert.ok(
    crewLive.every((node, index) =>
      node.text.endsWith(` ${unitByKind[crewMarks[index].kind]}`),
    ),
    `each chip should match its kind: ${JSON.stringify(crewLive)}`,
  );
  assert.equal(
    await crewPage
      .locator('.worker-live[data-state="working"] .worker-dot')
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
    "worker-pulse",
  );
  await crewPage.screenshot({ path: path.join(artifacts, "crew.png"), fullPage: true });
  await crewContext.close();

  const stallData = JSON.parse(seededSave);
  stallData.savedAt = Date.now();
  stallData.state.venturesShipped = 1;
  stallData.state.ventureProgress = 0;
  stallData.state.resources.leads = 0;
  stallData.state.resources.followers = 0;
  stallData.state.workers = [stallData.state.workers[0]];
  stallData.state.workers[0].activity = "clientWork";
  stallData.state.nextAgentNumber = 1;
  const stallContext = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  await stallContext.addInitScript(
    (save) => localStorage.setItem("keep-up.save", save),
    JSON.stringify(stallData),
  );
  const stallPage = await stallContext.newPage();
  await stallPage.goto(url, { waitUntil: "networkidle" });
  const stallYou = stallPage.getByRole("article", { name: "You" });
  await stallYou.locator(".worker-live").waitFor();
  assert.equal(await stallYou.locator(".worker-live").getAttribute("data-state"), "blocked");
  assert.equal(await stallYou.locator(".worker-live").innerText(), "Needs Leads");
  assert.equal(
    await stallYou.locator(".worker-dot").evaluate((el) => getComputedStyle(el).animationName),
    "none",
    "a stalled card should not pulse",
  );
  assert.equal(
    await stallYou.getByRole("button", { name: /Do it yourself/ }).isDisabled(),
    true,
    "a stalled worker should not offer a dead click",
  );
  await stallContext.close();

  const forecastData = JSON.parse(seededSave);
  forecastData.savedAt = Date.now();
  forecastData.state.venturesShipped = 2;
  forecastData.state.ventureProgress = 0;
  forecastData.state.resources.followers = 10;
  forecastData.state.resources.credits = 1000;
  forecastData.state.resources.knowHow = 1000;
  forecastData.state.workers = [forecastData.state.workers[0]];
  forecastData.state.workers[0].activity = "build";
  const tutor = {
    ...structuredClone(forecastData.state.workers[0]),
    id: "agent-1",
    kind: "tutor",
    activity: "learn",
    automation: null,
  };
  forecastData.state.workers.push(tutor);
  forecastData.state.nextAgentNumber = 2;
  const forecastContext = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  await forecastContext.addInitScript(
    (save) => localStorage.setItem("keep-up.save", save),
    JSON.stringify(forecastData),
  );
  const forecastPage = await forecastContext.newPage();
  forecastPage.on("console", (message) => {
    if (message.type() === "error") errors.push(`forecast console: ${message.text()}`);
  });
  forecastPage.on("pageerror", (error) => errors.push(`forecast pageerror: ${error.message}`));
  await forecastPage.goto(url, { waitUntil: "networkidle" });
  const forecastEta = await forecastPage.locator(".venture-eta").innerText();
  assert.match(forecastEta, /^About .+ to ship$/, `venture ETA: ${forecastEta}`);
  const promptPreview = await forecastPage
    .getByRole("tabpanel", { name: "Prompt library" })
    .innerText();
  assert.match(promptPreview, /Now \+0% → next \+8%/);
  assert.match(promptPreview, /Affordable now/);
  await forecastPage.getByRole("tab", { name: "Skills" }).click();
  const skillsPreview = await forecastPage
    .getByRole("tabpanel", { name: "Skills" })
    .innerText();
  assert.match(skillsPreview, /Now \+0% → next \+10%/);
  assert.match(skillsPreview, /Affordable now/);
  await forecastContext.close();

  const wonData = JSON.parse(seededSave);
  wonData.savedAt = Date.now();
  wonData.state.venturesShipped = 9;
  wonData.state.ventureProgress = 18_329_999;
  wonData.state.resources.followers = 13_000_000;
  wonData.state.resources.credits = 1_000_000;
  wonData.state.resources.knowHow = 1_000_000;
  wonData.state.workers = [wonData.state.workers[0]];
  wonData.state.workers[0].activity = "build";
  wonData.state.nextAgentNumber = 1;
  const wonContext = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  await wonContext.addInitScript(
    (save) => localStorage.setItem("keep-up.save", save),
    JSON.stringify(wonData),
  );
  const wonPage = await wonContext.newPage();
  wonPage.on("console", (message) => {
    if (message.type() === "error") errors.push(`won console: ${message.text()}`);
  });
  wonPage.on("pageerror", (error) => errors.push(`won pageerror: ${error.message}`));
  await wonPage.goto(url, { waitUntil: "networkidle" });
  await wonPage.getByRole("heading", { name: "Product portfolio" }).waitFor();
  await wonPage
    .getByRole("article", { name: "You" })
    .getByRole("button", { name: /Do it yourself/ })
    .click();
  await wonPage.locator(".ship-stamp").waitFor({ timeout: 3_000 });
  assert.equal(await wonPage.locator(".ship-stamp").innerText(), "SHIPPED");
  await wonPage.getByRole("heading", { name: "All ten shipped" }).waitFor();
  await wonContext.close();

  const offlineData = JSON.parse(seededSave);
  offlineData.savedAt = Date.now() - 3_600_000;
  offlineData.state.elapsedSeconds = 150;
  offlineData.state.resources.cash = 100;
  offlineData.state.resources.knowHow = 20;
  offlineData.state.workers[0].activity = "content";
  const offlineContext = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  await offlineContext.addInitScript(
    (save) => localStorage.setItem("keep-up.save", save),
    JSON.stringify(offlineData),
  );
  const offlinePage = await offlineContext.newPage();
  offlinePage.on("console", (message) => {
    if (message.type() === "error") errors.push(`offline console: ${message.text()}`);
  });
  offlinePage.on("pageerror", (error) => errors.push(`offline pageerror: ${error.message}`));
  offlinePage.on("response", (response) => {
    if (response.status() >= 400) {
      errors.push(`offline response ${response.status()}: ${response.url()}`);
    }
  });
  await offlinePage.goto(url, { waitUntil: "networkidle" });
  await offlinePage.locator(".welcome").waitFor();
  const welcomeText = await offlinePage.locator(".welcome").innerText();
  assert.match(welcomeText, /While you were away/);
  assert.match(welcomeText, /1h of work/);
  await offlinePage.screenshot({ path: path.join(artifacts, "welcome.png"), fullPage: true });
  await offlinePage.getByRole("button", { name: "Dismiss welcome-back summary" }).click();
  await offlinePage.waitForTimeout(200);
  assert.equal(await offlinePage.locator(".welcome").count(), 0);
  await offlineContext.close();
  const offlineReported = true;

  const reducedContext = await browser.newContext({
    viewport: { width: 1000, height: 900 },
    reducedMotion: "reduce",
  });
  const reducedPage = await reducedContext.newPage();
  reducedPage.on("console", (message) => {
    if (message.type() === "error") errors.push(`reduced console: ${message.text()}`);
  });
  reducedPage.on("pageerror", (error) => errors.push(`reduced pageerror: ${error.message}`));
  await reducedPage.goto(url, { waitUntil: "networkidle" });
  const reducedYou = reducedPage.getByRole("article", { name: "You" });
  await reducedYou.getByRole("button", { name: /Make content/ }).click();
  const reducedDiy = reducedYou.getByRole("button", { name: /Do it yourself/ });
  await reducedDiy.hover();
  await reducedPage.mouse.down();
  const reducedPress = await reducedDiy.evaluate((el) => getComputedStyle(el).transform);
  await reducedPage.mouse.up();
  assert.equal(reducedPress, "none", `reduced motion should drop the press shift, got ${reducedPress}`);
  await reducedPage.waitForFunction(
    () =>
      document.querySelector(".worker-state.is-worked") !== null &&
      document.querySelector(".resource-row.is-flashing") !== null,
    null,
    { timeout: 2_000 },
  );
  const reducedStyles = await reducedPage.evaluate(() => {
    const stamp = document.querySelector(".worker-state.is-worked");
    const row = document.querySelector(".resource-row.is-flashing");
    const cell = row?.querySelector(".resource");
    const dot = document.querySelector('.worker-live[data-state="working"] .worker-dot');
    return {
      stampAnimation: stamp ? getComputedStyle(stamp).animationName : "missing",
      stampTransform: stamp ? getComputedStyle(stamp).transform : "missing",
      flashAnimation: cell ? getComputedStyle(cell).animationName : "missing",
      flashBackground: cell ? getComputedStyle(cell).backgroundColor : "missing",
      dotAnimation: dot ? getComputedStyle(dot).animationName : "missing",
    };
  });
  assert.equal(reducedStyles.stampAnimation, "none", "the stamp animation should be removed");
  assert.equal(reducedStyles.stampTransform, "none", "the stamp rotation should be removed");
  assert.equal(reducedStyles.flashAnimation, "none", "the strip animation should be removed");
  assert.equal(
    reducedStyles.flashBackground,
    "rgb(247, 230, 200)",
    "the static flash tint should remain under reduced motion",
  );
  assert.equal(reducedStyles.dotAnimation, "none", "the live pulse should be removed");
  assert.match(
    await reducedPage.locator(".worker-live").innerText(),
    /Followers\/s/,
    "reduced motion should keep the output text",
  );
  await reducedContext.close();
  const reducedVerified = true;

  assert.deepEqual(errors, [], `browser errors: ${errors.join("; ")}`);

  console.log(
    JSON.stringify(
      {
        desktop: { followersAfterTick, followersAfterClick, minButton, overflow: desktopOverflow },
        mobile: { overflow: mobileOverflow, minButton: mobileMinButton },
        release: { generationAtSeed: 2, edgeAfterUpgrade, cashAfterUpgrade },
        ui: { hint: "start", resetWorked, offlineReported, reducedVerified },
        feedback: { pressTransform, reducedPress, reducedStyles, noOpFlash },
        crew: {
          marks: crewMarks.map((node) => node.mark).join(""),
          states: crewLive.map((node) => node.state),
          chips: crewLive.map((node) => node.text),
        },
        screenshots: ["artifacts/desktop.png", "artifacts/mobile.png", "artifacts/welcome.png", "artifacts/crew.png"],
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  await server.close();
}
