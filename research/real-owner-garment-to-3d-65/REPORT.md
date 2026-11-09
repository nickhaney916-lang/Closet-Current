# Real owner garment to 3D — Priority 65

## Implemented

The P189 private PNG alpha handoff now produces a normalized row-contour profile from the owner mask and the pinned source mask. P189 verifies the separate PNG bytes, SHA-256, source identity, registration, and current owner review lease before this profile is built. The P65 viewer checks the profile's owner ID, saved garment ID, and original source SHA against the active outfit before fitting.

For the existing `commons-0016` blouse only, the P65 fitter scales the retained source shell and its left/right shoulder cap panels by the reviewed mask's measured half-width at each vertical row. It preserves the original 163-bone skin weights, UVs, panel registration, source JPEG, and shoulder-cap joins. Each vertex movement is capped at 35 mm. The fitted mesh receipt records the private mask SHA, moved vertex count, bounded vertex count, and maximum displacement without exposing mask bytes.

## Verified evidence

- Focused P65 tests cover source/owner binding, distinct mask identity, clipped and empty masks, geometry change, the 35 mm bound, and 163-bone shell requirements.
- Exact P65 Chromium browser fixture exercised the saved-outfit path at 320, 390, and 430 CSS px. It rendered front, side, and inferred rear views on female and male 163-bone figures, verified mask SHA attribution, verified that the saved outfit was unchanged, and tested review mutation revocation to the original-photo fallback.
- The browser fixture uses licensed Commons photography and a deliberately modified synthetic RGBA mask. It is not an actual owner's segmentation or independent human review.
- Screenshot inspection shows a visibly fitted but stylized blouse. Fabric still looks smooth and boxy; photorealism, shoulder realism, and collision acceptance remain unverified.

## Hard limitations

- The geometry is a mask-driven deformation of the existing licensed blouse shell. Its topology, seams, rear, and hidden construction are not reconstructed from the owner's photograph. This work does not satisfy the full arbitrary-garment reconstruction objective.
- P189's `commons-0016` source gate remains. Shirts outside that pinned source, pants, skirts, dresses, outerwear, shoes, multiple overlapping garments, worn-garment segmentation, and arbitrary owner photographs stay on the original-photo/2D path.
- The P65 browser fixture synthesizes owner review and mask bytes. It tests byte binding and owner isolation code paths, not segmentation accuracy or genuine human consent.
- Browser checks do not replace physical Android or iPhone testing. No physical device was available in this environment.
- The browser fixture uses mocked authentication HTTP; hosted Supabase authentication/RLS and disposable cloud backup/restore were not tested here.

## Release state

Research-only integration on the P189 branch. No public application, production, staging, or Supabase files were changed. No deployment or protected-branch merge occurred. Family Alpha Issue #255 remains HOLD. No family invitations were sent. This is not release-ready and does not claim 10/10 realism.
