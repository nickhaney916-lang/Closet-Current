# Closet Current — Mission 1 P841: no unsaved photo can become an unverified closet item

**FAMILY ALPHA HOLD #255 — research only, DRAFT, UNMERGED, UNDEPLOYED.** Direct child of P840 verified exact HEAD `c44166443e52ac7487ea84d8218098ff629610d2`. No hosted Supabase, owner accounts, private family images, main/staging/production, cloud or AI model changes.

## Real source defect

P839 manual-review confirmation protected **risky** or **outfit-split** drafts. An ordinary single-photo draft where the local model returned no confident garment category, failed to load, or found an unknown color lacked the explicit review flag. The same `adjustPhoto` editor could save this **still-unsaved** photo into the closet with `category:'Uncategorized'`, blank/Unknown color or a proposed type without any active owner's photo-based acknowledgement. This could admit junk incomplete items into a private inventory, even though the UI displayed "Needs review". The P836 optional review-first research trial did not cover every such state.

## Narrow fix

- **All still-unsaved photo drafts** are now review-required, independent of inference confidence, subtype guard, source outfit or no model result. The app determines this from **batch membership without being already in saved items**, not from fragile, missing model diagnostics. Existing flagged review cases remain protected.
- The actual Adjust editor requires selecting an **existing legitimate category** and entering a **nonempty meaningful color** (case-insensitive `unknown` and whitespace are refused), along with a checkbox explicitly acknowledging comparison to the displayed original photograph. The specific item type may intentionally stay `Unknown` if the user cannot resolve it. Saving remains disabled until conditions hold; the async submit handler rechecks them to reject programmatic/form bypass.
- Editing the fields cancels prior acknowledgement, requiring the owner to re-check. The photographic original remains in a **private local draft** unless the owner deliberately confirms and saves. The stored value clears the owner-confirmation flag only on successful manual persistence.
- **Already-saved, unflagged garment edit** retains its original ordinary editing behavior with no new approval checkbox. Normal *automatic* indexing and existing release mode gates are unchanged; P836/838/839 review safeguards are not weakened. No blind recognition accuracy improvement is claimed.

## Evidence to collect

Build native app, native no-account trial, run full Node regression suite; execute the actual `clothingFields` and `adjustPhoto` DOM implementation in **genuine Chromium and WebKit** at 320/390/430 CSS widths with photo-free controlled fake storage. Verify single no-category and blank color rejection, lowercase/mixed-case unknown color, programmatic submit failure, active approval invalidation after changing category/color, approved intentional Unknown subtype, previously flagged risky/outfit review, and no new checkbox for a **previously saved** clean item. Zero runtime exceptions and exact-head GitHub Actions are mandatory before announcing PASS.

This is owner-review **safety**, not retraining, new segmentation masks, independently human-reconciled footwear pairs, fresh sealed photo inference, or physical phone acceptance. Parallel #67 classifies, #68 segments, #69 profiles mobile inference, #70 reconciles wardrobe units. Existing source-disjoint blind masks/color/subtype, device QA and real 10/10 quality remain unverified.

**Decision:** do not merge or promote to Family Alpha. Family Alpha HOLD #255 remains active.
