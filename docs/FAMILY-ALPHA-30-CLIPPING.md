# Assignment 30 — clipping evidence, not release approval

October 26, 2026 · #255 · separate branch on #319 `45de5df6` · **Family Alpha HOLD**.
PR #320 owns the humanoid and placement. No changes here to its assets/branch, production/staging, Auth, database, providers, original photos, recognition, or #29 styling.

## Audit

The existing original-JPEG reviewer uses `prepareSyntheticGarmentOriginal`: corner/edge background agreement, global RGB-distance threshold, connected components, tight native-resolution crop and binary alpha. It conservatively rejects complex backgrounds, but global thresholding can erase pale print/trim and cannot distinguish fabric from similarly colored background. Largest-component rules can lose disconnected details; the explicit two-shoe exception helps pairs only. Binary edges remain hard; neither method understands attached mannequin, person, hanger or garment category. #291's source/region fingerprint and owner/session guards remain essential and unchanged.

## Offline candidates

1. **Border-connected proposal:** robust left/right edge strips follow simple vertical gradients; flood-fill only background-like pixels connected to the image boundary. Retains enclosed pale patterns rather than deleting every similarly colored pixel. Opposite-edge disagreement, clipped components, low-contrast edges and ambiguous enclosed regions return REVIEW. A pale enclosed hole can be mistaken for fabric: a regression fixture records that contamination and enforces REVIEW, not automatic display. This is insufficient for the real cohort alone.
2. **Local U2NETP alpha proposal:** a free local CPU experiment supplies a saliency alpha mask. It does not generate clothing or recolor images. Model input is 320×320; alpha is interpolated to native decoded JPEG dimensions, then applied to the original native RGB. **Original detail resolution is retained; native-resolution semantic boundary accuracy is not implied.** Small details and fine edges can still be lost or soft. No model/library is added to the live app, no hosted AI or paid API used, no automatic model download in application code.

`prepareAlphaProposal` always returns REVIEW and `image:null`; any proposed derivative lives under `proposedCutout` for evidence/review only. Empty/full/tiny/malformed/clipped masks do not yield usable proposals. No mask is approved for an account or marked semantically isolated. Existing source auditor and explicit human review must precede display; owner/region/hash protection is not replaced by a model score. The model cannot isolate shorts from a whole person or remove a connected mannequin reliably.

