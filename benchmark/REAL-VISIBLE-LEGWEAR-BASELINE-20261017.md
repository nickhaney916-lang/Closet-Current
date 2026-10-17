# Real-photo baseline: boots with knee-high socks, heels with tights

The two source images were audited on GitHub Actions workflow **39057703007**. They are independently sourced Wikimedia Commons photographs: the group photo is CC BY-SA 2.0 by Ogiyoshisan; the outfit photo is CC BY-SA 3.0 by Tobias ToMar Maier. The photos and original bytes have pinned SHA-256 hashes in `benchmark/manifest-visible-legwear-2.json`.

**Intent:** The user wants each **substantially visible, separate** article included in a whole-outfit photo: open overcoat + visible sweater, boots + long socks, shoes + visible stockings. Single-item captures should focus on the deliberate item. A little exposed sock cuff or tiny collar does *not* trigger another inventory entry. No new user tabs or questionnaires.

**Baseline limitation:** Our current model has a single "Shoes" semantic class (9) and **no semantic socks/stockings/tights class**. The existing FashionCLIP candidate catalog does not contain socks, stockings or tights either. This test records what it actually segments on two new source-verified photos, including class 9 pixel counts, but cannot report hosiery separation accuracy without a dedicated model, separate masks and independent reference annotations.

This test is not real phone performance, cannot promote a new model to production, and creates zero closet entries. A result that parses and passes is proof of benchmark reproducibility and fail-closed behavior only.

User-facing design: no new tab. A future internal legwear type, if validated, can be surfaced alongside footwear in the existing closet flow. Do not change the product taxonomy or slow down every camera capture until independently measured quality justifies it.
