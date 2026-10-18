# Closet Current master development checkpoint


## Experimental real-photo garment-fragmentation spatial audit — October 18, 2026, Pacific

- Implemented `benchmark/instance-spatial-review.mjs`, regression tests
  `tests/instance-spatial-review.test.mjs`, and plugged analysis into
  `scripts/audit-independent-instance-reviews.mjs` and the existing
  pinned DeepFashion GitHub Actions workflow. All changes remain research-only
  in draft PR #7, development branch
  `fix/photo-clarity-high-quality-downsampling-20261016`.
- The problem: model proposals can represent two sleeves, two trouser legs,
  or several jacket panels of **one physical article** even when masks do
  not overlap. Earlier overlap-only checks could not surface nearby
  non-overlapping same-class proposals. The new audit retains exact
  source SHA, unapproved model status, exact model-mask foreground overlap,
  and a bounded 96×96 spatial gap. It records review-priority candidates
  **without merging masks, inferring garment counts, fabric truth, or
  changing automatic recognition or user UI**.
- Actual GitHub [DeepFashion 10-photo run 39167434166](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39167434166)
  succeeded: 15 focused Node tests pass, 0 fail. Inspected archived
  artifact `12150593325`, particularly
  `individual-instance-spatial-review.json`: **10 verified licensed
  source images, 34 unapproved model proposals, 81 proposal pairs,
  22 same-category near/overlap review pairs, 19 cross-category overlap
  review pairs, 41 combined priorities**. Importantly **5** same-category
  priority pairs are non-overlapping at exact source-pixel resolution;
  examples include `commons-0049` dress panels and `commons-0065`
  jacket panels. None is confirmed to be a duplicate garment or a valid
  separation without human reference outlines.
- Detail in `benchmark/REAL-INSTANCE-SPATIAL-REVIEW-20261018.md`.
  Original source images and original recognition RGB remain unchanged,
  0 automatic customer saves from research run, 0 independently approved
  human masks, null measured garment accuracy/recall, no paid inference,
  no model promotion or threshold relaxation. Existing 2-region,
  0-auto-save semantic worker baseline on worn `validation-0031` remains.
- **Next dependency, not faked:** obtain independent two-human source-identical
  per-item mask annotations and complete physical-garment inventories to
  distinguish model duplicate fragments vs genuinely separate layers.
  Compare garment recall, precision, contamination and original color,
  then select a safe replacement segmentation model only on verified data.
  No production merge/deployment or Drive Duel changes.



## New-item photo review → one-tap owned-wardrobe styling — October 18, 2026, Pacific

- Priority completed **only on draft PR #7 development branch**. In
  `public/app.js`, the existing manual photo-adjust dialog now offers
  optional **Save & style this** for new pending garment photos. A user
  selects/validates the category (Tops, Bottoms, Dresses, Outerwear, Shoes),
  saves the actual photo record, then opens anchored `styleNewClosetItem`
  suggestions in one action, using only items already stored in that closet.
  **Save changes** remains available; nothing new is mandatory.
- The combined action fails closed when the item remains Uncategorized or has
  an unsupported category: it leaves the draft unsaved for correction. An
  outfit worker's fragmented/original-crop region shows an explicit warning
  to inspect or crop a single physical garment before saving. The actual
  original, recognition crop, and display photo are not replaced.
- Removed a redundant draft persistence request after `savePiece()`,
  which already atomically commits saved garment and draft removal in one
  IndexedDB transaction; a second failing write could previously have
  displayed a false failed-save message after a successful save.
  Errors during the subsequent stylist navigation are now reported separately,
  so a durable wardrobe save cannot be mistaken for a failure to save.
- Extended `scripts/test-whole-outfit-save-mobile.mjs`: synthetic
  segmented-photo worker (explicitly **not real model accuracy**), two
  preexisting seeded owned items, negative unrecognized-category save
  attempt, positive one-action manual save → anchored stylist options,
  all option item IDs belonging to the saved closet, original outfit photo
  exactly preserved, independent captured-outfit board navigation, and
  storage/reload persistence. Emulated 390×844 touch viewport.
