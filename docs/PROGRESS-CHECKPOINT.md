# Restricted staging owner authorization — October 21, 2026

- Owner explicitly APPROVED preparing private staging only, without any production changes or paid services. A public preview, billable Supabase project, production merge, and real customer database access remain **unauthorized**.
- New isolated **draft PR #145** on top of fully verified PR #143 SHA `fd70faa88fb6245e4b065aae3158531b715498e9`: a fail-closed staging-specific builder rewrites Auth, backup, callback and try-on references to an *independent* Supabase staging project, adds a visible disposable-account staging label and new immutable release fingerprint, turns paid AI hard-OFF and rejects both existing Closet Current/Drive Duel project refs. Production app source, original photos, project schemas and deployment workflows remain byte-identical. The build tool and test evidence are in `docs/RESTRICTED-STAGING-SETUP-20261021.md`.
- Initial isolated source guard/full Node regression and synthetic staging bundle QA GitHub Actions **#39654764676 COMPLETED SUCCESS**, 1,476 passed, 0 failed, 3 skipped. This proves only staging *preparation* and isolation, NOT a hosted environment or real hardware. Final source SHA and CI must be rechecked after this checkpoint update.
- **BLOCKING real staging:** the account lists only the existing Closet Current and Drive Duel Supabase projects, not an empty staging project. Creation requires selection of the specific Supabase organization and cost checks; no paid resources may be started without separate approval. The existing Cloudflare Pages project is production; Cloudflare Access for a NEW staging Pages project must be applied and independently verified before any upload (Pages previews are PUBLIC by default). Staging Auth redirect allowlist/email and two-account isolation must also be verified.
- No staging site was deployed. Real Android/iPhone tests = 0; independent human-gold recognition accuracy = null; production promotion **BLOCKED**. See issue #144 and draft PR #145. Drive Duel unchanged.

---

# Easier no-install private full phone pilot results review — October 21, 2026

- **New engineering priority:** draft PR #143, stacked on verified PR #142 source `214b5ef9ac6ace22dcb81b25e7761bc4439eca61`. It creates a standalone offline `OPEN-PRIVATE-PILOT-REVIEW.html` and a short setup guide from the unchanged canonical 17-step Android/iPhone, model-proposal and actual saved-closet validators. No Node, terminal, online account or upload is needed to compare all three report families.
- The page validates app fingerprint consistency, strictly enumerated labels, private/forged report rejection, summaries and replays; shows model versus actually saved outcomes **separately** and invalidates stale output when any file changes. It can export only privacy-redacted aggregate JSON. CI publishes **only source-generated blank HTML/instructions**, never customer data. Its source-bundle/parity test and the existing whole-app/Chromium/WebKit workflows must pass at final SHA.
- This addition changes no production runtime, camera/recognizer, saved wardrobe, Supabase/Auth, original-photo evidence, hosting, license policy or Drive Duel. The reviewer cannot authenticate physical phones, humans or same originals across forms. Real physical phone evidence = 0 supplied, independent human originals = 0; actual saved accuracy = null; promotion `BLOCKED`. See `docs/OFFLINE-PILOT-COHORT-REVIEW-20261021.md` and PR #143.

---

# Cross-check owner-run phone evidence against the actual saved closet — October 21, 2026

- **Next isolated development priority:** draft PR #142 on top of verified PR #141, adding a redacted local-only audit that reconciles three existing independently validated report families: Android/iPhone 17-step device checklist, original-photo model recognition proposals, and final actual My Closet category/type/color outcomes.
- The new cohort audit refuses different app build fingerprints across all three report families, forged private data, inconsistent summaries, duplicate evidence, and output overwrite. It compares *separate* model-proposal and final-saved aggregates, including incorrect automatic saves, blurry photos and reported restoration failures. Anonymous original photos cannot be linked across forms: never calculate combined model-to-saved accuracy or claim genuine physical-phone testing.
- Customer app, accounts, hosted Supabase, recognition, original image/mask, cloud backup and deployment workflows remain byte-identical to PR #141. Exact source guard, full app build, all Node tests and existing Chromium/WebKit mobile browser-form checks are required at the final PR head before declaring this engineering change verified.
- **Launch gates unchanged:** no real physical-device evidence supplied; independent human-original labels 0; verified original category/color and production saved-closet accuracy null; live two-account Auth/RLS/cloud restore and email/legal/figure signoff pending. No merge, production deployment, paid services or Drive Duel changes. See `docs/PRIVATE-PILOT-COHORT-20261021.md`.

---

# Integrated pilot candidate and release preflight — October 21, 2026

- **Latest verified integrated source:** draft PR #140, SHA `c921cfc4ec72ccf5f333df99e6c4d6a20719541d`, GitHub Actions #39642692606 SUCCESS (1,456 Node pass, 0 fail, 3 skip; combined Android Chromium and iPhone WebKit synthetic workflow tests pass). Integrates the separate verified camera/import, original-before-mask recognition, saved outfit, two-account safety, backup, storage and atomic PWA branches with manual conflict resolution. Unmerged, undeployed.
- **Next engineering priority:** isolated draft PR #141 on top of PR #140, a fail-closed preflight that rechecks both main-only automatic deployment triggers, source-only changes, the unchanged human-original-review lock and real-world blockers. The audit intentionally permits `technicalPreflight: PASS` but always reports `productionPromotion: BLOCKED`. Manual deployment workflow_dispatch is still available to authorized users and cannot be prevented by a source-only audit.
- **No real physical-phone or independent human acceptance:** Android/iPhone installed hardware tests 0, independent human garment source submissions 0, gold accuracy null; live disposable two-account Supabase isolation, external email, privacy/terms/deletion and figure-art rights remain pending. No production release or human pilot approval; do not merge/deploy or activate paid services without explicit user signoff. No Drive Duel changes or new separate ChatGPT Work assignment.
- Exact latest head, workflow/test evidence and next steps: `docs/PILOT-RELEASE-PREFLIGHT-20261021.md` and draft PR #141. All previous milestones below are historical source notes, not newer live-release results.

---

# Atomic installed phone-app release consistency — October 21, 2026

- User canceled drafted Work Assignment #139 to conserve Work capacity; all new implementation happens in this primary Closet Current chat. PR #137 mobile photo-memory/storage and earlier Work draft changes are left alone. Source checkpoint PR #138 remains independently verified and isolated.
- Found real PWA update-version risk: old service worker installed a complete versioned release but fetched the online page/scripts first at runtime and **overwrote cached files** with whatever latest server code was served, potentially mixing old/new HTML and JS after deployment.
- One-file worker change makes every complete precached release immutable until a replacement service worker can install. No forced activation. Missing known files return recoverable HTTP 503 instead of silently swapping incompatible code. Private API, Auth, wardrobe IndexedDB, cloud, recognition/photos, styling and deployment files are unchanged.
- Exact scope/source audit, full product build/Node and actual registered Service Worker browser emulation in Android Chromium and iPhone WebKit required for signoff. No claims of physical phone, customer login or human original photo validation. See `docs/PWA-ATOMIC-OFFLINE-RELEASE-20261021.md`.

# Weekly source-verified trend research reminder and safe editorial handoff — October 21, 2026

