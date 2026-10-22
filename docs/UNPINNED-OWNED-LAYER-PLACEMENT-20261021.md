# Closet Current — Correct automatically suggested sweater, jacket and coat layers

## Actual customer defect resolved on draft development branch

The previous **Style my closet** matcher placed an unpinned Jacket, Blazer, Coat or Raincoat in the same first optional sweater/over-shirt slot. That conflicted with the My Closet clothing figure and outfit board, which have independent shirt/sweater (layer), jacket (layer2) and long outer-coat (layer3) positions.

The new matcher assigns:
- Shirt-like layering pieces (long-sleeve over-shirts/sweatshirts) and Cardigan/Vest → sweater layer.
- Jacket/Blazer and other Outerwear excluding Cardigan/Vest/Coat/Raincoat → jacket layer.
- Coat/Raincoat → outer-coat layer.

**Automatic outfits use at most ONE optional outerwear or sweater piece per recommended option.** Users can still build more involved outfits manually on the existing four-level outfit board. This prevents false visual stacking or placing jackets into sweater positions. A user-selected, pinned jacket/coat retains its correct unique slot and can optionally pair with a real lighter underlayer, never another jacket pretending to be a sweater.

The matcher ranks only clothing owned by the current closet account, preserves pinned original items and source identity, avoids garment duplication, handles dress outfits without bottoms/layers, and omits seasonally unsuitable optional layers in Summer/Activewear. Partial outfits never pretend missing items are owned. Winter coats remain eligible for Winter looks, not Spring and Summer when not pinned. The trend library is applied to known item types without inventing ownership.

## Evidence and restrictions

Unit regression tests exercise unpinned mixed cardigans/jackets/coats, multiple jackets, Winter/Summer/Activewear, dresses, anchored coats, unique item IDs and zero user-photo mutation. Android Chromium and iPhone WebKit emulation runs actual customer `Style my closet` → `Preview on model` with fabricated SVG photo tiles on a localhost-only server, blocking all external network traffic. Full Node tests, existing pinned-jacket browser tests, staging synthetic Access checks, and 207 runner-local disposable Supabase HTTP checks are required. Local loopback tests do not establish true physical phone behavior or recognition accuracy.

This branch must never create paid resources, write to Supabase hosted projects, deploy to Cloudflare, change the GitHub production deployment, modify Drive Duel, or touch real clothes/photos. Original high-resolution photo recognition before crop and cloud account isolation are preserved byte-for-byte. No real hosted staging readiness claim.

**Unresolved release gates:** actual physical devices 0/2; independent original-photo review 0/24; real model accuracy unmeasured; real protected staging and Auth/email not yet independently verified. No production/main merge; pilot/release remains BLOCKED.