- Verified complete browser CI at
  [run 39166250030](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39166250030):
  every step passed. `OUTFIT_CAPTURE_HANDOFF`: `styledAfterOneTapSave=true`,
  `preexistingOwnedPieces=2`, `stylingUsesOnlyOwned=true`,
  `originalPhotoPreserved=true`, `savedBoardReloaded=true`,
  `pageErrors=0`. Existing `NEW_ITEM_STYLE_MOBILE` was also green,
  with 2 options and persisted one-piece swap.
- Full app build and Node CI at
  [run 39166245537](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39166245537):
  **741 passed, 0 failed, 3 skipped** (744 total).
- The **actual licensed whole-outfit** check still shows
  `validation-0031` only yields two uncertain mixed regions and **zero
  automatic saves**; no model accuracy was improved or claimed.
  The separate manual handoff test uses a simulated garment-split worker and
  synthetic owned items; do not present it as real-photo segmentation evidence
  or real-phone validation.
- **Next P1 blocker:** obtain real independently approved human outlines
  and full-photo inventories for layered outfits, then compare model instance
  masks and classification/missing-piece recall. The human review still
  cannot be simulated as ground truth. No unverified production model switch,
  paid inference, merge/deployment, or Drive Duel changes.



## Offline full-outfit independent review handoff — October 18, 2026 (latest)

- Next priority completed **on draft PR #7 only**: added
  `benchmark/assemble-physical-inventory.html`, a local/offline first/second
  reviewer inventory assembly tool with source-JPEG byte validation,
  SHA-256 and exact-name matched original photos, independently approved
  human-drawn outline imports, unique IDs and identity/provenance checks,
  consistent reviewer names, mask pixel validation, original-photo display
  and individual mask overlays, deliberate garment count, and two explicit
  full-photo completeness attestations.
- The builder creates `<source>.inventory.json` in the exact existing
  scorer format, **but does not make the masks, determine the correct
  garment count, or grant human approval itself**. The two named human
  reviewers must genuinely inspect every physical garment on the source
  including garments omitted by the AI.
- Added `scripts/test-physical-inventory-review.mjs` with synthetic-only
  negative/positive browser checks; connected it to the existing mobile
  CI workflow. Added a documented handoff guide in
  `benchmark/FULL-OUTFIT-INDEPENDENT-INVENTORY-GATE-20261018.md`.
- Full Node suite for code commit `2909926511b864f873e4b16afae7cdec9cc65950`
  [run 39163831599](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39163831599):
  **741 passed, 0 failed, 3 skipped**, including application build.
- Independently verified [mobile CI run 39163834314](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39163834314)
  **passed all stages**, including original mask editors, the new offline
  inventory smoke test, actual garment segmentation/recognition workers,
  real licensed outfit flow, owned-closet styling/swap and persisted outfit
  review. Browser log: `OFFLINE_PHYSICAL_INVENTORY` synthetic-only,
  `sourceHashBound=true`, `distinctReviewersRequired=true`,
  `humanCompletenessRequired=true`, `allVisibleGarmentCountMatched=true`,
  `offlineOnly=true`, `benchmarkRealPhotoAccuracyMeasured=false`,
  `pageErrors=0`.
- **Crucial limitation:** The real licensed full-outfit fixture is still
  **two mixed/uncertain garment regions with no verified automatic
  real-photo accuracy improvement**. No independently approved human
  instance reference masks or genuinely complete reviewed source inventories
  have been provided. Any reported accuracy stays null until that external
  two-person review is complete. Passing synthetic tests or workflow status
  cannot substitute for independent real-photo accuracy evidence.
- **Next remaining dependency:** Obtain actual two-human independently
  verified per-item reference outlines for `validation-0031` and other
  source-identical licensed outfits; use the offline builder to export the
  complete scene inventories, then run the independent detection/mask
  benchmark. Only after held-out real-photo results, consider promoting
  a revised segmentation model (requires user approval to change production).
