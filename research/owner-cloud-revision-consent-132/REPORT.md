# Closet Current — MAIN Priority #132 / OWNER-CLOUD-REVISION-CONSENT-132

**RESEARCH-ONLY ENGINEERING DELIVERY · Family Alpha Issue #255 HOLD · DRAFT/UNMERGED · NO PRODUCTION OR EXISTING STAGING CHANGES OR DEPLOYMENT.**

## Starting point and scope

- Parent is Parallel #51's distinct P129 signed-owner research bridge, [draft PR #685](https://github.com/nickhaney916-lang/Closet-Current/pull/685), pinned at \`aa2d5b2f525d55f7c43dd67dc3130485951f6fec\`; this new isolated branch **does not modify that parent branch or its existing research source**.
- Parallel P129 is **not complete for real signed-user two-account cloud and live mobile acceptance**. The existing tests use fake HTTP access-token strings and separately simulated PostgreSQL owners. The underlying P129 mobile tests do not exercise the cloud adapter.
- Separate main P130 [draft PR #684](https://github.com/nickhaney916-lang/Closet-Current/pull/684) demonstrated that generic cross-device JSON merging can attach an owner-confirmed category/color reviewed for source photograph A onto the independently genuine original-plus-cutout JPEG of source B. A blind revision-CAS overwrite can also destroy newer remote-only wardrobe edits even though both JPEGs are valid and the write itself is owner-authenticated. **P132 does not attempt automatic reconciliation or claim to solve P130's semantic merge**.
- P131 facial realism is on its own draft branch and is not modified here.

## Delivered research change

New \`research/owner-cloud-revision-consent-132/revision-owner-gate.mjs\` wraps **the unchanged existing P129 bridge**:

1. Require a caller-supplied, previously observed **safe integer remote revision**, including explicit \`0\` for create-only first backups and a positive revision for restores.
2. Reject any existing-cloud backup except an intentionally selected \`owner-approved-replace\` operation. No automatic field merge, no silent overwrite, and no default remote revision inferred from the latest server response.
3. Before replacing an existing remote cloud wardrobe, show a caller-supplied owner decision callback with an unmistakable warning that remote-only changes may be lost. Accept **literal boolean true only**; a button callback returning \`{approved:true}\`, strings or cancellation does not authorize a write.
4. Capture the original authenticated owner identity/token before awaiting owner consent; re-check owner, token, session and explicit revoke epoch after consent and before delegating. A second concurrent operation is rejected.
5. Delegate to P129's existing authenticated Storage, independently double-JPEG-SHA-verified packaging, locally rechecked owner closet snapshot, remote backup RPC with **server-side revision CAS**, and P126 atomic restore with separate literal owner restore consent. Existing saved outfit IDs are preserved by the delegate.
6. Restrict public receipts to generic owner ID/revision/status metadata, explicitly marking research-only, no automatic photo/review merge, no independently signed JWT verification or Family Alpha release.
7. Allow caller-provided \`bridge\` solely for isolated tests; production auth/backend/UX are **not mounted**.

**Important safety limit:** an already-sent server RPC may have committed before a subsequent token revocation is observed; a revoked local receipt is not proof that a previously in-flight remote write was rolled back. P129 checks the owner lease before/after HTTP but is not a distributed cancellation protocol.

## Proof and test boundaries

New \`tests/owner-cloud-revision-consent-132.test.mjs\` covers:

- missing, negative, fractional, nonnumeric, unsafe and stale revisions;
- new-backup create-only success and immutable option forwarding to P129;
- explicit rejection of implicit overwrite, merge, and unrelated strategy names;
- literal true vs nonliteral affirmative-shaped owner decision, no writes after dismissal;
- logout/account switch, token replacement or explicit revoke during an asynchronous owner prompt;
- one active cloud operation at a time;
- explicit restore revision precondition and P129's separate owner restore consent;
- **actual unchanged P129 implementation** using ephemeral IndexedDB, a real publicly licensed JPEG, a distinct reencoded cutout JPEG with independent SHA-256, fake private Storage and fake HTTP revision-CAS, backup, owner-approved replacement, atomic restore and saved outfit ID preservation;
- stale CAS against a remote changed by another device, with no backup RPC;
- truth-in-advertising: fake unsigned test token is **not a genuine Supabase-signed JWT**.

The exact-head strict GitHub Actions workflow includes focused P132 and inherited P129 tests, full Node regressions, disposable real PostgreSQL 17 RLS/CAS using the unchanged repository SQL, and inherited real-app 320/390/430 Chromium/WebKit screenshot acceptance **as regressions, not tests of the P132 UI**. No physical Android/iPhone claim is made. This report is written **before exact-head CI success is known**; use the PR/Actions results for actual pass, fail or skipped counts.

## What this does not complete

This deliberately prevents unsafe *automatic* overwrites, but is **not** a working user-facing cloud conflict screen, three-way reviewed-source-atomic multi-device merge, independently signed two-account hosted PostgREST/Storage integration, or a replacement for P129's missing app mounting. The callback still needs actual protected UX and user authorization before use. No user account or private photos were accessed; only existing licensed fixtures are used. No changes to \`public/\`, \`supabase/\`, package files, staging, production, unrelated projects, or main.

**Delivery definition:** isolated research code/test/report/strict no-deploy workflow on a draft PR, all applicable exact-head CI checks green and transparent limitations. Keep Family Alpha #255 **HOLD** until real signed-account, photo/camera, 3D realism and physical-device release gates are met.
