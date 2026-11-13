# Mission 1 P863 — Never infer clothing identity from mask alone (RESEARCH HOLD)

**Family Alpha HOLD #255 OPEN. DRAFT / UNMERGED / UNDEPLOYED. No Family Alpha invitations.**
Strict immutable parent: [Mission 1 P862 PR #1021](https://github.com/nickhaney916-lang/Closet-Current/pull/1021) exact verified `e42cf5955a25df34837a16d71dfba17c39951a64` ([P862 NO DEPLOY 2/2 SUCCESS](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43482305624); 552/552 inherited native, 18/18 focused). The separate historical `32`-public-photo default-model legacy benchmark remains **RED: 5 public boot Unknowns/10 strict assertions**. It must not be weakened or described as fixed.

## Real source bug (not model accuracy)
P862 correctly stopped mask-only category fallback from declaring `Unknown` a strong subtype, but the fallback in `public/recognition-engine.mjs` still accepted a high-confidence garment segmentation hint even if **both entire FashionCLIP clothing-score views contained only nonclothing negative prompts**. `garmentCategoryTotals` simply excluded Uncategorized labels, so `[a,b].every(!supported(...))` was vacuously true. That produced a false positive broad garment suggestion (e.g. Bottoms/Unknown from a blank wall), despite zero corroborating clothing model evidence. A mask by itself is not independent original clothing identity.

## Scoped correction
- Only permit a non-strong, owner-review-only broad category from a high-confidence, single-category mask when **both** full-catalog recognition views independently rank that same garment category first, provide bounded category support (>=.25 relative model vocabulary score), and score it above the total negative/nonclothing score. Any absent/conflicting category, nonclothing-dominant view, unreliable mask or incomplete visibility remains **unclassified**, with no `identified` event or auto-save.
- Retain P862 `strong:false` for `Unknown`; genuine two-view subtype agreement and the existing P838 risky type owner-review guard remain unchanged.
- Tests are synthetic software contract checks, not human truth, actual signed owner photos, empirically calibrated probabilities, or a claim of improved real photo accuracy. The numeric support gate is conservative research-only and requires independent evaluation before deployment.
- Update prior tests that previously allowed unsupported negative-only category advice; add adversarial two-view model/mask disagreement and unchanged strong sneaker tests. All inherited owner/privacy/original JPEG/physical unit/source lease constraints remain.
- Dedicated NO DEPLOY CI must verify exact P862 parent and 6 allowed paths, all native, browser owner review and inherited camera path. Public real-photo historical benchmark must remain separately reported with its actual status.

## Incomplete external acceptance
No new 60+ genuinely independent source-disjoint human-reviewed labeled original photographs, measured hard-boot recognition improvement, witnessed mobile Android/iPhone, certified signed-account hosted RLS/cloud or owner-approved pilot is established. The P851 release evaluator must stay BLOCKED. Scientific claims restricted to passing software acceptance when exact-head results are observed.

## CI
Exact P863 HEAD job results **not claimed** until observed.
