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
