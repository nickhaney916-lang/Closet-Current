# Family Alpha #16 — retained original → transparent garment fidelity evidence

**October 23, 2026 · Independent synthetic research / NO MERGE / NO DEPLOY / FAMILY ALPHA HOLD**

## Versioned evidence and independence

- QA branch: `qa/family-alpha-16-original-mask-fidelity-20261023`, based on PR #263 account snapshot head `335f818c46fc3897815f0aa58b6e94c064b4f09d` (stacked on PRs #262 → #260 → #258 → #256). The source adapter was NOT edited.
- Exactly **pinned, read-only PR #257** garment preparer (`df8d2589dd9b1767b727270fed9ce00f7a80afae`), verified source blob `12ad1234b44d1257a1f1e697e61468f91595148c`. No duplicate background removal/matting algorithm was authored.
- Current main `54c9e29ede069a05d1268e003f80cbda043c7d6a`: reviewed `photo-crop-editor.js`, `photo-check.js`, `garment-mask-engine.js`, `outfit-capture.js`, `outfit-worker.mjs`. App stores `item.originalPhoto.image` separately from `item.image`; full-outfit `outfitSourceId` may be shared across distinct extracted saved IDs.
- PR #260 hashes retained JPEG and checks submitted item/source/owner metadata, **not an independently decoded mask-to-original pixel association**. PR #263 adds account-epoch/private-IndexedDB snapshot guards with mocked Auth; it does not attest masks. PR #261 handles outfit swaps, not segmentation correctness.

## New QA interface

`research/family-alpha-16/source-mask-audit.mjs`:
```js
fingerprintSavedCrop(item, cryptoProvider);
auditMask({
  item, prepared, ownerId, getScope, getItem,
  decodeOriginal, cryptoProvider, groundTruth, isCurrent
});
```

This auditor **reads** (and never modifies) the owner-scoped item; validates actual retained-original JPEG SHA-256 and separate current saved-crop JPEG SHA-256, `saved:<item.id>:<outfitSourceId>` identity, active owner and session epoch, and output-image item ID/owner/source claims. It independently decodes the retained JPEG through a caller-provided **trusted decoder**, checks every visible output RGB pixel against the corresponding source coordinate using the derivative bounds, and counts source mismatches, RMSE, missing-fabric recall, background precision/IoU and semi-transparent outside-garment halos where independently labeled synthetic ground truth exists. The saved original/crop are rechecked **after** asynchronous decoding; cross-account/late superseded results fail closed.

**Important:** Without ground truth it returns `review` even if every source RGB pixel matches; truthful RGB does not establish complete isolation. The auditor deliberately returns `canDisplay:false` for **all** of its outcomes: it does not authorize rendering, generate images or supersede real Auth/RLS and human checking. Self-reported `approved:true`, fingerprints or item IDs never by themselves confer trust. The decoder must actually derive its frame from the checked JPEG. A trusted image-generation process needs to bind mask generation to **specific saved item, original SHA, crop version, outfit instance, owner/session epoch and source decoder**, with revocation when any changes; independently verified server authorization is separate.

## Actual synthetic benchmark (measured, not extrapolated)

**Node pinned-PR257 extraction:** 22 synthetic scenarios across eleven type-specific silhouettes, strong striped material/seam/logo details, and deliberate hard conditions. **12/12 expected clean/wrinkled cases pass; 10/10 difficult cases reviewed; 0 unsafe automatic acceptances in this finite test set**. In the 12 clean/wrinkled cases, synthetic RGBA source is supplied through a mock JPEG envelope, rather than physically decoded JPEG: exact retained-foreground RGB match, RGB RMSE **0**, and ground-truth mask IoU/precision/recall **1.0**. This is not a model accuracy estimate.

| Garment / photo condition | Synthetic QA result | Remarks |
| --- | --- | --- |
| Short-sleeve shirt | PASS | Colored stripes/logo, source pixels retained |
| Long-sleeve shirt | PASS | Longer arms, source pattern retained |
| Pants | PASS | Separate legs under shared waistband |
| Jeans | PASS | Colored denim-style pattern |
| Shorts | PASS | Shorter hem |
| Skirt | PASS | Tapered geometry |
| Dress | PASS | Distinct full-length silhouette |
| Jacket | PASS | Outer arms/torso |
| Sweater | PASS | Different texture/color |
| Sneakers photographed together | PASS | Intended two-piece exception |
| Loafers photographed together | PASS | Intended two-piece exception |
| Wrinkled patterned skirt | PASS | Added synthetic shading pattern |
| White-on-white shirt | NEEDS REVIEW | Indistinguishable from simple background |
| Dark-on-dark sweater | NEEDS REVIEW | Insufficient foreground/background contrast |
| Busy bedroom-like background | NEEDS REVIEW | Corner/edge estimate inconsistent |
| Multiple clothing areas in dress scene | NEEDS REVIEW | Synthetic missing-fabric recall ~0.866; IoU ~0.976 |
| Clipped jacket reaching photo edge | NEEDS REVIEW | Ambiguous boundary |
| Blank clothing image | NEEDS REVIEW | No identifiable foreground |
| Semi-transparent shoes | NEEDS REVIEW | Material does not support reliable thresholded isolation |
| Severe synthetic defocus | NEEDS REVIEW | Not real-motion-blur characterization |
| Reflective jacket with background-colored highlight | NEEDS REVIEW | Fabric holes are not reconstructed |
| Under-32px garment | NEEDS REVIEW | PR257 rejects invalid frame before extraction |

