# Closet Current — Priority #113 / ATOMIC-REVIEWED-LOOK-SNAPSHOT-113

**Independent research ONLY · Family Alpha Issue #255 HOLD · no merge, production, existing staging or deployment.**

## Pinned research parent
P112 [draft PR #666](https://github.com/nickhaney916-lang/Closet-Current/pull/666), exact code SHA `fe3bb0e3142a7e617bfb691b71a3f9a7415cdbb6`, with independently green original licensed photographed 3D/mobile browser [no-deploy CI #42306390744](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42306390744): 1,033 inherited Node PASS, 12 anatomical donor PASS, 24 original-source pose frames PASS, 8 real public saved-look restorations, 16 original JPEG-backed 3D screenshots and 0 changed pixels. This P113 branch modifies **only a research admission policy, tests, report and dedicated workflow**; it does not modify renderer, personal photo inputs, app, cloud, staging or production.

## Root cause

The existing plan validates source IDs, original SHA-256, item category/subtype, reviewed color and owner; then consults the live session again before returning its policy result. A synchronous callback used for the last session check can observe an intervening wardrobe or ownership change. The original code then builds its returned object from the *mutable source records* even though the “public licensed 3D” decision was taken on previous values. Examples: reviewed color changes from Blue to Navy, source SHA or sourceId changes, or an indexed Map entry is replaced during that callback. The returned metadata could then be internally inconsistent. The downstream showroom had additional protections, but the planning boundary should itself be fail-closed.

## Implemented fix

- Snapshot only primitive, previously reviewed garment metadata for both indexed items BEFORE the final live owner/session check: source record ID, original-photo SHA-256, color, category/subtype, reviewed status, original-photo provenance, 3D approval, and related review/source flags.
- Derive licensed public-photo benchmark 3D eligibility and all returned immutable metadata from the SAME snapshot, not a mixture of old benchmark decisions and post-callback mutable fields.
- On completion of the final live session check, reject any changed account owner/session generation, index release state, Map pointer/selected item binding, saved top/bottom board slots or their binding object, or relevant original-source record fields. The new record cannot borrow a previous 3D admission by keeping the same image bytes.
- Preserve the exact original photo/2D fallback for private-like synthetic records and the public benchmark's genuine 163-bone 3D path only for its exact original source.
- Preserve no network access, original photo bytes, cloud storage, real account data, private images, automatic recognition claims, or release authorization in this metadata gate.

## Automated acceptance matrix

Dedicated P113 Node tests exercise:
1. Positive: unchanged licensed source on both denim originals, plus private-like synthetic 2D fallback.
2. Mid-check correction to shirt or jeans reviewed color.
3. Mid-check source SHA/record ID, category/subtype, review flag, original source provenance and owner changes.
4. Mid-check Map item replacement, Map identity swap, saved outfit slot mutation/replacement and additional slot insertion.
5. Mid-check session owner/generation, indexed generation or release-state changes (including superficially consistent simultaneous rotations).
6. Stale saved-look reopening under mid-check source mutations.
7. Allow harmless unrelated display metadata without changing source identity.
8. Verify no customer image/network/browser storage access, and explicit P113 read-only admission guard in source.

## Verification and limits

The dedicated **P113** no-deploy workflow validates the exact P112 commit parent, only four approved research paths, the unchanged production/public bundle, full inherited Node tests, syntax and build. It **does not claim to rerun the slow WebGL browser suite**; the exact unchanged renderer and UI were independently verified in P112's dedicated success. P113 has no renderer/UI code changes.

The tests use controlled synchronous callback mutations, not proof of real multithreaded execution, real live cloud RLS, authenticated cross-account privacy, physical iPhone/Android testing, AI clothing category/color recognition accuracy, arbitrary user-photo-to-3D fitting, backside photographic reconstruction, continuous fabric physics, or human 10/10 realism. These require separate independent acceptance.

**Family Alpha: HOLD. Draft research unmerged and undeployed.**