- Independent maintenance priority: audit the existing curated recommendation library's `updated_at`, `next_refresh_at`, research source/retailer diversity, source checked dates, HTTPS link safety and direction-to-publication support.
- Monday scheduled GitHub Actions check opens or updates **one maintainer issue** when catalog verification is overdue/invalid, providing independent research, rotating magazines, retailer link and price rechecks, and human editorial signoff tasks. Schedule remains **inactive until an explicitly approved merge to default main**; development branch runs only a read-only audit/CI.
- No new catalog or source claims invented. No real live retailer availability checks, no automatic fashion research, no customer-facing recommendation updates, no purchased services, cloud/account/model/garment photo changes or deployments. See `docs/WEEKLY-TREND-EDITORIAL-WATCH-20261021.md`.

# Customer garment editor accessibility and screen-reader form naming — October 21, 2026

- Scoped, isolated from Work's recognition, integration, onboarding, styling, wardrobe backup and storage tasks: the dynamically created photo review and saved-garment editor now have distinct native accessible dialog names. The static outfit picker now references its visible title, and the bulk review category selector has an explicit accessible name.
- Native keyboard Escape, focus and return-to-button behavior retained. Only two exact code insertions in `public/app.js` plus two attribute-only edits in `public/index.html`. No change to source photo, data, styling, recognition, account, cloud, backup, API or human gold evidence.
- Complete regression/Android Chromium/iPhone WebKit emulator verification required before claiming completion. VoiceOver/TalkBack on real physical phones and independent original-photo human reviews remain unverified. See `docs/ACCESSIBLE-GARMENT-DIALOGS-20261021.md`.

# Camera-roll import account switch after asynchronous decode — October 21, 2026

- Independent of Work #126 recognition, #128 branch integration, #130 Auth, #132 outfit visualization and #134 backup: capture importing customer's identity before multi-photo processing and verify it before each original-photo candidate can enter the review queue after asynchronous decoding.
- A changed account cancels pending files, refuses unsaved/old-account review navigation and clears stale private file diagnostics; errors, duplicates and normal 3-argument photo import callers remain compatible. The prior high-resolution photo conversion remains byte-identical. No hosted Auth/cloud settings modified.
- Strict source scope freezes everything except photo batch helper, its customer import handler, existing harness owner fixture, new tests/workflow/docs. Full Node and Android/iPhone synthetic mobile tests required before completion; real phone and true cross-user Supabase testing outstanding. See `docs/PHOTO-BATCH-ACCOUNT-SWITCH-20261021.md`.

# Bounded mobile video frame intake — October 21, 2026

- Scoped to the existing video upload loop: clips up to 180 seconds now contribute at most 20 source-frame attempts distributed across their full duration, preserving the configured 5/8/10-second cadence for shorter clips. This reduces potential memory/storage churn on Android/iPhone and avoids announcing a successful import if no new frames are accepted.
- Video metadata/seek callbacks now verify the original signed-in customer before queuing each frame, and cleanup always pauses, releases media URL and restores controls; recover earlier accepted frames after later media error. Existing recognition original-photo order, Cloud RLS/auth/wardrobe, inspiration styling and parallel Work assignments unaffected.
- Exact previous app tree and updated app blob pinned by source guard; complete Node regressions and mobile Chromium/WebKit synthetic event tests mandatory, not physical camera/evidence. See `docs/VIDEO-IMPORT-BOUNDED-20261021.md`. No deploy/merge, accuracy claims, paid AI or Drive Duel changes.

# Inspiration photo full-source handoff to My Closet — October 21, 2026

- Found a high-impact cross-workflow inconsistency: Inspiration generated a 900px JPEG for look preview but sent that same low-resolution image to the clothing recognizer. New isolated branch keeps preview lightweight while holding the chosen original File in temporary memory and converting through the existing 3072px bounded original-photo import only after explicit Add-to-Closet click.
- Saved looks never persist source File; opening a saved look/new example clears its source, and stale decodes, account switches, duplicate taps and unsupported image retries cannot silently queue old images. No change to PR #129 trends, garment classifier, Supabase owner/cloud, photo-import or human review packet.
- Exact scoped source QA, full Node and Android/iPhone emulation are required for completion. Physical photos/human recognition accuracy cannot be claimed. See `docs/INSPIRATION-ORIGINAL-PHOTO-TRANSFER-20261021.md`.

# Offline-safe verified trend recommendations — October 21, 2026

- Independent of Work #126 garment recognition and Work #128 integration, the Trend Suggestions loader now always compares app-bundled magazine/product library metadata with a potentially older saved phone library; adopts only strictly more-recent source-verified data and keeps the best local cache if GitHub weekly fetch fails.
- Prevents same-time conflicting remote content from replacing verified bundled suggestions without a later check timestamp. No new third-party sources, paid providers or product purchases; no claim of a newly researched weekly fashion library. Current published data source as of 2026-10-19 remains unchanged.
- Exact source lock of `public/outfit-board.js` only, complete Node regressions and browser emulation required. Physical-phone and independently human-labeled garment tests still unperformed, production promotion BLOCKED. See `docs/TREND-OFFLINE-BUNDLED-FALLBACK-20261021.md`.

# Private real-phone pilot evidence coordinator — October 21, 2026

- Separate from Work mode's recognition tasks and the existing camera/import PRs. Reuses the exact frozen Node 17-check Android/iPhone validator in an offline operator page with two local file uploads and a redacted download; no photos, names, cloud writes or credentials.
- Source/runtime and authentication/recognition/figure/closet files are byte-identical to verified PR125. Retain original human recognition accuracy null and real-phone validation false until privately supplied authentic physical-device evidence has been independently checked.
- Full source/regression/Chromium/WebKit suite must pass on final head; no merge/deploy, paid AI, production approval. See `docs/OFFLINE-PRIVATE-PHONE-PILOT-20261021.md`.

# Native camera still bounded high-detail JPEG fallback — October 21, 2026 Pacific

- Builds on validated draft PR #123: original ImageCapture sensor still now tries JPEG quality .94/.88/.82 at the same 3072/2560/2048/1536/1024 pixel frame before dropping resolution. This changes no model, detection/classification order, user wardrobe, original review packet, cloud SQL or paid inference.
- Source-verified exact one-block code change, with cancellation between encode attempts, bounds and non-upscaled source preserved. **No improved true recognition accuracy or physical phone fidelity proven** by synthetic tests; 13-photo independent humans 0, accuracy null, gold promotion BLOCKED.
- Draft-only branch, no merge/deploy/real device access. See `docs/NATIVE-STILL-DETAIL-FIRST-20261021.md`.

# High-detail camera-roll import within existing JPEG budget — October 21, 2026 Pacific

- Additive draft on verified PR #122: when 3072px JPEG quality .94 cannot fit existing 2,850,000-character limit, try quality .88 and .82 at **same pixel frame** before reducing pixels. Keep source before segmentation/mask, bounded retries, photo count/storage limits, account isolation, and unchanged original human photo review artifacts.
- Full Node source, UI and camera/cloud guard regressions plus mobile synthetic-image Chromium/WebKit tests required before calling complete. No assumption of improved garment recognition accuracy, phone hardware validation, released production improvement, merge or paid services. Independent human-gold accuracy remains null; production model promotion BLOCKED.
- See `docs/IMPORTED-PHOTO-DETAIL-FIRST-20261021.md`.

# Two-reviewer offline family evidence coordinator — October 21, 2026 Pacific

