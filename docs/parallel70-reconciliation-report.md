# Parallel #70 — Owner-reviewed garment-unit reconciliation

**FAMILY ALPHA HOLD #255 — DRAFT, UNMERGED, UNDEPLOYED.** Tracking Issue [#925](https://github.com/nickhaney916-lang/Closet-Current/issues/925). Exact direct research parent Mission 1 P840 PR #922: `c44166443e52ac7487ea84d8218098ff629610d2`. No hosted Supabase, production, staging, signed private account, training/model, cloud, or real family-wardrobe changes.

## Implemented source behavior

P840 optionally splits connected footwear masks into separate P839 owner-reviewed unsaved drafts. A detected shoe *region* is not necessarily an owned shoe *pair*. The new opt-in requires both URL flags: `?outfitInstances840=1&outfitUnits70=1`. Normal use remains P840's prior behavior.

- Each opt-in original captured JPEG and P840 selected mask is SHA-256 hashed in the existing worker using browser WebCrypto. Only the user-private owner draft gets source/mask hashes; no photo, filename or account is logged. Existing geometry, pixel crop, segmentation logits and model confidence are unchanged.
- Each detected region enters the existing privately persisted **unsaved** source-preserving P839 photo review flow. Each carries original scene JPEG, cropped image, source SHA, mask SHA, capture owner ID and unresolved status. User identity is checked again before acting on a stale worker result or grouping proposal.
- `outfit-unit-reconciliation-70.mjs` uses category, compatible known subtype, photo/crop geometry, clipping, confidence-supported common color, source/mask identities and duplicate evidence. Matching-color geometry is a **suggestion**, NEVER independent ownership proof. Multiple ambiguous shoes are held for review, not forcibly paired; other garments are not automatically merged.
- Owner-facing controls show both source cutouts; owner may confirm a matching footwear pair, keep pieces separate, explicitly combine same-category mask fragments, discard a false region, or separate a confirmed pair again. Pair consolidation yields **one unsaved draft** carrying original JPEG plus both cutouts; it never inserts an item into the private closet.
- Original P839 Adjust still requires active category, type-or-Unknown, color and photo acknowledgement before saving. Unresolved unit decisions and already saved matching source/mask identities are blocked from saving. Crop on a paired draft is disabled until the owner splits it.
- A failed/reloaded split retains the original photo drafts in existing IndexedDB. Drafts remain unresolved until deliberate owner review.

## Evidence boundaries

Synthetic test masks and mock worker/browser cases test logic, protected save flow and visible controls; these **are not genuine model accuracy evidence**. P68 independently reports research segmentation improvements but has not furnished independent *shoe pairing ownership* labels to this assignment. Genuine pairing precision, count correctness, repeated photo performance, physical iOS/Android compatibility, and independently annotated source-disjoint footwear-pair acceptance **remain OPEN**, even if CI passes.

## Reproduction

```sh
npm install --no-save --no-package-lock playwright@1.56.1 sharp@0.34.3 fake-indexeddb@6.2.4 three@0.180.0 three-mesh-bvh@0.9.2 axe-core@4.10.3
node --test tests/outfit-unit-reconciliation-70.test.mjs
node scripts/build.mjs
node scripts/build-m1-no-account-trial-831.mjs
node --test --test-concurrency=1 tests/*.cjs tests/*.mjs
npx playwright install --with-deps chromium webkit
node scripts/run-parallel70-browser.mjs benchmark/parallel70-browser
```

**Release decision:** independent research. Do not merge, deploy, invite family testers, or assert 10/10 recognition.
## Verified no-deploy engineering checkpoint (November 12, 2026)

At exact research SHA `0827547def622e76e2c81b98202ec4379e0cc884`, [Actions #43287030532](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43287030532) passed both jobs:
- Native P840-parent full suite: **311/311 passing, 0 failures/skips**; source-safety module tests 9/9; static build and owner-free research-preview build succeeded. The source execution test SHA-verifies the actual worker's JPEG bytes and four unique synthetic-logit mask receipts in opt-in mode, while demonstrating default P840 payload is unchanged.
- **Six actual Chromium/WebKit DOM browser scenarios**: 320, 390, 430 CSS pixels each. Each starts from two visible locally synthesized valid JPEG shoe regions with matching authentic source JPEG SHA-256, shows the pairing suggestion, retains both thumbnails, explicitly confirms one pair into one **unsaved** draft, then separates it back into two unsaved source-preserving drafts. All show zero owned closet writes, no JavaScript errors and no horizontal overflow. Captured six proposal and six final screenshots, each retained in artifact.
- Independent download of [browser ZIP artifact #13974573782](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43287030532/artifacts/13974573782) verified SHA-256 `f167e8e7bc72d5697f1c9f133ac186712611ccf0e292ecc34c3448aae08f393c`. 320-pixel proposal screenshot was visually reviewed: two separately visible source-JPEG thumbnails, large confirm/keep-separate buttons, region selection, clear discard/combine choices and no clipped controls.

**Crucial qualification:** the images in the browser review test are locally synthesized JPEG graphics, and the segmentation worker messages are simulated; they are NOT actual model-found shoes or human annotated footwear pairs. P68 upstream reports real-image mask-level segmentation diagnostics, but separate human pair ownership labels do not exist in these fixtures. Therefore measured pair accuracy, wrong pair merges/splits, independent holdout ownership count accuracy, real camera→classifier→pair→private storage acceptance, real account-switched workflow and physical phone gates are **not** satisfied. This work is an operational owner-review safety trial, not completed ML acceptance.

No production or staging changes, no cloud or private accounts, no inference architecture changes. **FAMILY ALPHA HOLD #255 remains mandatory.**
