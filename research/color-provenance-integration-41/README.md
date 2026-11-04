# COLOR-PROVENANCE-INTEGRATION-41 — integrate real saved-color trust into latest private review research

**Main controller research only. DO NOT MERGE, DEPLOY, OR CHANGE existing production/staging. Family Alpha #255 HOLD.** Parallel #27 owns automatic segmentation, Work #31 owns improving AI category/type/color accuracy, Parallel #32 independent real-photo accuracy benchmarking, Parallel #30 signed browser-cloud E2E.

## Exact integrated research parent and tested donor

- Parent [PR #595](https://github.com/nickhaney916-lang/Closet-Current/pull/595) exact HEAD \`a299f9f956fff7cd2045ae5faf0afa86bdc7b669\`, [dedicated CI #41929005691](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41929005691) SUCCESS, 547/547 Node, 18 genuine browser reviewer/IDB regression cases and 12 new SHA-verified PNGs. Its auth lock, original-photo source epochs and atomic save finality are preserved.
- Selective proven donor [PR #579](https://github.com/nickhaney916-lang/Closet-Current/pull/579) exact \`e104f2001f6ab993bd88481bd2257c83663ae93e\`, **not merged**: tested explicit user-color authority in \`ClothingDetails.fill\` and \`fillColor\`, 9 actual application submit-closure regressions, 10 user-color-authority tests. Earlier donor [PR #577](https://github.com/nickhaney916-lang/Closet-Current/pull/577) user authority, [#576](https://github.com/nickhaney916-lang/Closet-Current/pull/576) uncertain review. Do not overwrite newer PR595 app, auth or garment review.

## Source-grounded defects

Current PR595 \`public/app.js\` had **two unconditional promotions of \`photo-estimate\` to \`user\` upon Save**: (1) new-photo review submit, and (2) saved My Closet editor submit, even when only notes or subtype changed. This records a wrong AI guess as manually corrected and may incorrectly protect it from future better recognition. Its \`public/clothing-details.js\` also allowed explicit overwrite=true crop classifications to replace actual user-selected colors, and \`fillColor\` accepted \`needsConfirmation:true\` full-scene guesses as stored color without explicit review.

## Narrow implementation

1. Remove precisely two unconditional \`colorSource\` promotions in \`public/app.js\`. Native actual color input listener is still the only user-authority signal for the original photo and saved closet edit forms. Existing authenticated queued save, source SHA and correct owner/CAS unchanged.
2. Selectively transplant well-tested \`public/clothing-details.js\` from PR579. \`fill\` protects genuine user-entered colors even with overwrite=true. \`fillColor\` declines untrusted \`needsConfirmation\` and invalid confidence, preserves explicit user cleared blank. Existing known normal recognition, category, pattern and other attribute behavior remains intact.
3. Actual native multi-garment reviewed crop saving still *explicitly* human-confirms category/subtype/color and records \`colorSource:'user'\`, legitimately, not by merely pressing unrelated Save.

No model weights, actual \`public/photo-color.js\` thresholds, segmentation, backend, DB schema, source JPEGs or 3D are modified. Existing color-model science remains unsatisfactory, and a successful safety test cannot be called 95% color accuracy.

## Real execution

Run inherited complete app build and all Node tests plus the 19 selective real-handler/donor checks. Re-run predecessor #34 source epoch, #34 save receipt, #38 live-worker finality and signed owner auth unit regressions. Execute six additional Chromium/WebKit × 320/390/430 genuine mobile-width *browser* cases. Each loads exact current \`public/app.js\` \`clothingFields\` function extracted at runtime, actual \`public/photo-check.js\`, \`public/photo-color.js\`, \`public/clothing-details.js\`, \`public/taxonomy.js\`, a locally generated **synthetic garment JPEG**, and writes/reopens an owner-keyed real IndexedDB. Verify note-only input keeps \`photo-estimate\`, genuine Color input changes to \`user\`, deliberate clear remains empty even through AI overwrite, uncertain/invalid support not stored, SHA/original photo and owner unchanged. Produce **18 actual mobile-browser PNGs** and independent byte SHA, dimensions, and nonblank variance checks. No unexpected network or real user photos.

**Limits:** Browser test photo is synthetic, not an independent photo-color ground truth or automatic fashion classifier. Form is extracted and executed from real source on a research-only page; it is NOT a deployed signed browser-to-cloud or full customer E2E. Isolated Node tests execute actual submit closures with controlled store mocks. No physical phone or general color accuracy certification.

**Acceptance** requires strict changed-path allowlist, exact-parent ancestor, all inherited Node tests, build, six actual browser cases, independent screenshot audit and final exact HEAD GitHub Actions SUCCESS. Family Alpha HOLD even after engineering PASS.
