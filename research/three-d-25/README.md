# Closet Current 3D-25 — one unified anatomical shirt + sleeveless dress prototype (HOLD)

## Why

The main-thread integration [draft PR #428](https://github.com/nickhaney916-lang/Closet-Current/pull/428), tested at `839300de731b9429080141ffd8972949f1ec7176`, already preserves the independent photographed shirt neckline/side-seam refinements from [PR #426](https://github.com/nickhaney916-lang/Closet-Current/pull/426) and physical dress neckline from [PR #427](https://github.com/nickhaney916-lang/Closet-Current/pull/427). [Work Assignment #65 PR #429](https://github.com/nickhaney916-lang/Closet-Current/pull/429), original exact source `b210e6d5b031b0937c51728797684fb46ec77b5a`, independently addresses the source dress's anatomically shaped shoulder caps and sleeveless armholes against the original bone/triangle sections. Its dedicated original-branch CI #40938078908 succeeded. These two separate branches both modify `three-d-15` controller, showroom and demo. Blind merging one could discard the other's real clothing work.

**3D-25 is a deliberately separate, no-deploy integration branch based on #428**, porting only the exact, separately successful anatomical dress module, fixtures, contact and visual tests from #429 and threading its dedicated `dressAnatomy` flag without altering the already verified shirt path, 3D23 physical dress neckline source, 3D22 shirt neckline source, original photos or licensed GLB models. This is working integration code, not a parallel new bodice redesign.

## Behavior and specific dependency safety

- The photographed **shirt + neutral pants** continues through Work63 continuous fit and Work64 `finishNecklineAndSeams`. Neither the shader nor shirt algorithm is edited by this branch.
- The original reviewed **dress** uses `shapePhysicalDressNeckline` and, if enabled, #429 `fitAnatomicalDress` followed by `finishAnatomicalOpenings`: genuinely shaped upper bodice and armholes, source RGB panel coordinates retained, source-neutral 3 mm opening edges, shared original CC0 skeleton.
- All **three research comparison switches** remain exposed on the localhost showroom: `?necklineSeams=before`, `?dressNeckline=before`, and `?dressAnatomy=before`. Each default is on. Crucial safety: because the new anatomical fitter *requires* the source-shaped physical dress neckline, `dressNeckline=before` automatically disables just its dependent anatomical fitting even if `dressAnatomy` remains default-on. It never silently deepens a photographed V trim, crashes the preview, or claims an unsupported pre-neckline armhole. That dependency is explicit in integration tests.
- Original photographed AJ shirt source `commons-0003` and dress `commons-0053`, both SHA-pinned original JPEG and transparent PNG RGB, unchanged. Original CC0 body hashes restored from original immutable archive, not re-pinned to later publisher bytes.
- All four-person Family Alpha permissions, customer accounts, cloud backups, phone tests, and visual acceptance remain separate. Nothing here changes staging or production.

## Exact independent evidence and remaining defects

On their original exact-head branches, #428's dedicated workflow #40934475182 **passed** original shirt and dress combined source/geometry and genuine 160-frame Chromium checks, but the source-shape dress still visually FAILed from rigid shoulders and arms; #429's separate no-deploy CI #40938078908 **passed** original 11 Node geometry/source checks, WebGL anatomical dress examples and contact/QA. Visual grade for #429: **REVIEW** (sleeveless armholes and fitted waist improve shape, yet shallow neckline pattern misregistration, stiff skirt and some negative relaxed-neck oriented probes remain). These original-branch results do **not** automatically certify this integration.

The new 3D-25 no-deploy workflow requires:
1. Strict allowlist of only the source-pinned new 3D24 dress module/fixtures/tests, three existing 3D15 research wiring files, new integration tests, docs and workflow.
2. Exact original licensed Work47 photo/alpha rebuild and immutable original CC0 male/female model recovery.
3. **Both independent source/rig geometry suites and new rollback integration tests**; unreviewed candidate refusal, atomic outfit rollback, original hashes, source body and skinned rig identity, source-RGB texture/skin integrity and no persistence.
4. Independent real browser passes for Work64 original shirt front/side and reviewed neutral pants, and #429 dress actual true armholes from front/three-quarter/side/back, source and relaxed pose, original male and female GLBs at 320/390/430, with actual screenshot artifacts and no outside network.
5. Posed-body original-triangle nearest-contact diagnostics and closeup QA, not a fabricated signed full collision claim.

This branch is an experiment, still **DRAFT/HOLD**. We must not mistake green WebGL, specific triangle probes or screenshot difference counts for garment aesthetic PASS. With source garment photos, baked lighting/stretch, stiff skirt and neck/shoulder intersections, an **owner-reviewed before/after look** is needed before any family test. Last independently scored 15-photo visual benchmark remains 0 PASS / 5 REVIEW / 10 FAIL; it was measured against an earlier pipeline and has not been rerated here.

No merges, deployment, staging/production modification, user photos, model repins, paid inference/token services, or Drive Duel work. Keep parallel Work #65 PR429 unchanged and keep this branch independent.
