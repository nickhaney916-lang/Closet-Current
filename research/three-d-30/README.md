# 3D-30: reviewed photographed pants front projection on original anatomical pants (HOLD)

**Owner-directed single-chat development.** This is a working source-gated mesh projection adapter and atomic outfit-controller integration, NOT an approved actual-photo try-on or deployed pants feature.

## Why the default stays neutral

Our original licensed `commons-0021` pants reference has verified JPEG SHA256 `04c0ca5bed1bee26e83be98b9a992619b0777811a7fb8a99fe955939334bbd8c`, but the frozen independent 15-photo visual assessment grades it **FAIL: obscured waist, no reliable cutout**. The current Work47 benchmark provides **no trusted pants-alpha mask**. Correct behavior is to **show existing neutral reference pants**, not invent a clothing silhouette or claim this single photo is already wearable.

## Delivered engineering

- Reuse actual Work60 anatomical skinned pants surface, original body geometry, bone indices/weights, source pose and neutral back; leave all original photos/rigs and prior PR435 neckline/dress implementation unchanged.
- With a *separately* hash-verified, original-RGB-preserving front-oriented cutout and explicit human provisional review, `projectReviewedPhotoPants` adds independent `pantsSourceUV` and `pantsSourceFront` attributes and shader sampling of the **actual supplied image**, only on front-facing pant surface. Back remains documented neutral—not fabricated rear denim. This is approximate planar photo mapping, not exact fabric tailoring.
- Atomic `createOutfitController.setOutfit('pants'|'shirt-pants',...,{pantsCandidate,pantsReviewed:true})` is optional. Without a cutout, original neutral pants remain byte-identical. Invalid/missing review fails before altering an existing outfit, even when a verified shirt is already selected. Photo textures are disposed with pants on changes/removal.
- No auto-generation, background removal, token usage, remote accounts or source-image editing. The renderer cannot substitute arbitrary unverified image or claim Family Alpha approval.

**IMPORTANT:** The new test fixtures simulate a *future* verified pants cutout and are **not** proof of a real source-approved `commons-0021` mask. The actual local showroom deliberately still shows neutral pants. We cannot honestly claim a photorealistic 3D pants result until a trustworthy licensed original front-and-waist cutout is reviewed and real Chromium before/after images are inspected.

## CI and release

Dedicated 3D30 no-deploy workflow validates both original anatomical rigs, source gate, new UV/front orientation/GLSL injection, optional attachment and original outfit rollback, plus existing photographic dress/shirt browser controls. All old historical stacked stage-scope CI failures remain separate. Full signed garment collision, actual physical phones, remote JWT/RLS/backup and the 15-photo human review are **not** certified. Family Alpha #255 **HOLD**.

**Next step after dedicated green:** obtain or create a reliable source-RGB-preserving jeans cutout with accurate waist and separate legs, independently review against original photo, prove actual Chromium original-photo pants on male/female, then consider moving from optional research to an owner-approved preview. No staging/production, merge, fees, real private wardrobe, or Drive Duel.
