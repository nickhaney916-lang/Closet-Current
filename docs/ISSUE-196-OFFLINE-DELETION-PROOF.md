# Issue #196 — offline deletion proof and operator handoff

This is an executable **synthetic contract-model suite**, not an account deletion
service, hosted acceptance, SQL serialization proof or operational recovery tool.
The central conversation owns integration and release. Real-data invitations
remain blocked by issue #192. Do not enable the HTTP endpoint or apply draft SQL.

## Exact sources reviewed

| Source | Exact head | Relationship |
| --- | --- | --- |
| PR #177 | `0ec8727f24c8ac6df249527120a7bdb4a3cc2dd2` | Exclusive cleanup claim; disabled server design |
| PR #178 | `d5770b1f3709aaf2ae5154d5cde10087e28befae` | Read-only recovery assessment |
| PR #179 | `21438017d98ffd199d81cf77b8ff98b072de2c01` | Non-executable dual-review handoff |
| PR #189 | `50223902df0ae54ff15bb89bd9100ddc76bb3581` | This QA branch's base; includes the above ancestors |
| PR #195 | `425efe54cbcebffe54e8d32c209d6fb80a739dca` | Separate local draft-clear implementation; not copied or changed |

Source links pinned to the application baseline:

- [Coordinator, authentication/claim/inventory/verification, lines 15–72](https://github.com/nickhaney916-lang/Closet-Current/blob/50223902df0ae54ff15bb89bd9100ddc76bb3581/supabase/functions/account-delete/deletion-coordinator.mjs#L15-L72).
- [Real adapters, owner-scoped list/remove/backup/Auth, lines 76–129](https://github.com/nickhaney916-lang/Closet-Current/blob/50223902df0ae54ff15bb89bd9100ddc76bb3581/supabase/functions/account-delete/supabase-adapters.mjs#L76-L129).
- [HTTP handler, always 503, lines 1–16](https://github.com/nickhaney916-lang/Closet-Current/blob/50223902df0ae54ff15bb89bd9100ddc76bb3581/supabase/functions/account-delete/index.ts#L1-L16).
- [Cloud upload before metadata RPC, lines 75–87](https://github.com/nickhaney916-lang/Closet-Current/blob/50223902df0ae54ff15bb89bd9100ddc76bb3581/public/cloud-backup.js#L75-L87).
- [File export excludes drafts, lines 25–32](https://github.com/nickhaney916-lang/Closet-Current/blob/50223902df0ae54ff15bb89bd9100ddc76bb3581/public/wardrobe-backup.js#L25-L32).
- [Recovery handoff's missing executor/fencing/inventory, lines 20–35](https://github.com/nickhaney916-lang/Closet-Current/blob/50223902df0ae54ff15bb89bd9100ddc76bb3581/docs/ACCOUNT-DELETION-DUAL-REVIEW-HANDOFF-20261022.md#L20-L35).

## What executes

The real coordinator and real Supabase adapter functions execute against an
instrumented in-memory SDK-shaped fake. No Supabase SDK/client is constructed,
environment credentials read, account created or HTTP request made. Two fixed
fictitious owner IDs and generated 2×2 JPEG swatches with distinct comment markers
produce actual photo bytes and SHA256 object names. A contains 237 objects,
including five referenced unique photos and 232 unreferenced/superseded uploads.
Two items and a draft share one full-scene original. B contains the same five
photo byte hashes under its own prefix, plus independent backup/Auth state.

Production cloud mapping, file-backup validation and additive merge are exercised
using those synthetic bytes. Recovery assessor and handoff inspect the actual
interrupted fake state, rather than merely accepting a canned recovery status.
`enabled:true` exists only in test injection, never in the shipped HTTP handler.

The fake's write barrier, claim atomicity, preexisting-transaction serialization
and stale-token behavior are explicit **model assumptions**. Tests verify how
the real coordinator behaves under those service contracts. They cannot prove
real PostgreSQL transaction locks, RLS, JWT revocation, SDK transport, provider
retention, storage-byte deletion or distributed worker fencing. Neither Docker
nor psql was available locally; no replacement real-service result is claimed.

## Proof matrix

| Acceptance scenario | Executed evidence | Remaining gap |
| --- | --- | --- |
| Complete owner inventory | 237 objects / three removal batches; shared original/display/unmasked/draft/inspiration references; A→B and B→A isolation | Real Storage API listing/pagination and byte disappearance |
| Abandoned upload | Add object after upload acknowledgment, leave backup uncommitted; object removed by owner sweep | Actual upload/RPC race and object-service semantics |
| Cleanup interruption | Inject exceptions before and after all 10 adapter stages; no success receipt, B unchanged; assess partial state without mutation | Actual process death, lost transport reply, persisted journal and restart |
| Partial cleanup | Crash after second batch leaves 37 photos; quota-like failure leaves 234; backup/Auth preserved; claim not released | Browser quota and local draft clear belong to #195 |
| Concurrency | Two modeled workers: one claim/receipt; modeled in-flight upload is included; old JWT/queued backup/photo writes blocked by persistent modeled tombstone | Actual SQL lock and distributed worker/old-JWT enforcement |
| Failed acknowledgments | No-op Storage, backup or Auth removal cannot certify completion; phantom after empty listing stops cleanup | Eventual consistency and real service error formats |
| Unknown inventory | Unexpected name, nested path or embedded foreign owner rejects and retains barriers | Independently approved operator handling for unknown files |
| Recovery | Actual assessor denies automatic takeover; actual handoff grants no deletion/unlock/retry; unauthorized/unfenced review denied | No recovery executor, trusted operator identity or enforced fence exists |
| Presence-only snapshot negative control | Adding bytes while photo-presence remains true does not change assessor fingerprint; handoff still explicitly non-authorizing | Full immutable byte/reference inventory and real fencing are prerequisites |
| Local/export residuals | Local copy and JSON export survive cloud deletion; actual file validator/merge can reintroduce saved photos; foreign v4 owner rejected | Device cleanup, offline origins, open tabs, downloads and user's copies |
| Endpoint/network | Actual HTTP handler returns 503/false; preload refuses fetch/TCP/DNS/UDP; focused lifecycle reports zero attempts | Not a production network firewall or hosted endpoint check |

Deleting cloud data is not equivalent to erasing every copy. The fake keeps
local/export state deliberately. CDN/static caches, Auth/email/provider logs,
snapshots, operator records and third-party copies are **outside this proof**.
No retention deadline or provider deletion guarantee is invented here.

## Run without external services

```sh
node scripts/check-issue196-offline-scope.mjs
node scripts/build.mjs
node --test tests/*.test.cjs tests/*.test.mjs
node --require ./tests/helpers/issue196-no-network.cjs --test tests/issue196-*.test.mjs tests/account-deletion-*.test.mjs
git diff --check
```

The network preload applies only to the focused suite; unrelated full regression
tests may exercise their existing localhost harnesses. No new dependency or
package installation is needed. The dedicated branch-only workflow has read-only
repository permission, runs the above checks, uploads no artifact, and records its
exact `$GITHUB_SHA`. Consult issue #196 and its draft PR for final counts, commit
and exact-head CI conclusion. No hosted tests are implied by a green workflow.

Local verification of this QA tree: application build PASS; full regression
**1,691 passed / 0 failed / 3 skipped** (1,694 total). Focused network-denied
deletion/recovery suite **86 passed / 0 failed / 0 skipped**, including **40 new
issue #196 checks**. Two generated JPEG variants independently decoded as 2×2 RGB
using Pillow; no person/clothing photos were supplied. Scope and whitespace
checks PASS. GitHub must independently run the final pushed SHA; these local
results are not a claimed completed CI result.

## Operator handoff — NOT an executable deletion procedure

| Phase | Acceptance before proceeding | Stop/escalation |
| --- | --- | --- |
| Intake | Named responsible operator and private monitored contact; authenticated request scoped to owner; authority and consent independently verified | No password/token/photo in GitHub/email; identity mismatch means no private lookup |
| Explain/export | Give current notice: original full scene, crops, unfinished cloud drafts, orphans, offline/export copies; optional export with its draft exclusions understood | Export failure or ambiguous scope is unresolved; do not label exported data complete |
| Retention decision | Operator approves category-specific retention/turnaround, lawful exceptions and provider-log/snapshot handling; record actual commitments | Unknown provider retention stays unknown; no invented deadline or guarantee |
| Fence/claim | Approved recent-auth path (including passwordless users), durable write barriers and exclusive claim; real old sessions/uploads/workers fenced | Existing design has no trusted live executor; do not invoke or enable it from this runbook |
| Inventory | Independent owner-prefix bytes, shared originals, derivatives, drafts, orphan objects, metadata and Auth records; reconcile every page | Unexpected/nested files or incomplete inventory is an incident, not an item to skip |
| Scoped cleanup | Separately approved tooling, photos then backup then Auth; unrelated owner unchanged; server-only secrets stay server-only | Never delete only Auth or only storage metadata; no ad-hoc retries or operator SQL from this QA kit |
| Verify | Independently verify object bytes, metadata, Auth and old-session/write denial; record exceptions and local-device tasks | Partial/nonrepeatable verification cannot issue completion |
| Receipt | Minimal private status: verified steps, pending device/export copies, approved scheduled expiry/exceptions and support incident status | No UUIDs, object names, credentials or photos in public evidence; no global “all copies erased” claim |

### Interruption, recovery and rollback guidance

Photo or Auth deletion cannot be rolled back by clearing a tombstone. Preserve
the claim/write barrier and minimal private stage evidence. Stop competing
workers, verify cessation through an independently enforced fence, and escalate
to the authorized incident owner/security reviewer. Read-only assessor output
does not prove worker death or exhaustive inventory. The dual-review packet
does not authorize recovery or cleanup. Never use TTL, automatic unlock, claim
reset or blind retry to make a stranded account appear healthy.

If restore is separately requested, it requires explicit owner consent and a
new audited operation; restoring an old backup can resurrect deleted photos.
Deletion completion is withheld until a separately implemented recovery executor
and full inventory are independently verified. Users must receive truthful
partial-status communication, not a success receipt because Auth is absent.

## Integration and release gates

This branch adds only tests/helpers, a source guard, branch-only CI, this proof
matrix and a prepended checkpoint. All app/backend code, draft SQL, original
workflows and #195 implementation remain untouched. Do not merge this QA branch
to main. The central owner may review/cherry-pick tests into a development base.

Before real-data invitations: staffed request fulfillment, approved retention
and age/consent decisions, passwordless recent-auth, trusted operator/fencing and
recovery executor, genuine disposable-local service tests, separately approved
hosted lifecycle verification, and shared-device/offline cleanup acceptance are
still required. Issues #190/#194 and #8 retain their separate scopes. No merge,
deployment, service enablement or invitation authority follows from these tests.
