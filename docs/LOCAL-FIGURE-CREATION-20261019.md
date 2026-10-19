# Two in-house figure candidates: actual creation evidence

Two fixed adult figure candidates were actually created and rendered locally.
They are **review candidates, not production-quality or production-approved
figures**. The existing app assets, fitting positions, body-occlusion work and
all other draft branches remain unchanged. This isolated branch starts at PR #49
`15c7d16a` and follows PR #48's production-asset requirements.

## Delivered work

* Exactly one female and one male fixed character, derived from pinned CC0
  MakeHuman assets with original pose, procedural materials, clothing-shell,
  footwear, camera and lighting work. The renders are original project output;
  the underlying mesh/targets are upstream work, not claimed as exclusive or
  wholly authored here. There are no runtime random or per-customer bodies.
* Two native **1941×3597 RGBA PNG scene renders**, two editable `.blend` scenes,
  two same-size sRGB-tagged delivery masters, two **1294×2398 PNG** derivatives
  and two **970×1798 lossless WebP** mobile derivatives. These are versions of
  the same two characters, not extra user-facing figures.
* Old 160×297 previews were never read by the creation renderer. High-resolution
  images are direct Blender scene renders at 100% resolution; only delivery
  derivatives are downsampled. No AI generation or image inference was used.
* Exact input assets/licenses/tool archive, recipe/script, editable-scene,
  native-render, decoded-pixel and delivery-file hashes are recorded. No customer
  photograph, texture, selfie or recognizable person's photograph was used.

The actual local measurement snapshot is
`benchmark/figure-creation/local-results-20261019.json`. The CI artifact
`locally-created-two-figure-candidates` contains actual masters, derivatives,
editable scenes, gallery, run-specific JSON and browser screenshots. These are
review artifacts, not public app replacements. Preserve that artifact before its
GitHub retention expires; committed code, source lock and recipe can reproduce it.

## Tooling and exact permissions

Blender was initially unavailable. Python package installation found no compatible
`bpy`; system-package downloads were blocked by the environment. The official
standalone **Blender 4.3.0** Linux archive worked. Its SHA-256 matched the publisher
checksum:

`6264ff4cf50baf6be6091a28d3c29cf25dc38d8daa3082874ce94d520d3e6ab6`

