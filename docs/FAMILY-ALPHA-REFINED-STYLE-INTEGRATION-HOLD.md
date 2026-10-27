# Closet Current — approved source integration, not garment-fit approval

**Main thread Family Alpha issue #255 · 2026-10-26 Pacific · DRAFT HOLD — NO DEPLOY**

## The narrow gap

Work #31 [PR #325](https://github.com/nickhaney916-lang/Closet-Current/pull/325) verified Style My New Clothes from capture/import → Adjust/save → up to three owned outfits → separate approved source-derived cutouts → 2D avatar → swap → favorite save/reload/restore. It uses the #322 articulated 2D humanoid renderer, which **does not** include the more recognizable neutral face and hands from [PR #326](https://github.com/nickhaney916-lang/Closet-Current/pull/326).

This branch integrates **only that refined SVG face/hand renderer** into a separate disabled, local-only copy of Work #31's compiled output, preserving all model/photo/style/owner/privacy code byte for byte. No alteration to any Work-owned branch.

## Verified source contracts

- Work #31 base head: `44f288dfdcfa02ec5b2cf89a7c79c08cfcaa3584`. The base compiled candidate is `dist-family-alpha-31-hold`.
- Figure draft #326 immutable head: `e75cd4689356ae468a88504ddb25df4b4ff6cb70`.
- Source `public/family-alpha-2d-layer-plan.mjs` is **identical** in both lines; no anchors, outfit layering or garment geometry rules are modified.
- Source-aware `verifyFigureOnlyDelta` checks every byte *outside* `createAlphaHumanoidFigure` is identical, so prior transparent alpha bounds, `HTMLImageElement` source/identity and rendering stay intact.
- Nonface anatomical limbs, feet, torso and neck path data are compared exactly. Eyes, brows, nose, mouth, tapered face and separate finger details are required.
- The fully assembled output `dist-family-alpha-31-refined-avatar-HOLD` is recursively compared to #31's output. **Only** `family-alpha-2d-photo-renderer.mjs` may differ, and it must equal exact immutable #326. Other changed/missing files fail closed. `alpha31-refined-visual-HOLD-manifest.json` records audit hashes and explicit release blocks.

## Functional test scope

Run full suite plus true Chromium/WebKit browser execution of Work #31's *compiled* app at 320px, 390px and 430px. Each independently exercises synthetic camera JPEG import, human Adjust/save, three outfit suggestions, manually approved transparent display PNGs, all three 2D figures with new facial anatomy, swap shoes, save favorite, reload/restore, unchanged original images, logout and no third-party requests.

Generate screenshots of a 390px synthetic first outfit for visual inspection. Every screenshot is explicitly **SYNTHETIC ONLY** and requires owner visual acceptance; no licensed or personal photos. These are NOT proof of real fabric fitting or clipping.

## Remaining Family Alpha HOLD conditions

- **Work #30 [PR #324](https://github.com/nickhaney916-lang/Closet-Current/pull/324)**: 15 independently licensed originals generated 7 provisional alpha cutout proposals versus 2 baseline; **zero PASS**, 12 REVIEW, 3 FAIL under stricter final visual criteria. Candidate is NOT approved or live. Do not silently substitute unapproved cutouts.
- **Work #32**: independent garment-to-anatomy fitting research is separate. Straight PNG overlays remain flat; visual release quality is still **NOT APPROVED**.
- **Work #33**: licensed-image avatar fit visual review is separate. No synthetic test establishes garment realism.
- **Work #28 [PR #318](https://github.com/nickhaney916-lang/Closet-Current/pull/318)** wardrobe IDB synchronous failure fix **not integrated**; original partial-write risk remains unresolved.
- Actual staging owner/family JWT isolation, physical Android/iOS visual tests, four simultaneous authenticated accounts, real cloud restore, current real-model accuracy and owner approval remain **NOT VERIFIED**.
- No merge, deploy, production change, staging/Cloudflare/Supabase/Resend settings, spending, paid AI, real customer/family images or Drive Duel writes.

Even if every synthetic test passes, **Family Alpha remains HOLD**, not live staging ready.
