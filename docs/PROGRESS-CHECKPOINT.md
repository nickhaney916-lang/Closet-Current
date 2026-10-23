## 2026-10-23 — Issue #243 isolated photo-textured 3D research

Separate branch `research/issue243-photo-textured-humanoid-20261023` builds on PR #232 (6025b13), preserving 2D and existing adapters. Added contoured procedural garments, original-byte SHA-256 texture sessions with caller authority/current-generation guards, front-only RGB projection, estimated hidden surfaces and synthetic comparisons. Local full suite: 291 pass, 0 fail, 0 skip; initial Chromium/WebKit six viewport journeys and existing avatar baseline passed CI 40011002477. No physical-phone or realistic-fit claims. See `docs/ISSUE243-PHOTO-HUMANOID-RESEARCH.md`; final exact-head results belong in the draft PR and issue #243. No deployment, paid AI, customer data or cloud changes.

# Closet Current progress checkpoint

## Current checkpoint — October 14, 2026, evening Pacific

Saved at the owner's request before further personal testing. Stable application source: `b6490e8af2eabefb370fac7b5bf0a7d375dd9922` on `main`. Live app: https://closet-current.pages.dev/

- Preserve the current interface: shared clothing figure without gender controls; one base shirt; independent shirt/sweater, jacket and outer-coat layers; Dresses switches to a dress-and-shoes figure. Backup controls remain at the bottom.
- Separate clothing photos populate independent layers and survive reload. Dress preview can be canceled without changing the shirt look; selecting a dress removes incompatible outfit slots without deleting clothing records.
- High-resolution capture, automatic outfit crops, originals, private account backup and existing recognition remain preserved. Drive Duel was not accessed or modified.
- All 237 Node checks passed. Main's camera/indexing, mobile capture/persistence, WebKit, display comparison, private backup, Cloudflare deployment and GitHub Pages workflows passed. Physical-phone accuracy is a separate open validation task.
- Latest recognition evaluation: reviewed categories 26/32, exact types 18/32; fresh categories 11/11; harder holdout clothing categories 7/13. These results do not justify unrestricted public-launch accuracy claims.
- Email/password flows and PWA installation help exist. Current SMTP configuration and real inbox delivery remain unverified. Authentication links still target GitHub Pages while the main shared app link is Cloudflare; verify the redirect allowlist and align the chosen origin before invitations.

Next work: follow [PILOT-READINESS.md](PILOT-READINESS.md). Prioritize labeled real-phone crops, category and primary-color accuracy, reliable saving, and email onboarding before adding features. No runtime or authentication settings changed for this checkpoint.

## Earlier checkpoint history

The dated notes below describe earlier states; the current checkpoint above supersedes their counts and open-item status.


Originally paused at the owner's request on October 14, 2026, 7:44 AM America/Los_Angeles. Development resumed at the owner's request later that morning.

## Current saved state

- Repository: nickhaney916-lang/Closet-Current; production branch: main.
- Application source at pause: `686f88679b00678527c98569d1b09be8dcd96d04`.
- Live app: https://closet-current.pages.dev/
- Phone photo check: https://closet-current.pages.dev/phone-photo-check.html
- The photo-check page returned HTTP 200 and matched the built release identifier and recognition-vector digest.
- Simplified navigation and high-resolution camera functionality are preserved. Drive Duel was not accessed or modified.

## Recognition work completed

- Verified rollback camera/indexing tests passed.
- Full-garment preprocessing improved the original 32-photo category result from 19/32 to 23/32 and shoes from 8/13 to 11/13.
- The later validated prompt profile reached 26/32 categories, including 12/13 shoes; 7/13 categories on additional garments; and 10/11 categories on fresh photographs.
- Per-photo regression enforcement protects all 59 fixtures, including three nonclothing images. Known annotated subtype mismatches remain explicitly visible.
- Eight subsequent subtype/recovery candidates were evaluated. None safely improved recognition, so the production model, vectors, confidence gates and preprocessing were retained. Detailed metrics and rejected changes are preserved in docs/SUBTYPE-RECOGNITION-RESULTS.md and benchmark/subtype-experiment-results.json.

## Latest completed delivery

Optional phone-photo validation is deployed and linked from My account → Device help.

- Supports up to 20 single-garment photos with independently supplied category labels and optional type labels.
- Locks expected labels before inference, uses the production local worker and the app's photo-import conversion, and does not save wardrobe items.
- Downloads a report with safe labels, rejection diagnostics, timings and version identifiers. Images, filenames and account information are excluded; nothing is sent automatically.
- Handles scanner timeouts, partial failures and restarting the test.
- All 166 automated tests passed.
- Real-worker phone photo-check flow, camera/indexing tests, mobile capture/persistence flow, Cloudflare deployment and GitHub Pages deployment passed.
- Browser tests use licensed fixtures at a phone viewport; physical phone hardware and new user garment accuracy remain unverified.

## Exact next step when resuming

Collect real phone evidence before further recognition tuning:

1. Open the phone photo check and choose 5–10 different garment photos, including dresses, long tops, sneakers and boots.
2. Supply expected labels before running recognition. Leave the optional subtype blank when uncertain.
3. Download closet-phone-photo-results.json and attach it to the development conversation.
4. Analyze mismatches and error stages. Request only the particular numbered garment images needed for visual investigation, then test targeted changes against the phone evidence and existing 59-photo safeguards.

The prior uploads inspected were setup screenshots, so no user phone garment dataset or new phone accuracy claim has been established. See docs/PHONE-PHOTO-VALIDATION.md for the collection workflow and evidence.

## Other open priorities

Physical-phone capture/login validation, reliable authentication email delivery, cloud wardrobe backup/synchronization and eventual subscription readiness remain open as documented in docs/ROADMAP.md. They have not been completed by these recognition tasks.

## Resume validation

Added an automated mobile WebKit photo-import and persistence check. EXIF orientation, high-resolution import limits, actual-worker T-shirt recognition, IndexedDB persistence and phone layout passed on the validation branch; all 166 existing Node checks passed. See docs/WEBKIT-MOBILE-RESULTS.md. Product camera and recognition behavior are unchanged.

Development is resumed. Real phone garment reports remain the next input needed for recognition tuning; physical-phone camera and production-login tests remain open.

## Authentication continuation

Reviewed Closet Current's public Auth settings and project health. Added clear email delivery/rate-limit messages and validation of unreadable service responses; 170 automated checks passed. Supabase management access requested reauthentication, so SMTP settings were not modified and real inbox tests remain open. See docs/AUTH-EMAIL-READINESS.md. Recognition, simplified navigation, camera resolution and Drive Duel are preserved.

## Display continuation

The owner chose to polish the existing display rather than redesign the app. Compact labeled filters, more consistent clothing cards and responsive spacing passed a four-width visual comparison and 170 automated checks. See docs/DISPLAY-POLISH.md. Preserve the current purple/peach colors and simplified navigation in subsequent work.

## Private cloud backup continuation

The owner requested automatic saving without individual phone-gallery files after nine items were captured. Added private account-owned photo storage and revision-protected metadata, durable pending changes, offline retry, existing-local migration and independent-browser recovery. 181 checks, live Supabase account-isolation tests and the browser recovery flow passed. No real user wardrobe was inspected; actual items migrate when the updated signed-in app runs. See docs/CLOUD-BACKUP.md for limits and verification.
