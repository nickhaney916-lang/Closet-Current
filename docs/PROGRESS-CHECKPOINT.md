# Closet Current master development checkpoint

## Local fitting follow-up to PR #32 — October 19, 2026 Pacific

- Isolated branch `feature/local-fitting-landmarks-20261019`, based exactly on
  PR #32 head `1b36749f`; central integration branch left untouched.
- Trim clear padding while retaining every nonzero alpha edge; native-alpha
  previews retain up to 600k pixels; conservative white matting stays at 150k.
- Separate fixed female/male shoulder, waist and hip placement; short hems;
  central mesh identity geometry preserves prints/seams; remove outward hip
  expansion that could clip against the output canvas.
- Optional bounded selfie position/zoom controls remain ephemeral/local and
  reset on removal. Existing layer ordering and dress exclusions preserved.
- Local build and full suite: **977 passed, 0 failed, 3 skipped**. Focused suite:
  **16 passed**. Local browser executables unavailable; attempted download was
  truncated. Browser results must be read from exact-head CI before claiming
  emulation passed. CI includes Android Chromium/iPhone WebKit and 3 licensed,
  SHA-verified photo acceptance/hold cases with screenshot/JSON artifacts.
- No physical phones or fabric-fidelity score. Existing low-resolution figure
  rights, gray base clothing, occlusion and realistic drape remain unresolved.
  See `docs/LOCAL-FITTING-ALIGNMENT-20261019.md` for evidence and limits.
- No merge/deploy, external inference, paid calls, private-photo uploads or
  Drive Duel changes. Original recognition/indexing sources preserved.

## Compatible prepaid ledger and client recovery — October 19, 2026 Pacific

