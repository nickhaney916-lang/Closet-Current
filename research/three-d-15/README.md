# Work61 / 3D-15 — unified real-garment outfit prototype (HOLD)

Independent base: Work60 PR414 `d990703eb281d71153fe8f2c3467a0f0573cadeb` (shirt + neutral pants). Selected PR415 dress modules/tests are copied **byte-for-byte** from `dfb40889c4c1221fb1833b859e8a11ef38aeb76e`. Only its builder, provider-pinned downloader and functional tests are reused; its standalone viewer is not imported. Work59 shirt fitting, Work60 pants, source JPEGs/PNGs, recognition, app/auth/accounts and other branches remain unchanged.

Reviewed dedicated CI: PR408 run40811767057, PR414 run40819285048, PR415 run40871622711 — all SUCCESS at those verified source heads. PR413 independent anatomical QA remains HOLD, with male cuff and overall cloth realism FAIL. PR415 also documents separate RED camera/indexing CI40871615486; this integration does not repair or relabel that unrelated failure.

## Functioning unified outfit

One local showroom, both actual CC0 163-bone anatomical bodies, one camera/lighting/control system, original and relaxed poses. Choose:

- **AJ shirt + neutral pants**: existing separate original-photo shirt and separate lower-body shell.
- **Photographed dress**: existing separate original-photo A-line garment; all shirt/pants meshes are removed.
- **AJ shirt only**, **neutral pants only**, or **mannequin basewear**.

The basewear is the existing modesty shader, not a saved clothing layer. Dress removal returns to basewear; it never resurrects an older shirt/pants selection without a new user action. No footwear, new garment photograph or invented denim is added.

`outfit-controller.mjs` is the reusable integration seam. Capture original source normals/shoulder samples before preparing the existing body presentation. For a change, validate the garment/review, detach existing garment meshes, build replacements in canonical source pose, verify the same body skeleton, restore the selected pose, then dispose old garment resources and publish the new slot state. A failed build disposes new partial geometry, restores old meshes/pose and retains the current outfit. There is no draw of mixed dress/shirt/pants state. The shirt is always constructed before any new pants, avoiding the historical shirt builder mistaking clothing for body topology.

Source photo review is unchecked on every photographed-garment selection. The original JPEG and provisional transparent cutout are shown together. Only a trusted Apply click plus fresh hash/RGB validation may construct that garment. Cancel/uncheck/close does not replace the current outfit. Model changes remove garment permissions and return to neutral pants. Async epochs prevent a canceled/stale source response from attaching to a different body. No account, recognition, wardrobe save, gallery file or storage write is used.

## Targeted visible corrections

`shoulder-clearance.mjs` captures the actual primary body's original source-position/normals, before display-only normal smoothing. It adjusts only upper shirt/collar vertices against nearby original shoulder surface samples, toward a **12mm signed-normal target with a 20mm correction cap**. It leaves all `panelPosition`, `panelNormal`, source pixels, bind weights and body geometry unchanged. This reduces the conspicuous male collar/shoulder body breakthrough seen in Work59/60. A nearest-vertex normal estimate is not triangle collision detection; `minClearance=null` and `collisionValidated=false` remain explicit. It does not correct the inherited forearm/cuff sliver, reconstruct sleeves, or claim universal pose clearance.

`dress-finish.mjs` smooths duplicate front-seam lighting normals and adds **3mm nominal source-world thickness at the existing open neck and hem**, using the same material and skeleton. The rims are explicitly neutral (`dressRest` outside photo sampling), so they cannot repeat photographic logos. Original main dress positions, photograph coordinates, shader and body-envelope fit remain unchanged. Main dress1024 + opening rims256 = **1280 triangles**, one extra geometry, no extra texture. This is a small edge finish, not sewn tailoring, real armholes, an actual geometric V-neck or cloth simulation.

The 320px inspection caught a real overflow: native select intrinsic sizing expanded the mobile layout viewport to349px and shifted element captures. The new studio uses a `minmax(0,1fr)` grid column and zero minimum widths. Regression checks compare document/control bounds with the **requested viewport**, not a potentially expanded `innerWidth`. Corrected 320px layout is320px wide with a300px canvas and zero horizontal offset. Equal before/after canvas dimensions are mandatory. Main outfit/figure/pose/view/zoom/remove controls fit without scrolling at320×568,390×844,430×932; source review is an overlay.

## Source integrity and inference boundaries

- Shirt: existing licensed `commons-0003` JPEG + original-RGB provisional PNG; JPEG SHA256 `cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64`.
- Dress: existing licensed `commons-0053` JPEG + original-RGB provisional PNG. Source hashes/attribution come from the immutable Work47 manifest and locked license entries, not new photos or generated cloth.
- Pants: existing `commons-0021` original is shown as reference only; occluded waist, **no reliable source-bound cutout**. Solid slate **neutral research cloth**, `photoApplied=false/sourceSHA256=null`. Not photographic denim or source-matched colors; no fabricated mask, pockets, stitching or rear print.
- Unobserved shirt/dress sides and back use existing source-median neutral material. No back photograph is invented.
- Both exact CC0 GLB hashes are verified. Imported PR415 downloader permits only the publisher-owned HTTPS hosts/model-specific paths and the same immutable GLB bytes. Bounded retries do not bypass hashes or select alternative models.
- Review remains provisional: owner/human visual approval false; release HOLD. No source JPEG, PNG alpha/RGB, model file or isolation code is edited.

