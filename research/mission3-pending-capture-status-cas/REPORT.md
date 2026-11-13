# Mission 3 — source-bound initial capture and recognition status CAS

**DRAFT / NO MERGE / NO DEPLOY / Family Alpha HOLD #255 OPEN.**

Parent: [Mission 3 draft #981](https://github.com/nickhaney916-lang/Closet-Current/pull/981), verified exact commit `4db3e0f157006f6c5566e13ef146d2872b3b56b5`. Ten allowlisted paths only, including exact source-fenced inherited scenario fixtures.

## Defect and fix
The generic `persistDraft()` did a blind whole-batch `state['draft']` write on every newly captured original, required photo retry, recognition status completion, and unsaved editor delete. Thus same-owner Tab A could delete Tab B's new original JPEG, resurrect deleted photos, overwrite human corrections or claim a photo was saved before IndexedDB actually committed.

The new `persistDraft({mode,record,expected,required,retry})` **refuses empty/unspecified operations**. For initial capture it freezes one source, uses a signed-owner, exact private IndexedDB `['state','items']` transaction to check existing saved-ID, read current persisted draft batch, reject duplicate ID/source, and append **only the new record**. Required photo-capture acknowledgements occur after this transaction commits. A failed required photo may retry the **same** in-memory source ID only with prior failedDraftCaptures eligibility (and the existing canonical SHA re-verification gate); a wholly identical already persisted row may ACK idempotently without rewriting others. Never automatically merge or delete photos.

Recognition freezes the pending record BEFORE delayed photo quality / model inference, and commits only an exact row-status delta via the proven source-bound `commitReviewedDraftCAS`. Stale human corrections and deleted drafts reject. Blank/duplicate photo detection performs verified per-row removal *before* dismissing the visible review. Unsaved editor delete uses its frozen exact review snapshot, and saved-item deletion leaves private pending drafts alone. No remaining call site blindly invokes `persistDraft()`.

## Automated evidence (subject to exact-head CI)
- Source-executed fake-indexeddb tests run actual app.js capture, retry, recognition and CAS against two independently signed synthetic same-owner tabs: distinct real `state` transactions, original JPEG preservation, stale human corrections, deleted image, duplicate photo, saved ID collision, account epoch, quota retry.
- Native Chromium and WebKit at 320/390/430 using synthetic SHA-matched source JPEGs, actual app candidate/recognition and IndexedDB, delayed cross-tab human correction, retry after simulated quota, strict owner DB isolation. Off-host attempts are aborted, not sent.
- Inherited browser suites test owner session, camera, cloud, storage RLS (disposable local PostgreSQL), image receipts, real garment photo-crop and review. **Not physical Android/iPhone nor hosted Supabase nor real family user testing.**
- Exact 10-path pinned-parent NO DEPLOY workflow gates both jobs. No claims of full success until matching final-HEAD CI is green.

## Remaining release blockers
Independent physical Android Chrome and iPhone Safari camera/PWA durability proof; authorized hosted Supabase Auth/Storage two-owner recovery and revocation; source-disjoint human-annotated real photo recognition; true mobile original-photo 3D garment fitting; parent/mission integration, owner signoff. HOLD #255 stays open. No changes to production, staging, hosted projects or private wardrobe.

## Engineering caveat
The generic CAS handler for recognition is fail-closed; if a different tab changes a row after recognition starts, automatic review-status persistence is rejected, and the user must reload rather than permitting a silent overwrite. Local photo remains visible in the originating tab. A later session may still need rehydration to show a newer cross-tab state.
