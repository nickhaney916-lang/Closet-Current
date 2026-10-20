# Closet Current — complete end-to-end private pilot evidence review

**Tuesday, 20 October 2026 — draft product-readiness engineering, NOT deployment or a real-phone pass.**

## Goal

Before inviting more testers, we need one dependable answer to: *does Closet Current recognize actual garments and colors, preserve accounts/photos, and style existing clothing on real Android and iPhone?* Existing tests cover implementation and browser emulation, while separate phone-photo audits measure FashionCLIP **suggestions**, not saved-closet color. This project now consolidates each source while refusing to invent approval.

## New acceptance evidence engine

`benchmark/private-end-to-end-pilot-review.mjs` reads:

- One privately exported Android `closet-current-device-check.json` containing **17 operator-entered physical-device checklist answers**.
- One separate iPhone `closet-current-device-check.json` from the **same application release**. These reports are *self-reported browser data*, not verified hardware identities.
- One or more private `closet-phone-photo-results.json` exports containing the customer/operator's independently selected category, type and primary fabric color **before inference**; max 20 photos per report, up to 40 reports.

**All inputs are schema-validated, rescored row-by-row and rejected if the summary was tampered, the phone reports differ in version/build, the recognition index differs, a source photo row contains filenames, identifiers, free text or private bytes, or a photo/result is inconsistent.**

Reports and phone platform claims cannot prove the pictures are *distinct* or were taken on real devices. The result therefore always sets `independentlyUniqueSourcePhotosVerified: false`, `productionSavedColorAccuracy: null`, `realPhoneColorAccuracy: null`, `productionReleaseApproved: false`. There is no switch, flag or feature to change these decisions.

### Local-only command

After exporting the files yourself on actual phones and moving them privately to your trusted computer:

```bash
node scripts/review-private-pilot-evidence.mjs \
  --android /private/android-device-check.json \
  --iphone /private/iphone-device-check.json \
  --color-reports /private/garment-session-1.json /private/garment-session-2.json \
  --out artifacts/private-phone-pilot/review-01.json
```

The output is a **redacted aggregate**, not a photo library, an authenticated-signature package or a deployment certificate. It contains no per-photo identifiers or private color-photo files. The output path must stay in the local ignored `artifacts/private-phone-pilot` folder. Files are written owner-only with **exclusive creation**; earlier reports and input files are never overwritten. This tool does not call a provider, GitHub, the cloud or local user accounts.

### Proposed acceptance thresholds, not achieved results

For a serious initial **model-proposal diagnostic**, the tool checks at least **50 independently labeled garment entries** and **5 nonclothing controls**; at least **10 labeled examples each** for Tops, Bottoms, Dresses, Outerwear and Shoes; color labeled for every garment; at least **70% strong automatic model decisions** so abstention on everything cannot appear successful; **95% correct category plus proposed primary color** among automatic model decisions; zero missed nonclothing controls and no runtime errors.

The threshold labels are purposely **only about suggestions made by the local recognition model**. A scanner's final saved color is additionally subject to original-background, manual corrections and account-save rules, which the small photo-check page does NOT exercise. A green preliminary diagnostic screen is therefore **not a green pilot/production decision**.

Additional release blockers remain explicitly present even if every synthetic or self-reported diagnostic is perfect:

- Actual *authenticated* Android and iPhone owner-operated original camera captures, including permissions, low memory, 5-second interval, JPG/HEIC import, media switching and slow/absent network.
- Distinct source photos, independent expected labels, actual **saved-closet** category/color fidelity and accepted coverage on each real device.
- Original-resolution image preservation, shoe soles, dress hems, shorts/skirt competition, dresses hiding bottom layers, already-owned-only recommendation correctness, human figure clarity, saved outfit after close/reopen and cloud backup restoration across accounts.
- Reliable external Gmail/Outlook/iCloud signup and reset email, user privacy/terms, genuine account deletion and server-side cross-account lock.
- 12 source photos with genuinely first-and-second human-approved full native-pixel garment mask references (currently **zero**) and fully verified commercial male/female figure rights.
- Independent human owner sign-off, cost limits and explicit deployment authorization.

### Operator sequence

1. Keep everything on the **draft integration branch** (currently PR #86, stacked on PR #85). No live deployment or paid services are activated automatically.
2. After owner-approved controlled **staging** is explicitly established, check the website release SHA; each person's Android/iPhone reports and private photo-check audits must reference that *exact* release.
3. Ask willing participants to label expected **category + primary color BEFORE recognition**. Photograph real items with natural variations, and separately record what was ultimately SAVED in the closet. Do not put photos or sensitive account details into public GitHub issues, CI, documentation or comments.
4. Export privacy-safe color diagnostics and 17-step device checklists. Run the **local-only** command on a trusted machine. Investigate every blocker, unexpected abstention, saved-photo integrity problem or cross-owner mix-up.
5. Independently complete the offline *two-human* full-resolution mask reviews using PR #84's distinct role ZIPs. Obtain real legal rights approvals and confirm product email/deletion controls before any public invitation.
6. Only then request owner approval for staging/release; no synthetic browser success can substitute for these actions.

## Technical checks

`tests/private-end-to-end-pilot-review.test.mjs` exercises a 55-photo apparently perfect synthetic study, wrong color, untallied color, missing category and negatives, changing weights, extra private model fields, missing source data, tampered summaries and spoofed device reports. It explicitly verifies that **even a perfect apparent study still returns release BLOCKED**.

`tests/private-end-to-end-pilot-cli.test.mjs` verifies local files are redacted, outputs are mode 0600 on POSIX, prior results and original input JSON cannot be overwritten, and hostile input does not produce a report.

`.github/workflows/private-end-to-end-pilot-review.yml` reruns full Closet Current app build and all tests, original/high-resolution and human mask approval safeguards, 17-step device check UI in Chromium/WebKit, account/session failure recovery, private independently labeled synthetic color audit, and owned-only new clothing outfit save/reload on both emulated engines. These are engineering tests, never physical-phone proofs.

**No paid provider activation, no user photo uploads, no production merge/deploy, and no Drive Duel modifications.**
