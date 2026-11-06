# Closet Current — Priority #119 / MANUAL-REVIEWED-ORIGINAL-PRIVATE-SAVE-119

**RESEARCH ONLY · Family Alpha Issue #255 HOLD · NO MERGE · NO PRODUCTION OR EXISTING STAGING MODIFICATION OR DEPLOY.**

## Verified source baseline

Pinned parent: [P117 draft PR #672](https://github.com/nickhaney916-lang/Closet-Current/pull/672) commit `d63989331a53a43c1374d77abbff05df5316cead`, verified [dedicated exact-head CI #42312616444](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42312616444): **1,073/1,073 inherited Node PASS**, real source-backed Chromium WebCrypto/IndexedDB at **320/390/430 CSS px 3/3 PASS**. P117's automatic model-suggested item admission is **research-only** and was proven to require manual review for user-edited clothing. Independent Parallel #48 owns real-photo model/instance scientific acceptance; Parallel #49 owns two-humanoid photorealism; Parallel #47 owns 3D mobile outfit integration.

## Why this is the highest-priority next independent gap

P114–117 guard asynchronous SHA-256 photo proof, cutout-byte identity, owner isolation and atomic persistence. But P117's atomic save accepts only `autoSaveSafe===true`; it cannot commit a previously **manually corrected** shirt, jeans, skirt, shoe or color. That makes the critical “AI got it wrong → human corrects category/type/color → save correctly to My Closet” path unverified in the research atomic bridge. Real families need this workflow more than an additional synthetic automatic-recognition policy.

## Engineering delivered

- New standalone `commitHumanReviewedPhoto119` private IndexedDB research adapter verifies an actual original public-license JPEG via browser/Node SHA-256 before any persistence. Original `image`, retained `originalPhoto.image`, SHA-256 and source identity remain unchanged.
- Requires an **explicit** source-bound owner's user-review decision: `confirmed:true`, exact record ID and original SHA, a recognized category/subtype pairing from the existing wardrobe catalog, a safe nonempty reviewed primary color (<=48 characters), and either explicit single-garment confirmation or per-instance cutout confirmation. AI proposals do not replace these corrected owner selections.
- Multi-garment reviewed items require a **second real SHA-256** of the cutout JPEG, source SHA linkage, nonclipped approved instance metadata, and exact reviewed cutout SHA. This establishes cutout-byte identity, **not learned instance segmentation accuracy, polygon/mask provenance or independent reviewer authenticity**.
- Preserves real original source JPEG and user-corrected category/type/color in the committed garment. Marks human review provenance explicitly, without fabricating actual model accuracy or independent third-party human validation.
- Reads the exact owner-bound `items` plus current `state.draft` before the asynchronous image verification. On returning, uses a single IndexedDB **readwrite** transaction to re-read both stores, revalidate owner, original source, explicit review and capture lease, reject stale drafts, source duplicates, duplicate IDs and foreign owner records, `add` the reviewed garment without overwriting, and remove ONLY that garment from the saved draft while retaining all other drafts and unknown metadata. A late lease failure aborts both stores together.
- Returns a frozen **status-only** verdict, with no private original JPEG, cutout bytes, hashes, user identity, item ID or saved wardrobe contents.

## Independent acceptance

New Node regression tests cover corrected category/type/color, true original JPEG bytes, incomplete/unsafe labels, wrong camera source SHA, source-bound verified separate cutouts, missing cutout evidence, two distinct items from one original versus exact cutout duplicate, duplicate whole-photo sources, concurrent saves, owner changes and user edits during the real SHA digest, concurrent saved wardrobe/draft modifications, late post-insert owner-lease abort, foreign owner database, incorrect current draft and no client/server external IO. All tests use existing **genuine public-licensed JPEG bytes** and synthetic user-review labels—not real inference accuracy.

New actual mobile-style browser test at **Chromium 320, 390, 430** and **WebKit 390** renders a standalone research review form with the genuine original photograph, real correction controls and real browser IndexedDB + WebCrypto. The test verifies saving a corrected Bottoms/Skirt/Cream item, another owner's independently corrected Tops/T-shirt/Blue item, correct source photo preservation, duplicate-reopen rejection, owner-specific private databases, untouched unsaved draft items, and no horizontal scrolling. Screenshots are from actual browsers, not AI-generated images or the deployed app.

## Verification protocol and limitations

Strict new branch-specific no-deploy GitHub Actions verifies exact P117 parent, only five allowlisted research files, full inherited tests, new Node tests, independent real Chromium and WebKit browser mobile research form, screenshot/evidence audit, and zero `public/`, production, existing staging or cloud changes. Record exact green run and HEAD only after CI succeeds.

**Research scope: not wired into the shipping app**, not signed account JWT/cloud RLS, not production IndexedDB, and not the real camera device capture UI. The review form is a standalone browser research harness; it is NOT proof that a real user has clicked the existing app's Adjust/Save buttons. The browser uses two synthetic owner IDs with separate local IndexedDB databases, which is not a security test of authenticated cloud accounts. Source-hash verification cannot establish the factual correctness of a garment classification or whether a cutout really contains one garment. This mechanism cannot undo an already completed transaction following later owner logout; a deployed controller must manage session lifecycle.

**Human-review claim authenticity is not independently established by `confirmed:true`**. Physical Android/iPhone, real model category/subtype/color measurements, actual independent annotation, whole-outfit detection accuracy, production cloud persistence, and arbitrary user-photo photorealistic 3D are separate unresolved acceptance gates.

**Family Alpha HOLD. Draft research branch unmerged; no production or existing staging changes or deployments.**
