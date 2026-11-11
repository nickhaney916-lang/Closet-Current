# Mission 2 — Contact-constrained source-proportion 3D and original-photo fallback

**FAMILY ALPHA HOLD #255 — research-only isolated draft; no merge/deployment or hosted/staging/private data changes.**

## Evidence-led problem

**P2-C4 correction supersedes earlier numerical novelty claims:** PR843/847 reported 845/728 Chromium and 849/735 WebKit newly intersecting body/garment triangle pairs, but the pinned three-mesh-bvh@0.9.2 passes *indirect BVH traversal offsets* into intersectsTriangles. Those early audits treated offsets as invariant original triangle IDs even though BVH rebuilding can reorder them. Those **NEW-contact counts cannot be used as physical-penetration evidence** until rerun with resolveTriangleIndex on both body and garment. Sampled acceptance must be re-evaluated under the corrected audit. This does not certify absence of physical intersections or natural drape.

A full-length source-proportion extension is therefore **not** automatically eligible for 3D merely because it looks longer and has no net increase in aggregate intersection totals.

## Engineering correction

- The existing `fitSourceLength` can dry-run an exact world-space skinned mesh candidate without mutating positions, panel projection, original JPEG, alpha, weights or owner metadata. Bounded scales of 1.0, .75, .5 and .25 preserve the origin and source projection safety; alpha-source and identity checks remain mandatory.
- `planNoNewContactSourceLength` measures actual before/after triangle identities for each staged scale with the independent P843 BVH audit. It selects the **first** candidate with no *new* intersections and at least seven centimeters of evidenced lower hem displacement in the sampled source pose.
- If all candidates create new contacts, `applyNoNewContactSourceLength` refuses the 3D transformation **before any mutation**, with an explicit original-photo/2D fallback error. No unsafe proposed geometry is committed. A dry-run is not a release certificate; existing intersections and hidden rear geometry remain unverified.
- The isolated native donor installs this only under `?photoSourceLength=research&photoSourceTrianglePolicy=adaptive`. The native 3D admission refuses missing or dishonest positive contact receipts and preserves the owner's existing photo-backed builder on 3D rejection.
- Unit tests cover zero-mutation previews, a real skinned obstacle where reducing the extension avoids introduced contacts, and a blocked source where all candidate scales refuse while source arrays, panel attributes, and weights remain byte-identical.
- Dedicated no-deploy browser jobs also exercise the native signed-fixture original JPEG and saved outfit, accept 3D **only** on actual zero-new-contact receipts, otherwise require an explicit photo-backed fallback without account switching, wardrobe mutation or fabricated garment imagery.

## Certification boundary

This does **not** solve all collisions. A zero-new-intersection candidate can still have existing penetrations; swept poses, full self/layer collision, internal containment, physics, source rear fabric, natural real material drape and independent human-perceived realism remain unresolved. The current photographed source is one licensed test garment with owner-asserted/synthetic mask and simulated auth. Actual physical Android/iPhone camera/GPU/memory acceptance, multi-category 3D construction, original-human independent ground truth and multi-owner hosted approval remain required.

No claim of full Mission 2 completion or Family Alpha release readiness.

## Verification

**Pending final exact-head Actions CI.** Only verified passing commands/artifacts and sampled outcome counts may be added after the run completes.


## P2-C3 — independently tested garment-part intersection gate (research branch)

**New engineering target:** The previous sampled-pose body/garment audit did not detect a sleeve cap crossing the torso panel when both are part of the same photographed garment. A new bounded exact-triangle BVH audit now compares pairs of *distinct* skinned garment meshes, preserving stable triangle-pair IDs. This is separate from the existing 163-bone body collision audit. It adds a fail-closed decision rule: an adaptive candidate must create zero new body contacts **and** zero new contacts between separate garment parts before any geometry or original-photo presentation is modified.

- Dry-run candidate stages remain unchanged; they also measure before/after garment-part contact receipts. The final commit remeasures both classes before changing a vertex.
- The signed-fixture native donor passes both original body-triangle and garment-part-triangle receipts, and 3D admission requires each verified zero-new-contact value. Any rejected candidate preserves the user's saved photo-backed 2D outfit and owner identity.
- A new real 163-bone skinned-triangle test has an existing panel seam and a second proposed triangle crossing that seam. It proves the newly crossing panel pair is visible to the new audit while original mesh data remains unchanged. Adaptive tests additionally assert the no-new-part-contact decision.
- Bounded enumeration and malformed/foreign geometry inputs fail closed. Test execution and actual browser results for this branch must be confirmed from its **exact final commit** before claiming successful verification.

