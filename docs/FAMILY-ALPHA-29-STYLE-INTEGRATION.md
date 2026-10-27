# Assignment 29 — Style My New Clothes offline integration

October 26, 2026 · Issue #255 · Family Alpha **HOLD**

Separate branch stacked on PR #319 (`45de5df69f82a290cc4bdbd3db50fd9f297add03`); does not change its recognition guards or archive audit. No public source, engine algorithm, renderer, Auth, service configuration, production or deployment changes.

## Gaps found and candidate

PR #276 (`0fb6ab04ab79c36d449acee21aaaf4318871d647`) implements pinned, diverse recommendations and source-bound swaps, but explicitly has no user-facing workflow. The current source-pinned build did not import it, offer a saved-new-garment selection, preview each returned board using reviewed 2D photos, or save/restore a pinned favorite.

The #276 module is included **byte-for-byte unchanged**, with its existing #15 swap dependency also unchanged. The new adapter supplies the real stylist scoring and board cleaner. It requires the new garment to be saved, have type/color and no pending review/save error. Up to three distinct complete outfits remain the engine's decision; its shortage explanation is displayed verbatim. No retailer workflow, shopping inventory or change to Inspiration / Style My Options.

`build-family-alpha-29-hold.mjs` copies the already verified disabled combined build into a **separate** `dist-family-alpha-29-hold` output. It adds a hidden panel to My Closet, candidate modules and styles only. It does not write the base output or enable its Auth/key/avatar rollout. Boot additionally requires localhost/127.0.0.1 **and** explicit `window.__CLOSET_ALPHA29_OFFLINE__=true` before load. This UI exposure flag is not authorization. Auth is reverified by the existing compiled staged verifier; private db/cloud owner and session checks remain mandatory. The default held candidate cannot access live staging. Never deploy this output.

Workflow: capture/import → existing recognition review/Adjust → existing atomic garment save → My Closet's new-piece selector → Style My New Clothes → 1–3 options. Each card keeps the pin visible and offers swaps only for other slots. Review 2D preview uses the existing original-JPEG preparation, explicit cutout approval for every garment, source attestation and existing 2D renderer. It must show an unavailable/error state if review fails; no generic avatar is called a photo preview. Extra review remains necessary until the main thread supplies approved source-bound presentations; it is not skipped for convenience.

Buttons/selects have minimum 48px height. UI requires explicit Save outfit, then confirms only after durable completion. Favorites retain only board IDs, source hashes and metadata fingerprints, never duplicate original photographs. Restore explicitly selects the favorite in the existing Outfit Builder.

## Data and operation safety

- Engine checks owner, saved original/crop hashes, pin and compatible slots.
- Adapter snapshots the complete wardrobe and current account epoch. Deleted/replaced/changed data invalidates pending recommendations and previews. Auth is verified before generate/swap/save/restore/preview.
- Session/logout/pagehide clears and hides the offline panel and aborts pending photo approvals; garment rendering refresh invalidates old results.
- Favorites live under the separate existing-state-store key `family-alpha-new-clothes-favorites` in the current private database. Saving a favorite never replaces the current board or its existing favorites.
- A readwrite transaction rereads persisted items and rejects memory/database mismatch before writing. Its queue preflight rechecks the current db/account and operation guard; synchronous errors abort the transaction.
- Restoring rereads `outfit-board` and compares it with the record observed before asynchronous verification. If another action edited the board, restoration rejects rather than overwrites it. Unrelated existing saved outfits are retained.
- Reload reads the private favorite records and verifies sources/metadata again before restore. This is local persistence, not live cloud restoration. The new key is not added to cloud backup/export; syncing these favorites is a main-thread integration gap.

Client checks and synthetic mocks do not prove server RLS or deployed authorization. Existing release/security HOLD conditions remain unchanged.

## Verification so far

- Source-pinned staging/combined/protected-preview builders: PASS, Auth and rollout remain OFF.
- Separate #29 builder: PASS; #276 engine byte equality enforced.
- Full stacked Node suite: **561/561 PASS**, including 11 new workflow/source tests.
- Additional fake-indexeddb integration suite: **5/5 PASS** (save/restore, DB mismatch, concurrent board edit, failed-write retry, account change while queued). This models IndexedDB, not browser quota/eviction or cloud.
- New browser script executes the actual compiled app import → Adjust save → panel → three reviewed avatars → shoe swap → favorite save → reload/restore. Auth/cloud/classification are explicitly local synthetic mocks. Chromium/WebKit execution is pending an exact-head CI result; no local browser binaries are available.
- Physical phones, live model accuracy, true Auth/RLS, live cloud restoration and family garments: **NOT TESTED**.

## Reproduce (no credentials)

Fetch pinned refs listed in `.github/workflows/family-alpha-29-offline.yml`, then:

```bash
node scripts/build-family-alpha-staging-auth-hold.mjs
node scripts/build-family-alpha-recognition-integrated-hold.mjs
node scripts/build-family-alpha-protected-preview-hold.mjs
node scripts/build-family-alpha-29-hold.mjs
node --test tests/*.test.cjs tests/*.test.mjs
```

Install test-only fake-indexeddb 6.2.4 and Playwright 1.56.1 in an isolated test environment; run `node --test tests/integration/family-alpha-29-store.test.mjs` and `node scripts/test-family-alpha-29-browser.mjs`. For locally isolated dependencies, ALPHA29_IDB_MODULE may specify the fake-indexeddb ESM index path. The no-deploy workflow uses the existing pinned browser container, read-only repository permission, no credentials and synthetic artifacts only.

## Remaining integration decisions

Main thread must review this separate candidate against its final exact source pins; connect approved mask/presentation caching if appropriate; decide favorite cloud backup support; verify four-account server isolation and actual phones through #315/#255. No merge, invitations, provider changes, paid service or deployment is authorized here. Draft results must never be promoted to physical-phone or live-service evidence.
