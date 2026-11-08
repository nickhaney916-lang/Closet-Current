# Closet Current Main Priority 176 — saved photographed shirt + denim (HOLD)

## Scope
P176 extends the source-verified native saved-outfit acceptance from one photographed garment to an actual two-piece shirt-and-jeans board entry. It uses pinned P541 source fitting, the locked CC0 jeans donor JPEG (SHA-256 `b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c`), locked photographed shirt SHA-256 `cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64`, and the existing 163-bone model. Viewer remains read-only; this priority adds no physical geometry or arbitrary owner-photo fitting.

## Acceptance run
The no-deploy workflow seeds an existing owner-saved board containing both items, opens that row through the native builder, verifies both live original source receipts, confirms `shirt-pants` mode / 163 bones / two rendered meshes / no fallback, captures front/side/rear at 320, 390, and 430 CSS px, rehashes every PNG, and confirms the native saved board and image identities are unchanged. Unvetted jacket, coat, shoes, missing or changed sources remain original-photo fallback. Chromium uses real WebGL through SwiftShader; this is browser evidence, not physical-phone approval. Full inherited Node regression and unchanged Chromium/WebKit 2D fallback suite run in parallel.

## Limits
This validates original photographed source identity and complete two-piece viewer wiring. The pinned denim renderer's physical drape path is exercised, but this acceptance does not independently measure its deformation vertices, collision, or body intersection. No fabric simulation, real phone, live Supabase RLS, private-owner photo reconstruction, human photorealism approval, production/staging deployment, merge, or Family Alpha release is claimed. Family Alpha remains HOLD.
