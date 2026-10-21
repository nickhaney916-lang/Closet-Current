# Closet Current — Staging build lock and interrupted-run recovery

**Development only.** Based on tested PR #156 without touching its branch or Work Assignment #157.

An exclusive local build lock is created with filesystem `wx` before the first destructive output operation. A second run cannot interrupt or delete a concurrent build. Normal errors clean the lock and incomplete candidate; a process terminated by SIGKILL leaves the lock plus incomplete non-deployable candidate behind, requiring manual owner inspection before retry.

If a stale `staging-dist.build.lock` or `staging-dist.incomplete-*` exists, **never upload staging-dist** or auto-break a lock based on an old PID. Verify the original process has exited, inspect and manually delete the lock and candidate, then rebuild/verify from clean source.

The real builder refuses abandoned incomplete work while preserving a previously validated artifact. Unit tests cover simultaneous builds, lock collision, orphaned source and a spawned child killed with SIGKILL; integration tests cover the actual staging builder. No real Supabase, hosted Pages, customer data, AI provider, original-photo pipeline, production code, Drive Duel or paid resources are involved. A successful code test is not permission to deploy or proof of Cloudflare Access.
