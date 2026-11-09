# Closet Current — MAIN #185 — source-true photographic shoulder/hem correction and no-phantom-bottoms 3D disclosure

**FAMILY ALPHA Issue #255 HOLD. Draft, isolated, unmerged, undeployed research. NEVER touch shipping public/, existing staging, production, Supabase or real user photos.**

Exact verified direct parent Main #184 PR #747 SHA `5b5182d3027c48fc86aa3e3911c757a40a4f9b89`, 4/4 no-deploy CI green #42564078276 (1,442 Node tests; 42 genuine blouse and 42 genuine private-cloud-regression screenshots).

## Actual physical-fit issue

The first published P62 source-blouse geometry interpolation reversed the anatomical world Y endpoints: the 2D photo's *top/shoulder width* was applied at low world Y (hem) and *hem width* at high world Y (shoulder). The P184 front/side actual screenshots showed squared shoulder forms and stiff panels. The P184 screenshot additionally showed **intrinsic green mannequin base shorts** although owner saved bottoms = None, which could mislead about the user's wardrobe.

## Source and integrity fix

- Define `shapeReviewedBlouseShoulder185` as deterministic source-photo 2D width mapping with shoulder at high world Y and hem at low world Y. Add smooth, symmetric gentle outer-shoulder fall (up to 4mm in Y and 3mm inward in X), preserving original cloth UVs, texture bytes, unphotographed rear honesty and exact 163-bone skin weights.
- Cap each per-vertex physical displacement **≤24mm** before applying changes; fail closed if fewer than 20 actual shoulder-zone vertices move, original SHA is wrong, owner source is unreviewed, 163-bone skeleton changed or geometry shape exceed 25mm. All meshes use existing source-proven `Work56-independent-shirt-shell`; no shader-only synthetic clothing.
- Keep prior P62 behavior unchanged by default. Enable P185 physical shaping only via an explicit P185 installer into the isolated pinned P541 disposable donor, using P62's actual source/cutout capability.
- Add actual skinned 163-bone donor read-only P185 SHA owner/geometry receipt and native saved-3D preview gate `photoShoulder185=research`. Recompute current figure proof after male model switch rather than using stale female result.
- Add plainly visible `outfit3D01AnatomyCover185` text to 3D outfit UI. For no selected lower garment it explicitly states that figure base shorts **are anatomical mannequin coverage, NOT selected, saved or owned clothing**. This is a disclosure fix; base shorts are still visually present and are NOT falsely relabeled as a fitted private garment.
- Source photograph, cutout, owner ID, wardrobe persisted outfit, cloud JPEG and RLS remain unchanged. No production feature flag enabled.

## Exact-head independent acceptance (pending)

P185 no-deploy GitHub Actions will verify: exact P184 ancestry, 8 scoped research/test/CI file paths and no public edits; P62/P183/P184 and new adversarial source shape tests + full Node suite and build; real Chromium and WebKit, female/male each front, side, *inferred* rear at 320/390/430 = 42 new genuine photo-blouse mobile screenshots, SHA/PNG/dimensions checked; plus 42 inherited genuine private synthetic cloud-to-native 3D browser PNGs.

Real review MUST inspect front/side/rear screenshots for both genders and honestly describe remaining flat/stiff fabric, shoulders, visible base shorts and unsupported 3D. This is not human 10/10 photorealism acceptance.

## Remaining release blockers

Only pinned licensed Commons blouse source `commons-0016`; cutout is provisional REVIEW. Parallel #63 PR #746 correctly requires owner-bound exact original+cutout review receipt before real family photos can enter 3D. No arbitrary user-photo 3D acceptance, no true physically simulated fabric, no photographed rear, no real phone hardware, no hosted signed Supabase JWT/RLS acceptance. Family Alpha #255 HOLD and NO DEPLOY.

**Engineering status: awaiting exact-head CI.**
