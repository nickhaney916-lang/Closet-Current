# Closet Current — offline recognition failure triage (development)

**Purpose:** Turn the already-available original-first 24-scene/30-garment operator worksheet into an actionable, privacy-limited engineering defect summary. This does not inspect or collect photographs, identify people, prove reviewer independence, or certify phone devices. All release blockers remain.

## How a consenting tester uses the kit
1. Only **after separately approved Access-protected staging**, test nonpersonal garments on a real Android and iPhone. Use the exact same build. Review each untouched original with the independent labeler **before** seeing the first model prediction. Record the original category and color, the initial model's category and color **before correction**, and the item category, color and image quality actually saved. See PHONE-ORIGINALS.html; 12 source scenes per phone, four garment entries for a whole outfit.
2. Export the fixed-choice JSON locally. Do not collect photos, names, email addresses, filenames, persistent identifiers or account records.
3. Open **PHONE-TRIAGE.html** in a full local browser (can be a computer next to the phone). Select that JSON. Review the combined 30-entry coverage, initial category+color errors, saved category+color errors, item-not-saved errors, missing and pixelated saved photos, and five fixed garment families. The top-issue list is a heuristic engineering queue—not accuracy verification.
4. Select **Prepare aggregate-only JSON** to export a redacted summary after validation. Any changed input invalidates a prepared download. This output carries only predefined categories, device-platform words, counts and the optional 12-character app build marker; it excludes original row identifiers, observations, truth labels, images, file names, user data and free text.
5. Fix model/indexing/photo clarity regressions only on a new reviewed development branch, then repeat the same procedure with new legitimate source photos. Do not invent results or claim improved accuracy from synthetic checks.

## Denominator and scoring contract
- Every family includes all its required observations, even if none is entered. Per-recorded exact percentages must never hide the separate full coverage denominator of 30 garment entries and 24 original scenes.
- A saved item only counts as **usable correctly saved** when both saved category/color match the untouched-original label **and** its saved photo is **clear**. A missing or pixelated saved photo is an issue even when metadata matches.
- Unsaved items are counted separately from incorrect saved categories, so a missing save does not falsely improve or overstate correction accuracy.
- Failed first predictions remain failed even after the operator manually fixes the item.
- A four-garment whole-outfit original is a single original scene, not four unique photos. The five issue families are shoes, dresses, shorts versus skirts, outerwear/layers and whole outfits.
- Top issues are sorted deterministically by a fixed impact weighting. They are not ground-truth performance estimates or representative industry benchmarks.

## Strict privacy and release restrictions
The import validator accepts only the exact fixed-choice PHONE-ORIGINALS version 1 schema (size cap 128 KiB); any private/extra fields, invalid claims, malformed JSON, unsupported rows or oversized files are rejected without echoing user data. The HTML has CSP disabling network, third-party assets, form submission and persistence; nothing is uploaded. No paid service, customer data, remote staging access or real recognition inference is used in CI.

**Always unverified:** Android physical hardware 0/1, iPhone physical hardware 0/1, independently verified untouched originals 0/24, genuine recognition accuracy null, hosted staging/Cloudflare Access false. Even a complete 30/30 report with 100% operator-entered matches cannot authorize release. Owner approval and evidence are separate.

## Verify
- node --test tests/phone-recognition-triage.test.mjs
- node scripts/build-phone-recognition-triage.mjs /new/private/PHONE-TRIAGE.html
- node scripts/test-phone-recognition-triage-browsers.mjs (after Playwright Chromium and WebKit are installed)
- Full GitHub Actions integration workflow and disposable local Supabase checks, on the exact final branch head.

**Production and pilot promotion remain BLOCKED** pending separately authorized staging, true physical phones, independent human-reviewed original garment observations and remediation of independently reported live-cloud permission issues. No changes to app recognition/source-first behavior, cloud, storage, main or Drive Duel.
