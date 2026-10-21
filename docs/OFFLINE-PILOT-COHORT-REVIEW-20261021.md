# Closet Current — one-page offline Android/iPhone pilot review

**October 21, 2026 — isolated engineering draft, NOT customer staging.**

## What was missing and how it is solved
Previous PR #142 reconciled three private report families but required terminal
commands and a local Node environment. The existing offline HTML coordinator
only compared the first two device help exports. This priority adds a
**standalone HTML page generated from the existing canonical Node validators**
to compare the complete three-family cohort with simple file selections.
It avoids inventing weaker alternate scoring code.

The offline reviewer opens directly in Chrome or Safari from a local file.
Select:
1. A private Android device-help JSON and a private iPhone device-help JSON.
2. One or more original-photo model diagnostic JSON reports.
3. Two or more final saved-closet audit JSON reports from both platforms.

Tap **Check all reports**, review reported problem counts, then optionally
download the redacted JSON summary. Changing any source file immediately hides
and invalidates prior results. No upload, network request, login, photo access,
cookies, tracking, cloud service or paid inference is used.

## How to obtain it
On the successful CI run for this branch, download the artifact named
`OPEN-PRIVATE-CLOSET-PILOT-REVIEW-no-customer-data`.
Extract its HTML and START-HERE file. Open the HTML on your trusted computer
or mobile browser — no Node, Git, installation or Work session needed.
The artifact contains **no actual customer JSON files, photos, names or account
identifiers**. Keep collected raw reports off public GitHub and CI.

The generated page embeds byte-preserved validator implementation bodies from
`public/local-catalog.mjs`, `public/phone-photo-benchmark.mjs`,
the browser-safe CJS device-check and saved-closet engines, and all four
strict Node benchmark/reconciliation sources. Only fixed import/export
syntax is removed and minimal fail-closed assertion checks are supplied.
A source import mismatch causes generation to fail, not silent changed
validation behavior. Node checks and genuine Chromium/WebKit browser runs
assert the exact same summary as the authoritative Node CLI.

## Limitations that remain BLOCKED
Even a 100% *self-reported diagnostic* cannot prove physical Android/iPhone
cameras, verified independent original photos, real classification/color
accuracy, live Supabase two-user account isolation, external transactional
emails, true backup restoration, commercial figure rights or privacy
and deletion terms. Photo results and saved closet results intentionally
have no common original-photo identifier and can never be joined.
The report always retains `productionPromotion: 'BLOCKED'`,
`productionReleaseApproved:false`,
`verifiedProductionSavedClosetAccuracy:null`,
`originalPhotosLinkedAcrossReportFamilies:false`.

No real customer photos were processed in CI. No edits to production/customer
app, camera, model, Auth, backup, styling, data policy, hosting, original
human-review evidence or Drive Duel. No merge/deploy or paid provider
activation; only owner-approved real staging plus human evidence can
complete the next real-world acceptance milestone.
