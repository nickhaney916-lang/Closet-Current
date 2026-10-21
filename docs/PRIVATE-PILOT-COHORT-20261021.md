# Closet Current — reconcile private pilot evidence across all three report families

**October 21, 2026 — independent development draft; no production release.**

## Problem and completed engineering improvement

The existing local validators separately check (1) 17-step Android/iPhone operator
checklists, (2) original-photo recognition **model suggestions**, and
(3) what customers say was **actually saved** in My Closet. Because they were
independent, there was no single safe release-wide check that all three reports
shared the same 12-character application build. A reassuring model suggestion
score could also be mistaken for independently measured saved-closet accuracy.

The new local-only cohort reviewer uses all the existing strict validators,
then rejects a mismatch between **device reports, model diagnostic reports,
and saved closet reports**. It publishes a privacy-redacted aggregate with two
separate diagnostic groups, coverage, failures, blurry saved photos, cloud
restoration issues and a conspicuous **no per-original-photo linkage** warning.
It cannot calculate accuracy for the same photo from these separate anonymous
datasets, even when build IDs match. A threshold PASS is only a self-reported
diagnostic, NEVER real physical hardware certification or release approval.

## Owner sequence — ONLY after authorized staging on real phones

1. Run My account → Device help on a real Android and iPhone and privately
   export a report from each device. The original 17-step tests are manual.
2. Independently pre-label actual original garments (including color) on
   the existing Check clothing photo recognition page. Export one or more
   anonymous model-diagnostic JSONs privately.
3. Use Check what was actually saved in My Closet to record and export
   original expected category/type/color, initial suggestion, whether saved
   automatically, corrected, held or failed, visible saved photo clarity and
   manually observed restoration. Produce at least one Android and one
   iPhone saved-closet report.
4. Keep all raw JSON, photos and any customer data PRIVATE. On your own
   trusted computer inside the repository checkout, run:

```bash
node scripts/review-private-pilot-cohort.mjs \
  --android /private/android-device.json \
  --iphone /private/iphone-device.json \
  --model-reports /private/model-a.json /private/model-b.json \
  --saved-reports /private/android-saved.json /private/iphone-saved.json \
  --out artifacts/private-phone-pilot/cohort-01.json
```

The CLI refuses mixed builds, invalid schemas/summary counters, extra private
fields, report replays and reused output files; it writes an owner-readable
redacted summary and does not upload anything. Output remains only under the
ignored `artifacts/private-phone-pilot` directory. No input files are altered.

## Evidence limits preserved

No customer reports were supplied for this engineering change. The unit tests
create **synthetic fixtures only**, not real hardware observations.
A single shared build does NOT prove source-photo identity, unique garments,
real phone or operator identity, source-grounded human category/color correctness,
live two-account Supabase isolation, SMTP delivery, account deletion, licensing
or real saved closet accuracy. The aggregate permanently marks
`originalPhotosLinkedAcrossReportFamilies:false`,
`verifiedProductionSavedClosetAccuracy:null` and
`productionPromotion:'BLOCKED'`, regardless of synthetic score.

This branch changes **no app runtime, model, original image, auth, cloud,
backup, deployment, or Drive Duel files**. No paid inference or service,
no production merge/deployment and no separate Work session. The primary
Closet Current conversation remains the sole coordination record.
