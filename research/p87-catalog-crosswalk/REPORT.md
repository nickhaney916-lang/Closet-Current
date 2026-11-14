# Assignment #87: owner catalog → outfit slots → 3D eligibility

Tracking #1149; handoff #1054. Family Alpha #255 OPEN/HOLD. Isolated draft only: no app wiring, merge, deploy, cloud, real account or private photo access.

## Exact-source audit

Base: master draft #1139 `07cc52756588c6143a3b6cd19e9eac848a949877`. This branch adds only this research contract, tests, browser runner, and dedicated no-deploy workflow. No donor branches combined or changed. Default main observed `8c3355350303399e9edc2e98beaf9de15d601282`; it is not the integration base.

| Boundary | Existing exact-base source and fields | Status / adapter behavior |
|---|---|---|
| Vocabulary | `public/local-catalog.mjs`: category, itemType; six positive categories, Uncategorized negatives | Reused through existing index; invalid category → Uncategorized; conflicting/uncertain type → Unknown |
| Saved metadata / search | `public/native-owner-wardrobe-index-167.mjs`: id, ownerId/userId/accountId, confirmed-independent saved values, slots, search tokens, sourcePairs | Existing reusable implementation; reproduced gap: it indexes saved category/color without checking `confirmedDetails`. Adapter filters to exact confirmed values before calling it |
| Explicit decisions | `public/clothing-memory.js` `confirm`: confirmedDetails for category/itemType/pattern/sleeveLength/fit | Exact current-value equality required; stale confirmation cannot certify changed prediction. Missing or negative stays unknown. No model score used as approval |
| Color | `public/app.js` editor; `public/native-reviewed-private-save-167.mjs`: confirmedColor true, colorSource user | Both markers required, or exact confirmedDetails.color. Photo-estimate remains Unknown |
| PHOTO119 native review | `native-reviewed-private-save-167.mjs`: ownerReviewed, humanReviewedSource, confirmedCategory, reviewProvenance; owner-bound IDB transaction | Does not emit a per-field revision-bound confirmedDetails object for every label. Broad booleans alone deliberately do not certify type/optional fields here. Native integration needs a receipt-bound conversion; UNKNOWN rather than silent promotion |
| Signed account / persistence | Private `closet-current-user-<owner>` IDB, native action auth/DB references and operation epochs; `research/main-thread-integration-1054/source-to-outfit.mjs` pins actual references | Host supplies authoritative lease and fresh read. Adapter is not authentication. Live native auth/DB reference bridge remains master-owned and unwired; cloud RLS NOT TESTED |
| Canonical original | `native-canonical-photo-source-167.mjs`: originalPhoto.image/sha256, sourceSHA256, sourceHashVerified, originalFileSha256/type/transformed | Rehash original bytes every retrieval; both digests must match. No writes/transcode. Native canonical JPEG may differ from raw imported non-JPEG: not called original camera-file identity |
| Derivative / split | segmentHint.cutoutSHA256, originalSHA256, ownerReviewedInstance, cropBounds; cutoutSHA256 | Existing index distinguishes cutouts. Preserve item IDs and source associations; no recrop or inferred physical identity. Fallback is verified full original, not an independently reverified crop |
| Item / physical / pair | id exists; outfitSourceId/sourceId associate sources. Shoe pair geometry is only a suggestion (`research/multi-garment-capture-01/shoe-pair-geometry-30.mjs`) | Stable universal physical garment/pair schema UNKNOWN. Optional garmentId/pairId/sourceReferences passthrough is a proposed contract, not an existing database migration. Never synthesize a second shoe or merge candidates |
| Duplicates | possibleDuplicate; sourcePairs and preview reject/review | Query never calls addition writer/reject or merges; preserves both distinct IDs and candidate metadata |
| Outfit | `public/outfit-board-engine.js` currentBoard.slots contains item IDs; closet-browser routes category/type | Same supported slots and unique item IDs. Dresses suppress bottom AND all torso layers, matching current app. No silent change to dress layering behavior |
| Restore / revocation | Master native durable-v3/unfinished-v4, owner/DB/epoch leases; existing atomic restore | Read fresh snapshot each call; no retained cache. Host revision must change on every edit/delete/source revoke/reimport/restore. Proposed deleted/sourceRevoked tombstone flags are adapter inputs, not claimed current DB columns |
| 3D consumer gate | M15 `research/main-thread-integration-1054/photographed-3d-evidence-gate15.mjs` never grants consumer 3D | No verified consumer geometry admission exists. This adapter cannot emit 3D_ELIGIBLE_VERIFIED, even if caller supplies that label/certificate |

## Normalization and coverage