**Nonclaims:** This is only contact *nonregression* between distinct garment pieces at one sampled pose. It does not detect self-intersection within a single mesh, inter-layer garments not included in the current target set, enclosed/hidden body penetration without triangle crossing, moving-pose swept collisions, actual cloth gravity, physically real sewn seams, rear detail, or full photorealism. A present intersection may remain; it is not considered certified. Physical Android Chrome/iPhone Safari, independently annotated multi-category real photographs and human visual acceptance remain open; Mission 2 remains incomplete, Family Alpha HOLD #255 unchanged.

## P2-C3 final-head verification

Pending dedicated no-deploy Actions on the complete exact commit. No pass totals have been claimed for this branch.


## P2-C4 — self-crossing triangles within one photographed garment panel

**Research-only extension; not a release gate approval.** P2-C3 compares different skinned meshes such as sleeve and torso, but a single deformed piece of photographed fabric can fold *through itself*. A bounded, world-space 163-bone BVH self-pair audit now compares the true triangles in each individual garment mesh before/after the proposed source extension. Triangle pairs sharing any original topological vertex are excluded because normal mesh seams and shared edges are not evidence of penetration; nonadjacent crossing triangles retain exact stable pair identities. Duplicated cast directions are collapsed.

Adaptive fitting now requires zero NEW body intersections, zero NEW inter-garment-piece intersections, **and zero NEW within-piece self-intersections** before accepting the sampled geometry, followed by independent pre-commit remeasurement of all three classes. The source JPEG, reviewed cutout, UVs, skin weights, saved-outfit slots, private owner state and original-photo/2D fallback remain unchanged on failed proposals. Exhausted enumeration budgets or invalid staged geometry reject, not promote, 3D.

New research regressions construct two actual nonadjacent posed triangles on a 163-bone skinned mesh, move one through the other, verify one newly intersecting pair with byte-unchanged original positions, and verify that a normal indexed two-triangle shared-edge quad does not count as self-contact. Native browser checks require the new independent receipt before accepting opt-in sampled 3D.

**Important limits:** This measures *nonregression*, not absence of pre-existing intrapanel contacts. Split-vertex physically touching seams may count as baseline and motion/rotation sweeps remain entirely unverified. It does not establish complete body containment, inter-layer outfit safety, drape simulation, garment fit quality, owner-reviewed blind masks, or device GPU/OS-kill behavior. Family Alpha #255 remains HOLD, and Mission 2 cannot be called complete until those requirements are actually met.

### P2-C4 verification

Do not claim acceptance without exact-HEAD dedicated no-deploy GitHub Actions full regression and both genuine Chromium/WebKit jobs with independent screenshots.


## P2-C4 correction: topology-stable original triangle IDs

CI found a fail-closed self-audit bug and then a more important audit identity bug. MeshBVH.bvhcast v0.9.2's intersectsTriangles callbacks supply BVH storage offsets even when indirect:true. Self-surface adjacency, before/after source-body comparisons, and distinct garment-panel comparisons now all call each BVH's resolveTriangleIndex(offset) to map to the original geometry's true triangle identities. This prevents spurious newly crossing triangles merely because a staged mesh rebuilt a differently ordered BVH. A dedicated 163-bone regression puts dozens of unrelated triangles around one actual body-crossing triangle, reorders distant triangles, and requires the original contact identities to remain unchanged.

The self-audit also avoids throwing inside the BVH callback on contact/candidate budget exhaustion, because the pinned v0.9.2's module-global traversal guard can remain active after an exception. It returns a normal stop signal and rejects after the traversal guard resets. Invalid or incomplete observations still refuse 3D; original photographic and owner data remain untouched.

Earlier PR843/P847 "new" counts are **superseded and unreliable as physical source novelty**. Corrected counts must be measured from the exact final CI HEAD before replacement claims. Mission 2 remains incomplete; Family Alpha HOLD #255 remains in force.


## P2-C5 — exact-face contact attribution and enum-only native refusal diagnosis

The previous browser release safety proof showed **six of six original-photo fallbacks**, but their screenshot receipts did not distinguish *why* each of the four 3D source-length candidates was rejected. A fallback is a successful privacy protection, but not proof which geometry needs correction.

