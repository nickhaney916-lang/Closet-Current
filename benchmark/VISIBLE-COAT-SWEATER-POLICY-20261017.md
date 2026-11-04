# Visible coat + sweater rule — October 17, 2026

**User intent:** Don't pursue concealed clothes or small accidental glimpses. Do recognize genuinely visible multiple clothing items in a full-outfit photograph, e.g. an open coat exposing the sweater's torso. A customer photographing just a coat intentionally should not have an underlying garment proposed, even if some fabric appears at the edges.

### Rules
1. **Single-item mode:** Focus on the intentionally photographed garment. No hidden-layer proposal, no "Top — is this right?" extra confirmation.
2. **Full-outfit mode:** Two items may be *proposed for evaluation* only if each has its own original-photo-matched, category-consistent garment mask, high classification confidence, negligible overlapping claimed pixels, and a substantial exposed area of the sweater in the coat's central torso.
3. **Only collar, cuffs, or tiny fabric glimpse:** Ignore as a separate inventory item. It may remain visible in the source photo, but no second wardrobe entry should be produced.
4. **Duplicate mask or shared jacket/shirt/dress box:** Do not create separate items, even if confidence appears high.
5. **Customer UI:** No new buttons, hidden garment questions or type/sleeve forms. Preserve normal "Adjust" when recognition fails. Keep source photo and only automatic categorization of reliably recognizable, visibly intended garments.

### Current implementation
`benchmark/clearly-visible-layers.mjs` and `tests/clearly-visible-layers.test.mjs` encode this policy with preliminary visible-area checks on synthetic mask scenarios. This is a **review-only test rule**, not a production model capable of splitting overlapping garments. A prior 3-photo object-box experiment repeatedly mislabeled the same image as jacket, shirt and dress. The real segmentation model still lacks distinct shirt/jacket masks, so second-item automatic saving remains disabled until independent masks, annotation-based measurement and real phone tests validate the behavior.

This decision supersedes the earlier speculative hidden-underlayer proposal. Live Closet Current app and Drive Duel are unchanged.
