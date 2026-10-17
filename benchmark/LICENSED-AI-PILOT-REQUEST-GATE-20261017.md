# Disabled, authenticated, four-photo-only image-edit pilot

**Read-only Supabase discovery (October 17, 2026):** Closet Current project `hlkgymugtfbirlpunsra` is active, with existing RLS-backed `public.closet_backups` and no Edge Functions. The credit ledger has not been applied. The other named Supabase project is **Drive Duel**; never touch it.

`licensed-pilot-handler.mjs` contains a private request handler that:
- defaults to OFF and accepts only exact configured HTTPS app origin;
- accepts only a bearer credential independently verified via Supabase Auth `/auth/v1/user`;
- limits use to **one allowlisted account ID** configured only in private Edge Function environment;
- accepts only the four SHA-256-locked *licensed benchmark originals* (orange shorts, black jacket, gray jeans, black/orange shoes), with source ID/category SHA matches;
- requires explicit **per-request transfer consent** `consentToProvider:true` and protocol version, after user login;
- calls the pre-existing SHA-verifying guarded source→credit reservation→single-claim→provider-submission flow; never stores original bytes or automatically approves output;
- allows authenticated `status` requests only after a server-side database lookup scoped to that user/request and a previously bound provider job ID; responses are private base64 previews and no-store.
- does **not** allow users to upload personal closet photos for this pilot.

`index.ts` is an unconnected Deno Edge Function entrypoint with a hard-off default, requiring secret environment config (Supabase URL, publishable key, service-role key, FASHN key, app origin, allowlisted user UUID, feature flag). No deployed function, database migration, provider call, customer data upload or charge was made by authoring or testing this code.

**Next blockers before paid test:** The read-only status lookup must be implemented in the server-only ledger client; mocks must pass. Then decide whether to apply the vetted database migration and deploy the disabled function to the confirmed Closet Current project. Activating the pilot requires a real provider credential, a verified user UUID allowlist, and an actual affirmative consent to transfer the licensed benchmark photo. No blanket enablement or auto-save.
