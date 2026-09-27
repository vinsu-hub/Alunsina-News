// DATABASE_URL= PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/e2e-admin.mjs
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { parseEnv } from "node:util";
assert.equal(
  process.env.DATABASE_URL,
  "",
  "Explicitly set DATABASE_URL= for local-only verification",
);
const env = parseEnv(await readFile(".env.local", "utf8"));
assert.ok(
  env.ADMIN_PASSWORD && env.ADMIN_SESSION_SECRET,
  "Local admin credentials are required",
);
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const base = process.env.BASE_URL || "http://localhost:3100";
assert.ok(
  new URL(base).hostname === "localhost",
  "This test mutates only the local development app",
);
const browser = await chromium.launch();
const errors = [];
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  extraHTTPHeaders: { "x-forwarded-for": `w2b-${Date.now()}` },
});
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (dialog) => dialog.accept());
await mkdir(".playwright-mcp", { recursive: true });
const stamp = Date.now();
const name = `Sample E2E journalist ${stamp}`,
  topic = `Sample E2E pending pitch ${stamp}`;
async function open(url) {
  const response = await page.goto(base + url);
  assert.equal(response.status(), 200, url);
}
async function success(form) {
  await form.locator('[role="status"]').waitFor();
  assert.match(
    await form.locator('[role="status"]').innerText(),
    /Saved successfully|Publication recorded|CSV exported/,
  );
}
async function shot(name, width) {
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    `${name} overflows at ${width}`,
  );
  assert.equal(
    await page.locator("header").count(),
    name === "login" ? 0 : 1,
    "public masthead must not render",
  );
  await page.screenshot({
    path: `.playwright-mcp/codex-w2b-${name}-${width}.png`,
    fullPage: true,
    caret: "initial",
  });
}
try {
  await open("/admin/login");
  await page
    .getByLabel("Password", { exact: true })
    .fill("intentionally-wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Incorrect password" })
    .waitFor();
  await page.getByLabel("Password", { exact: true }).fill(env.ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(base + "/admin");
  await page.getByRole("heading", { name: "Overview", exact: true }).waitFor();
  await open("/admin/contributors");
  const create = page.locator("details").filter({
    has: page.locator("summary", { hasText: /^Create contributor$/ }),
  });
  await create.locator("summary").click();
  await create.getByLabel("Name", { exact: true }).fill(name);
  await create
    .getByLabel("Credentials", { exact: true })
    .fill("Sample local browser verification");
  await create
    .getByLabel("Biography", { exact: true })
    .fill("Fictional browser-test contributor, not a real journalist.");
  await create
    .getByRole("button", { name: "Create contributor", exact: true })
    .click();
  await success(create);
  let contributor = page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name, exact: true }) });
  await contributor
    .getByRole("button", { name: "Verify", exact: true })
    .click();
  await contributor
    .getByRole("button", { name: "Unverify", exact: true })
    .waitFor();
  const profilePath = await contributor
    .getByRole("link", { name: "Public profile ↗" })
    .getAttribute("href");
  await open("/admin/pitches");
  const pitchCreate = page
    .locator("details")
    .filter({ has: page.locator("summary", { hasText: /^Create pitch$/ }) });
  await pitchCreate.locator("summary").click();
  await pitchCreate
    .getByLabel("Verified, active contributor")
    .selectOption({ label: name });
  await pitchCreate.getByLabel("Topic", { exact: true }).fill(topic);
  await pitchCreate
    .getByLabel("Reporting angle")
    .fill("Fictional reporting angle for the local acceptance test.");
  await pitchCreate.getByLabel("Timeframe").fill("This week");
  await pitchCreate
    .getByRole("button", { name: "Create pitch", exact: true })
    .click();
  await success(pitchCreate);
  const pitch = page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: topic, exact: true }) });
  await pitch
    .locator("summary", { hasText: "Edit pitch / record status" })
    .click();
  await pitch
    .getByLabel("Status reported by journalist")
    .selectOption("in_progress");
  const edit = pitch
    .locator("form")
    .filter({ has: page.getByLabel("Status reported by journalist") });
  await edit.getByRole("button", { name: "Save changes" }).click();
  await success(edit);
  await pitch
    .locator(".admin-badge")
    .filter({ hasText: /^in progress$/ })
    .waitFor();
  await pitch.locator("summary", { hasText: "Record publication" }).click();
  await pitch
    .getByLabel("Published URL")
    .fill(`https://example.com/w2b-${stamp}`);
  await pitch.getByLabel("Headline", { exact: true }).fill(topic);
  await pitch
    .getByLabel("Excerpt — at most two sentences")
    .fill(
      "This is a sample local publication. It remains held pending screening.",
    );
  await pitch
    .getByRole("button", { name: "Record publication", exact: true })
    .click();
  await pitch.getByText("Publication screen", { exact: true }).waitFor();
  await pitch
    .locator(".admin-badge")
    .filter({ hasText: /^published$/ })
    .waitFor();
  assert.equal(
    await pitch
      .locator(".admin-badge")
      .filter({ hasText: /^pending$/ })
      .count(),
    2,
  );
  await open("/experts/reporting");
  assert.equal(
    await page.getByText(topic, { exact: true }).count(),
    0,
    "pending pitch must not be public",
  );
  await open(profilePath);
  assert.equal(
    await page.getByText(topic, { exact: true }).count(),
    0,
    "pending pitch must not appear on profile",
  );
  await open("/story/metro-manila-lgus-prepare-flooding");
  await page
    .getByRole("button", { name: "This doesn't belong here", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Optional note (up to 500 characters)")
    .first()
    .fill(`Sample E2E correction ${stamp}`);
  await page
    .getByRole("button", { name: "Flag for review", exact: true })
    .first()
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Thanks, flagged for review" })
    .waitFor();
  await open("/admin/flags");
  const flag = page
    .locator("article")
    .filter({ hasText: `Sample E2E correction ${stamp}` });
  assert.ok(
    await flag.count(),
    "Seeded database must provide an open correction flag",
  );
  await flag
    .getByLabel("Resolution note")
    .fill(`Reviewed sample correction in browser acceptance test ${stamp}.`);
  await flag.getByRole("button", { name: "Record resolution" }).click();
  await page.getByRole("link", { name: "Resolved", exact: true }).click();
  await page
    .getByText(
      `Resolution: Reviewed sample correction in browser acceptance test ${stamp}.`,
      { exact: true },
    )
    .waitFor();
  await open("/admin/stories");
  const story = page.locator("article").first();
  await story.getByRole("button", { name: "Hide story", exact: true }).click();
  await story
    .getByRole("button", { name: "Unhide story", exact: true })
    .waitFor();
  await story
    .getByRole("button", { name: "Unhide story", exact: true })
    .click();
  await story
    .getByRole("button", { name: "Hide story", exact: true })
    .waitFor();
  await open("/admin/newsletter");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const file = await download;
  assert.equal(file.suggestedFilename(), "alunsina-newsletter.csv");
  await file.saveAs("/private/tmp/alunsina-w2b-newsletter.csv");
  assert.match(
    await readFile("/private/tmp/alunsina-w2b-newsletter.csv", "utf8"),
    /^email,created_at,confirmed/,
  );
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const route of [
      "",
      "contributors",
      "pitches",
      "flags",
      "stories",
      "sources",
      "commentary",
      "newsletter",
      "audit",
    ]) {
      await open("/admin" + (route ? "/" + route : ""));
      await page.getByRole("heading", { level: 1 }).waitFor();
      await shot(route || "overview", width);
    }
  }
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await page.waitForURL(base + "/admin/login");
  await page.goto(base + "/admin");
  await page.waitForURL(/\/admin\/login/);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await shot("login", width);
  }
  assert.equal(
    (await context.request.get(base + "/api/admin/session")).status(),
    401,
  );
  // Catch-all routing must preserve each endpoint's methods and auth boundary.
  assert.equal((await context.request.get(base + "/api/stories?ids=metro-manila-lgus-prepare-flooding")).status(), 200);
  assert.equal((await context.request.get(base + "/api/stories/area?region=r4a&place=San%20Pablo&province=Laguna")).status(), 200);
  assert.equal((await context.request.get(base + "/api/stories/unknown")).status(), 404);
  assert.equal((await context.request.post(base + "/api/ingest")).status(), 401);
  assert.equal((await context.request.post(base + "/api/admin/login/extra")).status(), 401);
  assert.equal((await context.request.get(base + "/api/admin/login")).status(), 405);
  assert.equal((await context.request.post(base + "/api/admin/login", {
    headers: { origin: "https://example.com" },
    data: { password: env.ADMIN_PASSWORD },
  })).status(), 403);
  const jsonLogin = await context.request.post(base + "/api/admin/login", {
    data: { password: env.ADMIN_PASSWORD },
  });
  assert.equal(jsonLogin.status(), 200);
  assert.deepEqual(await jsonLogin.json(), { ok: true });
  for (const attribute of [/alunsina_admin=/, /; HttpOnly/i, /; Secure/i, /; SameSite=lax/i]) {
    assert.match(jsonLogin.headers()["set-cookie"], attribute);
  }
  const session = await context.request.get(base + "/api/admin/session");
  assert.equal(session.status(), 200);
  assert.deepEqual(await session.json(), { authenticated: true });
  assert.equal((await context.request.post(base + "/api/admin/session")).status(), 405);
  assert.equal((await context.request.get(base + "/api/admin/logout")).status(), 405);
  assert.equal((await context.request.get(base + "/api/admin/ingest")).status(), 405);
  assert.equal((await context.request.get(base + "/api/admin/pitches/missing/publish")).status(), 405);
  assert.equal((await context.request.post(base + "/api/admin/pitches/missing/publish", {
    data: {},
  })).status(), 400);
  assert.equal((await context.request.get(base + "/api/admin/unknown")).status(), 404);
  const options = await context.request.fetch(base + "/api/admin/session", { method: "OPTIONS" });
  assert.equal(options.status(), 204);
  assert.equal(options.headers().allow, "GET, HEAD, OPTIONS");
  assert.equal((await context.request.post(base + "/api/admin/logout")).status(), 200);
  assert.equal((await context.request.get(base + "/api/admin/session")).status(), 401);
  const limited = await browser.newContext({
    extraHTTPHeaders: { "x-forwarded-for": `w2b-limit-${stamp}` },
  });
  for (let i = 0; i < 5; i++) {
    assert.equal(
      (
        await limited.request.post(base + "/api/admin/login", {
          data: { password: "intentionally-wrong" },
        })
      ).status(),
      401,
    );
  }
  const limitPage = await limited.newPage();
  await limitPage.goto(base + "/admin/login");
  await limitPage
    .getByLabel("Password", { exact: true })
    .fill("intentionally-wrong");
  await limitPage.getByRole("button", { name: "Sign in", exact: true }).click();
  await limitPage
    .getByRole("alert")
    .filter({ hasText: "Too many attempts" })
    .waitFor();
  await limited.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: login and rate limit, contributor verification, held pitch publication, flag resolution, hide/unhide, CSV, logout; 20 responsive screenshots; no page errors.",
  );
} finally {
  await browser.close();
}
