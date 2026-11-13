# Parallel #78 — physical Android Chrome and iPhone Safari operator protocol

**Status:** READY TO EXECUTE AFTER SEPARATE AUTHORIZATION; **PHYSICAL ACCEPTANCE BLOCKED**.
**Original #78 research baseline:** P850 PR #968, 9ee284f501aff50c810a05caf69fc103bc0393b4.
**Mission 1 P852 integration:** Source-gate parent P851 PR #972, 9b582710e1b406e0d8ee256940627b5297646500. **The operator must enter the exact actual running application SHA in the local panel. The P851 parent is not the P852 executable revision, and neither SHA attests live physical phone testing.**
**Family Alpha:** HOLD #255 OPEN. This protocol itself authorizes **NO** test invitations, hosted/private account use, staging/production changes, Supabase access or deployment.

## Controlled environment and evidence custody

1. Obtain explicit owner authorization for the **specific physical devices, tester(s), lawful garments and protected test environment** before asking anyone to sign in, photograph clothing or use an account. No public hosted preview URL has been provisioned by #78. A phone needs a specifically authorized secure HTTPS origin for camera permissions and model downloads; a laptop's localhost and a file:// URL are NOT automatically a valid phone endpoint. Avoid exposing private authentication flows to a public tunnel.
2. Pin app commit, model and recognition-index digest, no-deploy build, operator permission and test start conditions. Use only the isolated branch's research build, never production or staging. If no approved secure test origin is available, mark BLOCKED; do not circumvent TLS or use real accounts as a shortcut.
3. Use a **physical** Android handset's actual Chrome and a **physical** iPhone's actual Safari. Record locally the model family, exact model/OS/browser privately, CSS viewport/pixel ratio, network, power/battery state, low-storage condition, available-memory category if actually observable, date and timezone, model cache cold/warm. Do not treat a responsive-viewport emulation as physical evidence. Record unsupported iOS/Android performance APIs as unknown rather than zero.
4. Before starting a local recorder session, independently verify the deployed-on-test-device commit SHA (40 hex characters) against the actual authorized build and enter it in **Exact running app commit**. No default/fallback commit is evidence of the application actually loaded on the handset. Missing commit prevents session startup. Then use the app's existing private Device Check page for sanitized events and the research opt-in flag **?deviceLab78=1** for the separate ephemeral #78 operator recorder. In the panel, click Enable, then Start session; never leave the flag enabled for ordinary users. The panel **does not read app private IndexedDB or intercept auth requests, image data, predictions or camera feeds**. Test results are manual observations; stage times measured by manual Start/End timing include operator latency and are *not* model-only timings.
5. Original JPEG digest: choose the actual local original JPEG **deliberately** in the #78 panel to hash its bytes with SHA-256 in memory, without keeping EXIF, filename, pixels or location. Do not assume that a camera canvas or post-import re-encode has the same bytes; if the application's retained original is a newly encoded JPEG, verify *that exact saved source* separately in an owner-authorized private environment. Compare both digests privately and record mismatch as FAIL or unresolved. SHA receipts are provenance, NOT ownership, classification, pair-truth or authorization to share a photograph.
6. Record a **private supporting artifact** file's SHA-256 (for example a privately stored, cropped and redacted video/report) and manually mark PASS, FAIL or BLOCKED per case. The panel also records categorical memory, cache, network, battery and charging state, P0–P3 severity, original-source and owner-gate observations, and owned-item counts before/after. Unknown is not zero. It refuses PASS if required source/owner evidence is absent, source preservation is contradicted, or a P0/P1 severity is reported. Missing proof or not-an-actual-phone execution must not become PASS. A local PASS remains an **unverified operator claim** until an independent authorized reviewer examines physical-device provenance and the private proof.
7. Export **shareable BLOCKED summary** to report only counts and non-identifying scenario statuses. Keep the **PRIVATE receipt** with timestamps, original/evidence digests and exact source within protected owner-approved storage; do NOT attach private receipt, image, EXIF, screenshot of clothing, account details, email, names, auth tokens, network URLs, face or voice to GitHub/Actions. Never attach a full iPhone diagnostic capture without redaction. Photo SHA can be correlatable across datasets; keep it private.
8. Test on both platforms; record browser engine version and hardware model from actual device settings, not a forged User-Agent string. Android debugging: USB Chrome remote-inspection with explicit trust approval. iPhone: macOS Safari Develop → connected iPhone Safari with Web Inspector enabled by the user. Remote debugging is optional; never leave a trusted debug connection enabled after the session.

## Exact workflow and falsifiable outcomes

Run the following on **each** physical platform, using a privately consented, source-disjoint set of genuine original garment photographs. Unless a specific exception is noted, a case passes only after actual visible operation and a protected artifact digest are recorded. Keep unrelated model/mask research owned by #67–#77 and any cloud/revocation tests under Mission 3.