Model: original [U-2-Net project](https://github.com/xuebinqin/U-2-Net), [project code license](https://github.com/xuebinqin/U-2-Net/blob/master/LICENSE), [U2NETP ONNX conversion release](https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx). Experiment pins SHA-256 `309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8`. Weights are not vendored or deployed. Python CPU inference uses onnxruntime 1.23.2; preprocessing is explicitly specified in infer_masks.py, not a claim of exact parity with every rembg version.

## Real-photo comparison

15 checksum-verified appropriately licensed repository photos; shirts, long sleeves, jacket, coat, dress, skirt, shorts, pants, sneakers, boots. Frozen independently reviewed category/type labels come from the existing reviewed-32/holdout-16 manifests. Scene risks and sparse foreground/background probes were recorded from originals before comparison by this assignment. Those probes **are not independent external annotator approval or full pixel masks**. This is exploratory development on the same cohort, not a new segmentation holdout.

Both methods use identical native JPEG decode frames. No resizing/recoloring during clipping; PNG roundtrip explicitly verifies visible RGB bytes. Display sheets alone are resized. Model alpha inference internally uses 320×320, with the limitation above.

| Measured result | Existing | Proposed local-model route |
| --- | --- | --- |
| Cohort size | 15 | Same 15 |
| Provisional derivatives available | 2 | 7 |
| Visible source RGB mismatches in encoded PNG | 0 where emitted | 0 in all 7 emitted PNGs |
| Final real-photo quality PASS | Not established | **0** |
| Real-photo decisions | No new baseline approval claimed | **12 REVIEW, 3 FAIL** |
| Full-mask IoU / whole-garment completeness | Unknown | Unknown |

Five newly available proposals are not five verified successes. The seven proposals cover shirt 0001, dress 0053, sneaker 0082, boots 0088/0089/0094 and blouse 0016. Six retain all sparse foreground probes; boot 0088 misses one probe and remains FAIL. Zero selected background probes are opaque in the seven proposals, but that sparse result does not rule out attached objects elsewhere. Shirt 0001 and dress 0053 remain FAIL due to hanger/mannequin scene risks even though the sparse probes pass. Eight difficult/clipped scenes yield no proposal. No threshold relaxation or invented sleeves/soles is used to make them appear complete.

Provisional visuals show cleaner isolation for the pale blouse and product boots, while transparent previews expose unresolved fringes, shadows, hanger/mannequin contamination and soft boundaries. **Owner visual approval has not been given.** No 100% clipping accuracy is claimed. Exact visible RGB preservation is a provenance property, not a segmentation score.

- [Comparison 1 — shirts, jacket, coat, dress](evidence/family-alpha-30/comparison-1.jpg)
- [Comparison 2 — skirt, shorts, pants, sneakers, boots](evidence/family-alpha-30/comparison-2.jpg)
- [Comparison 3 — blouse, difficult shoe/dress and product boots](evidence/family-alpha-30/comparison-3.jpg)
- [Raw metrics and decisions](evidence/family-alpha-30/results.json)
- [Per-photo authors, source and license attribution](evidence/family-alpha-30/ATTRIBUTION.md)
- [Model/source/alpha checksums and local CPU inference observations](evidence/family-alpha-30/model-results.json)

## Automated verification

Local full stacked Node suite: **561/561 PASS**, including 11 new clipping tests. Synthetic known-mask fixtures cover top, bottoms, shorts, skirt, dress, outerwear and paired shoes. They check exact retained RGB, source identity, completeness/contamination against known synthetic truth, native dimensions, original immutability, failure handling and the enclosed-hole regression. Those exact synthetic masks are supplied fixtures, not model-generated accuracy evidence.

Chromium/WebKit script is prepared for 320/390px. It really encodes/decodes JPEG and transparent PNG, independently audits the source pixels, rejects an unapproved presentation, and renders a synthetic approved fixture through the existing source-bound adapter. It reads the two geometry assets from immutable PR #320 commit `094896d1...` without changing them. It checks account-epoch invalidation clears an in-flight render. Accounts/mask truth/approval are synthetic. **4/4 Chromium/WebKit 320/390px cases PASS** in [no-deploy Actions 40446103300](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40446103300), verified code `e9068bb0dc029ed7ec7e6e73d99dc71cd282d30c`. Source mismatches zero; supplied synthetic-mask IoU 1; unapproved presentation rejected; account-epoch invalidation cleared the avatar; no external requests/page errors. These are supplied synthetic masks, not model accuracy. [Synthetic screenshots/results artifact](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40446103300/artifacts/12708656128). No physical-phone or live Auth/RLS claim. ONNX model inference is not run inside the browser or loaded into the app.

## Reproduce

```bash
# Existing repo source pins / disabled-build prerequisites: see no-deploy workflow.
node --test tests/family-alpha-30.test.mjs
# Test-only tools, never application dependencies:
# Python: onnxruntime==1.23.2 numpy Pillow; Node: sharp (local run used 0.35.5).
# Download the explicitly linked model to a temporary path; verify its SHA above.
python research/family-alpha-30/infer_masks.py --model /tmp/u2netp.onnx --output /tmp/alpha30-masks
ALPHA30_MASK_DIR=/tmp/alpha30-masks node scripts/benchmark-family-alpha-30.mjs
node scripts/test-family-alpha-30-browser.mjs
```

Local inference versions were onnxruntime 1.23.2, NumPy 2.5.4 and Pillow 12.3.0; exact model/source/alpha hashes are in model-results.json. The benchmark requires matching original, model and alpha checksums before using model output. Without ALPHA30_MASK_DIR it compares the border-connected candidate only; do not relabel that run as model results. Full native transparent PNGs are generated under benchmark/family-alpha-30, while the committed resized sheets carry photo attribution. No downloads or secrets are needed by the clipping module.

## Remaining blockers

No independent full real-photo masks, owner aesthetic approval, actual phone capture, hair/person/mannequin semantic separation, lace/hem reliability, garment-to-body fit or live account/RLS checks. #320's appearance gate is unchanged. Main thread must decide whether to pursue a category-aware segmentation model or guided retakes for worn/cluttered scenes, review actual pixel edges, and integrate only after provenance checks. This candidate is not automatically wired into the protected staging build. No merge/deploy/invitations authorized.

The final results update is documentation-only; the verified code and visual benchmark assets remain unchanged.
