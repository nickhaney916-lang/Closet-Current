# Consolidation inventory — October 17, 2026

Target: `fix/photo-clarity-high-quality-downsampling-20261016`, base `2ccf3fb`.
All 18 published branches were included by ancestry at this checkpoint.
Current published work needs no duplicate cherry-picks.

The following snapshots preserve older local work without executing it:

| Patch | Source | Disposition |
| --- | --- | --- |
| `phone-color-validation.patch` | Local `improve/phone-color-validation`, commit `9268f9031689f122509a40a0f3b5810ffcd29064`, based on `a956988` | Primary-color phone benchmark draft; reconcile and test separately before activation |
| `older-outfit-color.patch` | Older `main` checkout at `a956988`, four modified files plus three new benchmark files | Mask-color sampling experiment and comparison workflow; compare with newer conservative color engine first |
| `older-site-ui.patch` | Older Sites checkout, five modified UI files plus backup.js | Historical styling/matching/backup edits; not allowed to overwrite current UI or account backup |

These patches are recovery material, not active application code or proof of
validated features. Source working directories and untracked photograph/model
outputs were not deleted or rewritten. Generated benchmark photos and dependency
folders are not source changes and were not copied into GitHub.

Pending reconciliation is explicitly retained in the master checkpoint. The
owner should pause other active development chats to avoid competing updates;
this repository cannot stop those conversations automatically.
