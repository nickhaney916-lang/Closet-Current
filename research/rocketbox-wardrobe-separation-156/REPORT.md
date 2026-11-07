# Closet Current — MAIN Priority #156 / Dual Humanoid Anatomical Separation and Photographed Wardrobe Bridge

**STRICT RESEARCH HOLD — no changes to production, existing staging, Supabase, other projects, merges or deployment. Family Alpha #255 HOLD.**

## Exact inherited baseline

P155 [draft PR #710](https://github.com/nickhaney916-lang/Closet-Current/pull/710) exact `675b6face8b0453ee1e4c8433c7177b14415bfed`, successfully completed [2/2 no-deploy GitHub jobs](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42426077806), 1,265/1,265 inherited Node tests, both 80-bone Microsoft Rocketbox MIT adult male and female original GLBs, 48 genuinely rendered WebGL screenshots (320/390/430 mobile widths in Chromium and WebKit). The tested models are substantially more natural facially than the old 163-bone mannequin, but source clothing is baked in. Users' owner-original clothing photos cannot be swapped onto them as-is.

## P156 milestone / fail-closed specification

Evaluate whether the original P155 Rocketbox clothing is actually separable, whether bare underlying human surfaces exist, and whether the 80-bone avatar rig can be reconciled with the original 163-bone owner-photo clothing rig. Strictly do not pretend garment removal by masking material colors, generating artificial skin or claiming an unverified photograph projection.

### Real asset analysis

- Read both original P155 immutable source GLB binaries and verify original hashes before using them, with no user photos. Decode actual GLB JSON and binary POSITION accessors, skin joints, mesh primitive materials, geometry extents, morph targets, texture provenance, and mesh associations. A "Jacket" material name by itself is insufficient to prove removable and underlying-body-safe clothing.
- Derive individual male/female 80-joint anatomy and visible/covered regions from original mesh attributes. Detect if clothing is baked into the same skinned mesh; fail closed if necessary bare body geometry is not present. The original current 163-bone clothing renderer remains untouched and the only authorized path for owner photos.
- Enforce automated tests that reject any replacement when body/garment separability, actual photographed source fitting, and 80→163 retarget mappings are not independently proven.
- Native app and original private account/photo storage must remain untouched; production/staging and other projects are prohibited. Both source scan and inherited Node regression must pass.
- Do not alter the source MIT GLBs in public app or store a derived naked/untextured deceptive figure. If a real independent human head surface can be safely isolated from clothing, investigate a narrow original-skeleton hybrid with genuine front/side/back screenshots; otherwise record the exact material/topology/retarget blocker and choose a licensed undressed source model as the next priority.

## Acceptance

Research analyzer and garment rejection gate are independently verifiable. Full owner-photo 3D garment fitting and "new 10/10 base" remain **NOT COMPLETE** unless actual rendered body with source garment physically free, anatomy with no holes, real original JPEG outfit fit, original owner privacy and 3 actual mobile widths pass. In all cases original source-photo outfit viewer remains unaffected and Family Alpha HOLD.

**Initial report; exact-source CI pending.**
