# Closet Current Mission 1 P802 — SOURCE-original owner box + point -> local color mask preview (experimental)

**FAMILY ALPHA HOLD #255; ISOLATED DRAFT, NO MERGE, NO STAGING/PRODUCTION DEPLOY.**

## Purpose

P800 [draft PR #801](https://github.com/nickhaney916-lang/Closet-Current/pull/801)
already captured a SHA-verified owner-drawn ORIGINAL-source rectangle in native
Adjust, but intentionally produced no mask. This P802 step adds an actual
**source-pixel-derived**, ephemeral, bounded on-device preview seeded by BOTH
that P800 rectangle and a separately SHA-verified P798 garment point. This is
**NOT SAM2**. No AI classifier, verified exact garment polygon, learning
from a real human, cloud inference or automatic category/type/color selection
has been added. P799's 22/23 publisher-ORACLE box experiment cannot be treated
as user-box accuracy.

## Explicit isolation and privacy

- Original JPEG stays unchanged. Before pixel computation, P798 recomputes
  original byte SHA-256 and verifies the still-active owner/session/draft.
- A separate original-photo garment seed inside the same verified box is
  required. Box alone cannot generate a preview; invalid owners, SHA, source ID,
  dimensions, source pixels and off-box point are rejected.
- A local RGBA thumbnail is capped at 512x512 pixels (262,144 pixels). A
  deterministic seeded, four-connected color-threshold region is computed
  inside the original-source box and drawn in a disposable in-memory overlay.
  This is a simple **color-only heuristic**, prone to leaking onto similar
  background colors and missing textured/differently colored garment regions.
  It does not predict a garment category, subtype, true boundary or color.
- No bytes uploaded to a third-party model or cloud, and NO private mask
  persistence, auto-approval, automatic saved garment, original JPEG mutation,
  user account policy change, model asset or production change.
- Feature gated on explicit research flags:
  `mission1OwnerPoint798=research&mission1OwnerBox800=research&mission1OwnerMask802=research`
  together with existing native reviewed capture and source permissions.
- Clear point, clear box, clear preview, dialog disposal, owner/session change,
  or draft replacement invalidates the on-screen region.

## Required verification (not claim until exact final-head CI is green)

- Target Node tests: SHA-verified real public JPEG owner/source/seed receipts,
  entirely synthetic pixel-region baseline, false owner/sha/dimensions,
  resource bounds, inconclusive zero-region fails closed, no-save/no-network.
- Full repository Node + build regression (not only a new unit test).
- Real automated Chromium and WebKit, frozen original-JPEG SegFormer capture to
  native Adjust: point and box then local in-memory color mask on the real
  original JPEG pixels, discard, keyboard rectangle, manually confirm supported
  subtype/color, private fixture-indexedDB save, duplicate rejection and no
  unexpected outbound source upload.
- **Automated Playwright is not actual independent humans or physical phones.**
  Local color-region UI isn't a validated SAM2 pipeline, SAM2 runtime mobile
  safety, genuine host auth/RLS, double-blind human segmentation-quality
  evidence, commercially cleared unseen photographs, or release acceptance.

## Next Mission 1 blockers

1. Replace or supplement color baseline with truly owner-box-prompted,
   locally/private SAM2-style segmentation with measured physical device
   resources and precise, source-bound mask correction/approval.
2. New rights-cleared genuinely unseen source JPEG corpus with **two separate
   blinded human** polygon/category/subtype/color assessments and measured
   precision, recall, boundary, duplicate/multi-garment behavior.
3. Real Android Chrome/iPhone Safari and signed two-owner hosted cloud
   privacy/restore review before an explicit release decision.

**Mission 1 still NOT 100% complete. FAMILY ALPHA HOLD #255 stays OPEN.**
