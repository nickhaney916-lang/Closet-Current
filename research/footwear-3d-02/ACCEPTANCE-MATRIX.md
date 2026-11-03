# FOOTWEAR-3D-02 — Source-honest 163-bone shoe research (DRAFT HOLD)

**Authority and scope:** only research branch `research/footwear-3d-02-source-honest` from PR #541 exact SHA `df6885d6011cb33fb22dceb81a08f35a0ac4dd61`. Parallel #6 SHOES-3D-01 had **no completed dedicated PR/branch/test or approved shoe mesh** to reuse. PR #548 (denim anatomical movement, SHA `d88590b14cadda8aa09c9daa411ae5cef64c3e4c`) and PR #547 (E2E camera/closet research) are **read-only dependencies, not merged or altered**. The original source-true PR #541 photographed-denim system is used unchanged via a scoped showroom fork in this research directory. The working app, production, Supabase, Family Alpha, unrelated parallel branches, Drive Duel and Delta Ebb are untouched.

## Original image evidence — pinned before preview

| Research pair | Repository original source | SHA-256 of exact original JPEG | License/author | Viewpoints and omissions |
|---|---|---|---|---|
| `commons-0080` | `benchmark/fixtures/commons-0080.jpg` | `4675887ee36dbaeb894faf1e0879b05473f39fb555024424d52fcdce37d35bb9` | CC0 1.0, Ayo Ogunseinde | One on-foot lateral view, partial opposite shoe in background; no clean sole, rear, inner lateral, paired topology |
| `commons-0081` | `benchmark/fixtures/commons-0081.jpg` | `72b53abd07e9438fd5a11631f6595c10d2abc98fda432d22611a58ba3b289952` | CC0 1.0, chuttersnap | One on-foot black/white sneaker composition; no full isolated clean shoe pair, sole, or complete 360° reference |

Source provenance is in `benchmark/locked-photo-sources.json`; source pages:
- https://commons.wikimedia.org/wiki/File:Houston_sneakers_(Unsplash).jpg
- https://commons.wikimedia.org/wiki/File:Black_white_sneakers_logo_(Unsplash).jpg

**Byte scope limitation:** The SHA-256 values identify the full *stored repository JPEG fixture bytes*, served from original photographed images' 1920-pixel Wikimedia derivative URLs. They do **not** certify the photographer's full-resolution Commons publisher files (Houston original 5760×3840). Neither high-resolution publisher original has been independently saved or SHA-certified for this footwear study. Full publisher-resolution retention is **BLOCKED**; the source photographs already stored in the repo are never edited by this research.\n\n**No genuine crop/mask pair is verified for either shoe.** Image orientation is one on-foot photographic angle. There is no verified reverse side and no independently photographed pair geometry. Unlike the existing shirt/jeans mask pipeline, the shoe models **do not use an image texture or claim reconstruction of unique visible details**. Only provisional silhouette, approximate observed fabric color and contrasting sole color are represented. No branded stitching, logo, tread, lace pattern or invented reverse photos. The untouched original JPEG always remains visible in the research photo card; unsupportable authentication returns PHOTO_ONLY_FALLBACK with bare feet in 3D, not misleading generic shoes. The verified hash ensures reference identity, **not** that generated 3D is pixel-faithful or visual realism approved.

The human CC0 rigs are restored by `research/three-d-20/restore-approved-models.mjs` with fixed SHA and require 163 actual bones for both male/female. Shirt SHA: `cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64`. Original denim source 1 SHA: `b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c`. Those garments remain the original source-vetted parent implementation.

## Implementation and safety boundary