| Confirmed category / subtype | Supported slots (ordered) | Layer semantics | Consumer 3D / source-original coverage |
|---|---|---|---|
| Tops / known or Unknown | top, layer | Base or layer 1 | No verified 3D; SHA-verified original 2D |
| Bottoms / known or Unknown | bottom | Below base | Same |
| Dresses, including romper/jumpsuit | top | One piece; suppress bottom + layer/layer2/layer3 as existing app | Same |
| Outerwear / known | layer, layer2, layer3 | Levels 1, 2, 3; ID appears once | Same |
| Outerwear / Unknown | none | Needs subtype review, conservative index behavior | Original 2D still available |
| Shoes | shoes | One saved inventory unit; no fabricated pair count | Original 2D; pair membership remains separately evidenced |
| Accessories / Bag | bag | Optional | Original 2D |
| Accessories / Jewelry, Sunglasses | accessory | Optional | Original 2D |
| Accessories / Belt, Scarf, Hat | finish | Optional | Original 2D |
| Unknown/Uncategorized or conflicting accessory type | none | Review bucket | Original 2D if source verified |

Raw saved records/manual decisions are never overwritten. Unconfirmed name/brand/material/size/occasion/notes/seasons are excluded from confirmed search. Explicit `confirmedDetails` can carry those optional fields; current producer does not provide all of them, so broader optional attribute indexing is blocked pending a proper review receipt. No heuristic synonym guessing. Missing original yields null fallback plus `original-source-unavailable`, never another item's image.

Per-item `2D_ONLY` is default. `3D_RESEARCH_CANDIDATE` requires verified original plus source-matched researchArtifact metadata; it is a candidate label only, with `consumer3D:false`. Source/licensing/rig/pose/geometry/expiry acceptance is unproven, not inferred from this flag. `3D_ELIGIBLE_VERIFIED` has no reachable path.

## Donor revalidation (no cherry-picks)

- M15 #1118 exact `8f9b6975b48e27833b32d6b2b3a17eab60a231ec`: source gate denies consumer 3D even for hypothetical perfect sampled measurements.
- Mission 2 #1144 exact `a848703f1b6a39763a18fab57e70472dadb64769`: genuine photo SkinnedMesh on two rigs/three poses; research only.
- Mission 2 #1147 exact `f2940dbfb027fd0331f956bef75b9b1f6edf99b2`: six sampled strict body/self crossings zero, but ~22k unresolved geometric self pairs; no continuous cloth/owner admission. Read current PR metadata; these donor experiments were not rerun here.
- #70/#77 scope remains pairing/duplicate evidence, not a universal physical-ID authority. This assignment never upgrades a geometric crop suggestion to owner pair confirmation.

## Integration handoff

`createCatalogCrosswalk({lease,readSavedItems,cryptoProvider})` returns async query(filters), item(id), board(board). `lease()` must be supplied by existing signed controller and return ownerId plus nonempty session/database/revision strings uniquely representing real live auth ref, private DB ref, operation generation and content revision. These are trusted dependency inputs, not user tokens or proof of hosted authentication. Same-owner logout/relogin MUST change session; mutation/revoke/restore MUST change revision. Master should wrap actual reference checks, not use persisted names/timestamps. Every asynchronous read/hash is checked against that lease. No cached pixels/index are retained. A consumer must revalidate its own publication lease before painting after an await.

`readSavedItems(lease)` must read only that actual private database and return saved source records with explicit ownerId. Ownerless legacy records fail closed; do not infer an owner from active session. `confirmedDetails` is value-bound evidence from trusted review writer, not model JSON. Optional fields require explicit receipt conversion. Unknown sourceReferences/pairId/garmentId remain null/empty rather than invented. API returns detached snapshots and never writes source or wardrobe.

Master integration is deliberately not taken over: select native auth/DB reference bridge, issue field-bound review receipts, wire durable revision invalidation, choose private renderer, and retain consumer NO-GO until independent geometry/licensing/rig/pose/expiry gate exists.

## Validation scope

Node contract cases use synthetic independent-account records and a synthetic JPEG envelope; they prove policy mechanics, not decoded photography or recognition accuracy. Browser runner uses actual unchanged `benchmark/fixtures/commons-0053.jpg`, SHA `e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019`. Existing attribution: `benchmark/locked-photo-sources.json`, Commons “Dress, match (AM 2017.66.33-1)”, CC BY 4.0, source URL and credit retained there. No public upload or new derivative created.

Commands/results are recorded below after execution. Physical Android/iPhone, signed hosted accounts/RLS, model accuracy, visual photorealism, cloth physics and actual consumer rendering admission are NOT TESTED. Browser checks validate module behavior and byte equality, not a user interface or physical phone.

### Local execution receipts

- `node --test tests/p87-catalog-crosswalk.test.mjs`: **13/13 PASS**, zero skips/failures.
- `node --test --test-concurrency=1 tests/*.cjs tests/*.mjs`: **2,623/2,623 PASS**, zero skips/failures, 122.16 seconds. First attempt lacked dependencies; after installing pinned CI packages, full rerun passed.
- `node scripts/build.mjs`: PASS. `git diff --check`: PASS.
- `node scripts/audit-p87-catalog-crosswalk.mjs`: native Chromium **6/6 checks PASS** using genuine licensed original bytes. Local WebKit launch **BLOCKED** by missing GTK4/Graphene/woff2/harfbuzz-icu/hyphen/manette/GLES libraries. Installing dependencies could not elevate (`su: System error`). No local WebKit pass claimed. Dedicated GitHub Ubuntu workflow installs dependencies and reruns both engines.

