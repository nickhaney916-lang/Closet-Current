# Family Alpha — reviewed transparent-cutout alignment, not fabricated fit

**26 October 2026 Pacific · issue #255 · visual improvement candidate · no deploy**

## User-visible defect being addressed
The new articulated 2D human in draft #320 still places the entire PNG bitmap inside a body slot. An approved transparent cutout may have large or lopsided invisible margins. Containing that full PNG instead of its visible clothing can make an actual saved shirt look tiny and floating or off-center even though the image is correctly transparent.

## Narrow positioning-only solution
- In `public/family-alpha-2d-photo-renderer.mjs`, `measureTransparentGarmentBounds()` samples **only alpha** from an **already-decoded, embedded data PNG** at max 144 pixels. It neither segments nor changes the mask, edits original pixels, sends a request nor touches owner-auth evidence. Existing reviewed cutout approval remains required upstream.
- `fitVisibleAlphaBoundsToSlot()` centers visible pixels on the figure's existing slot (shirt at shoulders/chest, bottoms at waist, shoes at feet). It increases scale only when substantial trustworthy transparency exists; it caps the size increase at **35%** to avoid destructive upscaling.
- Opaque files, JPEG originals, external image URLs, missing canvas, invalid/sliver bounding boxes, unsupported alpha or near-full-frame images use the **original contain geometry**. The original displayed HTMLImageElement is still `cloneNode(false)`; fabric RGB, borders, labels, patterns, transparency and intrinsic aspect ratio remain unchanged. This is **not** fabric draping, photo-matting repair or virtual tailoring.
- The change lives only in a development branch stacked on #320. Its existing source-pinned disabled Family Alpha build remains HOLD; the manifest continues to assert `visualQualityPhoneApproved:false` and `segmentationQualityPhoneApproved:false` with SHA-pinned artwork.

## Evidence boundaries
Synthetic Node tests check true visible alpha bounds, asymmetrical margins, non-stretch scaling, max zoom cap, fallback on JPEG/external/no-canvas and original-color non-modification. Chromium and WebKit at 320/390/430px exercise an actual transparent source PNG on the articulated DOM figure and confirm the garment becomes larger without changing its PNG source or intrinsic ratio.

**No real photo image inference or independent physical-phone visual acceptance is performed.** A shirt with 3D folds, jacket hanging open, manikin skin, fragmented garment, wrong mask or poor color still requires retrimming or rejecting the cutout during source-photo visual review. Work #30 owns that segmentation/quality research. A green test does not authorize release.

**Next visual acceptance gate**: Collect explicitly licensed varied originals and visually compare approved cutout on figure under realistic mobile screenshot; capture cases for collars, sleeves, pant legs, skirt, jacket, open coat and shoes; reject floating/tiny/face-covering or jagged/white-box overlays. Do not enable four-person staging until user approves real cutout/figure quality and account separation.

No backend/Cloudflare/Resend changes, no paid services, customer data, production, Drive Duel, merge, stage deploy or family invitations.
