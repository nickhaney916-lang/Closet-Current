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

## Quality, provenance and release rules

Focused synthetic controls in `tests/original-subtype-consensus-trial.test.mjs` verify category-only fallback, disagreement, incomplete photo framings, trusted specific shoes and positive/negative effect accounting. Dedicated GitHub Actions `.github/workflows/original-subtype-consensus-trial.yml` runs the complete 1,000+ app suite, both historical source-integrity gates and an exact-head real-browser original-photo trial.

Real-photo labels have been observed by this project; these are **development/test sources, not a new untouched independent holdout**. Even a perfect experimental result is NOT approval to change automatic classification. Need independent new photographs, physical phone captures, real shoes/dresses/shorts/skirts, stable type precision and acceptable unnecessary-review rate before changing the customer app.

No customer app changes, public deployment, merge, paid AI services, Supabase settings, customer wardrobe access or Drive Duel edits.
