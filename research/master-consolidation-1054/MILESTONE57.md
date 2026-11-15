# MAIN1054 M57 — P88 source receipts through actual native owner-review screen (research gated)

**DRAFT ONLY — #255 Family Alpha OPEN/HOLD. NO merge, deploy, default production change, staging, hosted cloud, private user source photos, model/recognition donor branch edits or physical-device acceptance.**

## Defect / source origin

At exact inherited M56 implementation `1bf7137dedefcc974917144f11c154d119898971` the opt-in MULTI24 native owner-review controller (`research/multi-garment-capture-01/review-ui.mjs`) uses its native worker's `piece.instanceKey` plus `multi24:true`. Independent P88 worker `cc4554ef0104506a72bf0a28423fee52b6e4fff2` sends no instance key; instead `instanceReview70:true` produces `reconciliation70:{sourceSha256,maskSha256,instanceOrdinal,method}`, `instanceReview840:true` enables conservative native class grouping. Directly passing that worker event to the native `intakeProposal58` fails or loses source lease. An unsafe shortcut could mint guessed keys, lose the unresolved source flag, or bypass final owner review.

## Implemented non-default switch

Only when **both** an actual local research host (`127.0.0.1` or `localhost`) AND `?multi24=research&p88Transport57=research` are active:

1. After the real native application has obtained and decoded an owner-selected, original-byte SHA-256-verified JPEG, its existing review controller opens M55 `openP88SourceIntake55` with the actual active owner, original source SHA, DB name, monotonic review epoch and unique worker request ID; each callback is checked again on every worker message.
2. It attempts to create a module Worker from **only** the test-local disposable donor route `../.m57-exact-p88-donor/public/outfit-worker.mjs`. That route is not part of the packaged/default `public/` app. P88's exact worker request includes the original JPEG, `instanceReview70:true` and `instanceReview840:true` — never `multi24:true`, a fake count, token or owner database.
3. The actual native worker message event handler routes all `piece` packets through the M55 exact source + mask + ordered ordinal + live lease validator first. Its derived full SHA-based instance key passes the existing M54 bounded intake and unresolved same-class status veto. Only minimized output reaches `addDetected`, which shows the existing crop editor/owner-review card. **No automatic save or inferred physical-garment identity.**
4. On cancel, account/logout/session lock, pagehide, source replacement, final Save, worker `done`/`error`, or a stale asynchronous source verification, the lease closes and worker is revoked. The ordinary default `multi24` behavior is untouched, with existing worker flags and extraction unchanged. Outside local research, the new switch is OFF even with a query parameter.

## Source-honest browser evidence

`scripts/test-main57-native-p88-transport-browser.mjs` opens the **real native Closet Current public index + real MULTI24 review controller** in headless Chromium and WebKit at widths 320/390/430. It imports a genuine licensed checked-in original photograph `benchmark/fixtures/commons-0003.jpg`, rehashes exact JPEG bytes and performs the native client WebCrypto proof and real per-owner local IndexedDB. Authentication uses only synthetic HTTP fixtures, external model/CDN access is blocked.

A **synthetic but P88-shape-faithful Worker object** is injected in `window.Worker` instead of downloading a model into each six browser tests. The fixture requires original JPEG, P88 70/840 flags (and absence of `multi24`), emits full-SHA source/mask receipt and top-level `native_semantic_group_unresolved_fragments` status; it then repeats the mask under a different ordinal, forges the source hash on another packet and emits late data after `done`. The actual research UI must display exactly one unresolved warning, reject all extra events, disable confirmation even after a real crop editor and typed category/subtype/color, and leave owner-private item row count at ZERO. A user may remove the unsafe proposal without saving. The fixture's masks are **not** model inference or independently human-verified garment boundaries.

The CI additionally pins exact P88 donor Git blobs and copies them to a disposable scratch directory, but this fixture **does not execute the real P88 Worker process**. M56's separate exact-model genuine-licensed-JPEG CPU inference is the only real-model experiment and must be evaluated on its own pending CI. Native real-worker end-to-end model inference and signed hosted RLS remain BLOCKED.

## Verification / go-no-go

- Source to native view integration implementation: **COMMITTED**.
- Exact-head full inherited Node/build: **PENDING dedicated CI**.
- Chromium/WebKit real native owner-review UI with P88 shaped signed-source packets, six mobile-sized simulated profiles: **PENDING dedicated CI**.
- Genuine source-disjoint two-human annotated segmentation accuracy, fully correct physical garment unit/pair counts, supported subtype + color and 10/10 owner zero-wrong-save: **BLOCKED**.
- Real browser P88 SegFormer execution, authenticated live cloud owner account, physical Android/iPhone, true photograph-derived fitted 3D, layered outfit acceptance: **BLOCKED**.
- Family Alpha #255 **HOLD**. All PRs DRAFT, not merged or deployed.

Final safe release action is **NOT authorized** by completing this branch. Consult exact CI run conclusion and fresh source/owner/device evidence.
