# SNAPSHOT51 — minimal safe pre-hash garment selection

**Main controller / RESEARCH ONLY / Family Alpha Issue #255 HOLD.** Draft PR stacked on successful [HINT50 PR #608](https://github.com/nickhaney916-lang/Closet-Current/pull/608), exact SHA `9dfe4e5308080a9aba0ed94196b71e8360fc3c81`. NEVER merge/deploy or alter production, existing staging, any other app, Supabase schema, model weight, or image inference.

## Concrete defect and scope

HINT50 filtered an untrusted `piece.hint` but the selected-piece snapshot still used `structuredClone({...piece, hint:clean})`, cloning **every other unknown key** before the original JPEG hash and owner-private database save. A stale browser review or worker payload carrying a large raw segmentation tensor, duplicate photo, secret-like diagnostics, callback/function or other unrelated object could trigger an avoidable cloning/memory failure or unnecessarily keep raw metadata alive in the save transaction. Even though `verifiedRecord24` eventually writes only known garment columns, filtering after an expensive clone is too late.

`minimalPieceSnapshot51` now selects only the exact fields consumed by `verifiedRecord24`, `verifiedModelPieces49`, and the authenticated atomic save: item identity, reviewed JPEG crop, four crop-bound scalars, human confirmation/category/type/color/name, manual-review flag, sanitized SegFormer hint, literal boolean mask flag, and bounded FashionCLIP suggestion. Unknown raw worker/DOM/customer diagnostics are never copied.

For AI receipts, retain the **INPUT49 fail-closed rule**: if an original model suggestion supplied a malformed or stale source/crop binding, the entire model suggestion is omitted. An invalid present receipt must **not** be laundered into an unbound/legacy valid model claim just because model metadata was pre-sanitized. Legacy proposals with no supplied receipt remain explicitly unbound, not invented or claimed source-verified. A true source/crop SHA receipt survives and still gets independently compared against actual JPEG bytes after the selection snapshot.

## Acceptance and limits

Six new genuine SHA-pinned archived JPEG + fake IndexedDB tests exercise unknown uncloneable worker callbacks, huge binary tensors, copied photos, fake account fields, nested unsafe AI data, correctly bound receipts, forged/stale receipts, same-owner async mutation, a separate owner's empty closet, and all-or-nothing wrong-subtype rejection. Inherit the full repository Node suite, real app build, six Chromium/WebKit 320/390/430 research SegFormer-synthetic-hostile-hint browser checks with screenshot SHA audits, final 6 genuine FashionCLIP original+crop → reviewed clothing → owner-private IndexedDB/outfit/V4 backup/restore browser cases and archived screenshot audits, all in a dedicated exact-parent SHA / strict source allowlist workflow.

This priority **does not improve garment classification accuracy or segmentation IoU**, does not prove phone-native capture, real hosted signed cloud, independently certified ground truth or model availability on arbitrary networks. [Work #34 / PR #607](https://github.com/nickhaney916-lang/Closet-Current/pull/607) owns genuine classifier improvement. Its fixed prompt ensemble regressed on the provisional 13-garment locked set and is NOT authorized for integration. Family Alpha remains HOLD.
