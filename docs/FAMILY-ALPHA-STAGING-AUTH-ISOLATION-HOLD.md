# Closet Current Family Alpha v0.1 — Isolated staging Auth routing, release HOLD

**October 23, 2026 | Main project chat | stacked on audited security PR #272**

This implementation closes the **build-time staging Auth routing gap** without activating staging or changing production. No merge, deployment, cloud configuration changes, credentials, test identities, live customers or spending.

## What was discovered

The ordinary app's `public/auth.js` points at the production Supabase project `hlkgymugtfbirlpunsra` and the GitHub Pages callback. Its `public/cloud-backup.js` and `public/family-alpha-2d-auth-preflight.mjs` separately hardcode that same production project. An isolated staging Auth UI patch would be unsafe because cloud backup and the avatar would still use production endpoints.

The **separate** Closet Current Staging project ref is `fbnplztkbsteuzrmbgib`. Its deployed RLS/private bucket/RPC **metadata** was audited read-only in PR #272, but authorized A/B REST/JWT allow/deny tests have not been run. The staging login redirect, protected Cloudflare Access and publishable key must be approved together. A publishable key is **not an Auth credential or permission check**.

## Build, isolation and default behavior

Run `node scripts/build-family-alpha-staging-auth-hold.mjs`.

The script:
1. Builds the original `dist/` and the already-audited no-deploy photo candidate `dist-family-alpha-candidate/` using existing, unchanged commands and source pins.
2. Creates **a third output** `dist-family-alpha-staging-auth-hold/`, leaving both earlier outputs unchanged. Inside this third candidate ONLY, `auth.js`, `cloud-backup.js` and the 2D avatar server Auth preflight all use the dedicated staging project. Replacements are exact and fail if the original code changes.
3. Adds `alpha-stage-config.js` loaded **before Auth**, with `releaseGate: HOLD`, `key: ""`, `redirect: ""`, and `ready: false` until an HTTPS origin and matching staging publishable key are explicitly supplied through a separately reviewed test path. The default artifact is intentionally **not sign-in capable**; there is NO silent production fallback.
4. Uses the distinct `closet-alpha-staging-auth-v1` localStorage session key rather than reading the production session. This keeps stage Auth tokens from unintentionally restoring a production account when testing in a shared browser. App IndexedDB is already owner UUID scoped, with separate origins required; same-origin storage is not a security boundary.
5. Stages an inert `pwa.js` so preview devices do not install/cache the ordinary production service worker. The preview itself remains **hard-OFF on non-localhost hosts** even after the stage config exists.
6. Checks exact file differences and a HOLD manifest; every unchanged ordinary/garment runtime file is byte-preserved and the generated staging Auth/cloud/preflight must never include the production Supabase URL.
7. Performs **no** Supabase queries, Auth emails, cloud sync, storage object operations, deployment or Cloudflare configuration. All generated files are an **offline inspection candidate**, not a live staging link.

This is deliberate defense in depth. A browser-side config is NOT an authorization mechanism; protected Cloudflare Access, backend RLS and a verified allowlist are required before any real users can enter an Alpha site.

## Controlled later staging activation — NOT authorized by this PR

Only after the owner explicitly approves a precise protected HTTPS staging URL, correct registered Supabase Auth callback and test-account permissions should a subsequent task generate a new fully routed candidate using that approved callback and the matching `sb_publishable_...` staging public key. The build code supports an **explicit test-only path**; this PR/CI does not provide those values or publish that artifact.

The default generated output remains `HOLD`. DO NOT use a publicly reachable website, URL parameter, browser console flag, or unchecked environment variable to bypass the host+backend binding. Never use a production publishable key or production callback on the staging origin. Do not commit secret keys, JWTs or raw photo data.

## Verification

- `node --test tests/family-alpha-stage-auth-isolation.test.mjs`: exact staging ref, separate authenticated backup and preflight, different local session key, safe callback validation, disabled-by-default Auth/Cloud, no staging PWA registration and byte-identical normal releases.
- `node scripts/test-family-alpha-stage-auth-browser.mjs`: Chromium/WebKit at 320/390/430px. Case 1 uses a default HOLD artifact and asserts no login/cloud requests. Case 2 loads a **fictional** HTTPS domain with **fabricated** publishable key and mocked staging Auth endpoints, verifies login and password reset redirect go to staging, old production localStorage session is not used, and no production/outside traffic is attempted. No real Supabase calls are permitted.
- Existing full Node regression, four-owner mock-security browser and photo/staging-builder suites remain running in no-deploy CI.

## Remaining release gates

**HOLD.** Owner-approved protected Cloudflare host and access policy, exact registered staged Auth callback+email template/SMTP, staging publishable key in only the staged build, controlled synthetic Auth users' real REST/RLS positive and negative tests, private object path and signed-URL behavior, production TRUNCATE/grants least-privilege review, and physical Android/iPhone garment capture with consented family accounts remain open.

No real family data was read or used; no external system settings were changed; no activation, merge, money or deployment occurred.
