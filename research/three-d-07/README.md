# Closet Current 3D-07 — original licensed shirt on anatomical humanoid (HOLD)

**Goal:** connect the genuine licensed Work47 shirt photograph and masked original-RGB fabric to the new adult male and female 163-bone CC0 anatomical bodies delivered in [3D-06 PR #396](https://github.com/nickhaney916-lang/Closet-Current/pull/396). This is the first direct transfer between previously separate **2D garment recognition/cutouts** and the **real humanoid GLB**. Do **not** return to polishing the deprecated tube avatar.

## What is implemented

- This is a **real photographed garment mapped onto the actual anatomically skinned body surface**, inside the Three.js glTF material shader. It is not an HTML sticker pasted on the screenshot, and will rotate with the real anatomical mesh. The image is sourced from the original licensed `commons-0003` black AJ shirt, using its exact unchanged Work47 provisional transparent source-RGB cutout. Both the original JPEG and alpha PNG must match their frozen SHA-256 entries in Work47's manifest *before* any GPU texture is uploaded.
- The existing `loadLicensedCutout` API continues to enforce Work47 alpha integrity plus original category, source SHA and explicit review confirmation, and its original-RGB median is reused for sleeves, sides and inferred neutral rear. The new `requireAnatomicalShirtPreview` refuses all other garments, unsafe crop bounds, unverified source metadata or any claim of visual owner approval. No original photographs/masks touched and no new paid inferences.
- The separate `research/three-d-07/index.html` has source original and alpha PNG side-by-side, **unchecked** review by default, a disabled Apply button until a physical user checkbox, a trusted click requirement, and a remove action that clears the texture immediately. Switching between adult male/female bodies clears the garment and requires a new explicit review.
- The anatomical body remains the actual hash-pinned 3D-06 skinned mesh (163 bones and 109,064 mesh triangles; see provider verification). We bind a source RGB/alpha texture to an **existing curved humanoid surface** rather than reconstructing cloth dimensions. The shader confines photographic detail to front chest; non-photographed back/sleeves use only source-representative color. The neutral modesty base layer stays on when no garment is applied.
- **This is not a physically separate 3D shirt mesh**, not tailored garment fit, cloth folds/drape, user measurements, or a real photo of the wearer's back. UV body coordinates are approximate. Source cutout visual quality remains subject to independent review. Keeping those limits visible matters for honest Alpha expectations.

## Run the research preview

The source-only page works on `localhost`; no staging, no product accounts or customer photos. From repo root in a controlled development environment:

```sh
npm install --no-save --no-package-lock --no-audit --no-fund sharp@0.34.3 three@0.180.0 playwright@1.56.1
git fetch --no-tags origin 53f2ad344dc56a1477e343531c423aed0e66c17d dd6bac3fa9ff640d4f562cf925337440bdb5cf8f 3a572193987cb29389727426136c6eb3ac326783
node research/three-d-06/fetch-licensed-avatars.mjs
node scripts/build-work47-benchmark.mjs
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/research/three-d-07/index.html`. The browser uses local existing original JPEG, existing transparent PNG and hash-locked male/female GLB, as well as locally installed Three.js, and issues **zero internet requests**. Source file downloads happen in the explicit preparatory Node script and original benchmark reconstruction only.

## No-deploy checks

The stage-scoped 3D-07 workflow allows only experimental `research/three-d-06/anatomical-showroom.mjs`, `research/three-d-07/**`, its Node/browser tests and its own workflow. Rebuilds the original licensed 15-photo benchmark from frozen source pinned historical commits; verifies the two CC0 exact SHA-256 models; runs GLB validity tests, source-bound shirt pass/fail decisions, UV source crop and privacy tests; **real Chromium WebGL2 three-phone-size tests (320/390/430)** load both skinned anatomical figures and permit reviewed shirt projection only after human interaction. Browser checks real GPU image change, original JPEG and PNG integrity, rotating side/back, switch cancellation, uncheck and Clear cleanup, no outside requests, and saves screenshots for each humanoid.

**Cross-model screenshot finding:** The first head (exact CI #40787964465) showed a visible photographed AJ print on the female torso but the male image largely lacked the white detail. We therefore use actual skinned body **front-facing normal** alongside the body-depth gate to decide whether source photo may appear on the forward torso; no printed photo is authorized on the back. Model-specific front-surface reliability is a visual quality condition, not just upload success. It remains human review HOLD.

**Human quality remains HOLD:** last independent 15-photo 2D/flat-avatar visual benchmark 0 PASS/5 REVIEW/10 FAIL; this project has not earned a new PASS. Work #53 isolation and Work #55 independent visual acceptance continue separately. The broader camera/indexing workflow is independently red, and earlier single-stage 3D workflows are not automatically merge green on stacked changes.

No production/staging deployment or merge, Supabase/Cloudflare/Resend modification, signup/invites, family photos or account changes, paid AI/token services, or Drive Duel changes. Real four-person Family Alpha remains HOLD pending privacy JWT/RLS, verified live account/cloud backup, real physical phones and owner visual go/no-go.
