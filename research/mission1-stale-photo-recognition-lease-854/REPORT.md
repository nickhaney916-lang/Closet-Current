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

The first four old-code boundaries lacked these checks; all tests use synthetic bytes/labels **and are not independently validated recognition accuracy**.

**Browser harness compatibility:** The inherited P843 Chromium/WebKit scanner harness previously omitted both an authenticated owner and the user-specific IndexedDB name, even though it executes source in a genuine browser. P854 adjusts that test-only fixture to provide an explicit **synthetic** owner object and matching database name, so it can exercise the *real* browser security fence without lowering the app's signed-owner requirement. Older Node VM tests without `window.document` remain headless-only and are never real-account acceptance. No test fixture is a real authorized signed account. There are no real human-approved photo labels, no actual model precision/recall claim and no physical phone witnesses from this work.

## Engineering verification and release decisions

Dedicated strict immutable-P853-parent **5-path NO DEPLOY** workflow includes these source-executed lease race tests, full 472+ native regressions, both app builds, P853 annotation workstation and inherited P852–P843 actual Chromium/WebKit synthetic-user browser tests at mobile CSS widths, and 11 legally sourced original-public JPEG SHA checks. The P851 independent evidence release contract must remain **BLOCKED**. ## Verified P854 executable-head results — November 12, 2026 Pacific

At exact executable SHA `8cd769fa3fe251a8faf735a343bc4451bc9bb08e`, [P854 strict NO DEPLOY GitHub Actions #43369402608](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43369402608) **COMPLETED SUCCESS — all 3/3 jobs**. Verified immutable P853 parent and exactly **5 approved changed paths**. This source changes only `public/app.js`, its source-executed race tests and the existing P843 *synthetic-only browser harness*, with report/workflow; no model/worker/photo storage or hosted account changes.

- **9/9 P854 targeted actual `recognizeItem` source-executed tests PASS** (synthetic original JPEGs, missing DB/other owner, mask/source/crop, same-ID draft replacement, blank false deletion, late model error, no automatic save).
- **481/481 full native Node tests PASS**, 0 failures, both unchanged local research application builds pass. The P851 signed independent human/physical phone/hosted cloud release check remains **BLOCKED** with `shouldLiftFamilyAlphaHold:false`.
- Real *desktop engine* Chromium and WebKit at 320/390/430 passed the P853 offline annotation workstation, P852 diagnostic device panel and inherited P850 queue/P849 cross-photo duplicate/P848 color/P847 owner-consented learning/P846 one physical shoe-pair/P844 single-write/P843 mandatory original-photo owner review tests. Specifically the corrected P843 harness reports **6/6 strong/broad/direct-save blocked**, zero page errors. **No physical Android/iPhone hardware was exercised.**
- **11/11 immutable lawfully sourced public original JPEG hashes VERIFIED**, one limited-resolution advisory, **0** independently adjudicated human clothing labels, actual model accuracy improvement **UNKNOWN**. Source-byte integrity is not an accuracy score.

### Debug and protection rationale

1. First integration run [#43368561879](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43368561879) failed many unrelated legacy VM fixtures that deliberately run without `window`/indexedDB. In a deployed browser `window.document` is always available, so that branch requires the exact live signed-user object and owner DB. Headless `vm` unit tests with no browser `document` continue as headless tests and never claim account isolation; P854's *new* source-executed tests provide an explicit `window.document` to exercise the actual signed-owner gate.
2. The next full native runs [#43368740251](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43368740251) and [#43368817585](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43368817585) exposed absent `db` in old VM tests and a P845 headless fixture expecting the owner ID in its optional photo advice. The compatibility handling uses `typeof db` in non-browser VM and retains the owner's ID in advice, without relaxing actual-browser authorization.
3. Functional-head [#43368954393](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43368954393) first passed all 481 native+original-photo tests but exposed the inherited *actual-browser* P843 synthetic test fixture missing signed user and owner DB namespace. The test harness now supplies explicit `synthetic-owner-843` and `closet-current-user-synthetic-owner-843`, without weakening production logic. The corrected full run #43369402608 passed **3/3**, including 6/6 P843 genuine-browser-engine cases. No simulated account is represented as a real authenticated owner.

**This documentation-only commit modifies no tested executable code. An exact-final-head CI rerun is required; do not claim release acceptance or lift FAMILY ALPHA HOLD #255.**

**Still blocking full Mission 1 release:** actual independent source-disjoint double-human-labeled clothing/photo/instance/shoe-pair accuracy via #75/#79/#71; actual witnessed physical Android Chrome and iPhone Safari via #78; real authorized signed two-owner cloud isolation/recovery acceptance via Mission 3. Do not lift HOLD #255, merge/deploy or claim a 10/10 recognition result.
