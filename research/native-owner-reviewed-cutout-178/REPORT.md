# Closet Current — MAIN P178 owner-reviewed native original and cutout cloud source integration

**HOLD — Family Alpha #255. Draft/unmerged/undeployed research only.** Exact verified P177 parent `e67b75eeac918dd91a0edf142e0018f6a0743c60`, draft PR #738, 3/3 independent CI jobs passed.

## Objective and actual integration

P177 supplied an opt-in guard wrapping the ACTUAL `window.ClosetBackupEngine.mapImages`, but it was not connected to the native app's own owner-reviewed account workflow. P178 connects it to the **actual app account menu** via `research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs`, which already calls P134 local/remote owner-approved backup, P137 reviewed restore, P129 owner-private remote API/CAS, P128 original+crop source packing, and P126 byte-verifying atomic private IndexedDB recovery.

The new source adapter `research/native-owner-reviewed-cutout-178/owner-transport.mjs` activates ONLY if all three URL research flags are set on HTTP loopback: `ownerReview145=research&ownerReview146=research&ownerCutout178=research`. Legacy automatic cloud sync must first be explicitly PAUSED by P145. It requires actual native backup engine, current owner-specific IndexedDB, synthetic unsigned local token, owner session lease and browser SHA256. HTTPS, staging, production, nonloopback domains and genuine real JWTs are not accepted.

**Before any P129 backup upload**, run P177 native mapper on the actual owner-reviewed P119 source and separately SHA-reviewed crop. Verify P126 source bytes/provenance from local IndexedDB, verify exactly independent original and cutout owner-private SHA JPEG object refs, and remember the immutable source snapshot. Continue the preexisting P134/P133/P132 literal owner-approval + remote compare-and-swap path. **After backup**, read the P129-written owner-specific cloud metadata, preflight EVERY original/cutout path before the first private JPEG GET, rehash each remote JPEG, revalidate P126 original/source/cutout provenance and compare the returned full document with the preflight owner snapshot BEFORE the app displays a successful cloud backup status. No image data, source hashes or private labels are added to count-only confirmation dialogs.

**Before a destructive restore prompt**, fetch and SHA-verify each owner's original and cutout path through local isolated private transport and independently run P126 with the actual P177 native engine. Then leave P137's owner-review, remote manifest, P129 and P126 atomic IDB replacement controls unchanged. Logout, changed owner, new token and pagehide revoke P178 and restore the actual native engine method.

The unmodified shipping `public/` code is NOT changed. This is an actual app UI integration **in opt-in research mode**, not a shipping, live Supabase or signed-JWT feature.

## Exact-head CI acceptance

Changes limited to exactly six P178/P146 research-source, script, focused test, report, workflow files. Tests:
1. Full Node suite and adversarial explicit-three-flag/loopback/synthetic-owner/P177 mapper install/revoke guards.
2. Authentic native Closet Current account menu, Chromium+WebKit 320/390/430, original and crop backups, cancel/retry, owner B denied, local saved outfit recovered, remote revision CAS, logout while modal open, 30 real JPEG/source SHA browser screenshot checks, P178 source proof counts at upload and before restore.
3. Same native owner-reviewed UI with opt-in OFF, plus independently original P140 double-JPEG cloud backup consent browser; 78 extra real browser screenshot SHA checks and no legacy regression.
4. Disposable PostgreSQL 17, unmodified Supabase owner-private RLS/Storage policies and revision CAS with two simulated separate owner UUIDs.

**Completion only if exact-head 4/4 CI jobs pass.** No guarantee of real hosted JWT/RLS, production shipping cutout integration, full hardware phone acceptance or 10/10 personal-photographed garments. Family Alpha HOLD and no merge/deploy.
