# Mission 3 — video-frame private draft commit and capture session lease

**DRAFT / Family Alpha HOLD #255 / no production, staging, hosted Supabase or release writes.**

## Exact baseline

Directly stacked on Mission 3 [draft PR #866](https://github.com/nickhaney916-lang/Closet-Current/pull/866) HEAD `b17ec7767a10aea65c386631a26cc87c13c9d301`. P866 node / native mobile browser / signed ephemeral PostgreSQL tests passed at its earlier commit, but an unrelated screenshot artifact-upload step failed; the current P866 artifact-retry CI is queued. **Do not describe parent PR #866 as fully CI green.**

## Genuine flaw in actual app code

The ordinary `public/app.js` original-JPEG camera/video pipeline correctly creates source SHA evidence and calls `candidate` for each video frame, but its existing native `upload(file)` loop **did not await `candidate` and did not request `requireDraftCommit:true`**. `candidate` therefore performed best-effort `persistDraft()` and returned immediately; a video could be reported as fully imported and switch to Review before private IndexedDB saved the last JPEG. Failed quota/aborted owner writes could remain incorrectly acknowledged as recovered. The loop also did not refuse a page hidden during `seeked` frame processing.

## Fix

On the opt-in/inherited original-source-verified video path, hold the exact authenticated owner ID and IndexedDB handle for the duration of the video import. Abort processing on owner switch, database change, or page background before extracting a frame, after proof calculation, and after committing. Require `await candidate(proof.image,{sourceProof:proof,requireDraftCommit:true})` **before** counting the frame saved or advancing progress; duplicate responses do not count. On failure, distinguish previously committed frames from a visible but unconfirmed last frame. The previous legacy video path remains unchanged and no owner photo leaves local browser storage.

## Tests

The new `tests/mission3-video-private-draft-lease.test.cjs` extracts and executes the actual production `async function upload(file)` inside a controlled Node VM, comparing current behavior with the pinned P866 parent. Test scenarios: delayed private commit (parent finishes too soon; fixed code waits), quota failure (never claims frame was saved), page hidden during video seek (no JPEG candidate is processed), and account change after source proof (no cross-owner candidate). The no-deploy workflow uses a strict four-path diff allowlist, the exact parent SHA, baseline/current targeted tests, existing full serial Node suite, signed disposable PostgreSQL 17 RLS, and inherited Chromium/WebKit synthetic 320/390/430 CSS suites. Two evidence artifacts are scoped only to synthetic test data.

## Limitations

This is an actual code fix but not a physical iPhone Safari or Android Chrome video proof. No real user videos, hosted Supabase credentials or live database are touched. Family Alpha remains on HOLD pending independent integrated recognition/photo-to-3D and physical-device acceptance.

**CI disposition: awaiting exact-HEAD GitHub Actions completion.**
