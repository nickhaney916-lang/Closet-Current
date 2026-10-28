# Family Alpha #70 — staging privacy and four-phone QA rehearsal (HOLD)

**Status:** Main-thread QA tooling complete, *not* live approval. Parent is fail-closed [PR #383](https://github.com/nickhaney916-lang/Closet-Current/pull/383), source `022d6908c20fdbe4135a9904d8c76f01c36cb888`. Work #53 and #54 retain clothing-isolation and avatar-fit ownership.

## What was independently observed, staging only, October 28, 2026

Read-only metadata calls to the connected **Closet Current Staging** Supabase project `fbnplztkbsteuzrmbgib`, never production `hlkgymugtfbirlpunsra`:

- The `closet-private` bucket is **not public**, JPEG-only, max 8 MiB. Storage objects RLS is enabled and three `authenticated` policies scope INSERT/SELECT/DELETE to `storage.foldername(name)[1] = auth.uid()` and the private bucket.
- `public.closet_backups` has RLS enabled. The authenticated role has **SELECT** but not direct INSERT or UPDATE; `closet_backup_writer` has INSERT/SELECT/UPDATE. The two policies on that table contain owner equality in both read/write clauses. `save_closet_backup` was observed as a security-invoker function. We did **not** invoke it.
- Metadata grants alone do not prove signed-in two-owner JWT isolation, actual owner photo downloads, writes, cloud backup restore, or physical phones. A valid test must have **positive own-owner controls** and denied cross-owner access.
- Supabase staging security advisors surfaced one warning: **leaked password protection disabled**. No changes were made; see [Supabase password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- An UPDATE policy for `storage.objects` was not observed. Do not assume object upsert/overwrite works; immutable, fresh-name uploads must be tested against the intended workflow.
- One observed table row and one storage object are not evidence of distinct four-account testing; we did not read contents, names or user identities.

This metadata-only report is saved in `staging-metadata-20261028.json`. It contains no UUIDs, tokens, emails, family names, photos or credentials.

## How to run the completed QA tooling

Generate a **private local phone checklist** from the fixed 47-case plan:

```sh
node scripts/family-alpha-70-mobile-qa.mjs --plan
node scripts/family-alpha-70-mobile-qa.mjs --template > /tmp/closet-alpha70-private-worksheet.json
```

This covers 9 steps each for four participants (two adults, two guardian-supervised children) plus 11 two-owner privacy, backup, restore and session-switch cases. The Android/iPhone adult assignment is suggested coverage, **not** a known family device assignment. The case list is strict and contains no real accounts.

After manual testing, locally change only the `status` field on the relevant case to `PASS`, `FAIL`, `BLOCKED` or `NOT_RUN`. Do not enter notes, identifying information, JWTs, URL paths, source images, email or file names. Produce a private, status-only progress summary with:

```sh
node scripts/family-alpha-70-mobile-qa.mjs --report /tmp/closet-alpha70-private-worksheet.json
```

Even if **all 47** boxes say PASS, this script still returns `decision:HOLD`, `releaseAuthorized:false`. It does not accept self-reports as proof of real device/JWT/security checks. Do **not** commit the completed private worksheet, run it in CI with credentials, or paste it into a public issue.

### Existing safe live JWT preflight — only if the owner explicitly authorizes it later

Reuse `scripts/family-alpha-48-real-jwt-readonly-preflight.mjs`; do not duplicate authentication code. It accepts exactly **two already authorized adult staging sessions** via local environment only, explicitly opts in via `CC_STAGE_APPROVED_READONLY=YES`, reads ONLY `/auth/v1/user` (identities retained in memory), owner-ID backup metadata and limited storage object-list metadata. It does not download photos, write, create accounts, or approve the pilot. Avoid entering tokens in issue comments, shell history or CI. Follow the existing script's safeguards and test in a secure local environment. It cannot prove cloud save/restore or physical devices.

The included injected-fetch regression tests simulate a successful two-account read-only check, fake foreign backup visibility, fake foreign photo listing visibility, missing own positive controls, forbidden production URLs/photo downloads/backup-document reads, and missing credentials. These are **synthetic** and never contact staging.

### Recommended execution order for four-person pilot *after separate authorization*

1. Adult A and Adult B with verified independent, consented, synthetic staging test accounts and real private staging access.
2. Explicit read-only JWT/owner row and photo-list verification with positive and negative owner controls.
3. Separate, approved **real** photo download and real cloud save/restore tests using synthetic non-personal clothing. These are **not** part of read-only preflight and must not be inferred from it.
4. On physical Android and iPhone, carry out camera, original photo, recognition, cutout/fit review, three outfits/swap, session logout, restart, failure recovery and private feedback tests.
5. Guardian-supervised child accounts with distinct sessions and devices; never share credentials or private images.
6. Review visual licensed-photo grades with the owner after parallel Work #53 and #54 have delivered human-reviewable evidence. Currently **0 PASS / 5 REVIEW / 10 FAIL**.
7. Only the main thread can coordinate a separately approved integration/deployment/invitation decision. Family Alpha still **HOLD**.

**No merge, no deployment, no staging/production writes, no private photos or account creation, no spending, no Drive Duel changes.**

Reproduce CI checks:

```sh
node --test tests/family-alpha-70-private-qa.test.mjs tests/family-alpha-69-release-gate.test.mjs
node scripts/family-alpha-70-mobile-qa.mjs
node scripts/family-alpha-69-release-gate.mjs
```
