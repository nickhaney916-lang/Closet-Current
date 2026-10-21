# Original RGB, multi-framing garment subtype agreement — October 21, 2026
**Experimental research branch. No customer classifier, model or app was changed.**

## Motivation and source evidence

PR #106 independently reran the current, pinned local FashionCLIP browser recognizer against 59 different SHA-256 verified source photographs. It confirmed 4 wrong *automatic subtype* classifications despite no wrong emitted broad categories in that small cohort:

- `commons-0064`: reviewed garment labeled Jacket, model accepted Blazer
- `commons-0003`: T-shirt versus Sweatshirt
- `commons-0014`: Blouse versus Tunic
- `commons-0078`: Sneakers versus Ankle boots

It also found important abstentions on skirts, dresses and boots. Do **not** switch recognition thresholds or claim 100% accuracy based on these observed images. The outcome for a correctly identified skirt can differ from a short dress in real outfits, and FashionCLIP's two photographic framings are correlated, not independent trained models.

## Scope of this next priority

This PR implements only `scripts/trial-original-subtype-consensus.mjs`: a read-only research comparison of proposed **review instead of automatic subtype save** decisions. It never writes customer clothes or production source files.

1. Download the same 59 source photos, enforce SHA-256 checks, and run the unchanged browser classifier on the **original RGB photo**; no segmented/painted preview supplies garment identity.
2. Invoke the existing benchmark-only `--subtype-audit` path to create **three new 288px, 320px, and 336px original photo framings** for each result. No alternate image masks or new model installation.
3. Run two fixed hypothetical policies. `conservative`: all three framings must match the proposed exact subtype with at least .55 normalized score and .20 margin above runner-up. `balanced`: any two framings must agree with score .45 and margin .15. These are **engineering cutoffs, not calibrated probabilities**.
4. If a strong type lacks corroboration, propose **review-only** with `Unknown` subtype only when all framings agree on the broad category. Otherwise abstain on category too. A missing framing never authorizes a strong result.
5. Preserve existing uncertain/review-only results. Never fabricate automatic labels, edits, subtype ground truth or unearned model confidence.

Report **both** avoided wrong autosaves and good autosaves unnecessarily delayed for review, separately for reviewed-32, holdout-16 and fresh-11. Accurate final comparisons are required before selecting or rejecting the experiment.

## Actual independent original-photo experiment: candidate rejected

[GitHub Actions run #39533805104](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39533805104) completed **SUCCESS** with the original pinned browser model and checksum-verified **59 unique photographed sources**. The benchmark-only three alternate original RGB frame sizes were 288/320/336 pixels; no identity came from a masked/clipped preview.

| Trial rule | Previously correct strong subtype decisions retained / 43 | Wrong subtype decisions prevented / 4 | Correct decisions unnecessarily routed to review |
|---|---:|---:|---:|
| Conservative: 3/3 frames, ≥.55 top score and ≥.20 margin | **30 / 43** | **1 / 4** | **13** |
| Balanced: 2/3 frames, ≥.45 score and ≥.15 margin | **39 / 43** | **0 / 4** | **4** |

Per set, conservative policy: reviewed-32 retained 19 correct strong results, blocked **none** of its one wrong results and deferred 11 correct items; holdout-16 retained three correct, prevented one of three wrong and deferred one correct; fresh-11 retained eight correct and deferred one correct. Balanced: reviewed-32 retained 27 correct and deferred three, holdout-16 retained three correct and deferred one without preventing any of three errors, fresh-11 retained all nine correct. All source inputs and baseline classifications stayed unchanged.

The four observed incorrect accepted subtypes under alternate original-photo framing were:
- `commons-0064`, labeled Jacket, called Blazer: **Blazer** won all three framings with ~.92 top score.
- `commons-0003`, labeled T-shirt, called Sweatshirt: **Sweatshirt** won all three, with top scores ~.546/.733/.629; the strict policy rejected one low-scoring view.
- `commons-0014`, labeled Blouse, called Tunic: **Tunic** won all three, scores ~.882/.796/.883.
- `commons-0078`, labeled Sneakers, called Ankle boots: **Ankle boots** won all three, scores ~.831/.852/.850.

**Decision: Reject BOTH candidate rules for customer implementation.** They do not justify slowing dozens of correct saves while leaving most wrong labels uncorrected. Same-model frame consensus is correlated evidence, not a genuinely independent garment-form check. Recognition promotion remains **BLOCKED**, and this PR introduces only nonproduction measurement tools.

**Next evidence-based research direction:** Independently label untouched photographs and physical garment form features (shoe shaft/sole, neckline/cuff and top silhouette, dress/skirt separated seams, outerwear lapel and structure). Evaluate a genuinely distinct garment-form cue or vision model *against untouched examples* rather than tuning more thresholds on these already observed images. Preserve user review for category/type uncertainty. Owner consent is required before any paid AI, production model change or real-data submission.

## Quality, provenance and release rules

Focused synthetic controls in `tests/original-subtype-consensus-trial.test.mjs` verify category-only fallback, disagreement, incomplete photo framings, trusted specific shoes and positive/negative effect accounting. Dedicated GitHub Actions `.github/workflows/original-subtype-consensus-trial.yml` runs the complete 1,000+ app suite, both historical source-integrity gates and an exact-head real-browser original-photo trial.

Real-photo labels have been observed by this project; these are **development/test sources, not a new untouched independent holdout**. Even a perfect experimental result is NOT approval to change automatic classification. Need independent new photographs, physical phone captures, real shoes/dresses/shorts/skirts, stable type precision and acceptable unnecessary-review rate before changing the customer app.

No customer app changes, public deployment, merge, paid AI services, Supabase settings, customer wardrobe access or Drive Duel edits.
