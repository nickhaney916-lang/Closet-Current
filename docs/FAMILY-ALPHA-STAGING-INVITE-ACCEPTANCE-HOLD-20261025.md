# Closet Current Family Alpha — verified invitation acceptance and password setup

**October 25, 2026 · issue #255 · DRAFT / HOLD / NO DEPLOY**

## Grounded staging configuration — owner dashboard check

- Supabase **staging only**: `fbnplztkbsteuzrmbgib`. Production `hlkgymugtfbirlpunsra` remains off limits.
- Screenshot: public **Allow new users to sign up** switched OFF with a **Successfully updated settings** notice; manual linking and anonymous sign-in OFF; email confirmation ON.
- Owner screens: custom Resend SMTP enabled, sender Closet Current at `accounts@mail.closet-current.com`, `smtp.resend.com:465`, username `resend`, password masked. Resend domain/mail transport verification is not real invitation acceptance proof.
- **Site URL is still `https://pilot-access-check.closet-current-staging.pages.dev/`**. The allowlist now includes **both** that pilot path and `https://closet-current-staging.pages.dev/`, verified after refresh. Default Dashboard invitation links can redirect to the old pilot Site URL unless a supported explicit approved redirect is supplied. **Never invite anyone now.**
- Owner inspected confirmation, Invite user, password reset and magic-link email templates; each uses `{{ .ConfirmationURL }}`. Template content looks syntactically correct; actual delivery and end-to-end accounts remain untested.
- Supabase staging **exact** user count = 1 via read-only `select count(*) from auth.users`. Supabase UI's "10 users (estimated)" is **not** a count of actual current records. Selected user is email-confirmed and had a prior sign-in, but the user is not necessarily one of four approved testers.
- Current Cloudflare Pages staging main host still hosts the owner-observed single-file access-check placeholder. Protected full app is **not deployed**, even though source-pinned offline regression bundles pass.

## Problem in prior PR #297

The original source `public/auth.js` (and its previous stage-only derivative) recognized email callbacks `type=recovery`, but an email invite callback with `type=invite` passed directly to `showUser(data)` after the token was checked through `GET /auth/v1/user`. An invited tester could therefore see the closet without ever selecting an account password, leaving later password login unusable.

Supabase officially documents invitations as admin/Dashboard-created users, with `{{ .ConfirmationURL }}` used by the invite template, an allowed `redirectTo` needed for the intended host, and a normal invited-user *finish setup* step. The default implicit email callback may return session tokens in the URL fragment. See:
- https://supabase.com/docs/guides/auth/users
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/auth/passwords

## This isolated fix (no activated users)

New `scripts/family-alpha-stage-invite-acceptance.mjs`, applied **only** to `stageAuthSource()` after production-route stripping, expired-session protection (#296) and public staged-signup removal (#297).

The default `#...&type=invite` callback is first verified using the staged Supabase `GET /auth/v1/user`. If it verifies, the private shell **remains hidden**, the inviter's email field is locked, and the user is prompted to choose a password (minimum eight characters). Only a successful authenticated staged `PUT /auth/v1/user` returning **that same user ID** unlocks the closet. Invalid/expired tokens, mismatched user IDs, or a session-generation change do not unlock. The callback token is removed from browser history before fetching. Password **recovery** keeps the existing choose-new-password workflow, and an ordinary verified **magic-link** retains its separate behavior.

The suite `tests/family-alpha-stage-invite-acceptance.test.mjs` runs the actual derived stage Auth source in a fabricated Node VM DOM/network. It checks locked-before-update, PUT owner equality, no cross-account/production traffic, expired/invalid password update, recovery/magic-link regression, and a delayed verified invite after local cross-tab invalidation. Neither CI nor this branch invokes real signups, Dashboard invitations, real emails, new Supabase records, or Cloudflare deployment.

## Required pre-invite live gates — not satisfied

1. Obtain explicit owner's permission to deploy the fully gated staging application to **closet-current-staging** (not the production `closet-current` project). Verify correct underlying build and complete Access protection across main host and asset paths; unauthorized user denies.
2. Verify **current** admin-only signup restriction through Supabase staging settings and a separately approved **direct-API negative test** (the UI checkbox screenshot proves saved configuration, not a runtime unauthorized request). Existing authenticated accounts must still sign in; four planned tester identities must be inventoried, confirmed and explicitly approved.
3. Set staging **Site URL** to the protected deployed app root, or use a separately verified supported explicit invitation redirect targeting exactly `https://closet-current-staging.pages.dev/`; do not use temporary `pilot-access-check` for actual family email. Main staging root is allowlisted already. Owner must approve any such URL setting change.
4. Activate correct staging publishable **public** key and redirect only in an owner-approved staging build. Never put the service-role or secret key in the browser or GitHub logs.
5. Obtain consent for a **single synthetic adult/test-account** invitation and accepted-password run; verify SMTP transport, Cloudflare challenge, exact callback, authenticated session and tested password recovery. Only then perform approved actual JWT A/B owner isolation/RLS & private JPEG Storage positive/negative checks.
6. Complete mobile Android/iPhone original JPEG, reviewed multiple garments, saved cloud wardrobe, 2D avatar layers, three outfits and one-piece swap before inviting four family members.

**Family Alpha = HOLD.** No merge, deploy, settings write, user/email activity, customer photos, paid AI, spending or Drive Duel changes.
