# Mission 1 P867 — Dual-model worker transport fail-closed and immediate retry

**Family Alpha HOLD #255 OPEN. DRAFT / UNMERGED / UNDEPLOYED.** Stacked on Mission1 P866 [draft PR #1038](https://github.com/nickhaney916-lang/Closet-Current/pull/1038) exact parent `31c1af05fa9366b71cb505b09d1c9a381c381445` (P866 full authentic public 48-photo CI verification separate).

## Exact source-verified bug
In #82's opt-in `public/dual-core-82.mjs` `browserRequest82()`, a synchronous `worker.postMessage(request)` exception (e.g., structured-clone/DataCloneError) rejected the Promise implicitly but **never called** the `end()` cleanup. Thus `busy82` could remain true until the 240-second timeout and block later authorized owner attempts; the Worker could remain alive. Likewise, a thrown owner-UI progress callback could bypass cleanup, and `worker.terminate()` exceptions could stop the reject/resolve. These are independently reproducible code-level failure paths, **not proof** of #83's still-unexplained WebKit process closure.

## Narrow fix
- Catch synchronous `postMessage` exceptions and always close/terminate worker, cancel the timer, release busy82, reject with `P82_REQUEST_UNDELIVERABLE`.
- Guard progress UI callback failure with `P82_PROGRESS_FAILURE`, fail-closed without making a model hypothesis or saved wardrobe entry.
- Best-effort catch `terminate()` exceptions so the capability rejects/resolves and allows retry rather than stranding the owner.
- Add source-executed synthetic Worker tests for sync clone failure → **successful second transport** (error code not busy), progress callback throw even if teardown throws, AbortController cancellation immediate retry, review-first/source guard and HOLD. No actual model-class accuracy claimed. No runtime opt-in flags, model weights, camera code, data, cloud or 3D changed.

## Tests and acceptance
Strict four-file exact-parent NO DEPLOY CI, two builds, full native, P866 native P865 original JPEG reload and owner-signed review desktop browsers, P82 synthetic policy browser and shoe pair guards. The P866 immutable donor-real-model replay separately tested actual pinned pretrained weights; P867 changes only transport cleanup and tests **no new real model photometric accuracy**. WebKit real-model sessions still DISABLED by default, physical iPhones 0. P851 release BLOCKED, Family Alpha HOLD #255 OPEN. No merge/deploy. Record actual exact final-head results when CI completes.
