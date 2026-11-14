# Closet Current Mission 1 P886 — executable physical-phone receipt bridge and real Git commit IDs

**FAMILY ALPHA HOLD #255 OPEN.** Isolated DRAFT / UNMERGED / UNDEPLOYED. No production, staging, hosted Supabase, owner photos/wardrobes, authentication, app UI, model weights, workers, dataset originals or other mission branches changed.

## Verified parent and motivation

Immediate compatible parent is Mission 1 P885 [draft PR #1129](https://github.com/nickhaney916-lang/Closet-Current/pull/1129) HEAD `eecbc6ac4f750954f6343407a7e7af4e69ddabc0`, [2/2 exact-HEAD NO-DEPLOY CI SUCCESS #43549637794](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43549637794): **655/655 native PASS**, six desktop Chromium/WebKit owner-review policy profiles, 25/25 synthetic signed gate tests, release BLOCKED and zero real external human/device/cloud evidence.

Two real, source-verified integration defects remained between existing P851-P885 externally signed acceptance and P78 physical-device operator workbook:

1. `scripts/m1-release-evidence-851.mjs` asserted `isHex64(policy.targetCommit)` even though the GitHub repository's actual SHA-1 HEAD commits and existing P78 physical recorder's explicit `sourceCommit` **require 40 lowercase hex characters**. A real 40-digit commit could not satisfy the final release checker; only a fake 64-digit “commit” could. Model and blind-manifest content digests remain actual 64-hex SHA-256 and never relax to 40.
2. P885 required `casesPassed=23` and `casesNotRun=0` from signed Android/iPhone summary, but did **not** verify a signed itemized case list. An operator could substitute 23 easier fake checks for `batch_25`, `camera_denied`, `quota_recovery`, and `restore_cloud`, or reuse an artifact hash for all 23 numeric PASS entries.

## Exact P886 delivery

- `scripts/m1-physical-case-ledger-886.mjs` is a Node-only source adapter that imports the **real** `public/device-acceptance-78.js` CJS operator recorder with `createRequire`. It reads its exact 23 canonical `CASES` IDs (no separate approximate table); fails startup if the real P78 protocol no longer has 23 unique cases.
- The P851 signed gate validates the owner-approved `targetCommit` as a **real 40-hex Git commit**, keeps `modelSha256` and `blindManifestSha256` strict 64-hex, and requires each signed physical device to specify `sourceCommit` equal to exact owner-pinned Git commit. This is a signed assertion of the tested commit, not external proof the physical phone loaded that commit; independent witness must verify actual running app.
- Every signed Android and iPhone device must contain **exactly all 23 original P78 case IDs once each**, `status:PASS` for every one, `severity:NONE|P3` only (P0/P1 failures stop; P2 requires human review and is not silently accepted), individual 64-hex `evidenceSha256` for each private/redacted supporting artifact, and `observedAt` within the owner's signed precommit time and operator's signing time. All per-case proof SHA must be unique across the **entire 2-phone set**, and each device still has P885's own unique signed session/test evidence SHA. A signed forged aggregate `23/23` no longer suffices. No original-image SHA, filename, personal identity, private photo, account info, token or screenshot is put into a public report.
- The P78 private receipt remains **strictly off GitHub**. A vetted independent operator must actually compare the protected original/case evidence and phone/device hardware and sign a redacted numeric/hash summary. The local recorder's claims and cryptographic digests cannot by themselves prove physical hardware, real human permission or physical object identity.
- Eight new synthetic adversarial test cases use dummy Ed25519 signers and synthetic 23-case SHA strings. These prove the gate rejects a 64-hex fictitious Git commit, duplicate/missing/unknown P78 case, reuse of same proof digest within/across phone reports, any FAIL/BLOCKED/NOT_RUN/P0/P1/P2 event, source SHA swap and forged case timestamps. A passing synthetic all-case record reaches at most `EVIDENCE_REVIEW_ELIGIBLE_NOT_RELEASE`, never deploy or HOLD lift.
- Strict five-file source fence (new P886 helper, modified P851 checker/tests, P886 report, no-deploy workflow), full native/build, six Chromium/WebKit 320/390/430 original-photo and owner-review regressions, and offline synthetic proof vetting. **No actual phones or private user accounts are exercised by CI.**

## Owner-authorized real evidence handoff

1. After the owner independently approves a protected secure test environment, **external reviewers** vet rights and seal source-disjoint >=60 previously unseen original garment photos, two human labels each, full source receipts, and a predeclared owner-signed model/hash/threshold policy. The independent registrar witnesses genuine prior commitment time.
2. The operator uses the exact real **40-hex app HEAD** on each authorized physical Android Chrome and iPhone Safari and the already existing [P78 23-case protocol](https://github.com/nickhaney916-lang/Closet-Current/blob/research/parallel78-physical-mobile-photo-acceptance-HOLD/research/parallel78-physical-device/OPERATOR-PROTOCOL.md). Each real case must PASS and produce protected independent redacted evidence; no optional skipped rows, including `restore_cloud` which itself requires separate explicit Mission 3 hosted cloud authorization.
3. Under separate independent attested custody, the operator summarizes `devices[].cases=[{caseId,status:'PASS',severity:'NONE',observedAt,evidenceSha256}]` for the 23 exact P78 cases **per device**, plus `devices[].sourceCommit=targetCommit`, while preserving all P885 P78 numerical summary fields and independent operator signer. The proof SHA points to a **private redacted supporting artifact**, not the original JPEG hash. Never upload the original photos, case videos, tokens, email, EXIF or signed trust material to GitHub.
4. All four distinct role signers independently attest to the **same exact predeclared owner policy SHA**, manifest SHA and source commit, including complete 100% no-wrong-save criterion; actual independently witnessed phones, real two-account RLS/backup/restore, source-disjoint two-human truth are mandatory. In normal CI without these, `node scripts/m1-release-evidence-851.mjs` must return `status:'BLOCKED'`, 0 real blind and 0 phone proofs. Even successful external evidence can yield only `EVIDENCE_REVIEW_ELIGIBLE_NOT_RELEASE`, never deployment or owner authorization.

**No release readiness or actual recognition accuracy is claimed.** The earlier 38 SHA-source-matched Commons public development candidate files are still publicly exposed/unlabeled and do not count toward 60 private sealed independent blind photos.

## Exact no-deploy test commands

`node --test tests/mission1-release-evidence-851.test.mjs`
`P79_REQUIRE_DECODER=1 node --test --test-concurrency=1 tests/*.cjs tests/*.mjs`
`node scripts/m1-release-evidence-851.mjs` → BLOCKED with 0 external signers/phones/labels
`node scripts/test-p82-review-browser.mjs` → desktop Chromium/WebKit synthetic source/owner policy, **not** physical phones

At creation the exact HEAD CI is PENDING. Family Alpha HOLD #255 must stay OPEN without independently witnessed human/device/cloud proof.