- No production merge, deployment, paid service, customer data upload, or
  Drive Duel modifications.



## Full-outfit physical garment inventory scoring — October 18, 2026, Pacific

- Continued after the genuine one-photo diagnosis at `3f5b07d82bd047908dc483ef09ba3d3ad56b5836` on development branch
  `fix/photo-clarity-high-quality-downsampling-20261016`, draft PR #7.
- Added research-only `benchmark/physical-garment-inventory.mjs`, its
  synthetic unit regressions, and source-verified CLI
  `scripts/score-physical-garment-inventory.mjs`. The entire photo's independently
  identified garment inventory is now the denominator for missed-instance
  recall, not the AI proposal count. One-to-one maximum-cardinality/IoU
  matching prevents duplicate proposals from counting as extra clothing.
  Wrong broad categories, unsupported shoes/hosiery/accessories, and
  ambiguous unmatched predictions are explicitly reported.
- Extended the **internal** original-photo annotation editor to create
  blank, human-drawn physical garment targets (including garments with
  zero model proposals), plus a distinct second-reviewer approval screen.
  No customer UI changes or mandatory customer annotations.
- The ten-photo pinned DeepFashion experiment executes the new CLI in CI.
  The verified [pinned ONNX run 39162990829](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39162990829)
  passed the non-promotion gates. The ten reviewed-source inventory reports
  **zero independently approved complete human inventories**, so
  ten-photo and per-photo garment instance accuracy remain **null**.
  This is expected and correct; it is not a segmentation improvement.
- Full application suite [run 39162399218](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39162399218):
  **741 passed, 0 failed, 3 skipped** at the earlier pure scorer checkpoint.
  The browser annotation/second-approval regression also passed on
  `ad4e4a9c17e2a4e5010e5ff70bc1a53ae374243f`; final mobile workflow
  at later commits remains a separately monitored gate.
- Review instructions and a clearly **unapproved illustrative** inventory
  schema are in `benchmark/FULL-OUTFIT-INDEPENDENT-INVENTORY-GATE-20261018.md`.
  No reviewer outlines have been invented, approved, or promoted. Source
  descriptions and model suggestions are not pixel ground truth.
- **Next blocker, external to code:** obtain TWO genuinely independent human
  reviews and complete garment masks from the original licensed photos,
  especially `validation-0031` (blazer/shirt/skirt/tights/shoes).
  Only then evaluate real garment precision/recall and contamination for
  DeepFashion and separate shoe models. No model promotion without held-out
  evidence and explicit owner approval for production.
- No paid services, production merge/deployment, recognition-threshold
  relaxation, customer photographs, or Drive Duel changes.


## Verified real-photo model-decision diagnosis — October 18, 2026, Pacific

- Development commit `855f0261a09b636481347272de82647c0d1967b4`
  on draft PR #7 added **opt-in, aggregate-only** segmentation diagnostics.
  Normal customer capture does not request the diagnostic. It never changes
  original RGB, recognition crops, thresholds, saved clothing or mask approvals.
- Full GitHub Node suite [run 39161512221](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39161512221):
  **735 passed, 0 failed, 3 skipped**; production build passed.
  Independent mobile browser workflow [run 39161514948](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39161514948)
  completed successfully, including actual outfit and recognition workers,
  owned-item styling/swap checks and separated-outfit review/persistence checks.
  Mobile artifact **12149455579** contains the exact diagnostics and
  preserved source/display cutout pairs.
- Source-verified CC BY-SA 3.0 `validation-0031` (blazer, shirt, skirt,
  tights, heels): 128×128 semantic logits, person evidence passed. The
  independent description expects garments; these are **not** pixel-level
  ground-truth annotations.
- Actual model decisions: **Upper garment** won 396 mask cells but only 56
  survived strong pixel confidence; 52 survived small-component filtering,
  then the group failed the mean-confidence gate. **Skirt** won **zero**
  mask cells; **Bottoms** won 10 cells, none confident. **Dress** won 1,120
  cells and 527 trusted cells and was emitted as a mixed, visibly incorrect
  region. **Shoes** won 312 cells, 217 trusted and also emitted as an unsafe
  fragmented region.
