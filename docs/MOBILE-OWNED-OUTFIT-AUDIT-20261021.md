# Assignment 132 — owned styling and photographic preview reliability

Isolated from verified PR #131, commit `7566b59e7377d77d8503c7c599aabe32fd3959dc`.
Reviewed open PRs #123–131: #124/#128 integration, #126 recognition and #130 authentication remain on their independent branches. This branch inherits #125 camera quality, #127 pilot coordinator, #129 trend-cache fallback and #131 original inspiration-photo transfer. No other branch was overwritten.

## Reproduced customer defects and fixes

- One shirt, one pair of pants, one pair of shoes and three compatible jackets returned only one outfit: the scorer chose only one optional layer per core. Enumerate the existing bounded layer shortlist, retaining unique owned IDs, seasonal exclusions, pinned garment and dress/separates structure. Return at most three distinct options; sparse closets are not padded with duplicates or invented garments. Existing one-piece swaps remain available.
- Complete, already transparent tall photographic cutouts under the 1MP budget could be hidden because one edge exceeded 1600px. Geometry now uses the existing total-pixel budget with integer dimensions, preserving aspect ratio, calibrated shoulder/waist/sole anchors and logical layer order. No figure assets, mesh, segmentation, colors, original photos or human evidence were changed.
- Accepted original-photo encodings between 2M and 2.85M characters were excluded from the display cache and reprocessed after outfit changes. Match the existing accepted source budget while retaining the six-entry/8M aggregate cache bounds, exact source/color/category identity and synchronous owner eviction.
- Regenerating an identical option allowed another identical saved outfit. Compare normalized boards inside the owner-bound serialized write, after source revalidation; identical name/selections/preferences reuse the durable entry even at the 50-outfit limit. Different names/preferences remain intentional separate looks. Failures and aborted writes never publish a new saved row.
- Partial stylist combinations offered Save outfit. Disable that action with clear missing-clothing instructions while keeping Preview on model usable. The general outfit builder still supports intentional partial drafts.

## Evidence

Local production build and complete Node suite: **1,357 passed, 0 failed, 3 skipped (1,360 total)**. Eight new regression tests; the separate six-test focused file fails three cases against immutable PR #131 (layer variety, tall aspect fitting and accepted high-resolution cache retention), and passes all six here. Two additional tests verify overlapping saves and reuse at the capacity limit.

CI on this draft runs the complete suite again and actual product scripts under Android Chromium and iPhone WebKit touch emulation, pinned Playwright 1.56.1. New browser checks cover three layer options, save/regenerate/reload without duplicates, disabled partial saves and a real local canvas tall transparent pants preview at DPR3. Existing suites cover swaps, ID-based reopening, interrupted storage, account changes, 320/390/430px layout, retina photographic texture preservation, stale cloud owner recovery and PR #131's original-photo transfer. Exact final head/run outcomes are recorded in the PR; a configured workflow alone is not passing evidence.

## Remaining validation and limits

All new photos and account responses in emulation are synthetic/local. No physical Android/iPhone hardware, real customer wardrobes, human aesthetic acceptance, sizing, fabric behavior, live email or hosted account-isolation retesting is claimed. Existing masks without independent approval remain held; this is an approximate local styling collage. Existing dress structure intentionally excludes separate bottoms/layers; this assignment does not certify dress-and-jacket realism. The two existing figure assets and their production licensing/master-source readiness remain unchanged and unapproved. Live account/deletion readiness remains with #130 and release integration with #128.

Before pilot release: (1) independently integrate/recheck the parallel branches; (2) complete real-phone camera/import/scroll/memory/account-switch/save/reopen tests; (3) collect independent garment/mask and outfit-appearance review; (4) resolve figure commercial rights and live authentication/deletion blockers. No paid calls, merge or deployment were performed.
