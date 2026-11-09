# Parallel #62 — user photo to anatomical 3D clothing

**Assignment:** `USER-PHOTO-TO-ANATOMICAL-3D-END-TO-END-62`

**Base:** Priority #178 / PR #739, `0c36f8510b5dfb2f4b4b372ca3931d1e2c30d040`

**P63 follow-up:** INDEPENDENT-PHOTO-GARMENT-3D-REALISM-63, based on exact P181 7a52c010811b348bb146c7ee4fef4ccbe1594032.

**Disposition:** research only; no merge, deploy, or Family Alpha release.

## Implemented

This increment adds a bounded, source-specific upper-body path for the licensed Commons blouse fixture `commons-0016`. It admits the blouse only when the original JPEG SHA-256 and independently reviewed cutout SHA-256 match the pinned fixture and the cutout profile passes silhouette checks. The profile derives normalized image-space silhouette statistics; it does not claim garment measurements, fit size, or unseen geometry. A small capped deformation is applied to the existing physically separate 163-bone source garment shell. The original JPEG, cutout, texture coordinates, and skeleton remain source-bound. An inferred rear is explicitly marked inferred. Failed checks retain the existing original-photo fallback.

The verified native outfit path gains a blouse branch and owner/session/source admission checks. It still requires the already-saved owner outfit, a matching source proof, and a rendered native garment receipt. Arbitrary owner photographs remain ineligible for 3D. No app production, public, database, or staging code was changed.

## Evidence and limits

- The only new source photograph exercised by this increment is `commons-0016`, a licensed Metropolitan Museum blouse. Existing pinned shirt and dress fixtures remain in inherited research, but this change does not establish generalization across a range of new shirt photographs, colors, silhouettes, sleeve lengths, necklines, or proportions.
- The source's provisional cutout remains classified `REVIEW`; it is not independently owner-approved. The local test can verify a fixture-based admission path but cannot substitute for human garment review.
- Four targeted Node tests pass for exact source/mask checks, conservative fallback, 163-bone shell binding, and owner-bound admission.
- The browser harness was extended to exercise the signed-owner saved blouse outfit, responsive sizes (320/390/430 CSS px), model switching, and image hashes. Local Chromium could not launch: the installed `/usr/bin/chromium` aborts with `socket() failed: Operation not permitted`; Playwright's bundled executable is absent. Consequently, this workspace has **no actual rendered browser screenshots, male/female visual acceptance, WebKit acceptance, or performance measurement**. CI browser verification is configured separately and must pass before treating browser behavior as verified.
- Physical Android/iPhone, true signed cloud RLS, movement/collision, photorealism, and arbitrary user-photo fitting are unverified. The feature remains a narrow research candidate, not a release-ready general solution.

## P63 independent review and safety gate

P63 verified the P62 PR head as exact commit 4604186766cd45bd3b2312310c836c5bf339bd9e. Its existing workflow had no exact-head run; the successful workflows reported for that SHA were inherited P171 checks, not P62 browser acceptance. P62's own report also said its cutout remained REVIEW and that no rendered browser screenshots had been inspected.

The code called the mask analyzer with a literal reviewConfirmed=true, then accepted the resulting fitted mesh based on source hash and geometric receipts. A matching SHA proves which bytes were examined; it does not prove that an owner reviewed the cutout. P63 removes that implicit approval. P62 now requires a source-bound owner review receipt matching owner ID, saved garment ID, original JPEG SHA, cutout SHA, approved review status, and a review ID. The current pinned Commons blouse fixture does not supply such a receipt, so P62 stays on the original-photo path. The app's existing source review status is unchanged.

P63 also runs actual source-verified shirt/dress and denim WebGL suites on the pinned 163-bone donors, with the existing P175 and P106 before/after comparison auditors. These suites cover real licensed source photos, female/male rigs where supported, multiple camera angles, and mobile widths. They assess the already verified P173–P175 and P103–P106 implementations; they do not render the unreviewed P62 blouse as 3D.

**P62 blouse realism is blocked** until an authorized human review receipt exists for its cutout. The test-only synthetic receipt verifies that the gate rejects missing or mismatched values; it is not a real approval. No arbitrary user photos, physical Android/iPhone, actual hosted signed-owner RLS, collision-free cloth simulation, unseen rear photographs, or human 10/10 realism claim are established.

## Required next integration work

Before broader adoption, obtain human-approved cutouts for multiple distinct licensed tops, exercise their original-photo-to-3D mapping through actual rendered Chromium and WebKit, inspect front/three-quarter/side/rear views on both humanoids, and add evidence for garment switching, source replacement, logout, owner isolation, and WebGL recovery. Keep unsupported photos in the original-photo fallback. Family Alpha remains **HOLD**.
