# Closet Current — private physical-phone pilot evidence handoff

**October 19, 2026 — development only.** No app build has been merged or deployed in this branch. Two scripted phone-sized browser emulations do **not** establish physical-camera, real account, body/clothing recognition, AI fidelity, or device battery/memory performance.

## What the new field-test UI records

The existing **My account → Device help → Try it on your phone** screen now has **17** manual Works / Needs help checks. Its original ten capture, login, recognition, Adjust, whole outfit, style, persistence, and export checks remain. Seven additional checks cover:
1. Camera access denied, recovery, then granted;
2. Original RGB photo vs AI preview **type and color** on an actual shirt, jeans/shorts, and sneakers;
3. Multiple physical garments in a layered top+jacket+bottom photo with no invented duplicate saves;
4. Rotation, background lock, interrupted service, and recovery;
5. Account cloud-backup status, not just local IndexedDB;
6. 200% font scaling, accessible tap targets and horizontal scrolling;
7. AI preview unavailable / zero charges while the paid provider is disabled.

Scanner timing and stage/error events are optional, **opt-in and local**. The report is **format v2**. It exports a 12-character app build hash, user-agent-based platform label, manually selected status for each of 17 steps, bounded generic scanner timing/error codes, and explicit missing/Needs help counts. **It does not export photos, image labels, names, account IDs, device identifiers, emails, URLs, raw model logs or paid keys**, and is never automatically uploaded.

All exported reports explicitly include `hardwareVerified:false`, `liveCameraVerified:false`, `sourcePhotoAccuracyMeasured:false` and `paidModelQualityVerified:false`. Those fields mean the *software cannot independently attest* those facts, even when the tester is physically holding a phone and marks every step Works. The build's phone field result still requires your manual review.

## After the owner separately approves a private staging deployment

1. Give a **real Android tester** and a **different real iPhone tester** private access to the **exact same staging build**, not the current unrelated production app. Avoid forwarding account credentials or recovery links.
2. Each tester opens My account → Device help, selects Start device test, then performs each step on their **own phone**, with actual photo captures and their own approved garments; record Works or Needs help. If the category is right but the type or color is wrong/Unknown, record Needs help for original-photo recognition/color. An emulated test is not a substitute.
3. With the actual original photo available to the tester, confirm a shirt, trousers/shorts, sneakers, two-layer outfit, local/backup persistence and owned-only Style This. Review shoes vs ankle boots, skirts vs shorts, and outerwear separately; **do not auto-accept uncertain full-outfit cuts**.
4. Use Download test report on each actual device. Send only the JSON files through a private channel after you have inspected their contents. Don't attach real garments, customer photos, email tokens, or these reports to public GitHub Issues or Actions.
5. On a **local private computer** with the repository code, run:

```bash
node scripts/compare-private-phone-pilot-reports.mjs \
  android-check.json iphone-check.json \
  local-private-summary.json
```

The script checks both reports use the same app build, have all 17 manual steps answered, no Needs help, no scanner error codes, and use the strict sanitized format. It saves only a **derived review summary**. The raw reports never leave the local computer.

### Interpreting results

- `blocked-manual-checks-incomplete`: mismatched app builds, missing manual tests, Needs help, or a scanner error; fix the problem and **redo the real steps**.
- `manual-human-evidence-review-required`: both checklist files are complete and claim Works; that is **not an actual hardware verification or an approved release**. The device label comes from a spoofable user agent. A responsible reviewer must confirm the testers/devices and staging deployment, independent original-photo garment truth, cloud login/delivery, consent and any screenshots or phone video kept privately.

These reports DO NOT satisfy the separate paid two-stage AI fidelity/economic controls required by `benchmark/tryon-acceptance-evidence.mjs`, which deliberately requires different authorized live-provider evidence. Real model try-on remains disabled until specific owner cost approval.

**Non-negotiable:** Do not deploy, merge, activate paid AI, upload private photos, or modify Drive Duel from this branch.