- Observed end-to-end outcome remains **2 candidate regions, 0 automatic
  saves, 2 manual review holds**. The 2 original photographs / source crops
  per candidate are retained across the existing reload assertion; there were
  no page errors. The source RGB and original classification source are
  never overwritten by the diagnostic.
- **Root-cause scope:** the production semantic segmentation model fails to
  predict a distinct skirt on this one real layered outfit and has weak
  confidence on the upper garment. Relaxing postprocessing gates cannot
  recover the missing skirt class, and would risk false saved clothes.
  Do not infer per-item recall/precision, color accuracy, phone performance,
  improved model accuracy or readiness from this 1-photo result.
- **Next priority:** obtain independently approved per-instance masks
  on source-identical licensed worn outfits, then compare the pinned
  DeepFashion review-only proposals (and separately licensed footwear
  proposals) against actual references. Require held-out garment-level
  precision/recall and background contamination evidence before any
  automatic-save or customer-model change. Leave production, paid services
  and Drive Duel untouched.


## Genuine whole-outfit app benchmark — October 18, 2026, Pacific

- Continued from `fd121845c526f74f3192d984ddbf2dd3e5396a30`, which passed all
  23 PR workflows. This Work chat remains the main development thread.
- Added `scripts/run-real-whole-outfit-flow.mjs` to existing mobile CI. Uses the
  actual production segmentation and recognition workers on hash-verified,
  licensed full-body fixture `validation-0031` (blazer, shirt, skirt, tights,
  heels). Authentication alone uses a local test identity; no seeded closet
  records, manual labels, synthetic workers, paid calls, or cloud writes.
- First actual app run: commit `2e516024e9f1b343c2e56218d2d524d54f12f11a`,
  GitHub mobile run **39145377246**, artifact **12143605708**, report
  `real-whole-outfit-flow.json`: **2 emitted candidates, 0 automatically saved,
  2 pending review, 0 page errors**. Both retained original photo and unmasked
  recognition crop. Visually inspected exported original/display crop pairs.
- Confirmed failure: one mixed blazer/shirt/skirt region has a Dresses hint,
  but classification stays Uncategorized rather than inventing an owned dress.
  The shoe crop reaches Shoes/Unknown, with no confirmed color. Blazer, shirt
  and skirt are not independently recovered; tights remain outside the catalog.
- This is a real model/app failure baseline, not an accuracy improvement or a
  completed outfit workflow. Style this was **not exercised** from this capture:
  no item saved automatically. No mask IoU, color accuracy or phone claim.
- Tightened the benchmark to reject unexpected automatically saved categories,
  explicitly mark styling blocked when nothing saves, and compare exact original,
  recognition and display image strings for pending/saved records after reload.
  An empty saved collection now yields null, never a successful-save claim.
- Local build and Node suite remain **695 passed, 3 skipped, 0 failed**. Browser
  validation runs in GitHub because local Chromium installation is unavailable.
  Inspect final commit CI for the added pending-reload assertion.
- Next priority: diagnose why the production worker emits only two regions for
  this case; evaluate source-preserving region/instance candidates on this and
  more licensed full-body fixtures before changing model thresholds. Keep the
  existing safety gates and source RGB. Do not accept a false dress to raise
  automatic-save counts. Clipping reference masks still need independent review.
- Production, paid services and Drive Duel remain unchanged.

## Work main-thread continuation — October 18, 2026, Pacific

This Work conversation is now the main development thread. Supersedes the older
priority order below: real-photo whole-outfit separation, original-first automatic
indexing, clothing clarity, then Style this using owned clothes.

- Resumed exact remote HEAD `7c9ed65f33ec525fc34ae702634871ad1638e090` on the existing
  development branch / draft PR #7. Independently checked all 23 PR workflows:
  completed successfully. PR remains open, draft and unmerged.