- [Draft PR #17](https://github.com/nickhaney916-lang/Closet-Current/pull/17)
  is an isolated follow-up to PR #13, adapting PR #14's client recovery without
  merging branches. Code `ac423d8e98f35e6845fff7e0d55da46d3bc70f87`.
- PR #13 already stages durable quotas and duplicate/parent replay protection;
  these are not absent everywhere. PR #17 preserves the prepaid pair and
  selected second-photo digest, stable request UUIDs and account-bound source
  checks while adding abortable/bounded client work and status-only retries.
- Local build/full suite: **857 total, 854 passed, 0 failed, 3 skipped**.
  [CI 39275497224](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39275497224)
  **passed all three jobs**: build/854 Node passes/0 failures/3 skips/Deno,
  actual disposable PostgreSQL race/replay/quota checks, actual built-app Pixel
  Chromium/iPhone WebKit emulation and full Style this in both engines, plus
  actual local Supabase CLI/SDK/Auth/RPC and loopback HTTP. Both emulated
  profiles confirmed prepaid pair/stable request IDs, status recovery without
  new generation, cancellation, unchanged photos and zero page errors.
- Local HTTP/SQL checks verified global cap, second-photo binding, accepted
  replay, changed-ID continuation replay, foreign-token denial and held unknown
  outcomes. Temporary services/identities cleaned up. Hosted Supabase=false,
  actual provider calls=0, physical phones=0. The HTTP host is Node, not a
  deployed Deno gateway. Browser evidence artifact: `12196524200`.
- Handoff: `docs/TRYON-CONSOLIDATED-HANDOFF-20261019.md`. PR #7/#11 are included
  ancestors; PR #10 remains separate. Existing PR source branches were not
  modified. Server/SQL files are unchanged from PR #13.
- Both paid approval constants remain false and quota defaults disabled/zero.
  Hosted provisioning, reconciliation/retention and explicit new-generation
  operations, privacy/assets/financial approval, actual AI fidelity and physical
  phones remain release gates. No merge/deploy, costs, hosted SQL, source-photo
  edits, customer uploads or Drive Duel changes.

## Prepaid two-pass HTTP integration and actual local Supabase — October 19, 2026, Pacific

- Isolated PR #13 continues from `26da08cc`. Runtime integration commit
  `5914d8143c313a6a0508ee894113c2ccd65e15f9`; complete Deno options typing
  at `b7e4524be0622ad4b593037bc0ed53a20f1199e0`. Other PR branches untouched.
- The actual Deno entrypoint now constructs the shared HTTP handler, real
  HMAC job signer/verifier, server-only REST RPC transport and coordinator.
  BOTH `RESERVED_PAID_INFERENCE_APPROVED=false` and
  `CHAINED_PAID_INFERENCE_APPROVED=false` remain in source. Environment/body
  flags cannot approve paid calls. No endpoint or hosted SQL was deployed.
- A two-pass root atomically reserves TWO quota units before the first POST;
  continuation uses its prepaid slot without an extra quota unit. A SHA-256
  of the second selected crop binds its slot. Tests reject a one-unit budget,
  changed second image, owner/figure/category changes and reused predecessor.
  Reserved/unknown slots retain quota without automatic expiry/refund.
- Client preflights BOTH source crops before any submission. Stable request
  IDs and rendered-input digests support identical retry/reload while the last
  session record survives; no source pixels stored in sessionStorage. Image
  hashes are computed individually to avoid constructing a giant photo JSON.
  Unsupported shoe/layer changes reuse the provider request identity. Recovery
  after cleared/denied storage or switching attempts is NOT guaranteed.
- HTTP checks online authenticated owner, origin/method, actual 8 MB body
  limit independent of Content-Length, user-bound signed predecessor completion
  and server-chosen model input. Transport/provider errors are sanitized.
- Full local build/suite: **846 total, 843 passed, 0 failed, 3 skipped**.
  Eleven HTTP integration tests and two new budget checks pass. Initial CI
  exposed incomplete inferred JavaScript option types; final explicit handler
  interface resolves Deno check without weakening runtime checks.
- Actual local Supabase integration PASSED in jobs `118115407134` and
  `118116536993`: pinned CLI 2.121.0 stack, actual SDK 2.75.0 Auth sign-in/RPC,
  real Auth verification and REST RPC, real loopback HTTP, prepaid continuation
  at global cap, different-ID continuation replay, foreign-account rejection,
  and unknown-outcome retry hold. Synthetic identities/containers destroyed.
  Hosted Supabase=false, actual provider calls=0, actual phone=false.
- [Final CI run 39269418763](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39269418763)
  at `b7e4524b` passed ALL THREE jobs: build, 843 Node tests passed/0 failed/
  3 skipped, Deno check, actual PostgreSQL races, actual local Supabase Auth/
  SDK/RPC plus loopback HTTP, single-garment mock, Pixel Chromium/iPhone WebKit
  emulation and owned-only Style this save/reload. Both emulated devices report
  stable request IDs, both sources preflighted, whole-outfit budget requested,
  corrupt/stale results blocked and zero page errors. Temporary services were
  destroyed. This is local software/emulation evidence, not real model fidelity.
- Updated ledger integration guide and phone packet. Remaining: approved
  hosted migration/configuration/privilege review, operator reconciliation,
  idempotency-preserving retention, pilot limits and deliberate new-generation
  consent/recovery UX, provider currency cap, licensed assets and privacy terms,
  protected staging, approved actual model fidelity and physical Android/iPhone.
  The shared handler runs through Node loopback HTTP locally; this does not
  prove a deployed Deno gateway or physical device behavior.
- Validation tracks remain **2/4 (50%)**, not overall product/accuracy progress.
  Live inference=0; real phones=0/2. No merge/deployment/costs/customer photos/
  Drive Duel change. Original-photo recognition/storage/indexing untouched.


## Staged durable try-on submission ledger — October 19, 2026, Pacific

- Continued isolated PR #13 from `8206c500`; code commit
  `2936c61ef604163ee112fbd0558136dbbc8e4f58`. No other PR branch modified.
- Added a default-disabled server-only coordinator, injected RPC adapter and
  UNDEPLOYED SQL draft. Atomic global transaction locking protects per-owner
  and global rolling 24-hour job quotas. Request UUID plus payload digest
  binds starts; unique owner/predecessor protects continuations even with new
  request UUIDs. Accepted replays reuse the provider job; reserved/unknown
  outcomes never automatically retry/refund. Lost database acknowledgments
  cannot erase accepted state. No images or signing/provider tokens stored.
- Local full build/suite: **833 total, 830 passed, 0 failed, 3 skipped**.
  Eleven focused coordinator/adapter checks pass; no real inference.
- CI run `39266063180`, disposable PostgreSQL job `118105823401` passed:
  actual PostgreSQL 16 reservations under concurrent workers, per-owner/global
  limits, different-ID continuation replay, owner isolation, denied browser
  roles, unknown provider timeout, and committed-but-lost acceptance response.
  Defaults disabled/zero. Actual SDK=false, hosted Supabase=false, actual
  provider calls=0. No real customer data or hosted SQL changes.
- [CI run 39266063180](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39266063180)
  passed BOTH jobs: 830 Node checks passed, 0 failed, 3 skipped; build and
  Deno check; single-garment mock, Pixel Chromium + iPhone WebKit emulation
  with zero page errors, and owned-only Style this save/reload. Code SHA
  `2936c61e` verified; subsequent documentation commits do not change runtime.
- Read `docs/TRYON-SUBMISSION-LEDGER-DRAFT.md` before integration. This module is
  NOT imported by the live HTTP entrypoint; no hosted ledger exists and paid
  second-pass inference remains hard-disabled. It is not production protection.
  HTTP/SDK integration, reviewed quotas and whole-outfit budget policy, operator
  reconciliation, metadata retention, provider currency cap, assets/consent,
  protected staging, actual provider fidelity and physical phones remain open.
- Four-track validation remains **2/4 (50%)**, not overall product completion:
  software and emulation passed previously; live AI and actual phones untested.
  No merge/deployment/costs/Drive Duel change. Original photos and indexing
  untouched. Regular ChatGPT conversation remains the main coordination thread.


## Parallel multi-garment rendering safeguards — October 19, 2026, Pacific

- Isolated draft PR #13 (`work/multigarment-integrity-phone-qa-20261019`)
  targets draft PR #12, parent `5e9cb665054b022a7ccfeced79ecdcef957b8b1b`.
  PRs #7/#10/#11/#12 and their branches were not modified. The regular
  ChatGPT conversation remains the owner's main coordination thread.
- Published code commits: `43ecc9aede6cdbb856fbca9ce053340d0ed6c299`
  and `f033a0a65d0a7c18757b0613ae1ff98d6e02e148`.
  Fixed signed-job token loss after a processing reply, malformed start
  handling, polling after stale-input changes, and prior successful images
  lingering during failed regeneration. Input snapshots now include owner
  identity. Source crops and each stage output must decode before submission,
  continuation or display. Requests time out without automatic resubmission;
  an HTTP abort does not cancel an already accepted provider job.
- Four behavioral regressions fail against the PR #12 parent and pass with
  the fix. Latest local build/full Node suite: **822 total, 819 passed,
  0 failed, 3 skipped**. Skips are licensed-photo cases that require the
  dedicated pilot fixture, not successful image-quality measurements.
- CI code run `39264519514` at `43ecc9ae` passed full Node suite (816 passed,
  0 failed, 3 skipped), Deno check, mocked single-garment flow, both multi-poll
  Pixel 7 Chromium/iPhone 13 WebKit emulations, and owned-only Style this
  mobile save/reload. Both engines reported zero page errors, corrupt
  intermediate/final images blocked and previous failed previews cleared.
- Follow-up [code run 39264859926](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39264859926)
  at `f033a0a6` **passed every step**: 819 Node tests passed, 0 failed,
  3 skipped; Deno check; single-garment mock; Pixel Chromium/iPhone WebKit
  emulation, including corrupt SOURCE rejection before any start; owned-only
  Style this mobile save/reload. Both engines reported zero page errors.
  Validation-track completion is **2/4 (50%)** using equal weighting for
  software regression, browser emulation, live AI fidelity and actual hardware.
  This is not an overall product-completion or image-accuracy percentage.
  Real provider calls: 0. Physical Android/iPhone runs: 0/2.
- Added `benchmark/MULTIGARMENT-PHONE-PREPARATION-20261019.md` and
  `benchmark/MULTIGARMENT-PHONE-EVIDENCE-TEMPLATE.json` with null/unexecuted
  hardware fields, billing-disabled checks, separate live fidelity phase,
  private evidence requirements and SHA-256 identity comparisons. No
  protected staging deployment, test account or physical phone was provisioned.
- Release blockers remain: approved live provider inference preserving BOTH
  garments, physical Android AND iPhone reports, protected staging, licensed
  model assets, disclosure/retention approval, durable per-user quotas and
  atomic start/continuation idempotency plus provider spend cap. A signed
  stage-one token alone does NOT prevent duplicate continuation submission.
  `CHAINED_PAID_INFERENCE_APPROVED=false` remains unchanged.
- No live inference, billed generations, customer-photo upload, merge,
  production deployment or Drive Duel change. Original-photo storage,
  original-photo-first recognition and wardrobe indexing were untouched.


## Original-source protection for restored outfit records — October 18, 2026, Pacific

- Continued from `422999cc1656910e76cceca55f315a4a74028da5` on draft PR #7.
  Found that capture validated new worker crops but older/restored records could
  still classify a cleaned display tile when their unmasked recognition crop
  was missing. Shared source selection now refuses that fallback for outfit
  records or segmentation hints, including empty/non-string crop values.
- Automatic indexing, editor color preview/Fill missing details, background
  feature review, and its storage callback use the original-source selector.
  Missing source records retain their photos and details with a recovery message;
  they cannot auto-save or bypass the gate through color-only confirmation.
  A valid single-item source and existing valid outfit crop continue normally.
- Background review filters missing-source records BEFORE its eight-item limit,
  so eight incomplete records cannot indefinitely starve later valid garments.
  Save-time checks reject source loss while a draft/storage operation is queued.
- Reproduced failures before fixes: automatic source fallback, editor display
  inference and background queue starvation. Added behavioral checks for no
  inference calls, unchanged source/display photos, continued valid-item
  processing, background skip and storage rejection. Existing synthetic outfit
  fixtures now explicitly provide the raw crops the real worker requires.
- Local build passed; full Node suite **807 total, 804 passed, 0 failed,
  3 skipped**. These verify software behavior, not real-photo mask accuracy.
  Published code: `311a94e6690a6622fd43c174b40be58f43a6ecc0`.
- Verified [mobile run 39194693304](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39194693304):
  every step passed, including actual model inference, outfit handoff,
  persistence and owned-piece swaps; no page errors. The single-item set
  remains 14/14 broad categories, 8 auto-saves, 6 review holds. The actual
  layered-photo case remains 2 uncertain regions, 0 auto-saves, 2 review holds.
  The synthetic styling test confirms all owned swap choices reachable.
  At inspection 24/25 reported workflows succeeded; experimental MODNet was
  still running. No new segmentation accuracy or completed AI try-on claim.
- No production merge/deploy, paid services, Drive Duel changes, original-photo
  replacement, model changes, threshold relaxation or manual-crop requirement.

## Small-source separation recovery and complete owned-piece swap cycling — October 18, 2026, Pacific

- Resumed PR #7 at `ec2103484b2e7e33655ed25183fa03fcc5af6e35`;
  all 25 workflows returned for that checkpoint succeeded. Inspected actual
  mobile run `39192829496`: 14/14 broad single-garment categories, 8 automatic
  saves and 6 color-review holds. Actual layered `validation-0031` still emits
  2 uncertain regions, 0 automatic saves, and no automatic Style this handoff.
  These are distinct datasets; successful CI does not establish mask accuracy.
- Reproduced a valid small/narrow-photo crash in display pinhole repair:
  when either source dimension is below the model mask dimension, optional
  repair threw and could abort outfit processing. It now keeps the original
  mask unchanged and skips repair when independent source pixels are lacking.
  Original RGB, recognition crop, model thresholds and original dimensions
  are preserved. Synthetic 16x16, 16x64 and 64x16 regression inputs verify
  unchanged source/mask/recognition pixels, not real-photo accuracy gains.
- Reproduced a Style this swap bug: the current garment was excluded from
  choices, so the previous-item cursor was always absent; taps bounced between
  two high-ranked pieces. Per-slot transient history now visits all eligible
  owned pieces before repeating. Deleted/incompatible pieces are filtered,
  the pinned item is preserved, and swaps do not save or mutate garments.
- Both new regressions failed before fixes. Build passed; full Node suite:
  **803 total, 800 passed, 0 failed, 3 skipped**. Extended actual touch-browser
  UI test to tap through two cycles of four shoes and assert pinned top,
  unchanged garment records, and no implicit outfit saves.
- Published code checkpoint: `cd594d682d76a5482192d467f5e70fd1ec7232fc`.
  Local Chromium was unavailable, but GitHub mobile run
  [39194138916](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39194138916)
  passed every step. `NEW_ITEM_STYLE_MOBILE` confirmed
  `allOwnedSwapChoicesReachable=true`, `anchorPersisted=true`,
  `previewNotAutoSaved=true`, `reloadVerified=true`, and `pageErrors=0`.
  This uses a synthetic wardrobe in a 390x844 touch browser, not a physical phone.
- The same code's actual model run retained 14/14 broad single-item categories,
  8 automatic saves and 6 review holds. The layered-photo result remains
  2 uncertain candidates, 0 automatic saves and 2 pending review, with no page
  errors. This verifies baseline behavior, not improved segmentation accuracy.
  At inspection 24/25 reported workflows had succeeded; the experimental
  MODNet comparison was still running. No paid inference, production
  deployment/merge or Drive Duel changes.
- Remaining: actual layered-photo segmentation/automatic indexing accuracy,
  independent reference masks, physical-phone validation, and real AI try-on
  are not completed by these software fixes. No paid provider run authorized.

## Real Supabase JavaScript SDK deletion adapter integration — October 18, 2026, Pacific

- **Verified a new server-adapter milestone**, all on the draft PR #7
  development branch. Added
  `scripts/test-local-supabase-sdk-account-deletion.mjs` and expanded
  `.github/workflows/account-deletion-storage-local.yml`. The pinned
  Supabase JS SDK `2.75.0` is installed only into the disposable runner,
  not the application's deployed browser files.
- GitHub Actions starts an isolated local Supabase CLI/Auth/Storage/PostgREST
  stack, applies the existing backup schema and **undeployed draft**
  deletion write barrier to the local database, then creates two
  independently signed-in synthetic accounts. The test uses **actual
  SDK** methods with separate service-role and password clients:
  `auth.getUser(token)`, `auth.admin.getUserById`,
  `signInWithPassword`, `rpc('begin_closet_account_deletion')`,
  `storage.list`/`storage.remove`, backup table delete/select and
  `auth.admin.deleteUser`.
- Before deletion, the default-disabled coordinator **rejects** a request
  without making destructive SDK calls; an incorrect password cannot
  pass verified reauthentication. A test-only `enabled:true` coordinator
  then exercises the full cleanup of **only synthetic local user A**:
  original photo removal, private backup deletion, Auth deletion last,
  complete verification, no cross-account loss, and blocked stale-token
  upload. Synthetic user B's photograph and backup remain present.
- Independently, the previously verified Storage REST test continues
  to pass: RLS-filtered foreign DELETE no-op checked for actual file
  survival, late upload and backup writes blocked after lock, ordinary
  other-owner writes allowed, and two-photo **interrupted cleanup**
  recovered under the idempotent tombstone.
- [Verified run 39188315048](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39188315048),
  tested code commit `853aaf175033c55249429d3afbfba628a7f76f6d`:
  `LOCAL_SUPABASE_SDK_ACCOUNT_DELETE` reported
  `actualSdkAuth=true`, `actualSdkStorage=true`,
  `secureFreshPassword=true`, `privatePhotoRemoved=true`,
  `backupRemoved=true`, `authUserRemoved=true`,
  `otherOwnerIntact=true`, `staleTokenBlocked=true`,
  `clientSideDeletionAvailable=false`, `hostedSupabaseAccess=false`.
  `LOCAL_SUPABASE_STORAGE_ACCOUNT_DELETION` additionally reported
  `interruptedCleanupRecovered=true` and all other safety flags true.
  Both integration steps and temporary-container cleanup passed.
  At inspection **25 of 26 PR checks passed**, with one unrelated
  experimental-model check still in progress.
- **The actual customer deletion endpoint remains hard-disabled HTTP 503**.
  The draft SQL was NEVER applied to a hosted Supabase project.
  `enabled:true` occurred only inside the local test against ephemeral
  disposable identities. No real account, wardrobe photo, Drive Duel
  database, paid service or production deployment was touched.
- **Still required before a live self-service deletion release:** audited
  deployment/configuration and privilege review, hosted environment
  approval, passwordless/magic-link recent-auth proof, interruption retry
  operations/support, final privacy/retention terms, explicit owner
  authorization, and physical-phone acceptance tests. The successful
  local suite is not proof that these are complete.



## Local Supabase deletion end-to-end + interruption recovery — October 18, 2026 (Pacific)

- **Completed the previous red development test priority on draft PR #7.**
  The actual local Supabase CLI 2.121.0 stack (Auth, Storage and
  PostgREST) was started in a temporary GitHub Actions runner, using
  **synthetic users only**. Existing `supabase/cloud-backup.sql`
  and `supabase/design/account-deletion-write-barrier.DRAFT.sql` were
  applied to that local stack, **not** to either hosted project.
- The first real Storage run revealed a legitimate RLS behavior:
  a foreign-account Storage DELETE request can produce **HTTP 200
  with an empty array** while deleting nothing. Updated
  `scripts/test-local-supabase-storage-deletion.mjs` to accept
  that no-op result **only if it is empty**, then independently
  list the target owner's private objects and assert their photo still
  exists. An HTTP status alone never establishes deletion.
- A second synthetic account workflow confirms real owner-scoped
  private-photo reads and uploads, service-role-only lock RPC access,
  locked owner's photo INSERT/UPDATE and backup RPC rejection,
  normal writes for a different user, Storage API removal with
  two separate empty-list verifications, backup removal,
  final Auth deletion, and continued lock protection against an
  expired/reused Auth identity's still-valid access token.
- **Interrupted cleanup recovery was independently verified**: a
  third synthetic user's two photos and backup were created;
  the lock was acquired; only the first photo was removed
  (simulated interruption); a fresh RPC request reacquired the
  idempotent lock; attempted new uploads remained blocked;
  the remaining photo was removed, the backup and Auth identity
  were deleted, and unrelated user objects remained intact.
- Added an early `node --check` to
  `.github/workflows/account-deletion-storage-local.yml` so
  malformed test scripts fail before expensive container startup.
  An initial recovery-test run failed only because of a syntax error
  in a test label; it was corrected before final verification.
- **Verified** [local Supabase integration run
  39186780893](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39186780893)
  at code commit `d70708e9e05ee4de387af867bfcf379205837d14`:
  `LOCAL_SUPABASE_STORAGE_ACCOUNT_DELETION`:
  `realSupabaseStorageHttp=true`,
  `realSupabaseAuthHttp=true`,
  `userScopedStorage=true`,
  `lockStopsUploads=true`,
  `lockStopsBackupRpc=true`,
  `otherOwnerPreserved=true`,
  `privatePhotoRemoved=true`,
  `postAuthTombstonePreserved=true`,
  `interruptedCleanupRecovered=true`,
  `localOnly=true`; no page/console error was reported by the
  integration script. At review, 25/26 code-commit checks were
  successful, with only an unrelated experimental model check running.
- **Boundary:** This verifies real Supabase services **locally**,
  not a hosted disposable Supabase project or actual production
  configuration, service key rotation, operator-approved deletion UX,
  passwordless reauthentication, full audit/retention policy, or
  a permanent background recovery worker. It does NOT mean real
  user self-service deletion can be enabled. The actual Deno
  `supabase/functions/account-delete/index.ts` still unconditionally
  responds HTTP **503** and has no admin client or deletion action.
  Additional security/privacy review and owner's explicit approval
  are still required before any hosted migration/deployment.
- No real accounts/photos altered, no hosted SQL changes, no costs
  approved, no production merge/deploy, and no Drive Duel changes.



## Local actual-Supabase Storage deletion validation — October 18, 2026 (Pacific)

- **Partially completed, not verified end-to-end.** Existing connected
  hosted projects are Closet Current and Drive Duel only; a disposable
  hosted project was NOT created, to avoid touching production or incurring
  a possible new subscription cost.
- Added `scripts/test-local-supabase-storage-deletion.mjs` and
  `.github/workflows/account-deletion-storage-local.yml` at
  `6f050c9f73c042ec027f742c8179f35dd451fceb`.
  The workflow pins Supabase CLI 2.121.0, initializes a local Docker
  Supabase Auth/Storage/PostgREST stack in an ephemeral GitHub runner,
  applies existing `supabase/cloud-backup.sql` and the
  **undeployed** deletion-write-barrier DRAFT SQL only to that local
  instance, and intends to test disposable users, private photo uploads,
  cross-account isolation, late-write denial, cleanup, and Auth deletion.
- [First local Supabase integration run 39183183500](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39183183500)
  **failed**. Local Supabase stack initialization and both SQL
  applications passed, and the test progressed through local
  user registration/login and initial private uploads. It failed
  at the cross-account Storage deletion assertion because the actual
  Storage API returned **HTTP 200 with an empty array**, while the
  original test expected HTTP 4xx. This is an observed
  **RLS-filtered no-op** response shape, not evidence that a foreign
  photo was removed; the test did not reach its independent
  post-request object-existence check. Real deletion compatibility
  remains unproven until this assertion is corrected, rerun and the
  entire suite passes.
- Two attempts to update the new GitHub test assertion were blocked by
  the connected GitHub tool's safety checks; no bypass was attempted.
  **The local-storage-auth-integration check is red**, so this priority
  must remain in progress. A correct follow-up test should recognize
  either an HTTP 4xx or an HTTP 200 empty result, but **in both cases
  require an independent owner-scoped Storage listing showing that the
  photo still exists**. It must then validate the lock, safe cleanup,
  backup deletion, Auth deletion and tombstone retention. Do not rely
  on API HTTP status alone to conclude deletion or account isolation.
- No live Supabase schema modifications, hosted user deletions, paid
  services, production merges/deployments or Drive Duel changes.
  Account-deletion HTTP entrypoint remains permanently disabled (503).


## Staged Supabase deletion server adapters + restricted RPC — October 18, 2026 (Pacific)

- **Next development priority implemented and verified** on the draft
  Closet Current PR #7 integration branch, no merge/deploy. Added a
  **service-role-only SQL invoker wrapper**
  `public.begin_closet_account_deletion(uuid)` to the *undeployed*
  `supabase/design/account-deletion-write-barrier.DRAFT.sql`. It uses
  an explicit privilege revoke from PUBLIC/anon/authenticated and
  requires `service_role` permissions for underlying private lock
  function. The PostgreSQL smoke suite checks both ordinary-user
  denial and privileged invocation, preserves write isolation and
  tests a concurrent photo-upload / account-deletion transaction.
  This is NOT a live Supabase migration or a publicly callable
  deletion endpoint.
- Added `supabase/functions/account-delete/supabase-adapters.mjs`,
  a server-only, injected-client adapter for the *existing disabled*
  deletion coordinator: online `auth.getUser(bearer)` identity
  verification, trusted-account-email password reauthentication using
  a **separate non-persisting password client**, restricted
  `begin_closet_account_deletion` lock RPC, page-one owner-prefix
  Storage list/remove APIs, private backup deletion/verification, and
  privileged Auth deletion with an explicit 404 check. The adapter
  refuses missing/malformed account IDs, wrong-account password
  proof, unsafe file paths, failed server operations or unverifiable
  deletion. No secrets, initialized SDK clients, HTTP entrypoint
  integration or real destructive calls were added to client assets.
- Added `tests/account-deletion-supabase-adapters.test.mjs` with
  synthetic SDK doubles for >200 photo objects, wrong password or
  owner, absent lock, Storage errors and fake-success removal,
  malformed/foreign paths, and failed Auth verification. Also added
  `tests/account-deletion-entrypoint-disabled.test.mjs` to assert the
  actual `supabase/functions/account-delete/index.ts` stays
  unconditionally HTTP **503** with no privileged code or secrets,
  and the browser does not import the server adapters.
- Verified [disposable PostgreSQL + coordinator/adapter run
  39182636169](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39182636169):
  **22 focused tests passed, 0 failed**, SQL permission and tombstone
  gates passed, `ACCOUNT_DELETION_WRITE_RACE` in-flight upload
  serialization/late-write denial/unrelated-owner isolation all passed.
  Verified [full Node CI run
  39182636121](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39182636121):
  **794 total, 791 passed, 0 failed, 3 skipped**; app build passed.
  Tested implementation head:
  `a9c5aaa155b92560612898ec631e87ed5d3e78a3`.
  Other non-deletion experimental checks are separate.
- **Critical release blockers remain:** These SDK adapters are only
  *mock-tested* and are not instantiated in a deployable endpoint.
  SQL was tested against isolated PG16, **not** the actual Supabase
  Storage API or a disposable full Supabase project. Before activation,
  validate client/policy/trigger compatibility, in-flight object
  byte/orphan cleanup, reauthentication limitations for passwordless
  accounts, private admin credentials, expired JWT/session liveness,
  interruption/retry recovery, final deletion/retention terms, and a
  safe deletion-request/support route. User-facing account deletion
  stays unavailable; the Deno entrypoint always returns HTTP 503.
- No paid services, no live database write, no real account/photo
  deletion, no production deploy/merge, no Drive Duel changes.



## Disposable-database deletion lock design and concurrency validation — October 18, 2026 (Pacific)

- **Next engineering priority completed as a staged, undeployed design.**
  Added `supabase/design/account-deletion-write-barrier.DRAFT.sql`:
  server-only `closet_internal.deletion_locks` owner-UUID tombstone
  table **without an Auth FK** (so the lock survives Auth deletion
  and unexpired JWTs); privileged
  `closet_internal.begin_account_deletion(uuid)` grants execute **only to
  service_role**; and PostgreSQL transactional advisory-lock guards on
  both `public.closet_backups` INSERT/UPDATE and
  `storage.objects` INSERT/UPDATE for `closet-private` owner prefixes.
  Existing Storage DELETE and backup DELETE remain available for
  ordered cleanup. Server-wide migration not generated, applied or deployed.
- The guards serialize a deletion lock with in-flight backup writes and
  Storage metadata uploads; new uploads/backup changes are blocked after
  the tombstone commits. Storage renames between buckets/owners check both
  OLD and NEW paths; caller-selected account IDs do not authorize deletion.
  Tombstones must **not** be automatically cleared when Auth users disappear.
  Note: metadata transaction serialization is verified; separate
  Storage object-byte orphan handling, real upload service behavior,
  older signed-JWT endpoint authorization and operational tombstone
  retention have NOT been independently validated.
- Added actual disposable PG16 smoke test
  `tests/account-deletion-lock-postgres.sql` and coordinated
  two-process PG transaction race
  `scripts/test-account-deletion-lock-race.mjs`.
  CI `.github/workflows/account-deletion-lock.yml` starts an isolated
  postgres:16 service, applies only the DRAFT SQL to this isolated database,
  tests private lock grants, per-owner isolation, blocking late writes,
  allowing cleanup deletes, guarding cross-bucket moves and surviving
  simulated Auth deletion; then starts an upload transaction that holds
  the advisory lock, verifies deletion waits for COMMIT, prevents the
  next upload and permits an unrelated owner's write.
- Verified [disposable Postgres run 39180835112](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39180835112)
  at code commit `be454dbaff236f71a0362928211de5b61fac27b3`:
  `ACCOUNT_DELETION_DATABASE_GUARD: passed`;
  `ACCOUNT_DELETION_WRITE_RACE`:
  `inFlightUploadSerialized=true`,
  `lateWriteRejected=true`,
  `otherOwnerUnaffected=true`;
  all **12 account-deletion coordinator synthetic tests passed, 0 failed**.
  The full application `simulate` GitHub check at this commit also
  passed. Other unrelated experiment checks may complete separately.
- The real `supabase/functions/account-delete/index.ts` still returns
  HTTP **503**, and no live server adapter is wired up. It cannot read,
  export, delete or wipe any real account. **Do not promote to a live
  migration or enable UI:** a disposable-project Supabase Storage upload/
  RPC compatibility test, secure verified-bearer/fresh-password server
  adapters, server-enforced lock activation from verified identity,
  complete storage byte cleanup/orphan inspection, irreversible-confirm
  UX, support process, final legal/guardian policy and actual device
  acceptance are still required before account deletion can be offered.
- No change to production, paid services, real user data or Drive Duel.



## Server-only safe account deletion coordinator — October 18, 2026, Pacific

- **Completed the server algorithm and synthetic regression priority** on
  draft PR #7 development branch. Added
  `supabase/functions/account-delete/deletion-coordinator.mjs` with
  strict 2-factor-of-action gates: same-account verified bearer identity,
  password reauthentication, exact `DELETE MY ACCOUNT` phrase, and a
  required durable server-enforced per-account write lock. Caller-submitted
  IDs/metadata are ignored for authorization or deletion scope.
- Once all gates pass, the coordinator lists max-100 files per page in
  `closet-private/{ownerUUID}/`, validates exact 64-hex SHA-256
  `.jpg` filenames, deletes photo batches only via Storage API,
  verifies removal actually happened (does not trust status-only success),
  double-checks no remaining photos, then removes/validates private backup
  and deletes/verifies Supabase Auth user **last**. Failures stop, rather
  than falsely claiming full deletion. It never includes service-role
  secrets in browser code. The orchestrator uses injected mock adapters,
  **not connected live Supabase delete operations**.
- `supabase/functions/account-delete/index.ts` returns HTTP **503**
  unconditionally; NO deployment, migration, user-facing deletion button,
  Auth deletion or photo deletion. Real account deletion is NOT yet
  available. In particular, the required **durable write-lock adapter**
  has not been designed/deployed across cloud backups and concurrent
  photo uploads, and reauthentication/Storage/admin adapters are not
  wired to the Supabase project. An environment variable alone cannot
  enable the feature.
- Synthetic-only
  `tests/account-deletion-coordinator.test.mjs` covers >200 photos
  over several pages, disabled/rejected/wrong-account confirmations,
  nonexistent lock, fake-success Storage responses, missing photos,
  interrupted cleanup, backup failure, and inability to verify final
  Auth deletion. No user data was touched.
- The cloud workflow now triggers on the new server module/tests and
  runs the entire Node and multi-browser account-isolation recovery
  suite. See `docs/ACCOUNT-DELETION-DEVELOPMENT-GATE-20261018.md`
  for explicit fail-safe and release blockers.
- This remains a **development milestone, NOT a completed customer
  deletion process**. Next priority is to design/test a durable
  deletion lock integrated with private backup writes and Storage
  uploads, then owner-approved live disposable-account validation.
  Final legal terms, verified support/deletion channel, SMTP, redirects
  and real-phone pilot tests remain open.
- Absolutely no production deployment/merge, paid AI, Drive Duel changes,
  or real account/photo deletion.



## Pilot photo-data notice and signup acknowledgment — October 18, 2026, Pacific

- **Next developer-ready pilot privacy priority implemented** on draft PR #7
  only. Added public `public/pilot-data-notice.html` with factual,
  deliberately **nonlegal/nonfinal** explanation of browser and private
  cloud storage, model processing, owner-account separation, sync delays,
  unchanged original photo preservation, lingering private photos after
  clothing-item deletion, and unavailable self-service full account
  deletion. Signup screen links to the notice; signed-in "My account"
  adds "Privacy & my data". No contact channel, deletion success or
  privacy compliance is falsely advertised.
- Added `public/pilot-notice.js` with
  `pilot-data-notice-2026-10-18` version and fail-closed new-signup
  acknowledgment. New signups must actively check that they reviewed
  the notice before any Auth signup request; existing-account login
  and password recovery do not need a new checkbox. Signup
  `user_metadata` gets the version and ISO review timestamp.
  **Important:** user metadata is editable and is NOT a legal audit log,
  server authorization or marketing permission; no ads/promotional
  opt-in or approved legal terms were introduced.
- Added focused `tests/auth.test.cjs` and expanded
  `scripts/test-auth-pilot-mobile.mjs`. Verified code commit
  `4db3578e6d63a7fa2777f3d08670f75598bb0193`:
  [full Node run 39175897454](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39175897454):
  **772 total, 769 passed, 0 failed, 3 skipped** and build passed.
  [cloud/auth mobile workflow 39175897437](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39175897437):
  controlled multi-device recovery and emulated 390×844 Auth passed,
  `pilotNoticeReadable=true`, `signupBlockedWithoutNoticeReview=true`,
  `pilotNoticeVersionRecorded=true`, `noMarketingOptIn=true`,
  `pageErrors=[]`. No real signup email sent, physical phone used,
  live production Supabase Auth settings changed, or legal approval
  obtained.
- Read-only Supabase management connection confirmed project
  `hlkgymugtfbirlpunsra` `ACTIVE_HEALTHY`. Cataloging schema
  showed RLS enabled for `public.closet_backups` and
  `storage.objects`, with policy named `closet_photos_delete`
  for authenticated users. **This is NOT proof that every user can
  request and finish complete account deletion.** No user content
  inspected, storage object deleted, SQL mutated or accounts removed.
- Owner/release checklist:
  `docs/PILOT-DATA-CONTROL-RELEASE-GATES-20261018.md`.
  This informational notice does **not** satisfy final operator-approved
  privacy/terms, legally verified consent retention, full cloud image
  garbage collection, verified deletion of private photo objects +
  metadata + Auth identities, actual support/deletion request route,
  age/guardian rules, external inbox setup or physical-phone checks.
  **Broader pilot invitations remain blocked.**
- No merge to `main`, production deployment, paid services,
  customer data access, or Drive Duel modifications.



## Pilot sign-in resilience and guarded password recovery — October 18, 2026, Pacific

- **Development-priority code and browser behavior verified**, on draft
  Closet Current PR #7 only. No production merge/deployment, paid services,
  changes to Drive Duel or reads of real subscribers' personal data.
- Fixed `public/auth.js` transient saved-session restoration:
  transport/offline errors, AbortError timeouts, HTTP 408/429 and HTTP 5xx
  **no longer delete the stored refresh token**. The private closet remains
  locked while offline or unverified, with a single conditional
  **Retry saved login** action after connectivity returns. A verified
  invalid/revoked refresh token still clears the saved session and requires
  fresh login. Auth requests remain serialized/bounded.
- A successful HTTP 200 containing a user ID alone no longer unlocks a
  private closet: the response must contain a nonempty access token.
  Password-recovery completion also verifies the updated account ID matches
  the account established by the recovery-token verification. No new
  auth provider, emails, signup method or permission bypass was added.
- Added coverage to `tests/auth.test.cjs` for offline refresh, retry,
  account isolation, malformed successful responses, server failures,
  timeouts, verified revoked sessions and concurrent retry safety.
  Added synthetic-only `scripts/test-auth-pilot-mobile.mjs` with
  390×844 touch viewport, and enabled it in existing
  `.github/workflows/cloud-backup-flow.yml`.
- Verified [cloud & pilot Auth run 39173979696](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39173979696)
  on code commit `fe92d6dff6ccbd758f67deaac3cccf0edbeec212`:
  Node test suite **770 total, 767 passed, 0 failed, 3 skipped**.
  Controlled-browser multi-device cloud recovery passed, and
  `AUTH_PILOT_MOBILE`: `offlineSessionRetained=true`,
  `manualRetryRestoredSameUser=true`,
  `rotatedRefreshTokenSaved=true`,
  `tokenlessSuccessRejected=true`,
  `mismatchedRecoveryRejected=true`,
  `noPrivateClosetUnlockWithoutSession=true`,
  `pageErrors=[]`.
- **Open pilot blockers, NOT verified:** real inbox signup/confirmation,
  resend and recovery delivery, live Supabase sender/domain configuration
  and exact redirect allowlist, chosen Cloudflare custom-domain/GitHub Pages
  canonical email destination, and installation/login on a physical phone.
  The client STILL requests email callback links to
  `https://nickhaney916-lang.github.io/Closet-Current/`, while historical
  `docs/AUTH-EMAIL-READINESS.md` lists Cloudflare
  `https://closet-current.pages.dev/` as deployed production. Do not
  silently change the redirect before confirming Supabase URL Configuration,
  email templates and owner-chosen app origin. The real-inbox test may send
  email and must be authorized explicitly; none was sent here.
- **Next priority:** pilot user consent/terms, privacy & account deletion
  readiness and real-device installation checks before any friends/family
  invite; keep signup and real emails behind explicit approval.



## Work-session consolidation and cloud backup recovery — October 18, 2026, Pacific

- The separate ChatGPT Work chat exhausted its workspace. Its **isolated**
  recognition branch `work/garment-instance-recognition-20261018` remains
  **preserved, unmerged** at `ab2323f1d0dc4979cb33a1ffcfc26989065cf488`,
  three commits after `8053b9104980099f1904512286d81b041652e41f`.
  Those commits cover experimental DeepFashion proposal coverage,
  experimental LIP socks/pants/jumpsuit class export, and original-RGB
  color sampling without stride aliasing. The Work tip has 2 successful
  available checks (simulate, inference); its local verification and caveats
  are documented in `docs/WORK-RECOGNITION-HANDOFF-20261018.md`.
  **Zero independent ground-truth garment masks; no image-recognition
  improvement percentage is claimed.** This normal ChatGPT conversation is
  the only active workstream; closing the other chat tab is a user UI action.
- Main development priority completed on draft PR #7:
  verified actual `public/cloud-backup.js` client in its comprehensive
  controlled-browser recovery workflow. Extended
  `scripts/run-cloud-backup-flow.mjs` to save a synthetic unsorted photo,
  synchronize it to a second authenticated session, explicitly confirm
  `Outerwear` and `Green` with `colorSource='user'`, synchronize back,
  retain exact original/recognition image data, survive reload, and reject
  other-account access.
- Enabled `.github/workflows/cloud-backup-flow.yml` for the **development
  branch**, so changes to public client or backup tests trigger multi-device
  verification before merging. Browser test keeps account records in a
  controlled HTTP backend and uses only synthetic/authorized licensed
  fixtures, not real subscriber data.
- First CI attempt exposed an **existing synthetic multi-device edit
  conflict** (local base revision 17 versus remote 19). The product
  appropriately refused silent replacement and displayed **Keep both
  versions**. The older recovery test incorrectly waited for an automatic
  clean sync. Updated it to exercise the *real user-visible* conflict
  control and then verify both sides are preserved. Do not remove the
  protective merge conflict safety check from production.
- **Verified** [private cloud-recovery Actions run 39173019247](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39173019247)
  for code commit `715de4d3c4149880208a0efe644f6d194c99def1`:
  full 765 Node tests (762 passed, 0 failed, 3 skipped) and the browser
  recovery scenario succeeded. `confirmedUnsortedCloudSync=true`,
  `confirmedUnsortedOriginalPreserved=true`,
  `confirmedUnsortedReload=true`,
  `confirmedUnsortedOtherAccountIsolated=true`,
  `conflictingVersionsPreserved=true`,
  `corruptRestoreKeepsLocalPhotos=true`,
  `lostSaveResponseDoesNotDuplicateCopies=true`,
  `accountIsolation=true`, `pageErrors=[]`.
- This tests production browser **client code** against a simulated
  authorization/storage/revision backend; it does **not** independently
  retest live Supabase privacy policies or family accounts in this run.
  Existing historical live disposable-account/RLS tests are described
  in `docs/CLOUD-BACKUP.md`.
- No paid services authorized, no real wardrobe inspected, no production
  merge/deployment, no modifications to Drive Duel.
  **Next remaining pilot work:** manually confirm sign-in/email delivery
  and physical-phone persistence on real supported devices, after careful
  staging/privacy review; do not assume the controlled browser test proves
  those external systems.



## Unsorted Clothing two-field review queue — October 18, 2026, Pacific

- **Next customer-usability priority implemented** on the shared Closet Current
  development branch, still draft PR #7, without touching the separate
  ChatGPT Work session's image-recognition/model branch. No production
  merge/deploy, paid services or Drive Duel changes.
- Existing **Unsorted clothing (N)** button in My Closet now starts an
  inline modal review of each uncategorized saved clothing item. It shows
  the saved garment photo, optional source/original photo when different,
  a large category selector and a color selector. **Both are required human
  choices** (with no auto-accepted predictions); optional subtype, fabric,
  fit, brand, size and season details remain for later. It supports
  **Save & next**, **Skip for now**, and **Close** without adding an app
  screen, extra tabs, mandatory manual crop, or paid recognition.
- `public/closet-review-engine.js` implements fail-closed human category
  and color confirmation, immutable photo/reference preservation, untrusted
  old subtype/sleeve hint reset and model-color-provenance removal. An
  explicit saved color gains `colorSource='user'` and a confirmed category;
  the original photo and recognition reference are never regenerated.
  `public/closet-browser.js` saves the revised existing item ID using
  the normal authenticated IndexedDB `writeAll` path, rerenders counts and
  automatically opens the next unsorted item. Skips are session-only, never
  delete or categorize a garment, and can be revisited later. Modal
  actions have 52px targets in `public/style.css`.
- Added `tests/closet-review-queue.test.cjs` (five focused unit tests)
  exercising missing category/color rejection, subtype and sleeves reset,
  preservation of source photo and metadata, skip counts and no paid network
  calls or AI reclassification.
- Extended `scripts/test-style-my-new-item-mobile.mjs`: synthetic,
  account-local garments, previously suggested unconfirmed color, mandatory
  manual category and color selection, validation preventing incomplete save,
  automatically opening the next saved garment, skip-and-return, reloading
  the page and checking the original garment pixels/reference unchanged.
  This is an emulated **390×844 browser touch viewport**, not an actual
  physical phone or measured camera recognition accuracy.
- Verified [full Node run 39171919906](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39171919906):
  **765 total tests, 762 passed, 0 failed, 3 skipped**; app build passed.
  Verified [mobile-browser run 39171923738](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39171923738):
  all stages passed, `NEW_ITEM_STYLE_MOBILE`
  `unsortedCategoryColorSaved=true`,
  `unsortedQueueSkipResumes=true`,
  `originalUnsortedPhotoPreserved=true`, `pageErrors=0`.
- The previous real-photo clipping and recognition accuracy limitation
  remains unchanged and is being addressed separately in ChatGPT Work.
  **Next priority** in this main conversation: verify pilot reliability
  of cloud backup/account sync, error recovery and safe save behavior,
  without changing user data or deploying to production.



## Exact-item Home → closet navigation — October 18, 2026, Pacific

- **Customer usability priority completed** on draft PR #7 integration
  branch; separate ChatGPT Work session continues AI garment recognition
  independently on its own branch. No model/segmentation, paid service,
  production merge/deploy or Drive Duel code changed.
- Home "Fresh in your closet" cards previously performed a **name search**
  and opened the closet. This was ambiguous when two garments had the
  same name and could be filtered away by a stale selected outfit slot,
  item subtype, season, sleeve selection, or category filter.
- Updated `public/navigation.js`:
  cards now carry the exact saved garment `data-item-id`, clicking one
  first verifies that ID still exists in the current account's items,
  clears stale search, category, sleeve, season and outfit-slot filters,
  switches the existing closet to its rack presentation, centers **that
  precise garment** by ID, focuses its card for keyboard and accessibility
  context, and scrolls to the current collection. No extra tab or
  mandatory review step was introduced. Missing/deleted IDs fail closed
  without navigation to a falsely matched name. Stored photos and item
  indexing are not edited by browsing.
- Extended `scripts/test-style-my-new-item-mobile.mjs` with a
  **390×844 simulated mobile touch** scenario: seed a second saved item
  with an identical name, set stale Shoes/Winter/sleeve/slot filters,
  tap the original item's home card, then assert that the correct ID is
  active and focused, all five items are browsable, all stale filters
  are reset, rack view is visible, and the original garment record is
  byte-for-byte unchanged. Existing one-piece swap/persistence assertions
  remain.
- Verified [full Node run 39171103763](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39171103763):
  **760 total, 757 passed, 0 failed, 3 skipped**, production build test
  passed. Verified [mobile browser run 39171107378](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39171107378):
  all workflow stages passed, browser log
  `NEW_ITEM_STYLE_MOBILE` reported `recentGarmentExactOpen=true`,
  `duplicateNameSafe=true`, `oldFiltersCleared=true`,
  `anchorPersisted=true`, `directOneTapSwap=true`,
  `reloadVerified=true` and `pageErrors=0`. This is a simulated
  touch viewport, **not an actual phone acceptance test**.
- Code revision verified: `485104ba41bec026cb33eef566a3d8d93eec0480`.
  At checkpoint creation 25 of 26 CI checks had passed; the remaining
  experimental image-model comparison was not relevant to this UX change
  and had not yet completed.
- **Next user-experience priority:** simplify Uns​orted clothing review
  and visible counts without expanding the main dashboard, then verify
  backups/account sync before the broader family-and-friends pilot.
  Real worn-photo recognition accuracy remains a separate Work task and
  is not inferred from these navigation tests.



## Same-card one-piece swaps in Style This — October 18, 2026, Pacific

- This primary conversation continues **customer UX only**, while a separate
  ChatGPT Work conversation handles experimental garment recognition on its
  own branch. Shared integrated dev branch remains
  `fix/photo-clarity-high-quality-downsampling-20261016`, draft PR #7.
  Preserve other developer branch heads and do not merge/deploy production.
- **Next UX priority implemented**: `public/closet-stylist.js` now displays
  "Swap top", "Swap bottoms", "Swap shoes" or "Swap layer" directly on each
  owned-clothing styling option when there is a compatible alternative.
  `public/closet-stylist-engine.js` offers safe alternatives drawn **only
  from current saved closet items**, never invented/shop items. It prevents
  swapping the new anchored garment, silently changing other outfit slots,
  or converting a dress to separates inside one-piece swaps.
  On swap, stale trend citations are cleared. The new selection remains
  an **unsaved preview** until the person taps "Save outfit";
  the full board remains accessible for larger edits. 50px tap targets
  and two-column controls on smaller screens in `public/style.css`.
- Added five Node tests in `tests/closet-stylist.test.cjs` for anchored
  new tops/shoes, dress safety, deleted/unowned items, source-record
  preservation and touch UI. Extended
  `scripts/test-style-my-new-item-mobile.mjs` to test a 390×844
  simulated touch viewport: direct one-tap swap, zero premature saves,
  explicit Save outfit, separate Outfit builder one-piece swap,
  saved-look reload, and original clothing photo/record unchanged.
- Verified [complete application suite run 39170560017](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39170560017)
  at code commit `b591d9c19e1bcbc4e2b2fd572a332c5b7d222a3b`:
  **760 Node tests total, 757 passed, 0 failed, 3 skipped**; build passed.
  The initial cross-realm Node assertion issue was corrected; no model
  or customer behavior was changed by that test fix.
- Verified [390×844 mobile-browser run 39170430822](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39170430822)
  at immediately preceding code commit
  `80331dd612c74919553e52bc8b242c85c829aa94`:
  **all mobile stages passed**, including
  `NEW_ITEM_STYLE_MOBILE` `directOneTapSwap=true`,
  `previewNotAutoSaved=true`, `directSwappedOutfitSaved=true`,
  `onePieceSwapSaved=true`, `reloadVerified=true`, zero page errors.
  The same unchanged UX code runs at the later test-only checkpoint.
  The later rerun can independently confirm it as well.
- This is a **functional UX flow** verification, not a real-physical-phone
  test or improvement in actual worn-photo garment separation.
  Real-photo independent human masks remain unavailable, so those
  garment-clipping percentages cannot be asserted here.
- Next main-conversation priority: reduce manual steps and improve clarity
  of closet organization, outfit saving, account sync and everyday photo
  review. The Work branch independently addresses original-photo garment
  instance segmentation. No paid inference, no production merge/deploy,
  no Drive Duel changes.



## Category-correct whole-outfit scoring + separate footwear readiness — October 18, 2026, Pacific

- **Two next development priorities implemented on draft PR #7 only.**
  Category-vs-localization accuracy: updated
  `benchmark/physical-garment-inventory.mjs` to optimize a second,
  category-constrained IoU assignment independently from broad localization.
  Thus a blazer labeled Top can overlap the correct physical blazer but
  **cannot count as correctly categorized**; a second correctly labeled
  outerwear prediction is not incorrectly crowded out by a higher-IoU
  wrong-category prediction. Report includes
  `categoryConstrainedMatchedGarments`,
  `categoryConstrainedRecall`,
  `supportedCategoryConstrainedRecall` and unsupported Shoes/Hosiery
  classes. Existing localization metrics remain separately visible.
- Strengthened `scripts/score-physical-garment-inventory.mjs` to require
  all **10 exact unique pinned real-source IDs** before any "complete
  ten-photo" aggregate is permitted. Adds aggregate
  `correctlyCategorizedGarmentRecall` and unsupported-class counts.
  End-to-end synthetic-only CLI test asserts zero-reviews / one-of-ten
  remain **null aggregate accuracy**, wrong-category overlap lowers category
  score, and full ten-source synthetic fixtures exercise math **without
  being passed off as real human measurement**.
- Footwear/hosiery: `benchmark/footwear-readiness.mjs`,
  `scripts/audit-footwear-readiness.mjs` and regression tests audit
  the verified *different* DeepFashion2 (two sneaker negative controls
  with unsupported category, zero proposals) and earlier pinned LIP
  (boot shaft contamination, missing sheer tights) evidence. Cross-study
  measured shoe accuracy and comparative improvement remain **null**;
  unsupported taxonomy, absent approved masks and lack of paired
  held-out results explicitly block model promotion.
- Pinned [DeepFashion Actions run 39169378676](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39169378676):
  **21 focused Node tests passed, zero failed**, real SHA-locked
  ten-source worker completed, scorer reported **0 genuinely approved
  full-photo inventories** and **null real-photo accuracy**; footwear audit
  reported **2 negative-control sneakers and 2 earlier LIP review photos**,
  0 customer saves, 0 paid inference, 0 production promotions.
- Details: `benchmark/DUAL-PRIORITY-INDEPENDENT-SCORING-AND-FOOTWEAR-20261018.md`.
  No production deployment/merge or Drive Duel changes.
- **Unfinished external requirement:** obtain two-person independently
  approved pixel masks and complete inventories for all ten source photos.
  Only then compare held-out real-photo performance and decide on any
  alternative segmentation/footwear model. No human review was fabricated.



## Complete 10-source independent review package — October 18, 2026, Pacific

- **Actual next priority finished on draft PR #7.** A blocker in
  `scripts/run-deepfashion-instance-probe.py` omitted **five of ten**
  original photographs from the extracted human-reference packet, even
  though inference processed all ten. Independent full-photo reviews and
  source-verified scoring for those other five could not proceed.
- Added `benchmark/whole_outfit_review_packet.py`:
  prevalidates all ten original JPEG files for SHA-256/source identity,
  uniqueness, byte size, model-proposal status and full photographer/license
  attribution BEFORE staging any outputs. It copies all ten original
  photographs without RGB edits, writes
  `independent-outline-review/source-original-coverage.json`
  and a mobile-responsive local `REVIEW-QUEUE.html` presenting five review
  priorities followed by the other five. AI proposal links remain clearly
  unapproved and concealed behind a disclosure that tells the first reviewer
  to identify physical garments independently before opening predictions.
  Sources, credit/license URLs, authors and original images are retained.
- Added `tests/test_whole_outfit_review_packet.py` with synthetic JPEG
  fixtures testing full-source coverage, missing/duplicate source rejection,
  source hash tampering, hidden invalid JPEG formats, unsafe attribution
  and unapproved model reference checks. Connected the tests, source
  coverage gate and HTML export into the existing
  `.github/workflows/deepfashion-instance-probe.yml`.
- **Verified** [10-photo DeepFashion GitHub Actions run 39168398781](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39168398781)
  for code commit `6def69f989d56b867970d716f38a29d6b3ce8bd9`:
  the pinned-model job successfully completed original hash validation,
  10-photo ONNX research, 34 unapproved proposal audit, full-source
  review coverage and no-promotion protection. Artifact
  `pinned-deepfashion-instance-feasibility`, ID `12151222707`.
- Independently downloaded and inspected artifact ZIP in the active
  container: ZIP integrity passed; **exactly ten** licensed original JPEGs,
  **ten of ten SHA-256 matches**, all ten license credit records,
  `REVIEW-QUEUE.html`, and 34 unapproved AI proposal JSON files.
  Coverage manifest: ten source photos, ten unchanged originals,
  five human-review priorities, **zero genuinely approved human masks**
  and **null segmentation accuracy**.
- The previous malformed workflow JPEG signature literal was fixed to
  test `bytes((0xff,0xd8))` instead of escaped backslash bytes; final
  pinned-model gate passed. The test fixture uses synthetic files;
  that does not prove independent human accuracy.
- The other product/mobile checks are separate from the pinned-model gate;
  do not claim all checks passed unless the relevant run confirms.
- The **remaining dependency** is actual independent first/second human
  reviewers drawing/approving all visible physical garment outlines from
  these unchanged originals, particularly layered outfits. Run existing
  `benchmark/assemble-physical-inventory.html` and
  `scripts/score-physical-garment-inventory.mjs` only after genuine human
  approval. Do not invent reviewers, set real-photo segmentation precision
  to a fabricated percentage, automatically save unverified masks,
  change original photos, use paid inference, merge/deploy production, or
  modify Drive Duel.



## Experimental real-photo garment-fragmentation spatial audit — October 18, 2026, Pacific

- Implemented `benchmark/instance-spatial-review.mjs`, regression tests
  `tests/instance-spatial-review.test.mjs`, and plugged analysis into
  `scripts/audit-independent-instance-reviews.mjs` and the existing
  pinned DeepFashion GitHub Actions workflow. All changes remain research-only
  in draft PR #7, development branch
  `fix/photo-clarity-high-quality-downsampling-20261016`.
- The problem: model proposals can represent two sleeves, two trouser legs,
  or several jacket panels of **one physical article** even when masks do
  not overlap. Earlier overlap-only checks could not surface nearby
  non-overlapping same-class proposals. The new audit retains exact
  source SHA, unapproved model status, exact model-mask foreground overlap,
  and a bounded 96×96 spatial gap. It records review-priority candidates
  **without merging masks, inferring garment counts, fabric truth, or
  changing automatic recognition or user UI**.
- Actual GitHub [DeepFashion 10-photo run 39167434166](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39167434166)
  succeeded: 15 focused Node tests pass, 0 fail. Inspected archived
  artifact `12150593325`, particularly
  `individual-instance-spatial-review.json`: **10 verified licensed
  source images, 34 unapproved model proposals, 81 proposal pairs,
  22 same-category near/overlap review pairs, 19 cross-category overlap
  review pairs, 41 combined priorities**. Importantly **5** same-category
  priority pairs are non-overlapping at exact source-pixel resolution;
  examples include `commons-0049` dress panels and `commons-0065`
  jacket panels. None is confirmed to be a duplicate garment or a valid
  separation without human reference outlines.
- Detail in `benchmark/REAL-INSTANCE-SPATIAL-REVIEW-20261018.md`.
  Original source images and original recognition RGB remain unchanged,
  0 automatic customer saves from research run, 0 independently approved
  human masks, null measured garment accuracy/recall, no paid inference,
  no model promotion or threshold relaxation. Existing 2-region,
  0-auto-save semantic worker baseline on worn `validation-0031` remains.
- **Next dependency, not faked:** obtain independent two-human source-identical
  per-item mask annotations and complete physical-garment inventories to
  distinguish model duplicate fragments vs genuinely separate layers.
  Compare garment recall, precision, contamination and original color,
  then select a safe replacement segmentation model only on verified data.
  No production merge/deployment or Drive Duel changes.



## New-item photo review → one-tap owned-wardrobe styling — October 18, 2026, Pacific

- Priority completed **only on draft PR #7 development branch**. In
  `public/app.js`, the existing manual photo-adjust dialog now offers
  optional **Save & style this** for new pending garment photos. A user
  selects/validates the category (Tops, Bottoms, Dresses, Outerwear, Shoes),
  saves the actual photo record, then opens anchored `styleNewClosetItem`
  suggestions in one action, using only items already stored in that closet.
  **Save changes** remains available; nothing new is mandatory.
- The combined action fails closed when the item remains Uncategorized or has
  an unsupported category: it leaves the draft unsaved for correction. An
  outfit worker's fragmented/original-crop region shows an explicit warning
  to inspect or crop a single physical garment before saving. The actual
  original, recognition crop, and display photo are not replaced.
- Removed a redundant draft persistence request after `savePiece()`,
  which already atomically commits saved garment and draft removal in one
  IndexedDB transaction; a second failing write could previously have
  displayed a false failed-save message after a successful save.
  Errors during the subsequent stylist navigation are now reported separately,
  so a durable wardrobe save cannot be mistaken for a failure to save.
- Extended `scripts/test-whole-outfit-save-mobile.mjs`: synthetic
  segmented-photo worker (explicitly **not real model accuracy**), two
  preexisting seeded owned items, negative unrecognized-category save
  attempt, positive one-action manual save → anchored stylist options,
  all option item IDs belonging to the saved closet, original outfit photo
  exactly preserved, independent captured-outfit board navigation, and
  storage/reload persistence. Emulated 390×844 touch viewport.
- Verified complete browser CI at
  [run 39166250030](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39166250030):
  every step passed. `OUTFIT_CAPTURE_HANDOFF`: `styledAfterOneTapSave=true`,
  `preexistingOwnedPieces=2`, `stylingUsesOnlyOwned=true`,
  `originalPhotoPreserved=true`, `savedBoardReloaded=true`,
  `pageErrors=0`. Existing `NEW_ITEM_STYLE_MOBILE` was also green,
  with 2 options and persisted one-piece swap.
- Full app build and Node CI at
  [run 39166245537](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39166245537):
  **741 passed, 0 failed, 3 skipped** (744 total).
- The **actual licensed whole-outfit** check still shows
  `validation-0031` only yields two uncertain mixed regions and **zero
  automatic saves**; no model accuracy was improved or claimed.
  The separate manual handoff test uses a simulated garment-split worker and
  synthetic owned items; do not present it as real-photo segmentation evidence
  or real-phone validation.
- **Next P1 blocker:** obtain real independently approved human outlines
  and full-photo inventories for layered outfits, then compare model instance
  masks and classification/missing-piece recall. The human review still
  cannot be simulated as ground truth. No unverified production model switch,
  paid inference, merge/deployment, or Drive Duel changes.



## Offline full-outfit independent review handoff — October 18, 2026 (latest)

- Next priority completed **on draft PR #7 only**: added
  `benchmark/assemble-physical-inventory.html`, a local/offline first/second
  reviewer inventory assembly tool with source-JPEG byte validation,
  SHA-256 and exact-name matched original photos, independently approved
  human-drawn outline imports, unique IDs and identity/provenance checks,
  consistent reviewer names, mask pixel validation, original-photo display
  and individual mask overlays, deliberate garment count, and two explicit
  full-photo completeness attestations.
- The builder creates `<source>.inventory.json` in the exact existing
  scorer format, **but does not make the masks, determine the correct
  garment count, or grant human approval itself**. The two named human
  reviewers must genuinely inspect every physical garment on the source
  including garments omitted by the AI.
- Added `scripts/test-physical-inventory-review.mjs` with synthetic-only
  negative/positive browser checks; connected it to the existing mobile
  CI workflow. Added a documented handoff guide in
  `benchmark/FULL-OUTFIT-INDEPENDENT-INVENTORY-GATE-20261018.md`.
- Full Node suite for code commit `2909926511b864f873e4b16afae7cdec9cc65950`
  [run 39163831599](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39163831599):
  **741 passed, 0 failed, 3 skipped**, including application build.
- Independently verified [mobile CI run 39163834314](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39163834314)
  **passed all stages**, including original mask editors, the new offline
  inventory smoke test, actual garment segmentation/recognition workers,
  real licensed outfit flow, owned-closet styling/swap and persisted outfit
  review. Browser log: `OFFLINE_PHYSICAL_INVENTORY` synthetic-only,
  `sourceHashBound=true`, `distinctReviewersRequired=true`,
  `humanCompletenessRequired=true`, `allVisibleGarmentCountMatched=true`,
  `offlineOnly=true`, `benchmarkRealPhotoAccuracyMeasured=false`,
  `pageErrors=0`.
- **Crucial limitation:** The real licensed full-outfit fixture is still
  **two mixed/uncertain garment regions with no verified automatic
  real-photo accuracy improvement**. No independently approved human
  instance reference masks or genuinely complete reviewed source inventories
  have been provided. Any reported accuracy stays null until that external
  two-person review is complete. Passing synthetic tests or workflow status
  cannot substitute for independent real-photo accuracy evidence.
- **Next remaining dependency:** Obtain actual two-human independently
  verified per-item reference outlines for `validation-0031` and other
  source-identical licensed outfits; use the offline builder to export the
  complete scene inventories, then run the independent detection/mask
  benchmark. Only after held-out real-photo results, consider promoting
  a revised segmentation model (requires user approval to change production).
- No production merge, deployment, paid service, customer data upload, or
  Drive Duel modifications.



## Full-outfit physical garment inventory scoring — October 18, 2026, Pacific

- Continued after the genuine one-photo diagnosis at `3f5b07d82bd047908dc483ef09ba3d3ad56b5836` on development branch
  `fix/photo-clarity-high-quality-downsampling-20261016`, draft PR #7.
- Added research-only `benchmark/physical-garment-inventory.mjs`, its
  synthetic unit regressions, and source-verified CLI
  `scripts/score-physical-garment-inventory.mjs`. The entire photo's independently
  identified garment inventory is now the denominator for missed-instance
  recall, not the AI proposal count. One-to-one maximum-cardinality/IoU
  matching prevents duplicate proposals from counting as extra clothing.
  Wrong broad categories, unsupported shoes/hosiery/accessories, and
  ambiguous unmatched predictions are explicitly reported.
- Extended the **internal** original-photo annotation editor to create
  blank, human-drawn physical garment targets (including garments with
  zero model proposals), plus a distinct second-reviewer approval screen.
  No customer UI changes or mandatory customer annotations.
- The ten-photo pinned DeepFashion experiment executes the new CLI in CI.
  The verified [pinned ONNX run 39162990829](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39162990829)
  passed the non-promotion gates. The ten reviewed-source inventory reports
  **zero independently approved complete human inventories**, so
  ten-photo and per-photo garment instance accuracy remain **null**.
  This is expected and correct; it is not a segmentation improvement.
- Full application suite [run 39162399218](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39162399218):
  **741 passed, 0 failed, 3 skipped** at the earlier pure scorer checkpoint.
  The browser annotation/second-approval regression also passed on
  `ad4e4a9c17e2a4e5010e5ff70bc1a53ae374243f`; final mobile workflow
  at later commits remains a separately monitored gate.
- Review instructions and a clearly **unapproved illustrative** inventory
  schema are in `benchmark/FULL-OUTFIT-INDEPENDENT-INVENTORY-GATE-20261018.md`.
  No reviewer outlines have been invented, approved, or promoted. Source
  descriptions and model suggestions are not pixel ground truth.
- **Next blocker, external to code:** obtain TWO genuinely independent human
  reviews and complete garment masks from the original licensed photos,
  especially `validation-0031` (blazer/shirt/skirt/tights/shoes).
  Only then evaluate real garment precision/recall and contamination for
  DeepFashion and separate shoe models. No model promotion without held-out
  evidence and explicit owner approval for production.
- No paid services, production merge/deployment, recognition-threshold
  relaxation, customer photographs, or Drive Duel changes.


## Verified real-photo model-decision diagnosis — October 18, 2026, Pacific

- Development commit `855f0261a09b636481347272de82647c0d1967b4`
  on draft PR #7 added **opt-in, aggregate-only** segmentation diagnostics.
  Normal customer capture does not request the diagnostic. It never changes
  original RGB, recognition crops, thresholds, saved clothing or mask approvals.
- Full GitHub Node suite [run 39161512221](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39161512221):
  **735 passed, 0 failed, 3 skipped**; production build passed.
  Independent mobile browser workflow [run 39161514948](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39161514948)
  completed successfully, including actual outfit and recognition workers,
  owned-item styling/swap checks and separated-outfit review/persistence checks.
  Mobile artifact **12149455579** contains the exact diagnostics and
  preserved source/display cutout pairs.
- Source-verified CC BY-SA 3.0 `validation-0031` (blazer, shirt, skirt,
  tights, heels): 128×128 semantic logits, person evidence passed. The
  independent description expects garments; these are **not** pixel-level
  ground-truth annotations.
- Actual model decisions: **Upper garment** won 396 mask cells but only 56
  survived strong pixel confidence; 52 survived small-component filtering,
  then the group failed the mean-confidence gate. **Skirt** won **zero**
  mask cells; **Bottoms** won 10 cells, none confident. **Dress** won 1,120
  cells and 527 trusted cells and was emitted as a mixed, visibly incorrect
  region. **Shoes** won 312 cells, 217 trusted and also emitted as an unsafe
  fragmented region.
- Observed end-to-end outcome remains **2 candidate regions, 0 automatic
  saves, 2 manual review holds**. The 2 original photographs / source crops
  per candidate are retained across the existing reload assertion; there were
  no page errors. The source RGB and original classification source are
  never overwritten by the diagnostic.
- **Root-cause scope:** the production semantic segmentation model fails to
  predict a distinct skirt on this one real layered outfit and has weak
  confidence on the upper garment. Relaxing postprocessing gates cannot
  recover the missing skirt class, and would risk false saved clothes.
  Do not infer per-item recall/precision, color accuracy, phone performance,
  improved model accuracy or readiness from this 1-photo result.
- **Next priority:** obtain independently approved per-instance masks
  on source-identical licensed worn outfits, then compare the pinned
  DeepFashion review-only proposals (and separately licensed footwear
  proposals) against actual references. Require held-out garment-level
  precision/recall and background contamination evidence before any
  automatic-save or customer-model change. Leave production, paid services
  and Drive Duel untouched.


## Genuine whole-outfit app benchmark — October 18, 2026, Pacific

- Continued from `fd121845c526f74f3192d984ddbf2dd3e5396a30`, which passed all
  23 PR workflows. This Work chat remains the main development thread.
- Added `scripts/run-real-whole-outfit-flow.mjs` to existing mobile CI. Uses the
  actual production segmentation and recognition workers on hash-verified,
  licensed full-body fixture `validation-0031` (blazer, shirt, skirt, tights,
  heels). Authentication alone uses a local test identity; no seeded closet
  records, manual labels, synthetic workers, paid calls, or cloud writes.
- First actual app run: commit `2e516024e9f1b343c2e56218d2d524d54f12f11a`,
  GitHub mobile run **39145377246**, artifact **12143605708**, report
  `real-whole-outfit-flow.json`: **2 emitted candidates, 0 automatically saved,
  2 pending review, 0 page errors**. Both retained original photo and unmasked
  recognition crop. Visually inspected exported original/display crop pairs.
- Confirmed failure: one mixed blazer/shirt/skirt region has a Dresses hint,
  but classification stays Uncategorized rather than inventing an owned dress.
  The shoe crop reaches Shoes/Unknown, with no confirmed color. Blazer, shirt
  and skirt are not independently recovered; tights remain outside the catalog.
- This is a real model/app failure baseline, not an accuracy improvement or a
  completed outfit workflow. Style this was **not exercised** from this capture:
  no item saved automatically. No mask IoU, color accuracy or phone claim.
- Tightened the benchmark to reject unexpected automatically saved categories,
  explicitly mark styling blocked when nothing saves, and compare exact original,
  recognition and display image strings for pending/saved records after reload.
  An empty saved collection now yields null, never a successful-save claim.
- Local build and Node suite remain **695 passed, 3 skipped, 0 failed**. Browser
  validation runs in GitHub because local Chromium installation is unavailable.
  Inspect final commit CI for the added pending-reload assertion.
- Next priority: diagnose why the production worker emits only two regions for
  this case; evaluate source-preserving region/instance candidates on this and
  more licensed full-body fixtures before changing model thresholds. Keep the
  existing safety gates and source RGB. Do not accept a false dress to raise
  automatic-save counts. Clipping reference masks still need independent review.
- Production, paid services and Drive Duel remain unchanged.

## Work main-thread continuation — October 18, 2026, Pacific

This Work conversation is now the main development thread. Supersedes the older
priority order below: real-photo whole-outfit separation, original-first automatic
indexing, clothing clarity, then Style this using owned clothes.

- Resumed exact remote HEAD `7c9ed65f33ec525fc34ae702634871ad1638e090` on the existing
  development branch / draft PR #7. Independently checked all 23 PR workflows:
  completed successfully. PR remains open, draft and unmerged.
- Reproduced and fixed a source-evidence gap: capture accepted separated garment
  outputs without a valid original-RGB recognition crop, letting the indexing
  fallback inspect a display cutout. Require the original crop before enqueueing;
  preserve valid partial results and offer retry when source crops are missing.
  Two behavioral regression tests failed before the fix and pass afterward.
  This is input-contract protection, not a measured model accuracy improvement.
- Build passed. Full local Node suite: **695 passed, 0 failed, 3 skipped**.
  Focused source/capture/worker suite: **21 passed**. Added these checks to mobile CI.
  The first pre-build test attempt lacked generated PWA assets; rebuilding resolved
  that setup failure. No runtime patch was needed for it.
- Inspected genuine checkpoint artifacts: mobile run **39143869856**, artifact
  **12142796880**: 14/14 broad categories correct, **8/14 automatically saved**,
  **6/14 awaiting color confirmation**, zero page errors. These are single-garment
  photos, not whole-outfit extraction or independently scored color accuracy.
- Inspected experimental run **39143869995**, artifact **12143110187**: all eight
  cases processed, all eight automaticCatalogApproved=false. commons-0059 is a
  dress-and-jacket display; the expected outerwear is absent from detected output.
  Its comparison visibly loses upper garment material. Six other display fixtures
  and one worn-upper-body fixture do not form a head-to-toe outfit benchmark.
  Extra predicted regions are unverified, not automatically false positives.
- Local genuine browser inference is blocked: Chromium absent; Playwright's
  download repeatedly returned invalid ZIP archives. Do not substitute simulated
  workers or report a new real-photo score. Existing GitHub workflows can run
  browser regression coverage after this commit.
- Next: inspect new exact-HEAD CI, establish licensed head-to-toe multi-garment
  fixtures with expected visible pieces, then run actual outfit worker through
  recognition, save and owned-clothes styling. Keep automatic saves separate from
  manual confirmations. Six independent mask approvals remain outstanding;
  do not promote experimental masks or tune thresholds to unapproved outlines.
- No production merge/deployment, paid service, or Drive Duel changes.

## Clipping and color-evidence repair — October 17, 2026, evening Pacific

Continued from `55e4a032383ff8e9910b161154878c20d37b3a4b` on the same development branch / draft PR #7.

- Fixed a reproduced display-clipping defect: confident skin, hair and limb labels were discarded before tiny-hole cleanup, allowing same-color non-clothing pixels to be restored as fabric. Retain separate semantic labels solely to veto those repairs; clothing groups, source photos, recognition crops, model thresholds and MODNet 128 are unchanged.
- Fixed a reproduced color-evidence defect: an upscaled mask could count the same source pixel repeatedly. Sample distinct original pixel positions; a 256-cell mask backed by only 16 source pixels now remains insufficient evidence rather than a confident color.
- Both added regressions failed before the fix and passed afterward. Focused clipping/color/edge suite: 37 passed. Full local Node suite: 618 passed, 3 skipped, 0 failures. Build passed. All 59 locked and 11 fresh source photographs verified against their recorded hashes.
- Real-photo browser inference could not start locally: Chromium was absent, and its download returned invalid archives. GitHub real-photo recognition and clipping workflows are the remaining verification gate; do not report an accuracy improvement until their results are inspected.
- No paid inference enabled, production merge/deployment requested, or Drive Duel changes made.

## Single-conversation handoff — October 17, 2026, afternoon Pacific

The owner selected this ChatGPT conversation as the **single place for project decisions and progress reports**, consolidating the previously separate ChatGPT Work-mode benchmarking and try-on threads. Chat transcripts themselves cannot be merged, and other open conversations are not automatically stopped; the GitHub draft branch and this checkpoint are the reproducible shared state. Future changes from another session must be read from current GitHub HEAD first; do not duplicate, overwrite or force-push.

- Repository and integration target: `nickhaney916-lang/Closet-Current`, branch `fix/photo-clarity-high-quality-downsampling-20261016`, **draft PR #7**; `main` and Drive Duel must remain untouched.
- Latest audited code head before this handoff: `85d79988f709ea4f5f2d67b9b9af8951e52b07ce`. Later development may advance it; always fetch the current head rather than assuming this SHA is current.
- The Work benchmarking contributions include difficult-background segmentation experiments, preserving white sneaker soles, and **display-only** transparent garments on the closet rack; these are not proof of accurate clothing-only AI cutouts. Review-only masks and six independently unapproved reference outlines remain open.
- Two **photorealistic fixed male/female model preview thumbnails** are in the draft app; their full-resolution provider input photographs are packaged separately and are **not hosted in the app yet**. The account-bound, server-side paid try-on interface is coded, but real provider inference has **not been run** and the pilot remains disabled. Selfie face personalization and multi-item generated outfits are not implemented.
- Latest verified CI evidence on shared head: [camera/indexing run 39082003111](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39082003111) — 616 passed, 0 failed, 3 skipped; [mobile run 39082023950](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39082023950) — 143 passed, 0 failed; [AI request guard run 39082023937](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39082023937) — 3 passed, 0 failed. The phone-sized licensed-image flow observed 14/14 correct **broad** garment categories, 8/14 automatic saves and 6/14 pending review, with no page errors. The try-on browser simulation sent **zero** actual provider calls.
- Current priorities, in order: reliable point-and-click real-phone clipping and accurate indexing (no mandatory human approval); the two standardized AI figures connected to **real** generated one-piece try-on with strict paid-cost authorization; extend to multi-garment outfit visualization; optional consent-based selfie face; one-tap owned-wardrobe swaps; launch privacy/onboarding testing.
- Financial constraint: do not enable paid AI, purchase services or start billable inference without explicit owner approval. Keep real human selfie/face uploads opt-in only.
- Immediate next technical hinge: securely stage/host the already prepared two full-size AI model photos, then verify a controlled single-garment provider run **only after** permission and budget safeguards. Continue realistic photo clipping benchmarks in parallel. Avoid claiming the silhouette, flat thumbnails, or isolated garment photographs are completed AI try-on.


Updated October 17, 2026 (America/Los_Angeles). This section supersedes the
historical notes below. This conversation is the owner's main development chat.

## Single working branch

- Repository: `nickhaney916-lang/Closet-Current`.
- Development: `fix/photo-clarity-high-quality-downsampling-20261016` (draft PR #7).
- Verified consolidation base: `ed35cb1a23a3075ae17da9db76c13d92c83d6940`.
- All 18 published branch tips inspected at consolidation are ancestors of this
  development head. No published branch merge was necessary.
- `main` remains the production branch. Consolidation does not deploy or merge.
- Another chat added `dd7917e` and `2ccf3fb` during this session; both are included.
  Subsequent try-on tests `6be88ff` and `ed35cb1` were also preserved.
  Other chats are not automatically paused by this checkpoint.

## Current work included

| Area | Included state | Remaining limit |
| --- | --- | --- |
| Photo/cutout quality | High-quality downsampling, mask review/scoring tools, original-pixel previews, sharp MODNet 128 reference | Difficult backgrounds, shadows, pale fabric and clothing-only isolation remain unresolved |
| Shoe preview | `4de540d` guards against the observed white-sole erasure; nine licensed sources checked | One preview accepted, eight original-photo fallbacks; not a segmentation accuracy score |
| Closet browsing | Default Closet View, one-item navigation, position restoration, transparent preview support | Physical-phone acceptance still needed |
| AI figures / try-on | Standard male/female selection and private server-side pilot foundation | Real provider run, hosted model assets, layered outfits, shoes and optional selfie face are not established as complete |
| Paid-service safeguards | Signed-in read-only readiness check; try-on UI stays disabled until availability succeeds | No paid calls authorized; no production configuration changed here |

## Evidence and status

- Shoe-preview checkpoint: 63 focused Node tests passed, nine source SHA-256 checks
  passed, and app build passed locally. GitHub equivalent is `4de540d` (same tree
  as local `919580c`).
- CI for later branch heads must be checked by exact SHA. Previous test counts
  do not establish that every newer workflow passed.
- Do not equate passing software tests with garment pixel accuracy or real-phone
  performance. Preserve original clothing photos and fail safely when uncertain.

## Priority order

1. Reliable photo clarity, automatic garment-only clipping, category and primary
   color indexing; fix difficult-background/pale-fabric failures with real evidence.
2. Real-phone capture, persistence and account onboarding validation.
3. Two realistic standard AI figures and one-garment try-on, then layered outfits,
   footwear and optional user selfie face. Paid usage requires explicit approval.
4. Style new clothes using owned clothes, then the remaining trend workflow.

Keep point-and-click controls large and uncluttered. Preserve the separation of
Inspiration and owned-clothes styling. Do not add mandatory manual cropping.
Drive Duel is outside this project and must not be modified.

## Historical drafts preserved, not activated

See [consolidation inventory](consolidation-20261017/README.md). Three local
snapshots were absent as current, tested implementations. They are retained as
inactive patches for deliberate reconciliation; do not blindly apply old full
files over current runtime code. Original workspaces were left untouched.

## Coordination rule for future chats

Read this file first. Fetch the current branch and inspect its head before editing.
Use this branch as the integration target, with an isolated worktree for changes.
Before publishing, compare the latest head and preserve intervening commits;
never force-push over another chat. Update this checkpoint with exact commit,
validation, limitations and next action. Do not start duplicate work in another
chat without assigning it a distinct scope. This is guidance, not an automatic
cross-chat lock or cancellation mechanism.

---

# Historical checkpoints (not current status)

# Closet Current progress checkpoint

## Current checkpoint — October 14, 2026, evening Pacific

Saved at the owner's request before further personal testing. Stable application source: `b6490e8af2eabefb370fac7b5bf0a7d375dd9922` on `main`. Live app: https://closet-current.pages.dev/

- Preserve the current interface: shared clothing figure without gender controls; one base shirt; independent shirt/sweater, jacket and outer-coat layers; Dresses switches to a dress-and-shoes figure. Backup controls remain at the bottom.
- Separate clothing photos populate independent layers and survive reload. Dress preview can be canceled without changing the shirt look; selecting a dress removes incompatible outfit slots without deleting clothing records.
- High-resolution capture, automatic outfit crops, originals, private account backup and existing recognition remain preserved. Drive Duel was not accessed or modified.
- All 237 Node checks passed. Main's camera/indexing, mobile capture/persistence, WebKit, display comparison, private backup, Cloudflare deployment and GitHub Pages workflows passed. Physical-phone accuracy is a separate open validation task.
- Latest recognition evaluation: reviewed categories 26/32, exact types 18/32; fresh categories 11/11; harder holdout clothing categories 7/13. These results do not justify unrestricted public-launch accuracy claims.
- Email/password flows and PWA installation help exist. Current SMTP configuration and real inbox delivery remain unverified. Authentication links still target GitHub Pages while the main shared app link is Cloudflare; verify the redirect allowlist and align the chosen origin before invitations.

Next work: follow [PILOT-READINESS.md](PILOT-READINESS.md). Prioritize labeled real-phone crops, category and primary-color accuracy, reliable saving, and email onboarding before adding features. No runtime or authentication settings changed for this checkpoint.

## Earlier checkpoint history

The dated notes below describe earlier states; the current checkpoint above supersedes their counts and open-item status.


Originally paused at the owner's request on October 14, 2026, 7:44 AM America/Los_Angeles. Development resumed at the owner's request later that morning.

## Current saved state

- Repository: nickhaney916-lang/Closet-Current; production branch: main.
- Application source at pause: `686f88679b00678527c98569d1b09be8dcd96d04`.
- Live app: https://closet-current.pages.dev/
- Phone photo check: https://closet-current.pages.dev/phone-photo-check.html
- The photo-check page returned HTTP 200 and matched the built release identifier and recognition-vector digest.
- Simplified navigation and high-resolution camera functionality are preserved. Drive Duel was not accessed or modified.

## Recognition work completed

- Verified rollback camera/indexing tests passed.
- Full-garment preprocessing improved the original 32-photo category result from 19/32 to 23/32 and shoes from 8/13 to 11/13.
- The later validated prompt profile reached 26/32 categories, including 12/13 shoes; 7/13 categories on additional garments; and 10/11 categories on fresh photographs.
- Per-photo regression enforcement protects all 59 fixtures, including three nonclothing images. Known annotated subtype mismatches remain explicitly visible.
- Eight subsequent subtype/recovery candidates were evaluated. None safely improved recognition, so the production model, vectors, confidence gates and preprocessing were retained. Detailed metrics and rejected changes are preserved in docs/SUBTYPE-RECOGNITION-RESULTS.md and benchmark/subtype-experiment-results.json.

## Latest completed delivery

Optional phone-photo validation is deployed and linked from My account → Device help.

- Supports up to 20 single-garment photos with independently supplied category labels and optional type labels.
- Locks expected labels before inference, uses the production local worker and the app's photo-import conversion, and does not save wardrobe items.
- Downloads a report with safe labels, rejection diagnostics, timings and version identifiers. Images, filenames and account information are excluded; nothing is sent automatically.
- Handles scanner timeouts, partial failures and restarting the test.
- All 166 automated tests passed.
- Real-worker phone photo-check flow, camera/indexing tests, mobile capture/persistence flow, Cloudflare deployment and GitHub Pages deployment passed.
- Browser tests use licensed fixtures at a phone viewport; physical phone hardware and new user garment accuracy remain unverified.

## Exact next step when resuming

Collect real phone evidence before further recognition tuning:

1. Open the phone photo check and choose 5–10 different garment photos, including dresses, long tops, sneakers and boots.
2. Supply expected labels before running recognition. Leave the optional subtype blank when uncertain.
3. Download closet-phone-photo-results.json and attach it to the development conversation.
4. Analyze mismatches and error stages. Request only the particular numbered garment images needed for visual investigation, then test targeted changes against the phone evidence and existing 59-photo safeguards.

The prior uploads inspected were setup screenshots, so no user phone garment dataset or new phone accuracy claim has been established. See docs/PHONE-PHOTO-VALIDATION.md for the collection workflow and evidence.

## Other open priorities

Physical-phone capture/login validation, reliable authentication email delivery, cloud wardrobe backup/synchronization and eventual subscription readiness remain open as documented in docs/ROADMAP.md. They have not been completed by these recognition tasks.

## Resume validation

Added an automated mobile WebKit photo-import and persistence check. EXIF orientation, high-resolution import limits, actual-worker T-shirt recognition, IndexedDB persistence and phone layout passed on the validation branch; all 166 existing Node checks passed. See docs/WEBKIT-MOBILE-RESULTS.md. Product camera and recognition behavior are unchanged.

Development is resumed. Real phone garment reports remain the next input needed for recognition tuning; physical-phone camera and production-login tests remain open.

## Authentication continuation

Reviewed Closet Current's public Auth settings and project health. Added clear email delivery/rate-limit messages and validation of unreadable service responses; 170 automated checks passed. Supabase management access requested reauthentication, so SMTP settings were not modified and real inbox tests remain open. See docs/AUTH-EMAIL-READINESS.md. Recognition, simplified navigation, camera resolution and Drive Duel are preserved.

## Display continuation

The owner chose to polish the existing display rather than redesign the app. Compact labeled filters, more consistent clothing cards and responsive spacing passed a four-width visual comparison and 170 automated checks. See docs/DISPLAY-POLISH.md. Preserve the current purple/peach colors and simplified navigation in subsequent work.

## Private cloud backup continuation

The owner requested automatic saving without individual phone-gallery files after nine items were captured. Added private account-owned photo storage and revision-protected metadata, durable pending changes, offline retry, existing-local migration and independent-browser recovery. 181 checks, live Supabase account-isolation tests and the browser recovery flow passed. No real user wardrobe was inspected; actual items migrate when the updated signed-in app runs. See docs/CLOUD-BACKUP.md for limits and verification.
