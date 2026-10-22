# Closet Current — read-only triage after interrupted account deletion

**October 22, 2026. DEVELOPMENT/SECURITY DESIGN ONLY. Not a deployable recovery tool or permission to delete.**

## Problem

The undeployed deletion coordinator requires a durable write tombstone followed by an exclusive, never-expiring cleanup claim. If the process fails after removing some Storage objects, deleting a backup or deleting Auth, a second worker cannot obtain the existing claim. This prevents dangerous overlapping destructive cleanup but leaves a locked user awaiting human investigation. The claim does not indicate if the first worker stopped.

## Scoped implementation

- `supabase/functions/account-delete/recovery-assessor.mjs` is a pure **server-only read-only** diagnostic. Its constructor requires a privileged, injected account-specific operator authorization method, plus lookup functions for write lock, exclusive claim, one Storage inventory entry, private backup existence, and Auth account presence. The **entire feature defaults to disabled**.
- The operator's incident reference is not itself a credential. The externally supplied server-side authorizer MUST confirm the operator has permission for the specified account. Authorization runs **before all state reads**. Failed/missing authorizations produce no user-state response.
- The report contains **no account UUID, email address, image name, password, token, incident reference or service key**. It returns only enumerated state, existence booleans and a warning that the worker activity is **UNKNOWN**. No status can authorize an automatic retry, takeover, Auth change or release of tombstone. Even an apparently empty account is **NOT CERTIFIED DELETED**.
- The draft `supabase/design/account-deletion-write-barrier.DRAFT.sql` gains a **read-only private-schema** `closet_internal.inspect_deletion_claim_status(uuid)` function for a future explicitly approved server database connection, returning the write-tombstone and cleanup-claim booleans in a single PostgreSQL statement. Its EXECUTE privilege is **service role only**; browser anon/authenticated users cannot call it. It is not a migration and exposes no new public RPC.
- The HTTP account deletion endpoint `supabase/functions/account-delete/index.ts` remains **identical, disabled HTTP 503**. The running app and public frontend are unchanged. Do not wire or deploy the assessor to a user endpoint.
- This is **triage**, NOT a resumption or recovery action. It has no privileged production connector; the injected live-state adapters must be separately audited before any use in staging. Current tests are synthetic and disposable DB only.

## State classification / response

| Read-only code | Meaning (not a completed deletion) |
| --- | --- |
| NO_DELETION_LOCK | No tombstone; do not initiate recovery |
| CLAIM_WITHOUT_WRITE_LOCK | Corrupted invariant; escalate |
| AUTH_ABSENT_WITHOUT_TOMBSTONE | Deleted identity without surviving tombstone; escalate |
| WRITE_LOCKED_NOT_CLAIMED | Interrupted between tombstone and cleanup claim, or still preparing |
| ORPHANED_WITHOUT_CLAIM | Absent identity with locked owner and no claim; escalate |
| STORAGE_REMAINS_WORKER_STATUS_UNKNOWN | Private object still visible; worker might be active |
| BACKUP_REMAINS_WORKER_STATUS_UNKNOWN | No object in sampled listing, but backup still present |
| AUTH_REMAINS_WORKER_STATUS_UNKNOWN | No object sampled, no backup; Auth still exists |
| AUTH_REMOVED_WITH_PRIVATE_DATA_REMAINING | Auth absent but Storage object or backup is visible; urgent independent investigation |
| APPARENTLY_EMPTY_REQUIRES_INDEPENDENT_CONFIRMATION | No object in sampled listing and backup/Auth absent; **not proof of complete wipe** |

A Storage list with limit=1 is intentionally **not an exhaustive absence proof**. The existing account deletion coordinator separately requires complete empty pages, verified backup absence and explicit Auth 404; none can be substituted with these observer readings.

## Required operator response before enabling any recovery

1. Verify the user's request and identity using an owner-approved recent-authentication method; avoid displaying personal photos or identifiers in tickets or logs. Never trust a caller-supplied UUID to authorize a browser operation.
2. Ensure by independent orchestration or logs that **all previous workers are terminated**. The claim alone cannot prove this; there is no automatic lease timeout.
3. Privately inspect the durable tombstone and claim, full cloud Storage object-byte inventory, backup metadata, Auth account presence and active sessions. A partial or untrusted listing is not evidence of deletion.
4. Obtain independently approved incident and retention policy, dual-reviewed authorization and a documented plan for any manual resumption. Keep all write barriers in place until a separately audited path controls old JWTs and late uploads.
5. Re-run actual isolated hosted Supabase, cross-account isolation, email/passwordless sign-in, mid-deletion crash and recovery race testing. Operator must explicitly authorize any real migration, cleanup account, frontend control or deployment.

**Never** automatically delete a claim, drop the tombstone, unlock a former account, retry the coordinator after a conflicting claim, infer a crashed worker from a timestamp, or claim that a live user can self-delete from the currently disabled endpoint. An approved recovery transaction is still unimplemented.

## Validation

Node tests cover every state, malformed/fabricated status, operator denial and missing identity, privacy leakage, time-of-check race uncertainty, and disabled endpoint separation. Disposable PostgreSQL tests verify the private read-only function has server-only permissions and sees locked/unlocked sample owners accurately. Inherited full regression, Android/iPhone emulation, local-only two-account Supabase HTTP security, and camera/indexing checks must pass before this isolated draft is treated as development-verified.

**Remaining blockers:** owner approval and real staging, a complete staffed manual-recovery procedure, passwordless reauthentication, real-phone Android/iPhone 0/2, independently reviewed untouched originals 0/24, real recognition accuracy unmeasured, customer privacy/retention/legal and public launch. **No production release.**
