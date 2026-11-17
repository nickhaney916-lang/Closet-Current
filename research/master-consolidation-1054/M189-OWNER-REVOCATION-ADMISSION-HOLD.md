# M189 — M187 and M188 proven private source-authority corrections, Mission 4 adoption candidate (HOLD)

## Exact app donor and why this is higher priority than merely counting green model runs

Read-only held Mission 4 source parent `f2befed4c776786dc11843b98fafec72f2d9c202`, default `main` untouched, Family Alpha [#255](https://github.com/nickhaney916-lang/Closet-Current/issues/255) OPEN/HOLD. This candidate is **review-only**, not a merge/deploy/release. The only two actual product source changed files in the complete donor ancestry are:

- `public/native-outfit-source-plan-p99.mjs` source SHA `0d4972a7fddfcfae0dd811765e4a94b962f4b578`: M187 owner-lease checks now require a current owner/source authorization callback and explicit private-state presence. M188 additionally refuses truthy `deleted` and `sourceRevoked` before private original-source handoff and fingerprints both flags across async private reads.
- `public/native-2d-preview-p99.mjs` SHA `62bad171a97030846b0f1bb3bab740dec20ac5e7`: M188 fingerprints both revocation flags at original-photo final read and refuses display if stale/revoked between reads.

No P88 installed native Worker, model weights, public normal app shell, backup importer/exporter, owner/auth/hosted RLS, privacy data, 3D fit, or test photo bytes changed. M187 exact source `0704de7694a4a8668094f2e705833a4132e51fc6`; M188 exact source `e83692f0988bd6936d05da22046b084054e66958`. Both ancestry descendants of unchanged held source. The new cross-mission test workflow has source-locked Git allowlist of exactly six upstream donor paths (two product, two tests, two CI) plus this ledger/workflow, refuses all other changes.

### Genuine causal regression

M188 intentionally ran its own original M187 real product source BEFORE correcting it, exact commit `bab48194ec9590b96ed95f09d282cd7f6d18810d`, [CI #44167967369 original source regression job #134339014937](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/44167967369/job/134339014937): **7 cases, 2 PASS, 5 FAIL**, all five genuinely failed to reject revoked/deleted signed-local owner original before/during private reads/final preview. This is a **real source-authority defect**, not a synthetic Worker mock or a model flake. Fixed in actual source M188. Independent exact-HEAD [M188 push #44168147542](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/44168147542) **3/3 SUCCESS**, [M188 PR #44168292313](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/44168292313) **3/3 SUCCESS** with 7/7 negative/positive tests, full inherited owner Node suite and genuine source-based Chromium/WebKit P99 normal v3 restore at 320/390/430. Earlier M187 exact source also independently [push #44166426232](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/44166426232) **3/3 SUCCESS** and [PR #44166494733](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/44166494733) **3/3 SUCCESS**, 2,900/2,900 inherited Node and signed-local normal real-browser tests.

### M189 cross-mission admission independent of both original donor PR scopes

Dedicated `.github/workflows/main189-lease-revocation-crossmission-no-deploy.yml` runs FOUR separate jobs at one exact candidate HEAD:

1. Immutable Git SHA pins / full eight-path diff whitelist, genuine M187/M188 positive+negative source-authority tests, offline build, entire inherited Node regression.
2–3. **Genuine unflagged installed Chromium and WebKit** normal public app with source-attested, synthetic owner-reviewed licensed original photos, two garments, exact original-only 2D outfit, atomic signed-private v3 restore, at 320, 390, and 430 pixels (no 3D promotion).
4. Actual installed P88 SegFormer/WASM **WebKit 7 consecutive native model/owner/backup source** tests on the changed P99 modules: M58 normal, P94 at 320/390/430, P96 resized public 4K, P96 unmodified original CC-licensed 4000×6000, and exact source M172 24MP whole-private-state gate. Original 7 model/owner assertions fully unchanged; any zero proposal/failure stays RED, no retry, no synthetic mask or silent save.

The protected older workflows M58/M173/M180/M181/M183 retain exact original source SHA pins and may be RED on this branch's new M187/M188 additions until an additional **reviewed source-scoped repin and allowlist** is applied. This dedicated test is necessary but **not sufficient** for adopting two product changes to held #1210: source pin updates, protected cross-mission CI 7+3+3+3+3 etc must all pass on the final immutable candidate SHA. Never disable or relax a failing inherited owner, 3D veto or model test to get a green check.

### Explicit barriers and disposition

M188's proven source revocation fix does **not** fix separate true intermittent WebKit installed model errors in seventh M172, nor M157 v3 original-photo pretransaction refusal (Parallel #100 [#1258](https://github.com/nickhaney916-lang/Closet-Current/issues/1258)), nor real physical Android/iPhone browser acceptance, hosted signed multi-owner RLS/Storage, independent human 10/10 label benchmark, or actually photographed fitted 3D garment drape. M185/M186 source-only diagnostics remain independent. This branch is NOT release-ready and will NEVER lift HOLD #255 or merge/deploy to main.

**M189 admission status: PENDING source-pinned independent same-HEAD CI + protected inherited scoped compatibility. Overall Mission 4 INCOMPLETE.**
