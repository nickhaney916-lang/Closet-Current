# Closet Current — MAIN P168 — cloud owner-session lease

**Family Alpha #255 HOLD · Draft research only · no merge or deploy.**

## Source parent and isolation

Direct isolated descendant of Priority #167 verified research PR #725, SHA faac51857d57356fb5568f035566a171cadaa418. Does not modify P167, Work #719, parallel Work #60 photorealistic fitting, staging/production, hosted Supabase, or owner private records. Exactly six P168-scoped paths.

## Actual correction

The old cloud API checked user ID before asynchronous token refresh, but did not require the same original owner and session epoch after the token arrived. Likewise a pending remote response could outlive the account session before an atomic restore. P168 adds a defensive exact owner, local auth epoch, auth object and owner-scoped IndexedDB identity lease, loaded as a real public app dependency before cloud-backup.js. The normal classic backup now checks that lease before and after token retrieval, 401 retry, HTTP response, remote JSON, photo decode, backup RPC, and local restore/backup marker commit. A changed session pauses cloud requests and keeps local photos unchanged.

## Tests and negative cases

The new isolated Node VM test executes the actual cloud-backup.js with disposable fake IndexedDB. It holds access token retrieval or a private HTTP response pending, changes the signed-in synthetic owner, then permits completion. Any stale-owner request, cloud RPC or private restore fails the acceptance test. Stable owner, valid epoch and matching private DB still permit an ordinary remote read. Full inherited repository tests run again. The separate inherited P167 actual browser test is rerun at 320, 390 and 430 CSS px in Chromium and WebKit, and twelve source SHA-checked screenshots are required. GitHub Actions enforces exact P167 ancestry, six allowed paths, and no deployment.

**P168 final source code acceptance passed at exact implementation SHA 00ddd2bd98d01d875885370d4a3fae2a00bb6157.** [GitHub Actions #42495465629](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42495465629) SUCCESS 2/2 independent jobs: clean native dist build, 1,326/1,326 inherited Node tests (zero failures), all 5 new adversarial P168 cases, genuine Chromium/WebKit 320/390/430 native original-photo styling cases 6/6, 12/12 source-image-sha-verified screenshots. [Screenshot proof artifact #13623181821](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42495465629/artifacts/13623181821). This report-only commit is being re-verified separately at the final branch head. Family Alpha remains HOLD.

## Critical limits

Client-side owner checks are defense in depth and **not** cryptographic proof of hosted Supabase JWTs or server RLS. Previous local P147 RSA-signed owner / disposable PostgreSQL RLS research remains separate. No hosted credentials are read, no real accounts or storage are touched, and no physical Android/iPhone hardware or external email flows are verified. Full signed issuer-backed two-account hosted HTTP/Storage acceptance and real-device QA remain separate release gates. No production or existing staging deployment, no Family Alpha invitations. FAMILY ALPHA #255 remains HOLD.
