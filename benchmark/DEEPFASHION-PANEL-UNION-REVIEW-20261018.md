# Same-category panel union review, not automatic garment assembly

Real source-RGB overlays identified separate trouser-leg masks for a single
pair of jeans (`validation-0017`) and separate sleeves and body panels for
one black jacket (`commons-0065`). These predictions have **zero substantial
pairwise mask IoU** yet may still be ONE physical piece of clothing.

An experimental category-union preview now combines same-category model
panels into a single side-by-side visual for reviewer comparison, preserving
their underlying source pixels and original untouched RGB.
The preview reports unique foreground pixels versus sums of all proposals,
including any duplicated/overlapping pixel area.

**Do not interpret model-only union previews as clean garment masks or
independent physical instance verification.** The union can accidentally
include multiple similar clothes, inner layers or background and might
hide genuine separate garments. It neither changes the source image nor
creates/saves any customer item.

Pixel-level comparison requires approved independent outlines before
any union algorithm can be used in customer clipping.
