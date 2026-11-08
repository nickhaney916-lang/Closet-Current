# Closet Current — Master Application Completion Ledger

**Audit date:** November 7, 2026  
**Family Alpha:** HOLD — issue #255  
**Release:** Not authorized; no merge, existing staging change, or production deployment  
**Integration candidate:** `research/full-application-integration-20261107-HOLD`  
**Audited source:** P161 draft PR #717, exact source HEAD `9c20ed0208d1ba547707e2a8c6fcd542ba327068`  
**Default branch at audit:** `main` HEAD `39deed987afe2e5668d64e145835ad43ad14c7be`

## Executive status

The application is **not release-ready**. The default branch is 1,195 commits behind the audited research head by ancestry. P161 and the latest mobile rotation proof are isolated drafts; successful tests do not make them a released product. The audited head contains 676 changed files and 83,361 insertions relative to the current default branch, so the integration risk is substantial and must be reduced through staged, reviewable integration.

On exact P161, the local build passed and the full repository Node suite passed **1,310/1,310** after installing CI-pinned dependencies. The integration branch then added the first product slice: a saved closet card can start Style My New Clothes with that confirmed item selected. The browser journey now imports a synthetic PNG, requires explicit manual review/correction of the uncertain result, saves it to owner-scoped IndexedDB, starts styling from its closet card, generates three distinct owned-only looks, saves one, and finds the same item and board after reload. Chromium passed locally at 320/390/430 CSS px. After the change, all **1,314/1,314** tests and the build passed. WebKit cannot launch locally because its system libraries are missing; no-deploy CI is configured to run the same journey in Chromium and WebKit. The first CI attempt stopped at Git's container ownership guard; the next reached the suite but failed broadly because the remote app.js blob had been serialized incorrectly by the integration upload, and the clean-checkout suite also needs generated `dist/` assets. Both issues are being repaired on this isolated branch; that run is not passing evidence. P161's exact-head no-deploy GitHub Actions run #42447834580 is evidence for the earlier licensed-head research, not this styling change. These results do not establish physical-phone acceptance, live signed-account cloud acceptance, actual camera-device-to-style capture, or visual approval of both humanoids.

## Branch and evidence inventory

| Ref | Verified evidence | Integration disposition |
|---|---|---|
| `main` `39deed987afe2e5668d64e145835ad43ad14c7be` | Current default branch; old October 26 checkpoint | Too stale to represent the latest product work |
| Draft PR #717 / P161 `9c20ed0208d1ba547707e2a8c6fcd542ba327068` | Exact-head no-deploy CI, 1,310 tests, 36 SHA-checked Chromium screenshots and 3 WebKit cases; bounded source licensed head-axis adjustment | Candidate ancestry for further isolated integration; not merged or released |
| Draft PR #716 / P160 rotation `fca5981c86a456ca172bd9810cb9c17e420cc30b` | Six viewing angles, 36 Chromium captures; branch is based on P159 | Separate active branch; 5 files do not overlap P717's 12 files after common P159, but its exact-parent workflow cannot be assumed to pass after stacking on P161. Re-run under a new integration workflow before adopting |
| Draft PR #715 / P160 neck joint `76e4a3ca174564f7ca074bc568cdaa806fe11fdb` | Bounded licensed head to 163-bone neck joint registration and original-photo protection | Research proof only; no full skeleton retarget or seamless skin weld |

The local P161 candidate is a descendant of `main`, but remains a very large unmerged stack. The P717 PR description documents the ancestry and exact-head test evidence. The source-level audit found the 3D and Style Owned panels guarded by explicit `?…=research` query flags, so those research panels are not normal app flows.

## Product completion ledger

