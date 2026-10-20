# Consolidated Closet Current customer development — October 20, 2026

**Branch:** `integration/customer-original-photo-style-qa-20261020`  
**Base:** verified draft PR #79, commit `305cca508040bfbe865eec66061dd1ba55614a9b`, which already contains and preserves the customer-facing PR #78 → #77 → Work PR #74 → Work PR #69 lineage. No cherry-pick, forced merge, or production deployment.

## Customer code paths already integrated

- Photograph/import individual or outfit clothing. The original unmasked RGB crop remains the input for garment classification; display clipping cannot silently replace a missing original.
- A provisional recognition worker message does not update pending clothes or defeat final original-photo verification. Stale decode/classifier failures do not damage newer photos or manual edits. Current IndexedDB save errors remain visible and retryable.
- Conservative foreground color evidence wins over a conflicting model label; an unverified White backdrop requires human color selection.
- Skirt recovery requires balanced Dress-inclusive evidence from two image views; Shorts and other strong bottoms retain their prior path.
- `Style My New Clothes` anchors newly saved clothing to recommendations drawn from the correct customer-owned closet, including dresses as one-piece looks, three varied options, single-piece swaps, local figure previews, durable outfit save/reload and account isolation.

## Cross-feature integration assertion

`tests/customer-original-styling-integration.test.cjs` composes production recognition-photo selection with approved foreground color precedence, actual owned-garment styling, the existing image-only preview planning contract and account-scoped local cache.

It proves in synthetic fixtures that a display-only image does not become recognition input, a genuine dress cannot acquire a separate skirt/bottom layer, no imagined or cross-owner garments appear in an outfit board, and a prior owner/photo cache entry cannot be reused. It does not run a camera or a generative vendor.

`scripts/check-customer-pilot-release-gates.mjs` ensures that green technical checks do not silently become permission to use paid inference or claim independently authenticated real-photo masks, commercial figure master rights, physical-phone performance, or production launch acceptance.

`.github/workflows/integrated-customer-release-rehearsal.yml` executes production app build, full Node suite, focused cross-contract checks, Chromium and WebKit styling and model-preview journeys, original-crop/duplicate provenance, JPEG original-photo color evidence and release-approval safeguards. Browser screenshots/JSON are retained as **synthetic evidence** only.

## Separate human-review branch compatibility review

GitHub compare of customer PR #79 and mask-review PR #76 against their shared ancestor `8d009ec056f8b7178185efb422beb94cd085a07c` identifies **13 overlapping changed files**:

`public/index.html`, `public/source-guided-mask-refinement.js`, `scripts/test-reusable-figure-phone-browsers.mjs`, `tests/source-guided-mask-refinement.test.cjs`, `scripts/assert-source-guided-boundaries.cjs`, `scripts/benchmark-source-guided-boundaries.py`, `scripts/measure-source-guided-boundaries.cjs`, `.github/workflows/reusable-figure-local-preview-qa.yml`, `.github/workflows/source-guided-boundaries.yml`, `benchmark/source-guided-boundary-results-20261019.json`, `benchmark/source-guided-clearing-experiment-20261019.json`, `docs/SOURCE-GUIDED-MASK-BOUNDARIES-20261019.md`, `docs/PROGRESS-CHECKPOINT.md`.

**These are overlapping edits, not a formal merge-conflict determination.** Native first/second-human editor pages, human-review scripts, reference registry and approval mechanisms are exclusive to the review branch and are **not** pulled into the customer release branch. Before integrating those results, separately merge into a test branch and reconcile shared `public/index.html`, fitting/browser harness and source-guided mask code without weakening human evidence gates or silently manufacturing approvals.

`main` is one commit beyond the customer lineage's Git merge base; that exclusive commit updated `public/trend-data.json`. The customer integration branch and `main` currently have the **same blob SHA `0fd0911a32ff7c80fc027657465c96f34dfe532d`** for this file, so there is no observed stale trend-file-content delta from that particular commit. Production main remains unchanged.

## Hold / exit criteria

| Scope | Meaning of passing |
|---|---|
| Node/Chromium/WebKit CI | Customer development integration is reproducibly **technically verified** at an exact branch SHA |
| Actual account/deployment, camera and cloud restore on real phones | **Not yet validated**, mandatory for family/friends pilot |
| 12 original-photo boundary/mask reference set | **0 genuinely independent two-reviewer accepted masks**, no clipping accuracy claim |
| Original high-res male/female figure rights / master assets | Approval evidence **not complete**, not fit for a production-released photorealistic asset claim |
| Paid AI, user photo uploads, production merge | **Not enabled/not done** without explicit approval |

No changed Drive Duel files, no paid provider activation, no changes to the parallel human-review branches. The release strategy is draft branch → verified CI → controlled physical-phone pilot → resolve branch overlaps/human + figure evidence → explicit production release decision.
