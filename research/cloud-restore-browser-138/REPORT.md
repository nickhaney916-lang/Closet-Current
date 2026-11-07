# Closet Current — MAIN Priority #138 — CLOUD-RESTORE-BROWSER-CONSENT-138

**RESEARCH ONLY | Family Alpha Issue #255 HOLD | DRAFT, UNMERGED | NO SHIPPING APP, PRODUCTION, STAGING OR LIVE SUPABASE MODIFICATIONS**

## Starting point and new gap

Source: verified P137 [draft PR #691](https://github.com/nickhaney916-lang/Closet-Current/pull/691) HEAD `5e8bdb194ce9d2a274a23a79d3faa11e319d5f3e`. Exact-head [no-deploy Actions #42394393773](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42394393773) passed 1,209/1,209 Node, 8/8 disposable Postgres 17 two-owner RLS/CAS tests, six inherited native app Chromium/WebKit cases at 320/390/430, and 93 genuine browser screenshots.

P137 introduced authenticated-owner local+remote source and SHA fingerprinting and destructive cloud-to-IndexedDB restore checks, but the **inherited app browser cases never mounted or executed P137**. A browser-verified privacy-safe confirmation screen, mobile click/cancel/restore behavior, async local/remote edits, error states and screenshots were still missing. The main track owns this precisely scoped independent gap; Parallel #51 live signed-owner cloud integration, #52 general mobile UX, #53 recognition, #54 storage and P131 3D figures remain independent and untouched.

## Actual browser integration (research only)

1. New `research/cloud-restore-browser-138/restore-review.html`: an isolated, accessible, phone-width owner-preview prototype. It imports **the genuine P137 module** and **unchanged P129/P128/P126 modules** as native browser ESM, presents counts and remote revision only, and uses an actual modal `<dialog role="alertdialog">`. It explicitly says **this replaces the local closet rather than merging it**, with Cancel/Replace buttons, keyboard Escape cancellation, real status messages and no user image, category, garment ID or outfit name in the preview. This is NOT the shipping app UI.
2. The research page intentionally uses a browser IndexedDB with a synthetic unique owner and **genuine licensed original JPEG + separately reencoded JPEG cutout**. Hashes and protected owner-review fields exactly follow earlier verified PHOTO126 fixture contract. Calls actual P129 `backup` to seed revision 1 via the fake HTTP and Storage server, then P137 `previewRestore` and `restoreWithOwnerReview`. No fake approved success is shown.
3. New `scripts/test-cloud-restore-browser-138.mjs` is a local, throwaway HTTP server that serves **only /research browser modules and P138 HTML**, plus a strictly owner-scoped fake REST metadata / private image Storage / revision CAS endpoint. It does **not** connect to live Supabase, require real keys, or send network requests outside 127.0.0.1. The different synthetic A/B tokens are not signed JWTs.
4. Run actual Chromium and WebKit at 320/390/430 CSS pixels. At each size: seed both genuine JPEG byte paths; show count-only preview without image download; mutate local garments/saved outfits; open a genuine accessible confirmation dialog; inspect that no garment data/photo appears; decline and prove local preservation; affirm and prove actual P129/P126 double-SHA restored source/outfit ID; edit local color during an open dialog and prove failure with no overwrite; edit remote **revision or same-revision document contents** during dialog and prove fail-closed; probe a second synthetic owner and deny cross-owner Storage access.
5. Capture genuine nonblank mobile-sized screenshots (six screens × six browser/width scenarios = **36 screenshots target**), hashes, a machine-readable `benchmark/cloud-restore-browser-138/results.json`, JS exceptions, unexpected network requests, independent owner IDs and exact acceptance flags. Screenshot artifacts are archived in CI but not committed as large binary repo content.
6. Re-run inherited full Node suite, existing real Postgres 17 RLS/CAS, and optionally the six real-app Chromium/WebKit inherited mobile flows. The inherited app flows are *separate* from P138's actual **research-only** mounted restore browser acceptance.

## No-deploy research restrictions

Strict GitHub workflow pins exact P137 source parent, requires exactly four new paths, and excludes any change to `public/`, `supabase/`, production, existing staging, other research owners, private customer data or unrelated projects. P138's HTML is a research page and only a prototype; no new shipping restore UI, login integration or real on-device feature is claimed.

**Research acceptance is only complete at a green exact-head no-deploy CI**, with genuine browser screenshots and measured case counts. A pass would prove the actual P137 research logic can render and operate in both real browser engines, **not** that shipped Closet Current cloud UX is integrated.

## Remaining known limitations

- No live cryptographically signed Supabase JWT, deployed two-account HTTP storage isolation, live RLS or production authentication.
- No real customer photos or other privacy-sensitive data.
- No physical Android/iOS handset, benchmarked mobile memory, long-term offline cloud syncing or independent production QA.
- No distributed transaction across IndexedDB and PostgreSQL; remote mutations after a last checked manifest can race.
- Family Alpha stays HOLD and all draft research remains unmerged.

**Status: exact final HEAD and CI evidence must be appended on successful verification.**