- Independent coordinator page generated without attaching any reviewer identity or observations to GitHub. Organizers choose two completed final JSONs locally; drafts are refused, per-source original IDs/hashes checked and disagreements/uncertainties shown as *self-attested only*.
- Browser implementation compared against untouched authoritative `source-holdout-human-review.mjs reconcile()` with explicitly synthetic fixtures, never real human submissions. Keeps raw-submission checksum receipts and manually downloadable report; no backend upload or release promotion.
- Previous PR121 single-file review, source lock, camera, owner cloud, actual recognizer and styling files frozen in isolated PR branch. **0 real independent humans; null gold accuracy; promotion blocked**. Physical phone and genuine adjudication not claimed. See `docs/OFFLINE-TWO-REVIEWER-INTAKE-20261021.md`.

# Offline original-photo review draft recovery — October 21, 2026 Pacific

- Isolated on PR #120 verified source `5b14998f32979e685c932af8fc7d8c986e1e4e58`: explicit user-triggered Save partial draft / Resume saved draft controls, exact original-locked packet and row validation, and unchanged offline reviewer source images.
- Every import verifies original 13 JPEGs first, rejects malformed/duplicate/wrong-hash/unapproved-category rows atomically, and resets all five human attestations; final export still requires complete observations, genuine reviewers and truthful statements.
- New chromium/webkit fixtures exercise interrupted-session round-trip without counting synthetic rows as human review; all customer production/auth/cloud/model/mask/recognition files unchanged. Human-reviewed accuracy **null**, promotion **BLOCKED**. No merge/deployment, hosted state changes, physical-phone proof or paid AI.
- Exact-head CI evidence is recorded in PR description after verification; see `docs/ONE-CLICK-HUMAN-REVIEW-20261021.md`.

# Easier single-file independent original-photo review — October 21, 2026 Pacific

- Generated offline one-file HTML from 13 unchanged SHA-256 locked original JPEGs. A blind reviewer no longer has to select files; original-byte checksum and full-image display must pass before observations can be recorded.
- Includes large Previous/Next controls, unchanged family uncertainty/evidence intake, blank export gate, and no network upload/automatic submission. Human review submissions remain 0; measured human accuracy null; customer recognition promotion BLOCKED.
- Source-only additive changes, exact prior customer runtime and cloud/photo lock. Real phone and genuine independent human observations are still outstanding. See `docs/ONE-CLICK-HUMAN-REVIEW-20261021.md`.

# Integrated human-review readiness with cloud conflict recovery — October 20, 2026 Pacific

- Isolated branch `integration/cloud-retry-human-review-safe-20261020` pins unmodified five PR #117 readiness source blobs to exact reviewed head `218ac1ea98333e72b7ccc090a13a46f581015dc3` on verified PR #118 cloud base `f16fce2956688e576edde6ecfdc390d3f46158a3`.
- Complete existing real-closet/customer runtime unchanged; reviewed Keep both cloud retries and source-locked original-photo human review coexist without production authorization. Exact-blob audit and both historical cloud/pilot guards remain active.
- Dedicated real Chromium/WebKit and original JPEG presentation verification workflow added; real human submissions remain **zero**, accuracy **null**, promotion **BLOCKED**. Branch is development-only, not merged or deployed. See `docs/INTEGRATED-CLOUD-HUMAN-REVIEW-20261020.md`.

# Keep both versions across interrupted cloud sync — October 20, 2026 Pacific

- Stacked isolated branch `fix/cloud-conflict-keep-both-retry-20261020` onto previously verified combined draft PR #115 `6ebcf6d9dcfd18611c3248242b62208eb9923385`. No modifications to PR #113, Work-owned human-label collection, independent model, original/source-locked photos, or `main`.
- Identified genuine customer-facing conflict recovery race: the `Keep both versions` selection was lost when it overlapped an active cloud request or encountered a network/RPC reply failure. A subsequent automatic sync defaulted to a conflict again, requiring duplicate user input.
- Added owner-session-scoped `pendingKeepBoth` flag, set only by an explicit user resolution. The flag survives overlapping requests, failed photo upload and failed/lost server responses; clears on confirmed commit, clean sync, new account session, pagehide and BFCache resume. Server CAS revision, deterministic duplicated garment IDs, local storage and cloud owner privacy checks remain unchanged.
- Six new actual-client cloud conflict/failure/owner-isolation regression tests, an independent real Chromium Android/WebKit iPhone mobile simulated-cloud flow using actual IndexedDB, and a dedicated full suite and source-locked proof gate in `.github/workflows/cloud-conflict-retry-qa.yml`.
- Historical PR #115 photo/human source gate and camera/tenant review remain active. Exact Git-reviewed new cloud client at `9137b448d24b4904c0477b2f854171c546b25a16`; customer model/photo masks and hosted cloud settings unchanged.
- First focused/full successful CI on working branch reported **1,311 pass, 0 fail, 3 skip** and 26 focused pass. Confirm final exact-commit suite and mobile engines before completion report. Synthetic remote fixtures only, no real physical phone, hosted Supabase changes, paid services, production deployment or customer wardrobe access.

# Isolated verified customer + blind-photo-source integration — October 20, 2026 Pacific

- **Integration candidate, not production:** `integration/cloud-styling-blind-photo-rc-20261020`, built from PR #114 exact code SHA `05f1bdf071a75e2bac2eaf9ecb66c2f1e63d7132`, with **12 original Git blobs** from PR #113 head `71053247402d2e428044ef38b359057011335823`. Imported as one additive, one-parent commit `45765b19b8db2976ebd66907daa16856f680ac35`. Neither source branch, Work-owned PR #108, nor `main` was merged or edited.
- Proof: `scripts/check-blind-photo-cloud-integration.mjs` requires byte-identical customer cloud/Auth/recognition/photo/styling code, 12 exact imported photo evidence blobs, locked pre-inference source hash, and no fabricated human label. Production model promotion remains `BLOCKED` because **zero authenticated independent human reviews** exist.
- Three integration CI jobs verify full Node/build and source guards; Chromium Android and WebKit iPhone **browser emulation** for owned-wardrobe styling and safe cross-account cloud; original 13-photo source SHA-256 download and **empty** family-review packet. CI exact final SHA needs to be confirmed after this checkpoint.
- App photo capture, catalog colors, subtype models, customer identities, private cloud backup, Supabase migration/hosted configuration, registered domains and Drive Duel runtime remain untouched by this integration commit. This candidate is unmerged, undeployed, no paid service or actual customer data used.
- Remaining launch gaps: independently verified human original-garment labels, real physical-phone camera/closet QA, live cloud restore and SMTP/canonical URL verification, and controlled integration/approval for outstanding PR chain.
- Detail in `docs/CLOUD-BLIND-PHOTO-RELEASE-CANDIDATE-20261020.md`; retain all historical verified development checkpoints below.

# Cross-account cloud IndexedDB owner binding — October 20, 2026 Pacific