| ID | Physical task / required observable |
|---|---|
| capture_camera | Allow physical camera permission, capture one actual garment, retained original visible; no spontaneous save |
| camera_denied | Deny/revoke camera; recover with gallery/retry, no phantom item or leaked image |
| gallery_import | Import an original JPEG twice; original digest accounting and no unexpected new closet unit |
| background_resume | Switch apps/lock device mid-capture and recognition; recover draft or explicit retry, never lose a photo silently |
| rotation_reload | Rotate portrait/landscape and reload; pending original and owner context remain correct |
| cold_wifi | New/cleared model cache on Wi-Fi, measure first model ready and recognition; record genuine timestamps and network |
| warm_cache | Same source class under warm cache; compare measured timing without claiming fixed threshold |
| limited_network | Simulate limited/offline network using authorized device controls; leave unresolved photos as drafts and show recoverable failure |
| batch_1 | Single actual photograph → suggestion → owner Adjust → one saved private item |
| batch_10 | Ten different photographs, no lost originals, no unreviewed/duplicated saves; note time and memory symptoms |
| batch_25 | Twenty-five photographs, same safeguards; Safari tab eviction/out-of-memory is FAIL and must be reproducible |
| owner_review_843 | Model misclassification and unknowns stay editable. Save requires explicit category/subtype/color confirmation for each new item |
| repeat_save_844 | Rapidly tap Save twice and interrupt Cancel/Remove; one owned unit only, no write after failed/outdated session, failure retry works |
| photo_advice_845 | Photograph dark/white garments; photo-quality message advisory only, no deletion |
| shoe_pair_846 | Two matching shoe regions in one original may become exactly one **owner-confirmed** pair; separate pairs remain distinct |
| learning_847 | Correction-learning checkbox separate from mandatory wardrobe approval and OFF by default |
| color_848 | Navy/black/white/off-white and background ambiguity; color proposal remains advisory and owner-correctable |
| duplicate_849 | Similar garments/two purchases remain separate unless explicitly owner resolved; no auto-merge or primary source replacement |
| review_queue_850 | Enable optional one-at-a-time queue, skip/reload/crop; all original drafts persist, no automatic save |
| source_sha | Locally hash the actual exact original; check SHA identity in protected saved source after review, never confuse crop/mask hash |
| private_owner | Check local owner-scoped closet only. Two signed-account cloud isolation requires separate explicit authorization and Mission 3 |
| quota_recovery | In controlled synthetic/test account only, force quota/store interruption; ensure draft and saved item transaction cannot partially complete |
| restore_cloud | **BLOCKED** unless separately authorized authenticated cloud backup/restore environment and Mission 3 security plan |

### Required human-labeled garment challenge matrix

Have two independent authorized human reviewers privately label **before viewing model output**, preserving source licensing and a sealed set managed by #75/#71. Include navy vs black, white vs off-white, shorts vs skirt, dress vs skirt, boots vs sneakers, crop/zoom, front/back, low-light/background interference, hem/strap boundaries, one pair versus two pairs of shoes, and distinct same-style purchases. Keep true per-case independent model category/subtype/color/mask/unit counts separate from corrected final closet contents.

**Report four denominators, never conflate them:** raw model suggestions; owner-confirmed corrected details; unique correctly persisted private closet items; actual physical device completed cases. Publish no percentage when denominators or human/source truth are absent. Genuine blind photo score remains **UNKNOWN** until an independent sealed evaluation can be run.

### Failure severity and stop rules

- **P0 stop immediately:** cross-owner data exposure, original JPEG deletion/mutation, silent unauthorized save, duplicate unit with no owner permission, corrupt cloud restore, photo/account content in public logs.
- **P1 block acceptance:** camera does not recover, Safari evicts/loses unsaved drafts, unreadable original, significant mobile freeze, repeat-save, cross-tab/session/revocation races, footwear grouping without confirmed physical unit.
- **P2 review:** wrong optional suggestions, photo quality guidance false positives, layout clipping or sluggishness with recoverable drafts.
- **P3 polish:** cosmetic wording or spacing.
- Upon any P0/P1 FAIL: stop owner testing, retain only protected redacted evidence, create a GitHub issue describing **behavior without private media**, and leave release BLOCKED.

### Matrix and final witness sign-off

Record one row for every 23 case IDs **on each device** with status NOT_RUN/PASS/FAIL/BLOCKED, actual model/OS/browser, evidence SHA-256, exact date/time, source-digest pairing where appropriate, memory/network/cache state, observed time, severity, and independent reviewer decision. A reviewer must verify that all claimed PASS rows actually came from the stated phone and permitted source; browser User-Agent and operator checkboxes cannot cryptographically attest that fact.

Minimum release evidence: physical Android Chrome **and** physical iPhone Safari with genuine garment input, case-by-case owner review/save; two independently human-labeled source-disjoint photo evaluations; separate signed two-account cloud and restore authorization; unchanged P843–P850 protections and protected original photos; independently reviewed device/accuracy/owner privacy receipts. Until ALL are satisfied: **MISSION 1 NOT COMPLETE, FAMILY ALPHA HOLD #255 OPEN**.

## Executable engineering checks (not physical phones)

Run on the isolated research branch:

    node --test tests/parallel78-device-acceptance.test.cjs
    node scripts/build.mjs
    node scripts/build-m1-no-account-trial-831.mjs
    node --test --test-concurrency=1 tests/*.cjs tests/*.mjs
    node scripts/test-parallel78-device-browser.mjs
    node scripts/test-m1-batch-review-850.mjs

The last two use Chromium/WebKit on a **desktop host** at CSS widths 320/390/430. No real camera, independent garment truth, physical iOS memory, USB/Lightning connection, real account or host cloud acceptance is inferred. The dedicated no-deploy workflow additionally runs inherited P849–P843 regressions and source-license SHA verification. At repository handoff the phone case count is **0** and its status **BLOCKED**.
