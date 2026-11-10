# Closet Current Mission 3 — durable original-photo capture acknowledgment

**FAMILY ALPHA HOLD #255. Isolated unmerged research; not release acceptance.**
**Status:** Implementation under exact-head CI; see draft PR for final evidence if later verified.

## Immutable parent
Mission 3 bounded private-photo queue and cutout SHA PR #803, exact `288e517bc7dc2b43417a82a6caed427b257eb811`, independently passed dedicated no-deploy CI [#42925322920](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42925322920), 1,373 Node tests, six/browser-engine mobile cases, 49 verified PNGs and 48 automated accessibility reports without violations.

## Root cause
The native camera's `candidate()` placed the new photo in volatile `batch`, kicked off `persistDraft()` asynchronously without waiting, incremented the capture count and immediately returned `true`. A quota failure or session replacement could therefore result in the UI reporting success while IndexedDB contained no saved review record. The same native original-JPEG photo-import route reported an item as added before persistence. Existing catch logic swallowed the storage error, and the import handler misclassified it as unreadable photo data.

## Scoped repair
- `persistDraft({required:true})` pins the authenticated owner, IndexedDB connection and draft snapshot, and rejects on quota, transaction abort or cross-account replacement. Legacy unrelated callers remain best-effort and retain their existing explicit warning.
- Normal real original camera capture and imported original JPEG now await the committed draft before reporting a successful photo or queueing recognition. In-memory photos remain visible for review after a failed commit; no automatic approval or private saved garment insertion occurs.
- Storage failure shows a distinct accessible status; it does not claim the JPEG was safely backed up. Photo import reports `not saved to device` rather than the misleading `could not open JPEG`.
- Session lock, hidden page and request cancellation continue to revoke camera acknowledgment even if a delayed IndexedDB transaction completed before visibility interruption.
- No change to real recognition model, original JPEG source hash, private cloud transport, Supabase, 3D renderer, pricing or released app.

## Verification
- Parent baseline and repaired tests execute actual `persistDraft` and `candidate` functions with two synthetic owner-specific fake IndexedDB databases, including a delayed transaction, forced QuotaExceededError, account/database swap, ordinary existing synchronous behavior and import error classification.
- Exact-scope CI rebuilds the native app, runs full serial Node tests, and genuine Chromium/WebKit canonical private camera→review→owned outfit workflows and mobile accessibility at 320/390/430 CSS pixels.
- Actual Android/iPhone camera permission, abrupt OS process termination, real mobile keyboard, real hosted Supabase/JWT private restore, independent owner testing, large real wardrobe memory and final release acceptance remain unverified; no automatic retries or guaranteed photo persistence after quota exhaustion is claimed.

Family Alpha HOLD #255 remains active. Production/staging unchanged; stacked draft PR only.