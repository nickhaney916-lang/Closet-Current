# Family Alpha v0.1 — Stale Authenticated Avatar Render Invalidation

**Isolated main-thread security and lifecycle regression fix.** Family Alpha issue #255. Branch stacked on draft PR #263 (and #262 → #260 → #258 → #256). No deployment, merge, real photos or paid inference.

## Defect found in the existing candidate

The prior #262/#263 Auth wrapper tracked current avatar requests in its own WeakMap. The saved-board renderer independently tracked requests in a different WeakMap.

When the outer wrapper started a **new** Auth request it immediately cleared the avatar, but did not invalidate an **older inner** saved-board source SHA operation. If the new request was refused (401, wrong account, missing wardrobe) before it reached the inner renderer, the older async SHA could finish and install the former account's garment pixels after the newer request started.

The old outer wrapper would eventually reject, but its catch guard intentionally would not clear the newer view, allowing a misleading/stale avatar to remain. The problem is structural, not an RLS or token policy issue.

## Fix

- `public/family-alpha-2d-saved-board.mjs`: export synchronous `invalidateSavedBoard2D(container)` that increments the same inner per-container render generation and clears its children. The existing `renderSavedBoard2D` uses this primitive for its own start.
- `public/family-alpha-2d-auth-preflight.mjs`: call `invalidateSavedBoard2D(container)` **at the start** of every outer authenticated render attempt, before awaiting Auth, storage or mask preparation.
- Old async digest jobs can finish computing but cannot commit their images. An older operation's catch cannot erase a successfully drawn newer request. Distinct avatar containers remain independent.
- No changes to source identity requirements, masks, original JPEG bytes, session token provider, IndexedDB persistence, Supabase policies or production UI.

## Test coverage

- Node regression: rejected newer Auth while old SHA paused; old cannot render after newer refusal.
- Node regression: successful newer preview remains intact when old suspended SHA resolves.
- Node regression: invalidating one avatar does not clear an independent avatar container.
- Chromium + WebKit at 320/390/430 px: synthetic decoded garment image, delayed original-photo digest, newer wrong-server-identity rejection, and asserted permanent blank state when old digest resolves.
- Existing full app build and Node/browser suite run on exact head in GitHub Actions. Report counts only after confirmed log review.

## Release gate

**HOLD** until deployed Supabase RLS/private bucket verified, original-photo-to-mask trust is established (parallel #16), real logged-in staging capture/preview and physical phones are independently tested and approved. These changes do not prove source pixels or real-world garment fidelity.

No customer photos, paid AI, real backend calls, secret tokens, merges, deployment or Drive Duel edits.
