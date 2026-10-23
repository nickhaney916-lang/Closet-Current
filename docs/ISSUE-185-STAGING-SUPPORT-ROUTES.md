# Issue #185 — protected staging support-page investigation

October 22, 2026, Pacific. Offline development only; nothing deployed.

## Coordination and verified baseline

- PR #181 `a42894cd2c7bf3ebc0019f69ba7112888e8fb04c`, branch
  `staging/protected-preview-bundle-20261022b`, remains unchanged. This isolated
  fix starts there and targets that development branch, never main.
- PR #183 `049d7c0d1b72e429cee604d446b41360512dd9f2` owns #182 Auth/security.
  PR #184 `93252a3b6f570b7e38473bd1683ed3468aad84d1` owns outfit previews.
  Neither is edited or silently integrated. No competing #185 PR found at review.
- Source guard permits only issue185 build/output, QA and report files. Every
  `public/` file, Supabase file, original packaging and production deployment
  workflow remains byte-identical to PR181. Access and backend settings untouched.

## Exact original ZIP inspection

Downloaded the original successful PR181 run #39854048098 artifact
`closet-current-staging-preview-static`, ID **12458018514**. ZIP SHA-256:
`a306f512181da2d933fa9fa2ba80363ff11fbbb6a94dfc9ff1968fe8c170d930`.
It expires October 25; reproducible baseline QA does not depend on the download.

- **93 files**; `index.html` at ZIP root, not inside `dist/` or `staging-dist/`.
- All **92 sealed assets / 3,121,074 bytes** match the manifest. The seal itself
  is the 93rd file, SHA-256
  `6b482e98100196119d3002c283cbb1afe6ec4737a2b07a7fc2ad264f11099338`.
- Root HTML: `index.html`, `pilot-data-notice.html`, `saved-closet-audit.html`,
  `phone-photo-check.html`, `benchmark.html`; correct lowercase paths.
- **77 local static HTML link/asset targets** resolve, including support links,
  script/style dependencies and return-to-app links. Versioned URLs match the
  exact staging fingerprint **9473c14af19b**. External publisher links are not
  fetched by this inventory.
- Only the expected staging backend `fbnplztkbsteuzrmbgib` is configured;
  live Closet Current / Drive Duel references absent. AI requests hard-blocked.
- Rebuilt PR181 from its exact commit using only its already committed public
  browser configuration. The rebuilt seal has the exact same SHA-256 as the
  downloaded ZIP: all manifest-listed original bytes reproduce deterministically.
- Deterministic full link and page-hash report:
  `benchmark/issue185-original-route-inventory.json`.

This rules out missing files/wrong ZIP depth in the **original GitHub artifact**.
It does NOT prove the owner uploaded every file or that Cloudflare serves this
exact release. Actual deployed inventory is still unavailable.

## Read-only hosted observation

Anonymous GET, no cookies/credentials, no redirect following and no response body
inspection, to the exact pilot alias:

| Paths | Observed response |
| --- | --- |
| `/` | 302 to the Cloudflare Access login host |
| `/pilot-data-notice.html`, `/pilot-data-notice` | 302 to Access |
| `/saved-closet-audit.html`, `/saved-closet-audit` | 302 to Access |
| `/phone-photo-check.html`, `/phone-photo-check` | 302 to Access |

All seven resolve DNS/TLS and reach Access from this runtime. No public 200,
404, or network error observed. Redirect query strings/tokens are deliberately
excluded from `benchmark/issue185-anonymous-route-observations.json`.

A 302 challenge cannot prove the correct authenticated page exists, the Access
policy is complete, or Samsung's authenticated browser has the same behavior.
No authenticated hosted request, actual Cloudflare file/settings inventory,
customer account, photo, cookie or Access token was accessed. Owner-reported
physical Android failures remain separate evidence.

## Mechanism and candidate fix

Cloudflare documents automatic `.html` → extensionless redirects. The original
worker precaches those `.html` URLs and returns the cached response unchanged.
A followed redirect retains `Response.redirected=true`. Navigation requests have
redirect mode `manual`; Fetch rejects redirected service-worker responses for
that mode, yielding a browser network error even when the file exists.

The new browser QA is designed to **prove or reject** this mechanism on the exact
original bundle before accepting the candidate; final CI evidence is reported
in the PR and issue. Do not infer a browser pass from unit tests.

Only generated staging output changes:

1. A staging-only worker transform maps clean HTML routes to **already sealed
   release HTML**, not a blanket SPA fallback and not private/API routes.
2. A cached redirected HTML response is copied into a fresh Response only when
   its type is basic, status 200, MIME is HTML and its final URL is the exact
   same-origin canonical counterpart of that sealed page. Body/status/headers
   remain unchanged. Access login, cross-origin, other path, opaque and non-HTML
   redirects fail closed with the existing 503 behavior. No network retry added.
3. Support links in generated `index.html` stay in the same tab. This avoids
   opening a separate mobile browser/session for privacy/audit pages. External
   shopping and publication links are untouched. This does not prove a separate
   browser session caused the original incident.
