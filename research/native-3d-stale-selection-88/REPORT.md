# Closet Current — Priority #88 NATIVE-3D-STALE-SELECTION-88

**Research branch only / no deployment / Family Alpha Issue #255 HOLD.**

**Parent:** exact independently validated Priority #87 draft PR #641 commit `e7a660c83ef50648c46fbc3dbd1caf77ba692416`, successful strict no-deploy CI [#42140121158](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42140121158) (813/813 Node, 30/30 browser workflow cases and 252 audited screenshots). Priority #86 actual real-model research is an **independent parallel branch**, not incorrectly assumed to be integrated here.

## Concrete defect and engineering fix

The **existing** source-verified native Outfit Builder → original-photo 163-bone WebGL read-only preview admitted a selected saved outfit *once* at the beginning of the async operation. It could then await native auth lease, donor dynamic import, donor mount, and WebGL initialization without revalidating the saved board's currently selected row. The user could switch between previously saved outfits, modify a slot or start an unsaved edit while a slow WebGL donor loaded. A later source-photo 3D scene could therefore represent **stale garment/owner intent** even while the original owner ID remained unchanged.

This priority makes the saved original board's source-bound ID, saved row ID, selected index, owner, display name and garment slot IDs into a strictly validated admission receipt. It rechecks current owner, session, dirty status, saved row, 3D ID and slots on all meaningful asynchronous boundaries: after session attestation, after donor lazy import, after mount, after WebGL load, after selecting saved donor ID, and before reporting success. If any field no longer matches, the preview closes/fails without writing the private wardrobe or substituting guessed fabric geometry. A loading-state guard also refuses concurrent `open()` calls.

The original authenticated Outfit Builder, camera and original photos, security policies, donor renderer, 163-bone rig and garment mesh assets remain **unchanged**. The donor read-only controls and unknown-garment original-photo fallback remain mandatory.

## Verification
- Eight pure Node tests cover unchanged admission; changed saved index; replaced row; changed donor ID, name, source garment slots; dirty edit; owner/logout; forged admission; owner-private isolation; and source-check guards.
- Genuine mobile browser race: in the *existing real WebGL 3D native research acceptance*, Playwright deliberately pauses the **actual dynamically loaded pinned PR541 donor module** on the 390px viewport. The user switches from the original saved source-photographed dress outfit to another saved outfit **during import**. The old request must fail as stale, leave original saved board unchanged, and permit opening the original outfit again. The 320/390/430px cases subsequently verify true source-verified 163-bone WebGL dress, front/side/rear screenshots, outfit IDs, photo-only jacket/coat/shoes, viewer close, logout and separate owner B.
- Strict no-deploy CI runs the full Node test suite and independently audits actual browser screenshot SHA/dimensions and source model provenance.

**Scientific limits:** This priority does not create, improve or independently qualify photorealistic fabric fit; it prevents an actual saved-source mismatch during slow viewer loading. Actual household arbitrary-photo 3D reconstruction, 10/10 garment realism, real signed cloud RLS/JWT and physical Android/iPhone hardware acceptance remain unverified. Historical PR-wide research CI scope checks still need reviewed release-policy resolution; a green dedicated check does not make the combined PR merge-ready.

**Engineering verdict: PENDING exact final CI. Scientific 3D realism verdict: NEEDS REWORK.** Family Alpha HOLD. No production or existing staging modification, merge, deployment or unrelated projects.
