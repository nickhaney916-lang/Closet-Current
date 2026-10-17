# Clearly visible outfit pieces — extended policy (October 17, 2026)

## User experience
A person can wear an open overcoat with a sweater **and** boots with long socks, or shoes with stockings. These are clearly distinct pieces when substantial areas of both garments are visible. Do **not** add a forced underlayer questionnaire. If the customer photographs only a boot, ignore accidental glimpses of socks. In whole-outfit mode, the AI should eventually catalog distinctly visible garments once it has reliable separate masks.

## New experimental evidence rule
`benchmark/visible-garment-pairs.mjs` extends the previously approved coat+sweater research rule to two footwear/legwear examples:
- boots + substantial knee-high socks exposed **above the boot tops**
- shoes + stockings/tights substantially visible on the legs
- reject a two-pixel cuff sliver, shoe/stocking masks covering the same pixels, inconsistent source photos, unsupported category labels and weak classification
- boots left/right and socks left/right count as two *pairs*, not four separate closet items

**Important:** `Legwear` (Socks, Knee-high socks, Stockings, Tights) exists only as a proposed **internal research category** here. Closet Current's current product taxonomy and classifier do not yet include these garment types. No new top-level customer category/tab, no wider catalog changes or production rollout are made in this experimental phase.

## Coverage limits
Tests use **synthetic, source-aligned masks** to check decision logic. No real images in the existing 70 licensed evaluation sources explicitly depict an open coat with sweater or shoes/boots with visible socks/stockings, so there is currently **no verified real-photo success** for these scenarios. A real labeled dataset and an instance segmenter distinguishing fabric boundaries must be obtained and evaluated before automatic recognition or two-item saving can be enabled. The previous grounded object-box model falsely labeled entire images as multiple garment types, and is not trustworthy as independent mask evidence.

No hidden-item guessing, extra user confirmations, account data mutation, live Closet Current deployment or Drive Duel modification.
