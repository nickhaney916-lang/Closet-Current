# NATIVE-PHOTO-READINESS-08 — real private saved Outfit Builder photographed-garment truth (DRAFT HOLD)

Base is the verified main-controller PR #561 `21189b56d9f9f6ce57ad9dc795b9fe222544862e`, with **exact byte-identical unchanged** Parallel #21 PR #560 source readiness `11d7398a674d83488faab074ed1f71eddd8c9dba` and its independent 15-original-photograph evidence. Parent PRs are not modified. Family Alpha issue #255 remains HOLD. No merges, deployments, production, staging, migrations, RLS or photo uploads.

## Functional priority

An original clothing photograph saved and indexed in My Closet does **not** automatically confer a verified photographic cutout, texture UV, 3D sewn topology, physical cloth/body collisions or unseen rear source. Previously the actual native saved Outfit Builder showed a source-true **limited** anatomical PR #541 donor, but no clear per-user-garment visual gate. A person could mistake an arbitrary saved photograph for already anatomically fitted 3D.

## Implemented

- A dedicated opt-in research action *Check photographed garments for 3D* inside the real private original Outfit Builder, gated behind `?nativeLossless04=research&native3D05=research&sourceReadiness08=research`.
- Reads the **currently selected saved outfit**, performs owner-bound IndexedDB read, verifies every present original JPEG byte-for-byte with SHA-256 using the unchanged independent PR #560 original source module.
- Separately reports each original saved slot as **Needs Review**, **Photo-Only** or **Missing**. An actual **3D Ready** status is **never** inferred from garment category, color, same-source SHA, benchmark video or 3D rig existence. It requires separate human acceptance of source-bound 163-bone geometry. Legacy ownerless, tampered original, foreign-owner, missing source or unsupported footwear/coat stay photo-only or missing—never fabricated.
- Displays only SHA-verified, owner-bound original JPEG image data. Does not re-encode/crop/write/download/transfer any photograph. All result DOM assembled with textContent; no HTML injection.
- Refuses unsaved outfit modifications and authentication/account changes while verifying. Clears all prior images on owner logout and outfit changes. Doesn't overwrite or hide missing outfit references.
- The original Outfit Builder, private saved garments, CAS, backup/restore, live index, existing genuine 3D canvas, donor meshes and cloud storage are unchanged unless their independent already-approved integration flags are explicitly active.

## Acceptance (must verify exact PR HEAD and real screenshots)

New `tests/native-photo-readiness-08.test.mjs` runs all 15 independently licensed and SHA-pinned original JPEGs: conservative **0 3D Ready / 12 Needs Review / 3 Photo-Only**; rejects foreign owner, altered SHA, duplicate IDs and async login race; retains owner metadata, unknown keys and missing IDs. Unchanged PR #560 `tests/user-photo-3d-01.test.mjs` and actual Chromium benchmark add nine screenshot PNGs and source galleries across 320/390/430.

New `scripts/test-native-photo-readiness-08-browser.mjs` uses the **real original native app, original native auth code (only Supabase auth HTTP responses mocked), actual owner IndexedDB**, source-pinned licensed JPEGs, existing human-confirmed live index, saved-outfit CAS, original 3D donor and atomic v4 backup. It adds two source-readiness mobile screenshots for each of 320/390/430 to the inherited 18 screenshots: actual account A original dress/jacket/coat/shoes report 1 Needs Review and 3 Photo-Only, account B missing jeans report 1 Needs Review, 1 Photo-Only and 1 Missing. Each original photo present remains exactly SHA-verified, no owner-data leak on logout, no fake fitted meshes.

Dedicated no-deploy workflow runs full inherited application tests, real browser capture-to-closet-to-3D indexed integration (#561 78 screenshots), original 15-photo source evidence (#560 9 screenshots), and new readiness native (24 screenshots). That is 111 authenticated-fixture browser screenshots total, with SHA-backed PNG and contact-gallery audit. Must inspect all three new native UI galleries and 15-photo galleries.

## Hard release gates still blocked

No live server-signed A/B Supabase RLS, real cross-device cloud restore, physical Android Chrome/iPhone Safari, independent **human** accepted genuine arbitrary-source 3D meshing, unseen real fabric back, true 10/10 fabric realism, full non-verified outerwear/footwear 3D. No production merge or deploy. Family Alpha HOLD. All browser authentication responses are synthetic; app view and WebGL are real.
