# Parallel #62 — user photo to anatomical 3D clothing

**Assignment:** `USER-PHOTO-TO-ANATOMICAL-3D-END-TO-END-62`

**Base:** Priority #178 / PR #739, `0c36f8510b5dfb2f4b4b372ca3931d1e2c30d040`

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

## Required next integration work

Before broader adoption, obtain human-approved cutouts for multiple distinct licensed tops, exercise their original-photo-to-3D mapping through actual rendered Chromium and WebKit, inspect front/three-quarter/side/rear views on both humanoids, and add evidence for garment switching, source replacement, logout, owner isolation, and WebGL recovery. Keep unsupported photos in the original-photo fallback. Family Alpha remains **HOLD**.
