# Closet Current — MAIN Priority #192: localized source-to-owner alpha continuity

**FAMILY ALPHA HOLD #255. Draft research only; no merge, deployment, hosted Supabase, shipping public app, existing staging, or private family-photo modification.**

## Parent and threat
Stacked on P191 draft PR #756 SHA `e8fb5e2abbe0c015c1cd9316afedd69bc4d13682`. Its P191 connected-component, global IoU and interior-hole checks are required and retained. The next risk is a localized missing-fabric slit: a vertical cut from the outside into a blouse, or a small interior tear, can leave overall overlap high, the garment in a single component, and the global hole percentage low. That can yield an attractive but wrong 163-bone garment fit.

## Implemented
- New pure, bounded, decoded-alpha P192 proof compares each robust contiguous original licensed blouse segment with the current owner-private PNG alpha at P191's at-most 192×192 sample. Does not trust a caller-supplied scalar, mask classification or SHA assertion alone.
- Segments narrower than 20px or 16% of the sample width are ignored to avoid pretending source neckline/strap negative space is cloth. Inside each genuine source segment, an 8% edge inset excludes harmless contour-boundary editing.
- Fails closed on a missing interior run at least 22% of a source row segment even on one row, or at least 10% of a segment on two consecutive rows. Ignores minor isolated pinholes and retains legitimate bounded outer contour adjustments. Requires adequate source core coverage.
- Called directly inside P191 verified original-source-vs-owner alpha admission, **after** the P189 PNG SHA, P190 source geometry, and P191 source identity/topology checks, so P192 negative evidence refuses admission to 3D before geometry alteration; it does not touch outfit/closet persistence.
- No private JPEG, PNG or mask pixels are returned to public state or logs. The returned proof only has numerical core-row/run information and explicit no-release/no-human-approval flags.
- Adversarial Node tests cover a background-connected slit, two-row small interior damage that could evade aggregate hole statistics, ordinary synthetic 4%-narrower source fit, tolerated single-pixel defect and malformed raster inputs.

## Required exact-head acceptance
No-deploy branch CI must prove exactly five modified research/test/CI paths vs P191 parent, pass focused P186–P192 regression suite, full repository Node regression suite and build, and real Chromium/WebKit 320/390/430 saved-owner-blouse/163-bone P191 inherited tests with 49 real SHA-verified screenshots per engine. A P192-specific adversarial negative case remains a deterministic real-pixel Node test; the inherited browser fixture exercises the P192 positive branch, not independent real-family-photo human segmentation.

## Unresolved limitations
This is a conservative local continuity gate for one pinned publicly licensed blouse using synthetic width perturbations and owner assertions, not a claim of arbitrary owner's garment segmentation, human-approved boundaries, 10/10 texture and drape, photographed rear, physical iPhone/Android acceptance or hosted multi-account Supabase/Auth/RLS. Unsupported masks remain original-photo/2D fallback. No release or deployment authorization.

**Family Alpha issue #255 stays HOLD.**
