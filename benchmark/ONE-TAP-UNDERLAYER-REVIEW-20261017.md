# One-tap underlayer review — experimental (October 17, 2026)

User intent: **point and take a picture**, and never force sleeve-length or button-down-type decisions to store an item.

When one captured **outfit** region is broadly labelled 'upper garment' and the classifier does not identify a trustworthy type, the app's experimental branch now proposes **Top** as a category, and marks it *unverified* in the existing photo result card. The category is NOT silently auto-saved. The card simply says "Top — is this right?" with **Yes, save** and **Change**; no new dashboard or tab. One yes also confirms ownership and keeps the observed photo color; sleeve length, type, fit and pattern remain optional Unknown. If color is not available the customer uses Change to supply it. Confirming a possible duplicate is blocked.

Crucial boundary: current semantic class 4 cannot establish whether the photographed item is an underlayer or outerwear. A future instance/layer model may supply `layerRole:'underlayer'`. Without this signal the Top is strictly a *tentative question*, not an asserted layer. Known jackets with strong type evidence are not overridden. Missing, clipped, duplicate or conflicting evidence remains in review.

This requires ONE opt-in user tap only for uncertain captured upper garments; confident results keep their current behavior. No customer-facing main branch changes or Drive Duel changes until benchmark and test approval. Note: this does not automatically fix physically overlapping clothing—instance segmentation is still a separate unresolved requirement.
