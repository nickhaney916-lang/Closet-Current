# Closet Current — verified mask-origin clothing color integrity

**October 20, 2026 Pacific.** Isolated customer-safety fix, stacked on draft PR #109 exact verified SHA `a6ee34a676030cff2a4fcf3b31185275c78371a7`. Recognition benchmark and parallel Work branch-integration assignments belong to separate branches.

## Reproduced customer issue

The existing `public/app.js` promoted masked color to `colorMethod='garment-mask'` in two unrelated cases **even when the color estimator did not provide proof**:

1. **Manual crop/erase/restore:** `public/photo-crop-editor.js` accepted a **single** painted-alpha masked color histogram. The crop callback then explicitly declared it `garment-mask`, even if it was mostly a wall, a hand, or shadow. This would prevent later model-verified colors from correcting the saved color.
2. **Outfit photo:** the candidate ingest path marked **any** proposed `options.colorEstimate` as a verified garment mask, even if the proposed estimate had no original RGB source evidence or color confidence. The actual outfit worker normally supplies strong evidence from two spatial views; the consumer nevertheless lacked its own trust gate.

### Fix

- Manual crop editors now require **at least 5% truly excluded mask pixels**, a confident **full-alpha foreground estimate**, and a **conservatively eroded interior estimate** that agrees on primary color and passes the existing `PhotoColor.confirmedGarmentPalette` confirmation. The original source JPEG remains unchanged and continues to be the recognition input. A uniformly opaque image or tiny/uncertain mask is not treated as a garment-color proof.
- `photo.maskedColorEstimate` carries its vetted `method:'garment-mask'` **from the editor evidence decision**, rather than being forcibly upgraded after saving. A missing or unverified estimate lets the recognition model/user review determine the actual garment color; it is not falsely locked as original pixel ground truth.
- Outfit captures preserve verified worker colors **only if** the proposal contains `source:'photo-estimate'`, numeric two-view support in `[0.6,1]`, no explicit confirmation warning, and **both original full-scene JPEG and original unmasked recognition crop**. Unsupported or incomplete estimates never become trusted colors.
- Existing customer corrections, category-color quick review, segmentation safety, duplicate protection, and original-first high-resolution garment recognition remain unchanged. No image is deleted merely because it cannot be automatically color indexed.

These evidence checks reduce misleading trusted colors; they are **not physical garment-mask ground truth** and do not prove 100% photo accuracy. Manual erase actions can still include non-garment objects; uncertain cases need human review.

## Automated verification

- `tests/masked-crop-color-evidence.test.cjs`: real RGBA color estimate, interior confirmation, missing or fully opaque foreground, unsupported provenance, tiny masks, preservation of pixel bytes, and source color trust boundaries.
- `tests/automatic-indexing.test.cjs`: actual candidate flow with two-region support and valid source JPEGs, missing original, unconfirmed/unsupported/suspicious estimate rejection, and preservation of existing category/index behavior; old fixtures updated to the **actual worker-supplied source contract**, not weakened production guards.
- `scripts/test-masked-crop-color-browsers.mjs`: real Android Chromium and iPhone WebKit **emulated** mobile 390×844 browser contexts checking verified mask color, opaque background rejection, uncertain foreground rejection. These are **not physical phones**.
- Strict source-integration audit `scripts/verify-camera-cloud-integration.mjs` and independent historical `scripts/check-dual-parent-review-integration.mjs` reconstruct byte-exact application changes against previous verified PR #109. The helper and review script must also match exactly their approved parent. No unrelated camera/model/AI/Supabase or Drive Duel files may change.
- Full Node application regression, build, customer pilot release veto and both browser engine checks must pass on the exact **final PR SHA** before completion can be reported.

## Explicit boundaries

This draft does not retrain, replace or call paid AI, bypass original RGB before masking, merge branches, deploy to Cloudflare/GitHub Pages, alter hosted Supabase SMTP or owner permissions, access private user wardrobes, or modify Drive Duel. Real physical Android/iPhone confirmation and new unseen independently labeled actual clothing photos remain necessary for pilot launch.