- Isolated `fix/cloud-db-owner-binding-20261020` from fully tested draft PR #112 `af8738abead9419ef8fc66717233975487c87cc3`. No changes to main, Drive Duel, published production app or Supabase configuration.
- Reproduced a cross-account privacy-risk in `public/cloud-backup.js`: a valid newly signed-in Supabase Auth user might receive an old user's local IndexedDB object because the cloud client checked generation/auth owner but **not the actual IndexedDB database name**. A mismatch could cause the stale local user's photos/outfits to be read or backed up with the new owner's token.
- Client checks exact `closet-current-user-<auth UUID>` name at `start`, every async `current()` operation, and BFCache page-resume. If stale DB is presented, **no cloud request, local modification or dirty flag occurs**; user sees reload/sign-in guidance. Recovery works by opening the actual new owner's DB and calling start again. No silent relabeling of previous user data.
- Updated complete mocked owner-bound database fixtures and added 4 additional tests covering stale cross-account start, valid new-account recovery, BFCache leakage refusal and pending token-binding race. Existing cloud merge/conflict and photo checksum source intact.
- Chromium Android/WebKit iPhone browser experiment uses actual named IndexedDB and synthetic intercepted cloud replies, explicitly attempts wrong-A database under B and confirms correct new B restore with late A response ignored.
- The immutable source verifier reconstructs only **three exact changes** to cloud client against PR #112 and preserves all prior camera, source RGB recognition, reusable human assets, tenant-owned wardrobe styling and pilot-release gates. Dedicated CI in `.github/workflows/private-cloud-owner-db-binding-qa.yml`.
- Final exact-head CI status must be checked after this checkpoint. No real hosted RLS/storage validation, physical phones, deployed backend writes or independent real-photo model improvement has been claimed.

# Account-safe styling source identity at final outfit commit — October 20, 2026 Pacific

- Started isolated branch `fix/stylist-owned-source-commit-guard-20261020` from verified draft PR #110, SHA `ba4e2155fed86174a4043b0f8bf08334bda42ecf`. Work owns independently photographed garment benchmark and PR #108 integration audit; no overlap.
- Fixed stale Style My New Clothes **Preview** and **Save outfit** across same-ID garment re-photographing, category/color/pattern/season corrections and pending account changes. Source snapshot + active owner-owned database must match when preview becomes visible and at **final queued IndexedDB save transaction**. On mismatch no outfit write is allowed; user is directed to recreate current options. Previous cross-tenant storage guard remains.
- Added 7 focused saved-garment/account mutation tests; updated the existing realistic preview/recovery fixture to bind the simulated user to their database. Existing customer-original-photo styling tests continue to assert owned-only three outfits, pinned anchor and no invented shopping pieces.
- `scripts/verify-camera-cloud-integration.mjs` pins the two modified customer source files by exact Git-reviewed blobs and preserves all upstream original-camera/human asset lineage. Dedicated GitHub Actions runs full regression/build and actual Android Chromium/iPhone WebKit simulated mobile `Style this` flow, without live customer accounts, deployed Auth or paid AI.
- This is an **unmerged development safety fix**, not complete end-to-end live cloud backup or physical-phone proof. No production cloud/Auth modification, deployment, Drive Duel edit or paid service activation.

# Manual masked-crop and outfit palette provenance safeguard — October 20, 2026 Pacific

