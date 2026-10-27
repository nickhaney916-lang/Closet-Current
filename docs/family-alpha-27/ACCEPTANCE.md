# Assignment 27 — four-person acceptance runbook

Prepared October 26, 2026. Issue #255. **HOLD; no invitations authorized.**
Baseline: main `39deed98`. This branch adds QA materials only. Use the exact staging deployment SHA for every execution, not this baseline when a different build is deployed. No real accounts, photos, phone tests or provider changes were performed here.

## Order and stop rules

1. Main thread verifies protected staging root and asset routes, invite-only backend, current owner-scoped database/private photo storage and recovery callbacks. Reference fresh evidence; Access login screen alone is insufficient proof of authorization.
2. With separate approval outside this assignment, operator uses TWO ADULT staging accounts A/B and synthetic garments only. No child data yet. Never share passwords or sessions. Verify A cannot list/read/update/delete B wardrobe, original, derivative or backup; repeat B against A, including known foreign identifiers and direct private object requests using approved audit procedure. Verify each owner's positive control succeeds. Missing credentials means NOT TESTED, not PASS. Stop on any exposure, wrong-owner restore or silent photo loss; notify main thread privately, without publishing evidence containing identifiers.
3. Main thread resolves all adult failures and authorizes four-account setup. Accounts A/B/C/D must be independent. For minors, parent supervises; use aliases in notes, no birth dates, school, child email, face or location. Confirm each empty/new closet and owner scope before any personal capture. This assignment must not create accounts or send invitations.
4. Run each scenario below on physical Android Chrome and physical iPhone Safari. Add Samsung Internet for the owner's setup. Run Chromium/WebKit emulation separately and label it emulation. Main thread controls enabling the avatar and invitations.
5. Record PASS / FAIL / NOT TESTED, exact build, device/browser version, date, evidence reference and reproducible steps. Any required NOT TESTED or FAIL keeps HOLD. Main thread makes the final decision; even a completed report is only ready for review.

## Synthetic fixture pack (create locally; never use family photos)

Use drawings of garments on plain contrasting backgrounds, converted locally to JPEG: red short-sleeve top T1, blue long-sleeve T2, black pants B1, tan shorts B2, green skirt B3, purple dress D1, paired white shoes S1 and gray jacket J1. Include three distinct valid tops/bottoms/shoes for recommendation diversity. Label expected type/color before inference. Add a blank frame, duplicate T1, truncated JPEG, portrait EXIF-rotated T2, low-contrast shoe and overlapping top/jacket. No face, text with identity, GPS or metadata from real photographs. Synthetic recognition outcomes do not establish real-garment accuracy. Original-photo preservation compares decoded dimensions and source identity, not visual memory alone.

## Acceptance scenarios

| Gate | Procedure | Required observation |
| --- | --- | --- |
| access | Operator checks approved and unapproved identities at canonical staging and required assets using security team's procedure | Allowed owner works; unauthorized access denied; fresh security audit linked |
| adult-isolation | Execute A/B positive/negative owner matrix above before children | Zero foreign records/images/backup writes or reads; actual server enforcement verified |
| four-accounts | A/B/C/D independently sign in, reload, sign out, switch account on same phone, back/forward; leave other browser signed in | Only correct closet; logout hides private view; other account/session remains correct |
| android / iphone | Portrait 360×800 and 390×844, landscape, keyboard open, enlarged text; physical back gesture, permission deny/retry | Primary controls visible, labeled, reachable, no horizontal scroll or clipped modal; key targets >=44 CSS px; focus visible and no trap |
| capture | Camera allow/deny, single capture/import, EXIF rotation, blank/duplicate/corrupt/low-contrast/overlap fixtures | Original preserved, automatic crop keeps garment edges/soles; type then color; uncertain results reviewable; no false saved success |
| correction | Adjust type/color on uncertain item, leave optional material/details blank; save, reload and reopen | Original visible; mandatory type/color retained; corrections persist; no accidental ambiguous approval |
| avatar | Approved enabled build: T1+B1+S1 then J1; switch to D1; remove layer, reload | Recognizable garment pixels, correct order; dress compatibility; no pants conflict; masking failure visibly falls back; no realism/fit claim |
| recommendations | Use enough reviewed owned items; request three outfits; repeat with sparse closet | Three valid owned-item sets when possible; truthful shortage otherwise; no invented items |
| swap | Swap one selected piece from each outfit | Only chosen slot changes; compatible owned replacement; source garment links and others unchanged |
| cloud-restore | A saves synthetic items; wait for confirmed backup, open fresh independent browser/device and authenticate A; then B | A restores originals, corrections and item count; B sees only B; local-only reload is not cloud proof |
| feedback | Parent uses private template below for each category; rehearse sanitized public summary | Usable private report, zero identifying content or photos in public issue |

