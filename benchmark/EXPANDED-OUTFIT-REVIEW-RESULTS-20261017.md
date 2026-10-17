# Expanded outfit benchmark: first visual review (October 17, 2026)

Experimental CI https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39053340948 **passed 17 deterministic tests and generated comparisons for eight licensed real photographs.** This is not pixel accuracy.

## What the original / BiRefNet object / SegFormer-guided hybrid panels show
- Oversized shirt (commons-0001): object cutout preserves fabric better; semantic-guided hybrid destroys large printed shirt areas and creates major holes. There are additional unverified semantic class detections.
- Long-sleeve worn on mannequin with jeans (commons-0003): hybrid can remove jeans, while the object-only image includes them. Extra 'pants' detection is present. Neither is automatically approved.
- Skirt A (commons-0041): hybrid breaks off large panels of the skirt; object-only preserves it much more faithfully.
- Skirt B (commons-0043): hybrid deletes a large central section; object-only is less destructive.
- Jacket A (commons-0060): hybrid appears to exclude underlying mannequin garments, but fine edges require review.
- Jacket B (commons-0062): hybrid fragments the outerwear; object-only preserves its whole outline.
- Dress with jacket (commons-0059): semantic model detects the dress but **misses the jacket**; cannot automatically create two entries.
- Worn blouse with headwrap (validation-0008): guided cutout excludes most face/body but retains parts of the headwrap. Not clean enough for automatic use.

These are manually inspected side-by-side visual impressions; no independently approved source-aligned pixel labels exist.

## Safety response

`benchmark/multilayer-review-safety.mjs` explicitly compares **known benchmark expected pieces** with segmentation-detected regions. Unexpected detections and missed expected items are reported; expected labels are never treated as evidence that the product itself can categorize garments. Standalone item images may select an object-only **review preview**, while person-worn single garments may select a hybrid **review preview** only if their region is plausible. Ambiguous multi-items and garments sharing the same broad semantic class fall back to the preserved original.

No automatic wardrobe entry, model switch, production deployment, privacy/storage changes, or Drive Duel modifications occur here.

## Next engineering requirement

A finer garment/instance segmentation model for layered tops/jackets and shorts/pants; independent native-resolution boundary masks; conservative discrimination of stands, hangers, people, tags and headwear; real phone speed/memory/camera tests. Prioritize not damaging original high-resolution fabric details.
