# Closet Current — physical-phone outfit quality validation

**Draft QA packet for a controlled family/friends pilot, 20 October 2026.** This is a test plan, NOT proof that any physical device was tested. The customer integration is draft PR #80; higher-density existing-transparent cutout preview is the next isolated draft.

## One-page walkthrough for each REAL phone

Use one recent Android phone and one physical iPhone with a modern browser (preferably the production browser engine). Run these checks on **each device separately** using a dedicated pilot-only account with consent and clothing photos that may be inspected locally. Avoid faces, minors, identifying rooms, receipts, or private backgrounds. Do not transmit personal photos to public GitHub issues or CI.

| Test | On-phone action | Pass evidence and expected result |
|---|---|---|
| Permissions + capture | Open Add clothes, accept camera permission, take a real 12MP+ garment photo, then reject/re-grant permission | Visible camera/photo error recovery; exact originally captured dimensions and orientation recorded locally; app does not lose photo |
| Import and switching | Import original from library, switch to another item during processing, return | Last selected source remains current; no older garment type/color/category or outdated timeout pollutes it |
| Shoe/dress/skirt/shorts | Capture at least one original photo per type (front-facing, contrasting background) | Record proposed category/type, accepted or held-for-review reason, user correction and final correct closet tile; skirts compete against dresses |
| White background | Photograph dark garment against a white sheet, then a real white garment against dark | Foreground color correct or explicitly **Choose color**; do not incorrectly auto-index the fabric as backdrop White |
| High-resolution original | Inspect same item in Review and My closet | Photo retained at original-photo recognition stage, not classified from masked display derivative; no obvious pixelation in saved originals |
| Style new item | Pick one newly saved item, tap Style this, try up to 3 owned-only outfits | Each suggestion includes anchor; all other IDs in this same account; valid dress one-piece; partial wardrobe gaps stated |
| Local fitting | For approved transparent clothes, open female/male local figures, inspect collar, cuffs, hem, shoes, layers and pattern | Garment visible but **not** advertised as a realistic sizing/drape simulator. Compare on-device screenshots at normal and 2x magnification; no false overlapping clothes |
| Retry + offline | Start preview, briefly enable airplane mode, change figure/garment then Retry | No blank stuck spinner, no stale preview from another source, local figures still show without provider upload |
| Account isolation | Sign out account A and sign in to separate pilot account B without reloading unless requested | No garments, previews, saved outfits, selfie overlays or local caches from A visible to B |
| Persistence + slow network | Save an owned-only outfit, force-close app/browser, reopen, intentionally interrupt save once | Real saved outfit reloads; transient save errors remain retryable and never fabricate a saved record |
| Heat/memory | Preview layers 10 times; toggle figures and quickly switch photos | Record actual render latency, battery/heating symptoms and crashes; no duplicate overlays, inappropriate low-resolution fallback or memory-related reload |

## Required independent acceptance record (not supplied by emulation)

Capture device model, OS release, actual browser engine/version, app commit SHA, local date/time, original image dimensions/type, whether submitted with permission, expected garment label, actual label and whether manually fixed. For each figure/layer, capture a side-by-side normal and zoomed screenshot and mark **good / acceptable / unacceptable** for visible seams, transparent edges, alignment, prints, colors and garment-to-body occlusion.

Any unsupported photorealistic depiction, identity leak, lost photo, inaccessible retry, wrong-category auto-save, or duplicated/overwritten garment is a **release blocker**.

Keep private originals and approval evidence in approved secured storage under account or reviewer control only; do not post photos in public PRs. Nothing should use real customer faces in generic automated CI.

## Separate mask and figure gates

- Original full-person garment outline/clipping: 12 licensed candidate images, **zero authenticated first-plus-independent-second human-approved full masks** at current baseline. Do not infer segmentation accuracy from synthetic cutouts.
- Original male/female production master figures: technical/visual quality, provenance and redistribution rights evidence remain unapproved. Do not mark commercially cleared without verifiable documentation.
- Local mannequin is a conservative collage of already separated clothing, not physical drape, true body measurements, AI try-on or photo-realistic fit.

## Higher-DPI implementation

The local viewer now samples up to **1,000,000 display-only pixels** from a source garment with **actual native transparency** at device pixel ratio 2 or above, instead of the 600,000-pixel standard ceiling. DPR 1 retains 600K. The alpha check is still conservatively performed at a smaller copy. For opaque or otherwise uncertain photos, existing 150K safety/white-matte workflow is unchanged. No recognition source or saved original photos are edited or replaced. Measured improvement is **display pixel density**, not guaranteed perception of realism or reconstruction of missing details.

## Release hold

Require the completed unified customer PR #80 and new retina branch CI, a separately reviewed cross-branch mask integration, actual physical phone walkthroughs, true segmentation reference evidence, figure rights and visual sign-off, and explicit authorization before any main merge, paid provider or production deployment.
