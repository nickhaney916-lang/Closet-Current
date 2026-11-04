# Draft DB credit reservation — NOT APPLIED (Oct 17, 2026)

The previous private FASHN adapter requires a `durableDbReservation`, but the repository had no concrete authoritative ledger. This migration is staged in PR #7 only; it has **not** been applied to live Supabase.

A production Supabase Postgres DB would use `public.garment_normalize_pilot_credits` as an internal 1-credit ledger: only service-role RPCs may reserve, claim and bind a provider job. RLS enabled, no direct anon/authenticated access; no source image bytes, JWT, API keys, prompt, or generated image is stored. A single transaction-wide advisory lock serializes reservations across all pilot users. A repeated identical request ID is idempotent, but a different owner/photo/category is rejected. Reserving counts credit permanently even after failures. Only one atomic claim is possible, **before** any paid provider call.

Hard-coded pilot bounds: **2 credits/user/day** and **100 credits total/month** across all users. This guards *edit-credit commitments*, not provider-billed USD charges or multiple model prices; costs must be separately configured and monitored at provider level before any real calls.

Integration remains disabled. No external Supabase migration/deployment executed, no existing data altered. Validation runs the SQL on disposable PostgreSQL 16 in GitHub Actions and asserts role grants, idempotency, exactly-one claim and both caps. After testing we can build a server-side service-role bridge to call the RPC; it must never pass client-supplied `user_id` to the ledger without independently verified Supabase auth.

**Next:** enforce reserve → claim → provider request → bind job exactly once from a server-only authenticated handler, with explicit source-photo consent and a separate provider credit balance. Do not enable until user approves uploading a licensed test photo and paid test credit. Main/live Closet Current and Drive Duel untouched.
