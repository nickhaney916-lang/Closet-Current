# MAIN1054 M32 — exact owner/source verified picker action research gate

**Research only. DRAFT / UNMERGED / UNDEPLOYED. Family Alpha #255 must remain OPEN/HOLD.**

## Exact-source ancestry and scope

- Parent: main-thread M31 [PR #1161](https://github.com/nickhaney916-lang/Closet-Current/pull/1161), immutable HEAD `2e781ab8aabf2fc24ff25fe1b20b2076147bc36d`.
- M31 prior verified acceptance: [Actions #43616274970](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43616274970), 2,641/2,641 Node and Chromium/WebKit native 2D and catalog browser tests. **Those passes belong to M31 only.**
- Branch: `research/main1054-picker-action-m32-HOLD`. Strict source scope is one research module, one Node test, this report and its isolated workflow.
- No modifications to `public/`, `supabase/`, `benchmark/`, existing mission heads, staging, production, hosted accounts, model runtime, geometry, or original JPEG fixture.
- New exact-head M32 CI: see this branch's `main1054-picker32-no-deploy.yml`; **do not claim a pass until completed**.

## Why M32 is necessary

The default native Outfit Builder picker in `public/outfit-board.js` currently lists `items.filter(slotAllows)` and invokes `selectBoardPiece(slotId,item.id)` from a retained DOM card. This protects the same-login UI lease, but **does not yet call P87's original-JPEG SHA/owner-reviewed field-receipt source check in that exact click path**. Another confirmed category, stale correction, duplicate/ambiguous unit, invalid restored JPEG or photo may otherwise appear in a legacy slot. Existing board write CAS and default UI behavior are not changed in this experiment.

## Implemented research boundary

`research/main1054-picker32/picker-admission.mjs` exports `createPickerAdmission32`, which composes the verified M31 native P87 crosswalk for an **individual prospective picker action**. It:

1. Captures exact signed owner, auth object reference, database reference and name, session/operation epochs, a caller-supplied content revision, and the real board snapshot.
2. Revalidates the existing saved ID against an unmodified, byte-rehashed original JPEG, PHOTO119-confirmed category/subtype/color receipt, compatible slot and resolved garment unit.
3. Rechecks exact session, revision and current board after each asynchronous phase; stale requests, re-logins, superseding clicks, or explicit invalidation fail closed.
4. Demands every previously selected slot survive normalization, rather than silently erasing another item on a stale click (e.g. dress covering bottoms). Consumer may ask for an explicit removal/review first.
5. Returns only slot, item ID, original SHA and `authorized-for-immediate-2d-selection-only`. It NEVER returns image pixels or auth references, makes no IndexedDB mutation, and cannot authorize any 3D render or release.

False or stale actions return only a redacted `blocked-review-or-refresh-required` verdict. A result is **not** a persisted outfit; it cannot grant permission to bypass existing transactional compare-and-swap.

## Test and evidence matrix

| Condition | New Node test expectation | Evidence class |
| --- | --- | --- |
| Licensed Commons-0053 original; real native PHOTO119 saved owner receipt | Explicit immediate 2D admission, exact SHA, never persisted/3D | Genuine licensed photo with synthetic signed owner |
| Item assigned to incompatible slot | Block | Synthetic adversarial selection |
| Old PHOTO119 boolean but missing source-bound confirmed-field receipt | Block, raw private row unchanged | Synthetic receipt alteration |
| Original JPEG SHA receipt tampering | Block | Synthetic byte/source integrity regression |
| Same-owner re-login mid-async read | Block old request; fresh login can re-check | Synthetic auth reference |
| Content revision changes during edit/restore | Block old request | Synthetic edit/restore race |
| Current outfit board changes while hashing | Block old request | Synthetic board race |
| Earlier click invalidated/disposed while pending | Block old request | Synthetic async cancellation |
| Inherited source catalog Chromium/WebKit + original native 2D browser | Rerun exact-head workflow | Browser research, NOT physical phones |

## Explicit remaining M33 / consumer integration blockers

- **Not wired into actual default picker or saved outfit action**. Do not claim consumer protection completed on M32; this module is the source-verified admission primitive, not a UI override.
- A trustworthy **durable revision producer** must be implemented in actual private IDB and incremented on edits, delete, revoke, import/restore, and cross-tab events; a UI counter or a photo SHA flag alone does not suffice.
- An approved picker selection must be checked again against the atomic outfit write CAS (and signed-auth/DB lease) rather than relying on a positive earlier read-only result; avoid a TOCTOU gap.
- Test actual `openBoardPicker`, recommended-owned-piece click, saved outfit restore, account lock, renderer clear, 2D fallback, and 320/390/430 mobile layouts with real source receipts before attempting release-facing promotion.
- No 3D eligibility claim until licensed photo-derived garment geometry, both anatomical avatars, intersections, and realistic fit are independently accepted. No independently blind-labeled 10/10 recognition, hosted four-account RLS, or physical iPhone/Android acceptance.

**No merge/deploy and no Family Alpha release permission.** The priority after strict M32 tests is the durable revision and atomic picker-to-board consumer integration, not another unsourced recognition percentage.