- Reproduced and fixed a source-evidence gap: capture accepted separated garment
  outputs without a valid original-RGB recognition crop, letting the indexing
  fallback inspect a display cutout. Require the original crop before enqueueing;
  preserve valid partial results and offer retry when source crops are missing.
  Two behavioral regression tests failed before the fix and pass afterward.
  This is input-contract protection, not a measured model accuracy improvement.
- Build passed. Full local Node suite: **695 passed, 0 failed, 3 skipped**.
  Focused source/capture/worker suite: **21 passed**. Added these checks to mobile CI.
  The first pre-build test attempt lacked generated PWA assets; rebuilding resolved
  that setup failure. No runtime patch was needed for it.
- Inspected genuine checkpoint artifacts: mobile run **39143869856**, artifact
  **12142796880**: 14/14 broad categories correct, **8/14 automatically saved**,
  **6/14 awaiting color confirmation**, zero page errors. These are single-garment
  photos, not whole-outfit extraction or independently scored color accuracy.
- Inspected experimental run **39143869995**, artifact **12143110187**: all eight
  cases processed, all eight automaticCatalogApproved=false. commons-0059 is a
  dress-and-jacket display; the expected outerwear is absent from detected output.
  Its comparison visibly loses upper garment material. Six other display fixtures
  and one worn-upper-body fixture do not form a head-to-toe outfit benchmark.
  Extra predicted regions are unverified, not automatically false positives.
- Local genuine browser inference is blocked: Chromium absent; Playwright's
  download repeatedly returned invalid ZIP archives. Do not substitute simulated
  workers or report a new real-photo score. Existing GitHub workflows can run
  browser regression coverage after this commit.
- Next: inspect new exact-HEAD CI, establish licensed head-to-toe multi-garment
  fixtures with expected visible pieces, then run actual outfit worker through
  recognition, save and owned-clothes styling. Keep automatic saves separate from
  manual confirmations. Six independent mask approvals remain outstanding;
  do not promote experimental masks or tune thresholds to unapproved outlines.
- No production merge/deployment, paid service, or Drive Duel changes.

## Clipping and color-evidence repair — October 17, 2026, evening Pacific

Continued from `55e4a032383ff8e9910b161154878c20d37b3a4b` on the same development branch / draft PR #7.

- Fixed a reproduced display-clipping defect: confident skin, hair and limb labels were discarded before tiny-hole cleanup, allowing same-color non-clothing pixels to be restored as fabric. Retain separate semantic labels solely to veto those repairs; clothing groups, source photos, recognition crops, model thresholds and MODNet 128 are unchanged.
- Fixed a reproduced color-evidence defect: an upscaled mask could count the same source pixel repeatedly. Sample distinct original pixel positions; a 256-cell mask backed by only 16 source pixels now remains insufficient evidence rather than a confident color.
- Both added regressions failed before the fix and passed afterward. Focused clipping/color/edge suite: 37 passed. Full local Node suite: 618 passed, 3 skipped, 0 failures. Build passed. All 59 locked and 11 fresh source photographs verified against their recorded hashes.
- Real-photo browser inference could not start locally: Chromium was absent, and its download returned invalid archives. GitHub real-photo recognition and clipping workflows are the remaining verification gate; do not report an accuracy improvement until their results are inspected.
- No paid inference enabled, production merge/deployment requested, or Drive Duel changes made.

## Single-conversation handoff — October 17, 2026, afternoon Pacific

The owner selected this ChatGPT conversation as the **single place for project decisions and progress reports**, consolidating the previously separate ChatGPT Work-mode benchmarking and try-on threads. Chat transcripts themselves cannot be merged, and other open conversations are not automatically stopped; the GitHub draft branch and this checkpoint are the reproducible shared state. Future changes from another session must be read from current GitHub HEAD first; do not duplicate, overwrite or force-push.