4. The staging fingerprint includes the complete transform source. A corrected
   worker gets a new immutable cache name even though production source is
   unchanged. No `skipWaiting`, destructive storage reset or cache unregistration
   is introduced. Older tabs may remain controlled by their old worker until
   closed normally; wardrobe storage must not be cleared as a workaround.
5. Candidate still passes existing artifact integrity/seal verifier, restricted
   endpoint checks and paid-AI prohibition. No `_redirects`, Access policy,
   origin, Auth redirect or database permissions change.

Primary references:
- https://developers.cloudflare.com/pages/configuration/serving-pages/
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://fetch.spec.whatwg.org/#http-fetch
- https://developer.mozilla.org/en-US/docs/Web/API/Response/redirected

## Automated verification and limits

Locally: original ZIP SHA/seal/inventory PASS; exact baseline rebuild PASS;
connected staging candidate build and existing verifier PASS; new 11-test route,
redirect-denial, link-case, missing-file, wrong-root and seal-tamper suite PASS;
full Node suite **1,631 pass / 0 fail / 3 skipped (1,634 total)**.

Branch-only CI reconstructs the exact old sealed bundle and compares it with
this candidate on localhost servers simulating documented Pages redirects.
The baseline Chromium negative control must show actual navigation failures
for all three `.html` support pages after real worker activation. Candidate
Chromium and WebKit must show exact source-page body hashes, both `.html` and
clean URLs, same-tab notice, return-to-app, online/offline access and missing
cache entry 503. All nonlocal requests are blocked. No sign-in, file upload,
private records, generated image, camera or live backend traffic is needed.
Chromium uses Playwright's actual browser-offline setting. WebKit's online
six-route/back-link assertions passed, but its Playwright offline navigation
returned an internal engine error. The final WebKit cached-page test therefore
makes the local origin unavailable (socket termination); it does not claim the
Playwright offline API or a physical iPhone airplane-mode pass. The earlier
engine error remains an explicit emulation limitation in PR/issue results.

CI uploads **evidence only**, not a deployable ZIP. Check actual final SHA and
conclusions in the PR/issue. Emulator results are not physical Samsung/iPhone
validation and a locally simulated Pages redirect is not hosted Access evidence.

## Owner checklist — inspect only, no deployment/settings changes

1. In the existing **staging** Pages project, inspect the deployment associated
   with `pilot-access-check`. Record its deployment ID and upload time; do not
   change the alias or initiate a new upload. Avoid production and Drive Duel.
2. Inspect the uploaded asset list if available. At the deployment root expect
   `index.html`, the three lowercase support HTML files, JS/CSS, `sw.js`,
   `_headers`, `staging-preflight.json` and `staging-asset-seal.json`. No extra
   top-level `dist/`, `staging-dist/` or ZIP-name directory. An extracted folder's
   **contents** must be the root of any future separately authorized upload.
3. Compare served `staging-preflight.json` fingerprint to **9473c14af19b** for
   the original PR181 artifact. A mismatch or missing file means the deployed
   release has not been tied to the inspected ZIP. Do not expose Access tokens
   or account details in screenshots.
4. Read-only inspect hostname/redirect/Functions/Worker routing rules if the
   dashboard exposes them. Record whether a canonical page URL leaves the exact
   staging hostname. Do not disable, bypass or broaden Access. Absence of a rule
   in source is not proof that hosting has no extra rule.
5. In the **same authorized Samsung browser session**, use the URLs below.
   Record final hostname/path and distinguish network error, HTTP404, Access
   challenge and the actual standalone page heading. Do not clear browser data,
   uninstall the app or lose pending clothing saves. If the existing worker is
   involved, note installed-app vs ordinary-tab behavior; do not unregister it.

## Minimal current hosted smoke test

Use only the already approved account/session; no new signup or data writes:

- https://pilot-access-check.closet-current-staging.pages.dev/pilot-data-notice.html
  and https://pilot-access-check.closet-current-staging.pages.dev/pilot-data-notice
  must show **How your clothing photos and account data are handled**.
- https://pilot-access-check.closet-current-staging.pages.dev/saved-closet-audit.html
  and https://pilot-access-check.closet-current-staging.pages.dev/saved-closet-audit
  must show **Check what was actually saved**. Do not fill/export a real report.
- https://pilot-access-check.closet-current-staging.pages.dev/phone-photo-check.html
  and https://pilot-access-check.closet-current-staging.pages.dev/phone-photo-check
  must show **Check clothing photos**. Do not select photos or run recognition.
- Each Back link returns to the Closet Current app on the same hostname.
- A fresh unauthorized browser should still receive Access; no public page is an
  acceptable workaround. Never share a login URL containing tokens/query data.

## Remaining blockers and next safe step

Hosted root cause and restoration are **not verified**. No deployment is allowed
in this assignment, so even a reproduced local mechanism and green draft PR do
not make either current live link fixed. Review candidate, obtain separately
scoped deployment authorization later, then test exact protected hosted pages in
the owner's physical browser. Preserve the original workflows/branches and use
#182/#183 for Auth/security issues, #9/#184 for outfit work. Do not restart scanner
recognition work. Report actual results and failures without marking hosted
routing restored or closing the real-device acceptance requirement prematurely.
