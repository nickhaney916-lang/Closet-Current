# Private-pilot validation package — Work Assignment #162

Preparation package only. No phone, independent recognition or hosted staging evidence has been collected by this work. No deployment or production promotion is authorized.

## Open the kit

On a checked-out branch run `node scripts/build-private-pilot-kit.mjs /an/unused/directory` and open `START-HERE.html`. The dedicated **Private pilot kit and inherited security QA** Actions run also provides a blank downloadable `Closet-Current-Private-Pilot-Kit` artifact. Extract it fully; keep the `review` folder alongside the start page. It works offline with no dependencies, network requests, AI calls or accounts. Existing directories are never overwritten.

Use a full browser. Phone file viewers may not execute local HTML; in that case open the kit on a computer alongside the test phone. Do not publicly host it as a workaround. The app itself still requires separately approved, Access-protected staging. The offline kit supplies no staging address or credentials.

Follow the four steps in the page. Every status starts **Not tested**. Failures, missing evidence or unavailable steps remain visible. Only passing statuses contribute to the displayed **self-reported checklist completion**; these percentages do not represent product readiness, physical-device verification, independent accuracy or permission to deploy. Changing a field revokes any prepared download. Clearing or closing does not preserve inputs; download first if you want the anonymous checklist.

## Owner: stop before testing unless staging is independently verified

Use `docs/RESTRICTED-STAGING-SETUP-20261021.md` and the existing staging builder/verifier. Do not use production deployment workflows. Obtain owner authorization for any future provisioning or upload; this assignment does neither. No paid resources or AI services are permitted.

1. Confirm an independent staging site and separate empty Supabase project; compare project identity privately with the owner. Do not reuse Closet Current or Drive Duel databases, customer accounts, storage, keys or SMTP settings. Keep secrets out of source, artifacts and checklist JSON.
2. Put Cloudflare Access deny-by-default protection in place **before upload** on the project hostname, every preview/deployment alias and any custom hostname. Verify signed-out access is blocked for the root, nested pages and scripts; verify allowlisted testers can enter. Do not assume protection on one hostname covers another.
3. Generate a bundle using only the separate staging origin, Supabase URL and publishable key. Run source boundaries, restricted-bundle verification, artifact checks and local disposable two-account checks. A passing local verifier cannot prove hosted Access or backend configuration.
4. Review Auth provider/email settings and exact HTTPS callback/redirect allowlists against the protected staging origin. Exclude wildcard and production redirects. Test actual confirmation and reset emails, sign-out and account switching on staging after separately authorized setup. Never collect email addresses or tokens in this kit.
5. Verify private buckets, two-account RLS/read/write/overwrite/delete denial and backup revision/failed-save/migration recovery on approved test infrastructure. Use only synthetic accounts and garment-only photos with permission. Local evidence must not be represented as hosted evidence.
6. Recheck immutable artifact integrity immediately before any separately approved upload. As of this package’s repository review, parallel draft PR #162 (`security/staging-asset-byte-integrity-20261021`) proposes additional binary/script byte checks. It is **not integrated here**; review and integrate that security work separately before declaring the final deployment candidate ready.
7. Coordinator reviews all blockers, cost restrictions, data cleanup and consent, then separately authorizes a restricted pilot. All checklist boxes being checked still does not authorize deployment. Any unverified control means stop before accounts/photos enter staging.

Do not remediate the live database within this assignment. Prior live-database permission findings remain unresolved release blockers unless separately authorized and verified.

## Tester: run once on actual Android, once on actual iPhone

Use consenting adult testers and nonpersonal garment-only images. Keep originals private. Prepare several owned wardrobe items first, then photograph a new piece so styling can demonstrate an outfit containing both. Keep a local backup before recovery tests. Never erase the only copy to test restore.

The offline page gives the exact app labels and ten workflow checks: high-resolution rear-camera detail; manual and five-second automatic capture; full-original recognition/color before masking; edges/categories/colors; multiple garments from **Whole outfit**; saved closet persistence; **Cloud backup up to date** and restore to a second synthetic session; **Style new clothes** / **Style this** with existing wardrobe; interrupted-save recovery; and **Device help** report exports.

Compare the untouched source with isolation and saved previews. Full-resolution recognition ordering is proven in source/automated guards, while humans must still inspect actual phone capture quality. Visual similarity alone cannot establish internal processing order. Preserve optional unknown details rather than accepting a confident-looking wrong subtype. Record failures before correction; a successful manual correction does not convert the original prediction into a pass.

