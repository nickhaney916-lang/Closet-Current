# Closet Current — 3D-23 physical dress neckline on verified real humanoids (HOLD)

**October 29, 2026 | Main project coordination thread, independent of Work Assignment #64 / PR #426.**

## Why this change

Actual 3D screenshots in the verified [Work61 PR #417](https://github.com/nickhaney916-lang/Closet-Current/pull/417) and [Work63 PR #423](https://github.com/nickhaney916-lang/Closet-Current/pull/423) show the original photographed AJ shirt is getting more work, but the **licensed `commons-0053` dress still fails human visual assessment**. It is a separate skinned A-line dress around the original CC0 adult male and female models, but its upper opening is an essentially **level top ring** with the photograph suggesting a neckline that the actual 3D cloth does not physically have.

Do not duplicate the parallel [Work64 PR #426](https://github.com/nickhaney916-lang/Closet-Current/pull/426) shirt neckline and source-photo seam changes. 3D-23 modifies **the dress only**, on exact original Work63 parent `926c85ebf9d2d29c919771f3dcd6c1527208b63c`.

## Actual implementation

- `research/three-d-23/dress-neckline.mjs` changes the **position buffer of the existing skinned dress's uppermost ring**, producing an anatomically smaller V-shaped upper front opening, retaining unchanged unphotographed rear. Maximum dip is **28 mm**, further limited by at least **16 mm** clearance above the penultimate ring, and fades smoothly toward lateral shoulders using a fifth-order cosine profile. This is an actual physical mesh boundary change, not a drawn-on neckline or screenshot retouch.
- Preserves every byte of original garment **JPEG, provisional transparent PNG, `dressRest` photograph mapping, UV, source RGB, SHA-256, original body GLBs, garment skin indices and skin weights, skeleton, triangle topology**. No created/removed mesh; Work61's existing 3 mm neutral dress-opening rims now follow the changed physical top geometry because the finish is run **after** the neckline deformation.
- A new `dressNeckline` flag is threaded through the existing source-bound `createOutfitController`, research showroom and review UI; `?dressNeckline=before` reproduces the exact prior Work63 dress shape for a matched camera comparison. Default is the research candidate.
- Only approved-kind **original existing provisional licensed dress** can enter the change. This is *not* a claim of human approval: shader source photo, body mesh, arms and inferred rear remain exactly as before; a physical V at the collar does **not** solve armholes, true V-neck sewing, source-image baked folds, skirt drape or cloth-body collision. Preserve Work64 shirt, Work53 cutouts and Work55 visual QA independently.

## Reproduce the real garment / model QA

```sh
npm install --no-save --no-package-lock --no-audit --no-fund sharp@0.34.3 three@0.180.0 playwright@1.56.1
git fetch --no-tags origin 53f2ad344dc56a1477e343531c423aed0e66c17d dd6bac3fa9ff640d4f562cf925337440bdb5cf8f 3a572193987cb29389727426136c6eb3ac326783 dfb40889c4c1221fb1833b859e8a11ef38aeb76e
node scripts/build-work47-benchmark.mjs
node research/three-d-20/restore-approved-models.mjs
node --test tests/three-d-23-dress-neckline.test.mjs
node scripts/test-three-d-23-dress-browser.mjs
```

The dedicated no-deploy workflow accepts **only these eight research/test/workflow files** over exact prior PR423, rebuilds the exact 15 licensed benchmark originals and original approved CC0 SHA-locked anatomical GLBs from its unchanged immutable in-repo lossless archive (not the provider's changed public downloads), runs actual Three.js skinned-garment buffer tests, source/privacy checks and actual **Chromium WebGL2** front/three-quarter/side/back × two poses × adult male/female × 320/390/430 phone-width × before/after (96 genuine GPU screenshots). It requires actual visible changed neckline pixels in a source-exact front comparison, identical dress provenance and no GPU resource leaks or outside browser network calls. Artifacts labelled HOLD and per-capture pixel differences, not visual acceptance.

## Honest limitations / go-no-go

Physical top-ring geometry can form a real small neckline dip but is **not a fitted neckline stitched around real shoulders**. A center-only V may look better/worse when combined with the existing photographed V-neck and source shading; inspect the real final screenshots and rate independently. Stronger fixes require original garment armhole topology, body-collision clearance and better actual photo panels, not more procedural 2D. Last independent 15-photo aesthetic baseline has **0 PASS, 5 REVIEW, 10 FAIL**; no new general PASS is declared. The four real family members' staging pilot remains **HOLD**, including the outstanding live JWT/RLS/account isolation, cloud save/restore and physical mobile phones.

No merge, production/staging/Cloudflare/Supabase, private family photograph, paid AI, external service or Drive Duel changes.
