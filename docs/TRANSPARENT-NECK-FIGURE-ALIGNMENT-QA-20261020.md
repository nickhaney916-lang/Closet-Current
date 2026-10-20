# Source-first figure alignment — transparent mannequin contamination veto

20 October 2026. Stacks solely on draft customer preview PR #81. Does not edit the separately owned first/second human-mask review PR #76 or the production main branch.

## Actual code safety gap identified

`public/reusable-figure-preview.js` already calls `ClosetGarmentWarp.hasAmbiguousNeck` for a plain-white-matte extraction. But when an imported image already has true transparency, the local fitting renderer previously assumed the alpha channel represented **only garment fabric**, and immediately trimmed and warped it. Real source-risk inventory case `commons-0053` explicitly warns about an attached pale mannequin neck. A potentially high-quality **transparent background does not guarantee the foreground excludes mannequin pieces**. This is source evidence of a risk, not proof that the sample had an approved alpha mask.

A false mannequin/garment composite is especially noticeable when pasted over either the female or male fixed figure. Retained source photo pixels may be accurate, yet the cutout can be semantically wrong.

## Safe change

- Added `public/local-transparent-foreground-safety.js`: operates only on **already-transparent local display pixels** for Tops, Dresses, Outerwear. It examines the top 12% versus the 22–40% garment silhouette band. The hold requires a persistent **narrow centered opaque upper protrusion**, a substantially wider connected garment body below, **pale neutral upper pixels** and an independently contrasting fabric-color body. It does not try to remove a neck, reconstruct a collar, estimate pose or claim fit.
- Added one fail-closed inspection before existing trimming, permitted display-only warp and placement. Suspected neck/hanger cases show the existing **photo still saved + recapture** guidance, and do not display the contaminated cutout on either figure.
- Valid matching-color collars, split V-neckline shoulders, opaque unapproved photographs, shoes and bottoms keep their previous behavior. Original RGB recognition and indexing, retained high-res photos, original alpha bytes, customer ownership and preview cache remain unchanged.
- A correct-looking flat object with no narrow pale upper section still uses the improved 600K/1M high-DPI path from PR #81.
- This is a **risk heuristic** with likely false negatives and possible false-positive holds; it is not a mannequin/person segmentation model or independent mask truth.

## Verification

`tests/local-transparent-foreground-safety.test.cjs`: synthetic alpha silhouettes with pale mannequin appendage over different colored garments (hold across Tops/Dresses/Outerwear), normal collars, neutral fabric, V-shaped neckline, shoes/bottoms and corrupt images. All inputs remain byte-identical.

`scripts/test-transparent-neck-figure-browsers.mjs`: real rendered web UI in mobile Chromium and WebKit, both original fixed figures; detect and **withhold** an artificial alpha garment with attached neck; show a clean matched cutout on each; validate saved original identity unchanged, local user review guidance and zero provider POSTs.

Existing `scripts/test-reusable-figure-phone-browsers.mjs` reruns actual licensed `commons-0053`, `commons-0002` and `commons-0003` SHA-locked source-photo simulations, and **requires all three remain held**, with no imaginary auto accepted cutouts. Existing 1×/3× pixel-detail and Android/iPhone owned-outfit/browser tests run too.

The locked 12-photo source-risk manifest has **0 independently first+second human-approved full masks**. The sole responsible evidence claim here is that no extra unsafe cutout passes this known real-photo hold lane; there is **no measured model accuracy**, physical-phone color/edge/fit QA, commercial figure master rights approval or realistic on-body drape proof.

## Completion gate and next human task

Final exact-head GitHub Actions must be SUCCESS before the branch can be considered technically verified. Authenticated first- and second-human reviewers still must draw and approve each original photo's full native pixel garment mask **independently** to enable reliable intersection-over-union, edge accuracy, and fitting-quality comparisons. Use the existing private reviewer UI in PR #76 (and ensure separate branch merge is reconciled before release); never fabricate those annotations. A real physical Android and iPhone walkthrough is documented in `docs/PHYSICAL-PHONE-CAMERA-FIT-PILOT-CHECKLIST-20261020.md`.

No deployment, merging, paid inference, customer photo transfers, public original uploads or Drive Duel modifications.