P2-C5 provides three bounded, research-only diagnostics from the existing actual 163-bone collision audit:

1. **Contact attribution:** count each existing body/garment triangle contact by *garment mesh index* (torso shell, left cap, right cap) and *body mesh index*. The totals must reconcile exactly with the original-face contact-key set. Keys are parsed with hard integer bounds and exact deduplication. The result includes **only aggregate counts and stable scene indices** — no owner IDs, source photo bytes, source face coordinates, private hashes or original fabric imagery. Counting intersecting triangles does not prove signed depth/penetration.
2. **Per-candidate refusal reasons:** map each of four immutable dry-run scales to exactly one or more fixed tags such as `coarse-body-pair-regression`, `new-body-contacts`, `new-panel-contacts`, `new-intrapanel-contacts`, `hem-extension-under-minimum` or `contact-audit-budget`. Missing or nonfinite contact evidence cannot be classified as eligible. No raw exception stack is copied into the candidate decision.
3. **Actual native browser receipts:** if an owner-signed saved outfit cannot be admitted, the research donor propagates one fixed refusal tag through the existing original-photo/2D fallback. The test accepts only a known geometry-related cause; unknown preflight failures must fail research acceptance rather than masquerading as safe collision refusal. Both browser engines record one reason per rejection, plus the verified 320/390/430 source/body distribution.

This does not commit any unsafe 3D fit or automatically solve original body contact. Source photographs and cutout evidence, saved wardrobes, user sessions, live app, hosted Supabase and staging/production are unchanged.

**Acceptance:** exact-head no-deploy full Node suite and genuine Chromium+WebKit 320/390/430 source views, contact distribution count reconciliation and original JPEG/owner/outfit fallback. Historical PR #854 was verified, but **no P2-C5 passing evidence exists until its own final commit is checked**.

**Still open for full Mission 2:** preexisting contact clearance (signed/nonpenetrating), realistic drape and sewing, multi-source independent masks, fitted fabrics on both bodies in multiple poses, photo-rear uncertainty, physical iPhone/Android and full owner authorization. Family Alpha HOLD #255 remains OPEN.


## P2-C6 — unique triangle-pair budget and precise audit exhaustion

**Grounded cause from P2-C5**: The [exact-head 3/3 success, 1,527 Node, 100 SHA browser screenshots](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43043561737) showed all six original-photo fallback attempts were rejected for **`contact-audit-budget`**. That was an incomplete **resource-limited computation**, not independently demonstrated newly intersecting garment geometry. Prior texts that called those six real-browser candidates physically collision-unsafe overstated what was proven.

The independent intrapanel BVH caster compares one immutable staged/skinned garment mesh against two independent BVHs of the same sampled pose. That enumeration visits the same unordered source-triangle pair in both directions. P2-C6 adds a **bounded numerical source-face pair key**, resolves both indirect BVH IDs to original face indices, and skips duplicate candidate pairs *before* the expensive triangle intersection test and before counting the comparison budget. It never skips the first occurrence of a candidate pair. Exact positive crossing tests must still detect the contact and count one unique candidate; the audit still fails closed when it cannot complete.

The one-letter `contact-audit-budget` category was too broad to choose a physical geometry remedy. Research diagnostics now distinguish `body-contact-budget`, `panel-contact-budget`, `self-comparison-budget` and `self-contact-budget`. Each tag is a fixed source/owner-private-safe enum, never raw error stacks or wardrobe data, and must pass actual Chromium/WebKit saved-outfit admission/fallback verification. Body/part absolute surface contact count and existing owner/private source restrictions are preserved.

**Nonclaims:** Better enumeration efficiency does not establish natural cloth physics or collision clearance, and may still fail the measured budget. This is sampled-pose research on one license-pinned photographic garment, not a generic garment-construction model. Any positive 3D candidate remains unapproved until genuine independent visual, human and physical-device tests. All work DRAFT, UNMERGED, UNDEPLOYED. Family Alpha #255 remains HOLD.

### P2-C6 verification

Pending exact final-head dedicated no-deploy Node/full regression and both native Chromium/WebKit jobs; no pass claim until verified.


## P2-C7 — Changed-source-face self-contact delta; exact non-regression without old complete self-contact enumeration

