# Chat Assignment #57 — independent 3D visual QA (FAMILY ALPHA HOLD)

Standalone QA added on top of **exact Work58 / PR #405** source SHA `7d05929a1a06d80d04a4ea000c419d30761c3c8c`. Earlier PR #396 supplies CC0 anatomically skinned figures, PR #397 supplies the original-shirt photo bridge, and Work56 / PR #400 supplies the separate garment geometry. **None of those modules were edited here.** No 2D benchmark recreation, staging, production, accounts, paid providers, private photos or deployments.

## Evidence, not automatic visual approval

Run the dedicated `three-d-qa57-no-deploy.yml` CI. It reconstructs the *existing* Work47 licensed files, verifies the original JPEG and the existing provisional cutout against SHA-256, downloads only the two exact pinned CC0 anatomical GLBs, runs the Work58 source/skin and real Chromium WebGL checks, then independently checks **36 real GPU captures** (two figures × two poses × three angles × three viewport widths). The gallery creator uses the original untouched licensed JPEG and provisional PNG, plus actual browser framebuffer screenshots. **It never generates replacement clothing.**

Two 8-panel sheets under workflow artifact `CHAT57-3D-REAL-CLOTHING-INDEPENDENT-QA-HOLD`:

- `research/three-d-qa57/evidence/source-photo-and-both-humanoids-HOLD.jpg`
- `research/three-d-qa57/evidence/relaxed-photo-and-both-humanoids-HOLD.jpg`

Each shows original licensed photograph, verified cutout, female front/side/back, male front/side/back for the same pose. The artifact also contains screenshot SHA-256 ledger, all 36 full-resolution PNGs, Chromium results, readback/encode timings and failure-path diagnostics.

**Scope:** the sole presently integrated photograph is licensed black AJ shirt `commons-0003`. It is **1 source** of the existing 15-photograph licensed 2D benchmark, not evidence of a 15-garment 3D release. Remaining garment categories are **UNTESTED** here. Both source and cutout retain their immutable SHA identities. Source-adjacent neutral backside is *inferred*, never presented as an actual rear photograph.

## Mobile checks and limitations

Reuses Work58's real WebGL2/SwiftShader browser controls at **320×568 @2**, **390×844 @3**, **430×932 @3**. They test both skinned bodies, actual real-photo attachment, source and relaxed pose, trusted review, drag, pinch, front/side/back changes, no external requests, no stale shirt after model switching, no duplicated texture on pose change, retained original pixels, resource disposal and source corruption refusal. New independent negative cases disable WebGL on **320×568** and **390×844** and separately abort one local GLB. Results are recorded as safe block or remaining UX defect; merely showing an error status is *not* a finished 2D fallback.

Software-rendered Chromium mobile-size tests are **NOT** physical Android, iOS WebKit/Safari, battery, native GPU FPS, true total VRAM, or a four-account privacy test. Existing `renderer.info` resource counts and PNG readback timing are not substitutes. A user-friendly fallback to the existing 2D outfit view remains unverified in this isolated 3D research preview. Any model-fetch error or context restoration issue must be fixed before broad adoption.

## Independent release gate

`acceptance.mjs` requires a dated, named human review for **each figure × pose × front/side/back**. Six separate categories must each read `PASS`: source-photo fidelity, neckline/shoulder, sleeves/cuffs, side drape, clipping, and overall realism; every cell needs an explanation and the exact screenshot hash from the current CI ledger. Any `REVIEW`, `FAIL`, missing screenshot, stale hash, unsigned assessment or absent physical-phone/privacy/owner signoff blocks release. Unlike structural or screenshot presence tests, the gate cannot invent visual approval.

The committed `release-review.json` is deliberately **HOLD**, with no fabricated reviewer. Check it locally with:

```bash
node --test tests/three-d-qa57-gate.test.mjs
# After existing Work58 benchmark/3D09 evidence setup:
node scripts/test-three-d-qa57-evidence.mjs
node scripts/test-three-d-qa57-negative.mjs
```

Current inherited human visual grades in Work58 / PR #405: **photo attachment PASS** under tested conditions; **collar, sleeves and clipping REVIEW**; **side drape and overall cloth realism FAIL** for both figures. Those are not overwritten here. The fully separate Work59 fitting improvements can later be assessed by re-running this same independent QA against an explicitly pinned integration candidate, never by silently changing the current branch.

**Outcome:** Family Alpha 3D visual release remains **HOLD** until new geometry is independently inspected, both physical phone ecosystems and real 2D fallback are tested, full wardrobe source coverage increases, and Issue #255's account/privacy/backup gates are explicitly signed off.