**Browser decoding chain:** Chromium and WebKit at 320/390/430 mobile-sized viewports, **6/6**. Four garment source types per viewport are constructed as synthetic canvas JPEGs, decoded using the browser's real JPEG decoder, passed into the **actual pinned PR257** isolation, pixel-compared to independently decoded source, written to transparent PNG, decoded and rendered through **PR #258's actual 2D photo-layer renderer**.

| Synthetic source after real JPEG decode | Pixel-source RGB RMSE | Ground-truth mask IoU (observed) |
| --- | ---: | ---: |
| Short-sleeve shirt | 0 | 1.0000 |
| Jeans | 0 | 0.9970 |
| Dress | 0 | 0.9997 |
| Two sneakers | 0 | 1.0000 |

The above numbers repeat across six browser viewports for these deterministic synthetic images. Zero observed source RGB substitutions, outside network requests and page errors. Proportions were checked using real decoded PNG natural sizes vs rendered DOM rectangles (no `objectFit:fill`). This proves *the tested synthetic copy/geometry path*, not original-camera byte fidelity, real garment segmentation quality, a 3D fit or physical-phone operation.

## Failure and provenance matrix

| Condition | Synthetic assertion | Required production behavior |
| --- | --- | --- |
| Retained JPEG replaced, crop unchanged | REJECT | Invalidate old mask and ask for new review |
| Saved crop changed, original unchanged | REJECT | Invalidate old derivative; bind to new crop hash |
| Two garments from same outfit frame | Distinct IDs enforced | Independent source-to-instance evidence needed; shared parent alone insufficient |
| Other owner / account epoch changed mid-prepare | REJECT | Clear old content immediately; reauthorize |
| Pending older operation returns late | REJECT | Do not override newer prepared selection |
| Mask claims valid metadata but RGB differs | REJECT | Never substitute generic/reconstructed fabric |
| Over-erased garment (missing fabric) | NEEDS REVIEW | Keep original and offer correction/retry |
| Opaque background leakage | NEEDS REVIEW | Never display a whole bedroom/person as a garment |
| Semi-transparent background halo | NEEDS REVIEW | Require documented alpha-matting review |
| Missing or corrupt JPEG / mask bounds | REJECT | Preserve saved record; re-fetch or recapture |
| All original pixels match, no ground truth | NEEDS REVIEW | Pixel matching does not prove foreground correctness |

**Known risks not closed:** Real automatic segmentation can fail on overlapping or wrinkled real garments, patterned bedrooms, transparent/refractive objects, dark shadows, silhouettes resembling dresses/tops, reflective textiles, sole/hem clipping, blurred/faded phone captures or unknown clothing. Labels and colors are still upstream recognition decisions. Hard binary alpha from PR #257 can produce jagged edges; real-world matting and halo control remain unverified. Auth, RLS and actual protected storage checks are not proven by client-side SHA metadata. No proof of trusted JPEG→decoded pixels→mask instance linkage is available outside these synthetic fixtures.

## Suggested Family Alpha acceptance gates (proposed, not achieved)

1. **Source:** 100% item-level authorized original SHA-256 + saved-crop SHA-256 + garment-instance identity bindings, verified again immediately before display; reject stale/out-of-owner/foreign presentations; no arbitrary self-`approved` bypass.
2. **Source pixels:** zero visible RGB substitutions beyond the explicitly measured decoder/color-space tolerance when matched to the *same trusted decoded original*; nonzero mismatches or doubtful decoder provenance → reject. Maintain the original untouched.
3. **Mask QA:** on an independently labeled, consented holdout, minimum proposed foreground recall/precision/IoU **0.98 each on automatically accepted garment images**, report numerator, denominator and auto-acceptance coverage; don't achieve accuracy by rejecting everything. Mark semitransparent/halo cases for review rather than silently masking.
4. **Quality floor:** reject corrupt/missing/very small JPEGs, near-blank and unsegmented scenes; ambiguous background/blur/reflections require review and a retry/adjust path. A real focus and alpha-edge quality model is **not implemented here**.
5. **Recovery:** never show a generic silhouette/solid-color proxy as user clothing, never erase item storage on mask failure, immediately clear stale 2D layers on sign-out and retry only after re-verification.
6. **Before release:** 4 independently authenticated family accounts, phone-captured 15–20 garments/account, consented independently labeled holdout spanning all categories and difficult cases, real segmentation masks, dress/shoes/outerwear, original restoration and across-session swap, physical Android and iPhone evidence. Confirm active Supabase RLS and private photo bucket policies separately.

### How to reproduce

```bash
# A READ-ONLY copy of PR #257 exact commit must exist at ./reference-pr257
node scripts/build.mjs
node --test tests/*.test.cjs tests/*.test.mjs
node --test research/family-alpha-16/tests/*.test.mjs
node research/family-alpha-16/run-matrix.mjs
# With Playwright 1.56.1 browser binaries installed:
node scripts/test-family-alpha-16-mobile.mjs
```

CI writes synthetic-only `benchmark/family-alpha-16/{node-matrix,browser-matrix}.json`. No customer images, account identifiers, external requests from browser tests, Auth tokens, paid AI or production storage are used. **Family Alpha integration and release remain HOLD until main conversation review.**
