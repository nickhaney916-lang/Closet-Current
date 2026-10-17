# Free default rack + one-item navigation, Oct 17 2026

When users tapped Shirts, Pants, Shoes or Dresses, category browsing previously opened in **Grid** despite the product goal of a swipe-through real closet. Also Next / Previous moved 76% of container width, so wide screen views skipped past multiple items. A full render after capture/edit/review reset the scroll to the first item.

Now: Category browsing opens in **Closet view** by default for every category (hanger, clipped hanger or shelf) with **Grid** a one-tap alternative. Add a clear `1 of 9` position indicator, bounded Previous/Next buttons that move to exactly one adjacent card, and stable active item restoration by item ID across rerenders. Category/filter changes reset appropriately instead of unexpectedly restoring the previous category's item. Still no 3D, no extra navigation tab or new garment data.

The feature uses normal browser layout calculations, scroll-snap and source-safe tile previews. No paid AI, no API calls, no Supabase, no migrations, no live deployment. Tests cover narrow and wide measurements, removed items, first/last bounds, and unchanged categorization. Actual mobile touch visual check required before PR merge.
