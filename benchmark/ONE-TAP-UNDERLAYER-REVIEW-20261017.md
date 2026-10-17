# Underlayer detection — removed from experimental user flow

**Decision on October 17, 2026:** Do not hunt for concealed or accidentally visible garments behind the item the customer intentionally photographed. The prior one-tap speculative Top fallback has been removed. A user who wants to catalog an underlying shirt should expose it and photograph it deliberately.

### Simple capture contract
- Single-item photo: recognize the clearly photographed foreground garment. Do not invent hidden layers.
- Whole-outfit capture: index distinctly visible pieces supported by actual segmentation and classification evidence; physical separation remains a prerequisite.
- Unknown or blocked identity: retain the photo in review with the existing Adjust action, without guessing a Top or automatically adding another item. No special underlayer question or extra flow.
- A confident jacket stays Outerwear; explicitly recognized visible Tops retain ordinary auto-save when all existing checks pass.
- Keep sleeve type, garment style and other detail corrections optional where feasible.
- Original photos remain intact. No duplicate closet entries from an incidental glimpse of another item.

This decision removes the previous `underlayer-review.js` experimental module and Yes/Change special-case controls. Do not spend mobile inference time pursuing concealed underlayers. Later work should improve recognition of the **visible intended target** instead.

No deployment to the live app, and no Drive Duel modifications.
