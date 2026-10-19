# Authenticated one-credit pilot submission — staged server components ONLY

Implemented `credit-ledger-client.mjs` (server-only service role RPC bridge) and `guarded-preview-submission.mjs` (protected sequencing of source validation, explicit server-verified consent, reservation, atomic single claim, one private provider submission, and binding resulting job ID).

**Security properties:**
- Supabase project URL is HTTPS-only on `*.supabase.co`; never follows a user-supplied RPC endpoint.
- User ID must have `verifiedBySupabase:true` from a trusted server auth path. The caller's JSON user_id is NEVER acceptable as authentication.
- No original garment pixels or private auth key are persisted in the pilot credit ledger. Actual decoded bytes must match SHA-256 before any reservation.
- The user must explicitly grant consent for an external image-edit preview of that exact item/photo. The service must verify this consent outside the user-controlled body.
- Reservation is backed by server `service_role` RPC, 2 credits/user/day, global 100 credits/month. An atomic claim is made **before** a provider request; on network/provider failure the claim stays consumed and cannot retry, deliberately sacrificing a credit rather than double-charging.
- Binding provider ID is single-use; results always remain preview-only pending garment fidelity review.
- Disconnected from browser and from any deployed Supabase Edge Function. No real provider or Supabase calls were made by these tests; all API responses are mocked and cost $0.

**Known remaining requirements before a *real* 1-credit image test:** apply vetted migration to chosen Supabase project with the user's permission, create private deployed Edge Function using validated JWT auth plus service-role client, configure provider key in Supabase secrets, independently sourced/user-approved test image consent, and perform real compare-by-source acceptance. No changes to the main branch or live Closet Current; no Drive Duel modifications.
