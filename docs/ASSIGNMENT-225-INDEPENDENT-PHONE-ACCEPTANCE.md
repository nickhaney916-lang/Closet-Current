# Assignment #225 — independent protected physical-phone pilot acceptance

**Status: BLOCKED for hosting/distribution and public release.** This branch contains isolated test infrastructure, evidence, and one minimal Auth safety fix. It is not a staging build approval.

## Immutable ancestry and non-overlap

- This branch starts at **draft PR #225** head b185e6901b0fb4b8c8aecfa3a0b1cacff2a43af3; #225 owns its offline sealed-package repair and protected-pilot handoff. This branch does not modify its package script, outfit/recognition source or checked licensed photo inputs. It contains one separate draft-only public/auth.js cleanup.
- #225 is stacked on #222, which is stacked on **draft PR #220** source 0f62e253c1fd0024a939cd401710dcd3784a9e77. Our workflow vetoes all customer public/backend drift relative to #220 except the specifically reviewed public/auth.js recovery-token cleanup; all locked recognition/outfit inputs are unchanged.
- **Draft PR #224**, from issue #223, is a *parallel recognition research branch*. It is not silently incorporated into this physical-phone pilot candidate. Its active recognition/subtype model and any changed classifier must be independently evaluated and selected by the main integration conversation. Workflow #39988629487 is a recognition-only exact-head test, not evidence for the separate pilot candidate.
- PR #225's artifact integrity report is the source for the historical seal defect; previous "success" on a synthetic ZIP alone does not constitute a deployable package.

## What the CI proves

The assignment225 no-deploy workflow produces exact-head provenance and explicit separate tests for:

| Gate | Automated execution | Limitation |
| --- | --- | --- |
| Source and release controls | Source diff against PR #220, full Node + nested avatar regression, deterministic outfit benchmark, release-veto assertions | Tests do not authorize release |
| Original-photo import and categorization | High-resolution original RGB classifier handoff, owner-local persistence and duplicate-source tests | Synthetic classifier in the integrated path; no human original-label accuracy guarantee |
| Original colors and privacy | Original JPEG labeling/restart in Chromium/WebKit emulation, original and crop identity checks | Two-color/browser imagery cannot prove garment fabric accuracy |
| Whole-outfit capture | Three emitted garment candidates, confirm/save, known-layer and recovery checks | Synthetic segmentation worker; real multi-garment extraction accuracy unknown |
| Style new + existing | Outfit recommendation, original-source figure, pin/swap/save/reload, duplicate identity checks | Preview is approximate 2D collage, not photorealistic fit or drape |
| Account boundaries | Synthetic Auth/restore, local proxy request interception and protected output browser tests | Cannot replace two actual staging accounts/RLS private Storage tests |
| Device interaction | Chromium Android and WebKit iPhone-size touch simulation, device-check UI, installed PWA Chromium | Does not test either physical camera, Safari/PWA memory, or native permissions |

**Do not merge the recognition PR into this branch merely to make the pilot appear current.** All #220 app source other than the narrowly scoped public/auth.js mismatch recovery fix is byte-for-byte frozen; other drift blocks the pipeline.

## Verified account-recovery defect and isolated safety fix

During the independent synthetic mobile Auth test, a verified recovery session received an account identity mismatch on its password-change response. Production code correctly kept the private app locked but retained the pending recovery access/refresh tokens in browser localStorage (red: the locked-account test failed while private access stayed denied). This branch changes only public/auth.js to call leaveRecovery() BEFORE reporting "Session account changed", clearing pending tokens and reverting to ordinary sign-in without exposing another closet. The existing synthetic Auth regression verifies localStorage is empty and no wardrobe unlock occurs. No live account, session, customer photo or hosted policy was touched. Run exact-head CI and do not merge/deploy without main-conversation review.

## Read-only infrastructure findings and hard stop

A staging Supabase management read on October 23 reports project fbnplztkbsteuzrmbgib ("Closet Current Staging") ACTIVE_HEALTHY, independent of the production project identified in prior QA. One security advisory reports that leaked-password protection is disabled. No settings were modified.

The read-only hosting audit in #225 documented 198/198 anonymous Access-login redirects across the known root and preview alias. That is **not proof** of a complete hostname inventory, deny-by-default Access policy, approved-vs-denied tester sessions, private database RLS, email-link callbacks, staging data isolation, or hosted account restoration. No Cloudflare management write/read connection is available to independently establish those complete conditions. No candidate has been deployed.

**Owner decision must remain HOLD** unless all of these independent gates are met:

1. Review exact source SHA, build fingerprint, package/inner seal and immutable artifact archive SHA-256. Never deploy synthetic placeholder-credential CI archives.
2. Inventory and independently examine Access rules on staging domain, all previews/aliases and custom domains; show approved adult testers can enter and denied identities cannot, without altering any settings in this assignment.
3. Confirm staging-only Supabase Auth site/callback URLs, password policy, Storage isolation and RLS using **two disposable authorized test accounts**, with no production/photo data. Test account A/B ownership and rejected cross-account read/write.
4. Obtain explicit main-conversation approval **before any staging deployment or invitations**.
5. On one real Android Chrome and one real iPhone Safari, record installed source SHA/build hash, model/OS/browser/PWA versions and approved adult tester pseudonym privately.
6. With separately approved non-customer originals: capture/import, lock human category/color/type first, index tops/bottoms/shorts/skirt/dress/shoes/layered outfits; preserve original bytes and original-RGB classifier input. Record false accepts, abstentions, category/subtype confusion, latency and segmentation failures.
7. Verify new garment + three distinct *owned* complete outfits when inventory supports three; pin one item, swap only another, save, reload and relogin, restore on both phones. Verify crop/source changes invalidate stale queued recommendations; duplicates and invalid images cannot be saved. A dress must exclude separate bottoms and inappropriate layers.
8. On device, test permissions, camera front/back, automatic timer, back/cancel behavior, interrupted network, recovery, blank/duplicate/multi-garment photos and 320/390/430px legibility and at least 48px main touch targets.
9. Have two independent reviewers score original-versus-2D output for color, texture, patterns/logos, visible edges and placement; never score a hidden/uncertain feature as correct. Reviewed masks and commercial avatar rights remain separately gated.

**Human testing evidence template:** record for each operation: case ID, fixture SHA-256, engine/device, operator label, expected original label, predicted label, saved label, result PASS/FAIL/BLOCKED, seconds/taps, source bytes retained Y/N, and sanitized reproduction steps. Keep emails, access credentials/codes, tokens, customer photos, account IDs, screenshot secrets, or source keys out of public GitHub. Publish only aggregate pass/fail/blocked and sanitized case IDs.

## Exit criterion

Success in CI means **emulated acceptance rehearsal passed**, not physical-phone readiness. **0/2 physical phones** and no full security-policy/session inspection at this checkpoint. Target deployment and commercial use remain blocked; the main Closet Current conversation owns integration and release decisions.

Scope preserved: no merge, staging deployment, production changes, Supabase/Cloudflare setting changes, customer-photo access, paid inference, expenses or Drive Duel work.