Exact-head GitHub Actions receipt will be linked in the draft PR after publication and inspection; local evidence is not CI evidence. No release acceptance claimed.

### Actual pairing and cross-capture donor compatibility

Revalidated donor #928 exact `306813d14679196d4124a21aa8977bdf07e9bf0d`, reading `public/outfit-unit-reconciliation-70.mjs`: `reconciliation70` carries ownerId/sourceSha256/maskSha256; `shoePair` or `combinedFragments70` retains confirmedByOwner, componentIds and companion.reconciliation70, with paired_confirmed/fragments_confirmed status. These are actual existing donor fields, although a universal pairId/physical garment ID remains absent. Adapter now exposes detached `unit` metadata from both receipts, preserves original component IDs and sourceId/outfitSourceId, and emits ownerConfirmed only for same-owner, same-original, distinct valid mask digests, correct status, original hash verified and no pending ownership confirmation. This reports the existing owner claim, not independent mask correctness or real-world pair truth. No companion pixels are copied into unit metadata and no unit-count mutation occurs. Unresolved grouping/ownership strips slot eligibility until reviewed. This does not integrate or edit P70.

Revalidated #963 exact `46b59e7cec22182cbe7c7222a456cf2aef3040fb`, reading `public/cross-capture-duplicate-77.js`: source/crop/mask/revision SHA receipts and `unitIdentity` primary/companion mask provenance exist; its same-item result remains UNLINKED/UNSAVED. Adapter does not turn that nonpersistent intent into a physical identity or add a new persistent view. Multi-photo references are preserved if supplied but remain an integration/storage blocker for real reversible alternate-view linking.

Two further adversarial cases cover actual P70 donor pair receipts, foreign companion owner, unresolved units and board refusal. **15/15 targeted Node PASS**. First exact published source tree remains `af51bad019fc59c62d8b84f8ea46699a4d9c3702`, commit `2f75b641ef4975c08dee0179834210301c5004df`; its prior 2,623-test receipt applies to that predecessor. Final expanded full-suite and exact-head CI receipts must be checked separately.

### CI harness correction

First no-deploy run [43608385191](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43608385191) at predecessor `2f75b641` failed 1/2,623 tests because `tests/pwa.test.mjs` requires built `dist/manifest.webmanifest`; workflow incorrectly built after testing. All other 2,622 tests passed. Build is now before full regressions. No test weakened or skipped. Final pair receipt validation also requires exactly two distinct unchanged component IDs with primary ID matching the saved item. Fresh exact-head CI is required for the corrected workflow and final code.

Final local expanded suite: **2,625/2,625 PASS**, zero skips/failures, 126.59 seconds. Final targeted contracts plus built-PWA smoke: **16/16 PASS**. Build and diff PASS. These source-tested results do not replace exact-head CI/browser receipts.

## Continuation: native live-reference session bridge

Predecessor `9ad3d4279541df173cce5a917130020fb0b9ab62` completed [exact-head no-deploy CI 43608771370](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43608771370): 2,625/2,625 full Node PASS, build and scope PASS, actual Chromium 6/6 and WebKit 6/6 SHA/source/fallback/slot/revoke/synthetic isolation checks PASS. This receipt belongs to that predecessor, not automatically to this continuation.

`createNativeCatalogCrosswalk({getSession,getRevision,readOwnerItems,cryptoProvider})` now implements the reference-aware bridge proposed above. It consumes the exact session shape audited in `research/main-thread-integration-1054/source-to-outfit.mjs`: authenticated, ownerId, epoch, operationEpoch, authRef, privateDbRef, privateDbName. Requires exact owner match in authRef.user.id and owner-specific database name, validates epochs, invokes the native assertCurrent method when present, and pins actual object references with ephemeral WeakMap IDs. Replacing auth/DB objects invalidates old reads even if owner/name/epochs remain identical. Nothing persists these reference IDs or exports auth/DB objects into query/item/board results.

The real controller must still supply a synchronous trustworthy `getRevision(capturedSession)` value that changes on every catalog edit, deletion, source revocation and restore. Changing the session during revision generation fails closed. `readOwnerItems(scope)` receives captured references and `scope.assertCurrent()` so an integration can read the exact captured database and check its lease inside a transaction. The wrapper checks again after await, and the existing adapter checks again after JPEG hashing. It does not assume that an owner ID or DB name alone proves a signed session. No JWT validation or hosted-RLS acceptance is claimed.

Six additional Node groups cover valid native fallback, same-owner auth replacement, identical-name DB replacement, auth/operation epoch change, logout, wrong auth owner, wrong DB, revoked auth, missing revision, mutation/restore revisions, and auth replacement during source hashing or revision callback. Browser runner adds native-original, exact-DB, same-owner-relogin and logout checks on the real licensed JPEG in both engines. Native bridge remains isolated and unwired; master controller integration, per-field native review receipts and independently accepted 3D remain explicit blockers. No production/auth/schema/model/geometry source is modified.
