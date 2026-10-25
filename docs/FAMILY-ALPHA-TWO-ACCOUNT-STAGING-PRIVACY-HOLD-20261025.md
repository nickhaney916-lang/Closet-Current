# Family Alpha v0.1 — staging two-account privacy handoff

**2026-10-25 · Issue #255 · OFFLINE synthetic tests only · NO DEPLOY**

## Why this gate exists

A Cloudflare Access login challenge is useful, but it is not a Supabase database or storage ownership test. Before inviting family, we need proof that one owner cannot accidentally download another owner's wardrobe or photo and that changing accounts while a request is pending does not restore private data into the wrong closet.

## Changes in this draft

The new `tests/family-alpha-stage-two-account-cloud-mock.test.mjs` executes the actual **staging-transformed** `public/cloud-backup.js` client in a synthetic VM. All fetches are fixture-only and must use Supabase STAGING `fbnplztkbsteuzrmbgib`, never production.

- Two invented UUID owners A and B use separate owner-scoped backup queries and matching **fictional** Authorization tokens.
- A synthetic response containing a backup row with **another owner's ID** is rejected before local database writes.
- A private JPEG reference starting with the **other owner's storage folder** is rejected before any Storage fetch.
- A session owner change while a request is in flight prevents the previous account's backup from being restored.
- The app's local IndexedDB database still names each wardrobe using the authenticated owner's UUID.
- The default deployment candidate remains HOLD, with blank staging Auth callback and publishable key and avatar rollout disabled.

These are *defense-in-depth client regression tests*, not server authorization tests. A malicious HTTP client can bypass frontend code; the Supabase RLS/Storage policies and private backup writer RPC must independently block cross-account access.

## Required owner-approved live tests — NOT YET RUN

Run only after explicit approval to deploy the full staged app, configure staging Auth and create disposable **adult** staging test accounts. Do not use minors or real family photos for initial privacy testing.

1. Verify Cloudflare protects the actual uploaded JS/CSS/manifest/worker/media paths, not only the current one-file placeholder. Confirm unapproved identity denial where an accessible alternate address permits a complete test.
2. With disposable staging Account A signed in, store a synthetic backup and harmless test JPEG; read back the A row and A private object.
3. With Account B's **real** stage-issued JWT, confirm direct REST SELECT/UPDATE/DELETE requests against A's backup return no accessible rows or are denied, and attempts to insert data with A's owner ID are denied.
4. With B's JWT, verify download/update/delete of A's private JPEG and cross-folder upload/upsert are denied. Explicitly assess any signed URL creation / previously issued signed URLs, because link lifetime can differ from JWT changes.
5. Reverse A/B, test signed-out and expired sessions, retry/stale response races, then delete only the disposable staging fixtures.
6. Test password invitation/reset/email redirects to the exact protected root, account sign-out/reload, Android/iPhone camera capture → reviewed original JPEG → closet → 2D avatar → one-item outfit swap.
7. Record CI, actual network logs and separate release approval before adding the two adults and two children.

**Boundaries:** No deployment, merge, email send, account creation, SQL writes, stage configuration edits, real photographs, new secrets, paid services, production or Drive Duel modifications. No claim of passed live RLS/Storage tests. Family Alpha remains HOLD.
