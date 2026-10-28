# Closet Current 3D-06 — Anatomical humanoid showroom (HOLD)

Owner direction: **make the 3D humanoid actually look human**, not continue polishing the procedural tube mannequin of 3D-01–05. No additional Work assignment requested; main thread acts here.

## Authentic, legally reusable anatomy

This isolated experiment evaluates two separate adult **163-bone real anatomical humanoid A-pose 3D models**, each ~109k triangles, originally from MakeHuman community CC0 core human meshes, repackaged by Innerscene under **Creative Commons Zero**:

- Female base: https://www.innerscene.com/tools/library/3d-parts/female-base-mesh-3d-person-rigged-a-pose-dba97ed5
- Male base: https://www.innerscene.com/tools/library/3d-parts/male-base-mesh-3d-person-rigged-a-pose-380e6d89
- MakeHuman core asset license confirmation: https://www.makehumancommunity.org/about/license.html

The site's descriptions as of October 28, 2026 call both CC0, commercially reusable, rigged, textured GLB; model publisher retains rights responsibility and any use must respect source license and supplier reliability. **Do not confuse these CC0 base assets with MakeHuman/MPFB GPL/AGPL application source**; neither tool's program code is copied into Closet Current. This prototype retains links to sources. Verify licensing again before production.


**Modesty-by-default:** The unmodified published CC0 base meshes are unclothed anatomy. Our showroom material includes a source-free neutral fitted upper-body-and-shorts **shader layer** over the actual anatomical mesh for privacy and family suitability. This is not a photographed garment, fitted apparel or a claim of physical fabric simulation. It does not modify the acquired GLB assets. CI validates dark torso coverage in actual GPU pixels in the neutral warm-clay finish. Screenshot artifacts include separate male and female views.

## Real working visual showroom

`research/three-d-06/index.html` is a source-only local research page powered by installed **Three.js GLTFLoader** and actual downloaded **skinned human geometry**, not an image or CSS rotation. The page supports:

- Toggle male and female CC0 anatomical figures
- Front/side/back, finger-drag rotation and zoom, auto-spin
- Neutral matte warm/clay or graphite finish
- Human anatomical body surfaces, detailed hands, feet and smooth shoulder/body proportions
- Neutral fashion-showroom lighting, floor contact shadow and responsive phone view
- Real model stats: bones, triangles and skinned mesh count

No private owner/person face scan, no user account or original wardrobe photos, no clothing-body contact guarantee, no outfit, no paid per-inference AI, no Supabase/Cloudflare/Resend, no web CDN calls from the **runtime viewer**.

This is an *anatomical base only*, NOT a replacement for our real-photo clothing engine. Later evaluate the exact source-bound cutout from existing 3D02/03/04/05 vs a body-space garment adapter for real GLB skeleton dimensions, then assess how actual clothing appears. Figure may look like a clay mannequin until cloth/lighting/face details are improved. Underlying anatomical base may represent a body form but the matte neutral style is intentionally a display mannequin, not actual users' measurements/likeness.

## Run and download

The large GLB sources are **intentionally not silently added to the repository**, nor loaded from external websites when the viewer opens. From the repository root with Node 22+:

```bash
npm install --no-save --no-package-lock --no-audit --no-fund three@0.180.0 playwright@1.56.1
node research/three-d-06/fetch-licensed-avatars.mjs
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/research/three-d-06/index.html`.

The explicit asset-acquisition step downloads the two CC0 models **once into a gitignored/untracked local research folder**, validates GLB 2.0 header, nontrivial 3D triangle counts, real skeletal bones and source license, enforces each file against an exact SHA-256 previously verified from the publisher, prints the fingerprints and emits `verified-assets.json`. **Exact SHA-256 files now locked** from CI #40783878869 (2026-10-28): male `d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8`; female `a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1`. These identities were validated with 163 skeletal bones, 109064 triangles, and two meshes per model; vendor/host approved binary assets in a controlled product asset path before shipping. **No runtime external downloads** are allowed. A source may change or become unavailable: the download stage must fail and never substitute another unnamed unlicensed model.

## CI quality and limitations

The dedicated new 3D-06 no-deploy workflow:
- Accepts changes to only 8 files in this research, tests, or workflow against exact parent 3D05 SHA `a907c500ad4ba15d0a89482b5be881b0298492bb`.
- Installs exact local Three.js and Playwright versions in CI, downloads **only** the two named CC0 files using their canonical provider URLs, validates their skeleton and geometry, and enforces the two source-verified SHA-256 locks.
- Runs pure binary GLB parser/privacy-source tests and **actual Chromium WebGL2 tests at 320/390/430 px**. Each must load both rigs, show more than 25 real skeleton bones and 10k real triangles, render nonempty body images, verify distinct front/side/back and male/female renders, switch material, retain accessible mobile controls and make **zero outbound runtime requests**. Artifacts contain true browser screenshots labeled HOLD.
- License and content sources must still be reviewed for reuse before any production release; exact file hashes are locked but full licensing, visual quality and production integration still need independent signoff.

**Not a staged or merged feature, not Family Alpha 4-person readiness.** This branch does not alter original source clothing JPEGs, cutouts, the production app, 2D styling, 3D05 geometry, family photos/accounts, staging, production, or Drive Duel. Last independent clothing visual gate: 0 PASS / 5 REVIEW / 10 FAIL. Remaining integration work: model-specific garment rigging, source RGB UV alignment, realistic sleeves over bones, avoiding exposed clay mannequin with wearing clothes, mobile performance, verified license and pinned binary files, human graded visual comparisons and private device tests.
