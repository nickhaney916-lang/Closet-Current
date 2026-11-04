# NATIVE-3D-05 — Real Consumer Saved-Outfit to Anatomical 3D Handoff

**Main controller. Research-only. Family Alpha issue #255 HOLD. NO MERGE / NO DEPLOY.**

## Exact source scope

- PR #556 NATIVE-CONSUMER-BOARD-04 exact verified SHA `56c9a814d6ecce5beae5d95043213faa2d8bb6f0`, dedicated real browser CI #41745835075 SUCCESS. The actual native Outfit Builder now has owner-private lossless saved-outfit editing **only behind** `?nativeLossless04=research`.
- PR #541 OUTFIT-3D-01 exact source SHA `df6885d6011cb33fb22dceb81a08f35a0ac4dd61`, verified detached donor source. This is the ONLY permitted anatomical original-photographed 163-bone source renderer. Includes vetted `commons-0053` dress SHA `e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019`; other garments cannot automatically become believable 3D.
- PR #550 native independent auth epoch source is inherited from #556 and unchanged, verified byte-for-byte in #556 CI; no new auth provider.
- Parallel #19 exclusively owns atomic backup/import/restore and its cloud behavior. This branch does NOT modify any import, storage, merge, Cloud RLS, authentication policies, other application or independent parallel branch.

## Problem

Native 3D proof lived in standalone donor research, with a separate saved-outfit editor. The actual consumer `public/outfit-board.js` (PR #556 research mode) could save lossless wardrobe identities but could **not** hand its selected `outfit3dId`, exact source photo hashes and owner/private garment IDs to the existing anatomical 3D renderer. Directly routing to the earlier donor editor's save/delete would bypass PR #556's full-board CAS/cloud marker and jeopardize saved metadata.

## Feature-gated implementation

- Actual normal Outfit Builder controls, research flag `?nativeLossless04=research&native3D05=research`, get a **Preview saved outfit in 3D · research** button directly next to the actual consumer Save changes controls. Normal URLs keep their original behavior; NO production deployment.
- `native-preview-bridge.mjs` examines the existing selected saved outfit in the owner-private consumer controller; requires **no unsaved draft**, an existing original `outfit3dId`, actual native authentication and matching original owner. Reject missing, foreign-account, malformed saved IDs, stale owner session, any slot IDs mismatching the source donor's independent owner-private database read.
- On demand, the wrapper makes a **separate attested native session epoch** (PR #550) and lazily mounts exact unchanged PR #541 real 163-bone original-photographed WebGL panel, then opens the matching saved outfit without altering it. All original JPEG SHA checks belong to PR #541 source verifier and are repeated in cross-branch browser test. No cloud upload, actor impersonation, alternate credential, automatic wardrobe or outfit normalization.
- Donor **Save / Save New / Delete / Clear / Reload**, slot picker inputs, name field and donor saved-picker are locked/disabled; donor standalone launch button is hidden/disabled. Figure rotation, front/side/back, male/female remain available. Only PR #556 lossless atomic CAS is permitted to edit saved outfits. There is **zero 3D donor write path**.
- Unsupported jacket, coat, shoes, unknown garment or unknown rear photography are distinctly original-photo/2D fallback, never claimed as verified 3D. 163-bone rig and vetted photograph dresses/shirts/denim can use source-authentic meshes. No invented synthetic 3D mesh or physical photorealism claim.
- Log out, account change, token rotation, stale selection, or pagehide invalidates/clears the private preview and attached meshes. Explicitly closing the viewer **must not invalidate the valid independent consumer login/editor epoch**. Wrapper never logs tokens or photo bytes.

## Required independent acceptance

- Full inherited app/native-privacy build and Node tests, fail-closed 3D integration tests.
- Fetch exact unchanged PR #541 worktree, compile approved source models/cutouts, verify SHA and source/rig only from donor.
- Actual unmodified native Auth JS with only mock Supabase **HTTP responses**, original consumer Outfit Builder click, owner private IndexedDB, original licensed JPEGs.
- Chromium 320px / 390px / 430px real original-photo and genuine WebGL 163-bone female figure, front/side/back screenshots, 9 genuine 3D frames plus non-3D original consumer and owner-B missing-item fallback = target 15 PNG screenshots.
- Confirm source verified dress attaches actual 3D garment mesh; jacket/coat/shoes remain visible **only** as original-photo fallback; preserved `outfit3dId`, no DB mutation on preview/view/rotate; all donor mutating controls are locked.
- Verify closing viewer keeps actual native PR #556 owner safe, unsaved draft is refused, logout destroys source photos/renderer, and B cannot inherit A's outfit IDs; isolated mobile screenshot SHA audit and individual visual review; dedicated no-deploy final exact-SHA CI SUCCESS before declaring priority done.

## Explicit release blockers and caveats

- Synthetic login HTTP fixture is not a real server-signed production/staging two-account RLS proof (STAGING-AB-01 PR #554 is still fixture-gated).
- Real cloud full-wardrobe restore/export atomics: Parallel #19 owns; must not simulate proof.
- Physical Android Chrome and iPhone Safari tests, arbitrary photographed outfit-to-3D reconstruction, fitted real footwear and 10/10 photorealistic garment acceptance: NOT VERIFIED. Donor is a **known-source research renderer**, not a universal 3D wrapping pipeline.
- This research does not modify or deploy default production app, nor merge any research branch. Family Alpha #255 HOLD.

**Status:** implementation completed as research code, dedicated exact-head CI pending. Report PASS only when real 163-bone browser source and SHA screenshot artifact all green.
