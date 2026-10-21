# Atomic restricted staging bundle preparation — October 21, 2026

## Risk addressed
Previously `build-restricted-staging.mjs` copied the normal `dist/` into a deployable `staging-dist/` **before** rewriting the original live Auth, cloud backup and try-on URLs. A failure partway through the conversion could leave a dangerous partially rewritten folder behind. A later manual upload of that folder could point disposable testers at live customer services.

## Fix
- The builder removes any prior staging output and generates into a uniquely named `staging-dist.incomplete-*` sibling, which is never the deployable `staging-dist/` path.
- Only after all Auth, backup, try-on, staging warning, versioned cache and forbidden-reference checks pass does it atomically rename the completed directory into `staging-dist/`.
- On configuration errors, source/signature mismatches, malformed output or copy failures, the temporary directory and stale deployable output are removed. The success message is printed only after the rename.
- Five independently runnable `node:test` regressions cover success, failed rewrite after production-like bytes were copied, stale-output removal, failure before copying, and invalid input.
- The original release source guard and complete Node regression suite continue to run in an explicitly non-deploying workflow. No Supabase/Cloudflare network writes, customers, paid AI, Drive Duel, production app source, database schema or public deployment workflow are touched.

## Limitations
Successful static preparation is **not** Cloudflare Access proof, actual Supabase project isolation, live Auth/email validation, hardware testing or authorization to deploy. `staging-dist.incomplete-*` can remain after an abrupt OS kill, but must never be uploaded; only a fully verified `staging-dist/` is eligible for separate future owner review. No staging project is created while the two-active-free-project limit blocks the new project. Production promotion stays **BLOCKED**.

To test locally: `node --test tests/atomic-staging-output.test.mjs`. Full integration CI rebuilds synthetic staging and checks `scripts/verify-restricted-staging-bundle.mjs`.
