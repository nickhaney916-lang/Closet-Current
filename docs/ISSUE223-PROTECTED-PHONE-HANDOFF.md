# Issue #221 / assignment #223 — protected physical-phone handoff

## Candidate and boundary

Separate `qa/issue223-protected-pilot-20261023` starts at PR #222
0e1dc1a077f96a6de70bbdf884cadd06eb429a30. Its customer `public/` and backend
source are identical to approved development PR #220
0f62e253c1fd0024a939cd401710dcd3784a9e77. No existing branch is moved.
This is offline preparation, not a protected hosted release or authorization.

## Historical artifact independently verified

Run 39967794602 succeeded, but artifact 12507622171 has a packaging defect.
Downloaded outer ZIP SHA-256:
`f327d4e3c1e3bcf117b34c2a0e056871c5f7e04eb15b6e4eb4a416b1236b6884`.
All 95 external checksum entries match. Strict `verifyStagingAssetSeal` fails
`added or deleted asset`: the workflow adds `issue-221-source-commit.txt` and
`issue-221-NO-DEPLOY.txt` inside staging-dist after its 92-asset seal is created.
The checksum list covers those additions, but cannot substitute for a passing
strict seal. The immutable historical artifact remains untouched and NEVER
DEPLOYABLE. Removing files from it is not the proposed repair.