For login recovery: test expired/used recovery link and interruption, terminal invalid session, transient offline, reload and retry. Never paste email links/tokens in notes. Expected: private UI locks for invalid identity, transient failure offers useful recovery without false success. Verify actual external inbox only through the separate approved auth task.

For each phone, interrupt upload by disabling network, backgrounding/closing browser and switching account while save is pending. Reconnect/reopen/retry once. Expected: clear pending/failed/saved state, no duplicate, no lost original, no stale completion in the new owner's closet. Simulate failed recognition/timeout/corrupt response locally; expected safe retry/adjust or discard, no confidently invented garment, no permanent spinner. Record duration and actual result, not expected result as PASS.

## Private family feedback

Parent keeps a private local note or approved private channel, outside GitHub. Children tell parent “what I tried / what went wrong”; no extra personal details requested. No new server/form service is introduced here.

Copy locally:

    Report: F-001    Tester alias: A/B/C/D
    Build:          Device / browser version:
    Category: recognition / crop-image / avatar / outfit / login-wardrobe
    Steps (fixture IDs only):
    Expected:       Actual:
    Severity: blocks use / needs correction / cosmetic
    Recovery attempted:        Result:

Do not include photographs, screenshots, names, email, passwords, tokens, links with fragments, wardrobe exports, object paths, user UUIDs or exact personal timestamps in public GitHub. A screenshot can reveal photos in the background: use fixture-only reproduction instead. Parent strips identity, reproduces with synthetic fixtures and posts only sanitized steps/build/category to #255. If sensitive content was accidentally published, stop sharing and privately notify repository owner for removal; deleting the visible comment alone does not prove all copies disappeared. Retain private notes only for the pilot; parent deletes unnecessary copies when resolved. Do not promise an unimplemented in-app feedback form.

## Evidence reuse and release report

Do not rerun active development PR tests merely to obtain a new total. Reuse exact-head artifacts only when their build and scope match the candidate; otherwise mark applicability pending.

| Existing evidence | Reuse / limit |
| --- | --- |
| PR #314, Actions 40438999796 | Reported synthetic three-browser/two-identity staging Auth; not live RLS or physical phone verification |
| PR #302 | Synthetic stage cloud owner/race matrix; not server-side JWT A/B denial |
| PRs #295, #292, #293 | Avatar/original-photo candidates; main thread owns integration and rollout, not acceptance proof |
| docs/WEBKIT-MOBILE-RESULTS.md, run 38606969098 | Historical desktop WebKit EXIF/layout/import evidence; not current physical Safari proof; includes licensed photo so do not call all-synthetic |
| scripts/run-mobile-flow.mjs / run-webkit-mobile-flow.mjs | Existing emulation coverage with replaced Auth and licensed fixtures; not four-account or real-device certification |

PR descriptions reviewed as reported evidence, not independently rerun/verified artifacts. Main branch lacks much of the stacked staging candidate; do not cherry-pick it here.

`release-report.json` deliberately starts every invitation gate NOT TESTED. Run `node scripts/check-family-alpha-27.mjs` to print HOLD. PASS requires dated build-specific evidence; live security/restore and physical phones require the appropriate method. The validator checks record completeness, not truth of evidence. No release switch, deployment or automatic invitations exist.

## Assignment 27 verified offline results

Local build `node scripts/build.mjs` succeeded; Node suite `node --test tests/*.cjs tests/*.mjs`: **258 PASS, 0 FAIL**, including five new evidence-validator tests. Initial pre-build run was 257/258 because `dist/manifest.webmanifest` did not exist; building resolved it. Report validator returns **HOLD**, with 12 required gates NOT TESTED. These are offline checks, not recognition accuracy or browser/device execution. No cloud browser session was initialized because protected staging requires owner access and this assignment cannot create/invite accounts; opening the login wall would not validate acceptance. Browser emulation and physical phones were not run by this assignment.
