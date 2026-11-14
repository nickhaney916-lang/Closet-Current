# MAIN1054 M30 — Fail-closed original-photo-to-outfit eligibility (HOLD)

**Research only; Family Alpha #255 OPEN/HOLD.** Child of verified P87 [draft #1151](https://github.com/nickhaney916-lang/Closet-Current/pull/1151), exact P87 native-bridge source base `6f6526cc169c3555135f8417aae7eb859ed4d901` / master [#1139](https://github.com/nickhaney916-lang/Closet-Current/pull/1139) unchanged.

## Source-observed problem

The P87 native-reference owner-confirmed catalog crosswalk was correctly rehashing saved original JPEGs before returning a 2D image. Its `snapshot()` nevertheless built selectable wardrobe metadata from the saved human-confirmed category **without consulting whether original bytes passed that rehash**, whether the stored `sourceHashVerified` flag was true, or whether a multi-garment piece had validated cutout pixels and reviewed instance evidence. Thus `item().fallback` could be null while `item().slotIds` and `board().slots` still returned the original item as outfit-eligible. Unresolved P70 shoe-unit groupings could similarly retain valid category slot IDs despite `unit.ownerConfirmed===false`. A genuine native consumer must never infer safe outfit admission from that inconsistency.

## Source correction — strictly on P87 research crosswalk

- For every item, require BOTH an existing `sourceHashVerified===true` receipt and a **fresh byte-for-byte** canonical JPEG SHA256 match against `sourceSHA256` and `originalPhoto.sha256`. An unverified or mismatched original gets no fallback and no outfit slot; its saved row remains in an explicit review bucket.
- Admit a single item as selectable only with an explicit `singleGarmentVerified===true` and no unresolved segmentation/crop/outfit-source identity.
- For a split source, independently rehash the actual `segmentHint.cutoutImage` JPEG bytes; require distinct source/cutout SHA256, unchanged original source, trusted `verified`, `ownerReviewedInstance`, no clipping/foreign owner, and a nonempty `outfitSourceId`. A claimed cutout digest or mask alone cannot authorize an outfit slot. The original JPEG remains the fallback, never an invented crop.
- For P70 paired shoes or fragments, require the existing crosswalk's **two independent same-owner/same-source distinct-mask receipts and owner-approved grouping**. An unapproved grouping cannot inherit the category's slot eligibility.
- Leave previously saved raw decisions, IDs, source identity, cutout identity, pair metadata and search records immutable. An unverified item remains reviewable as `Uncategorized`, rather than deleted, silently merged or saved again. Never promote into consumer 3D.
- Every asynchronous hash still runs inside the original `session/database/revision` read lease, checked after the complete snapshot. Signed owner and host revision source must still be wired by the master runtime: neither this adapter nor the crosswalk substitutes for real native authentication/IDB trust.

## Reproducible acceptance

Four new source-executed Node adversarial test groups verify mismatched original bytes, owner-source unverification, ambiguous shared photo/unsigned cutout, forged/different-source cutout, falsely approved P70 pair, restored verified source, and unchanged owner-source 2D fallback.

Existing P87 native-lease and catalog tests preserve actual item and cutout IDs, confirmed original search, no invented 3D, human field values, dress and layer rules, source/owner/revision races and same-item duplication safety.

The existing genuine CC BY Commons-0053 source JPEG Chromium/WebKit browser runner gains three real-byte assertions: unverified SHA flag revokes outfit selection, forged cutout SHA cannot authorize the slot, and restoring the confirmed single original allows the slot again. This remains synthetic-owner **desktop browser emulation**, not physical phone or hosted cloud testing.

Dedicated no-deploy workflow `.github/workflows/main1054-crosswalk-outfit-gate30-no-deploy.yml` checks exact parent ancestry and five-path-only scope, builds, runs complete inherited Node tests, and executes Chromium/WebKit licensed-source browser checks. **Record exact-head CI results only after completed runs.** 

## Release and integration blockers

- This is an isolated **research adapter**, not wired to the live native signed account, IDB revision publisher or owner review receipt conversion. Consumer `public/` and hosted Supabase are unchanged.
- No independent blind recognition accuracy, physical Android/iPhone, hosted four-account RLS, realistic 3D, continuous garment collision or release acceptance. Do not claim a complete end-to-end trial.
- Master integrator must choose an authoritative exact signed auth object / private DB ref / mutation+restore revision, then test permission and original-photo appearance across concurrent asynchronous owner/save/restore operations. Keep source-original 2D as the only owner fallback until true 3D is separately certified.

**DRAFT / NO MERGE / NO DEPLOY / no private owner data. HOLD #255 remains OPEN.**