**Evidence-led blocker:** [P2-C6 exact-head 3/3 successful browser+Node](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43045249809) confirmed all six signed-fixture browser adaptive 3D proposals failed `self-contact-budget`. Deduplicating symmetric BVH callbacks did not solve the enumeration limit. The old self audit counted large amounts of unmodified garment contact before even considering the proposed extension.

**P2-C7 implementation:** Compare original source vertex arrays with the staged garment vertex buffer exactly. Mark each *original triangle* sharing any changed source vertex; check ONLY candidate pairs containing at least one changed triangle against the full *staged posed* 163-bone garment BVH. For every triangle pair intersecting in the staged pose, re-test the exact same original source-face pair in the original posed mesh at the *same skeletal pose*. Only intersections absent before are **new**, using stable indirect-BVH source-face IDs. Unchanged/unchanged pairs cannot become newly intersecting in the identical pose, so their old intersections are not required for the nonregression decision.

The full old self-contact enumeration is **deliberately not claimed**. Receipt fields mark `sourceLengthIntrapanelAffectedPairOnly=true`, `sourceLengthIntrapanelFullBaselineEnumerated=false`, and report the number of changed source faces and examined candidates. Its before/after counts refer ONLY to pre-existing intersections *still present among affected staged pairs* versus those plus new intersections; they are not global self-contact counts. Independent body and separate garment-panel contact tests remain mandatory. Original JPEG, original mask, UV/photo projection, 163-bone source skin weights, saved user outfits and account/session data are untouched until all candidate gates pass.

**Fail closed:** Moved-face set, candidate count and new contact count are all bounded. A partially completed traversal cannot admit 3D. Tests verify a newly formed crossing is detected using the original face identity; an unchanged garment skips heavy work; indexed shared-edge topology is not falsely treated as penetration; and a source with hundreds of unchanged self-contacting triangles can still check an unrelated changed face without full old-contact enumeration. The native UI accepts an adaptive sampled 3D preview only with an independently received completed changed-face receipt and positive changed-face count.

**What remains unproved:** This is an exact *new-intersection* comparison in only one skeletal pose. Existing garment self-overlap/body contact and signed physical depth, silhouette realism, natural drape, layers, animation sweeps, multi-category independent photo reconstruction, physical mobile devices and independent visual approval remain unresolved. Family Alpha HOLD #255 remains open. All research is draft and undeployed.

### P2-C7 final verification

Pending dedicated no-deploy GitHub Actions at its exact final HEAD; do not claim browser acceptance based on P2-C6.


## P2-C8 — Source-face locality for the *native signed-outfit* body-contact failure

[PR #863 exact-head verification](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43061935781) established 3/3 CI success, 1,532 Node tests and all six authentic browser simulations reaching the precise `new-body-contacts` refusal after eliminating the prior self-contact enumeration budget problem. The standalone source-length diagnostic still reports zero new body contacts, so that cannot substitute for the saved-outfit admission scene.

This research-only extension now maps the **exact newly intersecting body/garment source-face keys** to the current real 163-bone figure's (a) garment mesh index and (b) four coarse posed-height quartiles, defined from the lowest posed garment vertex to the highest. It independently verifies that all bin totals reconcile to the source-stable before/after contact-key novelty. No geometry vertices, source face IDs, JPEG bytes, user names, closet records, images, photo hashes, shape measurements or skin attributes are included in the displayed counters. The only retained output is aggregate *counts* and fixed decision reason strings. The evidence does **not** measure signed penetration depth.

The original owner-private outfit view remains fail closed; no garment vertex is written when a candidate is refused. The disposable research-donor installer passes exactly one sanitized callback per adaptive fit attempt. Genuine Chromium/WebKit tests validate its counts, screen captures, saved outfit, original JPEG/source identity, four bounded candidate scales and fail-closed 2D fallback. A 390-pixel viewport receipt groups the four trial stages into an independent human-readable locality diagnosis. The goal is to identify which hem/torso/shoulder region demands a physically measured correction rather than blindly applying a clearance offset.

Still not certified: full signed clearance, removal of old body contacts, deformation without new panel/self collisions, true cloth physics and sewn layers, other photo garment categories, multiple poses, real physical phones, independently human-approved masks and natural 10/10 realism. Family Alpha HOLD #255 continues. All files research/test/CI only, DRAFT / UNMERGED / UNDEPLOYED.

### P2-C8 verification

Pending exact final-head dedicated no-deploy build, full Node suite and Chromium/WebKit native browser photo/source privacy checks. **Never claim geometry success based only on an aggregate contact count.**
