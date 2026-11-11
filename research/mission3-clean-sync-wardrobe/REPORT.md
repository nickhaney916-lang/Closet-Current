# Closet Current — Mission 3 clean cloud checks for large private wardrobes

**FAMILY ALPHA HOLD #255. Isolated research, DRAFT, UNMERGED, UNDEPLOYED.**
Do not modify existing production/staging, private owner photos, signed hosted Supabase, or Missions 1 and 2.

## Verified direct parent

Mission 3 source-integrity PR #807, exact HEAD `fd905910984c08647e26d212e071f85695ba4cc8`, [NO-DEPLOY CI #42928332846](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42928332846) successful: 1,384/1,384 Node tests, genuine synthetic-fixture mobile Chromium/WebKit screenshot evidence 37/37 valid, and 36 automated accessibility reports without axe violations. PR #807 is still draft.

## Why this milestone

The existing `sync()` eagerly called `snapshot()`, which used IndexedDB `getAll()` on both `items` and `state` before every remote cloud check — including routine online/focus/60-second checks with no pending local edits. A 1,000-item closet holding original and cutout JPEG data URLs could be cloned into another large in-memory snapshot just to compare remote revision numbers, raising memory pressure and UI delays. A second race could label the cloud `up to date` even if a photo was durably marked dirty while the remote GET was still in flight.

## Scoped implementation

- Read only the current `cloud-sync` revision marker first for a previously synchronized, clean wardrobe.
- Take a **full local items/state snapshot** when `dirty===true`, when a legacy closet has no `baseVersion`, or after a pending local edit makes the next sync dirty.
- Still query the remote cloud revision for clean accounts. Preserve atomic restore logic, owner/session leases, original photo SHA verification and cloud backup semantics from earlier verified Mission 3 research.
- Before reporting `Cloud backup up to date` or applying a remote restore, re-read the owner marker. If a local revision/dirty/base-version/restoration flag changed while awaiting the remote network response, show pending backup and schedule a fresh sync rather than misleading users or restoring over a new edit.
- No changes to owner authentication, 3D, local photo capture, recognition, cloud RLS or server APIs. No new automatic approval.

## Evidence requirements

`tests/mission3-clean-cloud-marker.test.cjs` must run against exact **unmodified verified parent** and reproduce:
1. Repeated clean syncs clone a complete 1,000-item wardrobe `getAll()` each time.
2. A local change during remote network wait can be mislabeled `Cloud backup up to date`.

Fixed tests must show zero `getAll()` reads in repeated clean 1,000-item syncs; unchanged local rows; complete image snapshots for dirty backup; first-time legacy migration preserved; newer remote cloud revision still atomically replaces only the owner DB; stale status correctly remains pending during concurrent writes.

The NO DEPLOY workflow also builds the app, runs the entire serial test suite, tests synthetic-owner actual Chromium cloud original/cutout/looks backup restore, and actual Chromium/WebKit 320/390/430 camera→review→private closet→styling plus mobile reliability/accessibility. Confirm final exact commit and retain screenshot/case evidence before claiming verified.

## Limitations

This optimization avoids redundant **IndexedDB full wardrobe snapshots on clean cloud checks**. It does **not** prove bounded peak heap or native storage quotas during a dirty backup or incoming 1,000-image restore, which still need full images. Actual physical Android Chrome/iPhone Safari OS/lifecycle and memory profiling, isolated hosted signed two-owner JWT/RLS/Storage acceptance, independent owner photo review, and full release sign-off remain outstanding. Family Alpha HOLD #255 continues.
