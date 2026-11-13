# Closet Current Mission 1 P854 — async original-photo recognition belongs to the live signed owner

**FAMILY ALPHA HOLD #255 OPEN. RELEASE NO-GO.** Isolated Mission 1 research branch/DRAFT PR; UNMERGED and UNDEPLOYED. No production/staging, hosted Supabase, protected main, private wardrobes, family photos, live signed accounts or parallel branches modified.

## Verified exact parent

Mission 1 [P853 PR #982](https://github.com/nickhaney916-lang/Closet-Current/pull/982), immutable SHA `29d1905172ab21a277021ac40333174e70879a0d`, [NO DEPLOY CI #43367280945](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43367280945) **3/3 jobs SUCCESS**, 472/472 native, real desktop Chromium/WebKit 320/390/430 and 1280 synthetic offline human labeling, 48 image orientation cases, 11 public original JPEG source SHA receipts, inherited P852 device recorder and P850–P843 review, one-write, same-owner photos, shoe reconciliation and consent. P853 remains a DRAFT and no independently human-labeled original real blind dataset exists.

Parallel #80 [Issue #983](https://github.com/nickhaney916-lang/Closet-Current/issues/983) owns independent subtype model ambiguity. **P854 does not modify #80**, add another classifier, introduce labels, change scoring thresholds, learn from owner correction, or change normal approved category/type/color controls.

## Real source weakness and scoped engineering fix

The P853 `public/app.js` recognition path awaited `checkPhoto(original)`, possibly `enableLocal()`, then `localRequest('classify',...)`. On return it checked only whether a pending item with the original ID remained in `batch`. A photo recrop, replaced original recognition-photo image, changed garment instance mask, swapped draft object reusing an ID, or changed signed owner/session could produce a stale asynchronous response, which would then:
- set a quality-derived color or visual signature on the wrong current source;
- remove an owner's edited unsaved draft based on an old `blank` result;
- accept category/type/recognition-memory details from an old source;
- display a late error against the new owner; or
- unconditionally call `persistDraft()` in `finally`, risking writing previous-owner state to a different active private database.

P854 introduces a synchronous **owner/source revision lease** at the beginning of `recognizeItem()` and checks it on each asynchronous boundary before any later photo classification, blank deletion, model-result application, or error display. The lease binds:
1. the exact live authenticated `closetAuth.user` **object identity and owner ID**;
2. the same active `db` connection with owner-specific `closet-current-user-{id}` database name;
3. the same **pending draft object reference** (not merely matching item ID);
4. the same original `image` JPEG data URL and separate `recognitionPhoto.image` when provided;
5. the same normalized serialized `segmentHint` instance/mask metadata.

The worker receives the captured original-photo string, not an image source read *after* a model-load await. If an owner/source/unit lease has changed, the prior work returns without applying recognition or deleting drafts. Owner-switched jobs do not write old-owner snapshots through the `finally` cleanup. Same-owner recrops still allow their new unsaved draft to persist safely. No code in core model/worker/segmentation, color research, P849 lookalike decisions, P847 learning, P846 one-owner shoe pair, P850 review panel or P853 offline labeling is altered.

**Limitations:** This fences local asynchronous source/version ownership; it does **not** prove cross-tab compare-and-swap, hosted account isolation or physical-phone acceptance. A synchronous call has no interruption within the same JavaScript event loop, but cross-tab changes require Mission 3's storage revision protocol. The checked source strings are exact source identity in current memory, not cryptographic independent human evidence. Original photos remain unmodified.

## Reproducible before/after verification

`tests/mission1-stale-photo-recognition-lease-854.test.cjs` extracts and **executes the exact `recognizeItem` function source** from the current actual app within a restricted Node VM with deterministic synthetic photo, model and user/DB fixtures. This is not a text-only assertion. Cases include:
- normal owner-signed current photo -> reviewed unsaved draft, zero auto writes;
- recrop after async photo-quality check -> previous blank diagnostic must **not delete** current original;
- changed source `recognitionPhoto.image` -> never scan stale source;
- changed segmentation mask during async model inference -> no stale shoe or clothing labels;
- owner+DB switch during model inference -> no old-owner draft persistence and no interference with another owner's same-ID job;
- same-ID draft replacement -> old classifier cannot attach recognition;
- rejected stale worker error -> no misleading new-owner error;
- wrong owner DB before starting -> no photo scan;
- inherited P843–P853 private review/consent protections remain intact.

The first four old-code boundaries lacked these checks; all tests use synthetic bytes/labels **and are not independently validated recognition accuracy**. There are no real human-approved photo labels, no actual model precision/recall claim and no physical phone witnesses from this work.

## Engineering verification and release decisions

Dedicated strict immutable-P853-parent **4-path NO DEPLOY** workflow includes these source-executed lease race tests, full 472+ native regressions, both app builds, P853 annotation workstation and inherited P852–P843 actual Chromium/WebKit synthetic-user browser tests at mobile CSS widths, and 11 legally sourced original-public JPEG SHA checks. The P851 independent evidence release contract must remain **BLOCKED**. **CI PENDING.**

**Still blocking full Mission 1 release:** actual independent source-disjoint double-human-labeled clothing/photo/instance/shoe-pair accuracy via #75/#79/#71; actual witnessed physical Android Chrome and iPhone Safari via #78; real authorized signed two-owner cloud isolation/recovery acceptance via Mission 3. Do not lift HOLD #255, merge/deploy or claim a 10/10 recognition result.
