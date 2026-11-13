# Closet Current / MAIN1054 / Mission 4 Milestone 4

## Goal and safety

Connect **genuine Mission 1 P875 opt-in two-model owner review** to the already verified **Mission 4 Milestone 3 native signed-owner application**, without copying Mission 1's older 1,047-line `app.js` over the 2,600+ line native M3 privacy, original photo, cloud backup, and outfit implementation. This work is research-only, draft, unmerged, undeployed. [Family Alpha HOLD #255](https://github.com/nickhaney916-lang/Closet-Current/issues/255) remains OPEN.

## Source provenance

- Parent [Milestone 3 draft #1075](https://github.com/nickhaney916-lang/Closet-Current/pull/1075) **exact successful head** `58c4fadeb8110f694a4c7c53a7c917035af7f434`, [NO DEPLOY proof #43518424322](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43518424322): 95/95 owner policy tests, 180/180 signed-owner synthetic browser cases, 2,003/2,003 inherited Node tests, all success.
- Mission 1 donor [P875 draft #1076](https://github.com/nickhaney916-lang/Closet-Current/pull/1076), `e70259fd4f5e919fd335a71ad7cf39a370dcae47`: copies exact `dual-core-82.mjs`, `dual-panel-82.mjs`, `dual-worker-82.mjs`, `dual-model-lock-82.mjs`, `model-arbitration-81.mjs`, `subtype-review-80.mjs`, `recognition-confusion-guard.mjs`.
- `public/local-catalog.mjs`, `recognition-photo.mjs`, and `vector-scorer.mjs` were **byte-for-byte identical Git blobs** in both branches: original reuse, no modification.
- `recognition-engine.mjs` was **not identical** (M4 SHA `47e8871566401980a06db6cec82b508f8bef595c`, M1 SHA `0b8b9a3164ab88f80d074a81d22af83fdea6aa70`). To protect normal local recognition and preserve donor M1's fixed full-photo recovery behavior, this isolated research branch copies M1 engine as `public/recognition-engine-dual82.mjs` and changes **only the isolated M1 worker import and source hash list** to point to it. No replacement of the existing native `recognition-engine.mjs`.

## Native integration

The existing `public/app.js` Adjust dialog is the only mount point, behind **exact `?mission4Dual82=research`**. No default app AI changes. It dynamically imports `m4-dual-review-1054.mjs`, which:
- Verifies exact logged-in user object, private owner-specific DB, capture epoch, native `photoEditorSessionLease()`, and pending-photo identity; rejects already-saved, foreign-owner, orphaned or replaced drafts.
- Requires one isolated unsegmented original JPEG and real stored `sourceSHA256`/original receipt, independently computes SHA-256 of actual JPEG bytes, and refuses a source mutation across the await.
- Invokes the **real M1 P875 policy panel** (not a rewritten imitation): local two-model comparison opt-in, declaration for isolated visible garment, manual original-photo review acknowledgement, category disagreement / tied rank abstention, cross-model top-five evidence policy, stale/aborted worker teardown.
- Applies approved model choice to native `clothingFields` original category/type **inputs on the unsaved draft only**; never changes source originals, owner-reviewed confirmation toggles, private IndexedDB, closet, cloud backups, 2D fallback or M2 3D. The original signed-owner P119 atomic reviewed-save is the only native stored-photo admission path.
- Revokes visible panel on native session lock, pagehide, tab hidden, dialog close; fails closed on owner/photo/draft change.

The test harness `scripts/test-main1054-dual-review-browser.mjs` uses the *exact real `clothingFields` source* extracted from the unchanged app and the real M1 P875 policy modules in desktop test Chromium/WebKit at 320/390/430 widths, generated **synthetic decodable JPEG** and synthetic owner auth. Mock observations exercise two-consent/ack, real field mutation with zero saves, category disagreement abstention, source SHA tampering, segmentation, saved item exclusion, and session-lock panel removal. **No actual model inference runs in this test.** Synthetic screenshots and JSON outcomes provide evidence. These are NOT genuine clothing photographs, physical phones, hosted cloud authorization, nor independently labeled accuracy.

### Missing real two-model operational proof (explicit blocker)

M1 worker expects the fixed-sha local `public/_dual82/` ONNX/WASM/runtime assets. Those large model assets are not present in the inspected repository branches; prior M1 CI fetched them via a guarded research asset installer. This branch does not download or deploy them. The owner-facing compare control can fail safely when local models are unavailable. This milestone demonstrates **native owner-bound model policy wiring**, NOT verified live FashionCLIP/SigLIP inference or WebKit continuous-session stability. Parallel assignment #83 remains owner of the crash.

## Acceptance and release gates

Strict no-deploy CI validates immutable parent + exact-path allowlist, no changes to core auth, cloud, original JPEG/photo/owner index, existing native recognition engine, or Outfit Board and 2D fallback; runs offline build, generated-photo Chromium/WebKit M1-to-M4 adapter policy tests, existing original-photo 2D native browser acceptance, 17 source tests, and full 2,003-test inherited source suite. **Exact-HEAD CI must finish SUCCESS before this milestone can be called verified.**

Remaining complete-Mission4 blockers: genuine source/photo accuracy independently human scored, actual two-model WebKit reliability, genuine photographer-source garment 163-bone reconstruction for both rig sizes/outfits, original JPEG same-item multi-photo identity, physical iPhone/Android acceptance, hosted authorized A/B RLS/cloud backup and recovery, final integration release candidate and owner Family Alpha approval. **NO MERGE / DEPLOY / PROD / STAGING / HOSTED SUPABASE / PRIVATE OWNER WARDROBES.**
