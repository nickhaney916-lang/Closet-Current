# Mission 3: source-bound automatic indexing and draft preservation

**Research only — Family Alpha HOLD #255. Not merged, deployed or used with private clothing or hosted Supabase.**

## Reproduced code defect
In the prior isolated P? Mission 3 head `1e645ee4bd8fb5be67e24fad40b765aadf17036a`, `saveIndexed` performed an unconditional `items.put(value)` and replaced all `state['draft'].batch` with the stale local `batch`. Consequently, one signed owner's second tab could have added a newly photographed garment or changed a pending review record after tab A's snapshot; tab A's automatic recognition could overwrite a preexisting saved ID and silently remove the new photograph from IndexedDB. The success path also immediately called `persistDraft()`, a second blind whole-draft write.

## Safe research implementation
- Freeze the pending record's original JPEG, SHA-256, optional outfit-source identity, owner and row ID before the asynchronous queued write.
- On exact authenticated owner + epoch + IndexedDB lease, use one `items` + `state` readwrite transaction. Read the would-be saved ID and current persisted draft before modifying either.
- Reject saved-ID collisions, absent/duplicated source draft IDs, modified original photograph or source hash, foreign owner, and persisted drafts with human adjustments, explicit user color or owner-confirmation needed.
- Atomically `items.add(value)` and remove **only** the verified row from the **persisted** draft list; keep every other-tab draft and original byte string.
- Skip redundant success-path `persistDraft()`, including `recognizeItem`'s `finally` hook after successful auto-index. False/failed paths still keep their original retry/notice behavior.
- No recognition model, real-photo accuracy, signed cloud permissions, production, staging, package, Supabase, or hosted changes.

## Synthetic verification
The source-executed Node transaction fixture tests: normal indexed insert with second-tab original preserved; existing saved-item collision; second-tab draft delete; changed JPEG/source SHA; human adjustments; explicit user-color correction; duplicated draft ID; session epoch revocation; owner switch. Existing no-deploy suite checks private owner leases, original photo retention, cross-browser UI, restore, signed disposable PostgreSQL/Storage RLS, and the full serial Node suite.

These are **synthetic** photographs and accounts, NOT real physical Android Chrome, iPhone Safari, human-annotated clothing recognition, or authorized hosted-cloud verification. No 10/10 recognition or 3D realism claim.

## Remaining limitation — not release-complete
Other flows still use whole-draft `persistDraft()`, and manually reviewed `savePiece` atomically writes a client-provided next batch; they require separate cross-tab conflict-safe draft synchronization before claiming complete multi-tab camera protection. The existing full-app integration draft PR #719 remains unmerged; integration reconciliation of stacked branches including PR #966 and #969 is owner-controlled. Physical Android/iPhone camera and PWA lifecycle acceptance, actual owner-authorized hosted Supabase backup/restore with two separate accounts, and owner-directed family pilot remain BLOCKED without devices/accounts/release authorization.

Never lift Family Alpha HOLD #255 without explicit owner approval and complete acceptance evidence.
