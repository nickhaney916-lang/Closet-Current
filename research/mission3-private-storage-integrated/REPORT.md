# Mission 3 — integrate owner-private Storage reference validation with verified cloud recovery safeguards

## Scope
Direct parent: verified independent Mission 3 integration PR #823, exact HEAD `81e996142107c5c0748c423f0c296a533a3b1fd1` (1,440/1,440 Node; six six-case actual Chromium/WebKit 320/390/430 flows). Port the independent verified PR #824 `a6798941b0d47cd3cb5e4c3c297e8b5c86377282` with foreign-owner nested photo-path and falsified legacy SHA cutoff checks. Both are **draft, unmerged, undeployed**.

## Risk
Even when authenticated owner A's remote backup is properly row-scoped, a nested JSON photo source or reviewed cutout can still point at owner B's private Storage object. During dirty, newer-remote three-way merge the app must reject these references **before** owner-A's cloud revision RPC; waiting for photo restore to decode can be too late.

## Implementation
- Reuse the independently tested async recursive private-photo-reference checker, covering nested `image` and `cutoutImage` keys across draft, item and merged state, with exact owner-prefix and SHA path checks and SHA-hashing historical inline cutouts.
- Keep the existing signed per-garment owner tag guard distinct; foreign-owner tags still fail without trusting another account.
- Convert malformed private photo reference failures to the existing `cloud-photo-integrity` stop, which persists an owner-specific IndexedDB quarantine and requires deliberate signed-owner Sync after cloud repair.
- Verify **local encoded** document, fetched full remote document and final merged/keep-both document **before any photo upload or publish RPC**.
- Preserve optimised revision-only polling, clean local original photos, atomic restore rollback, persistent device storage stop, durable cloud 413/507 stop, session revocation guards, 2D fallback and no legacy photo-attestation upgrades.

## Planned independent acceptance
1. Strict exact verified-parent ancestry and a five-file NO DEPLOY allowlist.
2. Focused actual original-photo source/foreign-pointer tests plus inherited all Node regression.
3. Genuine Chromium and WebKit at 320, 390 and 430 CSS px: foreign owner's path and forged cutout fail closed without POST, valid current owner's SHA photo restores; inherited SHA-integrity quarantine, device quota, foreign item/draft, 1,000-item revision-only checks, cloud 413/507, atomic restoration, original/cutout backup, native styling and mobile axe checks.
4. Captured synthetic fixtures/screenshot receipts. Do not use private owner photos or hosted account mutations.

**At creation: pending exact-head verification.** Family Alpha HOLD #255 stays OPEN. No production, existing staging, hosted Supabase writes, owner accounts or other mission changes. Live two-account JWT/RLS/Storage and physical Android/iPhone remain blocked pending authorised end-to-end test setup.
