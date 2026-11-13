# Closet Current Mission 1 — P875 shared two-model rank evidence and public-development audit

**Family Alpha HOLD #255 OPEN. DRAFT, UNMERGED, UNDEPLOYED, NO ACCOUNT OR SOURCE PHOTO CHANGES.**

## Exact baseline
Mission 1 P874 [draft PR #1071](https://github.com/nickhaney916-lang/Closet-Current/pull/1071), exact verified HEAD `ad60fa300146f0ed469c1367180e75c4fc55b20c`. [No-deploy Actions #43517604573](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43517604573) passed both builds, 584/584 native tests, six desktop owner-review policy profiles and retained original JPEG/account safeguards.

## Actual evidence mismatch and proposed policy
The unchanged `public/model-arbitration-81.mjs` merges **complete 47-label rankings** from FashionCLIP and FashionSigLIP using reciprocal rank support, then exposes its top four alternatives. Those alternatives are not guaranteed to have a meaningful rank in BOTH model families. Even when their category top predictions agree, the top-four fused alternative can belong to an unrelated category. The actual optional `public/dual-panel-82.mjs` rendered all non-`Uncategorized` fused labels as actionable model `Use` suggestions. P873 and P874 vetoed top-score ties and broad category disagreement, but did not require *shared support* among normal suggestions. This gap is visible from code, not proof that a particular real wardrobe item was misclassified.

The new `sharedRankChoices82()` policy retains from the existing four hints **only** labels within the agreed top category that are among each model's first FIVE ranked labels, requiring two distinct model families. No new model prediction is introduced; rejected labels can still be chosen manually from the normal verified category/type editor. If no jointly supported hypothesis remains, the panel explicitly suggests manual Unknown review rather than claiming evidence. All old non-clothing, tied-top, and category disagreement blocks remain; no automatic admission, save, recolor or shoe-unit changes.

**Why top five:** a conservative exploratory common-support window, not a calibrated threshold or validated real-world optimum. This may reduce the number of usable correct suggestions as well as unsupported suggestions. We do not claim improved accuracy, calibration or 10/10.

## Reproducible evidence
1. Actual app source-based desktop Chromium and WebKit owner-review harness at 320/390/430 runs genuine `observation81/arbitrate81` on synthetic complete scores. It proves (a) Dress second in both families is in the OLD fusion but hidden under agreed Bottoms; (b) Shorts first in one family yet outside the other's top five remains in OLD fusion but is not actionable; (c) the shared Skirt possibility stays available where both families rank it; (d) ordinary explicitly approved choice/save, wrong-choice refusal, source/owner/consent/crop/cancel, tie, category conflict, negative/footwear remain unchanged. The score fixtures are synthetic, not photographic accuracy.
2. A separate **genuine pretrained q8 WASM two-model run** is planned on exactly eight existing source-locked Wikimedia public-original development photos: `commons-0035,0045,0062,0088,0001,0094,0078,0059` (shorts, skirt, jacket, generic boots, T-shirt, generic boots, sneakers, generic dress). Original JPEG SHA and Commons license are verified before model loading, and the original SHA is asserted unchanged after inference.
3. `scripts/p875-public-shared-rank-audit.mjs` replays the numeric result transcript through the exact production candidate eligibility function. It reports number of old actionable vs jointly supported new hints and their reduction, with per-source photo SHA receipts. **Do not treat historical expected strings, exposure or same-source comparisons as blind accuracy**. No raw owner photos or private records are used. Summary includes `recognitionAccuracy:null`, independent sources zero, and `releaseReady:false`. This measurement requires the final exact-head CI to succeed; no values are invented in advance.

## Strict containment
Research branch changes exactly 6 files: `public/dual-panel-82.mjs`, `scripts/test-p82-review-browser.mjs`, `scripts/p875-public-shared-rank-audit.mjs`, `scripts/p82-real-browser.mjs` (correct source count in continuous-session receipt), this report, its new NO DEPLOY workflow. `model-arbitration-81.mjs`, original recognition worker and weights, public label catalog, owners/cloud, source photos, P80/footwear, default 2D fallback, production, staging, hosted Supabase and all sibling branches are unchanged.

## Unresolved release gates
No independently human-adjudicated source-disjoint photo labels or 10/10 subtype result. This restricted proposal may lower coverage. Parallel #83 continues real WebKit continuous-session crash; desktop policy WebKit harness is NOT real continuous two-model WebKit acceptance. Zero genuine physical Android/iOS or signed two-owner live cloud tests. **Release HOLD #255 remains active.**


## Measured genuine public photo result — original exact-head CI #43518686206

The first genuine-model validation of this policy completed successfully in the independent no-deploy run [GitHub Actions #43518686206](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43518686206). Its source branch then received only a correction to the research runner's misleading hardcoded `one-browser-continuous-48-one-shot-workers` receipt, so the **final updated HEAD requires a new complete run**. This section distinguishes those receipts, not pooling evidence across commits.

Eight public original source-SHA-verified JPEGs underwent genuine sequential pinned FashionCLIP + FashionSigLIP q8 local Chromium WASM inference, zero external/non-GET requests, zero automatic saves, one desktop browser session with **eight** separate model workers. Original developer-exposed cohort only, **not independent human-blind recognition**.

| Public photo ID | Older actionable hints | Two-model shared-rank hints | Removed |
|---|---:|---:|---:|
| commons-0001 (T-shirt historical string) | 4 | 2 | 2 |
| commons-0035 (Shorts) | 3 | 3 | 0 |
| commons-0045 (Skirt) | 0 | 0 | 0 |
| commons-0088 (generic Boots) | 4 | 4 | 0 |
| commons-0094 (generic Boots) | 4 | 4 | 0 |
| commons-0059 (generic Dress) | 4 | 1 | 3 |
| commons-0062 (Jacket) | 0 | 0 | 0 |
| commons-0078 (Sneakers) | 4 | 4 | 0 |
| **TOTAL** | **23** | **18** | **5** |

Six of eight photos retained at least one model-supported hint under the policy, two had no actionable machine suggestion even before filtering. Two displayed cross-category disagreement and manual review only. The measure is suggestion coverage, **NOT improved correctness**. A meaningful counterexample remains: historically exposed `commons-0078` has `Shoes/Sneakers` source expectation, yet both models' agreement yielded `Ankle boots`; the new shared-rank rule did not remove those four actionable choices. This is why `10/10` and release readiness remain **unproven**. Generic `Boots` and `Dress` strings are not fine-subtype human truth.

The native/owner safety job in that first run passed **584/584 native tests, 0 failed**, both builds, and all six desktop Chromium/WebKit policies, including off-category shortlist suppression, unilateral top-rank suppression, P874 category conflict, P873 exact tied rank, P872 uncommitted choice refusal, original JPEG/IndexedDB and owner footwear tests. Those browser policy inputs were synthetic observations and do not establish WebKit real-model stability.

**Source correction:** `scripts/p82-real-browser.mjs` previously labelled any continuous session as `48` even when `P82_IDS` selected eight. P875 makes that run receipt dynamically read `results.length`. No inference, image bytes, licenses or rank math are changed by this correction.
