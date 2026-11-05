# Closet Current — PHOTO-SWITCH-REVIEW-GUARD-68

**Research only. Family Alpha Issue #255 HOLD. No merges, deploys or production/staging changes.** Exact verified parent: NEARDUP67 `6f7873a6f513596bd3a7f41d8578a2304228f769`, [successful no-deploy Actions #42077696402](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42077696402), 708/708 Node, 12 native browsers, 66 new verified screenshots.

## Actual user-facing defect

In the camera/import **multi-garment review panel**, `startFile(file)` immediately called `revoke()` before verifying the new JPEG or asking whether there was work to preserve. Accidentally selecting another photograph erased all current unsaved manual region marks, crop corrections, clothing category/subtype/color choices and explicit confirmations. This lost time and could cause duplicate or omitted garments if a user repeated earlier capture work. No item was automatically saved, but there was no chance to cancel the source switch.

## Isolated research implementation

- Add the pure `hasUnsavedHumanReview68(pieces)` classifier, which distinguishes genuine **human-touched review** (manually added region, saved crop adjustment, changed category/subtype/color, explicitly checked confirmation) from unreviewed automatic model proposals or inflated model scores.
- On **same signed-in owner's explicit new camera/import selection**, and only when human review would be discarded, show a browser confirmation. Cancel returns **without calling revoke**, altering any JPEG or crop, resetting the original source SHA, changing category/type/color/confirmation or saving anything. Accept follows the pre-existing full `revoke` path, verifying the new distinct photograph before working on it.
- No extra modal for the first photograph, a model-only unreviewed source, a successful save whose confirmed pieces have already left the unsaved list, or when no review exists. If a confirmation UI API is unavailable, the safe behavior is to keep unsaved review rather than silently discard it.
- **Mandatory security boundary:** `closet:alpha-session-changed`, `closet:session-locked` and `pagehide` still instantly `reset/revoke` old private photos and crop DOM, **without prompting**, even if a previous owner left human work in memory. Auth/session privacy wins over preservation.
- This feature adds no localStorage, camera roll, customer photograph sync, cloud API, new model, recognition label, 3D readiness assertion, or background autosave. It leaves original photo capture provenance, owner-IDB and atomic save untouched.

## Native acceptance

Use two **genuinely distinct, license-documented source JPEGs**, not a resized copy of one photograph:

1. Original CC BY-SA 2.0 source [Shirt and tie, jeans and Converse](https://commons.wikimedia.org/wiki/File:Shirt_and_tie,_jeans_and_Converse.jpg), SHA `e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff`.
2. Additional documented source `commons-0046.jpg`, CC BY-SA 4.0 by Jacek Halicki ([Wikimedia Commons source](https://commons.wikimedia.org/wiki/File:2015_Garb_Goli%C5%84ca.jpg)), SHA `7f94b8bc8edc340200f0353968f54868dc72e3180bc191530e19f2a82ce91ead`. This source is used only to prove source switching. No clothing accuracy or category is inferred from it.

Run actual Chromium and WebKit phone-width Playwright browsers at 320/390/430. For each case:

- Sign into fixture owner A with real per-account browser IndexedDB; capture unchanged original licensed source and manually review three visibly separate crops, human category/subtype/color and confirm all.
- While no items are yet saved, select another actual licensed original JPEG; **dismiss** the genuine browser confirmation. Compare the full original photo identity, all three piece IDs, crop image bytes, confirmed detail values and save readiness to the snapshot before switching. The database must remain empty. Capture a cancellation screenshot.
- Complete the existing three-piece owner-private atomic write. Reimport the first photo and attempt the existing exact-source duplicate save; confirm atomic failure leaves three records and one unsaved reviewed crop.
- Now accept the second real original JPEG source-switch confirmation. The active photo SHA must change to the second original. Old confirmed unsaved pieces must disappear, but all three *previously committed* private garments remain in owner A's database. Capture accepted-switch screenshot.
- Continue the existing real Style My New Clothes and saved Outfit Builder / V4 backup and restore / owner B isolation regressions. Confirm owner B never receives owner A's clothing and no original photo bytes are uploaded to unknown hosts.
- Save 72 actual mobile native PNGs (60 inherited scenes plus 12 before/after source-switch screenshots) and independently verify file SHA-256, widths, height, nonblank entropy, expected six cases, original source manifest.

**Tests:** Full inherited Node suite plus 16 new adversarial photo-switch/owner-session assertions, six inherited original-photo private native browser flows and six new distinct-image source switch/restore flows, exact-head dedicated **NO DEPLOY** GitHub Actions and research-only changed-file allowlist.

## Scientific boundaries

This is a **user-work preservation and privacy reliability improvement**, not improved detection, instance segmentation, subtype recognition or color accuracy. Testing file imports, prompts and private database saves does not constitute actual independent human annotation. Parallel #36 detection, #37 genuine photograph ground truth and #38 3D fabric fidelity remain independently owned. Physical Android/iPhone acceptance is not claimed. Family Alpha remains HOLD until independent release authorization.