- Isolated customer-facing development branch `fix/masked-photo-color-evidence-20261021` based on verified draft PR #109 head `a6ee34a676030cff2a4fcf3b31185275c78371a7`. Parallel Work session owns new independent ground-truth photographic benchmarks; this branch never touches models, photo manifests, or recognition vectors.
- Found 2 trust bypasses: hand-edited mask received `colorMethod='garment-mask'` after just one alpha-color histogram; outfit proposals with missing original/JPEG crop provenance or unverified estimates were also force-labeled mask-verified.
- Fixed manual crop using a conservatively eroded foreground interior and existing two-view confirmation before granting verified color; fixed outfit capture consumer to require SHA-style original JPEG data URLs, two-view numeric support and explicit source, otherwise keep color in review. The unchanged original RGB still drives recognition. Existing owner edits and automatic outfit proof colors preserved.
- Added **8 new targeted pixel/evidence unit tests**, **3 new in-flow candidate source regression tests**, updated old simulation fixtures to include actual worker-supplied original image and confidence contract, and new Chromium Android / WebKit iPhone mobile-emulation tests. Release provenance verifier strictly reconstructs only the two approved public app changes, reviewed photo crop editor and independent human/camera source review extension.
- Initial completed pre-browser full-suite [Actions #39537717176](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39537717176) SUCCESS, **1,271 passed / 0 failed / 3 skipped**, 89 focused passes, full build and historical source/pilot gates. Final exact-head browser and suite run requires confirmation.
- No customer photos or storage modified remotely, no paid AI, production merge or deployment, no private Supabase writes and no Drive Duel edits. Physical phones and independent garment masks not yet validated.

# Independent second encoder real-photo subtype trial — October 20, 2026 Pacific

- Based on verified draft PR #107 exact head `9b2cfa722cee058ab5de22d569ded02ffec23134`, isolated branch `research/independent-clip-garment-subtypes-20261021`. No overlap with parallel Work-owned branch integration.
- Evaluated genuinely **independently trained** generic CLIP model `Xenova/clip-vit-base-patch32` revision `d15189d` against exact immutable FashionCLIP outputs from PR #107 on **59 SHA-256 verified original RGB garment/control source photos**. All model execution stayed in GitHub Actions; no customer device model or photos were modified.
- Experimental rule requiring both models to agree on an automatic subtype would catch **1 of 4** existing wrong automatic clothing subtypes but incorrectly defer **12** correct automatic saves; **3** wrong subtypes still pass the agreement rule. **REJECT candidate** and retain production recognizer completely unchanged.
- Initial source and real inference [Actions #39536012914](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39536012914) SUCCESS: **1,260 full Node tests passed / 0 failed / 3 skipped**, **20 focused** passed; build, high-resolution original-photo provenance, source-reviewed human figures and release veto passed.
- Research scripts/tests/workflow/results rationale documented in `docs/INDEPENDENT-CLIP-SUBTYPE-TRIAL-20261021.md`. Final exact-head CI will be validated after documents/checkpoint.
- Model accuracy remains an unresolved production pilot blocker. Future improvement requires **new untouched independent original-photo sources and physical garment-form evidence**, not tuning to the four observed error IDs. No merge/deploy, paid AI, Supabase live writes, customer data access or Drive Duel edits.

# Original RGB multi-view subtype agreement trial — October 21, 2026 Pacific

- Began from draft PR #106 exact verified commit `55bd2fac37d45409473485b84e555ebab07d9630`. Isolated experiment branch `research/original-photo-subtype-consensus-20261021`. Work-mode branch integration audit assigned separately, with no file overlap or production merges.
- Implemented only experimental `scripts/trial-original-subtype-consensus.mjs`, independent 9-test review/abstention unit checks, and `.github/workflows/original-subtype-consensus-trial.yml`. Original clothes classifier, recognizer vectors, photo cropping/masks and wardrobe files remain byte-identical. Full app and historical human/Camera provenance gates unchanged.
- Real source-hash-pinned Chromium inference under [Actions #39533805104](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39533805104) completed SUCCESS across 59 source photographs with 288/320/336 alternate original-photo framings. Full Node **1,255 passed / 0 failed / 3 skipped**; focused 19 passed.
- Real measured automatic-subtype trial: a conservative 3/3 original-photo view consensus policy prevented **only 1 of 4** known incorrect accepted types while diverting **13 correct** autosaves to review; balanced 2/3 prevented **0 of 4** wrong types while diverting **4 correct**. Jacket mislabeled Blazer, Blouse mislabeled Tunic and sneakers mislabeled ankle boots remained highly stable under all three view sizes. These are still model errors despite confidence.
- **Both policies REJECTED for customer deployment**. Recognition promotion remains **BLOCKED**. No claim of 100% recognition or net accuracy gain; next research must obtain fresh independent physical garment-form evidence instead of relying on correlated views of the same model.
- Full trial evidence and per-set results: `docs/ORIGINAL-SUBTYPE-CONSENSUS-TRIAL-20261021.md`. Exact final-head CI must be checked after this checkpoint/documentation commit. No deployment, hosted changes, customer photos, paid AI or Drive Duel modifications.

# Independent real-photo recognition safety admission — October 20, 2026 Pacific

- Based on draft PR #105 verified exact head `cebbdab60eb85af914d8ce39ac6f62fdb00e8f0a`, new isolated branch `qa/real-photo-recognition-admission-20261020`.
- Introduced `scripts/audit-recognition-admission.mjs`, `tests/real-photo-recognition-admission.test.mjs`, dedicated fresh inference GitHub Actions and `docs/REAL-PHOTO-RECOGNITION-ADMISSION-20261020.md`. Existing model/weights, source RGB recognition, garment taxonomy, camera, storage, AI rendering and customer-data paths unmodified.
- Frozen historical baseline (not a new run): reviewed-32 **25 strong / 1 wrong subtype**, holdout-16 **6 strong / 3 wrong subtypes**, fresh-11 **9 strong / 0 wrong subtype**; baseline source IDs and observation SHA provenance preserved.
- **Actual new inference** in [GitHub Actions #39531944295](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39531944295): SHA-256 verified 48 distinct licensed Commons photos plus 11 validation photos (59 total) with original pinned browser FashionCLIP; reviewed-32 **31 strong / 1 wrong subtype**, holdout-16 **7 strong / 3 wrong subtypes**, fresh-11 **9 strong / 0 wrong subtype**. Holdout broad-category full-set accuracy **8/13 (61.54%)**, all three non-garment controls rejected. Four actual wrong subtypes: `commons-0064`, `commons-0003`, `commons-0014`, `commons-0078`.
- The audit rejects missing/duplicate/unverified sources, incorrect automatic categories, wrong strong subtypes, false-positive nonclothing and malformed category-only reviews. **Recognition promotion remains BLOCKED** on actual source-matched results; false claims of 100% recognition forbidden.
- Previous code+full-suite run [#39531944295](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39531944295): **1,246 passed / 0 failed / 3 skipped**, original camera/review provenance gates passed. Exact final-head CI must still be checked after final document/checkpoint commit.
- This is completion of **independent evidence collection and recognition promotion safety QA**, not a model accuracy fix or production launch; new independent physical-garment labels and untouched holdout required before future classifier changes. No merges, deployments, real customer data, hosted Supabase changes, paid AI or Drive Duel edits.

# Duplicate-safe review and final closet indexing — October 20, 2026 Pacific

- Branched `fix/duplicate-indexing-commit-guard-20261020` from verified draft PR #104 exact SHA `844ccd64c90d5b31664b422b07bf301b5071bf60`.
- Fixed two independent customer-facing failure paths: an outfit-derived article with a repeated display preview and incomplete original RGB provenance is **retained for review instead of silently discarded**; a duplicate/lookalike arriving after recognition but before final IndexedDB storage is **blocked from automatic save** and flagged for review. Preserved standalone exact duplicates, full original photo capture, distinct garment regions and manual category edits.
- Added five new `tests/automatic-indexing.test.cjs` regressions: missing RGB/full scene, two incomplete layered garments, concurrent identical image save, concurrent visual lookalike, and distinct nonmatching photo allowed. Total focused regression suite: 67 passed / 0 failed.
- Strict `scripts/verify-camera-cloud-integration.mjs` and independent `scripts/check-dual-parent-review-integration.mjs` both require **byte-exact comparison to the PR #104 application with only these two reviewed changes**, while retaining original reviewed camera, classification, photos, human-source assets and no-release veto.
- Verified working-code commit `74e47bb9e3ea77fa90d8406fae7fd3b664e64089`, [CI #39530698177](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39530698177): SUCCESS, **1,238 full Node passes / 0 failed / 3 skipped**, plus 67 focused passes, build and independent provenance. Final post-documentation exact-head CI must also pass.
- This discrete duplicate-indexing development scope is not real-photo accuracy proof or production authorization. Hosted SMTP/redirect and private-cloud permissions, physical phones, independent mask evaluation and licensing remain open. No paid AI, production deployment, hosted data changes or Drive Duel edits.

# Verified original-pixel garment color indexing — October 20, 2026 Pacific

- Development branch `fix/verified-garment-color-provenance-20261020`, based on draft PR #103 exact SHA `a441f791283596bdc7bc08fe3446c41fd64f1bce`.
- Found that `ClothingDetails.fillColor` dropped `garment-mask` verification provenance. This allowed later model color predictions to overwrite a previously trusted original-pixel garment color. Fixed method retention for trusted garment-mask and verified uniform-light-background observations. A later ordinary photo-estimate explicitly clears stale mask provenance to prevent inheriting old verification.
- Strict regression covers blue shoe versus red model guess, verified-background foreground, uncertain masks, user edits, ordinary photo colors, spoofed methods, mismatched categories and changed-source stale evidence (8 focused new tests).
- Source-integrity audit verifies `public/clothing-details.js` differs from PR #103 only in the exact approved helper replacement. Original RGB recognition, segmentation, camera, human fitting and all model assets unchanged.
- Verified pre-doc CI [#39529654775](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39529654775) SUCCESS on commit `dbd97f5092ba7ede50c5676554a96488d5f9417a`: 69 focused tests passed, full Node **1,233 passed / 0 failed / 3 skipped**, build and provenance release veto passed. Final exact-head workflow must be verified after this checkpoint.
- This is a narrow correctness fix, not production deployment, proof of 100% real-photo recognition or pilot launch approval. Still pending: independent real masks and phone color measurements, SMTP/redirect allowlist, staged private cloud permissions and actual physical phones.

# Hosted email canonical-origin transition guard — October 20, 2026 Pacific

- Based on PR #102 exact verified commit `7537b1eb4e73adfcf764cf03dc63851706cd89b7`; isolated `fix/auth-redirect-origin-cutover-guard-20261020`.
- Customer-facing authentication messages now explain the existing cross-origin email return **only on the shared Cloudflare site**, with a separate-device-storage warning; unchanged on GitHub Pages. Signup, resend and reset still all use the **same existing GitHub Pages callback**, with no unauthorized hosted destination switch.
- Added `scripts/check-auth-email-cutover.mjs` to reject unknown/HTTP/query/fragment/unreviewed redirect targets, prohibit Cloudflare cutover without explicit signoff and require one fixed encoded URL for signup, resend and reset. Mocked alternate Cloudflare path is tested but **not enabled**.
- Initial successful CI [#39528590574](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39528590574) on pre-doc head `354430f5d40db8f06b07ae9662d064d42c76ee59`: **1,225 pass, 0 fail, 3 skipped** full Node; 46 focused Auth + redirect tests pass; integrity/provenance and no-release gates pass. Exact final-head CI must be rechecked after documentation/checkpoint updates.
- Full details and staged admin approval checklist: `docs/AUTH-EMAIL-CANONICAL-CUTOVER-PREPARATION-20261020.md`. Public Auth settings cannot verify private Redirect URLs allowlist, SMTP credentials/domain, real external inbox deliverability or physical phone account restoration. **Those are still hosted pilot blockers, not completed release conditions.**
- No current app production merge, hosted settings changes, external email, real customer access, Drive Duel change or paid service.

# Mobile email confirmation/recovery browser QA — October 20, 2026 Pacific

- Branch `qa/auth-email-mobile-browser-20261020` built on verified draft PR #101 `7a30d1e8c57c4f596acd4619e57005446537703b`; newly isolated draft PR #102.
- Real browser DOM/touch rehearsal runs unchanged `public/auth.js` + pilot notice in Android-style Chromium root path and iPhone-style WebKit nested path, with all network Auth calls intercepted in-browser (zero actual hosted Supabase requests).
- 8 fresh isolated scenarios per engine: expired/error link, invalid hash, unsupported PKCE code, token-hash signup + refresh after reload, substituted user, existing implicit callback, recovery touch/password toggle requiring verified update and recovery user mismatch.
- Pre-check [CI #39527326220](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39527326220) SUCCESS on script/checks `2366a5d96f7ec3c6724104c0dd5d9f7d2b22a7a6`: both engines **8/8**, full Node **1,220 passed / 0 failed / 3 skipped**, original-photo/camera/human review and release-veto checks passed.
- A final exact-head CI run must also be verified after checkpoint/doc commits; **this is browser emulation only**, not physical Android/iPhone, mail-client, real external inbox or hosted dashboard Auth SMTP/allowlist validation.
- No launch authorization, hosted Auth or production modifications, merge/deployment, paid AI or Drive Duel change.

# Disposable local Auth email verification — October 20, 2026 Pacific

- From draft PR #100 `fefdd165cb1ec66bb935a516598829e435a8f128`, isolated `qa/disposable-auth-email-link-20261020`.
- Dedicated synthetic-local acceptance uses Supabase CLI 2.121.0 Auth plus Mailpit, **not hosted SMTP**. Config is modified only in `RUNNER_TEMP`; tests real confirmation email, explicitly allowlisted GitHub Pages + Cloudflare redirect destinations, rejected unconfirmed/reused links, valid local user session, password recovery and old-password invalidation.
- Tests never contact hosted Auth, follow a one-time link into a deployed site, send external messages, log actual tokens/identity, or touch real users/photos. Real hosted dashboard allowlist, sender/domain and external inbox receipts remain unverified.
- Add dedicated workflow, refusal-of-hosted-execution tests, historical provenance gates, and `docs/DISPOSABLE-AUTH-EMAIL-REAL-SERVICE-20261020.md`.
- Exact-head real local mail acceptance result must be read from GitHub Actions before declaring this discrete task verified; **not** production pilot approval. No hosted migration, merge, paid services, or Drive Duel modifications.

# Read-only live Auth email/domain preflight — October 20, 2026 Pacific

- Based on verified draft PR #99, exact source commit `4b87db357fcf29d08979983c4a2b8415e77c1fbc`, isolated branch `qa/live-auth-domain-readiness-20261020`.
- Found static mismatch: shared Cloudflare origin `https://closet-current.pages.dev/` vs signup/resend/recovery redirect `https://nickhaney916-lang.github.io/Closet-Current/` currently hardcoded in `public/auth.js`. Preserved live redirect until owner-approved allowlist/sender review.
- Supabase project management metadata remains healthy; private Auth redirect allowlist, SMTP sender and inbox delivery are *not available* from read-only project status. Model-hosted HTTP probes of the two public hosts did not return pages; this is an inability to verify, not a confirmed outage.
- Add GET-only externally executed dual-host and public Supabase settings audit, constrained flags/no body/secret printing, explicit `releaseDecision=BLOCKED`; six synthetic safety/fail-closed tests and full-scope CI with original source/human review gates.
- Workflow `.github/workflows/live-auth-domain-readiness-qa.yml`; specific live network and full suite results must be checked at exact commit before treating **the audit development** as verified.
- No hosted SMTP or Auth edits, actual emails or test accounts, main merge/deploy, paid AI, Drive Duel or garment camera/indexing changes. Physical Android/iPhone, admin allowlist and SMTP/email receipt plus approved security rollouts remain release blockers.

# Email confirmation and recovery callback hardening — October 20, 2026 Pacific

- New isolated branch `fix/auth-email-link-callback-20261020`, based on PR #98. Keeps existing GitHub Pages Auth redirect while canonical Cloudflare origin and hosted Auth allowlist remain unverified.
- Explicit app-return `token_hash` signup/recovery/email callbacks now call Supabase Auth verification and compare the returned signed-in user against an independently fetched user before showing a wardrobe. Existing implicit fragment callbacks remain intact.
- Recovery remains locked until verified password change; unsupported PKCE code, invalid/expired hash, identity disagreement or ambiguous URL fails closed. Removes one-time credentials from browser history before requests.
- Six new callback regression tests, dedicated GitHub Actions full Node/build regression and review provenance checks, and `docs/AUTH-EMAIL-LINK-CALLBACK-20261020.md`.
- CI exact-head verification pending; do not treat simulated Auth replies as external inbox delivery proof.
- No paid AI, customer data access, Drive Duel changes, hosted Auth/SMTP modifications, main merge or deploy. Pilot is still blocked on real email/redirect approval, physical phones, security schema authorization and independent garment masks.

# Auth session race closure — October 20, 2026 Pacific

- Based on PR #97's verified local Supabase stack commit `ce48891500b6c2afa1e35cdda427ec5ef4413af5`, isolated branch `fix/auth-refresh-logout-session-race-20261020`.
- Prevent an in-flight Auth token refresh from writing old credentials or reopening a wardrobe after logout: retire session and clear token locally before remote logout, guard delayed refresh against exact source session/user/auth version, serialize concurrent refresh and duplicate logout.
- Add three concrete deferred-response and successful refresh regression tests, a full-suite CI workflow, source-lineage gate allowlist, and `docs/AUTH-SESSION-LIFECYCLE-20261020.md`.
- Verified predecessor code head `dacd19f38cebc80b63fc9723c8829a49ee8afb9c`: [GitHub Actions #39523352012](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39523352012) **SUCCESS**; full Node suite **1,205 passed / 0 failed / 3 skipped**, targeted Auth/cloud session checks **39 passed**, source parent lineage and customer release veto both passed. This checkpoint-only update changes no application code.
- Do not merge/deploy or change hosted Auth/SMTP redirects, paid services, customer data, Drive Duel or original photo/mask sources. External inbox and physical-device verification remain release blockers.

# Camera startup and recovery — October 20, 2026 Pacific

- Isolated `fix/camera-startup-recovery-20261020` based on PR #89 exact
  `7fe867fdd392759e0b5106d529e60a37c6438ef7`; source branch unchanged.
- Reproduced six failing lifecycle regressions before implementation: hung
  permission, hung optional audio, blocked retry/obsolete cleanup, hung playback,
  late playback resetting new counters, and missing track-ended recovery.
- Bound permission + preview startup to 15 seconds, cancel old attempts when
  leaving, release late grants and already granted-but-unattached streams, and
  isolate old promise cleanup from the next camera/import operation.
- Optional audio resumes asynchronously and reuses its context. Ended tracks
  restore camera choices with restart guidance and preserve captured photos.
- Seventh regression covers cancellation between grant and preview attachment.
- Local build and complete Node suite: **1,186 passed / 0 failed / 3 skipped**
  (1,189 total). Browser executables unavailable locally.
- Runtime `d7af43aec8e70599f4eb9a944bb93af029985f9d` verified by
  [CI 39503733913](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39503733913):
  SUCCESS, full Node suite plus Android Chromium and iPhone WebKit recovery,
  native JPEG size/EXIF/color checks and source-preservation checks passed.
- New browser harness exercises simulated permission/media/playback faults in
  Android Chromium/iPhone WebKit; this is not physical sensor validation.
- Retain PR #89 native resolution/budget/orientation behavior and original RGB
  recognition before clipping. Integrity check permits camera lifecycle changes
  only; non-camera app bytes and independent review evidence remain protected.
- Physical phones still required: permission sheets, background/foreground,
  camera interruptions, autofocus, actual garment color/detail and memory/latency.
- No merge/deploy, paid calls, Drive Duel changes or updates to PR #88/#89.

# Native camera continuation — October 20, 2026 Pacific

- Isolated branch `fix/native-camera-fidelity-20261020` from PR #88 exact
  `ccf308b3807bc5f2b321699a306d7157daf4a845`. Source branch is untouched.
- Native stills attempt 3072/2560/2048/1536/1024px at JPEG .94, capped at
  2,850,000 data-URL characters. No enlargement, crop, recoloring or sharpening.
  Each attempt draws from the original oriented decoded bitmap.
- Keep 2048px video-frame ceiling for automatic capture/mobile cost; add the
  same encoded-size ceiling with 1536/1024 fallback. Reject invalid encodes.
- Four-second native timeout invalidates the capture synchronously. Late blobs
  cannot decode; late decoded bitmaps close without touching shared canvas.
  Existing active-session checks and retry remain in place.
- Explicit EXIF-from-image decoding and default browser color conversion.
  Portrait/landscape minimum dimensions are symmetric. Reject blobs over 32MiB.
- Recognition still receives full-scene original-derived JPEG before clipping;
  this does not preserve raw sensor bytes or establish garment color accuracy.
- Verified runtime `7a31514870da1f5145e68e0a929e29f7af58db4d`:
  [CI 39500714377](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39500714377)
  SUCCESS. Build, full Node suite **1,179 passed / 0 failed / 3 skipped**,
  source/duplicate protection and history/source integrity gates passed.
- Android Chromium and iPhone WebKit both decoded a synthetic 4000x3000
  sensor JPEG to 3072x2304 within budget (509,323 / 547,091 characters).
  EXIF orientation 6 became 300x400 with correct red/blue patch placement;
  measured RGB [224,31,32] / [32,64,224] in both engines. This tests decoder
  behavior, not native hardware or independently measured garment fidelity.
- Ten new Node regressions cover native/video size fallback, invalid encodes,
  portrait dimensions, timeout/decode races, retry and small-source behavior.
- Initial CI failed because the historical integration gate froze app and
  checkpoint bytes. The amended gate binds all non-camera app bytes to its
  original customer parent and preserves the complete prior checkpoint suffix;
  independent review blobs and original merge ancestry remain protected.
- Local execution environment unavailable; all reported execution is GitHub CI.
- Physical Android/iPhone tests remain required: autofocus, low light/motion,
  native sensor resolution/EXIF/wide-gamut behavior, permission/lifecycle recovery,
  sustained capture memory/latency and saved garment detail/color fidelity.
- No merge, deployment, paid inference or Drive Duel changes.

# Closet Current master development checkpoint

## Owned recommendation quality branch — October 20, 2026 Pacific

- Isolated `work/owned-recommendation-quality-20261020`, based on PR #69 exact
  verified `d6d2f713`; source #69, annotation #72 and figure #58 untouched.
- Six failing recommendation regressions reproduced and fixed: winter sweater
  dresses excluded, dresses crowded out by many shirts, anchor coordination
  ignored before shortlist cutoff, options repeating only footwear, partial
  separates padding complete dress looks, and unknown color labels undisclosed.
- Preserve eight tops and eight dresses independently; score anchor harmony
  before shortlisting. Choose compatible dress/separates structures, then vary
  main clothes, then footwear. Return the best available required-slot coverage
  only, with explicit missing pieces when the closet cannot form a complete look.
- Casual now supports sweater dresses, jumpsuits and rompers; casual date night
  supports sweater dresses and jumpsuits. Existing dress/no-bottom/no-layer rules,
  owned-only IDs, pinned new piece and season/occasion checks remain unchanged.
- Dress swaps are labeled Swap dress; jumpsuit/romper swaps say Swap one-piece.
  Unknown colors and one-piece structure are explicitly disclosed on cards.
- Style this and fresh recommendation requests also validate the current
  account/database binding, clear prior-account anchors/results and show reload
  guidance. Two additional failing regressions reproduced this ownership gap.
- Initial recommendation runtime `e91aa30a` passed CI 39454476209 and 39454476112,
  including both browser engines; the later final runtime CI below validates the ownership follow-up.
- An independently reproduced preview regression restarted identical pending
  image work across browser events. Same-input active renders now share the
  pending decode and its original bound, while changed sources/accounts/boards/
  databases still replace it. Browser stress requests the preview every 200ms
  while decode is stalled. One new behavioral regression failed before this fix.
- Local build and Node suite **1087 passed / 0 failed / 3 skipped (1090 total)**;
  Python **37 passed**. Exact runtime `0b80791559c6628a110d7112b094607ce31bb434`
  verified: CI 39455937393 (customer/fitting) and 39455937495 (camera/indexing)
  SUCCESS. Both Android Chromium and iPhone WebKit passed recommendation quality,
  dress swap/save/reload, account isolation and 200ms stalled-decoder stress.
  Screenshot/JSON artifact 12280102669; zero customer page errors and zero remote
  POSTs in both fitting profiles. Draft recommendation PR #74. Harness adds actual
  dress-swap/save/reload, owned-only structure and varied-bottoms checks in both
  Chromium and WebKit; synthetic fixture identity/images, no real-photo score.
- Per-request slot-ranking cache reduces a synthetic 100-item local profile
  from 24,668 garment-score evaluations to 140; warmed medians 145.8ms vs 141.5ms
  are noisy and do not establish a physical-phone speed improvement.
- Details: OWNED-RECOMMENDATION-QUALITY-20261020.md. No merge/deploy, paid calls,
  source-photo/recognition changes, annotation scripts or original art edits,
  customer-photo uploads or Drive Duel changes.

## PR #69 account/database ownership continuation — October 20, 2026 Pacific

- Continues isolated integration PR #69 from exact verified head `c49b8891`;
  PR #64/#65 source branches and all protected mask/figure work unchanged.
- Reproduced four failing regressions: requests begun after an identity change
  could reuse the previous account's open IndexedDB; a same-identity database
  replacement during final decode was also missing from cancellation checks.
- Outfit persistence and saves require a signed-in owner matching the native
  `closet-current-user-<owner>` database name, before enqueueing and again inside
  the write. The renderer validates the same binding before decoding/reusing
  images and rechecks the captured database after asynchronous work.
- Wrong-account requests leave no garment layers or selfie and show reload /
  sign-in guidance; same-account recovery remains possible after valid reload.
- Build passed; full local Node suite **1078 passed / 0 failed / 3 skipped**
  (1081 total); Python **37 passed**. Four new behavioral tests failed before
  the fix. Exact runtime `875bd61fc3102c90ef4579bb377623a7ec9823b9` verified:
  customer/fitting CI 39450202771 and camera/indexing CI 39450202746 SUCCESS.
  Both mobile engines passed the mismatched-database checks with two rejected
  writes, zero readwrite transactions and zero published garment layers.
  Both fitting profiles passed; zero page errors/remote POSTs there. Screenshot
  and JSON artifact 12278895682 records the actual emulation evidence.
- Browser journey now also attempts new saves and previews while the previous
  database is open under a changed identity, asserting both writes reject,
  zero readwrite transactions, no saved additions and no garment publication.
- No production merge/deploy, paid calls, customer upload, recognition/source
  photo changes, mask-evidence scripts, figure artwork or Drive Duel changes.

## Isolated styling workflow integration — October 20, 2026 Pacific

- Integrates #64 `da7138ac` and #65 `6bf0364c` on their independently verified
  common foundation #51 `9d1dd7d4`; source branches and protected work unchanged.
- New branch: `integration/style-new-clothes-64-65-20261020`.
- Combines single-item entry and source/account stale-render checks, successful
  preview reuse, five-second bounded decode/cache eviction, immediate focused
  model handoff and queued durable owned-outfit saves with failure recovery.
- Fixes returning to an earlier outfit while a different render is unfinished.
- Build passed; local full Node suite **1074 passed / 0 failed / 3 skipped**.
  Local Python suite: **37 passed**. Exact runtime head `d47eccb8` verified:
  CI 39447656592 (customer workflow/fitting) and 39447656752 (camera/indexing)
  both SUCCESS. Android Chromium and iPhone WebKit styling, IndexedDB abort,
  320/390/430px layout, final-decode source/account race, retry and fitting checks
  passed. Zero page errors; fitting profiles reported zero remote POSTs.
  Twelve identical-preview requests retained decoded nodes with zero DOM mutations.
  Browser artifact: 12277457392. Local browser downloads remained truncated.
- Source PR #64 CI 39441202514/39441202669 and #65 CI
  39442878586/39442878896 verified SUCCESS at their actual heads.
- Details/conflict decisions: STYLE-WORKFLOW-INTEGRATION-20261020.md.
  Physical phones, accepted real-photo accuracy, realistic fitting and final
  art/rights remain open. No merge/deploy, costs, evidence-script/art changes,
  customer uploads or Drive Duel changes.

## Parallel outfit saving / preview handoff continuation — October 20, 2026 Pacific

- Continues isolated draft PR #65, after verified `1ac35ff0` (customer browser CI
  39441102467 and camera/indexing 39441102354 both SUCCESS). PR #64 capture and
  renderer scheduling branch left separate; no art/mask-evidence branch edited.
- Preview opens before saving; persistence failure is visible and cannot navigate
  back from a later screen. Original photo identity, selected option and account
  are rechecked after board initialization. Pending save state survives rerenders.
- Card and board saves publish only after their queued database commit; failures
  cannot pop another outfit or leak an unsaved addition into subsequent snapshots.
  Capacity, owner/database and current owned selections are checked inside queue.
- Local full suite: **1064 passed / 0 failed / 3 skipped (1067 total)**; twelve
  focused behavioral save/handoff checks pass. Exact-head browser CI pending;
  prior 1052-pass browser result does not validate this changed persistence code.
- Browser harness now checks actual IndexedDB abort isolation, pending-save button
  protection and usable preview after storage failure in Chromium and WebKit.
  See STYLE-NEW-CLOTHES-EXPERIENCE-20261020.md. No merge/deploy, costs, original
  photo edits, accepted fitting-quality score, actual phones or Drive Duel change.

## Parallel customer styling / local preview — October 20, 2026 Pacific

- Isolated branch `work/style-new-clothes-performance-20261020`, stacked on PR #51
  `9d1dd7d4`. No PR #58 art or PR #61/#62 evidence scripts/branches edited.
- Snapshot/cancel obsolete Style this requests; clearly labeled Preview on model;
  lazy/async recommendation photos and graceful image fallback. Original-first
  high-resolution recognition, indexing and atomic Save & style handoff preserved.
- Same-account, exact-image/geometry local preview reuse avoids repeated blanking,
  decode and pixel diagnostics. Eight-second image decoding bound, base-image
  integrity handling, accessible busy state and a single retry action.
- Local build/full suite: **1052 passed, 0 failed, 3 skipped** (1055 total).
  Focused suite: **40 passed**. Local browser download failed (truncated archive);
  exact-head CI browser evidence must be checked before claiming emulation pass.
- See `docs/STYLE-NEW-CLOTHES-EXPERIENCE-20261020.md`. No speed/accuracy percentage,
  accepted real-photo fit, model-art approval, live AI or actual-phone evidence.
  No merge, deploy, costs, customer upload or Drive Duel changes.

## Conservative real-photo extraction proposals — October 19, 2026 Pacific

- Isolated branch `feature/conservative-dark-garment-extraction-20261019`, based
  on PR #36 `9943f7e`. Existing PR #35/#36/#37 branches unchanged. Reuses PR #37's
  12-case manifest. Adds no remote inference or customer-photo operations.
- New bounded dark-neutral exterior flood proposes original-pixel alpha for
  saturated upper garments, with category/material/border/component refusal.
  Source RGB stays identical; native alpha remains on its existing path.
- Actual 12-photo run: 1 proposal (red-shirt `commons-0002`), 11 with no proposal,
  0 newly approved automatic displays and no independent full-mask scores.
  New proposal stays `displayEligible:false`; existing customer display/cache
  behavior is preserved until independent mask/composite evidence exists.
- Red shirt at 316x473: 87,179 exterior pixels removed, 0 RGB bytes edited;
  5,694/5,694 sampled garment-core pixels retained; 7,993/7,993 sampled background
  pixels removed. Three initial edge rectangles remain explicitly ambiguous,
  not counted as pure fabric. These are assistant-inspected partial patches,
  not independent ground truth, whole-mask fidelity or real-fit proof.
- Diagnostic candidate is exercised with the existing inverse mesh. Collar/cuff
  dark fringes and indistinguishable black-trim loss remain risks; jeans,
  waistlines, pale/black clothing, mannequins and outdoor scenes remain held.
- Local build/full suite: **998 passed, 0 failed, 3 skipped**; 6 new focused
  tests. CI configured for real-photo reproducibility/artifacts and Android
  Chromium/iPhone WebKit execution with exact licensed sources/patches, native
  privacy/cache/race regressions and zero remote writes. Verify final-head CI.
- Evidence guide: `docs/DARK-STUDIO-EXTRACTION-EVIDENCE-20261019.md`; actual JSON:
  `benchmark/dark-studio-extraction-results-20261019.json`. No production merge,
  deployment, paid generation, new services, uploads or Drive Duel changes.

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
- Local build and full suite: **979 passed, 0 failed, 3 skipped**. Focused suite:
  **18 passed**. Local browser executables unavailable; attempted download was
  truncated. Browser results must be read from exact-head CI before claiming
  emulation passed. CI includes Android Chromium/iPhone WebKit and 3 licensed,
  SHA-verified photo acceptance/hold cases with screenshot/JSON artifacts.
- Screenshot review of the first CI run exposed triangle cracks and a retained
  mannequin neck. Replaced clip-based rasterization with inverse premultiplied
  alpha sampling and added a conservative ambiguous-neck hold. All 3 licensed
  raw photo cases now test holds, not successful real-garment fit. Final-head CI
  must validate the revised implementation.
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
