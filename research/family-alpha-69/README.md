# Family Alpha #69 — four-person release checklist (HOLD)

**Source:** [Family Alpha #68, draft PR #382](https://github.com/nickhaney916-lang/Closet-Current/pull/382), pinned to `d8d95bf7297b91bdde2a5cfa274203ca12cbc1f1`.

The dedicated no-deploy integration workflow passed; the inherited Work49 workflow also passed on retry (attempt 2). These are **offline browser and synthetic checks only**. They do **not** prove a family pilot is safe, and they do **not** change staging or production.

## Why this gate exists

A green CI check previously risked being mistaken for approval to invite four people. `scripts/family-alpha-69-release-gate.mjs` deliberately has **no READY branch**. It reads a tiny, non-personal JSON snapshot, strictly rejects unknown fields/unsupported positive claims, and emits `decision:HOLD` every time. A later live/physical evidence review and explicit owner release decision must be performed separately; do **not** edit this report to declare approval.

## Required human and live checks, before any invite

1. **Visual approval:** Review all 15 licensed original/cutout/2D worn-avatar comparisons and new real-photo improvements from Work #53 and #54. Show genuine recognizable fabric and sensible fit; never infer invisible fabric or call an arbitrary image successful because CI passed. Current **0 PASS / 5 REVIEW / 10 FAIL**. The human release owner must explicitly decide.
2. **Two-owner privacy:** On approved staging, with safely created **test accounts**, verify A/B JWT isolation across wardrobe, original image download, derivative masks, gallery selection, outfit saves, cloud restore, token expiry and account switching. No private data pasted into public issues.
3. **Four separate accounts:** Verify independently signed-in adults and children; each sees only their own wardrobe, saved outfits and photographs. Test logout and browser restart. Use guardian consent and collect no unnecessary information from minors.
4. **Real backup and restore:** Capture → original JPEG (recognition source) → save → reload → cloud backup → fresh session restore → same garment IDs and outfits. Confirm rollback on interrupted save without cross-account leakage.
5. **Physical Android and iPhone:** On **real phones**, test still camera, multi-garment review, type/color correction, original-photo save, avatar cutout review, three outfits, swap, refresh, session restart and error feedback. Browser emulation does not satisfy these.
6. **Staging protection:** Independently verify Cloudflare entry restrictions, Supabase authenticated access, storage/database owner RLS and email/signup flows for staging only. Do not touch production.
7. **Private feedback:** Provide a simple bug feedback channel that does not disclose original photographs, email, tokens, minors' information or account IDs into a public GitHub issue. Confirm users know how to report an image problem privately.

## Four-person test matrix

| Tester | Device | Isolated account | Capture/save/reload | 3 outfits + swap | Private feedback |
|---|---|---|---|---|---|
| Adult A | Physical Android | Not verified | Not verified | Not verified | Not verified |
| Adult B | Physical iPhone | Not verified | Not verified | Not verified | Not verified |
| Child A (guardian supervised) | Physical phone | Not verified | Not verified | Not verified | Not verified |
| Child B (guardian supervised) | Physical phone | Not verified | Not verified | Not verified | Not verified |

Device allocations above are **proposed test coverage**, not known household assignments.

## Explicit restrictions

- **HOLD.** No merge, deploy, staging/public URL changes, production, Supabase, Cloudflare, Resend or Drive Duel mutations in this work.
- No paid services, real customer data or sensitive example accounts.
- Parallel Work #53 owns garment isolation and Work #54 owns natural 2D clothing fitting. This checklist only records independent release blockers.
- Treat completed automated cases separately from human approval. Update this checklist after independently supported evidence becomes available; never backfill guesses.
- Existing `research/family-alpha-69/evidence-HOLD.json` must not be edited to claim live proof or authorization. Create a distinct owner-reviewed release decision only when ready.

## Reproduction

```sh
node --test tests/family-alpha-69-release-gate.test.mjs
node scripts/family-alpha-69-release-gate.mjs
```

Expected output contains `decision:"HOLD"`, `releaseAuthorized:false`, the exact integration source SHA and all eight `NOT_VERIFIED` real-world gates. This can be run offline without browser installs, account access, GitHub writes or cloud configuration.
