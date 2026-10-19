# Real second-model class cutouts — verified research outcome

The additional independently pinned 20-class MIT LIP human parser ran
successfully on SHA-256-locked source photographs in GitHub Actions.
It produced actual per-class source-RGB mask previews; these are not
approved garment instances and are not passed into the customer app.

**Worn layered outfit (`validation-0031`)**
- Coat/outerwear: 17,044 coarse model pixels.
- Skirt: 3,751 model pixels.
- Shoes: 2,681 combined left/right model pixels.
- Dress: 513 model pixels (below the conservative substantial-region level).
- Person/body evidence is present.
- VISUAL QA: blazer is partially retained, but coat class includes visible
  brown inner clothing and some dark skirt fragments; skirt misses most
  material, and shoe masks omit straps/soles. Distinct model classes are an
  improvement over a *single composite dress label*, but **not** production
  quality and not a precision/recall score.

**Flat-laid dress + jacket (`commons-0059`)**
- The same human-parsing model output **zero clothing-class candidate pixels**.
- VISUAL QA: the original source clearly depicts clothing, so this is a
  failed model-context transfer. It must NEVER be treated as an empty closet,
  a reason to discard originals, or evidence that clothing is absent.
- This parser is unsuitable as a universal replacement for product/flat-lay
  photos and should remain secondary, **on-person context-specific review**.

A new explicit review disposition differentiates an absent class map, missing
wearer context, and on-person separate-class evidence. This is for the offline
research report only. All original photos, actual user categorization paths,
app clipping, cloud storage, production branches and Drive Duel are unchanged.

Next research target: genuine clothing-instance segmentation on worn garments
with annotated independent outlines; source RGB preserved for recognition,
segmentation accepted only after pixel-level and mobile testing.
