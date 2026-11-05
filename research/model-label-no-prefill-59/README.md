# MODEL-LABEL-NO-PREFILL-59 — review accuracy and owner field authority

**Research only / Family Alpha #255 HOLD / no merge or deploy.** Exact base: BOUNDS58 verified commit `3f0bb1b5fb0ccc90ad8f74c024dfbab8ea889d36` ([no-deploy Actions #42048436912 SUCCESS](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42048436912), 635 Node, 18 real native Chromium/WebKit browser cases).

## Problem

`sceneReviewDefaults32` previously allowed a SegFormer category and RGB-derived pixel color to prefill the authoritative user's category and color fields when `personDetected===true`, the segmentation region was unclipped, had one candidate category, and reported uncalibrated `confidence>=0.95`. This was never an independently calibrated category/color correctness probability, and genuine research SegFormer PR #612 obtained **22.2% precision / 41.7% recall** on a small, single-annotator box benchmark. Parallel #36 instance segmentation PR #615 also reported weak pilot performance and unresolved model/data licensing; that separate model is not integrated.

The prefill did **not** auto-save because the human checkbox, subtype and crop remained mandatory. But humans could accept a misleading default value on a small phone. This priority removes that source of review bias; it **does not** improve model accuracy.

## Mitigation

- All SegFormer model regions, even `score=1` with claimed `personDetected=true`, always start with `category:'Uncategorized'`, `itemType:'Unknown'` and `color:''`. Only a person choosing a real taxonomy category, valid subtype, visual color and confirming the actual crop can authorize the final save.
- A small, explicit read-only `Unverified detector hint` note displays allowlisted candidate category/color information so the AI is still useful without being treated as established fact. The hint is never copied to owner fields and is cleared from display when the crop editor changes the crop.
- Original photo bytes/SHA, source identity, owner private IndexedDB, atomic source+crop reviewed save, duplicate rejection, Outfit Builder, three real owned garments and V4 backup/restore stay unchanged.
- Five adversarial Node tests cover each category family, false person flags, score 1, alternative scores, invalid/ambiguous model families, separate category/subtype/color confirmation and hint display safety.
- In 12 genuine browser UI workflows using **synthetic model responses only**, verify even an untrusted strong detector cannot preselect category or color, the unverified hint is visible before crop, and the owner completes real crop editor/category/type/color, atomic saved private closet, outfit, duplicate, V4 restore and owner-B isolation. Six prior manual workflows also run.

## Accuracy, licensing and release limitations

No genuine SegFormer inference or improvement to category/subtype/color numerical correctness is claimed for these synthetic-worker tests. Historical scientific model acceptance remains **NEEDS REWORK** (SegFormer PR #612; instance pilot PR #615). The model weights and licensing are unchanged. Browsers are simulated mobile-width 320/390/430 Chromium/WebKit, not physical phones. Engineering pass requires exact-head successful dedicated no-deploy CI; no production or staging changes or merges are authorized.
