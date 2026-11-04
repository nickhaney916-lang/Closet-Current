# Universal closet rack + normalized display presentation (October 17, 2026)

**Latest user direction:** The swipe-able closet browsing experience belongs to **all categories**, not just Shirts. Grid mode remains available. Browsing categories already exist; no separate gallery page or new top-level tabs.

- Tops, coats and dresses appear on simple 2D hangers under a rail.
- Pants, shorts and skirts appear on clip-style hangers.
- Shoes and accessories use a shelf-style presentation. Unsorted pieces can still be viewed without guessing their garment type.
- **Grid / Closet view** switch is inside the existing closet collection, and touch-native horizontal scroll with snap allows browsing. Previous/Next large controls aid accessibility. Existing clothing actions and category filtering remain available.
- Browsing all can mix the support styles without forcing a new wardrobe category. A single display-mode state is used for all clothing sections.

## Normalized display asset 2A
`public/closet-tile-engine.js` creates an ephemeral, centered, letterboxed **display-only** raster from the saved original image, with optional bounded white-margin trimming only when it has strong visual support. It uses only source pixels and never fabricates garment shape, logo, unseen sleeve, back, texture or style. It does not write to the account, database, storage, try-on or recognition assets. On failure it falls back to the existing photo. This is visual consistency, **not yet generative normalization of a crumpled garment to a new unfolded silhouette**.

## Testing and release
`tests/closet-rack-tiles.test.cjs` covers all category presentations, preservation of records and aspect ratios, defensive trimming and asset gating. CI checks full build and existing closet logic. PR #7 stays draft until mobile browser preview, actual photo quality and memory/camera performance are verified. Do not modify Drive Duel.
