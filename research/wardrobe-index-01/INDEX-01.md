# INDEX-01 — Private wardrobe categorizing and indexing (research-only, HOLD)

## Why now
Closet Current must organize each garment as accurately as it captures it. An attractive 3D outfit built from incorrectly indexed clothing is not useful. This indexing priority supports the user's existing saved closet and prepares a reliable source for Style My New Clothes, 2D/3D outfit slots, and category browsing. It is not an improved vision model; it does not claim to automatically recognize ambiguous garments.

## Scope and safety
- Read the authenticated, account-scoped saved wardrobe snapshot supplied by the existing per-user IndexedDB/cloud adapter. No global storage or production database writes.
- Use the actual public/local-catalog.mjs clothing classifier vocabulary for known category and item type choices. Maintain Tops, Bottoms, Dresses, Outerwear, Shoes, Accessories, Uncategorized.
- Deterministic category, exact subtype, color, season, sleeves, natural-language search and 2D/3D outfit-slot facets. Queries return stable saved garment IDs only.
- Never let proposed localChoices, stale model results, image filename, or an item name override user-corrected garment type/category. Unknown and cross-category types go to review instead of guessing.
- A skirt stays Bottoms, ankle boots stay Shoes, dresses are one piece, and unknown outerwear does not become a coat automatically.
- A multi-garment outfit photograph can yield distinct cutout photos from one shared original SHA. Only independently verified original SHA + same cutout SHA (or confirmed one-garment capture) justify an exact duplicate rejection. Unproved same-source collisions require review, not deletion.
- Reject owner IDs that disagree with the authenticated owner on every record. Queries require the authenticated owner on every call. A logout/account change fails closed even while readAll() is pending.
- Index no original JPEG/image bytes, base64, or external image URLs. No external network calls or telemetry. Keep original closet records unchanged.
- Rebuild immutable metadata snapshots after any save/edit/delete/import/cloud restore. If rebuild fails, do not mutate existing snapshot or original saved wardrobe.
- Read-only integration bridge exports refresh(), browse(), preview(), clear(), accepts authenticatedOwner() and readSavedItems() from real app; the research integration is not wired into or deployed on production.

## Acceptance
- Test with node --test tests/wardrobe-index-01.test.mjs using the actual repository classifier vocabulary. Cover 1,500 garments, stable typed facets/slots, two separate owner accounts, text search, review flags, source hash duplicate vs cutout differences, unknown/unverified sources, image privacy, edit/delete/restore reindexing and logout during async read.
- Dedicated no-deploy GitHub Actions for this branch. No production merge, deployment or policy relaxation. Family Alpha issue #255 remains HOLD.

## Independent development
Based on main 39deed987afe2e5668d64e145835ad43ad14c7be. Separate from photographed-denim PR #535 and the garment-fitting chain; never touch Drive Duel or Delta Ebb.

Next after independent INDEX-01 acceptance: INDEX-02 real signed-in mobile/UI category browsing and actual-photo recognition benchmark; propagate a user's corrections to 2D/3D outfit selection, and require human review when classification or duplicates are uncertain. Release/physical phone and human visual acceptance remain pending.