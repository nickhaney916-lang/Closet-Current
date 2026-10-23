# Verified outfit to humanoid integration matrix (research only)

## Current evidence
- Draft PR #245 maps a previously verified `selected[]` and RGBA `colors` payload to the procedural renderer color contract; Node CI run #40010091016 passed.
- PR #231 verifies source identity/version, selected item IDs and owner scope through a caller-supplied verifier. **That callback must be backed by authenticated storage in live code**; client-supplied owner fields are insufficient.
- PR #232 is a separate avatar research branch. Its `bridgeSavedOutfit` validates image headers and derives a noncryptographic FNV signature, **not** the same SHA-256 original-source verification and authenticated ownership contract as PR #231. Do not substitute one for the other.

## Slot compatibility
| Slot | Verified board bridge (#231) | Research humanoid (#232) | Integration decision |
| --- | --- | --- | --- |
| top | Tops or Dresses | Tops or Dresses | Dress top maps to renderer `dress` only after verified source |
| bottom | Bottoms | Bottoms | Preserve for non-dress outfits |
| shoes | Shoes | Shoes | Preserve |
| layer | Outerwear | Tops/Cardigan/Vest or Outerwear | Keep stricter verified category; reject unsupported garment rather than silently relabel |
| layer2 | Not supported in current verified board bridge | Outerwear jacket/blazer/raincoat/coat | HOLD until original-photo + account verification covers this slot |
| layer3 | Not supported in current verified board bridge | Outerwear coat/raincoat | HOLD until original-photo + account verification covers this slot |

The color contract recognizes layer2/layer3 **only if they appear in a verified selection**; current #231 does not produce such a selection. Never fabricate source verification for additional layers.

## Release blockers
1. Authenticated owner-scoped storage must supply and recheck every garment ownership decision on account switch.
2. Preserve normalized original JPEG source identity/version; do not equate a crop, noncryptographic FNV value or editable ownerId with source provenance.
3. Combine verified selection and renderer in an isolated integration fixture, with dress/layer, swap, source-change and account-switch regressions. Keep 2D fallback.
4. Test WebGL context loss, browser support, rotation and physical-phone memory/performance; current Node CI does not cover these.
5. Do not claim fabric textures, exact patterns, fit, side/back authenticity or photo-realism from procedural solid colors.

No customer images, paid AI, production deployment or backend mutations were used for this audit.
