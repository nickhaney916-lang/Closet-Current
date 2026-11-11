# Mission 1 P823 — bind the exact visible cropped JPEG to its verified cutout receipt

**FAMILY ALPHA HOLD #255 — DRAFT, UNMERGED, UNDEPLOYED. MISSION 1 NOT COMPLETE.**

## Verified parent and scope

Independently verified P822 draft [PR #857](https://github.com/nickhaney916-lang/Closet-Current/pull/857), exact final green parent `ec836aa614813fe6609dc1f7899d172b5a27897b`, [no-deploy Actions #43044928795](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43044928795): 2/2 jobs SUCCESS, native build and full Node 1,695 PASS, 1 optional SKIP, no failures. P823 changes only five allowlisted isolated code/test/report/CI paths, without changing production, staging, authentication, customer photo assets, original model, cloud APIs or release process.

## Actual private save integrity gap

Both research `research/manual-reviewed-private-save-119/reviewed-source-commit.mjs` and native `public/native-reviewed-private-save-167.mjs` verified a signed-in owner's original full-photo source SHA and a second `segmentHint.cutoutImage` digest before atomically saving a human-claimed individual garment. However, the visible `record.image` could contain a DIFFERENT newly cropped JPEG from the SAME original source while `segmentHint.cutoutImage` and `cutoutSHA256` still referenced an OLD cutout. The source/cutout cryptographic checks would succeed even though the display photo saved as this garment did not match the cutout byte receipt. P822's intentional manual cropping makes this stale-cutout-identity condition important to fail closed.

## Research and native correction

When PHOTO119's mode is `multi`, if the record's visible image differs from the full original JPEG, it **must be byte-for-byte identical** to the cutout image whose SHA-256 is already verified. A different photo cannot borrow a stale verified cutout and will return `review-required` with kind `cutout-source-unverified`, leaving the owner draft intact. Valid legacy full-original previews showing an independently verified cutout are retained, as are correctly matched cropped JPEGs.

This is a **proof-alignment gate**. It does NOT regenerate source-bound cutouts after an owner edit; it deliberately blocks them until a valid newly hashed cutout is produced and the specific garment is human-reviewed. Do not weaken the prior native atomic owner/draft IndexedDB CAS or source/cutout SHA conditions in order to make the save pass.

## Test and acceptance protocol

`tests/mission1-cutout-visible-photo-823.test.mjs` runs both REAL exported save implementations through WebCrypto SHA-256 and fake IndexedDB transactions using a genuine already-development-exposed original JPEG fixture and small deliberately distinct JPEG-envelope cutout fixtures. Six cases verify: stale cutout/visible-crop mismatch refuses saving and preserves draft, genuine identical cutout/visible image saves, and full-original display with separate correctly verified cutout still saves, for BOTH research and native writers. These checks are real SHA/draft logic but use deterministic test crop bytes, **not a real owner photographic mask, independent human ground truth, or physical phone acceptance**.

Dedicated `.github/workflows/mission1-cutout-visible-photo-823-no-deploy.yml` requires exact green P822 ancestor and only five paths; tests both writers, previous manual save/crop tests, native build and ALL Node application regression tests, with an independent second job. **Do not call P823 verified until the exact final head has 2/2 successful jobs.**

## Mission 1 remaining hard gates

P817 normal frozen SegFormer B0 native original-photo grouping detected only 10 of 23 publisher garment instance masks in Chromium or 9/23 in WebKit at instance IoU >= 0.5, with false positives. Automatic source-component splitting was worse. Experimental P821 confidence thresholds remain separate and cannot auto-promote on exposed data. Required prospective rights-cleared, genuinely unseen source-photo cohort, two separate blinded human labelers with adjudicated masks/type/color, acceptable heldout instance/boundary/category/subtype/color results, true physical Android Chrome and iPhone Safari inference/resource measurements, signed hosted two-owner original-photo sync/privacy and explicit owner release consent remain unverified.

**FAMILY ALPHA HOLD #255 stays OPEN. No merge, deployment, staging, production or release changes. MISSION 1 NOT COMPLETE.**
