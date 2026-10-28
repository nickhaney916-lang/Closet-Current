# Closet Current 3D-02 — real source-RGB cutout → actual 3D mesh (HOLD)

**Main-thread 3D pivot:** Prove the existing manually proposed photographic clothing isolation from 2D can become the front texture of the new rotating WebGL2 garment meshes **without substituting generic purchased garments, storing owner images, weakening source controls or claiming accurate clothing physics**.

**Parent:** [3D-01 draft PR #391](https://github.com/nickhaney916-lang/Closet-Current/pull/391), exact source `ecd33ce0d8a252f45cf42d2cd1b37e6f92b247d6`, [genuine WebGL2 CI #40769180100](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40769180100) SUCCESS.

## What now works

The research-only page `research/three-d-02/index.html` displays an **existing licensed original photograph** and its transparent, original-RGB **Work47 cutout** side-by-side. Two defensible candidates are sourced from Work47's independently source-pinned, SHA-256-verified licensed 15-photo benchmark: `commons-0003` printed long-sleeve shirt and `commons-0053` dress. They are provisional REVIEW derivatives, **not garments independently certified as visually correct**. Third candidate `commons-0021` jeans is intentionally **original-photo/neutral-3D fallback** because the pinned benchmark does not contain a reliable cutout for those pants. Do not invent a pants mask.

The user must explicitly compare the unedited original and proposed transparent cutout, check the review acknowledgment and press a genuine trusted-click button before attempting 3D projection. On every candidate, a locally served frozen Work47 manifest provides the exact source JPEG and transparent PNG SHA-256. The browser hashes **both original and cutout file bytes** using SubtleCrypto, decodes the real transparent PNG and evaluates existing **Work47 opaque-background/cutout-alpha integrity checks** with the unchanged, fail-closed source-bound **3D-01 adapter**. Only after verification does the already proven WebGL2 renderer project the actual masked original fabric RGB onto the front hemisphere of its genuine 3D shirt or dress mesh. The rear remains **approximate neutral fabric**; it is not a fabricated rear image. The alpha-derived source-bound UV crop changes the mapped region **without modifying any pixel of the original JPEG or the cutout PNG**. Unchecking review, changing garments or losing the page cancels the texture.

The shown transparent masks can still contain mannequin, missing straps, hanging sleeves, wrinkles or poor silhouettes. A fixed 3D mesh with a photograph front-projected on it remains **a research proof of data transfer—not an accepted accurate virtual try-on**. No claim to improve the existing **0 PASS / 5 REVIEW / 10 FAIL** human visual baseline. Work #53 owns improving difficult isolation; Work #55 owns independent human comparison. The 3D work deliberately does not edit their files.

## Reproduce the licensed, offline benchmark

From repository root:

```sh
npm install --no-save --no-package-lock --no-audit --no-fund sharp@0.34.3 playwright@1.56.1
git fetch --no-tags origin 53f2ad344dc56a1477e343531c423aed0e66c17d dd6bac3fa9ff640d4f562cf925337440bdb5cf8f 3a572193987cb29389727426136c6eb3ac326783
node scripts/build-work47-benchmark.mjs
node --test tests/three-d-01-prototype.test.mjs tests/three-d-02-cutout-material.test.mjs
node scripts/test-three-d-02-browser.mjs
```

Serve locally: `python3 -m http.server 8000 --bind 127.0.0.1`, then open `http://127.0.0.1:8000/research/three-d-02/index.html`. Browser only requests loopback files, with local originals, their license attribution and the Work47 derivative. No cloud, network/CDN scripts, inference tokens, user photos, login/cookies, persistent storage or private family access.

The no-deploy workflow contains a **strict source allowlist**, validates real inherited Work47 benchmark generation from original licensed files, runs pure geometry/hash/crop/refusal tests and **actually renders WebGL2 in Chromium** at 320, 390 and 430 px. It verifies no automatic projection, trusted-click review, actual transparent PNG alpha, cryptographic source identity, changed front pixels, true side/back rotation, dress switch, correct missing-pants fallback, and no external network. Screenshot artifacts are explicitly HOLD.

**Next real product checkpoint:** After Work #53 produces a verified candidate, compare its improved cutouts against these frozen licensed cutouts on the 3D figure, with Work #55's side-by-side rubric. Do not improve the 2D avatar further merely to polish this research page.

**Safety:** No merges, staging/production deployment, Cloudflare/Supabase/Resend changes, paid services, family invitations, customer photos, or Drive Duel modification. The four-person Family Alpha remains a separate HOLD, pending actual account JWT/RLS, storage restore, phone and owner release evidence.
