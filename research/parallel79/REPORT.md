# Parallel Assignment 79 — offline independent-human annotation workstation

FAMILY ALPHA HOLD #255 OPEN. DRAFT / UNMERGED / UNDEPLOYED.

Tracking: [#975](https://github.com/nickhaney916-lang/Closet-Current/issues/975). Immutable compatible parent: P851 `9b582710e1b406e0d8ee256940627b5297646500`. Isolated branch: `research/parallel79-offline-human-annotation-workstation-HOLD`.

## Delivered engineering

A standalone Node-built-in-only runtime serves an authorized 1–60-photo session on random-port 127.0.0.1 under a 256-bit capability URL. No account, wardrobe, Supabase, recognition worker, third-party font, telemetry, API, CDN, model or remote upload is used. All HTTP writes are rejected. Same-origin loopback GETs serve the application and explicitly authorized originals. CSP permits only the local script/style/photo resources and local fetches needed by the viewer; it rejects external connections, forms, frames and objects. This is offline with respect to external networks, not a claim that a loopback HTTP server makes zero local requests.

Private inputs and keys are resolved by realpath and must be outside the checkout, even if the command is run elsewhere. A symlink into the checkout fails. The original is never written, cropped, rotated or re-encoded. Source #75 SHA-256, Commons SHA-1 and exact byte length are checked at admission and every original request; the browser independently hashes the original at display and again before export. MIME magic, 12 MiB bound, 40-million-pixel bound, source metadata age, signed curator approval, orientation range and actual decoded upright dimensions are enforced. The viewer strips orientation metadata from an in-memory display copy and explicitly applies EXIF transforms to derived local canvas pixels, including mirrored orientations; no original is altered. This corrects a real WebKit PNG auto-orientation inconsistency found during testing. On actual decode/dimension mismatch the image is removed and export is blocked.

Registrar-authorized session access binds the vetted pseudonym, session identifier, expiry within 24 hours, access tier and SHA-256 of **each complete source receipt**. A separately supplied owner-pinned registrar trust fingerprint is required. Reviewer identity attestations use the existing P75 role/key contract. A blind session additionally requires signed explicit sealed access, signed complete historical exposure-ledger approval/digest, full SHA/dHash coverage of the four inherited #75 manifests and no historical overlap. Source-group, series, exact and perceptual duplicate flags block admission; none is silently merged or waived. This gate grants access only and cannot establish dataset eligibility.

The responsive interface has neutral sequential photo IDs, fit/zoom, previous/next, in-memory independent drafts, Unknown/uncertain defaults, per-image P75 fields and per-region optional category/subtype/colors from the same vocabulary. Boxes have visible drag/resize handles and equivalent labeled numeric controls supporting keyboard arrows. Clipped/occluded flags, quality, color cast and explicit physical footwear units are human entered. Image-level P75 fields remain compatible; per-region `observed` is a validated signed extension rather than a replacement taxonomy. No masks are generated or claimed.

A manual declaration gates explicit canonical **unsigned** export. Every edit clears acknowledgment; exports are private local downloads, never server writes. Reset requires two presses and remains undoable. Restore rejects corrupt, oversized, stale, wrong-session, wrong-source, wrong-receipt-revision and incompatible drafts without replacing the valid draft. Browser localStorage, sessionStorage, IndexedDB and service workers are not used. Protected persistence is an explicit operator-controlled external export, not hidden browser storage.

The local validation CLI reuses P75 `validateLabel` and adds strict geometry/physical-unit constraints. The browser executes that same validator and stricter wrapper, served as a local module from the real functions, avoiding a second drifting vocabulary. P75 remains unchanged and owns final signatures, lawful sources, real-person vetting, dataset partitioning, adjudication and acceptance. Optional session authorization uses the externally pinned registrar key only in a separate offline CLI, never the web UI. P75 signing exclusively creates a new external receipt. Existing exports are not overwritten.

The signed handoff verifies #75 receipt/registrar identity and signature rules and blocks same-rater reuse or **any canonical label difference** including boxes, region IDs, occlusion and color cast, even when #75's coarse agreement fields match. READY FOR P75 CUSTODIAN AUDIT means no automatic accepted count. Disagreement is quarantined for a genuinely independent third human; no automated resolution or synthetic identity proof exists.

## Verification and reproducibility

Synthetic fixtures are generated procedurally as explicitly labeled noise-image test doubles in ephemeral external folders. Ed25519 identities, legal notes, approvals and garment labels in tests are **synthetic test data only**, never independent humans or lawful acquisition evidence. Temporary keys and images are cleaned up; none is committed. Basic synthetic PNG fixtures use Node zlib/CRC without dependencies, so the inherited dependency-free camera workflow runs core tests. Its optional independent cross-format decoder group explicitly skips if sharp is unavailable; dedicated P79 CI requires the decoder and executes every test without skips. No real private photos were accessed.

Reproduce from this branch:

```bash
npm install --no-save --no-package-lock --no-audit --no-fund playwright@1.56.1 sharp@0.34.3 fake-indexeddb@6.2.4 three@0.180.0 three-mesh-bvh@0.9.2 axe-core@4.10.3
npx playwright install --with-deps chromium webkit
node scripts/build.mjs
node scripts/build-m1-no-account-trial-831.mjs
node --test --test-concurrency=1 tests/*.cjs tests/*.mjs
node scripts/test-p79-workstation-browser.mjs
node scripts/m1-release-evidence-851.mjs
```

The workflow `.github/workflows/parallel79-offline-annotation-no-deploy.yml` pins the immutable parent and strict 12-path allowlist; application, benchmark, hosted storage, P75 implementation and other workflows remain unchanged. Jobs have read-only repository permissions and no deployment, hosted login, private inputs or upload/artifact actions. Dependencies/browser binaries are downloaded during environment setup; actual annotation runtime has no external network dependency. GitHub's exact commit/run URL and final conclusions are recorded in the draft PR's evidence receipt, outside the source tree to avoid a self-referential commit SHA.

Local measured checks at delivery:

- Full native regression: **453/453 passed**, including eleven P79 test groups; both unchanged application builds passed.
- P79 session admission: **1, 10, 25, 60** exact synthetic original sessions pass. Tampered SHA/bytes, source revisions, expired access, wrong identity, stale rights, duplicates, source-series overlap, symlinks, malformed labels, degenerate/out-of-frame boxes, unsupported masks, wrong signed rater and disagreement fail closed.
- Desktop Chromium: widths **320/390/430/1280** pass; all eight actual generated EXIF metadata values pass upright decode/export checks. The expanded final run checks all three MIME types in both engines, including actual corner pixels against independently decoded expected upright pixels. Axe WCAG A/AA/2.1 AA scans report **zero detected violations** in tested editor states. Layout stays within viewport. Exported drafts pass the server's P75-compatible real validator. Initial Chromium synthetic editor sequences were **1,544–1,849 ms**; the expanded local run measured **1,572–64,176 ms** across both engines under variable host load (automated browser sequences, **not human labeling speed**).
- Browser scenarios exercise manual export acknowledgment, original hash verification, per-region labels/boxes, keyboard arrows, mouse resize, navigation isolation, undo, reversible reset, corrupt/oversized/wrong-reviewer restoration, no inherited B labels, zero persistent browser storage, no external application requests and an explicitly CSP-denied remote fetch probe. Engine tests are real desktop processes, **not actual Android/iPhone hardware**.
- Desktop WebKit also passed the editor at all four widths after the orientation correction. The all-MIME orientation run passed **48/48** actual engine/MIME/orientation cases, with displayed corner pixels matching the independent decoder. Final per-head CI is recorded in the PR evidence receipt. Local WebKit required user-space Debian runtime libraries because system installation is unavailable; the CI runner uses the standard `--with-deps` installation. The local host dependency-cache preflight is skipped only after supplying actual libraries in the user-space WebKit search path; browser execution and every assertion still run. CI uses normal system dependencies with no such skip.
- P851 release-evidence tool remains **BLOCKED**, `shouldLiftFamilyAlphaHold: false`, zero signed external evidence roles, zero independent blind sources and zero physical device platforms.

## Actual acceptance evidence and remaining dependencies

| Evidence | Actual result |
| --- | --- |
| Genuine independent humans vetted in this assignment | **0** |
| Genuine human-labeled photos approved | **0 — BLOCKED** |
| Genuine double-human agreements/adjudications | **0; agreement undefined** |
| Genuine human masks or physical shoe-pair judgments | **0** |
| Genuine sealed-blind eligible photos | **0 — BLOCKED** |
| Recognition accuracy or accuracy improvement | **UNKNOWN; not evaluated** |
| Real physical Android/iPhone acceptance | **0; belongs to #78** |
| External rights/reviewer checklist review | **BLOCKED; requires actual vetted curator/registrar** |
| Deployment or live wardrobe changes | **None** |

Engineering tests establish tool behavior with test doubles. They do not establish human identity, consent, independent inspection, actual physical footwear pairing, absence of malicious browser extensions, or blind recognition correctness. The workstation cannot defend against a compromised OS/browser, a dishonest trusted registrar, an operator sharing labels outside the tool or an unsafe download destination. The operator guide requires an offline controlled browser profile, approved encryption, separate reviewer custody and explicit save paths. Canonically different geometry/region IDs may over-block genuine semantically similar reviews; conservative quarantine is deliberate. Pixel masks, encrypted-storage provisioning, remote authentication and generic signed-adjudication overrides are not implemented. P75 has no generic adjudication override contract to weaken or replace.

## Coordination and handoff

[OPERATOR.md](OPERATOR.md) provides the source/rights checklist, private session contract, registrar request/signing commands, independent A/B workflow, exact P75 signing/audit handoff and third-party adjudicator checklist. #75/#950 retains acquisition, legal evidence, identity vetting, split/seal and truth-acceptance ownership. #71/#929 receives only custodian-approved frozen blind inputs; no answer key or source identifiers go to model developers. #78/#970 retains physical device acceptance. #67–#74 and #76–#77 branches are untouched; no model labels, duplicate suggestions, correction data or review-queue proposals are imported. P851/#972 remains the integration/release controller. Mission 3 remains the signed wardrobe/cloud authority. Family Alpha HOLD #255 is not lifted.
