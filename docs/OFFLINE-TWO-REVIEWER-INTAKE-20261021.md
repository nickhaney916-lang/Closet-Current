# Two independently completed real-photo reviews — offline coordinator
**October 21, 2026 Pacific. Additive research-only QA, not deployment or human accuracy.**

## Why
Closet Current has a source-hash-verified reviewer (PR #120), and explicit Save/Resume drafts (PR #121). The authoritative pairwise auditor currently needs command-line arguments and two separately returned JSON files. It is easy to mistake a draft for a submitted review or conflate two matching responses with verified gold.

## Scope
This addition produces a separate small **`OPEN-COORDINATOR.html`** that uses the unchanged 13-original source packet and its frozen packet SHA-256. Only an organizer should open it; never supply this tool or another reviewer's answers to someone doing a blind review. The organizer selects two completed `family-observations.json` files and presses **Check both reviews**. The page performs all schema and source-hash checks offline, insists both have `REVIEWED` status and independent aliases, requires source coverage, evidence, uncertainty, and truthful self-attestations, and rejects extra injected fields and malformed JSON. It displays per-photo **self-attested agreement**, **uncertainty**, or **disagreement**, and allows download of `self-attested-review-audit.json`.

The report preserves canonical submission SHA-256 receipts and is checked in Chromium and WebKit against the source `reconcile()` Node implementation using **explicitly artificial test fixtures**. Changing either selected file clears any previous result. Failures do not retain previously accepted reports. Input files remain local; no uploads, analytics, SQL writes or network. Developer-side authoritative CLI audits remain independently available.

## Permanent blockers
Source files and assistant labels are not independent gold. The page cannot authenticate actual people, their blindness, real garment material/form, exact type, masks or true benchmark accuracy. It always sets `independentHumanGoldLabels:false`, `approvedModelAccuracy:null`, `productionPromotion:'BLOCKED'`. If two actual independent humans return files, authenticate independence externally, retain their untouched raw JSON privately, resolve uncertainty with another human and avoid using known/exposed benchmark photos as untouched confirmation. No human reviews have been supplied or used here.

No customer code/recognizer/photo masks, Auth/RLS/cloud, paid inference, Drive Duel, merge, deployment, real phone tests or customer data are involved. The source guard requires all prior PR #121 reviewer and app bytes unchanged.

## Instructions
Download coordinator artifact from the exact-head successful GitHub Actions run, extract, and open `OPEN-COORDINATOR.html` locally. Do **not** give this coordinator page to blind reviewers. After each genuinely independent reviewer's complete JSON has been returned separately, select both, check, and download the audit JSON. Keep the original two returned JSON files as evidence. Never substitute `review-draft.json` or test fixtures for real observations.
