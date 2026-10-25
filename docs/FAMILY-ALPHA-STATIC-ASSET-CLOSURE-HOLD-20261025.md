# Family Alpha v0.1 — complete staged asset preflight (HOLD)

**October 25, 2026 | Issue #255 | OFFLINE ONLY | No staging deploy**

## Why this additional audit is needed

Cloudflare Access has challenged unauthenticated visitors at the placeholder root, `/index.html`, and two preview hosts. After the one-file placeholder is replaced by an actual app, it is important to verify that the packaged root contains the *files its entrypoints actually reference*. A working Access challenge alone says nothing about whether the photo scanner, clothes catalog, Auth scripts, 2D photo garment preview, manifest icons, CSS or JS modules are packaged correctly.

## Added controls

- `scripts/audit-family-alpha-stage-assets-hold.mjs` audits the isolated **`dist-family-alpha-protected-preview-hold`** output from the reviewed builder, never ordinary `dist/` or a live URL.
- Resolves real local `<script src>` and relevant `<link href>` from **both `index.html` and `phone-photo-check.html`**, following stylesheet CSS URLs/`@import`, JSON webmanifest icons and statically declared or literal dynamic JS module imports.
- Refuses missing files, external executable resources, path traversal, malformed cachebuster references, symbolic links, a placeholder-only tree, or source candidate files modified after the existing original-photo/integrated/preview manifest audit.
- Preserves the independent staging-only Auth (blank callback and publishable key in the default output), owner/2D rollout disabled, exact staging host, and **release HOLD / no deploy**.
- The protected-preview GitHub workflow builds all upstream offline fixtures, audits references, runs synthetic broken-file/path traversal regressions, and never uploads anything to Cloudflare.

## Deliberate limitations

The checker validates **packaged file existence and static references**, not correctness of actual network responses. It does not prove that nonliteral worker/model fetch paths work, verify MIME types, evaluate every browser runtime import, re-run real recognition model inference, or guarantee pixel accuracy. These require controlled testing of an owner-approved full staging deployment. It also does not prove Cloudflare enforcement for every new JS/CSS file, unauthorized-user identity denial, Supabase JWT/RLS owner isolation, invite/password flow, or physical phone usage.

**Required next before activation:** explicit owner approval, stage-only Auth/Site URL coordination, protected full app upload, actual resource-route browser checks, safe real-user A/B RLS tests, photo capture→original JPEG→saved closet→2D garment preview→outfit swap on family phones, and documented pilot acceptance. No claims of production readiness.

No merge, deployment, secrets, customer photos, email, account creation, provider configuration, paid AI, spending, production, or Drive Duel changes.
