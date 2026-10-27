# Frozen 15-photo original-board visual review — HOLD

This development-only review is stacked on draft PR #349 and reuses the unchanged Work #43 original-photo board, `board.mjs`, `policy.mjs`, and CSS. It uses the exact 15 licensed original JPGs previously benchmarked by PR #324/#329, checked byte-for-byte against the repository's pinned manifest. It does not copy unrelated customers' photos or invoke providers.

## Reading the gallery

- **Top:** three manually assembled photo-only combinations. These are not the output of the recommendation engine or real users.
- **Below:** every one of the 15 original source photos with the scene warning and individual source attribution/license link.
- The full outfit photograph, person, mannequin, hanger, single boot or background may still be visible. They are *source-photo artifacts*, not proof of bad clipping or a virtual fitting result.
- A green browser test means the unchanged policy displayed original JPEGs at mobile browser widths. It is not a human aesthetic quality grade and not a physical-phone result.

## Offline reproduction

```sh
npm install --no-save --no-package-lock playwright@1.56.1
node scripts/build-original-photo-board-15-hold.mjs
node scripts/test-original-photo-board-15-browser.mjs
```

The independent build pins the exact Work #43 board/policy/CSS to #349 commit `b771329a5502cf53e495c860fe8c342d7ca3443a`; hashes the 15 source photographs before copying them to its separate dist folder; and never changes user wardrobe, login, app code or the staged site. On successful CI, screenshots are included as a **HOLD/NOT APPROVED** Actions artifact.

**Release status: HOLD.** Zero real owner visual approvals. Independent real account JWT/RLS tests, physical Samsung/iPhone checks, and owner evaluation remain outside this offline gallery. Inherited release checker #346 cannot be bypassed. No merge, deployment, staging/production credentials, paid services, new user accounts, or Drive Duel changes.
