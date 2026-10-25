# Family Alpha v0.1 — staging Cloudflare Access browser smoke record

**Owner-reported, October 25, 2026 · Issue #255 · NOT A RELEASE APPROVAL**

This is a dated record of what the owner observed during interactive private-browser checks against the existing **one-file staging Access placeholder**. It is not a Cloudflare API policy export, an automated external penetration test, or evidence that the full Closet Current Family Alpha app is deployed.

## Evidence reported in the main Closet Current conversation

| URL directly opened without signing in | Owner-observed result |
| --- | --- |
| `https://closet-current-staging.pages.dev/` | Cloudflare login screen |
| `https://closet-current-staging.pages.dev/index.html` | Cloudflare login screen |
| `https://pilot-access-check.closet-current-staging.pages.dev/` | Cloudflare login screen |
| `https://a15254d6.closet-current-staging.pages.dev/` | Cloudflare login screen |

After signing in through Cloudflare with the **policy-approved owner email**, the owner reached the **existing preview/Access test page**, **not** the complete Family Alpha application.

A separate, unapproved address was presented with a generic **check your email for an access code** prompt, but no code was received. The absence of an email is **consistent with** Access filtering; it is **not independently verified identity denial**. No unapproved-user session was authenticated and definitively rejected.

## What these observations establish — and do not establish

- **Observed:** Cloudflare presented a login challenge at all four listed URLs to a fresh, unauthenticated browser session. An approved owner got through the challenge. The specific `/index.html` path has been challenged.
- **Not verified:** Definitive denial to a fully authenticated unapproved identity; all JS/CSS/media/static assets or other aliases; enforcement once the complete app replaces the placeholder; full-app signed-in security; account isolation; direct Supabase Auth protection; refresh/recovery login; live RLS/Storage A-vs-B tests; camera and physical-phone tests.
- **Build status:** GitHub draft stack #293–#299 is offline/HOLD, unmerged and undeployed. The owner observed only a single uploaded `index.html` in the current staging project.
- **Auth status:** The exact staging root has been added to the Supabase staging redirect allowlist. The staging Site URL still points to the temporary pilot preview, and the source-built default stage Auth still has no publishable key/callback. Neither is active in the public placeholder.

## Next approval boundaries

1. Confirm a coherent source-pinned full staged app artifact, with explicit root-only runtime routing, no production endpoint, independent disabled-by-default avatar gate, and passing CI.
2. Obtain explicit owner approval for any staging-only full-app deployment or Auth/Site URL changes; no assumed approval from this smoke test.
3. Recheck Access protection for new JS/CSS/asset routes and hashed previews *after* the approved full-app upload, including a valid unapproved-identity denial test if safely available.
4. Before family invitations, test real invited sign-in/recovery, server-side rejection of unsigned-up users, signed-in staging A-vs-B JWT + storage owner isolation, and mobile camera → original photo → closet → photo-based 2D avatar → outfit swapping.
5. Record separate owner approval before broader four-person pilot release. Keep minors' photos private and out of public GitHub issues.

**No deployment, merge, production change, GitHub Actions secret, Supabase/Cloudflare/Resend setting edit, test email, account creation, spending, or Drive Duel change is authorized by this record.**
