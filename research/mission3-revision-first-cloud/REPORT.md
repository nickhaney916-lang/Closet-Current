# Closet Current — Mission 3 revision-first owner-private cloud checks

**FAMILY ALPHA HOLD #255. Isolated research, DRAFT ONLY. No merge, no deployment, no existing production/staging writes, no real-owner photographs, and no modifications to Missions 1/2.**

## Exact verified parent

Mission 3 atomic owner-local device quota restore, draft [PR #817](https://github.com/nickhaney916-lang/Closet-Current/pull/817), exact HEAD `977d87f83cc08350cd9661323f862b6722e35679`, verified [no-deploy CI #42942472023](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42942472023) **SUCCESS**: **1,412 / 1,412 Node tests**, six genuine browser Chromium/WebKit owner IndexedDB quota fault/rollback/manual recovery cases at 320/390/430, plus durable cloud 413/507 retry, private original/cutout restoration, canonical photo→review→closet→styling and accessibility. The earlier test transport error was corrected and the final HEAD verified. All work remains draft, unmerged and undeployed.

## Remaining data-transfer waste and repair

Before this milestone, every regular legacy cloud synchronization issued a PostgREST `select=revision,document` for the entire owner-private wardrobe JSON, including **focus/online/60-second clean checks** and uploads where the local and cloud revisions already matched. Earlier Mission 3 work avoided full IndexedDB `getAll()` on clean sync but did not avoid repeatedly transferring a large remote document.

The revised controller first requests **only `select=revision`**, requiring a small JSON response. If the remote revision matches the current durable `cloud-sync.baseVersion` and `needsRestore` is false, the app neither downloads nor parses cloud `document`:
- On an unchanged clean wardrobe, it correctly displays `Cloud backup up to date` without fetching private remote garment JSON or cloning all local JPEGs.
- On an unchanged dirty wardrobe, it still snapshots the current local private wardrobe, SHA-validates originals/cutouts, uploads photos as required and uses the server-side `p_expected_revision` optimistic lock before publishing.
- For a remote revision mismatch, a pending `needsRestore`, or a first-time owner with a pre-existing remote revision, it **fetches the full remote document** and retains every prior merge/conflict and atomic photo-restore rule, including source SHA and owner/session checks.
- If the full response revision is **older** than the just-observed metadata revision (stale replica/proxy response), it **fails closed** and retries rather than silently restoring older garments.
- Concurrent local edits still receive the existing post-network durable dirty-marker check; signed owner switches invalidate pending callbacks. Other owners cannot access the original's cloud namespace in tests.

## Verification design and limitations

The new `tests/mission3-revision-first-cloud.test.cjs` runs an **exact verified parent baseline** (demonstrating three full 1,000-garment remote JSON reads on routine clean checks) against this branch. Repaired tests cover clean and dirty unchanged revisions, changed remote cloud restore, pending `needsRestore`, true two-way newer parallel edit merge, a remote revision advanced between two GETs, stale full response rejection, malformed remote document, and a concurrent local dirty edit during an in-flight metadata request.

New `scripts/test-mission3-revision-first-browser.mjs` performs **actual Chromium and WebKit** built-app journeys at **320/390/430 CSS px** with a 1,000-item synthetic owner-local photo closet. It intercepts owner-scoped cloud REST and records the actual select projection and JSON response length. It verifies no remote `document` transfer on normal clean/dirty checks, a full owner-scoped fetch when remote changes, exact atomic restoration and new local garment backup, screenshot SHA and axe accessibility. The cloud transport is **mocked** and owners are **synthetic**, not genuine hosted JWT or physical mobile hardware.

The strict [no-deploy CI](../../.github/workflows/mission3-revision-first-cloud-no-deploy.yml) also runs every Node test and previous independent Chromium/WebKit 320/390/430 capacity, quota-restore, private original/cutout backup, camera/manual-review/private wardrobe/styling, and accessibility workflows. Scope limited to **five paths**: `public/cloud-backup.js`, new Node test, new browser script, this report, and the dedicated workflow. **Never claim exact-head success until CI and screenshots are checked.**

## Hard release gates

Actual physical Android Chrome and iPhone Safari photo-camera/background/OS-kill and 1,000-unique high-resolution photo heap/quota tests, approved disposable hosted Supabase **signed** two-account JWT/RLS/Storage rejection/backup/restore, independent real-photo recognition acceptance and realistic male/female photographed-clothing 3D integration are still outstanding. Family Alpha HOLD #255 remains OPEN. No project is authorized for release on the strength of these synthetic tests.
