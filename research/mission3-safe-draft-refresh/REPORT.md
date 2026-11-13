# Mission 3 — owner-safe pending original photo refresh

**DRAFT ONLY. Family Alpha HOLD #255 OPEN. No merge, staging, production, hosted Supabase, or family wardrobe access.**

Parent [Mission 3 PR #986](https://github.com/nickhaney916-lang/Closet-Current/pull/986) verified commit `3b62ec1cad3ac20c9949fd66938235923bb0afee`. Six allowlisted files only.

## Existing usability/data-loss hazard

Earlier mission 3 CAS patches correctly reject stale saved/crop/category/capture writes, instructing the owner to **reload Photo results**. However Photo results had no in-app refresh control. A browser reload could hide or orphan an owner-visible original JPEG whose required draft save had failed, even though the original remained in page memory with an eligible Retry photo control. A stale same-owner second tab could hold a later category correction or a newly captured original photo and no safe way for the first tab to rehydrate.

## Change

Add explicit accessible **Refresh photo results** button next to Clear unfinished photos. The click is read-only. `refreshOwnerDraftFromDevice` captures a signed-owner / DB / session epoch lease, waits for this tab's queued writes, then reads only `state['draft']`, **not all saved wardrobe JPEGs**. It refuses to proceed if the camera, video import, photo import, scan, recognition, editor dialog, queued work or failed required original save is active. It freezes the local row identities and exact review values and checks they have not changed during the async read.

Before replacing the visible results, it checks owner ID, unique IDs, every local source's presence and its immutable owner, original JPEG and SHA-256 identity. If another tab deleted a visible original, changed its source bytes, or if this tab contains a not-yet-durable original, the action rejects and **leaves all visible images in memory**. There is no write or cloud dirty revision. Valid cross-tab new originals and color/status corrections are rehydrated via `normalizeClothing`, while untouched private source bytes stay unchanged. A delayed cross-owner read cannot show previous user's message or photo.

This is a conservative refresh: a legitimate external deletion requires closing/reopening the older stale tab after confirming its local source is durably backed up or intentionally discarded. Never silently clear a source simply to make refresh work.

## Verification

- Test extracted real `app.js` refresh with synthetic owner-private rows: append, human correction, unchanged data, missing/swap original, duplicate/foreign owner, failed capture, active camera/recognition/dialog, same-tab concurrent capture, queued write, delayed account change. Confirm no writes, no old-owner UI publication.
- Real Chromium/WebKit engine 320/390/430 viewport, two same-owner tabs plus foreign-owner browser using synthetic source JPEG and original SHA-256, actual native IndexedDB candidate inserts / guarded cross-tab edits, clicking visible UI, and refusal to drop deleted/failed local originals.
- Dedicated pinned-parent **six-path NO DEPLOY** workflow with source and full regression suites, native offline cloud/identity/restore tests and disposable signed PostgreSQL Storage RLS. **Never claim full green until exact HEAD is successful.**

## Remaining launch blockers

Real Android Chrome and iPhone Safari camera/PWA tests, authorized hosted Supabase Auth and Storage two-owner backup/restore + revocation, human independent real-photo recognition, photo-accurate 3D garment fit and cross-mission integration are unverified. Owner acceptance and release authorization outstanding. HOLD #255 remains OPEN.
