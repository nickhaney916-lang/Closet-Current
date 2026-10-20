# Phone pilot: independently labeled garment color recognition evidence

**2026-10-20 — developer QA only; physical phones and real customer photos NOT yet tested.** This task stacks on integrated [PR #84](https://github.com/nickhaney916-lang/Closet-Current/pull/84) and does not merge or deploy anything.

## What was missing and why it mattered

The optional `phone-photo-check.html` instrument measured independently selected *garment category* and optionally garment *type*, but **not primary color**. A customer could upload a blue shirt on a white backdrop, obtain a correct "Tops / T-shirt" category, and the report would misleadingly look successful despite the model predicting background White. Correct garment type + **correct primary color** is a release-readiness criterion, so we need to measure color separately.

## New workflow in app

1. On a real device, open **My account → Device help → Check clothing photo recognition** (`phone-photo-check.html`).
2. Select one to twenty photos. For each, **independently choose category and optionally specific type and primary fabric color** before touching the Check recognition button. The color palette matches Closet Current's current indexed colors. Non-clothing controls cannot be assigned a garment color.
3. Press **Check recognition**. Expected category/type/color fields and photos lock before the local recognition model runs. Unchanged original photo file bytes remain browser-only; this **diagnostic** uses the same existing production import re-encoding path to the local FashionCLIP worker. This is *not* an independent audit of final original-capture resolution or final cloud-save quality.
4. Download `closet-phone-photo-results.json`. The report includes **only fixed-choice color labels and suggestions** (no photos, filenames, raw model output, credentials, freeform details, or network upload). Review the scores before deciding on recognition changes.
5. The report contains **model color diagnostics**: `colorsLabeled`, `modelColorMatches`, `modelColorWrong`, `modelColorMissing`, `strongCategoryColorMatches`, and `strongCategoryColorMismatches`. Every labeled photo is counted, including scan failures. An unrecognized color remains **missing**, not incorrectly counted as a correct one. Unknown or extra/private model strings are discarded. This is a *model proposal* before the full app's source-background evidence / manual confirmation gates: **do not claim saved closet color accuracy from it**.
6. Two other optional private phone checklists `closet-current-device-check.json` (Android and iPhone) record login, camera permission, outfit and account persistence, cloud-backup status, disabled paid generation and error recovery. `node scripts/compare-private-phone-pilot-reports.mjs android.json iphone.json output.json` compares their statuses locally but **cannot verify hardware identities or approve production**. These two records and any actual physical images remain private; never upload user photos to CI or public issues.

## Actual phone study required before first pilot

- Run a **private, consented and independently labeled** pilot set; target at least **50 source photographs**, with at least 10 for each key clothing category before declaring per-category reliability. Include dark garments against white, white fabric against dark, shoes including soles, layered looks, short dresses vs skirts, orientation and lighting variation, and non-clothing controls.
- Record *expected category + expected primary color before inference*, whether a result was automatically saved versus held, whether it was corrected, and whether photo clarity remained acceptable on-device. Because the stand-alone color diagnostic does not reproduce all app save gates, check the final saved wardrobe color separately.
- Verify on real Android and real iPhone: camera permissions, direct camera versus library import, 5-second auto-capture, account separation, photo resolution, saved photo clarity, garments/dresses correctly indexed, all owned-only outfit options, local fitting/recapture, close/reopen storage, and sync restoration. A physically different person and device are necessary to claim independent review; browser User-Agent/viewport settings are not authentication.
- Proposed pilot quality gate, **NOT an achieved result**: at least **95% correct category AND primary color among actually automatically saved items**, with accepted-coverage denominator and complete error counts (review-only and failed attempts stay visible). Zero cross-account exposure, photo loss or silent save failure in exercised journeys. A "perfect" category test that sends all items to review is not acceptable.
- Real-email signup/confirmation delivery (Gmail, Outlook, iCloud), legal privacy/terms approval, complete account deletion, actual commercial figure-master rights, 12/12 independently human-approved original mask references, and owner approval remain **independent launch blockers**. Nothing here approves public rollout, paid AI providers, photographic fit or marketing.

## Automated verification

`tests/phone-photo-benchmark.test.mjs` covers original locked expected color, valid/invalid palette and negative controls, model color matches, wrong colors, missing values, timeout denominator, strong category/color suggestions, arbitrary private-text redaction and backward-compatible format v1 for existing two-browser fixture comparison.

`scripts/test-phone-color-audit-browsers.mjs` uses Android-width Chromium and iPhone-style WebKit with **synthetic local JPEGs and a deterministic mock Worker**, verifies frozen category/type/color labels, correctly matched and incorrectly guessed model colors, browser privacy of downloaded reports, start-over reset, and negative-control color lock. It is not an inference-accuracy measurement.

The existing separate `.github/workflows/phone-photo-check.yml` runs **the real FashionCLIP worker in Chromium** on SHA-locked licensed original photos. The new `.github/workflows/phone-color-pilot-acceptance.yml` tests the full customer build, all Node tests, account/device-check workflow, owned-only styling/save/reload on both Chromium and WebKit and private color diagnostic UI. This verifies instrument correctness and software recovery, not real phone results.

**Draft branch only.** No production merge, deployment, billable AI/inference, customer photo upload, fabricated real hardware or Drive Duel changes.
