# Pilot readiness — October 14, 2026

## Decision

Preserve stable application source `b6490e8af2eabefb370fac7b5bf0a7d375dd9922` and continue owner testing. A small, guided pilot is the next release stage after real-device and external-email gates pass. Unrestricted public access is not yet validated. Do not share accounts or disable email confirmation to bypass delivery problems.

## Evidence and limits

| Area | Current evidence | Remaining release evidence |
| --- | --- | --- |
| Runtime and persistence | 237 Node checks; camera/indexing, mobile capture, WebKit, display and private-backup workflows passed | Physical Android and iPhone capture, close/reopen and account recovery |
| Recognition | Reviewed categories 26/32, exact types 18/32; fresh categories 11/11; holdout clothing categories 7/13 | Independently labeled new phone photographs, primary-color accuracy and per-category coverage |
| Automatic crops | Automated separation, saved crop pixels and original preservation covered | Real outfits with overlapping clothing, hems, soles and difficult backgrounds |
| Private backup | Synthetic account isolation, offline retry and independent-browser restoration tested | Pilot users verify their own photo-backed items and backup status |
| Email | Signup, confirmation handling, resend and reset client flows implemented | Current sender configuration, allowlist and actual external-inbox delivery |
| Installation | Manifest, install prompt and Android/iPhone instructions implemented | Physical-device installation and opening the correct account afterward |

Recognition figures come from `docs/recognition-learning-results.json`. Passing UI tests is not recognition accuracy. The reviewed dress sample is only two photos; no broad dress reliability claim is warranted. Correction memory is confirmed-example retrieval, not neural self-training; the evaluated retrieval run produced no qualifying proposals.

## 1. Validate recognition before tuning

Build a consented, independently labeled set of at least 50 new phone photos, including shirts of both sleeve lengths, pants, dresses, shoes and layered outfits. Include different people/devices, portrait orientations, lighting, clutter, dark garments and similar colors. Expand each key category to at least 10 examples before claiming category-specific reliability. Define expected category and primary color before inference; keep tuning examples separate from a frozen release holdout.

For each photo record automatic crop completeness, category, primary color, automatic acceptance versus review, optional-field errors and processing failures. Preserve dress hems and shoe soles; avoid including neighboring garments in crop/color samples. Test automatic whole-outfit isolation, not only manual adjustment. Retain the original and allow corrections without requiring optional material/brand/size fields.

Proposed release gates, not achieved results:

- At least 95% correct category AND primary color among automatically accepted items on the new frozen set. Report counts, sample size, acceptance coverage and per-category errors alongside precision so rejecting everything cannot appear successful.
- Any confidently wrong automatic save gets investigated; uncertain items receive a clear review path. Unknown optional attributes remain blank. User-confirmed corrections survive rescans and synchronization.
- Zero photo loss, cross-account exposure or silent save failure in the exercised capture, refresh, offline and recovery scenarios.
- All existing 59-photo regression safeguards and relevant automated workflows pass after each targeted recognition change. Compare before/after on identical inputs and publish regressions as well as gains.

## 2. Complete email onboarding

Verify current Supabase SMTP settings, a verified transactional sender/domain, provider delivery limits and authentication redirect allowlist. Custom SMTP is required for a broader pilot: the default sender is restricted testing infrastructure. Do not put credentials in the repository.

Choose the canonical app origin. The currently shared URL is Cloudflare; signup/resend/recovery currently target GitHub Pages. Align links and allowlist deliberately, then test external Gmail, Outlook and iCloud inboxes: signup, confirmation, resend, expired/used links, reset, subsequent login and opening on another device. API success alone is insufficient. Keep confirmation enabled.

Proposed experience: email/password signup → confirm email → welcome/open app → optional Add to Home Screen. Send a short welcome after verified signup with the app link, install instructions and help. Email must not promise automatic installation. No paid membership is needed for the free pilot. Provider setup and welcome automation have not been implemented by this checkpoint.

## 3. Explain the service and provide recovery

Before public signup, publish plain privacy and terms pages appropriate to the actual operator and service. Explain private clothing-photo storage, backup, correction use, retention and deletion; obtain versioned agreement acceptance and keep marketing consent separate. Provide account/data deletion and a support/feedback route. Verify deletion includes stored photos and related records. These are outstanding product requirements, not a claim of legal compliance.

## 4. Run a controlled pilot, then widen access

Start with 5–10 consenting testers after email gates pass. Each captures 5–10 garments, tries an outfit and dress mode, corrects an error, closes/reopens the app and checks backup/restoration. Include Android and iPhone, first model download, denied camera permission, slow connection and interrupted saving. Keep reports free of private imagery unless separately provided with consent.

Review category/color/crop failures and onboarding issues before inviting more people. Confirm storage, bandwidth, authentication-email quotas, model hosting and operating-cost limits. Retain a known-good rollback version and use the existing rollback checks. Preserve the simplified interface and high-resolution camera throughout stabilization.

## References

- https://supabase.com/docs/guides/auth/auth-smtp
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- [Authentication readiness](AUTH-EMAIL-READINESS.md)
- [Current checkpoint](PROGRESS-CHECKPOINT.md)
