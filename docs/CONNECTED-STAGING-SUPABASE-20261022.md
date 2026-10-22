# Closet Current — connected staging backend binding (October 22, 2026)

**Status: development-side offline staging preparation only. NOT DEPLOYED.** This supersedes the October 21 note claiming that an isolated staging Supabase project did not yet exist.

## Live read-only findings from the connected Supabase account

- Organization `Closet Current` / `afsdfxyupfbtjrsgiwar` has **Pro** subscription. The extra-project compute quote was **$10/month**; *do not create another project*. Avoid modifying billing or any other app.
- Staging is a real separate, healthy project: **`fbnplztkbsteuzrmbgib`** / `https://fbnplztkbsteuzrmbgib.supabase.co`, region `us-west-1`, created `2026-10-22T01:09Z`. [Open staging dashboard](https://supabase.com/dashboard/project/fbnplztkbsteuzrmbgib).
- Existing live Closet Current backend `hlkgymugtfbirlpunsra` and Drive Duel backend `qlwotqbqxpgkheitsboe` are DIFFERENT and **must never receive staging traffic**.
- Staging has installed migration `20261022013436_isolated_staging_private_backup_rpc`; a zero-row owner-RLS backup table `public.closet_backups`; authenticated-only, invoker-mode `save_closet_backup` RPC; private `closet-private` bucket with JPEG/8 MB size limit and zero Storage objects; owner-folder Storage policies; staging security advisors returned zero lint notices.
- Two non-disabled **publishable** key types exist in staging. Their values, Auth Site URL and exact email redirect configuration are not published in this file and must be independently checked before signup. This repo workflow must never copy production keys, service role keys or customer accounts to staging.
- All these facts are a **read-only snapshot**; they do not prove actual hosted user signup, email delivery, Access protection or isolation under genuine account sessions.

## New verified-project-only offline build command

The staging build already generates its own static `staging-dist/` (rather than touching `public/`, `main`, or Cloudflare). The new wrapper `scripts/build-connected-staging-candidate.mjs` **only accepts the observed staging project ref**. Other refs (including production, Drive Duel and guessed test tenants) fail BEFORE any build.

After a separately approved Cloudflare staging preview origin and independently verified Access settings have been identified, an authorized developer can set these locally in a private shell (never check the publishable key into source):

```sh
export CLOSET_STAGING_APP_ORIGIN='https://<verified-preview>.closet-current-staging.pages.dev/'
export CLOSET_STAGING_SUPABASE_URL='https://fbnplztkbsteuzrmbgib.supabase.co'
export CLOSET_STAGING_SUPABASE_PUBLISHABLE_KEY='<publishable key from this staging project's dashboard>'
node scripts/build-connected-staging-candidate.mjs
```

This generates a local **sealed, offline, unpublishable** candidate: it replaces production Auth, Backup and try-on URLs in the OUTPUT COPY, forces the preview callback to the supplied staging origin, disables paid AI calls, checks assets and emits explicit `release:'BLOCKED'` evidence. The *builder does not independently validate the key belongs to staging*, does not contact Supabase/Cloudflare and does not verify any Cloudflare Access policy or hosted login. The CI uses a purely synthetic publishable-key fixture, not the real API key. Nothing is automatically deployed or paid for.

## Next real security gate: protecting the Pages root AND previews

Cloudflare official docs distinguish root `closet-current-staging.pages.dev` from `*.<project>.pages.dev` preview URLs. **Enabling Access on previews alone does NOT protect the root or any custom domain**. Configure Access applications for BOTH root and previews in the authorized Cloudflare dashboard; if there is a custom domain, protect it separately; inventory *all* hashed deployment URLs and branch aliases. Only then verify anonymous root+preview challenges and allowlisted/denied tester identities on actual hosted URLs, with no uploads or credentials before that verification.

Reference: https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain

After Cloudflare Access is genuinely verified, configure the **staging-only** Site URL and redirect URLs under [Supabase staging Authentication URL settings](https://supabase.com/dashboard/project/fbnplztkbsteuzrmbgib/auth/url-configuration). Confirm real email delivery and a fresh unique two-user staging signup plus photo-save, restore and cross-account deny. Never copy live customers or photographs.

**Owner action needed to proceed to hosted testing:** confirm the exact Cloudflare Pages staging project hostname and enable/verify root and preview Access (no Cloudflare management connector was available here). Do not publish `staging-dist` or alter Auth allowlists before Access has been confirmed.

**Release:** private staging access not verified; real Android/iPhone 0/2; independently human-labeled untouched original garment scenes 0/24; true category/color recognition accuracy unmeasured. Production `main`, all existing cloud projects and Drive Duel are unchanged.
