# Closet Current — actual installed Chromium staging worker QA

**Date:** October 21, 2026. **Branch:** independent draft stacked on verified staging cache PR #155, never targeting main.

## Problem
Our PR #155 VM simulation verified staging-specific cache names, immutable assets, and safe handling of incomplete cached versions, but did not prove the generated worker can successfully install and activate in an actual browser. Mobile installed-app behavior is important for a private pilot.

## What this verifies
A real headless Chromium engine, emulating a 390px Android touch viewport with service workers **enabled**, visits a disposable `http://127.0.0.1:<port>/__sw-harness.html` page. The HTTP server is bound to loopback; no public website, user account, Supabase project or inference provider is used.

The test registers the **actual generated `staging-dist/sw.js`**, awaits an activated controller, and verifies:
1. Correct staging-specific cache installed; obsolete staging namespace removed; production-named and unrelated synthetic caches survive activation.
2. `index.html` and exact versioned Auth JS returned as immutable cached bytes even after their server contents are intentionally replaced.
3. Those exact assets still load with browser networking disabled.
4. A deleted cached Auth file fails closed with HTTP 503 instead of mixing newer server code.
5. Private/unverified routes remain network-only (unavailable offline); POST requests do not enter the worker cache.
6. No external network request was attempted, and no hosted backend was contacted.

GitHub Actions installs a pinned Playwright Chromium, runs all project Node tests and source-preservation guards, builds a **synthetic staging bundle**, then performs this true service worker lifecycle validation without deploying it.

## Remaining limits
This is a real **desktop Chromium browser engine emulating mobile input and viewport**, not a physical Android installation. Playwright's current service worker tooling supports Chromium, not WebKit, so **this does not prove installed iPhone WebKit/PWA behavior**. Our separate Work PR #150/152 browser tests for iPhone WebKit block service workers and only validate the app runtime. Physical Android/iPhone, protected Cloudflare Access and hosted Supabase Auth/RLS are still mandatory release blockers. No paid resources, live database writes, customer account/photos, Drive Duel changes or production deployment.
