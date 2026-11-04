# MULTI-GARMENT-CAPTURE-01 — draft research handoff (HOLD)

Owner: Parallel Chat #24. Main development controller remains responsible for review and cross-branch integration. **No merge, deploy, production write or Family Alpha sign-off.** Issue #255 stays HOLD.

## Immutable research baseline and parallel dependencies

Forked from PR #563 exact immutable source SHA `d913e4f0b65c6b92cfbd1de4083e84692740707e`. Research flags required: `multi24=research&captureProof01=after&index04=after&nativeIndex07=research&nativeLossless04=research`. Default app capture remains unchanged.

- PR #565: saved clothing category corrections and CAS. **Not modified; main controller must review integration and make a separate decision.**
- PR #566: Style My New Clothes owned live styling. **Not modified; compatibility through existing owner-saved `items` only.**
- PR #564: photographed shirts 3D fitting. **Not modified.** These crops retain `threeDReady:false` and photo-only fallback.
- PR #562, #561, #545, #543: original-source proof, native index, capture, and verified recognition reused as donors; no replacement model or database.

## Data, source and behavior

The source is an original **byte-for-byte unchanged** JPEG, independently SHA-256-checked using existing CAPTURE-PROOF-01 WebCrypto and `verifyStoredCanonical`. Derived per-piece crops or masks are stored in existing owner-private IndexedDB `items`, with `sourceSHA256`, `originalPhoto`, `sourcePhotoId` and a stable `sourcePieceKey` tied to the unchanged source. Each garment has a distinct UUID; identical source photos can produce distinct reviewed garments, but duplicate source-region keys fail closed. All selected pieces commit as one IDB transaction, subject to authenticated owner/epoch checks. Existing private My Closet index, native Outfit Builder, and V4 atomic backup/restore consume the same records. Nothing writes to the OS gallery or uploads image bytes to a new endpoint.

The opt-in SegFormer worker can propose disconnected visible garment components from *either a flat lay or a person*. Its semantic labels are not a true separated-garment identity classifier. The UI shows the entire original and lets the person inspect/edit each item, category/subtype/color, crop and mask, delete a detection, add a missed region and explicitly confirm pieces before any save. If the model cannot run, a fully human-reviewed manual crop fallback works and never invents unseen surfaces. Separated objects **are never certified as 3D fitted**.

## Genuine original benchmark and licensing

- Genuine photograph of a person wearing visibly separate shirt, jeans and Converse: [Wikimedia Commons original](https://commons.wikimedia.org/wiki/File:Shirt_and_tie,_jeans_and_Converse.jpg), creator **Rasmus K. Kristiansen**, CC BY-SA 2.0 ([license](https://creativecommons.org/licenses/by-sa/2.0/)). This photo was *not synthesized or composited* for a benchmark.
- Exact direct JPEG: `https://upload.wikimedia.org/wikipedia/commons/b/b0/Shirt_and_tie%2C_jeans_and_Converse.jpg`; 104,520 original bytes; independent SHA-256:
  `e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff`
- Test asserts source URL SHA before any import. Model CDN is intentionally blocked in browser acceptance to prove manual-safe review/fallback without sending user images anywhere externally; therefore **3/3 human-corrected pieces is NOT 3/3 automatic detection accuracy**.
- Browser acceptance uses real original `public/index.html` at 320, 390 and 430 CSS pixels with synthetic authentication HTTP responses, real owner-specific IndexedDB and original JPEG import, genuine crop-editor gestures, three reviewed saved items, original bytes and hash checks, search and native outfit compatibility, v4 original source restore, logout and second account. Screenshots, unaltered PNGs, contact galleries and JSON are uploaded from CI.
- Unit tests use simulated SegFormer *label maps*, not misleading fabricated photos. They cover flat-lay classes, repeated same-class pieces, shoes, overlaps, tiny/low-confidence masks, SHA, duplicate rollback, source ownership and crop review.

## Unfinished acceptance (must remain HOLD)

1. No measured live automatic SegFormer detection precision/recall on a licensed photographic multi-garment **flat-lay and person-worn benchmark**. No proof three pieces automatically separate with the model on-device. Human fallback meets three-piece photo journey only.
2. Same-label overlapping jackets over shirts, clothes partly hidden, near-touching shoes, and disconnected garment pieces can be ambiguous. No fabricated back surfaces or 3D readiness; require confirmation and/or additional pictures.
3. Cloud backup/RLS and account isolation were authenticated browser fixtures plus actual per-owner IndexedDB, **not real signed Supabase production or cross-device cloud restore**.
4. No physical Android/iPhone hardware acceptance, WebKit three-width completion, or human visually-certified mask contours. Browser screenshots are genuine Chromium with touch/mobile emulation.
5. Original `openPhotoCrop` has an approximate 12MB data-URL limit; large raw JPEG imports may need a reduced inference preview or separate supported crop workflow. The full original must never be rewritten to satisfy this.
6. No cross-branch merge with #564/#565/#566. Main controller must decide integration after verifying their exact final SHAs.
7. Existing older narrow research CI guards may fail on this new branch because it **deliberately** changes `public/outfit-capture.js` and `public/outfit-worker.mjs`; do not weaken those independent guard checks. The dedicated `multi-garment-capture-01-no-deploy.yml` workflow is authoritative for this isolated feature.

Run exact HEAD: `node scripts/build.mjs && node --test tests/*.cjs tests/*.mjs && node scripts/test-multi-garment-capture-01-browser.mjs` with pinned Playwright/sharp/fake-indexeddb dependencies in the dedicated GitHub Actions container. Never report a CI success for a SHA it did not test.
