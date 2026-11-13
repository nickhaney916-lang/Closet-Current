# Mission 1 P864 — Protect accepted original JPEGs from automated photo-discard heuristics (HOLD)

**Family Alpha HOLD #255 OPEN. Isolated DRAFT / UNMERGED / UNDEPLOYED.**

## Verified immutable source and unexpected integration gap
Mission 1 parent: [P863 draft PR #1024](https://github.com/nickhaney916-lang/Closet-Current/pull/1024) immutable `312b1c7545e201d831db8fa654a120005c280974`, [NO DEPLOY #43483870746](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43483870746) 2/2 SUCCESS, 556/556 native. Research donor/known-good patch: Mission 3 [PR #1006](https://github.com/nickhaney916-lang/Closet-Current/pull/1006), immutable `aed074ba2f8a0d4713bb5a208d1722350fae5f38` with [NO DEPLOY #43445744410](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43445744410) 2/2 SUCCESS. **Donor branch is independent** and is not modified or merged; its photo-preservation reasoning and passing tests inspired this narrow Mission 1 port. Coordination with newly created #82 actual dual-model camera integration remains necessary.

Source inspection of the **actual P863 Mission 1 camera scanner** found it still directly ran `batch=batch.filter(x=>x.id!==item.id)` for `checkPhoto().blank` or an exact source match discovered while scanning. The filtered draft was then snapshotted by `persistDraft()` in `finally`. A nearly uniform dark or light garment can be a real original; a duplicate byte match is not evidence of ownership identity or consent to delete a pending photograph. Thus this was a real potential data-loss path, even though Mission 3 had already independently fixed it on its own branch.

## Source-level P864 fix
- Blank/featureless photographs including those with optional capture guidance: mark pending row analyzed/owner-confirmation-required; show “Original photo kept”; no AI model request, no automatic delete.
- Exact identical source detected **after** accepting the capture: keep the pending original, annotate possible duplicate, require owner confirmation, and never auto-merge physical garments. Other saved garments remain.
- Keep original JPEG string, original SHA receipts/crop/mask, same-owner scanner/source leases, private record, optional quality guidance and manual Remove control unchanged.
- This intentionally does NOT change pre-acceptance duplicate rejection in `candidate()`, existing capture rules, photo-quality heuristics, segmentation, weights, taxonomy, or cloud/wardrobe schema.
- Change only `public/app.js`, the legacy source-executed indexing regression fixture that previously demanded automatic loss, P864 isolated source evidence tests, this report and a pinned-parent NO DEPLOY workflow. No donor branch edits and no live owner photos.

## Evidence honesty, known blockers and release
This protects owner-original retention; **does not increase actual clothing subtype recognition accuracy or prove mobile accepted use**. No new independently reviewed source-disjoint 60+ lawful real photos, no 10/10. Existing real 32-photo legacy regression remains **RED: 10 assertions across 5 boot Unknown photos**; do not erase, waive or mislabel them. #81 remains research-only; #82 owns actual dual-model opt-in camera integration. Protected private signed-owner durable status CAS, production/staging/cloud, physical Android/iPhone, zero-photo-loss on *every* possible crash and full Mission3 branch integration are still blocked by independent verification. Main Mission 1/P851 release stays BLOCKED, owner HOLD stays open.

## CI
Record exact-head no-deploy verification only after GitHub Actions completion.
