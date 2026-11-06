# Closet Current — Priority #102 / NATIVE-MOBILE-VISIBILITY-SOURCE-REVOKE-102

**RESEARCH ONLY · Family Alpha Issue #255 HOLD · no production, existing staging, merge or deployment.**

## Source and rationale

Based on fully independently verified [Priority #100 draft PR #655](https://github.com/nickhaney916-lang/Closet-Current/pull/655), exact source commit `2bc59ba8e16188319a72a95ebed2b6667e0eb62f`; [dedicated no-deploy CI #42228297696](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42228297696) SUCCESS with **924/924 Node**, all **59+2+7 original research photo source SHAs** and **6/6 Chromium/WebKit original-photo human reviewer workflows, 20/20 screenshots**.

**Different from Parallel Work #45 / Priority #101** (genuine independent recognition dataset expansion). Priority #102 focuses on the actual **research-only owner-private source-photographed 163-bone 3D garment viewer's mobile-tab lifecycle**, not classification or benchmark data.

Priority #93 already revokes a visible source-true owner outfit after a native Outfit Builder wardrobe snapshot refresh, even when stored SHA metadata are unchanged. But an app tab may be backgrounded, frozen or later resumed on a phone **without pagehide and without a wardrobe refresh**; neither a DOM selection change nor polling state is guaranteed. Reusing the previously displayed source-photo 3D without a fresh admission risks stale data. No continuous per-frame JPEG rehash is desirable.

## Engineering solution

- Extend only the opt-in `?native3D05=research&nativeLossless04=research` **research 3D preview bridge**.
- New synchronous `requireNative3D05Visible102()` rejects new photo-to-WebGL admissions during `document.hidden`, `visibilityState=hidden`, or `prerender`.
- After mounting, listen for actual `visibilitychange` and `freeze` events. When the browser backgrounds or freezes, **synchronously destroy the original donor panel**, remove the photo-backed 3D and clear all source/owner admission receipts. Invalidate in-flight lazy import and WebGL requests by incrementing their existing request counter. Do not revoke still-valid native auth, sign out the owner, write to IndexedDB, mutate the native outfit, or change cloud settings.
- Every existing synchronous `state()` read closes a preview if the visibility event was missed. Every asynchronous donor import, WebGL mount, owner source capture, and final source selection rechecks browser visibility through the existing `requireFresh` boundary.
- After the phone returns, the owner must explicitly reopen. Reopening uses both unchanged NATIVE92 **real original JPEG browser WebCrypto** source-byte SHA-256 attestations, with NATIVE93 wardrobe revision and NATIVE88/89 saved-selection/owner checks; there is no auto-reopen.
- Exact lifecycle listener cleanup on bridge `dispose()`.
- Preserve default application, release, browser login, signed owner wardrobe, donor geometry, physical model, fabric materials and source-original JPEG bytes unchanged.

## Actual independent engineering acceptance

- Pure Node regression checks for hidden, prerender, visible and absent documents; browser lifecycle cleanup, in-flight admission cancellation, signed owner and original board preservation.
- Add an opt-in NATIVE102 block to the **existing genuine Chromium 390px WebGL test**. Begin with a genuine licensed original JPEG on the pinned PR541 163-bone anatomical donor, then simulate the mobile tab becoming hidden through real Chromium DOM visibility properties and event dispatch. Check source photographs removed **before any state getter** and signed native owner + saved outfit unaffected. Forbid attempts to reopen while hidden. Restore visible and reopen after genuine NATIVE92 source re-attestation. Dispatch browser `freeze` event and independently verify immediate photo removal and unchanged saved board.
- Note: this is an actual Chromium original WebGL test of **simulated browser lifecycle events**, not physical Android/iPhone OS backgrounding verification.
- Two independent original Chromium mobile viewport PNG audits (SHA-256, dimensions, nonblank). Preserve inherited three-viewport (320/390/430) real WebGL donor tests, source replacement/revocation tests #88–#93, existing 15 screenshots, source donor pinned exact SHA.
- Strict exact #100 research parent, six research-only scoped paths and no deployment/actions write permissions.

## Scientific and release scope

- This change does **not** improve photographed cloth geometry, drape, realism or 3D fitting. Existing pose-responsive cloth limits remain.
- No genuine recognition accuracy, category/subtype/color, individual detection IoU or unverified human confidence scores. Parallel Priority #101 handles benchmark source acquisition.
- No physical phone testing; no live signed two/four-user Supabase RLS evidence; auth in Chromium donor harness uses mocked HTTP responses and local synthetic accounts.
- Family Alpha #255 **HOLD**. Draft PR unmerged. Production and existing staging not touched.

**Engineering acceptance:** pending successful exact-HEAD dedicated no-deploy CI. Do not claim completion from code changes alone.
