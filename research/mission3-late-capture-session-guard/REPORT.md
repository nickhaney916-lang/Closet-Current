# Mission 3 — fail closed after owner session revocation during in-flight capture

**DRAFT / UNMERGED / NO DEPLOY / FAMILY ALPHA HOLD #255**

## Immutable accepted parent

Directly based on draft P881 HEAD `67b892ed559df25edff34a60d49b3890eaa723d0`, which passed [GitHub Actions #43126430509](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43126430509) **2/2 jobs**, complete serial Node, local signed-owner PostgreSQL 17 RLS, actual Chromium/WebKit synthetic viewport tests, and uploaded both evidence artifacts. No hosted Supabase or physical owner media accessed.

## Confirmed race and privacy/UI risk

P881 correctly clears `failedDraftCaptures` and closes the former owner's IndexedDB handle upon `closet:session-locked`. But an already-running `candidate(...,{requireDraftCommit:true})` IndexedDB write or failed retry can reject *after* the lock and its `.catch` unconditionally re-adds the old owner photo ID into the now-cleared transient retry set. `persistDraft` can also display a former owner's failed-save warning after a different account signs in. An in-flight video uploader holding already committed frame counts can, after the owner changes, still call `render()`, message the count and `switchView('review')` for the next account. Although the old private photo is not intentionally written to the next owner, these are unsafe stale-owner state and UI behaviors.

## Fix

In `public/app.js`, only mark a failed required photo save or same-original retry if the **same object is still in the current owner batch and the same authenticated owner ID is active**. The `persistDraft` catch now suppresses a former owner's storage warning unless its original owner and DB are still active. The visible Retry button error callback likewise refuses to update another owner's UI after revocation. A revoked, async video import returns without showing stale owner frame-count/error messages or navigating the next owner's review screen; its cleanup still revokes its video blob and clears its busy flag.

All existing successful same-owner quota, original SHA, private draft and user-controlled retry behavior remain unchanged. No hosted access, cloud schema or authentication code changed.

## Targeted independent regression

`tests/mission3-late-owner-session-capture.test.cjs` executes the **actual production** `candidate()`, `persistDraft()` and `upload()` functions in Node VM against both exact green P881 baseline and current code. Scenarios: delayed required save rejection following signout; late failure of a pending retry; unchanged same-owner quota warning; no stale warning after DB/owner switch; ordinary signed-owner failure still informs the owner; video second-frame owner switch preserves old owner's isolation and forbids a stale frame count or review navigation.

`scripts/test-mission3-video-owner-switch-browser.mjs` loads the actual app in Chromium and WebKit at **320/390/430 CSS pixels**, plays a tiny synthetic colored-rectangle video using native video decoding, and swaps to another synthetic signed owner after the second candidate callback. It tests that the previous owner's committed JPEG SHA remains only in the old private IndexedDB database, the new owner's draft is empty, and no stale video frame count or review navigation occurs in the new session. Local-host network isolation blocks hosted APIs. Browser simulation is **not** a physical phone test.

## Verification plan

Strict five-path branch: `public/app.js`, one new source-extracted test, one new native browser test, this report, and dedicated no-deploy workflow. Exact-parent baseline/current reproduction, full serial Node, locally signed PostgreSQL RLS, inherited mobile Chromium/WebKit cases, new six-case owner-switch verification, and two synthetic-only evidence uploads.

**Status: new exact-head CI pending.** No production, staging, private real-user data, physical Android/iPhone, or hosted Supabase Auth/Storage operations. Family Alpha remains HOLD #255.
