# CATEGORY-SUBTYPE-COMMIT-43 — final owner-private garment taxonomy and color validity

**Main controller research-only, DRAFT and HOLD. Never merge/deploy; no production, staging, customer data, or external writes. Family Alpha issue #255 HOLD.**

## Verified exact parent

[PR #598](https://github.com/nickhaney916-lang/Closet-Current/pull/598), SHA `cdffcba36c204657e39065a6e6e43cfd1a1c120d`, exact-HEAD [GitHub Actions #41932135190](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41932135190) SUCCESS: 565/565 Node tests, 24 Chromium/WebKit browser regression scenarios, 18 new source SHA-audited synthetic screenshots.

**Ownership:** Parallel #27 owns automatic segmentation; Work #31 owns recognition accuracy; Parallel #32 owns independent accuracy evaluation; Work #33 owns actual model-to-review-to-closet integration; Parallel #30 owns signed cloud E2E. #43 owns only the category/subtype and color **atomic persistence invariant** to protect any present or future adapter. No overlap in model development.

## Actual code defect

The real native review UI checked `canConfirmScene32(piece,schema)`: category must exist and `schema.types[category]` must include the selected specific subtype. But the last `verifiedRecord24` helper, called by owner-private `atomicSaveGarments24`, validated only a supported broad category and *nonempty*, non-`Unknown` `itemType`. A stale programmatic result `{category:'Shoes',itemType:'T-shirt',confirmed:true}` was accepted and stored even though `normalizeClothing` would set itemType to `Unknown` on reopen, silently losing user-approved specificity. It also accepted arbitrary truthy color values such as numeric 12, whitespace or case-varied `unknown`, misleadingly labeling them `colorSource:'user'`.

## Minimal fix

- Added research-only pinned `commit-taxonomy-43.mjs` mirror of exact five supported reviewed categories and subtype lists from `public/taxonomy.js`. The independent Node contract enumerates every subtype and fails CI if app taxonomy drifts. This mirror cannot be overridden by a model-supplied UI schema. No production taxonomy or model changed.
- `verifiedRecord24` **fails closed** on mismatched, nonexistent, case-changed or unsupported subtypes; checks color is a nonempty, trimmed, at-most-120-character string not `Unknown` regardless of capitalization. Still permits **free-form human-confirmed colors** like Navy, Charcoal, Dark teal, Blue / White. Trims only outer whitespace, does not guess color accuracy. Does not change proven `originalPhoto`, owner ID, source SHA, atomic IDB duplicate/CAS transaction, source snapshots, or 3D readiness.
- The record is rejected **before any IndexedDB write**; a two-item batch containing one valid and one malformed item writes neither. Previously saved records remain untouched.

## Engineering acceptance

1. Full app build and all inherited Node tests plus new exact taxonomy/crop/source/owner/IDB atomic validations.
2. Native two-browser test, real Chromium/WebKit × 320/390/430 (6 separate cases). Original generated JPEG SHA checked by WebCrypto, actual review page human-confirmation, real owner-private IndexedDB write, then a genuine direct atomic mixed valid+wrong-subtype save attempt. Verify no new records and original saved valid T-shirt remains intact.
3. Twelve SHA-256 audited genuine screenshots (before commit / after honest persisted-save receipt), dimensions and pixel variation; zero network writes or hosted accounts.
4. Inherited #34 source-epoch, #34 save-finality, #38 worker-finality and #41 color authority browser suites remain passing. Dedicated CI pins parent SHA and changed paths, no deploy.

**Limits:** Synthetic source browser photos, simulated segmentation worker; no new real SegFormer/FashionCLIP category precision, physical phone, hosted signed browser-cloud, independent primary-color accuracy or genuine human annotations. Passing the persistence contract is engineering PASS only, not a scientific classifier-quality PASS. Family Alpha HOLD until separate scientific evidence and hardware acceptance.
