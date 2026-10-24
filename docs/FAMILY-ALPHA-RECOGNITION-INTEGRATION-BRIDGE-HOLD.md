# Closet Current — Family Alpha recognition ↔ staging integration release gate

**Main integration thread, October 23, 2026 (Pacific).** Branch is a source-pinned, **offline no-deploy compatibility rehearsal** based on existing protected-staging audit PR #277. It does not copy, merge or deploy either source tree.

## Why this is the highest main-thread recognition dependency

Parallel Work #20 benchmarks independently reviewed real photos; Chat #21 improves recognition failure/retry; Work #22 is original-photo→wardrobe/backup identity integrity; Chat #23 is correction UX. This main assignment checks the **integration boundary** between latest recognition admission PR #282 and the Family Alpha photo/avatar + staging Auth branch PR #277/#273.

Branch and revision inputs are **fixed SHAs** (not mutable PR branch names):

- Family Alpha packaging, original-JPEG 2D review + staged Auth source: PR #277, `879f1b92fb15f9bc9a7f0429c7ee178f7bbf1373`
- Recognition model/category, safe review flag and manual one-choice color: PR #282, `0586d08d9d40ce5da479f5ff656e03adf2c837e0` (stacks on #279 / #234)

Current source comparison verifies that the **latest recognition changes are NOT in the Family Alpha staged artifact**. The staging app is still based on an earlier `public/app.js`: no `recognitionReviewRequired` or per-scan `verifiedColorAdmission` / `canConfirmReviewedColor`. The recognition app alone does not contain `family-alpha-preview-boot.js` or the Family Alpha reviewed-photo staging page.

### Contract divergence (must reconcile, not overwrite)

| Asset | Integration risk |
| --- | --- |
| `public/app.js` | Existing source-photo handler/UI and old stage scanner vs latest reviewed source/owner/category/color admission differ materially |
| `public/index.html` | Family Alpha hidden 2D/garment preview and authentication script order vs recognition's newer photo/review controls differ |
| `public/recognition-engine.mjs`, `public/local-worker.mjs` | The classifier and worker interfaces differ: do **not** cherry-pick just the recognition `app.js` |
| `public/photo-color.js`, `public/clothing-details.js` | Color and optional clothing metadata evidence/subtype rules differ |
| `public/outfit-board.js` | Avatar/board invalidation behavior and saved-record dependencies differ |
| `public/auth.js` | Recognition's raw Auth source still routes to production; stage Auth MUST use the protected, separate staging-only transform and fail-closed config |
| `public/family-alpha-preview-boot.js` | Staging contains this localhost-only photo/avatar boot; recognition tree does not |
| `public/taxonomy.js` | Same pinned contents; can be reused |

**Do not merge `public/app.js` or `public/index.html` wholesale across stacks.** An unrelated component can be overwritten while CI for the source PR still passes.

## Reproducible offline proof

```sh
# Fetch exact source commits into THIS local repo, without checking out a moving PR head
git fetch --no-tags origin 879f1b92fb15f9bc9a7f0429c7ee178f7bbf1373
git fetch --no-tags origin 0586d08d9d40ce5da479f5ff656e03adf2c837e0

# From the Family Alpha audit branch, build existing HOLD candidate
node scripts/build-family-alpha-staging-auth-hold.mjs

# Proof: exact git show SHA:path source review and inspected AUTH-HOLD artifact
node scripts/audit-family-alpha-recognition-bridge.mjs --artifact-root=dist-family-alpha-staging-auth-hold
node --test tests/family-alpha-recognition-bridge-audit.test.mjs
```

The audit reads only Git objects and the built *local, inert* staged artifact; no customer photos, email, staging/production API calls, credentials, RLS modification, deployment, or paid services. No new "combined app" artifact is produced because this comparison **proves one is not ready**. A check that source imports line up is not authorization to expose the real wardrobe or family data.

The separate `dist-family-alpha-staging-auth-hold/` is a **disabled historical candidate**, not a live deployment. The checker asserts:
- It still routes the isolated generated client to staging project `fbnplztkbsteuzrmbgib`, not production `hlkgymugtfbirlpunsra`.
- The candidate's config remains `HOLD-NO-CALLBACK-OR-KEY` with empty key/redirect.
- App code matches the previous Family Alpha stage source (therefore newer recognition remains absent, a **blocker**, not a pass).
- The staging-only preview boot and original-JPEG avatar path remain present in source.
- Recognition's immutable latest code contains the original-photo source handler and ephemeral human-color proof; it still has no staged preview boot.
- The audit **fails closed** if one of these assumptions changes before a new source/release review.

## Integration implementation order after separate work returns

1. Stabilize source-locked recognition interfaces and review PR #280/#281 plus #282; do not silently replace parent worker/models.
2. Create a **new, isolated combination branch** from the latest approved Family Alpha packaging code. Bring the coherent recognition worker, engine, source photo, clothing details and type/color contracts into the stage app; manually reconcile `app.js` review UI and staged `index.html`, preserving `family-alpha-preview-boot.js` and garment/avatar photo pipeline.
3. Keep staging Auth/cloud/backup project selection confined to existing isolated `build-family-alpha-staging-auth-hold.mjs`. Never import recognition branch's production Auth client into an approved staged build.
4. Run frozen licensed-photo accuracy, source identity and review action suites; complete Chromium/WebKit mobile photo+avatar browser tests, staging Auth artifacts and four-user account-isolation tests; investigate failed tests rather than weakening admission checks.
5. Before actual family deployment require explicit owner consent and real staging Auth callback, restricted email delivery, live A/B JWT row/bucket denial, protected Cloudflare URLs and physical phone original photos. **User requested email SMTP setup be resumed tomorrow morning; this research task does not enable it.**

**Result:** Reproducible blocking compatibility report complete. **Integration itself / Family Alpha release: HOLD** until a separate implementation and real-stage verification are approved. No merge, deploy, production/data changes, personal photos, paid AI or Drive Duel.
