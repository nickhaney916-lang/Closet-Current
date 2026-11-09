# Recognition learning review — November 9, 2026

Reviewed main `8f1e0263a275a16a19051ba0852b64fc4999f6bd`, including the November 9 fashion-data refresh. Validated candidate: `bea6e726048fe33492915f3708afa820db331500`. This maintenance change preserves the newer trend work and does not integrate or overwrite separate 3D/Family Alpha draft branches.

## Evidence-supported correction

An existing suggestion in the garment editor could still fill pattern/sleeve/type fields after the user changed its category, subtype, original recognition source, mask, or recognition result. Copying or serializing the suggestion could also apply it to a different item. Weekly suggestions bypassed the October 26 known-subtype check.

`public/clothing-memory.js` now retains an ephemeral WeakMap review context for suggestions produced by `suggest` or `weekly`. Applying a suggestion requires the same query object, ID, displayed and recognition photos, category/subtype, recognition-memory object and mask snapshot. Changed inputs return the current item without filling fields. Serialized proposals must be regenerated through the current guarded review generator. Weekly suggestions that contradict a known category/subtype are withheld.

The context is not serialized, written to IndexedDB/cloud, logged or transmitted. Stored weekly proposal records remain usable through `weekly`, which returns a fresh review context. Human acceptance remains required. Reference eligibility still requires user-confirmed examples from the caller's account-local wardrobe, two distinct agreeing item/photo references, compatible model and similarity >=0.9. Color, brand, size and material are never copied from references. Unconfirmed model proposals never become reference labels automatically.

## Tests and actual browser evidence

- Existing baseline: **253/253** Node tests passed.
- Eight added adversarial cases all failed before the repair; after it **261/261** Node tests and **22/22** focused memory tests pass, zero failures/skips.
- [Candidate Node Actions](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42658059901): success.
- [Candidate browser/backup Actions](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42658059954): success. Two new real Chromium editor flows change subtype to T-shirt or category to Dresses, click the old suggestion button, verify no Polo/Striped contamination, cancel and verify the saved record stayed unchanged. Reopening and applying a fresh valid suggestion still works.
- The same browser run verifies confirmed-example learning, own-photo color, original/crop restoration, automatic outfit saving, independent browser recovery, offline retry, manual corrections and synthetic owner isolation. `staleSuggestionsPreserveCorrections:true`, zero page errors. This uses licensed/synthetic fixtures and controlled HTTP transport; it is not a new hosted account/RLS or physical-phone certification.
- The backup workflow permits the isolated validation branch so these checks run before any main update. Main deployment jobs do not run on that branch.

## Real-photo baseline comparison

[Candidate actual FashionCLIP browser benchmark](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42658059795): success on all **59 locked licensed fixtures**, with hash verification and all per-photo regression gates. Compare with the committed [October 26 baseline](recognition-learning-review-20261026.json), rather than the superseded October 14 automatic-outfit report.

| Frozen cohort | Prior category matches | Candidate category matches | Prior/candidate exact subtype matches |
| --- | ---: | ---: | ---: |
| Reviewed 32 | 32/32 | 32/32 | 23/32 |
| Holdout clothing | 8/13 | 8/13 | 4/13 |
| Fresh regression 11 | 11/11 | 11/11 | 6/11 |
| Negative controls | 3/3 rejected | 3/3 rejected | Not applicable |

All evaluation objects and per-photo prediction, strong/review flag, reason, detail and color outputs are identical. Category matches include review-only results: 31/32, 7/13 and 9/11 garments respectively receive strong model outputs. These numbers do not establish accurate color or universal recognition. Real-feature confirmed-example retrieval still generates **zero qualifying proposals** on all three sets. This is a stale-review safety repair, **not a measured classification improvement or neural self-training**.

Both main jobs left pending in the October 26 notification subsequently passed: [real-photo benchmark](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40352680122) and [private backup/recovery](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40352680040). Latest main Node, camera/mobile, WebKit, private-backup and Cloudflare checks were green when audited. The [November 9 nightly run](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42589637745) passed twice with 14/14 categories per selected mobile-emulation attempt; it does not replace the broader 59-photo benchmark.

## Newer research and unresolved quality

Read the actual [P86 research report](https://github.com/nickhaney916-lang/Closet-Current/blob/51aeeacdff675175f89a17dd64c1281e0aa7cee8/research/real-photo-recognition-accuracy-86/REPORT.md) in draft PR #642. Its separately validated original-photo model execution also reported **8/13 categories, 4/13 exact subtypes and 3/3 negatives rejected**. Its scientific verdict remains **NEEDS REWORK**: the 59 legacy annotations are provisional, with **zero independent source-bound adjudications**, no adjudicated primary/secondary color labels and no independent instance masks. Its three-photo SegFormer diagnostic has false proposals and missed regions; coarse box matching is not pixel-mask IoU or unseen instance accuracy. No research assets or model thresholds were promoted by this review.

Existing accepted subtype mismatches remain `commons-0064` Jacket→Blazer, `commons-0003` T-shirt→Sweatshirt, `commons-0014` Blouse→Tunic and `commons-0078` Sneakers→Ankle boots. Holdout abstentions remain `commons-0016`, `commons-0036`, `commons-0059`, `commons-0062`, `commons-0095`. Further class/color/crop changes need independent human labels and frozen, representative original phone-photo evaluation; do not loosen gates or change expected labels to manufacture gains.

Only the memory module changes customer runtime logic. Camera resolution, simplified interface, automatic cropping/saving, current manual corrections, per-account storage and account routing remain untouched. No private wardrobes, cloud configuration, email, paid services, other development branches or Drive Duel were accessed or changed. Family Alpha HOLD remains a separate release gate; this review does not declare release readiness. Main promotion must use an expected-SHA lease and retain intervening work.

Machine-readable evidence and all 59 compact results: [recognition-learning-review-20261109.json](recognition-learning-review-20261109.json).
