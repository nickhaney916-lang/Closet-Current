# Owned outfit recommendation quality — October 20, 2026

Independent follow-up to PR #69 head `d6d2f7130e05e4643eb1c9e050d9f1ad744335a7`.
The actual head and CI 39450574991 were checked: completed SUCCESS, including
build/full Node regressions and both customer/fitting browser profiles. Open PR
heads were reviewed; #72 owns annotation memory, #58 owns original figures, and
neither is part of this branch. PR #69 and its source branches remain unchanged.

## Customer-visible corrections

- Casual sweater dresses, jumpsuits and rompers are eligible; sweater dresses
  and jumpsuits can also be used for casual date night. Season and occasion
  eligibility still apply to unpinned items. A pinned item still stays selected
  with the existing mismatch notice when it falls outside recorded preferences.
- Independent capped top/dress shortlists prevent a large shirt collection from
  erasing every compatible dress option before combinations are considered.
- Recorded anchor color/pattern coordination influences the shortlist BEFORE
  its eight-item cutoff. Final combinations retain the existing style, color,
  pattern and trend rules. No learned taste model or subjective quality score
  is asserted.
- Within the best available required-slot coverage, retain a dress/separates
  choice where compatible, then vary top/bottom combinations, then footwear.
  Never invent alternatives to fill three cards. Complete looks are not padded
  with incomplete separates. Sparse closets still return clearly labeled gaps.
- A dress swap is labeled Swap dress; jumpsuit/romper swaps say Swap one-piece.
  Existing structure-safe swap logic still cannot add trousers or layers under
  a dress, replace the pinned new piece or introduce an unowned garment.
- Unknown color labels now receive the same uncertainty notice as blank colors.
  One-piece cards explicitly say that no separate bottoms/layers are added.

All recommendation IDs come from the provided owned wardrobe. No garment image,
original recognition input, category/color indexing, crop or mask is modified.

## Verification

Six focused behavioral regressions failed against the PR #69 engine, then passed:
winter sweater-dress use; dress retention with 12 shirts; patterned anchor with
nine competing shoes; variation of owned bottoms; complete-vs-partial looks;
and disclosure of a literal Unknown color. Existing anchor, season, trend,
swap-cycle, dress-structure and owned-ID tests also pass.

Local build passed. Full Node suite: **1087 passed, 0 failed, 3 skipped; 1090 total**.
Local Python regression suite with `PYTHONPATH=benchmark`: **37 passed**.
The browser harness adds a synthetic large-shirt/dress wardrobe, an owned footwear
anchor, a real dress-swap button, actual IndexedDB outfit save/reload, varied
pinned-shirt bottoms and byte-identical pre-existing wardrobe records. Both mobile
engines are configured in the branch workflow; exact-head CI must be inspected
before claiming a browser pass. Existing capture, original-source, storage abort,
account isolation, model preview, retry and 320/390/430px checks are retained.

## Bounded recommendation work

Shortlists contain at most eight non-dress tops, eight dresses, eight bottoms and
eight shoes: at most 576 core combinations (8*8*8 separates plus 8*8 one-pieces).
Optional slots stay capped at eight candidates each. Per-slot ranking is cached
only within one synchronous recommendation call, so edits, swaps, accounts and
new calls cannot reuse stale rankings.

Exploratory local synthetic fixture: 100 owned records, 40 T-shirts, 40 jeans,
12 sneakers and eight jackets; solid patterns; Black/White/Blue/Green cycling;
Casual/Fall, no trend library or anchor. Instrumented garment-score calls dropped
from **24,668 to 140**. Six calls per implementation with the first excluded gave
five warmed samples; medians **145.8ms before / 141.5ms after**. Timing was noisy
and is not evidence of a useful end-to-end speedup, physical-phone latency or FPS.
The score-call reduction demonstrates elimination of repeated slot ranking;
combinations and their harmony still require work.

## Remaining limits

This improves deterministic recommendation rules and variety, not recognition
accuracy, independently scored real-photo masks, generated try-on quality,
realistic drape, physical-phone performance or approved figure art/rights.
Actual customer preference testing is still needed. No production merge or
deployment, paid inference, customer-photo upload, annotation changes, original
figure artwork changes or Drive Duel changes.

## Account-bound new-item handoff

The recommendation UI now checks PR #69's real account/database write context
before displaying a newly selected anchor and after closet readiness before
matching. A mismatched or signed-out context clears prior anchors/results and
shows reload/sign-in guidance rather than interpreting old database records as
the new account's wardrobe. Two further behavioral regressions failed before this
fix; total new Node regressions are eight. The actual-browser mismatched-database
probe now also asserts Style this refuses to start and publishes zero suggestions.
Initial recommendation commit `e91aa30a` passed customer/fitting CI 39454476209 and
camera/indexing CI 39454476112; exact updated-head CI is required for this guard.

## Pending-preview stability

Ownership-follow-up CI 39454837486 passed Node checks but failed the stalled-decode
browser wait once. Diagnostic-only rerun 39455409269 passed both customer and
fitting profiles, so that rerun alone did not identify the failure's cause.
A separate deterministic behavioral regression then reproduced repeated identical
preview requests across event-loop turns restarting pending decoding and its
bounded timeout. The renderer now shares an in-flight render only when full plan,
board, owner, database and render revision still match. Source/account/database
changes, pagehide, errors and explicit retry retain their cancellation/recovery
paths. Per-attempt state clears on settlement. There are now nine new Node
regressions in total. Browser stress sends identical requests every 200ms while
decoding is deliberately stalled; exact final-head CI must verify that path.
