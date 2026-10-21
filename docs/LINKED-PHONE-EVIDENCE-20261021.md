# Closet Current — original-first linked physical-phone trial worksheet

**Development date:** October 21, 2026. **Status:** fully offline worksheet; NOT an authenticated physical-phone test or permission to deploy.

## Why
The existing anonymized original-photo recognition and My Closet saved-item reports cannot reliably join the same original garment. A guessed match or a shared build number cannot establish real saved-item accuracy. This new independent standalone worksheet records the untouched original's label, the initial model suggestion **before adjustment**, and the outcome **actually saved** in one local record.

## What is measured
The deterministic set includes 12 original photo scenes on each platform (Android + iPhone), 24 scenes total. Eleven scenes on each platform have one garment; the whole-outfit photo has four separate entries (top, outerwear, bottom, shoes), for **15 garment observations per platform / 30 total**. Coverage: sneakers, boots, sandals, two dresses, two shorts, two skirts, jacket alone and layered, one whole outfit. This is a small diagnostic set, not a statistically representative accuracy benchmark.

1. A consenting adult operator prepares access **only to an independently approved, Access-protected separate staging environment**, with synthetic private accounts and nonpersonal garment-only photos. Do not use production or Drive Duel.
2. Open the stand-alone **PHONE-ORIGINALS.html** file from the GitHub Actions blank artifact in a full browser (offline). It uses no network or storage. Use a computer beside the actual phone if its file viewer cannot execute local HTML.
3. For each photo, have an independent reviewer inspect **the untouched original before seeing any model answer or crop**, choose category/color, then click **Lock original label**. No truth label can be changed without resetting the entire garment record.
4. Only after locking, inspect the initial automatic prediction (prior to manual correction), and later what was actually saved in My Closet, including photo sharpness. Enter them separately. For non-detections use \`unrecognized\`; for items that could not be saved use \`not_saved\` in all saved fields.
5. Repeat all 12 original scenes on **each actual phone**, including four entries for each whole-outfit original. Export the fixed-choice JSON; never export personal filenames, originals, face images, accounts, emails or phone identifiers.
6. The local worksheet reports category/color exact matches for initially predicted **and** saved garments using only fully recorded rows as the denominator. Unknown/unfinished rows reduce coverage; do not treat 100% over 1 row as 100% over the 30 required entries. A corrected saved label never retroactively changes the initial model score.

## Validation limits
This report deliberately stores no filenames, hashes or persistent original IDs. Its row ties a reported source scene to its reported initial prediction and saved observation, **within the operator's statement only**. It cannot cryptographically verify same-photo identity, unique real photos, physical phone model/firmware, true independent reviewer, actual hosted staging isolation or customer security. An operator can alter JSON or misreport outcomes. It is **not evidence of independently verified recognition accuracy**, and every summary retains \`verifiedRecognitionAccuracy:null\`, both physical-device flags false and release BLOCKED.

The existing canonical reviewer, phone Device help and saved-closet audit exports remain separately required. They do not automatically merge with this worksheet. Discrepancies between reports must be reconciled privately using original evidence by the owner.

## How to build locally
\`\`\`sh
node scripts/build-linked-phone-evidence.mjs /private/new/PHONE-ORIGINALS.html
node --test tests/linked-phone-garment-evidence.test.mjs tests/build-linked-phone-evidence.test.mjs
\`\`\`

The builder refuses overwriting existing file, the worksheet has a strict self-contained CSP disabling network, and all generated entries reject extra fields, photos, account IDs, forgeable true verification flags or unsupported values. Export/import are offline, with no auto-save. The CI tests Chromium and WebKit 390-pixel mobile emulation and produces the blank worksheet alongside the original pilot kit; **emulation does not replace real device testing**.

No project upgrades, AI inference costs, hosted Supabase changes, production merge/deployment, customer data or Drive Duel changes were made.