Official sources: [archive directory](https://download.blender.org/release/Blender4.3/),
[checksum](https://download.blender.org/release/Blender4.3/blender-4.3.0.sha256),
[Blender artwork terms](https://www.blender.org/about/license/).
Observed Blender build hash: `2b18cad88b13`. Cycles CPU, six threads, 24 samples,
seed 916, shared orthographic camera and three shared area lights; transparent
film; Standard display transform, exposure 0, gamma 1. No paid GPU/cloud service.

MakeHuman revision **a8bc2d54ff0ac92e78ff71431b1023eda42bf482** supplies only
explicitly CC0 graphical data: base mesh, six adult macro targets, eye geometry/
correspondence, default joint metadata and arm-chain weights. Every used file's
SHA-256/length is locked in `benchmark/figure-creation/source-lock.json`. The OBJ
and target headers explicitly identify CC0; rig/weight metadata also states CC0.
Original asset headers credit Data Collection AB, Joel Palmius, Jonas Hauquier
and, for targets, original author Manuel Bastioni. Full upstream general and
asset-license texts are preserved in `benchmark/figure-creation/licenses/`.
No MakeHuman application code was copied or executed. The importer/pose/material/
render scripts are project code. No community hair, skin, photograph, garment
texture or unverified add-on was incorporated.

The pinned [upstream license](https://github.com/makehumancommunity/makehuman/blob/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/LICENSE.md)
and [asset terms](https://github.com/makehumancommunity/makehuman/blob/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/LICENSE.ASSETS.md)
support commercial reuse, modification and distribution of these CC0 source
assets. They disclaim warranties/third-party clearance and do not grant trademark
or patent rights. This is supporting source-permission evidence, **not legal or
commercial-product approval of our final files or optional face-replacement use**.
Upstream assets are nonexclusive. No contract, receipt, reviewer or release was
invented. Existing preview rights remain unknown and are not inherited by these
candidates.

Adult basis: the selected `young` macro targets correspond to approximately
25 years in the pinned upstream `makehuman/apps/human.py` age-anchor description
(1/10/25/90 years). Only adult targets are consumed. Three source macro variants
are blended at equal weight per figure; these are shape recipe components, not
claims about a real person's ethnicity. No child/baby targets are used.

## Measurements and their limits

| Measured item | Female | Male |
|---|---:|---:|
| Native render | 1941×3597 | 1941×3597 |
| Alpha content bounds on native-size delivery | [357,226,1585,3383] | [296,226,1645,3383] |
| Native-size soft-alpha pixels | 24,717 | 25,008 |
| Image border clear | yes | yes |
| Arm posing displacement of leg-weighted vertices | 0 | 0 |
| Independent visual approvals | 0 | 0 |
| Commercial-product approvals | 0 | 0 |

Bounds describe generated alpha, not a human-verified anatomical mask. Both body
heights are normalized to 1.75 scene units and share the same sole/head framing.
Maximum central source-joint coordinate difference is **0.017722249** (about
1.77% of canvas). Shoulder-center vertical delta is about 0.30%; hip-center about
1.69%; head/sole reference deltas are zero by construction. These are projections
of upstream source joints, not reviewed chin/waist/body placements. Normalizing
framing does not establish equal anatomy, correct real-world proportions, garment
fit or production acceptance. Runtime positions are untouched.

Native-size anti-aliasing is preserved. A fixed standard-sRGB profile tags the
already sRGB display output; it does not create detail or serve as a perceptual
color accuracy score. Profile bytes/hash are stored; canonical metadata avoids
run-time profile-date changes. Derivatives use pinned Pillow 11.3.0. Hash checks
caught incomplete derivative output during development; images now serialize to
memory, fsync a temporary file and atomically replace the destination. Repeated
packets from the same native render match byte for byte. Native Cycles rendering
across different CPUs/denoiser builds is **not** asserted pixel-identical; each
run preserves its own actual file/scene hashes. Scene and recipe reproduce the
construction, not an unsupported cross-hardware bit identity guarantee.

## Observed failures and unresolved quality

Initial quick renders clipped the hands and applied clothing/hair boundaries in
inconsistent source coordinates. A geometry-only arm rotation also deformed leg
vertices. The first weighted arm-chain revision omitted metacarpal weights and
stretched portions of the hands. These failures were observed on actual local
render outputs and rejected. The final pose uses the full upperarm/lowerarm/
wrist/metacarpal/finger chain, and a hard renderer assertion verifies zero leg
motion. Final framing has clear borders and separated arms.

Full-size face inspection still shows plainly synthetic eyes/skin, a simple
hair cap, no finished eyebrows/eyelashes, and jagged hair/collar/cuff/hem edges.
The clothing shell and block footwear need professional-looking art direction.
Hands and facial/body proportions still need independent anatomy review. These
are **not photorealistic figures**, and more pixels did not solve those problems.
No automated beauty, realism or suitability score is reported. Independent
appearance, anatomy, source-aligned landmark and final product-rights reviews
remain missing. Source texture/detail quality and base-clothing suitability for
all garment silhouettes are also unresolved. Occlusion/layer integration belongs
to the main conversation and is not duplicated here.

## Reproduce

```sh
python -m pip install Pillow==11.3.0
python scripts/prepare-local-figure-tools.py --acquire
artifacts/figure-creation/tools/blender-4.3.0-linux-x64/blender \
  --background --factory-startup --python-exit-code 1 --threads 6 \
  --python scripts/create-local-figures.py -- \
  artifacts/figure-creation/vendor artifacts/figure-creation/native
python scripts/benchmark-created-figures.py
node scripts/assert-created-figures.mjs
node scripts/build.mjs
node --test tests/*.test.cjs tests/*.test.mjs
# Browser emulation only:
npm install --no-save --no-package-lock playwright
npx playwright install --with-deps chromium webkit
node scripts/test-created-figure-browsers.mjs
node scripts/test-reusable-figure-phone-browsers.mjs
```

Preparation downloads only pinned public software/assets and verifies hashes;
rendering/derivatives run locally. `--quick` produces diagnostic 486×900 renders
in a separate directory and is explicitly rejected by the full-master benchmark.
Render output is restricted to `artifacts/`; nothing is staged into `public/`.
The preparation tool does not accept arbitrary download URLs. Source and software
licenses remain separate, and Blender itself is not included in the review zip.

Local build/full suite: **1042 passed, 0 failed, 3 skipped**, including five new
failure-contract tests. Actual native files, complete source hashes, source-joint
measurements, transparency and derivative integrity pass; both production gates
remain blocked. The draft PR records exact-commit CI, 24 new-candidate browser
cases and the existing whole-app fitting emulation. Browser sampling/decode/
geometry checks are not real-phone, anatomy or photorealism evidence. Physical
Android/iPhone display, memory and performance remain untested.

No purchase, paid generation, recurring inference, customer upload, deployment,
merge, existing draft-branch edit or Drive Duel change.
