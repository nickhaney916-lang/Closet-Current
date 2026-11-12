# Closet Current Mission 1 P839 — photographed outfit instance review

**FAMILY ALPHA HOLD #255.** Isolated research draft, unmerged, undeployed. No private photo uploads, hosted Supabase/cloud/account changes, staging/production changes, or family testing.

## Identified real application problem

Prior modern M1 P838 [PR #914](https://github.com/nickhaney916-lang/Closet-Current/pull/914) exact verified HEAD 4774d4a6cfd719ed59e168be8aa1d14d6e35ec6a moved three wrong automatically accepted single-garment subtypes to owner review on each browser's existing 16 original photo diagnostic set. However, the separate outfit pipeline explicitly initialized **all split candidates with requiresOwnershipConfirmation=false**. High-confidence or category-plus-color outfit guesses could therefore be stored automatically, even though multi-garment detection and true owner photo acceptance are not validated.

The best public Grounded-SAM research PR #903 matched 26/38 local and 27/38 in independent CI on eight previously exposed human-mask photo originals; 11 or 12 garment instances still went unmatched, depending on runtime. That model is not the active app's deployed model; the numbers do NOT certify real-mobile whole-outfit accuracy.

A separate gap: when the existing app did flag a recognition for owner review, opening Adjust and clicking Save without checking the photo counted as approval.

## P839 implemented source changes

1. Every new outfitSourceId segmented capture becomes a private owner-review-required unsaved draft, regardless of classifier certainty, category+color, duplication, or clipping. Source JPEG, mask crop, hint and potential corrections are preserved in the existing local draft.
2. Adjust on flagged garment/outfit/P836 trial shows a mandatory explicit checkbox: owner checked the actual visible photograph against the proposed category, specific type (or explicitly Unknown), and color. The button stays disabled until the checkbox is set AND category and color are provided; the submit handler independently enforces the condition even on programmatic submit events.
3. Editing fields after checking automatically revokes prior acknowledgement, requiring fresh confirmation. Unknown subtype remains allowed when explicitly chosen, without claiming the model guessed it correctly. Confirmation flag is cleared only when manually saving.
4. Existing unflagged single garments remain unchanged. Outfit split UI now tells the truth: pieces require owner review, not automatic saving.
5. No change to FashionCLIP model, image weights, segmentation geometry, cloud/auth/privacy APIs, source photo bytes or current family release.

## Acceptance

Four additional native end-to-end automatic-indexing regressions cover strong outfit, category-only with color, unflagged single, and clipped outfit candidates. Full Node regression and build remain required.

Actual app.js clothingFields and adjustPhoto functions execute in *genuine Chromium and WebKit DOM* at 320/390/430 CSS widths with photo-free synthetic fixtures to prove unauthorized submission cannot save, mandatory category/color, change revocation, risk/outfit flags and unchanged legacy editor. These are actual browser interaction tests, NOT true model inference, source-image accuracy, or physical mobile devices.

Strict six-file direct-parent check and no deploy; no photographs leave CI. Report exact-green status only when all jobs pass.

## Remaining mission-level blockers

Real human-reviewed sealed/never-seen multi-garment instance masks, category/type/color labels, model training improvement, held-out auto precision, physical Android Chrome/iPhone Safari, and signed-account privacy acceptance. Parallel #67 and #68 own model/data research. **P839 is a safety/UX integration milestone, not proof of improved recognition accuracy or 10/10 quality.** Family Alpha HOLD #255 stays open.
