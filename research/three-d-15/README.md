# Closet Current — 3D-15 unified anatomical outfit studio (HOLD)

**Milestone:** combine two independently verified development paths into one actual **rotatable, rigged 3D outfit experience** without rewriting their source, avatar, or wardrobe processing. This is a research branch, not live four-person Family Alpha.

## Exact upstream sources

- **Work60 PR #414**, exact `d990703eb281d71153fe8f2c3467a0f0573cadeb`: genuine source-hash-verified black AJ shirt on an independent Work59 shared-skeleton skinned garment plus neutral slacks on a separate anatomical pants mesh. Real Chrome WebGL mobile and 17 source tests passed; original licensed jeans photo `commons-0021` deliberately has NO trusted cutout and is never represented as photographic pants.
- **3D-14 PR #415**, exact `dfb40889c4c1221fb1833b859e8a11ef38aeb76e`: original licensed `commons-0053` dark dress with source-crop photographic white neckline trim, chest design and hem on a separate shared-skeleton A-line mesh; real RGB and visible print tested against the original SHA-verified JPEG and existing Work47 provisional mask. Dress triangle winding/front-back contact defects were corrected, but **natural realistic cloth drape is still FAIL**.
- Both start from the same Work59 baseline `d09786163eb52a4a0fa05a5ffc546fc171896080`. Work #53 and Work #55 independent cutout/visual review projects remain untouched. Upstream branches are not merged into one another.

## Actual integrated code

Only new files under `research/three-d-15/**`, plus a new no-deploy test/workflow, are changed compared to **exact Work60 head**. No existing Work60 or 3D14 file is modified:
- `showroom.mjs` reuses Work60 anatomical dual-human rig + shader, Work59 original shirt, neutral Work60 pants, pose transitions, camera touch rotation, idle redraw and original-body lifecycle. It directly ports 3D14's independently tested **separate THREE.SkinnedMesh dress** into the same CC0 skeleton.
- `dress-shell.mjs` is the original exact 3D14 dress builder, byte-for-byte, with its nine-ring A-line envelope, independently measured front body clearance and outward normals. Not another dress algorithm.
- `cc0-pinned-download.mjs` preserves 3D14's exact immutable SHA-256 model identities and only the publisher-owned HTTPS download hosts `www.innerscene.com` / `files.innerscene.com`. Actual browser viewer requests only local prepared files.
- `index.html` and `demo.mjs` add a distinct, opt-in real-dress photo review with original/PNG side-by-side, disabled Apply until review, manual trusted click, own license attribution, removal and a dedicated outfit button.
- **Dress is a mutually exclusive outfit category**: on successful reviewed application, the actual shirt and neutral pants meshes are removed/disposed; switching back to pants or shirt removes the dress rather than rendering layers underneath. A rejected source leaves prior outfit unchanged. Changing the figure clears the dress/shirt; user can reapply only with review. The neutral pants preset may return upon figure change. Source/relaxed poses deform the same rig rather than reconstructing photos.

## Fidelity and safety

- Only the existing original SHA-256 verified Work47 `commons-0003` AJ shirt and `commons-0053` dress can receive photographic material. **Pants remain neutral; no fake cutout, colors, pockets, denim or invented photographed rear.**
- Every source uses the exact Work47 frozen licensing manifest, original JPEG and existing proposed transparent cutout PNG. Existing `loadLicensedCutout` performs byte hashes, alpha integrity and fail-closed confirmation again at apply time. Previews do not set owner approval; release remains HOLD.
- The adult anatomical GLBs are source SHA pinned, actual separate shirt/dress/pants meshes use the real 163-bone skeleton, front photos only, sides/rear neutral inference. No new AI tokens, face capture, user photo, private account, cloud persistence, or retail product spending.
- **This does not establish realistic wearability.** Skin-to-garment collisions outside tested poses, garment measurements, collar/sleeve fit, back photography, skirt drape and neutral pants realism remain unresolved. Original 15-photo human aesthetic baseline was 0 PASS, 5 REVIEW, 10 FAIL. Technical source fidelity is NOT a human visual PASS.

## Test contract

The dedicated new workflow performs a strict new-only source allowlist against PR414's exact SHA, installs locally pinned `sharp@0.34.3`, `three@0.180.0`, and `playwright@1.56.1`, rebuilds the original 15 licensed source benchmark, obtains the exact locked CC0 male/female GLBs with the corrected provider redirect, runs the original Work60 17 geometry/privacy tests alongside new 3D15 category/exclusive-state/source checks, and runs real Chromium SwiftShader WebGL2 at mobile widths 320, 390, 430. Real browser checks require both figures, real licensed dress image only after a trusted review click, original black AJ shirt, neutral pants, one shared skeleton, switching dress ↔ shirt+pants, source/relaxed poses, true front/side/back rotation, no cross-outfit garment overlap, model clearing, removal, no outside requests and no horizontal overflow. Captured browser screenshots are HOLD and are **not an automated human visual approval**.

Further milestones: 15-photo comparative grading, a physical smartphone/Safari trial, owner-scoped JWT+RLS and live private wardrobe save/restore, and resolving the broad inherited camera/indexing CI. Until then, no merging or staging/production deployment, no four real family invitations, no Drive Duel work.

**Scope-guard compatibility:** The original Work60 source-only unit test includes one obsolete assertion that *only 3D13 files may be added relative to Work59*. A legitimate downstream 3D15 outfit feature violates that frozen stage list. Its **actual lower-body geometry, original SHA and deformation tests remain unchanged and executed** with a test-name filter excluding only that obsolete assertion. The 3D15 CI instead enforces a stricter exact Work60-head allowlist, only nine new 3D15 research/test/workflow files, and does not modify an existing test or Work60 source. Older stage-only workflows are not represented as green.
