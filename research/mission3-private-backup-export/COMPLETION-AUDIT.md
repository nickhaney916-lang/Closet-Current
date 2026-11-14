# Closet Current Mission 3 — owner-safe private backup export and completion audit

**November 13, 2026 (Pacific). Research-only DRAFT / NO MERGE / NO DEPLOY. Family Alpha HOLD issue #255 must stay OPEN.**

## Scope and verified immutable parent

Based on [Mission 3 PR #1115](https://github.com/nickhaney916-lang/Closet-Current/pull/1115) exact `b5f87ca7986b65f9034f9b63128472bc925881a3`. Its pinned [CI #43543909666](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43543909666) SUCCESS on both jobs: **2,107/2,107 full serial Node PASS**, **264/264** Chromium/WebKit synthetic owner-bound outfit suggestion callbacks PASS; previous milestones including 108 legacy backup import, 120 saved cards/picker, 102 session lock, original JPEG SHA and disposable signed two-owner PostgreSQL/Storage RLS PASS. All previous draft branches remain unmerged, and conflicts/independent research parent checks should not be misrepresented as integration passing.

## Confirmed source-level export gap

`public/app.js` used `$('export').onclick=async()=>{ if(typeof outfitBoardReady... ) await outfitBoardReady; ...}`, then exported live `items`, `inspirationLooks`, and `boardBackup()` without *capturing* the signed original owner before that await or validating the private DB/auth/session at click/download. `public/outfit-board.js` `boardBackup()` could also return old private saved outfit names and original image references without any auth gate or exact owner lease.

The `?restoreAtomic01=research` v4 export was additionally vulnerable to a delayed bridge `exportJSON()` result publishing a previous session's Blob after a different login or a same-ID new auth object. This is a **source-observed risk**, not evidence of a real-world exposure.

## Engineering fix

- Start *both* legacy v3 and research-only v4 export by capturing `ownerWardrobeMutationLease()` at the initiating click, before any readiness await. Verify exact auth identity, signed owner ID, exact private IndexedDB handle/name, capture epoch and visible authenticated gate after every await and directly before constructing or downloading a Blob.
- Clone current clothes/looks and invoke `boardBackup()` only under the current initiating owner; `boardBackup()` now independently checks `beginOwnerBoardUiLease()` for both default and native BOARD04 research modes. No stale guest/cross-account direct exports.
- For the async v4 branch, remember the original `window.restoreAtomic01Bridge` and reject a session/bridge replacement before exporting JSON. Do not show prior owner's stale success/error status after any account change.
- Download remains an explicit user click. No photo source mutation, database write, network request, deployment, cloud export, or private user image access. Original JPEG bytes and SHA metadata remain intact.

## Reproducible acceptance tests

- `tests/mission3-private-backup-export-owner-lease.test.cjs`: exact production app export handler, auth lease, outfit owner lease and backup function executed in a synthetic VM; both valid v3/v4 backups and signout, same-ID re-login, DB replacement, epoch rotation, revoked auth, modal login gate, app lock, late bridge replacement, guest calls, unchanged original JPEG and retained outfit snapshots.
- `scripts/test-mission3-private-backup-export-owner-browser.mjs`: **126 planned synthetic Chromium/WebKit CSS phone-width scenarios** 21 modes × Chromium/WebKit × 320/390/430, using in-memory Blob/download stubs. They do **not** represent physical iPhone/Android acceptance or real customers.
- Pinned-parent six-path CI inherits the full ~2,100+ serial Node regression, image review/source SHA, photo-to-private 2D outfits, native BOARD04, legacy atomic cloud backup/restore, previous owner-switch browser suites and disposable signed two-owner PostgreSQL/Storage RLS. Receipt JSON and screenshots validated. **Only call final exact-head green after both CI jobs SUCCESS and counts confirmed.**

## Actual Mission 3 completion / Family Alpha release gates

| Gate | Current evidence | Release status |
| --- | --- | --- |
| Signed owner-only local storage, original JPEG custody, atomic backups, 2D fallback and Outfit Builder privacy | Extensive synthetic + Chromium/WebKit + disposable PostgreSQL no-deploy suites across draft branches | **ENGINEERING TESTED ON RESEARCH BRANCH, NOT MERGED** |
| Native research 3D source-photo clothing quality with realistic fitted garments and layering | Separate Mission 2 evolving source-realism research; no approved end-to-end physical owner-photo fit | **BLOCKED** |
| Four independent family accounts, secure staging and hosted RLS/JWT/Storage backup/restore | Disposable synthetic two-owner DB/RLS test; no authorized live-host staging/four-person scenario | **BLOCKED** |
| Physical Android Chrome and iPhone Safari capture→review→private closet→original-photo outfit/3D fallback | Browser engines at CSS phone widths, not actual devices; real capture/persons unavailable | **BLOCKED** |
| Human reviewed 15–20 real garments, 10/10 recognition quality, 3 saved outfits, owner-approved swaps | Mission 1 independent recognition/label verification and real phone acceptance outstanding | **BLOCKED** |
| Minor-protected accounts, private feedback, final user review and explicit release authorization | HOLD #255 remains active; release not authorized | **BLOCKED** |

**Conclusion:** Aim to complete *all safely executable no-deploy code and automated QA*; never claim final Mission 3, Family Alpha or 3D-first release completed solely from synthetic suites. Unblock only with actual approved original-device, separate account, source-photo and staging evidence and explicit owner authorization. No merges, production/staging changes, private wardrobe access, or invitations.

## Coordination and restrictions

Parallel Style original-photo signed-session branch [PR #1104](https://github.com/nickhaney916-lang/Closet-Current/pull/1104), local owner-reviewed cloud safety [PR #1120](https://github.com/nickhaney916-lang/Closet-Current/pull/1120), and source-to-outfit cross-mission [PR #1110](https://github.com/nickhaney916-lang/Closet-Current/pull/1110) are separate unmerged research. Their work should be reconciled by exact source/commit review under separate owner approval; never silently cherry-pick or merge them into this isolated patch. Family Alpha #255 OPEN/HOLD.

## First CI diagnosis — synthetic browser harness only

Initial exact-head [CI #43549080748](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43549080748) **offline 6/6 steps PASS**; native-signed-and-browser reached new Chromium/WebKit runner but failed because `window.__probe` was not installed by an injected synthetic browser script. Consequently the new 126 browser cases were **not** exercised on that first head, and receipt upload failed as a consequence. Rework the test harness to use an intercepted synthetic HTTPS origin and browser-native `location.search`/`history.replaceState` rather than shadowing the window's `location` global. On setup failure, surface all browser page errors before running cases. **Production source remains identical** to first patch; no previously green CI count is claimed for the first failed run. Require a new green run at the revised exact commit.

### Second synthetic browser fixture failure, no production code change

At revised exact-head [CI #43549375928](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43549375928), offline CI again **PASS**; the browser runner now exposed a more concrete setup error: the real production `$('export').onclick` assignment executed while the harness' initial HTML had no `#export` element (`Cannot set properties of null (setting 'onclick')`). Fix the **synthetic routed page HTML** to include the Export control before source attachment, capture the original production callback, and attach that same callback when the synthetic page resets between cases. No production source changes. New-head browser tests/full inherited suite still required; the first two CI failures are NOT evidence of app completion.
