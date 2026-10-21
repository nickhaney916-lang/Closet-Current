# Private Android/iPhone pilot evidence — one-file offline coordinator

**October 21, 2026** | Isolated additive draft stacked on verified PR #125. No release, deployment, or real-phone proof.

## Problem
Closet Current already ships 17-step Device help checklists and a source-locked, private Node CLI reviewer (`scripts/compare-private-phone-pilot-reports.mjs`). But a family/pilot organizer must transfer both exports to a computer, set up Node and type a terminal command just to see incomplete phone checks. This creates avoidable handoff errors for nontechnical reviewers and delays real-world quality verification.

## Implemented
A single **`OPEN-PHONE-COORDINATOR.html`**, generated from the unchanged authoritative `benchmark/review-phone-pilot-reports.mjs` source, accepts one privately exported Android `closet-current-device-check.json` and one iPhone export. Checks happen locally, with no account sign-in, upload, external scripts or server requests. The page:

- Enforces the **exact same version 2 report schema, fixed 17 check IDs, sanitized events, derived completion counts and privacy restrictions** as the existing canonical Node validator.
- Rejects tampered completion flags, extra fields such as names/photos/email, fake hardware approval, wrong platform or invalid source records.
- Shows missing/failed steps, scanner errors and app-build mismatch. A partial or failed review remains blocked; all passes still require genuine operator review and never authorize public production.
- Offers a locally generated redacted JSON summary. Changing either file immediately revokes the old output link. A stale asynchronous parse can never replace a newer selection.
- Omits filenames, raw device files, photos, account IDs, tokens and personally identifying strings from the comparison output.

**Critical:** This compares **self-reported checklists**. It cannot prove a genuine Android/iPhone device, a distinct operator, original image accuracy, paid provider quality, isolated hosted Supabase behavior or real account recovery. Zero actual private reports were supplied by development. It preserves `independentPhysicalDevicesConfirmed:false`, `productionReleaseApproved:false`, and null hardware accuracy.

## How to use
On each physical device, open **My account → Device help**, complete its 17 checks and download its local `closet-current-device-check.json`. Keep all personal photo files private. On a trusted laptop or phone, extract the GitHub Actions `offline-private-phone-pilot-organizer-no-customer-data` artifact, open `OPEN-PHONE-COORDINATOR.html` and select the two files. Compare, correct any failed tests on the actual device, and download the redacted summary. Keep actual raw evidence separate and private. Never upload photos or names to a public GitHub issue or CI.

The existing separate saved-closet audit and individually pre-labeled photo-check reports are still required before any claim of category/color accuracy or physical saved-garment fidelity. This coordinator does **not** read them or replace human judgment.

## Evidence and release restrictions
Automated synthetic positive/negative test fixtures and Chromium/WebKit emulation test the software, not actual physical cameras. Production release, model promotion, mask approvals, figure licensing, live emails, account deletion and private cloud signoff remain gated. No change to customer runtime, Auth, Supabase SQL, source photograph benchmark, recognition, masking, or Drive Duel; no paid inference.