## Reproduce

Install the pinned research dependencies used in CI, reconstruct the existing benchmark, and fetch the same original GLBs:

```sh
npm install --no-save --no-package-lock --no-audit --no-fund sharp@0.34.3 three@0.180.0 playwright@1.56.1
node scripts/build-work47-benchmark.mjs
node research/three-d-14/cc0-pinned-download.mjs
npx playwright install chromium
node scripts/test-three-d-15-browser.mjs
node scripts/test-three-d-15-evidence.mjs
```

Serve the repository root locally. Open `/research/three-d-15/index.html?version=after`. `?version=before` replays the exact verified Work59/60 and PR415 garment builders in the **same new studio/camera/light**, without the integration's collar correction/dress edge finish. It is a fair geometry comparison, not a claim that the legacy PR415 UI/camera was identical. Original PR415 actual screenshots were also inspected from its CI artifact12895578971.

26 functional Node tests are run by the no-deploy workflow: 8 original model/source tests + 5 new controller/rollback/skeleton/RGB/privacy tests + 2 retained Work59 fit tests + 3 retained Work60 pants tests + 5 unchanged PR415 garment/provider/envelope tests + 3 retained Work58 fit/source tests. Historical single-stage branch-scope guards and old standalone-viewer checks remain unchanged; they are excluded on this descendant branch and replaced by this stage's stricter new-file-only guard and new viewer/browser checks. Imported PR415 tests are also byte-pinned. No functional builder test is weakened.

Browser matrix: before/after ×3 widths ×2 figures ×2 outfits ×2 poses ×4 angles = **192 real WebGL view captures**, plus12 full mobile pages. It exercises all five modes, trusted photo application, dress exclusivity, canceled/unselected reviews, model changes, repeated mixed-garment switching, source SHA verification/refusal, rollback when a new dress PNG is corrupt, same-skeleton attachment, unchanged topology/photo coordinates, no pose rebuilds, touch rotation/pinch, bounded idle suppression, control bounds, zero external/API requests and empty local/session storage. Both source cutouts are separately compared against every visible original RGB pixel.

Steady GPU object counts (geometry/texture): **shirt+pants13/3; shirt12/3; pants10/2; refined dress11/3 (verified builder baseline10/3); none9/2**. Garments dispose their own geometry/material/texture while retaining the body skeleton. Counts across finite repeated cycles are not total VRAM/heap/battery guarantees. Chromium software WebGL2 and touch emulation are not physical Android Chrome, iPhone Safari or native FPS certification. Existing account isolation is preserved by untouched app/data paths, not newly audited with live family accounts.

Evidence script builds four full comparison sheets, a collar close-up sheet, original+cutout source plate, actual PNG SHA ledger, 48 front/rear source-print comparisons and96 paired framebuffer comparisons. Pixel/geometry tests do not grant visual acceptance. Raw204 PNGs and actual CI reports are uploaded as `THREE-D-15-WORK61-UNIFIED-OUTFITS-HOLD`.

## Implementing-assistant visual grades — owner/independent review pending

| Criterion | Grade | Visible result / limit |
|---|---|---|
| Unified slots, dress exclusivity, rig attachment, source identity | PASS | Both actual figures; one selected real-photo garment, separate neutral pants where selected |
| Male shirt upper collar breakthrough | REVIEW | Gross pale shoulder patches reduced in actual front comparisons; collar still angular and arbitrary-pose clearance unproven |
| Shirt sleeves/cuffs | FAIL male / REVIEW female | Inherited thin inner-forearm/cuff sliver remains; no sleeve rebuild |
| Pants waist, seat, knees, hem | REVIEW | Approximate overlap and broad stiff contours; rear waist can protrude |
| Dress neck/shoulders/arm openings | REVIEW / FAIL shape | Added physical edge thickness and smoother seam; broad rigid shoulder cap and printed V-neck do not reproduce sewn openings |
| Dress/source print fit | REVIEW | Actual licensed white trim/logo/hem visible; shoulder mapping stretched, no faithful back photo |
| Natural cloth / finished fashion realism | FAIL | Photo folds remain shading, dress is rigid A-line, no sewn panels or general cloth/body collision |
| Mobile composition | REVIEW | Functional compact controls; small default view needs zoom for fine print; native phones not certified |

**Family Alpha remains HOLD.** This is a functioning unified development prototype, not owner visual signoff, arbitrary garment fit, all15 benchmark acceptance or authorization to invite testers.

## Development integration handoff

Normalize the verified body to the existing2m display scale, call `createOutfitController` before any other presentation preparation (it owns that call), route outfit/pose changes through it, and dispose it before disposing the body skeleton. A wardrobe-facing integration must keep its existing account/source identity and save boundaries; do not copy this localhost benchmark UI wholesale. Keep PR413 independent QA, PR410 performance and PR411 fallback separate; no work here replaces those assignments.

Next priorities: actual sewn shoulder/cuff and dress armhole/neckline topology, continuous pants crotch/knee panels and intermediate hip/elbow/knee pose collision checks. Photographic pants mapping stays blocked until a valid existing-source cutout passes independent review. No merge/deploy, staging/production, auth/cloud/accounts, private family photos, paid AI, new photographs, Drive Duel edits or tester invitations.
