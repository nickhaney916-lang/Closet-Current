# Closet Current — private actual-saved-closet phone audit

**2026-10-20. Pilot instrumentation only. Not physical-hardware evidence or release authorization.**

## Why a separate phone worksheet exists

The built-in 17-step Device help checklist asks whether things work and the phone photo-check tool evaluates recognition **suggestions**. Neither measures the final product promise: garment type and primary fabric color actually **stored in My closet**. A model suggestion can be wrong but corrected before save, and a correct model suggestion can be altered by later cropping or a bad cloud restore. These are different customer outcomes and must be recorded separately.

This development branch adds an optional manual **Check what was actually saved in My closet** link under Device help, opening `saved-closet-audit.html` in a separate tab. The HTML is built with exactly the same 12-character release identifier as the app, with cache-busted scripts. It can be used on a real Android or iPhone browser after owner-approved staging. It does not read camera photos, customer wardrobe storage, Supabase identity, account IDs, URLs or other private metadata. It does not upload results automatically. Test results remain **in memory in that tab only** until downloaded; closing or refreshing clears unsaved worksheet entries.

## Hands-on sequence (for every garment)

1. Open Device help and start the regular checklist on the actual phone. Copy or download its device report and confirm the build ID shown at the top of this separate worksheet agrees.
2. Choose the actual garment category, type, primary fabric color and capture/import mode **before** opening recognition. Tap **Lock original labels**.
3. In the main app tab, photograph/import the item normally. Note the FIRST proposed category, type and color; do not correct it yet.
4. If the result automatically saves unchanged, select **Saved automatically**. If you correct the record, select **Saved after correcting** and enter exactly what the garment displays in My closet. If the app holds it or errors, select Held or Failed. Never call an error a successful save.
5. Compare saved-photo clarity to the original: clear, soft, or pixelated. Mark whether it visibly restored after closing/reopening or changing devices; otherwise choose Not tested, Pending or Failed. The worksheet does not verify cloud access itself.
6. Tap **Add checked garment**; repeat. Download the private JSON at or before 20 garments. Use a new report per 20, and never share images or account credentials on public GitHub.
7. On a private computer, gather 2–40 saved-closet JSON reports from both Android and iPhone/iPad with the **same app build**. Run:

```bash
node scripts/review-private-saved-closet.mjs \
  --reports /private/android-01.json /private/iphone-01.json /private/android-02.json \
  --out artifacts/private-phone-pilot/new-saved-review.json
```

The local-only CLI strictly validates all allowed enumerated fields, recomputes every summary, rejects arbitrary photo bytes/names/identifiers, rejects exact replayed reports or mixed builds, refuses output overwrite and writes only a redacted aggregate with owner-only file permissions. Input files remain untouched. No real phone reports are included in this repository.

## Proposed *diagnostic* thresholds — not a release certificate

- At least 50 **independently pre-labeled actual garment attempts**, at least 10 each Tops / Bottoms / Dresses / Outerwear / Shoes; both Android and iPhone.
- 70% automatically saved coverage, at least 90% items saved, at least 95% exact category **AND type AND primary fabric color** among automatically saved and among all saved items.
- Zero wrong fully automatic saved labels (review each one), zero failed saves, soft/pixelated saved photos or pending/failed cloud restores. At least one manually reported restoration.
- Count manually corrected saves separately, along with clothing held for review, lower coverage, obvious blurry pixels and unsafe restores. Real-world pre-label and source uniqueness still require a separate witness or secured private dataset.

**Even a self-reported 100%-perfect 60-photo dataset cannot authorize production.** The evaluator permanently outputs `productionReleaseApproved:false`, `productionSavedClosetAccuracy:null`, and independent physical-device verification false. It cannot prove operator integrity, unique photographed originals, true Android/iPhone hardware, full account privacy, live SMTP, actual Supabase RLS, commercial figure rights or dual-human approved native masks. The separately existing real-photo mask program still has no approved human masks at this checkpoint.

## Regression evidence and boundaries

Node tests cover category/type/color mismatch, corrected versus unchanged auto saves, photo clarity and recovery failure, false device approval, tampered results, data leakage, mixed versions, duplicated sessions and no-overwrite private reports. Chromium Android-sized and WebKit iPhone-sized browser tests navigate the actual standalone page, capture skirt-versus-shorts correction and automatic shoes, download the private report and verify identical app build, no real customer requests and no photos. This **browser emulation is not a physical-phone result**.

Do not deploy this draft, merge PR #92, enable paid provider calls, create public accounts or touch Drive Duel. Physical phone and independently reviewed privacy/data policies, SMTP, account deletion, native-pixel masks and licensed original production figures require separate verified evidence.
