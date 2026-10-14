# Closet Current priorities

## P1 — Configure reliable authentication email delivery

Status: open; high priority. Recorded October 12, 2026 at the owner's request.

The production Site URL and allowed redirect are both https://nickhaney916-lang.github.io/Closet-Current/. Signup, resend, and recovery requests explicitly use that address. Supabase's default templates use ConfirmationURL.

Custom SMTP is not configured. The default Supabase sender restricts recipients to project-team addresses and currently has a two-email-per-hour limit. This must be resolved before inviting family and friends broadly.

- Select and connect a transactional email provider with a verified sender.
- Configure the Closet Current Supabase project's SMTP settings (project hlkgymugtfbirlpunsra).
- Verify sender/domain settings and appropriate sending limits.
- Run real inbox signup, newest confirmation-link, resend, and password-reset tests for a recipient outside the project team.
- Confirm successful login after verification and clear handling of expired/used links.

Do not disable email confirmation or grant users project-team access as a workaround. Do not modify Drive Duel.

## P1 — Real-phone pilot and recognition accuracy

Status: device-check tooling added; physical-phone results still required. Updated October 13, 2026.

Use More → Help & device check with an existing account. Start an optional local test, take photos of three different garments, verify the labels, create an outfit, close and reopen the app, and download a backup. Mark each step Works or Needs help. Download the test report if support is needed. The report includes sanitized scanner stages, durations and error codes, without photos, garment names, email addresses, tokens or account IDs. No report is sent automatically.

Staged category/type recognition, whole-photo preservation, cross-view checks and precomputed high-precision text vectors are implemented. The frozen 100-photo WebAssembly comparison reduced wrong automatic categories from 6 to 2, while increasing photos needing adjustment from 21 to 34. See [staged recognition results](STAGED-RECOGNITION-RESULTS.md). Physical-phone speed, browser preprocessing and broader detail accuracy remain unverified. Wider signup and password-reset inbox tests remain blocked by the sender configuration above.

Recognition checkpoint, October 14: per-photo regression enforcement protects all 59 labeled fixtures. Eight dress/shoe subtype candidates were tested; none safely improved the baseline, so production recognition remains unchanged. Next accuracy work needs more ordinary phone photographs and framing evidence. See [subtype experiment results](SUBTYPE-RECOGNITION-RESULTS.md).

Private phone-photo validation tooling is available through Device help. It locks user-supplied labels before inference and exports sanitized results without photos or filenames. No actual user phone garment accuracy has been measured yet; the available uploaded files checked were setup screenshots. See [phone validation instructions](PHONE-PHOTO-VALIDATION.md).

Mobile WebKit validation, October 14: EXIF portrait orientation, 2048/3072-pixel import limits, actual-worker T-shirt recognition, reload persistence and phone layout passed in desktop WebKit with an iPhone profile. This supplements the Chromium camera test; physical phone hardware and production login remain unverified. See [WebKit validation results](WEBKIT-MOBILE-RESULTS.md).

## P1 — Cloud backup and synchronization

Status: not implemented. Clothing and outfits currently stay in per-account browser IndexedDB. Different devices do not synchronize. Before offering a paid subscription, implement private account-owned storage, reliable recovery and migration of existing local closets.

## P2 — Subscription readiness

- Personalized feedback, favorites and recently worn outfits.
- Reliable app-owned trend-refresh jobs with monitoring.
- Subscription billing, cancellations, failed payments and server-side paid-feature access.
- Pilot the full signup → clothing capture → useful outfit → return-and-recovery experience before charging.

## Design work completed

The brighter theme, larger controls, bottom navigation, direct Style shortcut, and all original styling features are retained. Inspiration and Style my collection remain separate features and use the shared verified trend library where applicable.

## P2 — Ownership and commercial protection

Recorded October 13, 2026; deferred while product pilot testing is prioritized.
Review private development and confidential server logic, trademark clearance
for Closet Current, contributor IP assignments, eligible copyright registration,
and patent disclosure timing if a novel technical invention exists. Before
subscriptions: business structure, insurance, terms, privacy, model/data licenses,
cancellation rules, and an age/parental-consent approach. No filings or access
changes have been made.

## Capture and result navigation — completed October 13, 2026

Single item / Whole outfit choices, compact per-photo statuses, collapsible
extra attributes, and explicit outfit-piece selection are deployed for the pilot.
The bottom navigation and separate styling/inspiration features are preserved.
