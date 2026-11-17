# Parallel #99 — Real Normal-App Contract and Acceptance Handoff (HOLD #255)

Assignment: #1237. Coordination: Mission Control #1054. Draft candidate PR #1238. Main M4 PR #1210.
Exact protected source parent: 59e3d041c24a4419e3d876d204889a40ae48feef.
No merge, deploy, production/staging operations, hosted user writes, hardware claims or Family Alpha release.

## Normal-mode versus opt-in research application delta

| Stage | Native default M4 parent | External/research-only | P99 review candidate |
|---|---|---|---|
| Home / Add Clothes | Home action, Add tab and chooser available | P94 P88 segmented photo model research | Actual Home/Add buttons, file picker, original JPEG, native Review |
| Garment identification | Native proposals/Unknown may be wrong | P88/P96 model/24MP inference separate owner | Retain all uncertain photos; synthetic owner's category/type/color approval, never claim model accuracy |
| Save My Closet | P119 verified durable private photo save after Adjust | M3 atomic receipts | Native unflagged Adjust/confirm, 2 actual private rows, no direct database injection |
| Outfit Builder | More menu, native picker and Save outfit | BOARD04 lossless native research paths | Actual My Closet, More, top/bottom picker, native Save outfit |
| Attested ORIGINAL preview | BLOCKED for normal consumer: mission4Preview1054Active required mission4Preview=research; viewer module located outside built public/dist | M51 verified original/source 2D research | Public-packaged read-only signed-owner SHA/DB/session-verified original JPEG viewer + normal 2D button |
| Realistic fitted-photo 3D | No independent owned-photo reconstruction permission | M2 C60/C61 licensed temporary geometry not fitted owner outfit | Remains DENIED; no research 3D autoactivated |
| v3 backup/restore | User-visible My Closet Backup & restore; excludes unfinished drafts | Separate lossless v4 research path | Actual download, reload, owner-confirmed native restore and saved outfit reopen |
| v4 pending-original restore | NOT default app workflow | Only opt-in losslessV4M3 with M3 owner gates | NOT promoted; native user must finish review or use separately accepted future M3 feature |
| WebKit selected original | P95/P98 root-cause mission separate | #1229 #1232 | P95 exact-current-source reconciliation reused, no duplicate root-cause rework |
| P96 4000x6000 multi-item | M169 not adopted at exact source parent | #1234 combined P95/P96 candidate | NOT claimed adopted; separate owner approval |
| Phones and hosted auth | Not independently certified | P97 0/42 physical witnessed at checkpoint | BLOCKED, viewport emulation and synthetic auth are not actual devices/RLS |

## Public test sources and rights

The byte-identical locked public sources and attribution are recorded at benchmark/locked-photo-sources.json.

- commons-0003.jpg — black long-sleeve shirt, SHA256 cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64; CC BY-SA 3.0, Museum Rotterdam / Wikimedia Commons.
- commons-0023.jpg — blue jeans, SHA256 checked byte-by-byte against locked manifest by browser test; CC BY-SA 3.0, Museum Rotterdam / Wikimedia Commons.
- Test label Black Shirt / Blue Jeans is entered by a **synthetic user** based on fixture descriptions and visible photo; it is not independent blind accuracy truth, nor verified human review of a physical phone.
- p99-A and p99-B are local fixture principals. Only Supabase auth HTTP is synthetic and cloud transport stubbed; the browser launches the actual packaged app code, user control handlers and IndexedDB.

## Browser acceptance and negative cases

The executable script scripts/test-parallel99-normal-app-browser.mjs runs built dist/index.html WITHOUT query parameters at real Chromium and WebKit engines and 320/390/430 viewport widths. It captures per-stage evidence under benchmark/parallel99-normal-journey/engine/width.

| Scenario | Automated contract |
|---|---|
| No reviewed selected outfit | normal verified viewer opens zero original images |
| Home/Add via real controls | original photo chosen through input; no direct JS calling candidate/save API |
| Owner review and save | native Adjust, explicit category/subtype/color checkbox, source confirmation, private P119 durable commit |
| No silent model save | before clicking human Save, saved rows remain unchanged even if model offers proposals/Unknown |
| Cancel file input | empty file change cannot change durable item count |
| Duplicate JPEG import | exact source repeat yields duplicate and no new saved garment |
| Oversized photo | greater than 10MB source is rejected before decode, no new saved garment |
| My Closet and native builder | category-compatible top and bottom chosen through live picker; outfit actually saved |
| Verified original viewer | displayed img SRC equals locked full original JPEG for each selected slot; no 3D canvas |
| v3 backup and restore | native Download, document reload, user-confirmed native file restore, same saved outfit reopening |
| Offline warm session | previously loaded local modules/owner IndexedDB still reverify original 2D while browser set offline |
| Mutation and reentry | tampered in-memory selected original revokes prior pixels, cannot re-publish |
| Logout and different owner | real app logout, new synthetic session p99-B has zero p99-A originals/closet rows |
| Full inherited test suite | node --test --test-concurrency=1 tests/*.cjs tests/*.mjs plus offline build |

## First red and justified red-to-green correction

First commit 8a3cffb124f258a6e92d1c90192e6c9471c1b4c1, run 44021858629:
- genuine chromium and WebKit 320/390/430 native normal-UI acceptance: 6/6 passed.
- inherited Node: 2877 passed, **2 failed**. Both tests/closet-browser.test.cjs failures were missing URLSearchParams in a VM harness, revealed because consumer viewer now active by default. Neither signaled a real mobile browser failure.
- Source guard fixed in commit 8d8e8b1ecf139aef766021dc7cf97f9a56fd977f: optional M59 research gallery only parses query when URLSearchParams and location exist. P99 verifies M59 research opt-in still OFF in ordinary app. Retest newest exact HEAD before claiming full-suite green.

## Unfinished and not certified

- No independent real garment photo classification precision, real installed SegFormer weight reception or P96 high-resolution model egress; out-of-scope tests use existing app native suggestions and synthetic explicit review, not sealed human labels.
- No independently resolved same-photo TWO physical garment ambiguity, shoe pair correctness, or reliable whole-outfit separation on default mode. These remain owner/model workstreams.
- Stale actual asynchronous model worker and 24MP OOM, OS camera capture, genuine OS chooser cancel, cold offline/service-worker install, and iOS/Android device-specific lifecycle not certified. Browser viewport is not hardware.
- Adversarial tampered v3/v4 backup, cross-owner hosted JWT/RLS, destructive rollback resilience remain M3 owner source integrity gates; current script checks normal saved v3 happy path, not hosted security.
- No source-fitted 3D with independent garment boundary/collision/dual avatar human pass; no production release approval.

## Adoption/ownership boundaries

- Protected main PR #1210 retains consumer app.js, outfit-board.js, M3 auth, backup, and worker ownership. P99 edited only its isolated branch. Never cherry-pick whole file without comparing latest M4 head and newer P95/P96/M170 source-honesty changes.
- P99 review candidate: public/outfit-board.js (normal UI + P95 source checks + M59 gate), public/native-outfit-source-plan-p99.mjs, public/native-photo-3d-veto-p99.mjs, public/native-2d-preview-p99.mjs, initial copy wording public/index.html and public/capture-navigation.js, and dedicated tests/CI.
- Rehearse a conflict-aware integration on a NEW non-released branch from latest main M4, re-run pinned tests, and require M4 owner's explicit signoff. Do not bypass #255 or claim complete Mission 4 by passing P99.
