# Mission 1 P815 — receiving photo review UI cannot accept partial or contradictory worker streams

**FAMILY ALPHA HOLD #255 — DRAFT, UNMERGED, UNDEPLOYED.** Directly stacked on independently green P814 exact `7bff50e6ee759f5c3b621eb1755e19ea4d671f87`, [NO DEPLOY Actions #42962738392](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42962738392). Only consumer `public/outfit-capture.js`, its VM test, dedicated CI and this report changed. No private original photo, auth, database, production/staging hosting, model weights or benchmark mutation.

## Actual exposed downstream bug

Even after the P814 worker fix, the receiving `public/outfit-capture.js` immediately called `candidate(...)` for *each* incoming `piece`, updating the user's review queue while the job was still unfinished. If the worker terminated mid-stream, sent an `error`, or emitted `done,count` inconsistent with the number of previously sent pieces, the interface could preserve partially accepted clothing suggestions and claim successful separation. Invalid candidate packets were silently ignored (`return`) rather than aborting a contradictory batch. Existing regression explicitly required a partial piece to survive an error, undermining all-or-nothing review.

## Implemented research branch

The receiving UI now **stages** candidates only in a source/owner/job-scoped temporary array. Each piece must satisfy the prior source-crop/model-hint contract (JPEG base64, per-JPEG 8,000,000-char limit, existing known category types, optional finite valid 0–1 crop bounds), bounded to at most 24 proposals and 24,000,000 total JPEG data chars. An invalid packet, no consistent terminal count, worker error, timeout, pagehide, owner change or stale job **discards all staged pieces**; no new candidates are added to the user's review queue. A valid `done,count` must match *exactly* the number of vetted parts. Only then does the UI call its existing `candidate` function and display the successful completion status; existing saved pieces are preserved, and prior duplicate-source filtering remains unchanged.

This makes worker transport / receiver admission all-or-nothing, but the separately existing `candidate()` recognition/indexing and eventual owner-private save still have their own transactional constraints; this milestone does **not** claim full durable closet transaction atomicity across unexpected runtime failures during acceptance.

## Genuine regression semantics

- First valid piece (then a second) must produce **zero** review candidates before the matching `done,count`.
- Worker error after one valid packet leaves zero new candidates, preserves an older saved owner garment and makes retry available.
- Forged `done,count:2` after only one piece rejects the entire source batch.
- Invalid later JPEG rejects the first valid piece's staged candidate too.
- Worker timeout with an already received packet discards it.
- Existing 100 synthetic capture cases (250 individual pieces) must still emit all candidates after matching `done` in correct order, while native build and full app Node regressions pass.
- Dedicated NO DEPLOY workflow strict four-path allowlist on exact green P814 parent, two independent jobs; **do not claim verified before final HEAD pass**.

## Unresolved Mission 1 gates

Actual frozen SegFormer B0 on exposed real publisher source images misses 15/23 garment masks; no independently blinded two-human rights-cleared untouched original benchmark, acceptable category/subtype/primary-color/source-mask IoU, authentic independent reviewer recruitment, browser physical RAM on Android/iPhone, real private on-phone learned segmentation quality, hosted two-owner release signoff or authorized Family Alpha deployment is established by packet QA. All tester pixels and scripted actors here are synthetic. **Mission 1 remains incomplete despite verified integrity patches.**