| Area | Current evidence | Status | Remaining release work |
|---|---|---|---|
| Capture and import | Single-item camera/import flow and original-source SHA checks exist. Whole-outfit segmentation and review exist; same-class overlaps may merge, and physical capture is not tested. Browser harnesses use controlled camera streams. | **Implemented; partially verified** | Physical Android Chrome and iPhone Safari capture, device lifecycle, overlapping instance quality, and full journey acceptance |
| Recognition | Local FashionCLIP pipeline and conservative review gates exist. The documented 100-photo release set reports 64 correct auto categories, 2 incorrect, 34 review; 97.0% is precision among accepted broad categories, not overall accuracy. | **Implemented; not independently accepted for product requirements** | Frozen genuine photos with independently adjudicated category, subtype, primary/secondary color, segmentation, and subtype-confusion metrics; expand samples and preserve errors |
| Closet storage | IndexedDB persistence, source identity, review/correction and duplicate guards exist. Regression coverage includes large synthetic wardrobes and interrupted writes. | **Implemented; automated coverage present** | Device storage quota/reopen tests, crash recovery on phones, and combined capture-to-edit/reload proof |
| Cloud and privacy | SQL includes authenticated owner RLS and private JPEG storage policies; research contains owner/version/CAS and restore protections. Some historical docs report disposable-account checks. Current exact-head suite does not prove current hosted signed JWT/Storage isolation. | **Implemented; current live acceptance unverified** | Fresh two-account signed-user HTTP/Storage denial tests, expired/revoked session cases, real backup/restore, and hosted environment verification without touching existing staging |
| Outfit builder | Existing owned-item outfit builder and save/reopen logic exist; research has lossless board protections and mobile touch work. | **Implemented; integrated acceptance incomplete** | Exercise full owner flow with dresses, coat layers, piece replacement, save-existing, reload, recovery and fallback on phone-sized browsers |
| Style My New Clothes | The existing screen styles owned items by occasion. A My Closet card button now focuses its saved item. The Chromium browser test imports a synthetic PNG, presents an uncertain recognition result for explicit manual review, saves it, starts the generator from its card, and verifies three distinct owned-only options plus save/reload at 320/390/430 CSS px. | **Integrated browser slice implemented and locally verified; cross-engine CI pending** | Run WebKit CI; exercise real camera-device capture → review/correction → save → focus action end-to-end; verify swaps and reload on the integrated browser flow |
| Trends and inspiration | Local inspiration references and a weekly research library/freshness label exist. The Trends UI explicitly says it does not fetch or read live articles. | **Partially implemented** | Verify scheduled refresh, freshness, offline cache and clear separation between editorial inspiration and owned looks |
| Female/male humanoids | P156–P161 research integrates licensed heads into a detached original 163-bone donor and proves bounded axis changes; P717 reports 36 Chromium screenshots plus 3 WebKit cases. P161 change is subtle and limited to axis angle. | **Research implemented; not independently accepted** | Full compatible skeletal/skin retarget, independently reviewed anatomy/faces/hair/skin, human visual approval, actual app mounting and physical-device evidence |
| Photographed garment fit | Research includes donor outfit fitting and source protection; this does not prove realistic arbitrary photographed shirt, pants, dress, outerwear and footwear fit or dynamic fabric. | **Not complete** | Original-photo likeness and contact/drape tests for each garment class and front/side/rear; resolve clipping/floating; independent human review |
| Mobile and accessibility | 320/390/430 viewport browser evidence and accessibility research exist in the ancestry. | **Partially verified** | Re-run on integrated head, complete end-to-end flows, WebKit/Chromium, screen-reader/keyboard review and physical phones |
| Performance and reliability | IndexedDB scaling tests exist. No consolidated startup, memory, 3D FPS, interruption, or low-memory measurements were found in the current audit. | **Not independently measured** | Profile cold start, hundreds of full-resolution items, multiple layers, WebGL loss/recovery, background/resume, storage quota and network loss |
| Authentication email | UI flows exist; project docs report external email sender/SMTP delivery remains blocked/unverified. | **Release blocker** | Verify sender configuration and real external signup/confirmation/reset/recovery inboxes |
| Family Alpha | Issue #255 remains open and HOLD. | **HOLD** | All gates, instructions, known limitations, and explicit owner authorization before any invitation |

## Ordered execution plan

1. **Lock the audit baseline.** Preserve main, P717, P716, and other active drafts. Record exact parents, changed paths, green-run IDs, and feature flags before integration.
2. **Integrate the shipping product surface in small slices.** The focused owned-item styling action and synthetic imported-photo/manual-review browser path are on this branch. Next, exercise the real camera stream into that action, then complete outfit-builder recovery and visible 2D fallback. Keep 3D additions research-gated until mounting and garment compatibility are demonstrated.
3. **Complete 3D capability on the original pipeline.** Build the full skeleton/skin compatibility bridge and test female and male separately; then fit real photographed garments by category. Require human-reviewed renders and physical device evidence.
4. **Complete identity and private data acceptance.** Use fresh synthetic accounts against an explicitly isolated test backend; verify signed identity and denial paths before any hosted writes.
5. **Run an integrated mobile matrix.** Exercise the complete new-user journey, 320/390/430 widths, Chromium/WebKit, lifecycle/recovery, accessibility and measured performance. Keep phone claims blocked until real devices or an authorized device lab are available.
6. **Prepare a release candidate only after every critical gate passes.** Record unresolved issues, installation/operation/recovery instructions, rollback, and an owner-facing go/no-go summary. Family Alpha remains HOLD until the owner separately authorizes advancement.

## Current blockers and limits

- The exact P161 candidate has no physical Android or iPhone evidence.
- The human realism target is not met or independently accepted; P161 reports only a subtle bounded neck/head-axis improvement.
- The full photographed-clothing fit requirement is not met across supported garment types.
- Current Style Owned is based on existing closet items; the photographed new-item workflow is missing.
- Current Trends is a cached/researched reference library, not live article ingestion.
- Current 3D panels are behind research query parameters; this audit does not treat them as shipping features.
- Fresh live signed two-account cloud and external email delivery were not verified in this session.
- The current integration candidate is not the production app, a release candidate, or permission to merge/deploy.

## Reproduction

From the exact P161 tree, after installing CI-pinned test dependencies:

```sh
npm install --no-save --no-package-lock --no-audit --no-fund playwright@1.56.1 sharp@0.34.3 fake-indexeddb@6.2.4 three@0.180.0 three-mesh-bvh@0.9.2 axe-core@4.10.3
node scripts/build.mjs
node --test tests/*.cjs tests/*.mjs
```

Observed on exact P161 before the styling change: **1,310/1,310 tests passed; build passed.** Observed after the styling change: **1,314/1,314 tests passed; build passed; focused-item browser journey passed in Chromium at 320/390/430 CSS px**. WebKit is queued in the no-deploy CI workflow because local system browser libraries are unavailable. No production or existing-staging writes, merge, deployment, real account access, or family invitations were performed.
