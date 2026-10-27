# Family Alpha #49 — Work44 visual + private-photo security integration (NO DEPLOY, HOLD)

**Main-thread development-only integration review — October 27, 2026**

**Source branches and exact pins:**
- [#349](https://github.com/nickhaney916-lang/Closet-Current/pull/349), owner-private unmasked photo source: `b771329a5502cf53e495c860fe8c342d7ca3443a`.
- [#351](https://github.com/nickhaney916-lang/Closet-Current/pull/351), Work #44 attractive photo-only layout: `4a182cf817284b061f4c4a885958e3b0472d555d`.
- [#352](https://github.com/nickhaney916-lang/Closet-Current/pull/352), corrected stage RLS and private-writer role chain: `12dcc0bd7ee35eadad86503ae26cc9496a251b4a`.
- [#350](https://github.com/nickhaney916-lang/Closet-Current/pull/350), independent 15 licensed-photo visual gallery: `ffce7b89638b6821571ec9d5b8b215b7c8f9edf5`.

## Purpose

Verify that Work #44's photo outfit presentation can be introduced **on top of the exact #352 security parent** without rebuilding the styling engine, changing authenticated saved JPEG provenance, altering owner/session isolation, weakening the release HOLD, or using live staging.

This is an independent integration candidate. Neither Work #44's upstream PR nor #352 is merged, edited or deployed.

## Implementation boundary

Copy the five **byte-exact** Work44 source files `research/work44-board-design/{README.md,board.css}`, `scripts/{build-work44-visual-board-hold.mjs,test-work44-integrated-browser.mjs}`, `tests/work44/board.test.mjs`. The dedicated no-deploy workflow fetches the exact PR #351 Git commit and uses `git show ... | cmp` to reject changes.

The Work44 builder makes **exactly two** changes to the compiled #349 full app: the photo-board CSS and a truthful explanatory sentence acknowledging original-photo surroundings. It preserves source crop pixels `recognitionPhoto.image` and all recognition metadata, account/private IndexedDB guard, storage code, authentication, photo decode, recommendation engine, swap/save/favorite logic, avatar rendering, and all unrelated assets byte-identical.

New `scripts/check-family-alpha-49-combined-visual-security-hold.mjs` calls the existing **unchanged** Work44 source/asset guard and existing **corrected** #352 staging security/release checker. It also retains the missing live-auth check as `NOT_EXECUTED` instead of promoting synthetic results into real JWT success.

## Test methodology and acceptance

- Compile the existing inherited staging Auth/Cloud `HOLD-NO-CALLBACK-OR-KEY` protected candidate (never production or real staging).
- Verify all five Work44 integration files match the pinned upstream commit exactly.
- Run Work43 source/ownership private JPEG tests; #352 read-only stage role/metadata/negative-case tests; two-JWT stage-only preflight **mock/no-op** tests.
- Run Work44 exact presentation/wording tests and #49 adversarial integration release-guard tests (fake visual approval, foreign account, staging writes, wearer/garment claims rejected).
- Run the inherited real recommendation-engine **three-outfit, single-piece swap, favorites, saved-state rollback** journey against **before and after** compiled candidates. Use licensed original photo fixtures and synthetic browser/Auth/recognition fixtures; Chromium + WebKit at 320,390,430 px; no external requests.
- Capture source and Work44 comparison screenshots in CI artifacts. Work #44's separate PR #351 includes a 15-photo licensed source gallery before/after; do not invent owner approval from green browser tests.

All safety and functionality claims are limited to the actual tests reported by the exact-head CI.

## Current known blockers (HOLD)

- Original-photo layout polish does **not** isolate a clean clothing garment out of source scenes with mannequins, people, hangers and single shoes. Not realistic wear preview; cutouts remain unapproved.
- Work #45 separately owns staging configuration, protected Access, user invitations, and any approved real JWT privacy checks. These have not been performed by this integration.
- Corrected backup architecture includes a private `SECURITY DEFINER` helper owned by restricted writer role; real signed-in backup save/restore not yet tested. **No broad grant change is appropriate.**
- Staging has one registered account based on the last verified metadata; two/four real separately authenticated accounts missing. Auth callback/key for protected Family Alpha candidate disabled.
- Physical Android/iPhone family testing and human outfit visual acceptance not performed.
- No actual family photos, auth tokens, Supabase/Cloudflare changes, deployment, paid services, or Drive Duel edits.

**Decision stays: FAMILY ALPHA HOLD regardless of green synthetic browser CI.**
