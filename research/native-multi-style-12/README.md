# NATIVE-MULTI-STYLE-INTEGRATION-12 — isolated original photograph to genuine owned styling (HOLD)

Main controller priority #12. **Research only, never merge, deploy, modify production, or release Family Alpha issue #255.**

## Sources and scope

- Exact parent **PR #568** combined native Style + owner correction, final source SHA `058aeda3c46303e481d6c84223bae6a2464667fd`, dedicated full/fast CI SUCCESS on exact HEAD.
- Exact donor **PR #567** independently tested multi-piece capture, SHA `e4341aa99e0652d70ac2e747ee7750f46c54a0b3`, dedicated CI #41774195498 SUCCESS.
- Cherry-free isolated Git-tree imports of eight identified #567 source files onto #568; no modification to either donor, main, auth, cloud, 3D geometry, Supabase, Drive Duel or Delta Ebb.
- Feature gates: `multi24=research&captureProof01=after&index04=after&nativeIndex07=research&nativeLossless04=research&styleOwned03=research&nativeCorrection10=research` (plus optional `restoreAtomic01=research&index02=after`).

## Fixed integration defect

Prior Style intentionally refused `singleGarmentVerified:false`. For a REAL human-reviewed visible crop from a multi-piece original this is the correct source flag, but an invalid eligibility check would leave all the separately indexed pieces unusable for outfits or ask the user to incorrectly certify that the entire original image contained only one clothing item.

`reviewedVisiblePiece12()` admits the specifically human-confirmed category + subtype + cropped visible region to **2D source-derived styling only** when it retains owner and original unmodified JPEG SHA, canonical sourceRegionKey, explicit confirmation, crop bounds and photo-only gate. The native private style reader independently verifies the complete original JPEG SHA, uses the **cropped visible JPEG only as a display thumbnail**, never claims the original was a singleton or that the crop has fitted 3D geometry. Any failed region/source/owner proof is rejected, not offered the false singleton checkbox.

Original multi-piece atomic owner save now rejects `itemType:Unknown` before saving and also checks subtype in the actual review UI. All piece IDs and V4 backup metadata remain unchanged.

## Actual browser acceptance

`scripts/test-multi-garment-capture-01-browser.mjs` tests the original native Closet Current UI with genuine CC BY-SA 2.0 person-worn photo by Rasmus K. Kristiansen (SHA `e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff`), original capture and manually cropped three visible garments, genuine owner-specific IndexedDB transaction, duplicate reimport rollback, private indexed closet, three real saved garment IDs, actual native Style pinned **one** fully owned look (honest shortage; not three synthetic looks), native saved outfit and atomic V4 backup/restore, logout and second owner. Uses Chromium and WebKit at widths 320/390/430. True browser screenshot SHA, dimensions and nonblank visual audit saved in artifact, with 60 PNGs and 6 multi-stage galleries as test targets. `scripts/audit-native-multi-style-12.mjs` independently checks exact evidence.

Main integration #11 and its existing original source-correction browser suites remain in regression. Native saved clothing edits retain CAS and preserve outfit references. Protected production/research donor files are asserted unchanged.

## Remaining gates, not represented as completed

The simulated signed-in HTTP fixture is **not real Supabase signed A/B RLS**. This is not physical Android/iPhone camera/WebGL testing, automatically measured SegFormer multi-garment photographic precision/recall, generic source-fitted skinned 3D geometry or 10/10 cloth visual certification. Original 3D photo-only fallback stays correct, and Family Alpha remains HOLD. Independent older single-purpose workflow guards can fail by design on a combined branch; the new dedicated integration workflow is the authoritative isolated acceptance gate.

Never claim completion until exact-HEAD dedicated workflow succeeds and original mobile screenshots are visually reviewed.
