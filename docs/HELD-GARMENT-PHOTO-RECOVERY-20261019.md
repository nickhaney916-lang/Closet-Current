# Held-photo local fitting recovery — October 19, 2026

This is a **separate main-chat task** after Work's [PR #39](https://github.com/nickhaney916-lang/Closet-Current/pull/39) (real-photo mask research) and main-chat [PR #40](https://github.com/nickhaney916-lang/Closet-Current/pull/40) (safe integration). Work's mask algorithm is **not modified**.

## Goal
A customer who selects a photo our conservative local cutout software refuses must not see only a blank mannequin and cryptic "held" counter. Keep automatic masking review safety, preserve saved originals and offer a clear retake action without clutter or manual cropping.

## Change
- The existing inline fitting panel shows a short, accessible help paragraph and one minimum-52-pixel-height **Add clearer clothing photo** action only when the **completed/current** render has one or more held pieces. It hides during pending/racing previews and when no items are held.
- The help explains even lighting and plain contrasting backdrops, and warns against mannequins or mixed-clothing backgrounds. It accurately states that the existing original remains saved; retaking does not silently replace or delete it.
- The one button routes to the existing `scan` view in **single-item** mode. It does **not** automatically open the camera, request upload, activate AI services, change item metadata, overwrite source pixels, or add manual crop screens.
- Work's dark-studio proposal remains display-ineligible until independent full-mask and compositing review; this UI must not turn it on. The 12 existing real-photo cases are still honest holds.
- Synthetic valid shirt/trousers outfits continue to show no irrelevant retake message.

## Evidence requirements
Node assertions confirm conditional visibility, existing navigation, unchanged paid backend, and no network/persistence added to local display renderer. Android Chromium and iPhone WebKit **emulations** verify a SHA-pinned licensed held photo displays guidance, button reaches the existing single-item capture UI, source image remains identical, and the help disappears for valid synthetic clothing.

These tests do **not** establish realistic drape, automated recognition accuracy, usable full-resolution figure licensing, physical-phone capture, or competitor parity. User photography may still be difficult to auto-mask; Work is improving that independent engine.

**No merge, deployment, paid service, customer photo uploads, purchased figures, or Drive Duel changes.** This draft is stacked on PR #40 and should be coordinated centrally before any eventual integration.
