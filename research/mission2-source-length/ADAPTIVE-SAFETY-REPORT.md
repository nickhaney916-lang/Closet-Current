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


## P2-C9 — Opt-in 24 mm depth-only research candidates (NOT photo-truth)

Following PR #863's **actual new body-contact refusal** and PR #867's source-face-locality measurements, this research branch adds an explicit, **non-shipping optional** depth-clearance trial without assuming photographs encode unobserved depth.

- The original fitted length trial still tests four source-proportional length scales `1, .75, .5, .25` at **zero extra clearance**, exactly as before. Production, staging, normal native research preview, and original private saved wardrobe remain unchanged.
- Only an independent explicit `experimentalDepthTrial:true` research call can examine up to six additional stages: scales `.25` or `.5` × inferred outward *depth-only* offsets `8, 16, 24 mm`. All XY projected source-proportion coordinates are identical to the matching zero-clearance stage, while Z is displaced smoothly to the front or rear according to signed depth from the verified anatomical center.
- The signed depth correction uses `Math.tanh((z-center)/.035)`, smoothly vanishing near the midplane. No vertical hem dimension, original JPEG, owner/source SHA, source panel, UV evidence or 163-bone skin weight is changed by the optional clearance itself. It is **not** a physical garment measurement or evidence of a photographed back surface.
- Every trial is an *immutable* source-geometry candidate and must pass the exact existing 163-bone coarse body mesh-pair check, original stable-face body triangle comparison, distinct garment-panel contact comparison, changed-source-face self-contact delta, minimum source-length extension and source owner gates. Candidates can be refused with the unchanged original-photo/2D fallback. A trial is **never an override to accept unsafe 3D**.
- The opt-in diagnostic contains fixed reason strings and aggregate mesh/height counts only, plus the bounded depth parameter. It never emits original JPEG bytes, owner ID, source hash or private geometry coordinates.

**Current engineering status:** The branch contains code and synthetic actual THREE/skinned regression tests proving projected XY invariance and fail-closed gating. It is **not currently enabled for the native signed-outfit workflow**, because exact PR #867 location receipts and physical device/human visual QA are pending. Do not interpret the optional depth experiment as repaired body clearance or complete Mission 2.

**Release:** FAMILY ALPHA HOLD #255, DRAFT/UNMERGED/UNDEPLOYED. Never merge or deploy without independent owner authorization.


## P2-C11 — Exact original-face garment self-fold locality (no geometry weakening)

