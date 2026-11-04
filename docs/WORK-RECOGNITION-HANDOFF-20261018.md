# Closet Current — Work recognition handoff (2026-10-18)

## Reason for closure
The separate ChatGPT Work conversation ran out of workspace. The ordinary
ChatGPT conversation is now the **single active development thread**. The
separate Work **chat tab must be closed or archived manually by the owner**;
no GitHub branch has been deleted and no unverified changes have been merged.

## Preserved isolated source checkpoint
- Repository: `nickhaney916-lang/Closet-Current`
- Integration branch / draft PR #7:
  `fix/photo-clarity-high-quality-downsampling-20261016`
- Preserved experimental Work branch:
  `work/garment-instance-recognition-20261018`
- Work base: `8053b9104980099f1904512286d81b041652e41f`
- Work tip: `ab2323f1d0dc4979cb33a1ffcfc26989065cf488`
- Ahead of base by **three commits** as verified from GitHub:
  1. `dca61010312749699fcd6ee3575513de74adfc34` —
     Expose instance proposal truncation and verify real-photo baseline preservation.
  2. `27ab7a0e39c7939789fa92412eb16321e3c3b8f7` —
     Retain supported LIP socks, pants and jumpsuit review masks.
  3. `ab2323f1d0dc4979cb33a1ffcfc26989065cf488` —
     Prevent periodic color-sample aliasing using original RGB.

The GitHub check API reported **two checks on the Work tip**, both successful
(`simulate`, `inference`). The Work checkpoint reports some additional
local focused tests and real source comparisons; do not substitute local
tests for PR-wide or human ground-truth accuracy.

## What the experimental changes do — and do not prove
- Decoder proposal cap changed from eight toward existing downstream twenty
  with explicit counts/truncation. In the pinned ten-photo suite it found
  **no new above-threshold garments** (34 proposals preserved).
- LIP exporter surfaces socks, pants and jumpsuit classes that had not
  previously been exported, with four-photo source-hash verification.
  Mask contamination persists around boot shafts, skin and layers; tights
  are not separately classed. No model instance precision was established.
- Original image color-sampling experiment retains model cell-center samples
  to eliminate periodic-fabric stride aliasing. It does not change original
  RGB, masks, clipping, customer account data or recognize additional
  physical garments. Some secondary shares changed; recognition accuracy
  remains unverified.
- **Zero independently approved whole-garment reference masks**. Do not
  claim a new accuracy percentage or automatic safety to deploy.

## Integration instructions for the single main conversation
Do **not** directly merge the isolated Work branch over later main development
changes. The integration branch progressed independently with customer UX,
outfit styling, original-photo review tools and cloud backup work. Reconcile
specific file edits against the current integration head, run complete app
and real licensed-photo benchmark CI, inspect mask/color failures, and only
then cherry-pick safe fixes one at a time. Changes to production remain
blocked until the owner explicitly authorizes them.

**Hard constraints:** Never modify Drive Duel, never incur paid service
costs without approval, preserve actual original high-resolution garment
RGB for classification/indexing, never treat synthetic accuracy or model
proposals as independent real-photo accuracy, and do not merge or deploy
the production branch without explicit owner approval.