- Repository and integration target: `nickhaney916-lang/Closet-Current`, branch `fix/photo-clarity-high-quality-downsampling-20261016`, **draft PR #7**; `main` and Drive Duel must remain untouched.
- Latest audited code head before this handoff: `85d79988f709ea4f5f2d67b9b9af8951e52b07ce`. Later development may advance it; always fetch the current head rather than assuming this SHA is current.
- The Work benchmarking contributions include difficult-background segmentation experiments, preserving white sneaker soles, and **display-only** transparent garments on the closet rack; these are not proof of accurate clothing-only AI cutouts. Review-only masks and six independently unapproved reference outlines remain open.
- Two **photorealistic fixed male/female model preview thumbnails** are in the draft app; their full-resolution provider input photographs are packaged separately and are **not hosted in the app yet**. The account-bound, server-side paid try-on interface is coded, but real provider inference has **not been run** and the pilot remains disabled. Selfie face personalization and multi-item generated outfits are not implemented.
- Latest verified CI evidence on shared head: [camera/indexing run 39082003111](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39082003111) — 616 passed, 0 failed, 3 skipped; [mobile run 39082023950](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39082023950) — 143 passed, 0 failed; [AI request guard run 39082023937](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39082023937) — 3 passed, 0 failed. The phone-sized licensed-image flow observed 14/14 correct **broad** garment categories, 8/14 automatic saves and 6/14 pending review, with no page errors. The try-on browser simulation sent **zero** actual provider calls.
- Current priorities, in order: reliable point-and-click real-phone clipping and accurate indexing (no mandatory human approval); the two standardized AI figures connected to **real** generated one-piece try-on with strict paid-cost authorization; extend to multi-garment outfit visualization; optional consent-based selfie face; one-tap owned-wardrobe swaps; launch privacy/onboarding testing.
- Financial constraint: do not enable paid AI, purchase services or start billable inference without explicit owner approval. Keep real human selfie/face uploads opt-in only.
- Immediate next technical hinge: securely stage/host the already prepared two full-size AI model photos, then verify a controlled single-garment provider run **only after** permission and budget safeguards. Continue realistic photo clipping benchmarks in parallel. Avoid claiming the silhouette, flat thumbnails, or isolated garment photographs are completed AI try-on.


Updated October 17, 2026 (America/Los_Angeles). This section supersedes the
historical notes below. This conversation is the owner's main development chat.

## Single working branch

