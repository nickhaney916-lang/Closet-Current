# Closet Current Mission 1 P881 — genuine same-model horizontal mirror comparison

**Family Alpha HOLD #255 OPEN.** Research-only isolated DRAFT branch. No merge, deploy, live user input, private photo, signed account, cloud, staging, production, model replacement or changed owner-facing suggestion.

## Verified parent
Immediate parent is P880 [draft PR #1096](https://github.com/nickhaney916-lang/Closet-Current/pull/1096), immutable source `a4261f8e7dd968046dc14ff88ba969c91514d0b0`, [two-job NO-DEPLOY SUCCESS #43535353559](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43535353559): 614/614 native tests, six desktop Chromium/WebKit synthetic owner-review profiles, 48 genuine public licensed original JPEG source/model/decision receipts, 26 safe jointly-top AI shortcuts vs P879's 80. Those are fewer suggested shortcuts, **not improved recognition accuracy**.

## Hypothesis (predeclared before test)
Potential improvement to FashionSigLIP top-subtype recognition: the vision encoder may be sensitive to left/right asymmetry of photographed garment layout. Same pretrained locked q8 vision weights and the same original image are scored (A) unmodified, (B) horizontally mirrored **source pixels**, (C) normalized mean of the two same-model image embeddings. Analyze all **48 previously exposed public-development** originals, keeping identical 47-label SigLIP text vector prompts and rank vocabulary. Track category + subtype historical string matches, wins and losses, unchanged known hard sneaker `commons-0078`, extra latency. **No model promotion or training on exposed data** even if string counts improve. Same-model augmented views are not extra independent model evidence.

## Delivery
- New `public/siglip-horizontal-view-881.mjs`: deterministic RGB horizontal pixel mirror, original buffer immutability, bounded 20 MP and three RGB channels; normalized two-view embedding mean with nonfinite/zero cancellation checks.
- `public/dual-worker-82.mjs`: optional **explicit research-only** `researchFlip881: horizontal-mirror-v1` trigger, one additional SigLIP inference before model disposal, produces full 47-label mirrored and paired rankings and reproducible input/model/source pins. The unchanged ordinary SigLIP observation, original FashionCLIP observation, two-model arbitration, explicit owner confirmation and original JPEG still control all review. Default request has no research flag.
- `public/dual-core-82.mjs`: includes helper source file in the immutable worker/source SHA receipt. This prevents an unpinned imported helper.
- `scripts/p82-real-browser.mjs`: opt-in `P881_MIRROR=1` genuine research runner, with original SHA-locked downloaded photos and pinned public model bytes; requires experiment return, asserts 0 admissions.
- `scripts/p881-siglip-mirror-audit.mjs`: first run existing P878 source-lock / dual-model decision custody, then verifies 48 mirror/mean complete rankings, no foreign/duplicated source, exact source and vector/model code hashes, original input identity, same-model nonindependence and full known shoe case; counts gains **and losses**, refuses any blind-accuracy or release claims. No private originals or model raw vectors in public artifact.
- Nine synthetic adversarial/native tests cover exact pixel reversal/no original mutation, input bounds, paired unit vectors, cancel, fabricated model provenance, corrupted 47-rank arrays, photo/manifest swap, zero owner saves and an explicit assertion that the ordinary owner panel cannot trigger the research flag.

## Exact no-deploy acceptance
Use separate pinned parent eight-file change scope and 2 GitHub Actions jobs: whole native and original owner browser regressions; actual pinned q8 48 original JPEG Chromium one-session inference with both model families and both research views, independently checked source lock and mirrored-result comparison. No physical devices or independent humans, no hosted Supabase. Family Alpha release evaluator must remain **BLOCKED**.

Reproduce:
- `node --test tests/mission1-siglip-mirror-881.test.mjs`
- `P877_FULL_FRAME=1 P881_MIRROR=1 node scripts/p82-real-browser.mjs chromium benchmark/p881-real-chromium`
- `node scripts/p878-public-photo-custody.mjs benchmark/p881-real-chromium/results.json benchmark/locked-photo-sources.json benchmark/p881-real-chromium/custody-audit.json`
- `node scripts/p881-siglip-mirror-audit.mjs benchmark/p881-real-chromium/results.json benchmark/p881-real-chromium/mirror-audit.json`

**CI and real-photo results pending at report creation.** Development-exposed historical labels are not human-blind ground truth; physical Android/iPhone, repeated WebKit inference and two-account cloud privacy remain unverified. Do not claim 10/10 or lift HOLD #255.