- `source-shoes.mjs`: only two pinned CC0 images can mint a per-runtime WeakSet capability after exact original-JPEG SHA+manifest+license and loopback gate. One candidate gives two separate anatomical upper, sole and collar surfaces: no shared left-right mesh, no body geometry changes. Measurements sample the actual 163-bone skinned foot vertices. No fake sources or default opt-in. On owner change, stale previews dispose.
- `shoe-showroom.mjs`: isolated copy of the validated PR #541 anatomical showroom with only two import path changes and a strictly limited research scene attachment hook; shared shirt, denim and application sources untouched.
- `demo.mjs`, `index.html`: opt-in `?footwear02=research` loopback-only frontend, actual 163-bone male/female with original source-bound photographed shirt and denim. Shoe swapping does not replace, reload or save outfits, alter camera orientation or touch account data.
- `contact-audit.mjs`: samples the real skinned jeans hem and performs static **actual triangle-triangle crossing tests** between the independent shoe geometry and skinned photographed denim/body, with measured ground clearance. Numbers are valid only for sampled static poses, not watertight containment or continuous dynamics.
- `tests/footwear-3d-02.test.mjs`: licensed immutable originals, tamper/unauthorized rejection, 163-rig fixture, independent left/right mesh identities, ground clearance, 24 repeated swaps, camera stability, unsupported fallback and owner invalidation.
- `scripts/test-footwear-3d-02-browser.mjs`: real local Chromium WebGL+licensed JPEG+CC0 original rigs and photographed denim; 320/390/430, 2 figures, 2 source references, 9 orbit angles (0..360 inclusive). Targets **108 actual PNG screenshots**, separately records comparison shots for bare feet, photo fallback and shoe mesh and contact sheets; browser/asset bytes/element pixel variance checked. It records actual source-only aspect and exterior network requests.
- `.github/workflows/footwear-3d-02-no-deploy.yml`: strict PR #541 ancestry and path guard, no deployment/secrets, pinned browser dependencies, original assets, tests, WebGL evidence and artifact upload.

## Acceptance categories (never infer PASS from a green screenshot workflow)

| Check | Criterion | State until measured |
|---|---|---|
| Earlier SHOES-3D-01 audit | Previous output existed | NOT FOUND; prior work assignment-only |
| License/provenance | CC0 source links, exact pinned SHA | Pass only if test independently reads actual JPEGs |
| No invented photographs | No unphotographed reverse/logo/source texture | Enforced by design; visual REVIEW |
| Anatomical pair | Two independent feet and verified measured dimensions | Unit and browser gate; size/fit REVIEW |
| Shoe+denim intersections | Actual posed triangle crossings + hem measurements | Audit reports numeric result; not automatically PASS |
| Grounding | Sole static ground clearance <= 0.012 m | Automated 12mm research tolerance; visual REVIEW |
| Unsupported source | No 3D claim; original photo preserved | Unit/browser gate |
| Photo swapping | No figure/camera/denim state replacement | Unit/browser gate |
| 108 WebGL views | Exactly 108 genuinely saved PNG frames plus comparison evidence | NOT TESTED until final exact-head CI |
| Original user photo-to-3D | Arbitrary privately owned sneaker produces exact shape | **FAIL/BLOCKED**, only two licensed fixtures |
| Exact source printed material | Fabric texture identical to original photograph | **FAIL/BLOCKED**, original JPEG not projected |
| Source neutral rear/sole | Never present as newly photographed real shoe | REVIEW, explicit evidence limitations |
| Physical Android Chrome and iPhone Safari | Genuine handheld acceptance | NOT TESTED |
| Continuous cloth/shoe collision | Swept dynamic body/pants fit | NOT TESTED |
| Family Alpha, release, 10/10 realism | Human-approved product | HOLD/NOT APPROVED |

### Handoff guard

Research findings are not release-ready. The main controller should NOT graft the prototype directly into saved wardrobe outfits. First capture well-masked, independently front/side/rear photographed actual low-top pairs, verify original-to-mask RGB and reverse honesty, and resolve actual measured foot/jeans collision defects in a separate approved integration plan. Check the dedicated CI run and genuine screenshot artifact before quoting screenshot counts; physical phones remain NOT TESTED. There is no production approval, merge or deploy from this branch.
