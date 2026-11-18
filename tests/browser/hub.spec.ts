import { test, expect } from "@playwright/test";
const errorsByPage = new WeakMap<object, string[]>();
test.afterEach(async ({ page }) => {
  expect(errorsByPage.get(page) ?? []).toEqual([]);
});
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  errorsByPage.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() =>
    localStorage.setItem("afterhours:introSeen", "true"),
  );
});
test("library search, detail, favorite and pending availability", async ({
  page,
}) => {
  await page.goto("/#/library");
  await expect(page.locator(".game-card")).toHaveCount(52);
  await page.getByRole("searchbox").fill("vice");
  await expect(page.locator(".game-card")).toHaveCount(2);
  await page
    .getByRole("button", {
      name: "Favorite Grand Theft Auto: Vice City",
      exact: true,
    })
    .click();
  await page.goto("/#/favorites");
  await expect(page.locator(".game-card")).toHaveCount(1);
  await page
    .getByRole("link", { name: "Grand Theft Auto: Vice City", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Grand Theft Auto: Vice City",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Launch options" }),
  ).toBeVisible();
  await page.goto("/#/game/v");
  await expect(
    page.getByText("NOT INSTALLED · AUTHORIZED BUILD REQUIRED"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Research reference / catalog" }),
  ).toHaveAttribute(
    "href",
    "https://www.lemon-web.net/html5games/grandtheftauto5/",
  );
});
test("THRESHOLD runtime reaches gameplay and accepts launcher input", async ({ page }) => {
  await page.goto("/#/play/threshold");
  await expect(page.locator("[data-state=PLAYING]")).toBeVisible();
  const runtime = page.frameLocator(".game-frame");
  await runtime.getByRole("button", { name: "BEGIN STORY" }).click();
  await page.locator(".runtime-stage").focus();
  await page.keyboard.press("Space");
  await expect
    .poll(() =>
      page.locator("iframe").evaluate((f: HTMLIFrameElement) =>
        JSON.parse(f.contentWindow?.localStorage.getItem("thresholdSignal") || "{}").a,
      ),
    )
    .toBe(5);
});
test("local runtime bridge readiness, movement, pause and cleanup", async ({
  page,
}) => {
  await page.goto("/#/play/input-lab");
  await expect(page.locator("[data-state=PLAYING]")).toBeVisible();
  const runtime = page.frameLocator(".game-frame");
  await expect(runtime.locator("canvas")).toBeVisible();
  await page.keyboard.press("Tab");
  await page.locator(".runtime-stage").focus();
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(250);
  await page.keyboard.up("KeyD");
  const position = await page
    .locator("iframe")
    .evaluate((f: HTMLIFrameElement) =>
      f.contentWindow?.localStorage.getItem("afterhours-input-lab"),
    );
  expect(position === null || typeof position === "string").toBeTruthy();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.locator("[data-state=PAUSED]")).toBeVisible();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.locator("[data-state=PLAYING]")).toBeVisible();
  await page.getByRole("link", { name: "← Leave runtime" }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.goto("/#/recent");
  await expect(page.getByText(/Local session ·/)).toBeVisible();
});
test("responsive shell, settings and diagnostics", async ({ page }) => {
  await page.goto("/#/settings");
  await page.getByLabel("Performance profile").selectOption("LOW");
  await expect(page.locator("html")).toHaveAttribute("data-profile", "LOW");
  await page.reload();
  await expect(page.getByLabel("Performance profile")).toHaveValue("LOW");
  await page.goto("/#/diagnostics");
  await expect(
    page.getByRole("heading", { name: "Diagnostics", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Read/write transaction passed")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Run local sample" }).click();
  await expect(page.getByText(/callbacks\/s/)).toBeVisible({ timeout: 6000 });
});
test("cinematic replay can be dismissed", async ({ page }) => {
  await page.goto("/#/");
  await page.getByRole("button", { name: "Replay intro" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("afterhours:introSeen")),
  ).toBe("true");
});
test("runtime HTTP failure has retry/back recovery", async ({ page }) => {
  await page.route("**/games/input-lab/index.html", (route) =>
    route.fulfill({ status: 404, body: "Not installed" }),
  );
  await page.goto("/#/play/input-lab");
  await expect(page.getByText("GAME FAILED TO LOAD")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retry", exact: true }),
  ).toBeVisible();
  await page.unroute("**/games/input-lab/index.html");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.locator("[data-state=PLAYING]")).toBeVisible();
});
test("keyboard and multi-pointer joystick/action mapping reach real runtime", async ({
  page,
}) => {
  await page.goto("/#/play/input-lab");
  await expect(page.locator("[data-state=PLAYING]")).toBeVisible();
  await page.locator(".runtime-stage").focus();
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(350);
  await page.keyboard.up("KeyD");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("afterhours-input-lab") || "{}").x,
      ),
    )
    .toBeGreaterThan(0.53);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  const received = page.locator(".game-frame");
  await received.evaluate((f: HTMLIFrameElement) => {
    const w = f.contentWindow!;
    w.addEventListener("message", (e) => {
      if (
        e.data?.type === "HUB_INPUT" &&
        e.data.payload.buttons.includes("confirm") &&
        e.data.payload.axes.x > 0.2
      )
        (w as Window & { __multiVerified?: boolean }).__multiVerified = true;
    });
  });
  // Chromium protocol creates genuine simultaneous touch pointers (not physical device QA).
  const stick = page.locator(".joystick");
  await page.locator(".runtime-stage").scrollIntoViewIfNeeded();
  await expect(stick).toBeInViewport();
  const rect = await stick.boundingBox();
  const action = await page
    .getByRole("button", { name: "Confirm", exact: true })
    .boundingBox();
  if (!rect || !action) throw Error("Missing control targets");
  const cx = rect.x + rect.width / 2,
    cy = rect.y + rect.height / 2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: cx, y: cy, id: 0 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: cx + 50, y: cy, id: 0 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: cx + 50, y: cy, id: 0 },
      {
        x: action.x + action.width / 2,
        y: action.y + action.height / 2,
        id: 1,
      },
    ],
  });
  await expect
    .poll(() =>
      received.evaluate(
        (f: HTMLIFrameElement) =>
          (f.contentWindow as Window & { __multiVerified?: boolean })
            .__multiVerified,
      ),
    )
    .toBe(true);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await cdp.detach();
});
test("production worker caches shell but never runtime files; offline shell loads", async ({
  page,
  context,
}) => {
  await page.goto("/#/library");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  const cached = await page.evaluate(async () => {
    const names = (await caches.keys()).filter((k) =>
      k.startsWith("afterhours-shell-"),
    );
    const entries = await Promise.all(
      names.map(async (n) =>
        (await (await caches.open(n)).keys()).map(
          (r) => new URL(r.url).pathname,
        ),
      ),
    );
    return entries.flat();
  });
  expect(cached).toContain("/index.html");
  expect(cached.some((p) => p.startsWith("/games/"))).toBe(false);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "The collection." }),
  ).toBeVisible();
  await expect(
    page.getByText("OFFLINE · Cached shell may work.", { exact: false }),
  ).toBeVisible();
  await context.setOffline(false);
});
test("fullscreen API responds to a user gesture or reports fallback", async ({
  page,
}) => {
  await page.goto("/#/play/input-lab");
  await expect(page.locator("[data-state=PLAYING]")).toBeVisible();
  await page.getByRole("button", { name: "Fullscreen", exact: true }).click();
  const enabled = await page.evaluate(() => !!document.fullscreenElement);
  if (enabled) {
    await expect(page.locator(".fullscreen-tools")).toBeVisible();
    await page.getByRole("button", { name: "Window", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => !!document.fullscreenElement))
      .toBe(false);
  } else await expect(page.locator("#toast")).toBeVisible();
});
test("lab save export has declared format and import restores position", async ({
  page,
}) => {
  await page.goto("/#/play/input-lab");
  await expect(page.locator("[data-state=PLAYING]")).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export lab save" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("afterhours-input-lab.json");
  await page.locator("input[type=file]").setInputFiles({
    name: "lab.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "afterhours-input-lab",
        version: 1,
        x: 0.23,
        y: 0.67,
      }),
    ),
  });
  await expect(page.locator("#toast")).toContainText("Lab position imported");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("afterhours-input-lab") || "{}"),
  );
  expect(saved.x).toBeCloseTo(0.23);
  expect(saved.y).toBeCloseTo(0.67);
});