## Independent garment review protocol

The reviewer must label each untouched original **before seeing model suggestions, crops, masks or saved labels**. Use **Device help → original-photo diagnostic** to lock expected category/type/color, then run the diagnostic and export anonymous results. Unknown subtype is valid when the original lacks evidence. Use a different reviewer from the operator when practical; if independence cannot be established, record it as blocked.

Repeat a balanced minimum set on each actual phone, then expand difficult cases rather than claiming general accuracy from a small sample:

| Case | Minimum original scenes per phone | Check before accepting |
| --- | ---: | --- |
| Shoes | 3: sneakers, boots, sandals | Shoes category, subtype justified, toe/heel/straps preserved, one pair versus duplicates, original color |
| Dresses | 2: casual and long | One dress, intact hem/sleeves, no false top/skirt split; compare jumpsuit/romper if available |
| Shorts versus skirts | 4: two of each, including loose silhouettes | Visible leg openings versus continuous skirt; no subtype conclusion from mask alone |
| Jackets | 2: alone and layered | Outerwear versus shirt/cardigan, complete sleeves, top and jacket separated without duplicates |
| Whole outfit | 1 with visible top, jacket, bottom, shoes | Independently count each garment, omissions, duplicates, category and color |

Inspect daylight and indoor color on untouched originals. Export actual **saved-closet audits** from both phones after saving/restoring; model diagnostic scores are not actual saved-item accuracy. Coverage checkboxes in this kit neither compute nor certify accuracy. For any later statistical claim report the actual denominator, independent labeling procedure and failures, keeping model suggestions and saved-item results separate.

## Collect and review without private photographs

There are two distinct report types:

- The new `closet-current-private-pilot-session` JSON records only platform, optional 12-hex app build and the 26 fixed statuses. It deliberately contains no photos, filenames, timestamps, names, accounts, addresses, URLs, credentials or notes. Import validates exact keys/enums, rejects forged evidence/extra private fields, limits files to 64 KB and displays only generic errors. It never uploads, persists automatically or changes the app.
- Actual app exports belong in `review/OPEN-PRIVATE-PILOT-REVIEW.html`: Android and iPhone Device help reports, independently labeled original-photo diagnostics and saved-closet audits on the **same app build**. This is the existing canonical reviewer embedded from unchanged validators. It rejects mixed builds, unexpected fields and unsupported evidence. Do not feed supplemental kit JSON into it.

Share only validated anonymous JSON through an owner-approved private channel. Do not post customer data, wardrobe backups or photographs in GitHub. Retain original scenes locally only with consent; the kit has no image import or text-notes field. Review unknown/fail/blocked steps before any proposed pilot. Self-reports and strict schemas minimize data exposure; they cannot prove a report was produced on genuine hardware or independently labeled by a human.

## Verification and readiness accounting

Run `node scripts/check-private-pilot-kit-scope.mjs`, inherited source/release guards, `node scripts/build.mjs`, `node --test tests/*.test.cjs tests/*.test.mjs`, then the dedicated Actions workflow for disposable Supabase and Chromium/WebKit. New kit browser coverage tests fixed-status download/import, private-field rejection without echo, invalidated exports, reset, 390-pixel touch layout, canonical-reviewer navigation and zero external requests. Run `scripts/test-offline-pilot-cohort-browser.mjs` for canonical reviewer parity as well.

Readiness denominators are explicit and separate:

- Package preparation: **6/6 delivered capabilities = 100% only after exact-head QA passes** (phone guide, original-first review protocol, independent garment checklist, anonymous results, canonical review handoff, staging stop checklist).
- Physical-device evidence supplied in this assignment: **0/2 platforms = 0%**. Chromium/WebKit emulation is excluded.
- Independent human recognition evidence supplied: **0/24 minimum phone-scene reviews = 0%**. Accuracy is **unmeasured**, not 0%.
- Hosted staging controls independently verified here: **0/8 checklist controls = 0%**. Local security CI is excluded. Deployment remains blocked.

No overall product-readiness percentage is inferred from these preparation measures. Remaining physical-phone, human recognition, Access, separate hosted backend/Auth/email, parallel artifact-hardening review and separately authorized live-permission remediation must be coordinated before any release claim.
