# P176 saved photographed shirt and jeans 3D integration

P176 is a research-only extension of verified P175. It opens an existing owner-saved shirt+jeans row read-only, verifies the original shirt and CC0 jeans SHA-256 values, and attempts the exact existing native 163-bone WebGL garment path. Unknown owner photos stay in the source-preserving 2D fallback.

A first real WebGL run correctly failed closed at P60: the completed pants mesh had an out-of-range skin index. A disposable P541-worktree patch now repairs only out-of-range indices whose matching skin weight is exactly zero. It checks the generated pants shell and repeats the check immediately before P60, because later garment modifiers can reconstruct attributes. Any out-of-range index with a positive weight stays rejected. The patch changes no positions, weights, source image bytes, material, or upstream P541 commit.

The WebGL pair is not accepted until P60 validates finite skinned geometry, triangle buffers, 163-bone binding, and normalized weights. P176 tests saved source identity, board immutability, account isolation, actual viewer opening/closing, and 320/390/430 CSS-pixel screenshots. WebGL on CI uses Chromium/SwiftShader, not physical phones. The 2D original-photo fallback regression covers Chromium and WebKit.

P176 adds no new dress or denim shape corrections. It does not certify collision, independent human appearance, photorealism, physical-phone quality, or hosted signed RLS. Private/unverified garments remain 2D. Production and staging are untouched; Family Alpha remains HOLD.


## Visible skirt drape correction

The exact P61 dress function was then tuned in the same disposable donor worktree: side/rear skirt relief increased from 18 mm to a 32 mm maximum, gravity-biased hem drop increased from 6 mm to 10 mm, and the fold cadence changed from 7 to 9. The total displacement remains bounded by the existing formula and is restricted away from the source photograph's protected front. Vertex normals are recomputed after the position changes so lighting follows the new physical surface. This leaves the original photo, UVs, rest coordinates, skeleton weights, and material unchanged. The WebGL before/after and P61 displacement receipt will determine whether this is visually useful; collision and independent human appearance remain unverified.
