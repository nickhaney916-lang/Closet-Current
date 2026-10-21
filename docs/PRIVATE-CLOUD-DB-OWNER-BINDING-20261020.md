# Private cloud sync must bind to the real owner of the local IndexedDB
**October 20–21, 2026 Pacific. Isolated draft development; no hosted Supabase or customer data operations.**

## The reproduced privacy risk

The previous `public/cloud-backup.js` guarded async cloud work by the current Auth user ID, an in-memory `db` object reference and sync generation, but **never confirmed that `db.name` was the database for the same signed-in user**.

A refresh or interrupted account switch could pass the previous user's IndexedDB handle to `window.closetCloud.start(staleDb, callbacks)` with the newly signed-in user's Supabase access token. If the client then snapshotted local garments and uploaded them, the old user's local clothing photos might be copied into a different user's cloud backup. Browser separation based only on object identity or JWT does not prove that a cached local database belongs to the new account. This is a security *possibility* demonstrated in the unit/browser fixtures, not evidence that a real customer's data leaked.

## Scoped defense in depth

- The cloud client's `ownsDatabase(database,owner)` now requires the **exact IndexedDB name** `closet-current-user-<authenticated UUID>`.
- Every `current(op)` check also requires that name to match the captured operation owner. This gates token refresh, fetch, cloud photo upload, restore, local dirty revisions, scheduled sync, online/focus events and callbacks.
- `start` refuses an owner/database mismatch before any network or local write and displays a clear reload/sign-in instruction. It will accept the legitimate new account's freshly opened database on a subsequent `start` invocation.
- A BFCache page resume cannot silently reactivate a stale database under a new signed-in account. The mismatch is not resolved by relabeling or copying data; the original local IndexedDB records are left intact.
- The original high-resolution image storage/photo ownership checks, RPC-only server writes, private bucket, per-account server RLS design, merge conflict prompts, index and outfit styling are not changed.

## Verification and limitations

**Unit tests:** `tests/cloud-session-generation.test.cjs` now gives every mock database its actual account-bound name and tests: valid same-owner sync; stale B token on old A DB refusal; old A garment unchanged; no dirty marker or network call; safe new B DB restore; BFCache isolation; and DB binding change while access-token refresh is pending.

**Browser tests:** `scripts/test-cloud-session-generation-browsers.mjs` runs Chromium Android and WebKit iPhone *emulated* touch browsers using actual IndexedDB names. It intentionally begins syncing A, switches to B while A's response is pending, tries A's stale database under B (must make **zero new requests**), then starts B's valid database and confirms the old response never contaminates B. All intercepted cloud responses are synthetic; these tests never connect to hosted project data.

**Source restrictions:** `scripts/verify-camera-cloud-integration.mjs` reconstructs the **exact three bounded source edits** against previous draft PR #112 SHA `af8738abead9419ef8fc66717233975487c87cc3`. Other photo, customer UI, model, storage schema and human-preview lineage must pass existing source-integrity gates. Dedicated `.github/workflows/private-cloud-owner-db-binding-qa.yml` also executes full Node/build and customer pilot-release veto.

**Not proven:** Live Supabase RLS, SMTP, bucket write/read permissions, provider account switching on real physical phones, end-to-end cross-device cloud restoration, or production deployment. This prevents one demonstrable client-side cross-account binding hazard, but does not replace server-side authorization. No project settings, credentials, policies, hosted records, paid AI, Drive Duel, merge or deployment were changed.
