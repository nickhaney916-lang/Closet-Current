# Closet Current Mission 2 P93 — original-JPEG-preserving dress cutout decontamination trial (HOLD)

**Not a garment-recognition, garment 3D realism, or release claim.** This research branch is isolated from exact verified [P92 draft #1165](https://github.com/nickhaney916-lang/Closet-Current/pull/1165), HEAD `e8170c9ebce19a189dd03ea2027f87717c821a76`. P92 source-grounded blind reviewer workstation / original public photo had 3/3 passing no-deploy CI, 1,808/1,808 Node and genuine Chromium/WebKit 30 image-pair offline reviewer smoke, but **NO authentic human-review votes**. One of the P92 inputs, the original 1920×2880 Commons-0053 rugby-style sleeveless dark dress, exposed visible pale photographic mannequin residue at neckline and shoulder side openings in the provisional Work47 PNG cutout.

## Objective licensed input and source-protection

- Original unmodified public Commons-0053 JPEG SHA-256 `e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019`, Commons CC BY 4.0, actual source image `1920×2880` (not owner-private).
- Work47 original-RGB provisional transparent PNG SHA-256 `ab7c7caa43fe32b1e0ba5c58e64a59ba49e5a9fe881a3a7a7791c20aab9007c4`. It is deliberately `ownerApproved:false`. Real source JPEG and PNG are **copied unchanged** into artifact; research derivative is written only into `benchmark/mission2-p93/real-licensed-commons-0053/`, never into consumer `public/`, hosted Supabase, source fixtures, master or private user wardrobe.
- The script re-creates the original Work47 asset from immutable detached P541 source `df6885d6011cb33fb22dceb81a08f35a0ac4dd61`, verifies exact source JPEG and cutout PNG bytes against Work47 manifest; independently decodes both and requires **every RGB pixel from the cutout equal to the original JPEG** before attempting a mask change. It cannot accidentally approve altered source colors.

## New research candidate (not approved)

Instead of pretending to reconstruct an unphotographed back or recoloring the V-neck, propose **ALPHA-ONLY removal of a small set of warm, pale connected pixels at openings of the original top 23% garment region**. Requirements in new pure reproducible module:

1. Exact P93 source JPEG SHA and cutout PNG SHA (other photos, arbitrary owner garments or changed source are denied). Original 1920×2880 silhouette must contain real garment alpha and source top/bottom; these define the localized upper garment window, rather than a manually painted fake boundary.
2. Candidate pixels must retain measured warm pale source color signatures (red ≥90, green ≥75, blue ≥60, R−G ≥4, G−B ≥3, channel sum ≥280). Eight-connected color component must have ≥25 original-source pixels and be within 17 px of an actually transparent cutout pixel (likely neckline/arm opening). **This color heuristic is NOT a general garment/mannequin segmentation model.** It can create speckled edges or remove valid warm-colored garment. Do not approve automatically.
3. Only proposed alpha may DECREASE to transparent at those qualifying source positions; **every R/G/B byte must remain EXACTLY original, no alpha increase, no change outside upper 23%, no removal of dark source pixels or white-neutral badge/piping pixels**, and the removed alpha must be below 2.5% of original visible garment area. If genuine source witnesses missing or a mass deletion occurs, fail closed.
4. Produce true before/after visual evidence: original licensed JPEG, baseline original-RGB PNG, alpha-only proposed PNG, overview photo contact sheet and enlarged neckline/shoulder original/baseline/proposal contact sheet, and numeric audit with all source hashes, alpha-pixel change counts, preserved bright piping, false "complete mannequin removal" flag and `humanCutoutAcceptance:'UNREVIEWED'`. This shows what changed; it does **not** certify visual quality or real 3D improvements.

The prior local exploratory prototype on the actual pinned public cutout identified about **12,959 candidate alpha pixels** in the neckline/shoulder top window, with zero original source RGB edits and an obvious visibly incomplete warm fringe in the close-up. These are **pre-CI exploration numbers**, NOT accepted/committed final model measurements. The alpha proposal is intentionally conservative and likely needs source-sensitive refinement/human rejection before future rendering. Its partial cleanup can look worse than the original in some zoomed edge areas; do not automatically adopt.

## Verification

New isolated push-only no-deploy workflow has two jobs: full inherited Node suite/consumer build/source diff, and separate genuine licensed Work47 source rebuild + SHA-locked alpha-only proposal + human-inspection artifact. Six adversarial pure tests cover original source byte/RGB invariants, white logo/piping retention, ROI/silhouette, absent or fake source SHA, forged palette override, impossible alpha source, mass/no-op cleanup, and deterministic byte output.

**New exact-head CI PENDING** until actual run completes; source-derived before/after imagery is required evidence for any change claim. P92 prior human A/B packets remain UNREVIEWED and PR #1165 unmodified. If proposal loses legitimate logos/piping or increases artifacting, reject; do not weaken gates or claim photorealism.

## Remaining release blockers

One photographed front source, no approved mask contour, no true side/rear original, no independently rated source-faithful 3D material, no cloth simulation, no general garment segmentation/reconstruction, no footwear, no layered private owner photo to skinned 3D route or true physical Android/iPhone acceptance. Existing P91 3D real source geometry/drape passing proof is **not re-credited** as mask improvement; P93 does NOT alter that source geometry or re-render it from the new mask without new authentic 3D CI/human approval. Original alpha/cutout and source-JPEG 2D fallback remain intact.

Tracking [master #1054](https://github.com/nickhaney916-lang/Closet-Current/issues/1054), [Mission 2 #1124](https://github.com/nickhaney916-lang/Closet-Current/issues/1124), [Family Alpha #255](https://github.com/nickhaney916-lang/Closet-Current/issues/255). **DRAFT only, no merge/deploy. Family Alpha #255 OPEN/HOLD.**
