# Family Alpha v0.1 — Real Account-Scope Snapshot (isolated candidate)

Related to issue #255. This is an independent stacked DRAFT development branch on top of #262 → #260 → #258 → #256. It does not activate the avatar in the app and does not deploy.

## Reviewed existing app contracts
- `public/auth.js` owns `window.closetAuth.user` and `getAccessToken`.
- `public/app.js` opens IndexedDB named `closet-current-user-<user UUID>` and writes clothing items to `items`; saved outfit board to `state['outfit-board']` as `{current,saved}`.
- `public/cloud-backup.js` remembers active cloud owner/user and private DB handle. It does not previously expose a reliable read-only cloud owner scope to the new avatar.
- #262 adds a research-only server identity check on GET /auth/v1/user, but expects a session-generation source and owner-scoped snapshot loader.

## Implemented
1. Minimal `auth.js` session generation: `closetAuth.getSessionGeneration()` starts at 0 and increments only when authenticated account changes, on immediate logout, and on pagehide or bfcache restore. Same-owner access-token refresh leaves it stable. Logout invalidates `closetAuth.user` and local session before awaiting a network logout response.
2. `closetCloud.getOwnerId(database)` returns the active owner ONLY while the cloud session is enabled, the same DB connection is passed, and live Auth user equals the cloud owner. Returns null otherwise; read-only, no storage calls.
3. `public/family-alpha-2d-account-snapshot.mjs`: `readAlphaSavedWardrobe` reads `items.getAll()` and `state.get('outfit-board')` in ONE read-only IndexedDB transaction. It checks actual session generation, current user UUID, correct IndexedDB handle and cloud owner both before and after the async transaction. Missing/invalid board and failed IDB transactions reject; no fallback to a generic outfit.
4. `createAlphaLiveOptions` maps these actual app sources to #262's `renderAlphaAuthenticatedBoard` without directly exposing Auth tokens to image preparation. `renderAlphaLiveSnapshot` is an opt-in research helper; never bound to the app's navigation or UI.
5. Full test coverage: authentication generation and immediate signout, scoped snapshot, abort, missing board, cross-account epoch race, synthetic already-prepared garment rendering, stale account refusal.

## Still required BEFORE app integration
- True live Supabase database RLS and private bucket authorization verification with isolated test users (repo SQL policies alone are not deployment proof).
- Upstream proof that each masked PNG is derived from the exact owner-authorized decoded original JPEG; test complex photo isolation and fallback.
- Real App Outfit Builder wiring with a secured approved presentation producer. `approved: true` is a caller field and cannot establish real image provenance alone.
- Real Android and iPhone capture/fit, account switching, three-outfit and one-swap validation, four tester accounts, privacy for minors.
- Explicit main-thread review/approval for any merges, staging or production deployments. No paid services.

**No actual customer photographs, live API calls, Auth server/RLS settings changes, image uploads, deployment, or Drive Duel changes. Release status: HOLD.**
