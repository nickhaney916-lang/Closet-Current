# Closet Current 3D-04 — Long sleeves, source-colored panels, neckline, and garment-region mapping (HOLD)

The owner explicitly prioritized a useful 3D avatar over more time polishing 2D. This is the next real 3D appearance improvement, built from exact green [3D-03 PR #393](https://github.com/nickhaney916-lang/Closet-Current/pull/393) at `196a9876d005f2e05dce62f2c351357103dd0ea5`.

## What the actual 3D-03 screenshot showed

The photograph `commons-0003` is a black Armani Jeans long-sleeved shirt with white AJ logo. Its actual rendered version still had **short black sleeves ending above the elbows**, completely exposed gray forearms, sleeve copies of the chest source texture and a broad cylindrical collar. The actual 3D-03 CI screenshot, not a synthetic imagined result, motivated this issue. The licensed dress also reused the same entire photo for its bodice and skirt, potentially repeating the upper-dress fabric/print lower down.

## Implemented in the experimental real WebGL app

- `buildAvatarScene({type:'shirt',sleeveLength:'long'})` creates four circumferential sleeve rings reaching down near the wrists of the reusable figure while retaining a separate short sleeve variant (no universal guesses that all shirts are long).
- The particular existing licensed `commons-0003` is visibly long-sleeved, so the protected **research-only licensed preview** explicitly chooses `long`. Only the reviewed photographic chest/torso mesh has `photographed=true`. Sleeve meshes use the **actual source pixel median** from 3D-03 but do not duplicate or wrap the chest print.
- The shirt and dress bodices have a new shoulder-to-neck opening with a narrow upper ring, rather than a broad level cylindrical collar rim. No generated skin or fabricated user-specific body measurement.
- The dress shares the *same source-verified image*, but the upper bodice maps approximately the top 49% of the alpha-bounded photo and the lower skirt maps the bottom 61%, with an intentional 10% waist overlap. Two distinct regions, not two copies of the whole source picture. Sleeve pieces still use source-derived median plain material until actual sleeve-region cutouts are approved.
- The shader fades the printed photo near the side seam instead of wrapping stretched logo pixels around the back; the remainder uses source-matched neutral fabric. The unverified back remains approximate. Original RGB, alpha, JPEGs, original Work47 reviewed mask and 3D02 approval gates remain completely untouched.

## Validation

Dedicated strict no-deploy source allowlist and tests check meaningful 3D depth, long vs short sleeve geometry bounds, separate photograph-vs-plain-material flags, source median on sleeves, single photographed shirt torso, dress upper/lower separate UV, exact hash/review/privacy/fallback, **real WebGL2 browser** across 320/390/430, actual black fabric and photographed white logo, and screenshot output for owner judgment. CI screenshots labelled HOLD, not a human PASS.

Important limitations: these sleeves remain rounded tubes, the 3D mesh and body are schematic, exact fabric folds/fit/back/side patterns cannot be inferred from one photograph, and the dress split is a heuristic. Further sleeve width, garment-body contact, true shoulder/neckline fit, torso print warping and human licensed-photo visual grades remain unresolved. Prior independent human 15-photo baseline is **0 PASS / 5 REVIEW / 10 FAIL**, not promoted by automated success. Work #53 fine isolation and Work #55 acceptance are not modified.

Production and staging not changed. No merging, deployment, real person/account photos, backup/auth updates, paid APIs, model download, or Drive Duel changes. Four-person Family Alpha still HOLD until real account separation, write/restore, on-device QA and explicit go/no-go.