- Repository: `nickhaney916-lang/Closet-Current`.
- Development: `fix/photo-clarity-high-quality-downsampling-20261016` (draft PR #7).
- Verified consolidation base: `ed35cb1a23a3075ae17da9db76c13d92c83d6940`.
- All 18 published branch tips inspected at consolidation are ancestors of this
  development head. No published branch merge was necessary.
- `main` remains the production branch. Consolidation does not deploy or merge.
- Another chat added `dd7917e` and `2ccf3fb` during this session; both are included.
  Subsequent try-on tests `6be88ff` and `ed35cb1` were also preserved.
  Other chats are not automatically paused by this checkpoint.

## Current work included

| Area | Included state | Remaining limit |
| --- | --- | --- |
| Photo/cutout quality | High-quality downsampling, mask review/scoring tools, original-pixel previews, sharp MODNet 128 reference | Difficult backgrounds, shadows, pale fabric and clothing-only isolation remain unresolved |
| Shoe preview | `4de540d` guards against the observed white-sole erasure; nine licensed sources checked | One preview accepted, eight original-photo fallbacks; not a segmentation accuracy score |
| Closet browsing | Default Closet View, one-item navigation, position restoration, transparent preview support | Physical-phone acceptance still needed |
| AI figures / try-on | Standard male/female selection and private server-side pilot foundation | Real provider run, hosted model assets, layered outfits, shoes and optional selfie face are not established as complete |
| Paid-service safeguards | Signed-in read-only readiness check; try-on UI stays disabled until availability succeeds | No paid calls authorized; no production configuration changed here |

## Evidence and status

- Shoe-preview checkpoint: 63 focused Node tests passed, nine source SHA-256 checks
  passed, and app build passed locally. GitHub equivalent is `4de540d` (same tree
  as local `919580c`).
- CI for later branch heads must be checked by exact SHA. Previous test counts
  do not establish that every newer workflow passed.
- Do not equate passing software tests with garment pixel accuracy or real-phone
  performance. Preserve original clothing photos and fail safely when uncertain.

## Priority order

1. Reliable photo clarity, automatic garment-only clipping, category and primary
   color indexing; fix difficult-background/pale-fabric failures with real evidence.
2. Real-phone capture, persistence and account onboarding validation.
3. Two realistic standard AI figures and one-garment try-on, then layered outfits,
   footwear and optional user selfie face. Paid usage requires explicit approval.
4. Style new clothes using owned clothes, then the remaining trend workflow.

Keep point-and-click controls large and uncluttered. Preserve the separation of
Inspiration and owned-clothes styling. Do not add mandatory manual cropping.
Drive Duel is outside this project and must not be modified.

## Historical drafts preserved, not activated

See [consolidation inventory](consolidation-20261017/README.md). Three local
snapshots were absent as current, tested implementations. They are retained as
inactive patches for deliberate reconciliation; do not blindly apply old full
files over current runtime code. Original workspaces were left untouched.

## Coordination rule for future chats

Read this file first. Fetch the current branch and inspect its head before editing.
Use this branch as the integration target, with an isolated worktree for changes.
Before publishing, compare the latest head and preserve intervening commits;
never force-push over another chat. Update this checkpoint with exact commit,
validation, limitations and next action. Do not start duplicate work in another
chat without assigning it a distinct scope. This is guidance, not an automatic
cross-chat lock or cancellation mechanism.

---

# Historical checkpoints (not current status)

# Closet Current progress checkpoint

## Current checkpoint — October 14, 2026, evening Pacific

Saved at the owner's request before further personal testing. Stable application source: `b6490e8af2eabefb370fac7b5bf0a7d375dd9922` on `main`. Live app: https://closet-current.pages.dev/

- Preserve the current interface: shared clothing figure without gender controls; one base shirt; independent shirt/sweater, jacket and outer-coat layers; Dresses switches to a dress-and-shoes figure. Backup controls remain at the bottom.
- Separate clothing photos populate independent layers and survive reload. Dress preview can be canceled without changing the shirt look; selecting a dress removes incompatible outfit slots without deleting clothing records.
- High-resolution capture, automatic outfit crops, originals, private account backup and existing recognition remain preserved. Drive Duel was not accessed or modified.
- All 237 Node checks passed. Main's camera/indexing, mobile capture/persistence, WebKit, display comparison, private backup, Cloudflare deployment and GitHub Pages workflows passed. Physical-phone accuracy is a separate open validation task.
- Latest recognition evaluation: reviewed categories 26/32, exact types 18/32; fresh categories 11/11; harder holdout clothing categories 7/13. These results do not justify unrestricted public-launch accuracy claims.
- Email/password flows and PWA installation help exist. Current SMTP configuration and real inbox delivery remain unverified. Authentication links still target GitHub Pages while the main shared app link is Cloudflare; verify the redirect allowlist and align the chosen origin before invitations.

Next work: follow [PILOT-READINESS.md](PILOT-READINESS.md). Prioritize labeled real-phone crops, category and primary-color accuracy, reliable saving, and email onboarding before adding features. No runtime or authentication settings changed for this checkpoint.

## Earlier checkpoint history

The dated notes below describe earlier states; the current checkpoint above supersedes their counts and open-item status.


Originally paused at the owner's request on October 14, 2026, 7:44 AM America/Los_Angeles. Development resumed at the owner's request later that morning.

## Current saved state

- Repository: nickhaney916-lang/Closet-Current; production branch: main.
- Application source at pause: `686f88679b00678527c98569d1b09be8dcd96d04`.
- Live app: https://closet-current.pages.dev/
- Phone photo check: https://closet-current.pages.dev/phone-photo-check.html
- The photo-check page returned HTTP 200 and matched the built release identifier and recognition-vector digest.
- Simplified navigation and high-resolution camera functionality are preserved. Drive Duel was not accessed or modified.

## Recognition work completed

- Verified rollback camera/indexing tests passed.
- Full-garment preprocessing improved the original 32-photo category result from 19/32 to 23/32 and shoes from 8/13 to 11/13.
- The later validated prompt profile reached 26/32 categories, including 12/13 shoes; 7/13 categories on additional garments; and 10/11 categories on fresh photographs.
- Per-photo regression enforcement protects all 59 fixtures, including three nonclothing images. Known annotated subtype mismatches remain explicitly visible.
- Eight subsequent subtype/recovery candidates were evaluated. None safely improved recognition, so the production model, vectors, confidence gates and preprocessing were retained. Detailed metrics and rejected changes are preserved in docs/SUBTYPE-RECOGNITION-RESULTS.md and benchmark/subtype-experiment-results.json.

## Latest completed delivery

Optional phone-photo validation is deployed and linked from My account → Device help.

- Supports up to 20 single-garment photos with independently supplied category labels and optional type labels.
- Locks expected labels before inference, uses the production local worker and the app's photo-import conversion, and does not save wardrobe items.
- Downloads a report with safe labels, rejection diagnostics, timings and version identifiers. Images, filenames and account information are excluded; nothing is sent automatically.
- Handles scanner timeouts, partial failures and restarting the test.
- All 166 automated tests passed.
- Real-worker phone photo-check flow, camera/indexing tests, mobile capture/persistence flow, Cloudflare deployment and GitHub Pages deployment passed.
- Browser tests use licensed fixtures at a phone viewport; physical phone hardware and new user garment accuracy remain unverified.

## Exact next step when resuming

Collect real phone evidence before further recognition tuning:

1. Open the phone photo check and choose 5–10 different garment photos, including dresses, long tops, sneakers and boots.
2. Supply expected labels before running recognition. Leave the optional subtype blank when uncertain.
3. Download closet-phone-photo-results.json and attach it to the development conversation.
4. Analyze mismatches and error stages. Request only the particular numbered garment images needed for visual investigation, then test targeted changes against the phone evidence and existing 59-photo safeguards.

The prior uploads inspected were setup screenshots, so no user phone garment dataset or new phone accuracy claim has been established. See docs/PHONE-PHOTO-VALIDATION.md for the collection workflow and evidence.

## Other open priorities

Physical-phone capture/login validation, reliable authentication email delivery, cloud wardrobe backup/synchronization and eventual subscription readiness remain open as documented in docs/ROADMAP.md. They have not been completed by these recognition tasks.

## Resume validation

Added an automated mobile WebKit photo-import and persistence check. EXIF orientation, high-resolution import limits, actual-worker T-shirt recognition, IndexedDB persistence and phone layout passed on the validation branch; all 166 existing Node checks passed. See docs/WEBKIT-MOBILE-RESULTS.md. Product camera and recognition behavior are unchanged.

Development is resumed. Real phone garment reports remain the next input needed for recognition tuning; physical-phone camera and production-login tests remain open.

## Authentication continuation

Reviewed Closet Current's public Auth settings and project health. Added clear email delivery/rate-limit messages and validation of unreadable service responses; 170 automated checks passed. Supabase management access requested reauthentication, so SMTP settings were not modified and real inbox tests remain open. See docs/AUTH-EMAIL-READINESS.md. Recognition, simplified navigation, camera resolution and Drive Duel are preserved.

## Display continuation

The owner chose to polish the existing display rather than redesign the app. Compact labeled filters, more consistent clothing cards and responsive spacing passed a four-width visual comparison and 170 automated checks. See docs/DISPLAY-POLISH.md. Preserve the current purple/peach colors and simplified navigation in subsequent work.

## Private cloud backup continuation

The owner requested automatic saving without individual phone-gallery files after nine items were captured. Added private account-owned photo storage and revision-protected metadata, durable pending changes, offline retry, existing-local migration and independent-browser recovery. 181 checks, live Supabase account-isolation tests and the browser recovery flow passed. No real user wardrobe was inspected; actual items migrate when the updated signed-in app runs. See docs/CLOUD-BACKUP.md for limits and verification.
