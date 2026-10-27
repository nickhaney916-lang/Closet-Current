# Family Alpha #48 — Real 2-account staging JWT preflight (read-only; NOT EXECUTED)

This optional **locally run, explicit-opt-in** preflight is part of draft [PR #352](https://github.com/nickhaney916-lang/Closet-Current/pull/352). Its purpose is to prepare the next test **without** creating family accounts, changing provider settings, writing/deleting cloud data, downloading any original photos or compromising production.

## Real testing is currently BLOCKED

As of October 27, 2026, staging Supabase `fbnplztkbsteuzrmbgib` had **one** registered account. Two distinct existing, authorized, working staging user sessions do not yet exist. The source-locked Family Alpha candidate's staged Auth is explicitly disabled behind `HOLD-NO-CALLBACK-OR-KEY`; this file does not activate it. Also, Cloudflare Access, physical phones, the 4-user pilot, and the owner photo-board approval are not yet independently verified. Do not create accounts or enable settings without the owner's separate approval.

## What the script does if, and only if, explicitly run locally

File: `scripts/family-alpha-48-real-jwt-readonly-preflight.mjs`.

1. Requires **two pre-existing, distinct real staging access tokens**; validates both against **only** `https://fbnplztkbsteuzrmbgib.supabase.co/auth/v1/user` with the staging publishable key. Does not decode or trust caller-provided `sub` claims.
2. Requests `GET /rest/v1/closet_backups?select=owner_id&limit=2&owner_id=eq.{owner}` twice per session: its own owner and the other verified owner. No backup documents or user email returned. Any cross-owner row is a FAIL.
3. Requests `POST /storage/v1/object/list/closet-private` with JSON prefix `{verified owner UUID}/`, once for itself and once for the opposite owner per session. This **listing-only** Storage API uses POST for a metadata listing but neither uploads nor downloads a JPEG. No object names are logged. A cross-owner object listing is a FAIL.
4. Requires a positive owned backup row and nonempty owned photo listing **for each account** before labeling both directions `PASS_LIVE_READONLY_TWO_OWNER_ACCESS`. Missing positive controls are `INCOMPLETE_POSITIVE_CONTROLS`, not a pass.
5. Never writes records, deletes objects, uses any service-role key, follows HTTP redirects, exposes original image bytes, or sends network requests outside the exact staging Supabase origin. Environment credentials must never be placed in GitHub, workflow variables on untrusted pull requests, screenshots, command arguments, shell history or CI logs.

It requires exact `sb_publishable_` format, refuses production URLs / other request paths, aborts on unexpected responses and pagination, and always prints a **redacted** result with `decision: HOLD`, `deploymentAuthorized: false`, `productionModified: false`, `stagingModified: false`.

### Safe preparation only (current state)

```bash
node scripts/family-alpha-48-real-jwt-readonly-preflight.mjs
```

Expected output includes `NOT_EXECUTED_NEEDS_EXPLICIT_LOCAL_LIVE_OPTIN`. This never contacts Supabase.

### When authorized with two existing adult staging sessions

Run **locally on a trusted machine**, using a secure credential manager and non-echoing local environment entry. Do not paste JWTs into ChatGPT or GitHub. The exact environment names are:

- `CC_STAGE_APPROVED_READONLY=YES` (requires explicit owner authorization),
- `CC_STAGE_PUBLISHABLE_KEY` (staging publishable key only),
- `CC_STAGE_JWT_A` and `CC_STAGE_JWT_B` (two distinct existing *staging* signed-in adult session access tokens).

Only then execute:

```bash
node scripts/family-alpha-48-real-jwt-readonly-preflight.mjs --live
```

Credentials are not printed; clear environment variables afterwards. The script deliberately refuses absent or duplicate credentials and stops with an inconclusive result on any API error. Run the script from the reviewed development branch; never deploy its code or expose tokens in a browser.

## Remaining gates even after a future full read-only API pass

- **Write isolation and integrity** of backup RPC, immutable JPEG uploads, deletes and concurrent updates **not tested**, because this script is read-only.
- Actual access to/denial of JPEG **download bytes** not tested (privacy-sensitive).
- Actual end-to-end staging preview activation, browser login, Cloudflare protection, multi-device cloud restore, four-family JWT sessions and physical Android/iPhone testing **not tested**.
- Staging leaked-password protection advisor warning still requires separately approved remediation.
- Work #44 aesthetic owner acceptance and full 2D compositing acceptance still outstanding.

**Family Alpha remains HOLD** even if two adult read-only API checks eventually pass. No automatic release or deployment path exists in this preflight.
