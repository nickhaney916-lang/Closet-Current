# NATIVE-RESTORE-3D-06 · Main-controller integration · RESEARCH HOLD

Source: verified PR #558 **RESTORE-ATOMIC-01** exact commit `7201fce6a3e13c795877b30eb190f91e9106085a` and read-only exact PR #557 **NATIVE-3D-05** `be430292bedc074e52b9368e7f4bcb7d436e329b`. Base PR #556 exact `56c9a814d6ecce5beae5d95043213faa2d8bb6f0`.

## Implemented

- Restores the exact original native consumer Outfit Builder 3D button and 3D read-only bridge from PR #557, with byte-identical protected source in the combined PR #558 backup branch.
- Runs both opt-in switches only: `?nativeLossless04=research&restoreAtomic01=research&native3D05=research`. Normal unflagged consumer remains unchanged. No production, merge, deployment, database migration, user photo access, or Family Alpha approval.
- Closes a cross-feature atomicity/privacy bug: an *active* 163-bone 3D viewer may reference now-replaced clothing. Native v4 file restore and remote cloud apply both fail closed until the viewer is closed; they do not auto-close owner data while it is being reviewed. The existing restore consent, owner token epoch and CAS remain required.
- The new genuine Chromium browser integration `scripts/test-native-restore-3d-06-browser.mjs` at 320, 390, 430 tests from the actual app: unchanged native auth with **synthetic HTTP authentication responses only**, exact-source locked JPEGs, true IndexedDB, validate/export backup v4, corruption rejection, real simulated local item/outfit loss, owner-consented atomic lossless recovery, saved 3D ID and preserved jacket/coat/shoes, click the original native Outfit Builder preview button, actual licensed photo-true skinned dress and 163-bone WebGL front/side/rear views, honest unsupported item fallback, active-view restore denial, session logout wiping private preview and owner A-to-B foreign backup rejection. Evidence = SHA-locked nonblank PNGs.
- Runs full inherited Node suite, both independent original real browser regressions, actual pinned unchanged PR #541 3D source donor tests, and independent screenshot/gallery audits under an isolated no-deploy workflow `.github/workflows/native-restore-3d-06-no-deploy.yml`. Strict changed-path guard protects original auth, source photo fixtures, migrations and Supabase.

## Acceptance

A committed implementation is not proof of passing CI. The **dedicated final SHA** GitHub Actions and screenshot artifact must both pass before labeling this specific integration verified. The independent PR #558 narrow original-only path guard may intentionally reject new PR #557 integration files; do not relax it or interpret its result as a 3D runtime failure.

## Still blocked for release

Real server-signed staging account A/B RLS and Storage, real cross-device cloud restore with live network, Android Chrome + iPhone Safari *physical* device tests, arbitrary photographed new garments fitting 163-bone anatomy, full footwear/outerwear 3D and production-quality 10/10 fabric realism are unverified. The original default consumer path remains separate. **Family Alpha HOLD. releaseAuthorized=false.**
