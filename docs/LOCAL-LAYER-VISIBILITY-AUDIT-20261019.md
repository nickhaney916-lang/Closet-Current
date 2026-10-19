# Closet Current — visible garment-layer accounting

Date: October 19, 2026. **Main development chat**, stacked on [PR #50](https://github.com/nickhaney916-lang/Closet-Current/pull/50). The parallel Work session independently owns creation/licensing of two high-resolution figures, and was not changed.

## Problem
The fitting view reports how many garment image layers successfully decoded and were placed onto a figure, but a perfectly opaque jacket may cover a selected shirt. This count is technically correct yet can make the customer think the styling engine failed to include their shirt. The correct outcome is to retain the outfit and calmly clarify the visual overlap, not invent exposed fabric.

## Implementation
- `public/local-layer-visibility.js` is an offline/browser-local 160×297 **temporary alpha-matte diagnostic** using only the already-approved, decoded, fitted clothing layers and their actual calibrated rectangles. It processes at most six layers (≤60k sample pixels each), using correct back-to-front Porter–Duff-like accumulated alpha transmittance.
- `auditAlphaMasks` measures each piece's remaining visible fraction beneath higher clothing layers; it reports `mostlyConcealed` only if **less than 3% of that layer's visible alpha remains**. Empty or invalid masks do **not** turn into confident occlusion results; invalid canvases skip the entire diagnostic.
- The renderer runs the diagnostic on decoded local PNGs before its atomic commit. In the limited almost-fully-concealed case, it adds a neutral note explaining that one or more selected pieces are mostly hidden by other clothing. It leaves the outfit visible, doesn't delete or reject the top, and doesn't alter the original high-res photo used for recognition/indexing before clipping.
- Transparent-center jackets leave the shirt underneath visible and do not trigger the warning. Face overlays, hands, hair, anatomy or production figure occlusion are not measured. CSS-only contact shadows are intentionally excluded from the alpha visibility calculation.
- The auditor uses **no network, no uploads, no per-outfit AI API calls, no disk/cache writes** and keeps its pixel buffers transient. Errors fall back to existing behavior.

## Verification & limits
Node tests cover fully opaque over-coat, open-jacket transparent center, partial-alpha blending, z-order, transparent/invalid samples, immutable original pixels, privacy and disabled AI provider flags. Chromium Android / WebKit iPhone **browser emulation** tests a real DOM local figure preview with a synthetic closed jacket over shirt, the resulting status warning, then removing the coat and clearing the warning.

This is **not** physical fit, fabric deformation, body-part occlusion, a real-photo segmentation pass rate, independent market-quality realism or proof of use on actual phone hardware. The original three licensed garment photos and the extended Work source-mask research remain on HOLD. The two development figures remain low-res and not yet commercially approved. No merge, deployment, purchases or Drive Duel changes.
