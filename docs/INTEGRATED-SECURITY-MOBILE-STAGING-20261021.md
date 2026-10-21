# Work Assignment #157 — integrated development candidate

Base: verified PR #156 `c0fecc398ea927418c5e083607bdc1cf6ea77527`.
Merged dependency: verified PR #154 `cca2f7c98f69d5aad416e6174182ac3f66b9b951`, including PRs #149, #151 and #153. PR #156 includes #155, #152, #150 and #148 staging improvements. Both exact source CI runs were checked SUCCESS before merging. No published integration PR or matching new branch was found at start; no claim is made about unseen chat activity.

Only the progress checkpoint conflicted. Both source histories are preserved, with their shared trailing history stored once. Neither original branch is modified. The public application tree matches both completed parents exactly, preserving camera, full-resolution original-before-mask recognition, wardrobe, styling and account-switch behavior. The Supabase tree matches PR #154 exactly: reviewed audit and draft recovery improvements are included without altering production migrations or applying hosted SQL.

## Verification boundaries

`scripts/check-integrated-security-mobile-staging.mjs` requires both verified parents in ancestry; checks every inherited security/mobile/staging file against its source branch; pins the complete public and Supabase trees; independently pins original production workflows, migrations, function source and cloud schema; and checks both historical checkpoint prefixes survived. Only explicitly named integration docs, workflow and guard files may differ. The staging scope guard delegates combined candidates to this stricter two-parent guard while preserving its existing behavior for separate staging branches.

The dedicated integration workflow runs two independent jobs against the same candidate:

- Full app/Node regression, source guards, actual disposable runner-local Supabase CLI 2.121.0 Auth signup/login, two-way REST and private Storage account isolation, concurrent backup revisions, save failure/retry, migration drift rejection, safe recovery and re-hardening. The stack uses generated accounts/photos, strict localhost guards and a non-superuser migration executor; all local volumes and credential status files are destroyed.
- Full app/Node regression, source/release guards, atomic synthetic staging build and verifier, actual generated worker VM lifecycle, Android Chromium and iPhone WebKit app/photo-recovery emulation, and actual installed Chromium service-worker/offline cache checks. Staging backend replies are intercepted mocks; the installed-worker harness has zero external traffic. Installed iPhone PWA instrumentation is unsupported, so no such result is claimed.

These are separate client and local-backend integration checks on identical candidate source, not one hosted end-to-end pilot. No production/deployment workflow runs. Browser emulation is not physical-phone acceptance. Exact final SHA, pass/fail counts and CI links will be recorded in the draft PR and checkpoint after execution; until then combined candidate verification is pending.

## Remaining release blockers

The live permission findings remain unmodified. Any hosted migration needs separate approval and reviewed recovery; previously hardened databases with revoked administrator rights require administrative repair review. Separate protected hosted staging, Cloudflare Access, actual external email delivery, disposable hosted account verification, real Android/iPhone capture and installation, independent human original-garment accuracy and other release approvals remain pending. The free-project cap and no-paid-resource instruction are not bypassed. No customer data, paid provider, Drive Duel changes, production merge or deployment. Production promotion remains BLOCKED even if technical integration passes.
