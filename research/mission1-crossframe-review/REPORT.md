# Closet Current — Mission 1: independent source framing for subtype safety

**Research only. FAMILY ALPHA HOLD #255. Draft PR, no merge or deployment.**

## Motivation

Actual live model inference on 59 licensed public photos, PR #764, verified 4 unsafe subtype auto-index events in 47 accepted garments, including known confusion pairs (T-shirt/Sweatshirt, Blouse/Tunic, Jacket/Blazer, Sneakers/Ankle boots). Category accuracy (91.07% measured against the existing curated labels) is substantially higher than accepted subtype accuracy (76.79%). The 16-image holdout is now exposed; this is *diagnostic development data*, **not new unseen independent validation**.

## Source-agnostic bounded policy — opt-in research integration

- Before posting an `identified` result, the actual local recognition worker now **buffers** its provisional identification.
- Only four historically confusable **type families**, not individual photo IDs or labels, get a new confirmation pass:
  - T-shirt ↔ Sweatshirt
  - Blouse ↔ Tunic
  - Jacket ↔ Blazer
  - Sneakers ↔ Ankle boots
- The recheck runs on **two independently prepared views of the genuine ORIGINAL JPEG** through the existing local FashionCLIP/WASM model and source-locked vector index, with two non-garment negative prompts. Both must retain the same subtype and a score/margin; scores are **not calibrated probabilities**.
- If either fails or the model cannot load, emit only the confidently known broad category with `Unknown` subtype for owner review; do not emit a provisional automatic `identified` event or silently save a wrong subtype. Original JPEG, saved closet, multi-garment mask/source, separate-auth ownership, and 2D fallback remain untouched.
- Categories or subtypes not in the four high-risk groups retain prior behavior and do not incur extra model inference. This is a precision-vs-review tradeoff, not an attempt to improve raw category accuracy or prove human truth.
- New seven unit tests for source agreement, negative prompt, first/second-frame conflict, runtime failure, and valid non-risk no-change. Four additional tests ensure the real-photo before/after evaluator rejects forged automatic indexing, result rewriting, negative false positives and invalid review replacements.

## Acceptance and caveats

The dedicated **no-deploy CI** must run the exact verified P764 SHA-parent research diff guard, current Node/build tests, and genuine Chromium before/after worker evaluation on all 59 identical SHA-locked licensed source photographs (32 curated, 16 held-out, 11 fresh). The initial baseline uses the exact prior `public/local-worker.mjs` without the new guard, then the full research worker. Both runs use the identical real photograph bytes and recognition model. All 59 results, runtime errors, scores and category review changes are retained, along with a per-source tradeoff report. A wrong automatically indexed garment must not be replaced with a different automatic subtype; a decline must become category-only human review. The CI explicitly fails if unsafe automatic entries increase.

**Even if research CI passes and the existing 59 incorrect autosaves are blocked, this DOES NOT certify independent recognition accuracy.** The results are from previously exposed historically curated photo labels and the additional views use the same model weights. A new untouched independent human-annotated multi-category image benchmark is essential to measure generalization, real color accuracy, instance segmentation IoU, boundary F1, and release quality. The parallel Mission 1 and #66 ground-truth work is ongoing and must be integrated only after review.

**Never merge, deploy, alter production or staging, hosted Supabase, family photography or Family Alpha HOLD #255.**
