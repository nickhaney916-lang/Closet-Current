# Family Alpha #50 — physical-phone acceptance protocol (ANDROID + IPHONE)

**Development-only, October 27, 2026 · NO DEPLOY · FAMILY ALPHA HOLD**

This is an actual-device acceptance **procedure** and a privacy-safe **empty template**, not a claim that a real Samsung/Android or iPhone test has occurred. Work #45 independently owns live staging access/accounts; visual 2D clothing-on-avatar research is separate. The private source-photo + Work44 layout integration candidate is fixed at [PR #354](https://github.com/nickhaney916-lang/Closet-Current/pull/354) head `be35089adea220b8cbc69b27b0232cbfc02d4a62`.

## Before a physical session — do not bypass access controls

- Only test after an owner-authorized, Cloudflare Access-protected staging site with reviewed exact deployed code, verified Auth redirects and at least two separately authorized adult testing identities. At this checkpoint, the Family Alpha staging build intentionally has no active callback/key and the last metadata check showed **one** registered staging account. **Do not** invite family members, turn on signup, alter SMTP or deploy this branch to work around that.
- Use synthetic/sacrificial garments, never actual private household/family wardrobe data until permission/privacy gates pass.
- Use the built-in `More → Help & device check` and `My account → Device help → Check clothing photo recognition` when an approved app is available. The existing engine exports a sanitized report, not images or filenames; it does **not** replace this 14-step Family Alpha checklist.
- Test **one real Android handset** using Chrome or Samsung Internet and **one real iPhone** using Safari or Chrome. A Playwright iPhone/WebKit profile, developer emulator, screenshot, synthetic JWT or downloaded action artifact is **not** a physical device.
- Keep any photo-sensitive evidence on the device or private owner-controlled channel; do not attach photos, names, emails, device IDs, serials, backup documents, login sessions, JWTs, cookies, filenames, raw errors, or identifiers to public GitHub issues/PRs. Share only PASS/FAIL/BLOCKED status and optional existing sanitized device-check results.

## One-person device journey (repeat independently on BOTH phones)

| Step ID | Actual-device action | PASS threshold |
|---|---|---|
| `hardware_camera` | Open app on real phone, grant camera, take a manual still | Live physical camera launches and captures clean original garment pixels, no crash |
| `manual_photo_quality` | Shoot one light and one dark garment at portrait orientation | Original hem/sole details remain visible; no major pixelation or distorted orientation |
| `hands_free_start_stop` | Try 5-second automatic capture, press Done/stop | Exactly expected photos captured; no ghost timer/background capture after stop |
| `whole_outfit_review` | Photograph complete owned outfit, inspect separated items | Each actual garment selected/reviewed; uncertain/missed items can be corrected without false additions |
| `original_photo_indexing` | Save and reopen an item from My Closet | Index categories from **original photograph**, not AI-created clip; metadata/photo original preserved |
| `category_color_correction` | Correct deliberately uncertain category/color | Manual adjustment saves and survives app navigation/reload |
| `three_owned_outfits` | Choose Style and create three looks | All suggestions refer to clothing owned by that same account |
| `original_photo_board` | View original-photo boards for each look | True garment images appear, readable on phone; no misleading claim of realistic worn-avatar preview |
| `one_piece_swap` | Swap one garment and save resulting outfit | Swapped item from same owner; saved look recalls correct originals, not stale image |
| `favorites_save_reload` | Favorite a look, refresh, reopen favorites | Favorites and clothing references persist with no duplicates/wrong-account state |
| `offline_recovery` | Disconnect network after local save, relaunch, reconnect | No silent loss, clear pending status, no corrupted images; sync only to same account |
| `switch_browser_session` | Use two browser instances and login/logout where permitted | Session behavior documented; no mixing clothing across accounts or stale unauthorized tiles |
| `cloud_backup_restore` | From authorized synthetic session, back up, then restore on another browser/device | Same account only; saved originals, outfit refs and corrected metadata restored and integrity verified |
| `two_owner_privacy` | With **two real separately signed-in approved adult test accounts**, attempt unrelated owner access through app and authenticated backend | Own records work; other owner photos/backups denied; no cross-account leakage |

If a requirement is unavailable or unapproved, use **BLOCKED**, never PASS. If a device cannot perform a step, use FAIL with private offline observations and keep the shared report free of raw error text.

## Evidence fields — no personally identifying data

File: `docs/family-alpha-50/physical-device-acceptance-template.json`. It starts **28/28 NOT_TESTED**, with two device entries. A manually completed copy should set `source` to `HUMAN_RECORDED_SELF_REPORT`, set `physicalAndroidIphoneAuthorized` only after authorization, set the actual browser and `physicalHardwareObserved` only when a human genuinely handled that physical phone, and mark each step `PASS`, `FAIL`, `BLOCKED` or `NOT_TESTED`. Correct `stageHostProtected` and `realTwoOwnerJwtIsolation` only after corresponding separately verified live evidence.

The validation tool:

```bash
node scripts/check-family-alpha-50-physical-phone-hold.mjs
node --test tests/integration/family-alpha-50-physical-phone-hold.test.mjs
```

This reads a small, local JSON file, requires Android and iPhone steps, rejects additional sensitive fields, refuses to accept simulation as physical phone observations, and never contacts Supabase/GitHub/Cloudflare or modifies staging/production. **An operator can forge a JSON manual flag; the tool cannot independently verify actual hardware, identity, Auth/JWT, real cloud saving or human appearance approval.** Even a filled 28/28 report is `READY_FOR_MANUAL_OWNER_REVIEW_NOT_RELEASE`; the output always says `decision: HOLD`, `deploymentAuthorized: false`.

## What remains blocked in the current checkpoint

Cloudflare stage host and pre-invite protected login verification, two real staging adult JWTs, backup live positive/negative read/write, cloud restore, phone installation, actual Samsung/Android and iPhone hardware runs, owner aesthetics and 2D on-avatar realism. Existing Work44 licensed-photo browser/visual evidence is synthetic/desktop and **not** a substitute. No paid service or family capture is authorized.

**Family Alpha stays HOLD. No deployment or merges. Production, staging settings and Drive Duel unchanged.**