It records checkout a8537074a67682cedcb64db84c591ac2edad05ee, GitHub's PR merge
commit (parents #220 0f62e25 and #222 0e1dc1a), rather than workflow head itself.
Its tree equals #222's tree; app source equals #220. A fresh build with exactly
its synthetic config reproduces all 93 original sealed-bundle files, including
the seal itself, byte-for-byte. See benchmark/issue223/historical-artifact-audit.json.

## Repair and newly prepared candidates

`scripts/package-protected-pilot.mjs` verifies the input integrity and seal,
pins public/backend source to #220, then copies the sealed directory into a
fresh outer envelope. Provenance and NEVER-DEPLOY labeling live OUTSIDE it.
The final envelope inventory, provenance and inner asset seal are verified
again. Added/changed files, linked/special entries, source drift and overwriting
prior evidence are refused. Camera CI now fetches full history so source-provenance tests can resolve the
pinned ancestor; its previous shallow checkout correctly failed closed on a
missing baseline object. No test assertion was bypassed. Browser CI uses the official Playwright 1.56.1 Noble image pinned by registry
digest to avoid a long hosted apt/dependency setup stall. The npm version and
all browser assertions remain unchanged. The inventories are unsigned integrity records,
not authenticated approval or proof of hosted protection.

The original #222 workflow is also repaired to use this final envelope, so a
future separately authorized run cannot repeat its post-seal mutation. The
independent assignment workflow uploads only a distinctly labeled
SYNTHETIC-NEVER-DEPLOY tar plus checksum.
It has invented credentials, is not a phone-test deployment, and must never be
hosted. Exact-head CI/artifact digest belongs in the draft PR and issue #221.

A separate LOCAL offline candidate was built using the existing approved
staging project fbnplztkbsteuzrmbgib, its non-disabled public publishable key
returned by the staging management connector, and the previously documented
pilot-access-check preview origin. No key is checked into source or CI. The key
is not a service secret. The staging project is ACTIVE_HEALTHY and distinct
from live Closet Current. This build makes no Auth/database/Cloudflare request.
Its preflight assertions correctly remain BLOCKED/undeployed. Its final source,
package and archive hashes are recorded in issue #221, never represented as a
hosted build. No configuration was changed.

## Read-only hosted evidence and unresolved protection

Anonymous GETs, no credentials/cookies and no redirect following: 99 verified
bundle/critical/cache-busted routes × 2 documented origins = 198 requests, all
198 received a Cloudflare Access login redirect. No protected page/photo body
was retrieved. Root: closet-current-staging.pages.dev; known preview:
pilot-access-check.closet-current-staging.pages.dev. See committed anonymous
report, which deliberately retains policyVerified=false and inventoryComplete=false.

This is observed challenge behavior only. No Cloudflare management connector,
complete deployment/custom-host inventory, actual Access rule/allowlist review,
allowed tester login or denied tester proof was available. No live Auth settings,
SMTP callbacks, RLS/private Storage or disposable two-account restoration was
verified. Supabase project identity/key provenance is not hosted isolation proof.
Therefore hosting/distribution is NOT recommended yet. Existing privacy,
retention/deletion and adult-only pilot gates remain. Do not invite testers.

## Physical Android/iPhone checklist (UNEXECUTED)

Reuse the existing research/pilot phone sheets at PR #217 3d18054 and issue #9;
this handoff adds exact-candidate and privacy controls rather than another app.

1. Main conversation reviews dependency chain, final source SHA, archived tar
   hash, inner seal and actual config. Never use the synthetic CI tar.
2. Obtain complete hostname/deployment inventory and independent review of
   deny-by-default Access rules for root, every preview/alias and custom domain.
   Confirm a denied identity is blocked and an approved adult identity can enter.
3. Verify staging-only Auth callback/Site URL and two disposable staging-account
   isolation with authorized synthetic/appropriately licensed photos. Do not
   copy customer accounts, customer photographs or production data.
4. Only after review, request OWNER APPROVAL for a specific protected staging
   deployment. This assignment does not deploy, alter settings or invite anyone.
5. After that separately authorized deployment, record exact installed build
   fingerprint, source SHA and hash on one physical Android and one physical
   iPhone. Record model, OS, browser/PWA version, network and date privately.
6. Use the SAME immutable licensed fixture set, source hashes and categories:
   top/light/dark/pattern, pants, shorts, skirt, dress, sneakers/boots, jacket,
   layers and cluttered/low-contrast hold cases. Label original category/color
   independently BEFORE predictions. Keep predicted and corrected labels separate.
7. Capture/import → recognize/index → Style this → three DISTINCT owned looks
   when inventory permits → selected-item pin → swap exactly one piece → save →
   reload/relogin restore. Confirm original bytes, color, print and detail remain;
   dress clears separates/layers and shoes remain placed; no invented garments.
8. Replace original/crop metadata while a preview is pending; duplicate an ID;
   supply invalid photo; switch A/B; test offline/error/retry/abort. Expect old
   preview cleared, no cross-account thumbnails/data and no stale queued save.
9. Check 320–430px layout, legibility, >=48px main actions, camera permissions,
   back/cancel, large image memory and interrupted network. Time actual steps
   and count taps. Record browser crashes and missing/held pieces, not only passes.
10. Two independent adults compare original versus preview for color, texture,
    pattern/logo, edges and placement. Record visibility and disagreements;
    never score unseen fabric as correct. No mask/segmentation accuracy without
    original-linked human-reviewed masks and complete physical-item inventories.

## Evidence process and decision

Private evidence folder per candidate: candidate SHA/hash/fingerprint and
allowlist review; one Android and one iPhone checklist; fixture SHA manifest;
initial predictions, corrections, timings/taps and repro steps; independent
fidelity sheets. Keep alias-only reviewer/device IDs. Do not put emails, Auth
URLs/tokens/cookies, private photos, account IDs, source keys or raw screenshots
with private details into public GitHub. Public handoff contains sanitized
pass/fail/blocked counts and evidence IDs only. Existing offline worksheets and
pilot intake CSV can be used; self-reported hardware remains operator evidence,
not an automated proof. Main conversation reviews it before any go/no-go.

Current physical devices: 0/2. Human garment fidelity and segmentation accuracy:
unmeasured. The three challenging licensed photo cases remain held, not successful
realistic transfer. Fixed low-resolution bodies, conservative extraction and
20MP preview decode budget remain limits. The 2D app is an approximate styling
collage, not sizing/fit/drape simulation. Recognition admission remains subject
to unchanged gates; green regression is not a 100% recognition claim.

No deployment/merge, production/cloud setting changes, customer photos, paid AI,
costs or Drive Duel work. Main conversation owns integration/release decisions.
