# 3D-51 — combine repaired female sleeve-cap and real source-neutral collar (DRAFT / HOLD)

**Exact parent:** 3D50 research repair PR #459, commit `7d0e5b0e2ca43b4254481d0056432212e7798d66` (no merge, no release). Base QA ancestry: #455 → #457 → #458 → #459. Sibling #456 is the original separately held collar proposal.

## Why
The first 3D47 upper-arm feature incorrectly skipped the actual detached female cap, while collar improvements were developed in a separate sibling PR. This research branch tests both features **together**, rather than assuming a passing old male-only path means the new collar works in female photographed outfits.

## Actual implementation
- Four unmodified 3D48 opt-in UI/controller wiring files carried from sibling PR #456 into **exact** corrected PR #459 ancestry; compared original branch blob SHA across all four first to rule out overwriting concurrent edits.
- Source-neutral real collar band geometry module, browser screenshot comparison, direct male/female collar + original photogram tests, and source-preserving README copied from PR #456.
- Dedicated no-deploy collar workflow copied with a strict **new parent** ancestry and diff whitelist pointing to the corrected female-cap PR #459 head, not stale original PR455.
- Independent shoulder-cap geometry changes stay only in 3D50. No original source photograph, rig, jeans original SHA, production app, storage, or private user photo is changed.
- Opt-in comparison remains `?construction=after&sweep=after&sleeve44=after&caps45=after&contour46=after&volume47=after&collar48=after`, OFF by default.

## Required pass criteria
1. First 3D50 female/male true detached-cap test and left/right real seam-witness CI must be green at its exact head; otherwise 3D51 is blocked upstream.
2. New 3D51 exact-head no-deploy suite must pass unchanged original-source collar tests, female integrated shirt+photo-jeans case, plus 320/390/430 original Chromium before/after snapshots.
3. Compare true male/female front, side and rear visual evidence; source photo remains recognizable and physically worn clothing must improve **to a human**. This has not yet been independently approved; pixel changes do not constitute PASS.
4. Signed/swept continuous collisions, actual phone testing and four-account Family Alpha remain separately unverified.

**All states DRAFT / HOLD.** No merge, deploy, staging/production/accounts, billing, real family customer photos, paid AI or Drive Duel modifications. Family Alpha Issue #255 remains on HOLD.
