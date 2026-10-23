# Disposable Supabase Storage orphan-photo inventory acceptance

**Status:** offline only; user deletion and hosted staging release remain DISABLED.  
**QA branch base:** draft [PR #202](https://github.com/nickhaney916-lang/Closet-Current/pull/202), exact SHA `b1437749d48f29abf1aafc4bf1dabcf4bf5204d1`.

## Threat and gap

Closet Current intentionally uploads the full-resolution private original-photo object **before** its transactional backup metadata RPC succeeds. When a metadata save fails, an uploaded photo can remain in `closet-private` but no longer be referenced by a saved wardrobe. Metadata-only erasure would fail to find that object. The browser currently has no verified autonomous full-account deletion or cloud-photo garbage collection. The separate issue #196 synthetic deletion tests test orphan inventories using a service contract; this extension tests **actual local Supabase Auth, Storage list/pagination, PostgreSQL RPC and RLS interfaces**.

## Real-local procedure

- Use a fresh ephemeral Supabase stack on loopback ports `54321/54322` and an explicit `LOCAL_DISPOSABLE_ONLY` guard. Confirm the database has **no existing Auth users or backup table** before the earlier 207 local A/B HTTP security suite runs; that suite applies migrations to a disposable Postgres instance, verifies real GoTrue/REST/RLS/Storage and hardens backup RPC permissions.
- Create separate synthetic Auth accounts A/B, store generated two-pixel synthetic JPEGs only. Save one metadata document referencing the first A photo. Upload 122 additional A-owned objects not included in the document, then upload one more object immediately before attempting a deliberately stale-revision backup RPC that **must return null**. This models a successful photo upload followed by rejected metadata update.
- Enumerate all A objects using the actual `/storage/v1/object/list/closet-private` endpoint in multiple ordered limit+offset pages. Check count, unique 64-character SHA-256 JPEG names and stable sorted-set fingerprint. Enumerate B independently and deny A→B/B→A listing and B→A private object read, plus anonymous listing/read. Re-read A's backup and prove the newly uploaded orphan did not appear in it.
- Add an object between independent read-only inventories to demonstrate that mere `photosPresent=true` is insufficient evidence of exhaustive inventory. A second unchanged listing can establish **repeatability in this fixture only**, not a distributed transaction fence against ongoing uploads, late sync, new devices or externally retained bytes.
- The acceptance script **never makes HTTP DELETE requests**. No hosted project keys, staging or production Supabase URL, customer identity, real photos, cleanup worker, production deployment or paid service is used. Destroy local containers and temporary status files after testing.

## Safety distinctions

A photo owner prefix and sortable SHA-256 path can support a **candidate inventory**, but the operator cannot announce deletion until all write paths are fenced, every page is enumerated under a provably stable snapshot, distinct metadata and orphaned object sets are reconciled, Storage removals are independently checked, Auth and backup metadata are removed in a correct order and provider retention/backup exceptions are documented. Even then, other devices, browsers, exported JSON backups and email/provider logs remain outside guaranteed immediate erasure.

An ordinary garment removal, local Clear action, logout, Cloudflare rollback, expired confirmation email or old browser session is **not account deletion**. The current HTTP account deletion endpoint intentionally returns `503` and `deletionCompleted:false`; do not enable it based on this QA.

## Results and next gate

See the exact-head GitHub Actions run generated for `.github/workflows/real-local-storage-orphan-qa.yml`; record status, test count, owner inventory pages, orphan count and failures **only after CI finishes**. Combined PR #202's previous 1,701 Node tests and 86 synthetic deletion checks are independent and cannot count as this new Storage API validation.

**Never deploy or authorize deletion** based on this file. The next stage requires a separately approved, fully read-only hosted two-account privacy test after Cloudflare/hosted Auth validation, then a staffed deletion/retention process reviewed against owner expectations. No minors or personal-photo pilot invitations.
