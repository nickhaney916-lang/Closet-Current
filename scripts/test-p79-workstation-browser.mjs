/** Actual desktop engines, synthetic-only automation; NOT phone or human proof. */
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { chromium, webkit } from "playwright";
import { createRequire } from "node:module";
import { fixture } from "./p79-synthetic-fixtures.mjs";
import { createWorkstation } from "./p79-workstation.mjs";
import { validateDraft } from "./p79-workstation-core.mjs";
const require = createRequire(import.meta.url),
  results = [];
for (const engine of process.env.P79_ENGINE === "chromium"
  ? [chromium]
  : process.env.P79_ENGINE === "webkit"
    ? [webkit]
    : [chromium, webkit]) {
  const browser = await engine.launch({
    headless: true,
    args: engine === chromium ? ["--no-sandbox"] : [],
  });
  try {
    for (const width of [320, 390, 430, 1280]) {
      const f = await fixture(10),
        { server, url, loaded } = await createWorkstation(f.bundle),
        context = await browser.newContext({
          viewport: { width, height: 900 },
          acceptDownloads: true,
        });
      try {
        console.log("P79_CASE_START " + engine.name() + " " + width);
        const page = await context.newPage();
        page.setDefaultTimeout(12000);
        const requests = [],
          errors = [],
          start = performance.now();
        page.on("request", (r) => requests.push(r.url()));
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(url);
        await page.waitForFunction(
          () =>
            document.getElementById("photo").complete &&
            document.getElementById("photo").naturalWidth > 0,
        );
        await page
          .getByRole("button", { name: "Export unsigned draft" })
          .click();
        await page
          .getByRole("alert")
          .filter({ hasText: "acknowledgment" })
          .waitFor();
        await page
          .getByLabel("Presence", { exact: true })
          .selectOption("single-garment");
        await page
          .getByRole("button", { name: "Add region", exact: true })
          .click();
        await page.getByLabel("Category", { exact: true }).selectOption("Tops");
        await page
          .getByLabel("Subtype", { exact: true })
          .selectOption("T-shirt");
        await page
          .getByLabel("Primary color", { exact: true })
          .selectOption("Blue");
        await page
          .getByLabel("Region 1 Category", { exact: true })
          .selectOption("Tops");
        await page
          .getByLabel("Region 1 Subtype", { exact: true })
          .selectOption("T-shirt");
        await page.getByLabel("Region 1 x", { exact: true }).fill(".2");
        await page.getByLabel("Region 1 x", { exact: true }).press("Tab");
        await page.getByLabel("Region 1 y", { exact: true }).fill(".3");
        await page.getByLabel("Region 1 y", { exact: true }).press("Tab");
        await page.getByLabel("Region 1 occluded", { exact: true }).check();
        await page.locator("#inspected").check();
        const downloadPromise = page.waitForEvent("download");
        await page
          .getByRole("button", { name: "Export unsigned draft" })
          .click();
        const download = await downloadPromise,
          draft = JSON.parse(await readFile(await download.path(), "utf8"));
        assert.deepEqual(
          validateDraft(draft, loaded.session, f.bundle.sources[0].source),
          [],
        );
        assert.deepEqual(draft.labels.instances[0].box, [0.2, 0.3, 0.3, 0.3]);
        assert.equal(draft.labels.instances[0].occluded, true);
        await page.getByRole("button", { name: "Next", exact: true }).click();
        await page.waitForFunction(
          () =>
            document.getElementById("photo").complete &&
            document.getElementById("photo").naturalWidth > 0,
        );
        assert.equal(
          await page.getByLabel("Category", { exact: true }).inputValue(),
          "Unknown",
        );
        assert.equal(await page.locator("#regions fieldset").count(), 0);
        await page
          .getByRole("button", { name: "Previous", exact: true })
          .click();
        await page.waitForFunction(
          () =>
            document.getElementById("photo").complete &&
            document.getElementById("photo").naturalWidth > 0,
        );
        assert.equal(
          await page.getByLabel("Category", { exact: true }).inputValue(),
          "Tops",
        );
        assert.equal(await page.locator("#inspected").isChecked(), false);
        await page
          .getByLabel("Restore unsigned draft from this session")
          .setInputFiles({
            name: "corrupt.json",
            mimeType: "application/json",
            buffer: Buffer.from("{bad"),
          });
        await page
          .getByRole("alert")
          .filter({ hasText: /JSON|Unexpected|Expected/ })
          .waitFor();
        assert.equal(
          await page.getByLabel("Category", { exact: true }).inputValue(),
          "Tops",
        );
        await page
          .getByLabel("Restore unsigned draft from this session")
          .setInputFiles({
            name: "other.json",
            mimeType: "application/json",
            buffer: Buffer.from(
              JSON.stringify({ ...draft, reviewerId: "OTHER" }),
            ),
          });
        await page
          .getByRole("alert")
          .filter({ hasText: "wrong-session" })
          .waitFor();
        await page.getByRole("button", { name: "Remove region 1" }).click();
        assert.equal(await page.locator("#regions fieldset").count(), 0);
        await page.getByRole("button", { name: "Undo edit" }).click();
        assert.equal(await page.locator("#regions fieldset").count(), 1);
        await page.getByRole("button", { name: "Reset this draft" }).click();
        assert.equal(
          await page.getByLabel("Category", { exact: true }).inputValue(),
          "Tops",
        );
        await page.getByRole("button", { name: "Reset this draft" }).click();
        assert.equal(
          await page.getByLabel("Category", { exact: true }).inputValue(),
          "Unknown",
        );
        await page.getByRole("button", { name: "Undo edit" }).click();
        // Keyboard arrow edits use actual native numeric controls.
        await page.getByLabel("Region 1 x", { exact: true }).focus();
        await page.keyboard.press("ArrowUp");
        await page.keyboard.press("Tab");
        assert.ok(
          Number(
            await page.getByLabel("Region 1 x", { exact: true }).inputValue(),
          ) > 0.2,
        );
        const before = Number(
          await page.getByLabel("Region 1 width", { exact: true }).inputValue(),
        );
        await page.locator("#viewer").scrollIntoViewIfNeeded();
        const handle = await page.locator(".handle").boundingBox();
        await page.mouse.move(handle.x + 8, handle.y + 8);
        await page.mouse.down();
        await page.mouse.move(handle.x + 18, handle.y + 18);
        await page.mouse.up();
        assert.ok(
          Number(
            await page
              .getByLabel("Region 1 width", { exact: true })
              .inputValue(),
          ) > before,
        );
        await page.getByRole("button", { name: "Zoom in" }).click();
        await page.getByRole("button", { name: "Fit image" }).click();
        await page.evaluate(
          await readFile(require.resolve("axe-core/axe.min.js"), "utf8"),
        );
        const axe = await page.evaluate(
          async () =>
            await axe.run(document, {
              runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa", "wcag21aa"],
              },
            }),
        );
        assert.deepEqual(
          axe.violations.map((x) => x.id),
          [],
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 2,
          ),
          "no page overflow",
        );
        assert.deepEqual(errors, []);
        assert.ok(
          requests.every((r) => r.startsWith(url) || r.startsWith("blob:")),
          "all requests local session only",
        );
        const networkDenied = await page.evaluate(async () => {
          try {
            await fetch("https://example.com/p79-csp-probe");
            return false;
          } catch {
            return true;
          }
        });
        assert.equal(networkDenied, true, "CSP refuses remote connections");
        await page
          .getByLabel("Restore unsigned draft from this session")
          .setInputFiles({
            name: "oversized.json",
            mimeType: "application/json",
            buffer: Buffer.alloc(100001, 32),
          });
        await page
          .getByRole("alert")
          .filter({ hasText: "too large" })
          .waitFor();
        // A new registrar-authorized rater has no inherited labels or local storage.
        const other = structuredClone(f.bundle),
          { signature, ...auth } = other.authorization;
        auth.reviewerId = "SYNTHETIC-1";
        auth.sessionId = "SYNTHETIC-session-0002";
        other.authorization = { ...auth, signature: f.signature(auth) };
        const b = await createWorkstation(other);
        try {
          const otherContext = await browser.newContext(),
            otherPage = await otherContext.newPage();
          await otherPage.goto(b.url);
          await otherPage.waitForFunction(
            () =>
              document.getElementById("photo").complete &&
              document.getElementById("photo").naturalWidth > 0,
          );
          assert.equal(
            await otherPage
              .getByLabel("Category", { exact: true })
              .inputValue(),
            "Unknown",
          );
          assert.equal(await otherPage.locator("#regions fieldset").count(), 0);
          assert.equal(
            await otherPage.evaluate(
              () => localStorage.length + sessionStorage.length,
            ),
            0,
          );
          await otherContext.close();
        } finally {
          b.server.closeAllConnections();
          await new Promise((r) => b.server.close(r));
        }
        if (process.env.P79_SCREENSHOT && width === 390)
          await page.screenshot({
            path: "/tmp/p79-" + engine.name() + "-390.png",
            fullPage: true,
          });
        results.push({
          engine: engine.name(),
          width,
          status: "PASS",
          syntheticAutomationMs: Math.round(performance.now() - start),
          axeViolations: 0,
          externalRequests: 0,
        });
      } finally {
        await context.close();
        server.closeAllConnections();
        await new Promise((r) => server.close(r));
        await f.cleanup();
      }
    }
    // All EXIF orientation values exercised with real generated metadata.
    for (const format of ["png", "jpeg", "webp"])
      for (const orientation of [1, 2, 3, 4, 5, 6, 7, 8]) {
        console.log(
          "P79_ORIENTATION_START " +
            engine.name() +
            " " +
            format +
            " " +
            orientation,
        );
        const f = await fixture(1, { orientation, format }),
          { server, url } = await createWorkstation(f.bundle);
        try {
          const p = await browser.newPage();
          await p.goto(url);
          await p.waitForFunction(
            () =>
              document.getElementById("photo").complete &&
              document.getElementById("photo").naturalWidth > 0,
          );
          await p.locator("#inspected").check();
          const expected = await sharp(f.bundle.sources[0].path)
            .autoOrient()
            .removeAlpha()
            .raw()
            .toBuffer();
          const actual = await p.locator("#photo").evaluate((img) => {
            const c = document.createElement("canvas");
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            const ctx = c.getContext("2d");
            ctx.drawImage(img, 0, 0);
            return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
          });
          assert.ok(
            actual.every((v, i) => Math.abs(v - expected[i]) <= 3),
            "displayed pixels follow EXIF transform " +
              format +
              " " +
              orientation,
          );
          const d = p.waitForEvent("download", { timeout: 12000 });
          await p
            .getByRole("button", { name: "Export unsigned draft" })
            .click();

          await d;
          await p.close();
        } finally {
          server.closeAllConnections();
          await new Promise((r) => server.close(r));
          await f.cleanup();
        }
      }
  } finally {
    await browser.close();
  }
}
console.log(
  "P79_SYNTHETIC_DESKTOP_ENGINE_RESULTS " +
    JSON.stringify({
      cases: results,
      orientationCases: process.env.P79_ENGINE ? 24 : 48,
      genuineHumans: 0,
      humanLabels: 0,
      sealedBlind: 0,
      physicalDevices: 0,
      accuracy: "UNKNOWN",
    }),
);
