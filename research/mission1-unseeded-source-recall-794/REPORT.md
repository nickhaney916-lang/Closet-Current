# Closet Current Mission 1 — P794 actual-model missed-garment unseeded proposals, complete source scoring

**Family Alpha HOLD #255. DRAFT / UNMERGED / UNDEPLOYED.** P794 stacks on exact independently verified P793 HEAD `5a653280421e515bda5536cb3835a79d01a4616f`. It evaluates actual frozen model output without changing the model, production recognition worker, owner accounts, camera, closet storage, native app, hosted cloud, source photographs or training weights.

## Problem and scientifically conservative solution

The genuine P792 research corpus has **10 exact SHA-pinned publisher-original photographs containing 23 true publisher garment polygon instances**. The frozen `Xenova/segformer_b0_clothes` model with existing optional boundary-growth proposal still missed 15 of 23 instances in both actual browsers; whole-source scene accuracy was below acceptable product readiness. Existing P767 boundary growth can expand only **already detected** garment seeds. When model probabilities favor a garment class in rejected source pixels but the main grouping contains NO seed, those omitted areas are not even offered for visual review.

The existing, previously fixed P773 `unseededGarmentReview773` research-only algorithm proposes **up to eight source-logit-supported disconnected, currently unclassified garment islands**, only where the original 18-class frozen model softmax and margin support a garment family. It protects other classes and all existing proposal masks, never invents hidden pixels, excludes islands touching same-family existing masks, and keeps every candidate `needsReview:true`, `accepted:false`, `autoIndex:false`, `subtype:'Unknown'`, `primaryColor:'Unknown'`. Critically, adding uncertain proposals is **NOT** evidence that any predicted garment is genuine; additional false positives can make recall gains worthless.

## Exact P794 implemented experiment

The existing P792 genuine browser worker harness is instrumented **only in memory** to invoke the unchanged P773 source-unseeded review function on the actual SegFormer logits and the existing P767 grown seed masks. It retains four score arms on each **unchanged photo/model output**:
1. Unmodified original SegFormer mask groups.
2. Existing seed-boundary-growth research candidates.
3. New unseeded-only review candidates.
4. Seed-growth PLUS unseeded candidates, with every predicted original/model raster mask evaluated against each published garment instance.

All four arms retain every publisher polygon, every false detection and every missed garment. Model-raster same-broad-semantic-family **one-to-one mask IoU≥0.50** scoring is the registered scientific diagnostic, not official Fashionpedia mAP, exact app subtype/primary color, owner approval, original full-resolution mask AP or external two-blind-human truth. Group IDs, count bounds (max 8 new islands/photo), original mask pixel SHA, nonoverlap, no owner review, no accepted state, no auto-index and unchanged source are verified; accumulated JSON includes per-photo matched/lost IDs and all new sources. The score is reported even if unseeded candidates worsen results.

The actual frozen source model, original original-JPEG SHA, publisher annotation SHA, all ten pre-exposed model-development photos, existing immutable training weights and source-selection methodology stay unchanged. No post-inference source filtering, threshold calibration, photo-specific rescue/owner fabrication, model promotion, source class replacement or shipping app integration occurs.

## Mandatory gates

Dedicated no-deploy GitHub Actions `.github/workflows/mission1-unseeded-source-recall-794-no-deploy.yml` must verify direct P793 ancestor; **only four research/test/CI paths**; complete Node app/recognition/private-storage/3D regressions plus actual 10-photo source/publisher polygon inference in genuine Chromium and WebKit; match all 23 polygon instances and preserve all misses/false positives. The 83-source P793 historical photo exposure firewall remains untouched; the 10-photo P792 research cohort is now DEVELOPMENT-EXPOSED, not independent untouched final acceptance. No external photo bytes/model weights are attached to artifacts.

**No entire Mission 1 release approval**: independent rights-cleared and truly training-disjoint new source photographs, two genuine separate independently blinded humans drawing garment masks and labeling subtype/color, much higher actual detection/instance segmentation accuracy, real two-account signed hosted-cloud privacy and physical Android Chrome/iOS Safari evidence, and owner acceptance remain absent. Family Alpha HOLD #255 is binding.

## Actual negative/positive measured finding

To be recorded only from the final exact-head real GitHub Actions run. Passing engineering CI is not an accuracy success.
