# Outfit capture validation — 2026-10-13

The new capture mode creates isolated clothing photos rather than saving the
whole person as one closet item. It then queues each cutout for categorization,
keeps uncertain results for Adjust, and asks users to add only pieces they own.
Existing individual-garment capture and staged recognition remain in place.

## Evidence

- 125 automated checks passed, including ownership gating, mask/classifier
  conflicts, cropped garments, excluded body labels, paired shoes, partial
  worker failure, timeout/retry, saving, and outfit board integration.
- Seven development outfit images produced 25 clothing regions. Seven cutouts
  met the automatic category checks, while 18 required review, including three
  regions touching the image boundary. Five images originate from the parser
  training dataset, so these results are smoke checks, not an independent
  accuracy benchmark. No accuracy percentage is claimed.
- One real outfit was processed by the single-thread WASM runtime in Node:
  logits were [1,18,128,128], with hat, upper garment, bottoms and paired shoes
  detected. Shoes touched the photo edge and were held for review. Model run
  plus preprocessing took approximately 1.1 seconds on the development host.
  This is not a phone timing measurement.

## Limits and next validation

Physical phone capture, browser canvas output, model downloading on mobile,
memory limits and a representative independent full-body photo set remain
unverified. Semantic masks can merge overlapping layers and miss occluded or
small accessories. Broad categories may be retained with item type Unknown;
blank details are intentional. No original person photo is persisted.

Email confirmation/redirect configuration remains a separate high-priority
open item; this feature does not change auth settings or email templates.

## Pilot hardening

A person-presence gate now requires confident head/body region evidence before
the worker emits cutouts. This avoids treating clothing-shaped regions alone
as an outfit. It is a heuristic, not an independent person detector. A six-photo
negative smoke set (cat, dog, house, bread, book cover, invoice) exposed false
clothing regions before this gate. The downstream ownership and classifier
checks remain in place; phone and independent full-body validation are open.

The new gate rejected all six negative images and accepted all seven outfit
development images. Thresholds were checked on these development examples;
this is not independent accuracy evidence. The full automated suite now has
128 passing checks.
