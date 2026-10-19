# Independent ten-photo first-reviewer packet — verified checkpoint

**Source:** successful pinned real-instance benchmark [39194870053](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39194870053). Ten original JPEGs with fixed SHA-256 hashes, attribution and licensing were already audited.

## What changed
- New `scripts/build-blind-physical-review-packet.mjs` constructs a **separate, model-blind offline reviewer packet** from the existing unchanged source archive. It verifies all ten JPEG bytes/hashes before writing any output, checks that the reference source is still unapproved, refuses partial/duplicate/mismatched cases, and copies ONLY original JPEG photos and standalone offline tools.
- Deliberately excludes **all** AI proposal masks, overlays, model class guesses, photographer garment descriptions and alleged item counts from `REVIEW-FIRST.html`. The first human reviewer must identify/count *all visible physical clothes*, including anything the model missed, without being anchored by model predictions.
- Provides `tools/annotate-garment.html`, `tools/approve-garment-mask.html` and `tools/assemble-physical-inventory.html`. Two **genuine different people** must review the outlines; generated package has no names, approvals or references.
- Provides `BLIND-REVIEW-STATUS.json` with all quantitative recognition metrics explicitly **null**, promotion denied, zero approved masks, zero completed inventories.
- Includes original photographer/license attribution separately in `LICENSES.html`, preserving usage terms without model category hints.
- Four packet integrity and refusal tests in `tests/blind-physical-review-packet.test.mjs`.

## Verified output
[GitHub Actions run 39202879879](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39202879879) **passed**. It re-used the earlier SHA-verified ten-photo artifact, performed the unit checks, created the offline packet, and uploaded **`blind-ten-photo-human-review-packet`** (artifact ID 12164197686). Independently inspected its ZIP: exactly 10 original JPEGs, three self-contained local HTML review tools, blind index, instructions, attribution, and status JSON. No candidate prediction masks or model overlays.

The ZIP is available for the two external human reviewers. No one has drawn or approved an outline on this development branch, and no accuracy is measurable yet. This is a concrete *evidence-collection enabler*, not completed AI garment segmentation. Any later claims of improved recognition require two genuine reviews for every complete photo and held-out physical photo/device validation.

**Constraints:** Branch/PR #10 only; draft and unmerged, no production deployment, no paid inference, no Drive Duel changes, original photos preserved. Do not submit fabricated approval JSON to make the gate pass.
