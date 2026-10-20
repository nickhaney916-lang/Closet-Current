# Closet Current — Real 3D derived-neutral sleeve cuts

October 19, 2026. Main Closet Current coordination chat; stacked on [PR #56](https://github.com/nickhaney916-lang/Closet-Current/pull/56). Draft only. The completed original CC0 MakeHuman + Blender 4.3.0 native adult figure workflow remains the base.

## Core art problem

Both figures previously wore a neutral base shirt cut from selected human-body mesh faces. The sleeve ends stopped along arbitrary polygon faces, leaving sawtooth/scalloped sleeve hems even when the lower shirt and upper-front edge were smoothed. A thin painted-looking binding was insufficient. This branch creates **new actual topology** where a plain short sleeve meets the arm: each original adult arm is located from the existing pinned rig's shoulder and elbow joints, and the separately derived *clothing shell* is clipped to a predictable 76% shoulder–elbow position.

## What changes and what does not

- `cut_source_derived_sleeves` performs a deterministic polygon/mesh clipping pass on the **derived neutral shirt shell only**. It intersects existing sleeve faces with the measured shoulder/elbow axis, shares new edge vertices across neighboring polygon faces, and produces a true new cuff boundary on *both* arms rather than painted or rasterized false hem lines.
- Each mesh's original pre-clipping vertices are byte-equivalent in coordinate space and **remain unchanged**. The source MakeHuman body, mesh license, user/customer input photos, recognition/indexing before clipping, face/skin/hair, pose joints and persistent closet data are unmodified. Clipping can remove derived sleeve material beyond the short sleeve boundary; it never guesses or adds missing fabric.
- A subdued thin 3D seam follows **only the newly formed boundary edges**, not unverified gaps at the shoulders, neck or hands. Safety gates reject missing arms, invalid arm signs, no geometric intersections, incorrect scene evidence or unexpected source vertex changes.
- Figure processing retains the previous true native 1941×3597 renders, editable .blend files, 1294×2398/970×1798 variants and new lossless 647×1199 phone + 1294×2398 tablet responsive WebP tiers. New tiers undergo pixel-exact visible RGB and alpha validation. DPR/zoom test picks the smallest native resolution meeting the configured view and does not stretch undersized assets.
- Python synthetic tests exercise two arm sections and reject mismatched/invalid rig references; native Blender scene records actual bilateral new mesh vertices/segments and source preservation. GitHub workflow rerenders two adults and checks existing full Node regressions, original-photo protections, offline source/license provenance and 24 Chromium/WebKit figure-display scenarios.

## Visual and product acceptance

The target is more intentional T-shirt sleeve edges. A passing topological cut **does not guarantee** realistic fabric drape, proper garment grading, natural shoulder seams or visually good result. Compare actual PR #56 and resulting before/after renders and keep any failed visuals in draft; do not automatically replace in-app figures.

**No commercial art approval** (still 0/2), no independent full-real-photo garment mask acceptance, no actual hardware performance validation or claim to match or beat paid commercial virtual try-on. Both original production figures remain their older low-resolution placeholders until the complete high-resolution new-art pipeline is approved and deployed separately.

No merge, deploy, paid model activation, purchased source assets, customer photo uploads or changes to Drive Duel.

## Reviewed initial visual output and material follow-up

The first new native renders showed much cleaner short-sleeve endings for both figures, **but gray jagged patches remained on the exposed forearms**. These are a real visual defect and were not ignored just because the native mesh tests passed. Follow-up changes classify clothing versus skin on the existing original body mesh using pinned MakeHuman arm/leg rig-weight evidence rather than position alone; a forearm at the same vertical height as trousers must be skin, not mistakenly assigned neutral trouser cloth. This changes only derived figure presentation *materials* and no original source body geometry. Rebuild and inspect both characters; the first render is not the final proof.

The qualified prototype will remain unapproved if residual arm patches or the neckline still look wrong. Camera/indexing/source-privacy and pixel-lossless responsive WebP delivery gates remain mandatory.

## Required staged fix after visual regression

The first distal-rig material attempt incorrectly applied arm skin **before** generating the neutral shirt shell. Because that shell is selected from the original gray body material faces, both characters lost their sleeves and developed a tank-top outline. This candidate was **visually rejected** despite its software tests passing. The final staged workflow now:

1. Reproduce the original body gray clothing-face selection exactly, preserving shoulder/sleeve source polygons.
2. Copy those original faces to the **separate derived neutral shirt shell**.
3. Reassign only genuine exposed distal original-body forearm faces, **below the newly calculated 76% shoulder–elbow cuff**, to skin using the pinned rig weights. Leave shoulders, upper arms and the derived shirt's own materials intact.
4. Rebuild both full-resolution figures. Inspect the native output and reject again if jagged gray forearms or missing upper sleeves remain.

New regression tests explicitly forbid restoring proximal upperarm fabric to skin, and the scene packet must record `clothFacesSelectedBeforeBodyMaterialRepair:true`, `onlyDistalRigApprovedSkin:true`, plus actual restored regions. These safeguard source appearance, not a real-world anatomical or photorealism approval.
