# Mission 3 — pin in-closet suggestion and shopping direction callbacks to initiating signed owner

**Family Alpha HOLD issue #255 OPEN. Research-only DRAFT, NO MERGE OR DEPLOY.** No production/staging, hosted Supabase/Storage/Auth, original private photographs or wardrobes touched.

## Exact verified parent

Stacked on green [Mission 3 PR #1112](https://github.com/nickhaney916-lang/Closet-Current/pull/1112) immutable HEAD `6d3b5179cbd1c0a81bae401e8fe92f5ae56e6833`, [dedicated full no-deploy CI #43542125754](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43542125754), **2,065/2,065 full Node PASS**, **108/108** added Chromium/WebKit legacy backup import acceptance, with all inherited owner/private cloud tests green. Other independently researching P146 cloud UI PR #1114 and Mission 4 source convergence #1110 stay untouched.

## Observed source issue

The default/research-native `renderBoardSuggestions()` renders two kinds of private outfit control:

1. "Already in your closet / Use this piece" buttons retain a source photograph's `item.id` and call `selectBoardPiece(target,item.id)` with **no originating auth, DB, epoch, wardrobe row or DOM attachment validation**. A saved previous-owner callback could apply the former owner's garment ID to a new signed-in draft, even after #1109 fenced the separate saved-outfit cards and picker.
2. "Try this idea on the board" buttons retain an `idea` and either mutate the **currently signed in default board** directly or call research-native `nativeLossless04Edit` on the current controller. That helper verifies the currently authenticated owner, not the owner that rendered the old idea. Detached or queued callbacks could write stale owner-derived suggestions into a later login or a newly bound native controller.

This is an auditable correctness/privacy **risk**, not evidence of a known production incident.

## Change

- Capture `beginOwnerBoardUiLease()` at each suggestion-list render and record the exact native consumer controller, if enabled.
- Before any owned original-photograph selection, require original lease to remain current, visible button still attached, unchanged suggestion target and exact original item still in current wardrobe list.
- Before a shopping/idea preview, require the original signed owner/session, attached button, unchanged target and (in native mode) original still-active controller. Only then enter existing safe default `storeBoard` or native `nativeLossless04Edit` flow.
- Preserve original garment JPEGs and SHA, owner correction, native/2D styling, signed-account private storage CAS, backups, review and original photo privacy. No release flags or other research branches touched.

## Validation

- `tests/mission3-outfit-suggestion-owner-lease.test.cjs` executes production owner-lease and `renderBoardSuggestions()` directly with synthetic signed owners. Covers valid default/native owner, owner switch, same-account re-login, DB identity, capture epoch, revoked auth, hidden app, auth gate, changing target, detached buttons, replaced wardrobe row and swapped/revoked native controller.
- `scripts/test-mission3-outfit-suggestion-owner-browser.mjs` executes the exact source callbacks in **264 planned controlled real Chromium/WebKit synthetic CSS-phone scenarios**: 44 modes × 2 engines × 320/390/430 widths. These are not physical device or owner data acceptance.
- A strict pinned-parent five-file no-deploy CI inherits full serial Node, original JPEG review/recovery, v1–v4 backups/atomic restore, native private BOARD04, previous 108 backup, 120 saved-card/picker, 102 signout, physical-browser simulations and disposable signed two-owner PostgreSQL/Storage RLS. No claims until both jobs green on exact HEAD.

## Remaining launch blockers

Real physical Android Chrome/iPhone Safari user-acceptance, authorized hosted two-account Auth/Storage RLS and backup, independently human-reviewed genuine photo recognition, actual source-photo garment geometry/cloth fitting and cross-mission merge-integrity/owner signoff. HOLD #255 remains OPEN.
