# Closet Current — Correct outerwear placement when styling a new garment

**Feature branch only. Do not merge, deploy, update live database or change hosting while private pilot security remains unresolved.**

## Real customer problem

After saving a new garment, **Style this** should combine it with already owned clothes and show it in the right model layer. Previously all Outerwear anchors were placed in the sweater/over-shirt layer, including jackets, blazers, coats and raincoats. This conflicted with My Closet, Whole Outfit capture and the outfit-board system, which have distinct layer, layer2 and layer3 slots.

## Expected garment mapping

- Cardigan, Vest: layer (shirt/sweater layer).
- Jacket, Blazer and other outerwear except coat types: layer2 (jacket).
- Coat, Raincoat: layer3 (outer coat).
- Tops, bottoms, shoes and dresses retain their original slots.
- Pinned jackets and coats exclude dress tops because the dress hides layers. A pinned new item appears **exactly once** in every result; it is never silently substituted.
- Optional inner layers for pinned jackets/coats use owned shirts, sweaters, cardigans or vests only, never another jacket masquerading as a sweater.
- A chosen garment stays included even when its season or type conflicts with an occasion, with the existing caution. Missing/reclassified items fail closed.

## Verification and unchanged boundaries

Run all Node regressions, scoped source integrity, localhost synthetic-wardrobe Android Chromium/iPhone WebKit production-script emulation and runner-local Supabase security tests. All real source photos remain untouched: original high-resolution recognition before clipping, cloud account ownership, staging Access source, hosting and production workflows are byte-identical to parent PR #170.

Only public/closet-stylist-engine.js application decision logic changes; no users, paid AI, live database, production deployment or real photos are involved.

**External blockers remain:** 0/2 actual physical phone evidence; 0/24 independently reviewed untouched originals; recognition accuracy unmeasured; separate Access-protected staging not operational. Pilot/production promotion BLOCKED.
