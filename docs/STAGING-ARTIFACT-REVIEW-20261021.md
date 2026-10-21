# Closet Current — restricted staging artifact review gate

**Status:** isolated developer safeguard, not permission to publish; October 21, 2026.

## Gap addressed

PR #158 protected **creation** of staging output with an exclusive lock and fail-closed interrupted-run handling. But an operator could still run the old `verify-restricted-staging-bundle.mjs` against a complete-looking `staging-dist/` while `staging-dist.build.lock` or an orphaned `staging-dist.incomplete-*` existed. The previous verifier also read selected files without confirming every entry was a normal file inside the artifact tree.

## Implemented

- `scripts/check-staging-artifact-integrity.mjs` checks that no lock or abandoned incomplete candidate exists, the staging root is a real directory, nested entries are regular files/directories (never symlinks or special files), and **all generated text files** are free from known production Closet Current/Drive Duel endpoints and live callback/publishable key. Re-checks sibling lock/orphan state after scanning.
- `scripts/verify-restricted-staging-bundle.mjs` runs this check **before** reading the existing preflight manifest, then retains all current namespace, paid-AI, backend redirection and staging watermark assertions.
- Seven dedicated unit tests cover good-but-nondeployable artifacts, locks, orphaned candidates, forbidden production refs, symlinked files/folders, symlinked root and empty/invalid bundles.
- A real generated-builder integration regression builds a synthetic staging bundle, confirms ordinary review passes, then injects a lock, orphan and Drive Duel ref separately, verifies **each is rejected**, removes them and checks the bundle passes again.
- GitHub Actions runs full app test suite, all existing source-preservation guards, synthetic staging bundle verification and existing PWA cache checks. It does not create hosted staging or publish anything.

## Operational limitations

**No code-only verifier can guarantee a bundle is safe after it is subsequently changed.** Re-run the verifier immediately before any separately owner-authorized upload and do not upload folders containing a build lock or partial candidates. Existing synthetic `staging-dist/` uses an invented backend and still has `restrictedStagingDeployed=false`, `privateCloudflareAccessPolicyVerified=false` and `productionReleaseApproved=false`. Those remain strict blockers.

The operator must independently establish a distinct Supabase project and deny-by-default Cloudflare Access for **all** preview paths, then perform disposable two-account hosted tests. No user/customer files, live database writes, commercial AI, Drive Duel mutation, production merge or deployment are included.
