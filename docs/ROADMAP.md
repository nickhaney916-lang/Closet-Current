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

## Current work — A more inviting app for younger users and parents

Preserve the bottom navigation, the direct Style shortcut, and every existing feature. Increase touch targets, use bright readable colors, keep clothing photos prominent, and shorten instructions. Inspiration and Style my collection remain distinct features and use the shared verified trend library where applicable.
