# Closet Current — Mission 3 signed-owner garment and camera-draft cloud metadata guard

**FAMILY ALPHA HOLD #255 stays active. Isolated DRAFT, unmerged, undeployed. No existing production/staging writes, real owner photographs, outside-account data access, Auth/RLS changes, or Mission 1/2 modifications.**

## Verified direct development baseline

Mission 3 [draft PR #820](https://github.com/nickhaney916-lang/Closet-Current/pull/820), exact HEAD `f872ef1799fdfda62fd2213c42aa624ded1e60da`, [NO DEPLOY GitHub Actions #42945559905](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42945559905) **SUCCESS**: 1,421/1,421 serial Node tests, six actual automated Chromium/WebKit 320/390/430 revision-first 1,000-garment cloud browser cases, previous genuine browser quota/capacity/cloud original-to-outfit restoration. Artifact #13823435047 independently examined: 55/55 decoded PNGs, all new screenshot hashes matched, 36/36 axe JSON reports with zero violations.

## Distinct observed security gap

The existing owner-specific IndexedDB name, PostgREST `owner_id=eq.<authenticated id>` filter, owner-scoped cloud image paths and signed owner/session lease validate **which account and private cloud row may be accessed**. But the nested cloud JSON `items` and `state.draft.batch` may still carry an explicit `ownerId` copied from a *different* account. The preceding decoder validated garment source SHA but not the per-item signed-owner tag; a poisoned or previously contaminated local record could be uploaded to the current owner cloud row, or a malicious/stale wrong-owner item or camera draft in an otherwise current-user cloud JSON could be silently committed to the local owner wardrobe. User-photo capture uses `item.ownerId` as an explicit signed-owner marker. Legacy items without an owner tag are not evidence of another owner's identity and must not be spuriously rejected.

## Isolated implementation

- Extend the existing `assertSourceReceipts(document)` validation to reject any saved item or pending `draft.batch` item with a **non-empty `ownerId` different from the currently signed-in account**. This applies before encoding and publishing a local private backup, and before decoding/restoring a remote document.
- When a remote cloud revision differs, validate **the full fetched JSON** with the same owner/source receipt checks **before any private-photo uploads or three-way/keep-both merge**. Revision-only REST probes remain small and cannot import or publish an uninspected garment.
- Preserve untagged/ownerless legacy clothes and drafts as *unverified legacy* (do not invent new signed owner or human-review attestation). Correctly tagged owner photos, source SHA and reviewed cutout checks remain supported.
- Preserve PR #798 owner/session leases, PR #820 revision-first network optimization, PR #817 atomic restore and capacity/retry safety. No external account or Supabase policy change.

## Independent acceptance design

The dedicated `tests/mission3-signed-owner-document-guards.test.cjs` compares this branch against its **exact verified parent**, reproducing the old acceptance of owner-B tagged saved clothing, owner-B private camera draft, remote owner-B item/draft restored into owner-A closet, and an unsafe parallel-edit merge into owner-A backup. Repaired cases must reject all mismatches **before publication or transaction commit**, retain the correct owner's previous garment/marker and keep local dirty drafts inspectable, and still successfully publish correct owner-A items/drafts and restore genuinely ownerless legacy items.

The new `scripts/test-mission3-signed-owner-document-browser.mjs` uses actual Chromium/WebKit mobile browser engines at 320/390/430, a locally rendered synthetic original JPEG with a valid real SHA-256, and a mock *owner-A filtered* cloud REST row containing a garment stamped owner-B. It verifies owner A's actual image/source SHA, local revision and wardrobe are untouched, no foreign draft appears, then allows a correctly owner-A tagged remote record and a truly ownerless historical record, with no fabricated approval. Real DOM cloud status/screenshot, original bytes, screenshot SHA and axe are verified.

The strict no-deploy CI builds the entire app, runs all Node regressions, owner-tagged browser tests plus prior independent revision-first 1,000-item, remote capacity, local quota, private original/cutout and camera-to-closet/styling/browser accessibility workflows. **Only five paths change:** cloud controller, new Node test, new real browser test, this report, dedicated CI. All photographs and accounts in tests are synthetic; this does **not** constitute real hosted two-account JWT/RLS/Storage acceptance. The final exact HEAD must have green CI and inspected screenshot receipts before calling this milestone verified.

## Hard external completion gates

Genuine authorized disposable-hosted Supabase two-account signed JWT/RLS/Storage test, physical Android Chrome and iPhone Safari camera interruption/network/quota/OS kill and peak memory with 1,000 independent high-resolution photographed garments, independent owner-reviewed recognition and male/female realistic photo-to-3D integration remain unverified. Family Alpha HOLD #255 stays OPEN; no release authorized.
