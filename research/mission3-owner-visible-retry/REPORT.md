# Mission 3 — owner-visible, SHA-verified retry of an unsaved photo

**DRAFT / Family Alpha HOLD #255 / no production, staging, or hosted project changes.**

## Verified exact parent

This branch is stacked directly from Mission 3 [draft PR #878](https://github.com/nickhaney916-lang/Closet-Current/pull/878), head `bae4e047d2763bf57dbb061252b74a8fc4f8a279`, whose [GitHub Actions #43116773885](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43116773885) completed **2/2 SUCCESS**, full serial Node, local signed-owner PostgreSQL RLS, and synthetic native Chromium/WebKit viewport regressions.

## User-observable defect

P878 added a safe owner/SHA-bound same-original retry after IndexedDB quota failure, but **did not provide an owner-visible button** to trigger it. Live camera captures cannot be precisely re-created by photographing again, so users could see an unsaved in-memory review candidate yet still have no practical way to finish its private save after freeing space. The Photo results card labeled that candidate as ordinary "Needs review," not "not saved on this device."

## Implementation

`public/app.js` now marks a failed required private draft save in the review/scan results as **"Photo not saved on this device"** and offers an accessible **"Retry saving photo"** button. The action appears only for a pending originally captured JPEG belonging to the current owner and matching its recorded original SHA. Before writing, the existing canonical photo module independently recomputes the JPEG digest with WebCrypto `verifyStoredCanonical`. It rechecks the owner/DB lease before and after digest and again after `candidate(...,{requireDraftCommit:true})` commits the original **existing** ID. A second quota failure keeps the user-visible retry state. No background upload or uncontrolled owner data copying is introduced.

Camera and gallery paths explicitly rerender pending review results after a failed required commit. The original photo is never silently called saved without the IndexedDB transaction finishing. A successful retry clears the pending status and leaves the same review candidate for human category/color confirmation.

## Acceptance

New Node tests extract the actual app `candidate` and `retryUncommittedCapture` functions to verify: baseline lacks visible retry, success uses same owner record, quota failure persists the retry state, wrong SHA fails closed, asynchronous owner switch prevents writes, and saved/absent rows cannot retry. A dedicated real-browser test uses **synthetic video**, actual Chromium and WebKit at 320/390/430 CSS widths, intentionally causes one `CAPTURE_STORAGE_FAILED` in required save, confirms no draft row exists, clicks the real owner-visible Retry button, then confirms source SHA, same ID and owner in IndexedDB and after page reload. It explicitly does not simulate a physical OS-level quota.

Dedicated exact-head no-deploy workflow enforces **five-path** diff scope (app, Node test, browser test, report, workflow), immutable accepted parent, full serial Node, disposable signed owner PostgreSQL 17 RLS, inherited 12 native browser suites plus the six new click-through cases, and synthetic-only screenshot/JSON artifact uploads. No hosted data or real user videos are accessed.

## Limitations

Not acceptance of physical Android/iOS camera or storage exhaustion, hosted Supabase signed Auth+Storage, independent real-garment recognition, or realistic photographed-clothing 3D. Family Alpha release remains blocked.

**Final exact-head CI outcome pending.**
