# Closet Current — Physical phone test sheet

**Status:** Unexecuted test protocol. All observations below must be filled by a human on a physical device. Browser emulation is not physical-device evidence.

## Session identification
Tester alias: ____  Date/time: ____  Build URL/version: ____  Git commit: ____
Device model: ____  OS/version: ____  Browser/PWA: ____  Network: ____  Test account alias: ____
Consent for using test garments: yes / no. Never attach private user images or auth tokens to a public issue.

## Test fixture checklist
Use only tester-owned opt-in items or appropriately licensed test images. Include: plain dark top; patterned/light top; pants; skirt; shorts; dress; sneakers; boots; outerwear; one cluttered background. Preserve originals; do not re-encode source files for benchmark claims.

## Repeatable customer journey
| Step | Expected result | Pass/Fail/Blocked | Seconds | Taps | Evidence ID / notes |
|---|---|---|---:|---:|---|
| Capture or import garment | Original image retained, correct orientation, legible resolution | | | | |
| Recognize garment | Correct category and color, uncertainty shown when needed | | | | |
| Review/correct | One simple Adjust path; source remains unchanged | | | | |
| Style new item | Three distinct outfits from same-account closet | | | | |
| Pin new item | Selected garment remains in every suggestion | | | | |
| Swap one item | Only requested piece changes | | | | |
| Save outfit | Persisted items and original source identity retained | | | | |
| Reopen/relogin | Same saved outfit returns without cross-account content | | | | |
| Account switch | No prior-account garments, thumbnails or previews | | | | |
| Invalid/stale source | Safe hold/review instead of invented garment | | | | |
| Difficult photos | Safe review/fallback; record recognition errors | | | | |
| Mobile usability | No sideways scroll; buttons legible and tappable | | | | |

## Garment fidelity review (each garment, per reviewer)
Source ID (non-sensitive): ____  Original SHA-256: ____  Garment type: ____
Reviewer alias: ____  Blinded order: ____  Preview type: original-photo / cutout / approximate collage / generated
Rate 1–5, with N/A when not visible:
- Color: __  Texture: __  Pattern/print: __  Logo/details: __  Edge/mask quality: __  Layer placement: __
- Does the preview invent fabric/fit/body geometry? yes / no / unknown
- Reviewer comments and specific mismatch: ____
**Never score non-visible back/side fabric as accurate.** Collect independent ratings before adjudication.

## Defect log
| ID | Severity | Device | Exact steps | Expected | Observed | Repro count | Privacy-safe evidence |
|---|---|---|---|---|---|---|---|
| TBD | | | | | | | |

## Release decision
Physical Android executed: NO. Physical iPhone executed: NO.
Independent human garment-fidelity ratings completed: NO.
Security/account-isolation on real devices verified: NO.
**Current decision: BLOCKED pending evidence.**
Attach only authorized redacted results. Reference [issue #9](https://github.com/nickhaney916-lang/Closet-Current/issues/9) and [draft PR #219](https://github.com/nickhaney916-lang/Closet-Current/pull/219).
No production merge/deploy, paid inference, cloud changes, or customer photo access is authorized by this sheet.
