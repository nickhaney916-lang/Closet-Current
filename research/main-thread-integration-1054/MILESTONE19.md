# MAIN1054 M19 — Cross-Mission Exact-Head Source Ancestry and Integration Gate (HOLD)

**Status:** RESEARCH / AUDIT ONLY. **No branch merging, app integration, deployment, staging/production or hosted Supabase changes.** Family Alpha [#255](https://github.com/nickhaney916-lang/Closet-Current/issues/255) remains OPEN/HOLD.

## What is actually verified (Nov. 13, 2026 Pacific / Nov. 14 UTC)

Master [issue #1054](https://github.com/nickhaney916-lang/Closet-Current/issues/1054) coordinates independent research, not a unified release. All references below are immutable heads obtained from GitHub and may be superseded; recheck before any actual source integration.

| Track | Exact donor commit | Latest evidence at audit | Status for integration |
| --- | --- | --- | --- |
| M1 recognition P886 [#1134](https://github.com/nickhaney916-lang/Closet-Current/pull/1134) | `ab68cbbbd54376bbc9c099fc3504d1cc00ba632c` | Dedicated no-deploy 2/2 success [#43551341271](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43551341271); 663 native, 33 focused synthetic checks. No independent blind-owner accuracy or physical phones. | DONOR / no acceptance claim |
| M2 source-cloth C65 [#1137](https://github.com/nickhaney916-lang/Closet-Current/pull/1137) | `b3835b3b3f9de943cfff100ab5af0f9d8fcee6fa` | Dedicated 2/2 success [#43551622892](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43551622892); 9 discrete real-source 163-bone pose samples with zero strict sampled body/self crossings for the disposable 2mm + local 3mm profile. No fitted 3D render/continuous motion proof. | DONOR / geometry research only |
| M2 P86 alternative [#1130](https://github.com/nickhaney916-lang/Closet-Current/pull/1130) | `2d1a62fd75b308086d841cc918d970286128b254` | PR reports 36 actual-source Chromium/WebKit static original/candidate/restored images on male/female at 390 CSS px, 1775 local Node tests, and 2.5% radial body-clearance hypothesis. No exact-head GitHub Actions receipt found in audit. Static non-skinned clone, not wardrobe-fit 3D. | COMPETING DONOR / compare, do not blend |
| M3 signed import [#1135](https://github.com/nickhaney916-lang/Closet-Current/pull/1135) | `6574fa71e9bbda501e161556dc2aa872920a4eb6` | Dedicated [#43551559909](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43551559909) two jobs successful on latest head, but other legacy workflows on that SHA have failures. No whole-repository-green claim. | DONOR / conflicting app.js changes need review |
| M3 device/cloud evidence [#1136](https://github.com/nickhaney916-lang/Closet-Current/pull/1136) | `0b646df3b1a74d59747ea36fdd81510e5bda81c6` | Dedicated [#43551597192](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43551597192) 2/2 pass, 2088 native tests. Zero physical phone or authorized hosted-account test results. Separate branch from #1135. | DONOR / independent acceptance gate |
| M4 native source/photo revocation [#1133](https://github.com/nickhaney916-lang/Closet-Current/pull/1133) | `dba3897cd2c03812985181ffa24e889e44259738` | Dedicated no-deploy 2/2 [#43551245547](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43551245547), 2003 Node, 36 actual desktop-browser synthetic photo-revocation checks. | **READ-ONLY M19 BASE** |

## Git compare observations — not cherry-pick authorization

Pairwise GitHub comparisons of M4 current M18 as the controller versus each donor show **diverged ancestry**:
- M4 -> M1: donor-only 423 commits, controller-only 1922, compared source changed `public/app.js`, `public/index.html`, `public/outfit-capture.js`, `public/recognition-engine.mjs` and other recognition files.
- M4 -> M2: donor-only 748, controller-only 699, source differences include `public/app.js`, `public/index.html`, `public/cloud-backup.js`.
- M4 -> M3 import: donor-only 76, controller-only 153, source differences include `public/app.js`, `public/outfit-board.js`, `public/closet-stylist.js`.
- M3 signed import -> M3 cloud evidence: divergent, donor-only 61, controller-only 21; `public/outfit-board.js`, `public/closet-stylist.js`, `public/cloud-backup-bridge.js` differ. **These are separate donor research paths.**
- M2 C65 -> #86 screenshot donor: divergent, donor-only 2, controller-only 29; #86 also commits research screenshot artifacts and a static renderer. Do not substitute its radial correction for C65 without matched measured source verification.

These are **net comparison differences** and do not by themselves prove an actual Git merge conflict or guarantee compatible behavior. A real three-way source/semantic audit, end-to-end test, and independent release evidence are required.

## Reproducible read-only ancestry checker

`scripts/audit-main-crossmission-19.mjs` accepts exact 40-hex commits and locally computes each real `git merge-base`, left/right commit divergence and path overlap since the common ancestor. It executes only read commands, has no network, never writes to a tracked source tree, and returns `AUDIT BLOCKED` on missing refs or invalid SHA. It labels source-path overlap as **review required, not a proven conflict**.

Example in a full-history clone (ensure all SHA objects are fetched):

```bash
node scripts/audit-main-crossmission-19.mjs \
  --controller dba3897cd2c03812985181ffa24e889e44259738 \
  --donor m1=ab68cbbbd54376bbc9c099fc3504d1cc00ba632c \
  --donor m2=b3835b3b3f9de943cfff100ab5af0f9d8fcee6fa \
  --donor m3=6574fa71e9bbda501e161556dc2aa872920a4eb6 \
  --donor m3-evidence=0b646df3b1a74d59747ea36fdd81510e5bda81c6 \
  --donor m2-p86=2d1a62fd75b308086d841cc918d970286128b254
```

## Integration order and hard stopping conditions

1. Freeze the **exact compatible parent chain** for M4 native currentBoard.slots, signed source-original JPEG SHA, owner auth/IDB/epoch lease and 2D fallback. No guessed experimental inventory schema.
2. Select minimal M3 app/board/session fixes by source file/hunk, preserving same-ID relogin/cancellation, private photo revocation, atomic restore and owner-bound exports. Exercise real source-executed two-owner adversarial tests **before** any M1/M2 glue.
3. Bring M1 source-approved suggestion and manual review into this exact signed capture/save journey, preserving zero silent wrong saves, Unknown and original-photo preservation. Do not promote accuracy without independently blinded human truth.
4. Compare M2 C65 vs #86 in the **same** signed licensed real-garment/163-bone source/pose/shape audit. Promote only reversible 3D **research visualization** after original photograph UV/texture, front/side/rear A/B and collision/strain visual evidence; otherwise preserve same-owner 2D.
5. Prove one end-to-end captured JPEG -> explicit owner correction -> private saved garment -> outfit slots -> eligible 3D or original-photo 2D -> lossless backup/restore, using real lawful photos only when available and synthetic account identities. Execute focused and full exact-head Node, Chromium and WebKit no-deploy CI.
6. Independent physical Android Chrome/iPhone Safari, independently reviewed photo accuracy and authorized hosted private four-account RLS/JWT/Storage remain BLOCKED until actual external evidence. Keep Family Alpha #255 HOLD and do not merge or deploy.

## M19 acceptance / non-acceptance

This milestone records a **branch-safe, script-assisted ancestry inspection plan**. The standalone audit algorithm was locally syntax-checked and exercised on a synthetic two-branch overlapping `public/app.js` fixture; **the exact repository-wide local audit is not run** because the container has no GitHub clone/network access. GitHub API comparisons above are independently fetched. No M1/M2/M3 code has been integrated into this branch; no combined CI tests or release evidence are claimed. Any subsequent donor incorporation requires an exact-head, zero-guess, no-deploy PR and its own evidence.
