# Assignment 45 — owner-local wear-history portability (HOLD)

Controller authorized isolated local v6 research in cycle 3; no public release, hosted schema or deployment authorization.

## Contract
- Explicit `researchWearV6:true` on export, prepare and commit. Ordinary v3/v5 exports and imports retain their established format; v6 or mislabeled history sections are refused by default. Older readers do not support v6.
- Version 6 has the existing closet-current wardrobe payload, `wardrobeVersion` 3 or 5, matching top-level `ownerId`, and `wearHistory:{version:1,owner,events}`. A single readonly items/state snapshot supplies both wardrobe and history; the existing atomic import transaction includes the history row and whole-database conflict check. Existing JPEG and organization validation remains in force.
- A same-owner restore retains distinct events and skips identical event IDs, refuses changed IDs, duplicate day/combination, invalid or foreign sections and capacity overflow. No automatic truncation. Historical references may refer to unavailable garments. No event synthesis or date conversion. Restore from backup can reintroduce a previously undone event after a fresh explicit confirmation; the v1 ledger has no deletion tombstones and is not a multi-device synchronization protocol. An undo between prepare and commit invalidates the plan.
- Never silently downgrade v6 into v5. v3/v5 do not carry history. The public app still uses v3/v5; no UI or cloud integration is claimed. Before a public v6 UI, expose confirmation and history counts, refresh history from durable storage, communicate conflict/overflow and older-version incompatibility, and coordinate #1656/#1783/#1797/#1712. No changes to old-reader live DB rollback or offline PWA startup.

## Verified reference
Exact head a7795aca47d6ce1abc609711d44b90af85a6d8d8, dedicated run 46108989056: 3191/3191 regression; native Chromium and WebKit 320/390/430 separate-history and combined-v6 fresh-profile recovery, injected rollback and exact original/organization/history after reload. Separate-history offline restore verified; combined offline operation is not claimed. Synthetic local profiles and hash-pinned licensed fixture originals only, not physical-device or hosted acceptance. Additional capacity and conflict tests require new-head CI. Family Alpha #255 remains OPEN/HOLD.
