# INDEX-03 — Original-photo recognition and categorization accuracy (DRAFT HOLD)

Isolated from main 39deed987afe2e5668d64e145835ad43ad14c7be. This branch does NOT modify production code, authentication policies, INDEX-01 PR #536, INDEX-02 PR #537 or other app projects. No merge or deploy.

## Audited source and identified risks
Existing public/recognition-engine.mjs performs category, branch, complete-vocabulary and secondary views. Several recovery paths accept a type from narrow prompt sets and independent views do not guarantee correct subtype. The existing public/photo-color.js center-of-frame estimate can include background; alpha-mask color estimation is better bounded but color truth is not labeled. The original worker accepts the captured original JPEG and derives 2048px/preprocessed views; this is not full-native-resolution neural inference. Current saved user adjustments are protected by original app tests.

Four confirmed unsafe, automatic subtype errors in the documented October 26 real-photo run: commons-0064 Jacket classified Blazer; commons-0003 T-shirt classified Sweatshirt; commons-0014 Blouse classified Tunic; commons-0078 Sneakers classified Ankle boots.

## Research implementation
- research/index-03/recognition-index-gate.mjs is a pure, opt-in, post-model safety gate, not yet wired into public/app.js. It rejects cross-account record access and original photo identity without verified SHA-256/provenance. verifyOriginalSourceBytes hashes original supplied bytes rather than altering their encoding.
- Known confusable types require independently executed full-vocabulary agreement before automatic acceptance. Shape-sensitive recovery also requires confirmation. If unverified, the photo remains reviewable, not auto-indexed. This trades automatic coverage for precision.
- Exact main catalog category/type mapping, owner/record checks and 2D/3D slot positions match INDEX-01. Corrections to category, subtype and color always win. AI color is a proposal, not a saved overwrite.
- Masked color analysis ignores background by requiring a verified source-matched garment mask and adequate coverage. It can propose Navy, Cream, Gray, Beige, Multicolor etc., but always requests human confirmation. This is NOT measured color accuracy.
- A multi-garment photo needs individually verified cutout identity and an independent per-piece result; no original or cutout pixels are modified.

## Real original-source evidence
59 genuinely licensed Wikimedia Commons JPEG fixtures, preserved with attribution and verified source SHA-256, already exist in benchmark/fixtures, together with the 2026-10-26 genuine FashionCLIP per-photo results. scripts/evaluate-index-03-locked-replay.mjs checks all 59 source-file SHA-256 values and applies the new safety gate to the original recorded model predictions. The saved benchmark/index-03/replay.json includes before/after category and type performance, separate auto/review counts, unsafe confident predictions and two confusion matrices.

This is a *verified historical real-inference replay*, not fresh neural inference at the new commit. It cannot establish higher neural recognition accuracy or current live capture accuracy. Colors lack human ground-truth labels; physical-phone camera originals, mask segmentation accuracy, processing time and actual mobile screenshots are not evidenced by this replay. Honest false-positive and review counts must be considered together.

## Tests and integration
Run node --test tests/*.test.cjs tests/*.test.mjs, node scripts/build.mjs, and node scripts/evaluate-index-03-locked-replay.mjs. Dedicated pull-request INDEX-03 workflow performs these checks, permits changes only to this isolated research module/tests/analysis/workflow, and never deploys. Failure leaves PR as draft HOLD.

For eventual integration: inspect PR #536 and #537 exact final heads separately. Pass the *actual* signed-in account owner, saved original-photo SHA checked against original bytes, genuine worker classification, and verified segment identity into the gate. Feed only autoIndex=true to existing owner-bound save path; autoIndex=false must surface original photo and category/type/color suggestions in Review. INDEX-01 should index those saved IDs, human corrections and review flags; INDEX-02 should refresh authenticated closet filters after each real save and owner change. Never fabricate independent.executed or color/mask proof and do not merge draft PRs automatically.

Still required to lift Family Alpha #255 HOLD: fresh 15+ independently annotated original phone photos (with color and segmentation truth), genuine new model inference, latency, live 320/390/430 browser screenshots of integrated changes, and physical Android and iPhone acceptance. Production is unchanged.


## Actual mobile browser screenshot QA (not a physical phone)
`scripts/test-index-03-mobile-review.mjs` loads the actual original My Closet HTML and JavaScript in an isolated Playwright Chromium mobile context at **320, 390, and 430px**. Two byte-verified, Wikimedia-licensed photographed garments are saved through the app's real per-account IndexedDB write API. The actual saved **Adjust details** dialog corrects Dress → Bottoms/Skirt and Navy → Cream while preserving original JPEG data URLs and SHA fields, leaving an unrelated saved sneaker unchanged, then reloads from IndexedDB. Produces six real browser screenshots and an assertions JSON in `benchmark/index-03/mobile/`. No external network calls or production account data are used. This **does not run live neural recognition** and is **not approval on physical Android or iPhone hardware**. It tests manual saved-item corrections, not INDEX-02 filters (that draft integration remains isolated).

### Measured baseline versus gated automatic decisions
Using the locked original-photo historical FashionCLIP outcomes: 56 clothing photos + 3 negative images. **Before**: 47 auto, 9 review, 43/47 automatically correct accepted subtypes, 4 confidently wrong subtypes. **After INDEX-03 review rules**: 32 auto, 24 review, 32/32 automatically correct accepted subtypes, 0 confidently wrong *on these particular images*. Automatically accepted coverage decreases 47/56 to 32/56; underlying neural category recognition is unchanged at 51/56 correct categories across all garment predictions. Three negative images remain rejected. This is a sample-bound, retrospective post-model policy comparison, not an accuracy claim for unobserved user garments. No verified color labels or real source processing latency are available. The existing app color suggestion vocabulary does not yet formally include Navy/Cream as model outputs; those research mask-only labels require explicit review before integration.
