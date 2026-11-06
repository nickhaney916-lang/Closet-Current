# Closet Current — Priority #96 real multi-garment photo candidate intake (RESEARCH ONLY)

**Parent:** verified Priority #95 [draft PR #650](https://github.com/nickhaney916-lang/Closet-Current/pull/650), SHA `e1473010be68cf01d7607996a4a9a1879bb6899b`, [dedicated CI #42157851003](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42157851003) success: 881 Node, actual P94 6 Chromium/WebKit original-photo annotation workflows, 20 screenshot audits, 59 original photo SHA checks.

## Engineering purpose
The frozen 59-licensed-JPEG scientific benchmark lacks genuine independently annotated overlapping garment and full-outfit examples. A valid study must not silently relabel or retune the existing 16-item locked evaluation; it needs ≥100 distinct photo sources, at least 30 independently reviewed locked garment examples and 10 locked negatives, category coverage and A/B/C source-bound human masks.

Priority #96 **does not claim to create 41 photos or actual human annotations.** It reuses two genuinely different previously model-inferred and externally licensed public Wikimedia original photographs from a pre-existing research pilot, neither of which is among the frozen 59 JPEG source hashes:

1. `two-shirts`: 3264×2448, 3,379,522 bytes, SHA `4608661009cc84c365cbbc8349ca119b214553daa6f76ecd9edab345f5859cc4`, Atomic Taco, CC BY-SA 2.0, [Commons attribution](https://commons.wikimedia.org/wiki/File:Shirts_-_Photo_A_Day_7_1_2009_%283681113424%29.jpg).
2. `flatlay-outfit`: 4773×3182, 2,501,268 bytes, SHA `adb60164c269198e15276bc3a9d5e4fb970676fe00a46d38fd7ea755b27cf360`, NordWood Themes, CC0 1.0, [Commons attribution](https://commons.wikimedia.org/wiki/File:Clothing_flatlay_%28Unsplash%29.jpg).

Existing research [MASK-31](https://github.com/nickhaney916-lang/Closet-Current/blob/e1473010be68cf01d7607996a4a9a1879bb6899b/research/real-mask-evidence-31/README.md) has already subjected these samples to actual SegFormer; they **cannot be promoted into a never-before-seen locked evaluation partition** without independent isolation. Historical crop annotations are single-reviewer, not scientific instance masks.

## Implementation / proof
- Research-only candidate manifest pins exact source URL, unchanged prior-pilot SHA, byte count and image dimensions, author, attribution title/page and recognized published license URL, and marks each **model-seen / no independent human masks**.
- Runtime original JPEGs downloaded directly from a strict HTTPS `upload.wikimedia.org` allowlisted path, no redirected or arbitrary external host; SHA-256/bytes/dimensions/decodability independently verified, source bytes do not enter git or CI artifact.
- All **59 frozen original JPEGs** independently reread/rehash for original identity. 64-bit perceptual fingerprints compare both new incoming candidate images with the frozen 59 plus each other, flagging possible near duplicates for manual review; this heuristic can have false positives/negatives and is not identity or model correctness.
- Candidate records quarantined with source SHA and license attribution; known historical SegFormer exposure and possible near-duplicate warnings remain attached. No addition to `benchmark/locked-photo-sources.json`, `manifest-holdout-16.json`, any classifier weights, training, existing production or staging.
- All source-photo labels, independently human adjudicated instance masks and color correctness remain **unmeasured**. The difference between 59 + 2 research candidates vs 100 scientifically usable photos is explicit; **41 genuinely new independently eligible samples still need to be sourced and reviewed**.
- Independent Node adversarial gates prevent duplicate, SHA mismatch, file tamper, license swaps, false image dimensions, unsafe external URL, false human truth, and silent release claims.
- Strict exact-parent source-only CI with full inherited Node tests, real Wikimedia source download and SHA audit, inherited P94 original-photo Chromium/WebKit browser polygon QA and screenshot audit. No signed accounts or physical smartphone testing.

**Engineering verdict:** Pending exact-head dedicated no-deploy CI. **Scientific accuracy:** NEEDS REWORK; A/B/C human instance reviews 0, unseen locked model-instance evaluations 0. SegFormer converted model license UNSPECIFIED and release BLOCKED. Family Alpha Issue #255 HOLD; no merges, production or staging deployment. Parallel #90 independently owns fabric realism.
