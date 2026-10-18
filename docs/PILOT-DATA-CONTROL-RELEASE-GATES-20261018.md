# Pilot privacy, consent and deletion release gates

**Development-only review: October 18, 2026. Not an approved legal policy.**

## Delivered in draft PR #7
- Public `pilot-data-notice.html` accurately explains browser storage,
  private cloud photo/metadata copies, synchronization delays, retained
  photos after closet-item deletion, and absence of self-service
  full-account deletion.
- "How are my photos stored?" link on sign-in, "Privacy & my data" in
  authenticated My account, and a required **informational-only** signup
  acknowledgment in the new-account mode. Login, recovery, and logout
  have no new consent requirement.
- A versioned `pilot-data-notice-2026-10-18` marker and timestamp are
  included in signup `user_metadata` when explicitly checked.
  **This is user-editable metadata, NOT a legally validated consent log,
  server-side identity authorization, proof of delivery, or final terms.**
  Marketing permissions are NOT collected or implied.
- Synthetic tests ensure unchecked form cannot send signup; checked
  form sends one pending signup request, not an authenticated session.
  No live email or real-account changes performed.

## Live read-only Supabase inspection (October 18)
Project `hlkgymugtfbirlpunsra` returned `ACTIVE_HEALTHY`.
Read-only schema inventory reports RLS enabled on
`public.closet_backups` and `storage.objects`. Policy listing includes
owner-oriented private closet policies and
`closet_photos_delete` for authenticated Storage DELETE.
**A policy existing does not prove its owner predicate, coverage, or a
working end-to-end user deletion procedure.** No user photos, names,
emails, account records or auth secrets were accessed; no SQL was
written, no objects were deleted, and no Auth users were deleted.

## Blocks before family/friends pilot enrollment

1. **Operator-approved privacy and terms.** Name the real operator,
   support channel, lawful basis/retention schedule, third-party
   processors, rights/deletion turnaround, complaint route, and age/
   guardian requirements. Have a qualified reviewer approve them.
   Publish distinct URLs and versioned agreement handling after
   approval. Do not treat today's informational notice as final terms.
2. **Actual self-service deletion/request route.** Build a secure
   authenticated server-side workflow, not a client-side key or SQL
   shortcut. Require recent account verification, derive account identity
   from verified session (never a user-supplied account ID or editable
   `user_metadata`), provide explicit irreversible confirmation, and
   avoid claiming deletion on a queued request alone.
3. **Complete erasure** must remove all account-owned `closet-private`
   photo objects with the **Storage API**, not by deleting rows in
   `storage.objects`. Verify related `closet_backups` data,
   copies/duplicates, unfinished drafts, outfits, photo references and
   Auth account are cleaned up. Clean any retention/retry queues and
   document backup copies/retention. Deleting Auth users before owned
   Storage objects are removed can fail; check errors and report
   incomplete partial deletion without declaring success.
4. **Session safety.** Revoke refresh sessions; existing short-lived
   JWT access tokens may remain valid until expiry. Design authorization
   checks accordingly. Run separate owner/attacker synthetic accounts and
   verify no cross-account delete/read, repeated request handling, and
   interrupted partial failure recovery. No service-role secret in
   public assets.
5. **Real pilot operations.** Set a verified support email, actual
   SMTP and redirect allowlist, externally delivered confirmations and
   recovery emails, and physical Android/iPhone installation.
   Check backup says `Cloud backup up to date` on both devices before
   clearing local data. Choose canonical Pages origin and owner-approved
   release/rollback. Review age eligibility before inviting minors.

## Source checks
- Supabase Auth user deletion and JWT/session caveats:
  https://supabase.com/docs/guides/auth/managing-user-data
- Supabase photo deletion requires Storage API:
  https://supabase.com/docs/guides/storage/management/delete-objects
- Auth redirect allowlist and template guidance:
  https://supabase.com/docs/guides/auth/redirect-urls

**Stop/go:** The new notice and nonlegal acknowledgment are **ready for
development testing**. Broader pilot enrollment, final legal terms,
actual deletion, SMTP changes, production merge/deploy or any paid service
remain **not approved/not complete**.


## October 18 developer checkpoint — still OFF

Added `supabase/functions/account-delete/deletion-coordinator.mjs`
with strict owner identity, password, exact irreversible confirmation,
durable-write-lock requirement, Storage batch removal and verification,
backup deletion verification, and Auth removal LAST. Unit tests use only
synthetic owner UUIDs and fake photo paths. A Deno entrypoint
`supabase/functions/account-delete/index.ts` **always responds 503**
and cannot delete anything. Read the staged implementation/release gaps
in `docs/ACCOUNT-DELETION-DEVELOPMENT-GATE-20261018.md`.
No live Supabase migration or deletion was attempted.
The durable database/Storage upload write lock, real server Auth/admin
adapters and production policy approval are STILL NOT IMPLEMENTED.
Do not advertise a finished deletion feature or invite broad pilots.

