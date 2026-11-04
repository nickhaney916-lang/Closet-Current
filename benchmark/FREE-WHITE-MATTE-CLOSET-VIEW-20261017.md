# Free closet hanger transparency (October 2026)

**Problem:** The universal hanger/shelf carousel has a correctly styled 2D rail and hanging hardware, but the existing display tiles have an **opaque light rectangle behind the garment**. Even genuine white-background isolated clothing therefore looks like a floating photo card instead of hanging clothes.

**Implemented without paid models:** `public/closet-white-matte.js` removes only strictly **plain-white exterior background** pixels connected to the border. It refuses real scenes, beige/colored studio backgrounds, white or faint apparel, garments near an image edge and too-small regions. White prints fully enclosed inside a colored garment are preserved. No inference or reconstruction; the display-only alpha mask is applied to the original-resolution RGB as the browser renders the 280×340 closet preview. Performance: <= 320-pixel preview for matte decisions; no cloud or source photo writes. The original photo and classification/crop images remain unchanged.

**Works for all categories:** shirts, bottoms, dresses, outerwear, shoes and accessories if a safe white-background clip exists. If it doesn't, the existing centered tile remains unchanged. Does not alter user actions, filters, sleeve categories, drawer swipes, try-on or photo capture.

**Result boundary:** This creates transparent backgrounds on appropriate existing source images, not a new true unfolded shirt silhouette. Still requires actual phone/hanger visual review to confirm it produces an obvious improvement on the real saved clothes. As always, only the experimental draft PR is modified; no FASHN services, paid calls or Supabase project changes.
