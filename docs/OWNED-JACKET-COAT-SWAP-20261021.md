# Closet Current — One-tap jacket and coat swaps inside owned outfit suggestions

**Development-only change.** Based on verified draft PR #172 (SHA `53fb6a4e32a33c1f55ccac256c28a003185fd63b`). Do not merge to production `main`, deploy, change billing, cloud Auth/Storage or Drive Duel.

The customer can now tap **Swap jacket** or **Swap coat** inside an outfit suggestion. The swap is preview-only until **Save outfit**. It changes exactly one saved garment, without modifying clothing photos or removing top, bottom, shoes, additional layers or a pinned new item.

The choices are strictly by the existing slot taxonomy:
- `layer2`: a different **Jacket, Blazer** or other cataloged jacket-class outerwear only; never Cardigan/Vest/Coat/Raincoat.
- `layer3`: another **Coat or Raincoat** only; never Jacket/Blazer/Cardigan/Vest.
- `layer`: existing separate sweater/over-shirt choices, never an incorrectly categorized jacket or coat.
- A pinned "Style this" jacket or coat is not swappable and remains in every proposed look. A category-changed, deleted, stale or same-ID/different-original-photo source is invalidated instead of silently swapped.
- Each swap preserves every other existing board slot (even optional layers), keeps already-owned item IDs unique, and never saves until the user explicitly taps Save. Removed photos or incompatible seasonal garments do not reappear from swap history.
- New 50px accessible buttons are shown only if at least one valid owned replacement exists; otherwise no inert button.

**Verification:** Node unit regressions, real customer code in Android Chromium and iPhone WebKit **emulators** on localhost with synthetic source photos, including button -> preview-only swap -> Save outfit -> Preview on model. All externally attempted fonts and public trend fetches are blocked. Existing pinned/swaps/garment original-first photo code, live cloud/DB, staging source, paid-AI and production workflows are preserved. CI also runs entire Node suite and 207 runner-local disposable Supabase HTTP tests.

**Unresolved:** actual physical phones 0/2; independent original-photo recognition review 0/24; real recognition accuracy unmeasured; private staging deployment and Access not independently verified. No release authorized.
