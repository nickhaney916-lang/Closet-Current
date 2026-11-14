# MAIN1054 M31 — genuine native PHOTO119 approval → source-verified outfit index receipt

**DRAFT / RESEARCH / NO DEPLOY / #255 HOLD.** Exact parent [M30 #1159](https://github.com/nickhaney916-lang/Closet-Current/pull/1159) head `f7d85adceaf872af053af40a20f12e7833c884f0` with verified [CI #43610303957](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43610303957), 2,635/2,635 Node + Chromium 13/13 + WebKit 13/13. Existing master [#1139](https://github.com/nickhaney916-lang/Closet-Current/pull/1139), P87 #1151 and all donor branches untouched.

## Source-verified gap

The real protected app-build `public/native-reviewed-private-save-167.mjs` (activated by the normal M4 P167 native canonical-photo code) checks the originally captured JPEG SHA, authentic per-item owner correction, and atomic private `items` insert + `state.draft` removal. Previously it persisted `confirmedCategory:true`, `confirmedColor:true`, `userAdjusted:true` and `ownerReviewed:true` but NOT exact `confirmedDetails.category` and `confirmedDetails.itemType`. P87 M30 does not admit a suggestion solely because a broad ownerReviewed bit is set, so an actual reviewed PHOTO119 save could remain indexed as Uncategorized and be excluded from outfit slots even though the valid user confirmation just committed.

## Exact source repair

The existing true PHOTO119 transaction now stores **only** the three exact reviewed fields `confirmedDetails:{category,itemType,color}` together with `confirmedDetailsSource31:{ownerId,itemId,sourceSHA256,basis}`, after existing original JPEG SHA and explicit signed-owner review checks, before one atomic IndexedDB write. It overwrites untrusted draft/model `confirmedDetails` and never copies speculative optional fields. Any subsequent label/type change loses P87 exact-value equality until owner review supplies an updated confirmed field receipt. Original captured JPEG bytes, SHA, owner ID, source segment, user color and existing protected rollback remain unchanged.

P87 `reviewed(record)` now requires the matching exact original-photo/owner/item receipt for records with PHOTO119's existing `reviewProvenance`. Old broad PHOTO119 flags without an M31 receipt stay review-only; existing valid non-PHOTO119 `confirmedDetails` behavior is unchanged. **A persisted receipt is an owner-action metadata claim from a protected local writer, NOT an independent cryptographic signature or blind human label.** No unauthorized data or model predictions may manufacture a preapproved consumer 3D feature.

## Reproducible integration test

`tests/main31-photo119-to-signed-outfit.test.mjs` uses real legally licensed Commons-0053 JPEG bytes, the **actual app-build PHOTO119 commit** and disposable `fake-indexeddb` private `closet-current-user-<owner>` items+state transactions, `createNativeCatalogCrosswalk` from parent P87 M30, original `public/outfit-board-engine.js` normalizer and `preflightOwnedOutfit1054`. It proves an owner-selected Bottoms / Jeans / Blue is saved once, `confirmedDetails` correspond to exact source SHA, original original-photo pixels are unchanged, accepted index and board select same physical saved item ID, source-verified 2D preview only, and the original pending draft is cleared atomically.

Adversarial tests change: missing receipt in a prior PHOTO119 record; post-save subtype editing; foreign owner; mismatched original SHA; receipt item/owner/source/basis forging; same-owner login swapped during a true private read; signed logout. All fail closed without unexpected source publication.

Dedicated NO DEPLOY Actions workflow validates immutable parent ancestry/allowlist, builds the real app, runs focused and full Node tests, real licensed-source P87 Chromium/WebKit browser checks, and the original actual native signed-owner original-photo viewer browser tests (no external Supabase authentication; synthetic auth transport only). It does not touch production, staging, hosted Supabase, private user wardrobes or owner photographs. Only declare source acceptance after completed exact-commit CI.

## Remaining owner-interface blocker

This is a **real saved-item producer → native index/board data-contract integration**, not yet a native UI picker wired to M30 approval for every default saved outfit. New owner-confirmed PHOTO119 records can supply P87 field receipts; older legacy records must receive explicit owner re-review rather than silently be upgraded. The actual future UI needs a **durable revision invalidation source** that changes after edit/delete/revoke/restore (including other tabs) and checks source + board again at publication, and must not silently delete existing unsaved saved looks. M4 2D signed original photo viewer remains 2D-only. Consumer 3D stays disabled pending source-linked geometry, sustained collision and independent human appearance acceptance.

**Physical Android and iPhone, independently labeled recognition, hosted four-account cloud-RLS and Family Alpha v0.1 remain BLOCKED / #255 OPEN HOLD.**
