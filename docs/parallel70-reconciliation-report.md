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