**Measured P2-C10 starting point:** [NO DEPLOY Actions #43101427189](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43101427189), exact PR #870 HEAD `8dc5cf498914d69fc6fe317a79e9ad308a36f94c`, passed 5/5 jobs; Chromium and WebKit screenshot artifacts recovered and their signed private-outfit receipts inspected. At 320/390/430 CSS px, the zero-depth 0.25-scale extension made **108 NEW body contacts** in the main garment bottom quartile, while all six opt-in 8/16/24mm depth trials at scales 0.25 and 0.5 had **zero NEW body contacts but still failed the NEW INTRAPANEL garment self-contact gate**. No fit admitted.

**P2-C11 implementation:** Add a bounded research-only aggregation of the exact original garment source-face pair keys returned by the completed **changed-face self-collision delta**. For each *newly intersecting* pair in a genuine staged 163-bone pose, take each source triangle's posed Y centroid, place it in one of four height bands from the garment's bottom to top, and increment an unordered **band-pair** counter. Ten bins correspond to `00,01,02,03,11,12,13,22,23,33`. Also count by garment mesh index and by vertical band distance (0–3). All sums reconcile exactly to the independent self-delta evidence. Validate canonical and in-bounds face IDs, uniqueness, skinned source, finite staged coordinates, complete evidence and 40,000 max new source-pair budget. The report explicitly states it does not establish signed physical penetration, layer simulation, accurate mask or cloth drape.

**No sensitive evidence exported:** Public research diagnostic contains only integer counts, fixed safety reason tags, non-sensitive scale/depth trial settings and `heightPairOrder`; never source face IDs, coordinate data, wearer images, JPEGs, source SHA or owner/session identity. Original signed outfit/photo 2D fallback remains fail-closed. The **existing collision gate is unchanged and mandatory**. Regression and genuine mobile-browser tests verify all integer sums and prevent unsafe 3D promotion; 390px no-artifact CI job names include aggregated new self-fold counts and ten final trial height-pair bins for inspection when GitHub screenshot upload is unavailable.

**Unresolved:** This stage *localizes* rather than corrects the self-fold problem. A later source-anatomy and seam/fabric correction must be bounded and reverified against the entire body, panel, self and owner gates. Family Alpha HOLD #255; draft, unmerged, undeployed. No physical iPhone/Android acceptance or 10/10 photographic realism.

### P2-C11 exact final-head CI

Pending dedicated NO DEPLOY 3D-source-length regression, actual Chromium/WebKit native signed outfit and screenshot checks. Never equate a zero body-contact count with physically valid fabric.


## P2-C12 — Hem-weighted inferred depth correction research

**Evidence used:** [PR #873 exact-head successful NO DEPLOY run #43103526454](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43103526454), 5/5 jobs and independently recovered Chromium/WebKit artifacts at 320/390/430 widths. The true signed outfit has **0 new body contacts** at 8mm outward depth (both .25 and .5 length scales) but **3 new self-contact pairs** in garment mesh 0, predominantly second garment-height quartile. At 16mm, there are 7 new self pairs; at 24mm, 9. This is actual original source-triangle identity evidence; old signed penetration/whole-garment physical clearance remains unknown.

**New isolated experiment:** Preserve the existing four no-clearance and six fixed-clearance source-photo trial stages exactly, then add ONLY inside explicit research-opt-in `experimentalDepthTrial:true` six 8mm *hem-weighted* depth stages (.25 and .5 photographed length scales × decay exponents 2, 3, 4). Define inferred outward depth as `8mm * lowerHemWeight^depthEasingExponent * centralTorsoWeight * tanh(originalDepthFromAnatomicalCenter/35mm)`. The standard exponent is 1, recovering the original PR #870 geometry exactly. Exponents >1 retain the original 8mm outward adjustment near the lowest hem while attenuating outward shift progressively higher up the main garment, where observed self contacts cluster. **Never modify source-projected X/Y coordinates with the taper.**

All staged proposed coordinates are immutable until the full existing 163-bone original-body triangle and coarse body-mesh checks, separate garment-panel triangle contacts, changed-original-face self-fold delta, original JPEG/owner/source proof and minimum length bound are successful. The native research donor records the actual bounded exponent, explicit not-photographed depth and signed-source/fallback receipt, but normal consumer app and production are not touched. Real Chromium/WebKit signed-outfit test validates 16 stages, strict contact vetoes, preserved private saved board and original-photo fallback, and only anonymous integer fold/mesh height counts.

**Not a proof of success:** Some or all six tapered candidates may still introduce self/body intersection or poor visual fabric. Existing baseline contacts are not eliminated or measured with signed depth. No multiple pose sweeps, authentic cloth physics, independently human-approved mask, real owner-photo garment breadth or 10/10 photorealism certification. Family Alpha HOLD #255, DRAFT/UNMERGED/UNDEPLOYED.

### Exact P2-C12 CI evidence

Pending exact-head Node/full-browser test and artifact verification. No native 3D acceptance or physical fitting claim until true safety evidence is complete.


## P2-C13 — New self-contact geometry type and disconnected seam diagnostics

**Measured parent:** P2-C12 [GitHub Actions #43105558092](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43105558092) at exact draft PR #874 HEAD `63500624fbe2deca84ba92a84ac3b52d86b01066`, 5/5 successful, original photo and real Chromium/WebKit 320/390/430 screenshots. Explicit research hem-depth taper factors 2, 3, 4 kept 0 *new* body contacts but increased 8 mm outward-depth self-folds from 3 to 27/26/27 new within-shell face intersections, both tested length scales, all engines and widths. **No** signed native 3D scene admitted; original photo/2D fallback retained. Do not promote that taper.

**New engineering diagnostic:** The completed changed-source-face self-contact delta yields exact original face-pair keys for newly intersecting triangles. P2-C13 uses the *original and staged posed 163-bone geometry* behind each key to count (a) triangles whose **three-dimensional signed distances strictly straddle both opposing triangle planes**; (b) very nearly coplanar overlapping/touching triangles; (c) contacts near an edge/vertex or intersecting at a boundary with no strict two-sided plane straddle; and (d) degenerate triangles. This is only a geometry **classification**, never signed tissue/fabric penetration clearance.

The same source face pairs are checked for geometrically coincident *corner positions* (0/1/2/3 matched corners) in the ORIGINAL source pose and the PROPOSED pose, independently of mesh index adjacency. Original duplicated source seam edges (two coincident corners but separate vertex indices) are **topological evidence**, NOT an approved seam or a safe-contact exception. A new contact in any class continues to be **vetoed** by the existing unmodified body/garment-part/self-contact checks.

The comparator reconstructs before and after poses from unchanged source geometry, requires genuine 163-bone skinned source, finite complete staged arrays, canonical nonduplicated original source face-pair IDs, a complete bounded delta, max 4,096 typed NEW pairs, and exact category-count totals. Only anonymous integer aggregates, labels and 10 micrometre geometry tolerance are exported to the disposable research browser/CI, never original owner photos, JPEG bytes, source SHA, garment vertices, face keys, tokens or identities. The same three-width real Chromium/WebKit signed-outfit original-photo fallback and full Node regression remain mandatory.

**Next action after verified numbers:** If most new contacts are true two-sided intersections, investigate panel fold geometry and source edge preservation. If many are near-coplanar/disconnected UV-edge contacts, independently verify sewn topology and *still* repair the geometry; never whitelist contacts based only on a proximity label. Neither class proves visible photorealism, physical signed depth, stable moving 3D bodies, reconstructed photo backs or independent human masking. Family Alpha HOLD #255 remains; **draft, unmerged, undeployed**.

### Exact P2-C13 acceptance

Pending final-head no-deploy full Node + 320/390/430 Chromium/WebKit tests, screenshot SHA and contact-type receipts. No false release claim.


## P2-C14 — Original versus staged tiny-triangle area provenance

**Grounded P2-C13 evidence:** Exact [GitHub Actions #43115404696](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43115404696) at PR #875 HEAD `6dc05333bac6965d3eb450bab4ef104811dfc9ab` **6/6 jobs PASS**. Actual Chromium and WebKit 320/390/430 genuine owner source screenshots and signed outfit research receipts independently retrieved (artifacts Chromium #13897944116, WebKit #13898547053). At 8 mm source depth with 0.25 photographed length, 3 NEW self contacts classify as 2 near-zero-area triangles and 1 coplanar contact. At 8 mm tapered hem depth (power 2/3/4), 26/26/26 of 27/26/27 NEW self contact pairs classify as tiny posed triangles for 0.25x length, and 24/24/24 for 0.5x. None of those taper contacts has ANY geometrically coincident original source corners. At stronger 24 mm flat clearance one actual strict two-sided triangle-plane crossing also appears. The interface correctly refuses ALL signed native 3D proposals and retains original owner JPEG/2D saved outfit.

**Unresolved question:** Are the small triangles already present in the user-photo-derived/owner-mask geometry, or produced by its current anatomical lower-hem deformation? The P2-C13 diagnostic classified *proposed* contact types but did not prove their original versus staged source-face area history. Interpreting a near-zero face as a safe seam or as a harmless overlap would be incorrect.

**New diagnostic:** Reconstruct original and staged 163-bone posed triangles for each previously verified exact original-face NEW self-contact pair. For each pair, categorize whether at least one tiny face was present **before and after**, became tiny **only after**, recovered from tiny after deformation, or both original and staged triangles remain regular. Independently count **unique involved original source face identities** rather than double-counting the same face across many contact pairs, with the same categorical area provenance. Use the already pinned squared cross-product area cutoff `1e-10` square-meters-to-the-fourth as a diagnostic threshold; this is not physical garment thickness, signed penetration or a source-image-pixel-resolution accuracy guarantee.

**Safety and privacy:** Outputs are integer counts and one fixed threshold only. No original source-face IDs, photo JPEG, vertex coordinates, actual owner profile or account/session references are emitted. Every pair remains an unsafe NEW contact regardless of its original tiny-area status. Retain all original independent body/panel/self-contact gates and fail-closed 2D/photo fallback. Test source nonmutation and synthetic *already tiny* versus *newly collapsed* 163-bone source shapes separately; independently verify signed native saved owner outfit in Chromium/WebKit across 320/390/430 and export count-only CI evidence even if screenshot artifact storage fails.

**Research purpose:** If the majority of already-tiny faces predate fitting, investigate original owner-mask topology generation with sound, photo-grounded triangulation rather than geometry offsets. If they become tiny during fitting, repair the anatomical vertex deformation locally without welding unknown separate seams or weakening contact detection. No photo-accurate clothing/cloth realism or release claim. FAMILY ALPHA HOLD #255, DRAFT/UNMERGED/UNDEPLOYED.

### P2-C14 verification

Pending exact final-head no-deploy full regression and Chromium/WebKit native source photo checks. Never count a diagnostic fix as cloth acceptance.


## P2-C15 — Trace exact source triangulation quality through real anatomy → photograph → owner mask

**Verified parent finding:** Draft [PR #879](https://github.com/nickhaney916-lang/Closet-Current/pull/879) exact HEAD `0166a580f8eb87f42062bb573c21e2a945672372`, [NO DEPLOY GitHub Actions #43117211237](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43117211237) 7/7 success, Chromium/WebKit actual genuine photo/private outfit three widths and both humanoids; screenshot evidence preserved. Tiny faces involved in NEW lower-garment self-contact pairs were already tiny in the **pre-source-length P62/P190 fitted skinned garment**; none became newly tiny in those length/depth trials. The precise upstream stage of their creation was **not yet known**.

**New research work:** Take three exact canonical source-face snapshots of the unmodified private source-identified 163-bone blouse shell and its LEFT/RIGHT separately skinned shoulder caps from the genuine disposable research donor. At checkpoint 1, immediately before `fitReviewedUpperPhoto62(..., {naturalShoulder185:true})`, count posed triangle areas after anatomical build/rigging; checkpoint 2 immediately after the photographic shoulder/hem silhouette fit; checkpoint 3 immediately after `fitOwnerAlphaToSkinnedBlouse190` and its real registered P195 bilateral owner contour. All three share **unchanged exact source face identities** (same mesh object, face count and every triangle vertex index) and measure `|cross(b-a,c-a)|² < 1e-10` in the same real posed world frame. Pairwise comparisons count *new* and *recovered* tiny source triangles during P62 and P190 independently, by garment shell and both caps, rather than simply observing the final total.

Snapshots contain original source-face indices and a per-face flag solely **inside the disposable donor runtime**; they are never serialized, logged, sent to CI, or persisted. A separate **counts-only** report exposes the source-face totals, per-part small-face counts, new/recovered stage transitions and explicit honesty/safety status. Invalid 163-bone faces, changed topology, malformed mesh identities or inconsistent counts cause a fail-closed test. No mask, photo pixel, JPEG hash, owner ID, garment coordinates, session or new persistence fields are exported.

The disposable donor stage capture is opt-in only with `photoSourceStageAudit=research`; the native signed-outfit Chromium/WebKit test enables that ONLY in its no-deploy research depth comparison and enforces one report, three stages and all independent aggregate identities at 320/390/430. Existing owner photo/2D fallback, full body/part/self contact gates, unphotographed rear disclosure and lack of physical/visual certification are **unchanged**. All of this diagnoses the source problem; it does **not** repair degenerate source triangles or certify 3D fabric.

**Decision after evidence:** If tiny faces exist before P62, prioritize canonical anatomical donor triangulation/skin binding repair. If they first appear after P62/P185, prioritize photograph silhouette deformation invariants. If they first appear during P190/P195, prioritize private owner mask bilateral contour deformation and seams. Never weld/retriangulate an unverified photographic panel or whitelist tiny-face contacts without independent geometric/visual proof.

### P2-C15 exact-head verification

Pending full Node and real Chromium/WebKit native source stage evidence with SHA screenshots, no deployment. Family Alpha HOLD #255 remains DRAFT/UNMERGED/UNDEPLOYED.


## P2-C16 — non-mutating staged deformation blend feasibility (diagnostic only)

**Exact verified parent:** [P2-C15 PR #882](https://github.com/nickhaney916-lang/Closet-Current/pull/882) HEAD `023f8686d13c90cbef55a244d29c88ca06140e63`, dedicated [NO DEPLOY Actions #43129570563](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43129570563), **8/8 jobs successful**. The actual original-licensed-blouse signed saved-outfit Chromium and WebKit native browser stage receipt reports **1,395 tiny source faces at the anatomical stage, 1,430 after P62/P185 photographed-silhouette fitting, and 1,439 after P190/P195 owner-alpha contour fitting** at 390px. There are **45 newly small original faces at P62** (net +35) and **16 newly small at P190** (net +9); some different source faces recover. This strongly indicates the *largest observed tiny-face population is upstream of both photo fits*. It is not evidence of physical clearance, inferred rear truth or full cloth fidelity.

**New experiment:** For the same genuine 163-bone fixed pose and unchanged original face indices, retain the three posed vertex snapshots *transiently and privately* inside the disposable donor and calculate original-triangle area for strictly non-mutating virtual interpolations 0%, 25%, 50%, 75%, 100% between anatomical→photo, then photo→owner stage. Count all small faces, newly small faces and recovered faces separately at each fraction using the existing `cross² < 1e-10` diagnostic threshold. Preserve the exact 0/100% stage counts, strict identity checks, finite indexed triangle bounds, count reconciliation, and an explicit source-face work cap. Also cover the counterexample where **both** endpoint shapes have valid triangle area yet **the middle blend collapses**, proving endpoint-only heuristics are unsound.

Only these five fractions and **anonymous count totals** may leave transient research memory. Original positioned 3D vertices, original face IDs, original JPEGs, owner identifiers, silhouette pixels, original source SHA and session/cloud data are never placed in the returned report. Never persist or display a sampled partial fit, reinterpret a blend as independently photographed shape, or remove any pre-existing body/part/self-contact veto. Native 320/390/430 Chromium/WebKit original-photo fallback, screenshot hashes and 163-bone regression must pass before claiming verified new counts.

**What remains:** This identifies whether a conservative deformation reduction may be geometrically useful; **it does not actually change or repair garment topology, fit, drape, the 1,395 preexisting tiny source faces, or rear fabric**. Any future adjustment needs independent source-photo likeness measurements plus full body/panel/self collisions and pose/physical-device tests. Family Alpha HOLD #255, draft/unmerged/undeployed.

### P2-C16 exact-head verification

Pending dedicated final HEAD no-deploy CI. No passing test count or garment 3D admission is claimed for this new branch until GitHub Actions completes.


## P2-C17 — Original canonical triangle versus real 163-bone world-pose area provenance

**Verified parent:** isolated [P2-C16 PR #887](https://github.com/nickhaney916-lang/Closet-Current/pull/887), exact HEAD `84ea0bc52ddaf8512022e485317b04028565cfb1`, [no-deploy Actions #43142745962](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43142745962), all **8/8 successful**. Full Node regression **1,544/1,544** passing, both genuine Chromium and WebKit native signed original-photo privacy and 3D refusal browser tests. Source blend diagnostic newly small faces at 0/25/50/75/100%: P62 Chromium [0,11,17,37,45], WebKit [0,11,17,38,45]; P190 both [0,5,8,13,16]. This does not repair a single face, and the 75% cross-engine difference remains threshold-sensitive.

**Reason for this next step:** The genuinely sampled licensed blouse already has **1,395 near-zero-area original source faces in the posed anatomical stage, before either photo/owner contour fitting step**. This is significantly greater than the 45 and 16 *new* small faces in later fits, and means reduction of photo-mask displacement alone cannot demonstrate geometry quality. Those baseline tiny faces may be intentional narrow geometry, near-coincident source vertices, mesh-triangulation defects, or artifacts introduced by skinning/world transforms; a small posed area alone cannot distinguish these possibilities.

**P2-C17 non-mutating investigation:** For each exact canonical indexed or nonindexed source triangle in the original 163-bone blouse shell plus all independently skinned left/right shoulder caps, measure **both** source-local original triangle area and actual world-posed triangle area at each pre-photo/P62/P190 stage. Retain transient private flags for tiny source-local faces, exact repeated triangle vertex indices, and corners with coincident source-local XYZ. Reconcile the pre-photo source-local area count versus the corresponding world-pose area count into mutually exclusive **local-only**, **posed-only** and **both** categories; include per-original-mesh aggregate counts. Also count local small triangles after P62 and P190 without changing existing photographic fit. The squared cross-product area threshold is fixed at `1e-10`, as before.

**Attribution caveat:** `posed-only` includes a real 163-bone skeletal deformation **and all mesh/world transforms**, including scaling. It is not a proof of an incorrect bone weight or of a defect in sewn fabric; exact coincident corners may belong to intended UV or sewing seams. Every source triangle remains unchanged. No repaired mesh, altered rig, welding, automatic contact waiver, approved 3D, or physical depth inference follows from any count. The actual collision gate (body, separate parts, changed-face self) and honest owner-photo/2D fallback remain mandatory.

**Privacy and verification:** All indices, source vertex XYZ, local/posed flags, private images/identity/hashes and per-triangle positions remain *transient in a disposable donor*. Only anonymous integer totals and fixed non-certification flags reach the browser CI report. New regressions construct actual 163-bone skinned triangles that are regular in mesh-local space but tiny after world scaling, and a separately indexed cap with repeated source vertices; they verify source immutability, exact aggregate reconciliation, privacy redaction, and fail-closed forged flags. Genuine Chromium and WebKit 320/390/430 original-owner fixture, SHA screenshots and the exact final-head no-deploy suite are required before calling it verified.

**Pending real values:** Do not infer which of the original 1,395 triangles are source-local versus world-posed before independent final-head CI results. No physical phones, authentic independent owner masks, physics/drape, complete garment breadth, actual sewn-seam validation, 10/10 visual acceptance, or family-alpha release are approved. Family Alpha HOLD #255; isolated draft, unmerged and undeployed.


## P2-C18 — Source-local tiny-face morphology and indexed topology triage

**Verified parent:** [P2-C17 draft PR #889](https://github.com/nickhaney916-lang/Closet-Current/pull/889) HEAD 84d9d08c926f9409b66599fb4787904396cf606b, [NO DEPLOY Actions #43145854403](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43145854403), 8/8 jobs successful with 1,545 Node tests plus Chromium and WebKit mobile original-photo source and private outfit fallback. At the licensed-blouse pre-P62 source stage, 2,275 source-local near-zero-area triangles include all 1,395 near-zero posed triangles; none became near-zero only after posing. There were no repeated source triangle vertex indices (though two distinct indices with coincident local XYZ corners occurred). These are diagnoses, not proof of bad triangulation.

**New non-mutating classification:** In the disposable research donor, hold canonical local source vertex coordinates and triangle indices only transiently, alongside existing ephemeral posed evidence, and classify every original triangle by its actual indexed topology and metric geometry. Partition local near-zero faces (squared cross product below 1e-10) into exclusive pointMicro (all edges shorter than 0.1 mm), nearCoincidentEdge (shortest edge shorter than 0.1 mm), thinSliver (equilateral-normalized area ratio below 0.05), and smallButWellShaped (tiny absolute area but not micro/thin). This is diagnostic: tiny but well-shaped garment detail must never automatically be deleted.

For the original torso shell and both genuine shoulder caps, count exact original indexed one-sided boundary faces, more-than-two-sided nonmanifold edges, duplicate canonical source triangle vertex triples, and their overlap with tiny local faces. Split UV vertices and separately sewn cloth panels can appear as boundaries, so indexed boundaries do NOT establish physical sewing or mesh defects. The source rear, normals, UV fidelity, drape, actual garment sewing and all-pose collision remain unverified.

**Safety:** Source XYZ, original face IDs, edge keys, owner photo data and identity remain transient inside the disposable donor. Only anonymous integer counts, thresholds and explicit non-certification flags enter browser/CI. Original fabric geometry, UVs, skin weights, user outfit, photographs, independent body/panel/self collision vetoes and honest 2D original-photo fallback are untouched. Synthetic 163-bone tests cover short edges, microscopic triangles, very thin slivers, normal tiny details, duplicate faces and indexed nonmanifold edges, plus mutation and forged-evidence rejection.

**Next decision:** If real source evidence shows many small but well-shaped details, preserve them. If substantial source-local thin-sliver or near-coincident-edge clusters are internal, investigate a small reversible source geometry repair while preserving actual photo/UV and seam shape, and recheck body/part/self collision with both humanoids and real device/visual acceptance. A diagnosis is not an approved 3D repair. Family Alpha HOLD #255; draft/unmerged/undeployed; no staging, production or cloud mutation.

### P2-C18 exact-head verification

Pending complete exact-final-HEAD no-deploy Node and real Chromium/WebKit 320/390/430 source-photo privacy, SHA screenshots, and count-only native morphology output. Do not claim passing values until verified.


## P2-C19 — Link new photographed garment self-intersections to source-local face type

**Verified parent:** [PR #893](https://github.com/nickhaney916-lang/Closet-Current/pull/893), HEAD 6dfdd79b957ddca4c751ee13e06c45a8347d9b07, [exact-head no-deploy Actions #43149732604](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43149732604) 8/8 success, 1,546/1,546 Node tests, actual Chromium/WebKit 320/390/430 and 44 SHA screenshots plus 36 pixel comparisons per browser. In the original licensed blouse, among 2,275 source-local tiny faces, 2,170 are small but well-shaped, 95 are thin slivers, 10 have near-coincident edges and 0 are point micro. Of the tiny faces 2,261 touch indexed source boundaries, only 14 are purely interior. No unsafe 3D fit was admitted; original photo/2D fallback remained protected.

**Why another step:** Tiny-area alone demonstrably mislabels the majority of original source triangles. To prioritize actual geometry defects without damaging legitimate seams, only evaluate the original source-face IDs *directly involved in exact new self-contact pairs* after an immutable proposed length/depth trial. Those IDs were already independently established by the unchanged 163-bone changed-face contact gate; no candidate is accepted or waived on shape labels.

**New experiment:** For each deduplicated source face in a real NEW within-panel contact, classify source-*local* triangle morphology against the actual P62/P185 + P190/P195 **owner-aligned pre-length/depth garment**: not-tiny, microscopic, short-edge, thin-sliver or tiny-but-well-shaped at the same P2-C18 metric thresholds. Independently classify original indexed one-sided boundary versus interior status, including nonmanifold edge overlap, and count unique affected faces by source mesh. Count every distinct original face once across pairs. Reconcile all shape and boundary totals to the previous proven unique original-face contact witness. Unchanged source faces without new contacts are not implicated and are not modified.

**Critical source-stage distinction:** This receipt is measured *after* photographed silhouette and owner-alpha fitting. It is NOT the pristine anatomical source from P2-C18 and cannot prove that a tiny/sliver face was created in anatomy versus P62/P190. Indexed boundaries do not prove an actual sewn seam. Original photo/2D cutout and private owner evidence still have synthetic-review limitations. All original source IDs, vertex XYZ, face-to-contact association, owner image/hash/token and wardrobe fields remain inside disposable donor memory. Only anonymous integer counts and explicit no-certification flags leave the donor.

**Nonclaims / gate:** The actual pictured fabric, all local source positions, original face IDs, owner session, UVs, skin weights, existing body/panel/self collision veto and original-photo 2D fallback remain UNCHANGED. This provides a narrow source repair shortlist for later reversible geometry experiments, not repaired fabric, independent sewn topology, actual cloth physics, real phone or human visual acceptance. No merge, deploy, production/staging/cloud modification or family pilot. Family Alpha HOLD #255.

### P2-C19 exact-head verification

Pending isolated no-deploy real Chromium/WebKit 320/390/430, full Node regression, source privacy counts and screenshot SHA on this exact final HEAD. Do not claim that new geometry or fit passed.
