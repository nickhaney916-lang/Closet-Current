# Pilot login, account recovery and onboarding audit — October 21, 2026 Pacific

Isolated from PR #129 `df6dfa071838c054ac8f3f26a64985252e1050e0`. Separate recognition #126 and integration #128 are not duplicated or modified. All trend129 app bytes remain unchanged. No live Auth/SMTP/redirect configuration, customer account, cloud data, model or human-review evidence changed.

## Reproduced defects and bounded fixes

1. **Interrupted password reset:** the callback removed one-time URL credentials before verification, then kept recovery only in memory. Reload discarded the pending reset; with an older stored login it could restore the old account. Persist a pending recovery marker and the verified owner with the already-supported session credentials. Reload refreshes that owner and resumes a locked new-password form, never resolves wardrobe readiness until password update succeeds. Wrong/missing owner identity is rejected. Successful password update removes the marker through ordinary session persistence.
2. **Expired/reset dead end:** recovery hid mode/reset/resend controls and disabled email without a cancellation path. Reuse the mode button as Back to log in; clear pending local credentials, restore email/help controls and offer explicit fresh-link choices. A rejected expired recovery PUT (401/403 or supported expiry code) returns to login/reset instructions. Cancellation is local; it does not make a global server logout request or send mail automatically.
3. **Hidden/confusing email help:** expired callbacks or unconfirmed email could name a button buried in a closed help section, and the button only said Resend email. Open help on link errors/unconfirmed email and distinguish signup confirmation versus password reset. Retain URL sanitation before network access, bounded requests, serialized controls and provider-throttling messages. No automatic resend loops.
4. **Partial login publication when storage fails:** user/session fields were assigned before local session persistence, so a blocked localStorage write left a partially published identity. Persist first; publish identity/resolve wardrobe access only afterward. Show actionable site-storage guidance. Store verified owner_id for normal sessions and reject an owner change during restoration. Malformed transient JSON/temporary storage failures preserve a stored refresh token for explicit retry while the wardrobe stays locked.
5. **Mobile controls:** auth-only CSS ensures 48px buttons/help summary, 52px inputs and 16px input font, with a compact 320px layout. Password visibility remains explicit and masks again when changing mode. No unrelated product layout changes.

The pending-reset gate is client workflow state, not a new server authorization policy. Recovery tokens remain sensitive browser-stored session credentials, just like existing normal refresh tokens. Backend session revocation, token expiry and secure hosting still require live verification. No tokens, passwords, email addresses or real identity records are emitted into development evidence.

## Verification and test boundaries

- Ten new mocked Auth regressions: **nine fail against untouched PR129**, all ten pass after fixes.
- Full local build and Node suite: **1,350 passed / 0 failed / 3 skipped** (1,353 total), including previous Auth races/timeouts/throttling, cloud isolation and deletion guards.
- Dedicated exact-head CI runs current exact Auth/index/CSS source scope, immutable historical129/127/125 proofs, full suite and Android Chromium/iPhone WebKit.
- New browser checks use the actual built product DOM, CSS, Auth client and real owner-named IndexedDB. Hosted Auth/cloud replies are intercepted synthetic fixtures. Cover expired callback -> manual resend/reset; 320/390/430px layout and 48px tap targets/password visibility; recovery for B replacing old saved A -> reload remains locked -> same-owner password change; expired reset PUT -> fresh email controls; offline recovery refresh -> explicit retry -> local Back to login; signup confirmation -> account A photo -> logout/reload -> empty B closet -> B photo -> logout/login A -> original A photo intact; and blocked browser storage refusing partial login.
- Existing real-browser callback malformed/mismatched/expired token checks, cloud owner generation/Keep-both, unchanged six trend129 cache scenarios and owned styling also rerun.
- Final exact commit, CI and actual browser outcomes are recorded in the draft PR after verification. Synthetic deliveries/checklists are not real inbox, provider configuration, physical camera or customer consent evidence.

## Account-deletion readiness audit — disabled, no destructive operation

| Component | Observed safeguard | Still required before activation |
|---|---|---|
| Public account/data UI | Existing pilot notice states self-service deletion is unavailable; logout/local reset are not deletion | Owner-approved support/request route and tested fulfillment/retention process; do not imply complete removal today |
| `account-delete/index.ts` | Hard-coded 503, deletionCompleted false, no service-role reads or adapter invocation | Explicit approval and separately reviewed deployment; remains byte-identical and disabled |
| Coordinator | Enabled flag, verified bearer UUID, fresh password check for same owner, exact DELETE MY ACCOUNT phrase | Genuine server-side session liveness/reauthentication validation with disposable consented accounts |
| Write barrier | Requires durable per-owner lock before destruction; draft Postgres design exists | Verify deployed lock across backup RPC and every storage-write path; not an in-process mutex; no hosted migration executed here |
| Photo cleanup | Owner prefix and strict hash-named paths, bounded paging, repeated absence checks; storage API before backup/Auth removal | Actual private storage/RLS isolation and failure/retry behavior; unexpected object types need reviewed cleanup |
| Metadata and Auth deletion | Backup absence verified; Auth identity deleted last and deletion checked | Full end-to-end adapter/service-role protection, partial-failure recovery/runbook and independent proof |
| Existing tokens/device copies | Existing tests/docs recognize deletion alone does not revoke every access token; local/private cloud copies separate | Session revocation/liveness, expiry behavior, browser IndexedDB/cache/local copies and backup retention procedures |

No deletion UI/endpoint was enabled, no production account or data deleted, and all deletion source/schema files remain unchanged. Existing synthetic coordinator/adapter/entrypoint tests passed as part of the full suite; real SQL write-barrier and hosted deletion are not validated by this task.

## Remaining pilot blockers

- Verify real inbox delivery, expired/used links, resend/password reset, spam/provider limits and refresh behavior with consented disposable accounts. This task never sent a real email.
- The existing APP_URL still points to GitHub Pages. Cloudflare/canonical-domain allowlists, email templates, cross-origin browser storage and SMTP must be reviewed by the owner and tested together. No URL cutover or live settings change is performed here.
- Perform real two-account shared-phone tests, including logout, app backgrounding, storage restrictions and fresh-device cloud restore. Mocked Auth plus local IndexedDB cannot prove hosted Auth/RLS/storage isolation.
- Finish independently verified account-removal fulfillment before broad invitations; existing pilot notice/support/legal readiness remains unresolved. Logout does not erase local photos or orphaned cloud objects.
- Recognition126/integration128 remain separate follow-ups. No physical Android/iPhone or genuine garment/human accuracy validation is claimed, and no release authorization is granted.

## Current documentation reviewed

Supabase skill, official Auth changelog (auth filter), password-reset and resend references, and local email template guidance were checked. Relevant current docs: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail and https://supabase.com/docs/reference/javascript/auth-resend. The advertised Markdown changelog was attempted but the retrieval service rejected its content type; the official HTML changelog was checked instead. No applicable password/implicit-callback breaking change was identified in that index; self-hosted SAML changes are outside this app's password client.
