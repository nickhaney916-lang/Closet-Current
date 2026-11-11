# Mission 1 P813 — no silent drop of multi-garment source-region proposals

**FAMILY ALPHA HOLD #255; DRAFT, UNMERGED, UNDEPLOYED.** Branch directly based on exact verified P812 HEAD `c62324f348475f1f99c4ee021aa2764c62e0a3a6`. No production/staging deployments, model training, cloud, private owner data, hosted services, licensing policy or new original-source datasets.

## Actual discovered integrity defect

The existing SegFormer-to-multi-garment group parser `visibleGarmentGroups24(map,{limit:12})` correctly extracts disconnected visible same-category model regions and pairs adjacent footwear. However, after computing and sorting **all** visible source proposal masks, it performed `result.slice(0, limit)`. If the model produced 13+ viable regions, it returned 12 **without any overflow warning**. The outfit worker then posted `done,count:12`, indistinguishable from an actually complete 12-region result. This may silently omit clothes from a photo-review workflow. The 12 proposal count never proves the number of physical garments; missing model detections remain possible below the limit.

## Fix, tests and source fidelity

The pure model proposal parser now checks `limit` is an integer in [1,24]. After all eligible connected components and conservative anatomical shoe pairing, it **throws a tagged fail-closed `MULTI24_REVIEW_OVERFLOW` RangeError** if the model has more than that many reviewable source proposals. It never truncates, alters pixels, merges disconnected tops, assigns model output as verified category/type/color, or saves any garment. The original per-component source-pixel selected masks, exact source rectangles, source photo unchanged and human review remain intact.

The actual `public/outfit-worker.mjs` already runs full grouping **before** it begins emitting pieces. It now recognizes this error and returns an explicit actionable message: over-limit source regions are not imported; photograph fewer pieces together. No arbitrary threshold is called a real garment truth and no model quality is misrepresented.

Tests verify: 13 disjoint same-class model regions fail the default limit before any piece is produced; explicit limit 24 preserves all 13 exact non-overlapping 64-pixel component masks with unique instance keys; 25 disjoint components fail the hard 24 cap; invalid limits rejected; and a VM-executed real worker `multi24:true` emits **zero pieces, zero done** on 13 proposals and one clear user-facing error. Existing full-outfit 3-piece/paired-shoes tests and all app tests must still pass.

Dedicated NO DEPLOY Actions verifies exact P812 source baseline and only six changed allowlisted branch files; full Node/native build and existing app regression plus independent separated multi-piece tests. **Do not claim green until final HEAD CI passes.**

## Hard acceptance boundaries

This closes a **silent-truncation bug**, not weak semantic-model recall. The already-exposed ten-photo P792 original-image development evaluation only found 8 of 23 publisher garments at fixed source-mask IoU≥.50; it still fails real automatic recognition acceptance. Actual independent novel rights-cleared human photo mask/category/type/color truth, complete per-source model recall, physical Safari/Android inference with bounded memory, independently vetted licensing, real hosted signed owner privacy and owner release approval **remain unverified**. No human labels were simulated to fill this gap.
