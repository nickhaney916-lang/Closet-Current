# Restricted staging safeguard integration — assignment #148

New isolated branch from PR #147 (`7c5584526bcad0439876aabe1f30889e817806c7`) integrates PR #146 (`2b2423b1fae5af5f9f9d7def94162a3b5e166b38`). PR #145 (`87ac40be151f14ca6924c36abb9772677bcf779b`) is their common ancestor. Only the progress log overlapped; both historical entries are retained. Original branches remain untouched. Draft target is PR #147's development branch, never main.

The atomic builder and anonymous probe are retained together. The scope guard now permits the explicitly named staging-only additions. Dedicated no-deployment CI checks both source ancestors and byte-identical customer runtime, schema and production deployment workflows. It runs the complete Node suite and a synthetic staging bundle build/verification.

Four added integration tests run the real builder in temporary source copies with invented public configuration, never contacting a database. They verify:

- Successful atomic generation, removal of both known live backend refs from every generated source asset, staging-only Auth/backup/try-on URLs, paid AI disabled, and byte-for-byte preservation of all untransformed assets. Recognition, original-photo intake, indexing, wardrobe save and styling modules are unchanged.
- Both forbidden database configurations remove previously successful staging output.
- A late forbidden reference injected into synthetic source fails the scan and removes stale and incomplete output.
- An Auth rewrite mismatch after copying cannot expose a partially configured deployable directory.

The successful bundle is also paired with the anonymous probe: a public auth script on a preview still blocks the observed access check. Unit tests retain generic-denial/network-error failures and credential-free, non-following requests.

These tests verify generated configuration and failure behavior, not real service isolation or hardware. No hosted probe, Supabase write, customer photo/account access, paid resource, merge or deployment is performed. The supplied-host probe is not proof of complete hostname inventory or Cloudflare policy correctness.

Remaining blockers: a separate empty hosted Supabase staging project (previous creation hit the free-project cap), a separate Cloudflare Pages project with verified deny-by-default Access across all previews, disposable-account Auth/email/RLS/cloud restore tests, and actual Android/iPhone and independent garment review evidence. Do not work around the free cap by reusing either live project, deleting projects or enabling billing. Keep production promotion BLOCKED. Recommended next step: resolve a genuinely free isolated staging option with the owner, then configure and verify hosting protection before any upload approval.
