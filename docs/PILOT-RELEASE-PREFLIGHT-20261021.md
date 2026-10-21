# Closet Current — integrated candidate release preflight

**21 October 2026 · Isolated source audit, NOT staging or deployment.**

This priority checks the exact PR #140 integrated source and the two
production deployment workflows before the owner begins private physical-phone
validation. It intentionally does **not** collect names, account IDs, customer
photographs, service credentials or private phone reports.

## What is actually checked

- Original integrated SHA `c921cfc4ec72ccf5f333df99e6c4d6a20719541d` remains a Git ancestor.
- Compared with that exact source, only this preflight script, tests,
  read-only workflow and documentation may change. App photo handling,
  account/backup, original-first recognition, PWA source and deployment configs
  are not modified by this priority.
- GitHub Pages and Cloudflare Pages push-trigger rules remain restricted to
  `main`, with no PR or scheduled automatic publish path.
- The unchanged original-source holdout still has **zero** independent
  submitted human reviews and no gold-accuracy score. A future submitted review
  requires independent private verification, not relaxing this audit.
- Both the full Node suite and the integrated original-source QA guard rerun on
  this isolated branch.

Run from a full local Git checkout: `node scripts/audit-pilot-release-preflight.mjs`.
The report says **technicalPreflight: PASS** if the draft is safe to hand
to the pilot QA owner. It always says **productionPromotion: BLOCKED**.
These are intentionally different decisions.

## Important limits

The production workflows also contain a **manual** `workflow_dispatch`
trigger. This source audit **cannot prevent someone with GitHub permissions
from manually invoking a deploy**; the report explicitly states this.
No merge/deployment is authorized by a green preflight or any CI success.

Before release, the owner still needs independent blind original-photo garment
labels; actual installed Android and iPhone checklists/camera/color/storage/
offline/accessibility evidence; live disposable two-customer Supabase isolation,
restoration and external email tests; verified terms/privacy, data deletion and
figure rights; and explicit branch promotion authorization. No real phone,
recognition-accuracy percentage, live customer or cloud pass is fabricated.

This work creates **no new ChatGPT Work assignment**; all coordination
remains in the primary Closet Current conversation. Drive Duel, main, hosted
services, paid models and production remain untouched.
