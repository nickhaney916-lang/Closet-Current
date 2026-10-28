# Family Alpha #71 — protected Device help, private preset bug note (HOLD)

**Why:** Work #53 (fine-detail garment isolation) and Work #54 (natural 2D garment fit) do not yet have new reviewable GitHub PRs. This separate main-thread priority creates a real tester-facing privacy-safe feedback feature, not more release-gate paperwork.

## Delivered

- The existing **My account → Device help** screen in the protected offline Family Alpha candidate gains **Report a testing problem**.
- Four predefined select fields: affected area, symptom, device type, severity. No arbitrary free text, family identifiers, clothing description, links, attachments, photographs, screenshots, tokens, user IDs or device fingerprints are accepted.
- One explicit, trusted user click downloads `closet-current-alpha-feedback.json` **locally**. Nothing is sent, stored, logged, uploaded or shared automatically. Testers review it and decide themselves whether to share it through a private channel. This is **not** an automatically configured messaging or support service.
- When the protected signed-in app shell/Device help view is hidden, downloading is refused. A session-change event resets selections. Pagehide/dispose clears temporary Blob URLs and listeners; reports do not survive between accounts.
- No project Auth, photo recognition, original JPEG, canonical cutout, garment fit, wardrobe, outfit, private backup or production/staging settings are touched. Source is added as an isolated compiled module, existing `index.html` gets one Device help panel and one module tag, every other compiled asset compared byte-for-byte against PR #382's green integration. Original supplier and tester data are not accessed.
- Local offline file exports are still sensitive if manually shared; testers must review and transmit through a private, owner-approved channel. Never commit completed reports to public GitHub.

## Verification

```sh
node scripts/build-family-alpha-71-private-feedback-hold.mjs
node --test tests/family-alpha-71-private-feedback.test.mjs
node scripts/test-family-alpha-71-feedback-browser.mjs
```

The browser test exercises actual compiled panel and module at 320/390/430px in Chromium and WebKit, actual trusted download, invalid synthetic click, refusal after hiding app shell, session reset, and zero external requests. Screenshots contain only generic controls.

## Release/coordination

This **does not deploy** anything or mean Family Alpha is ready. Real user JWT/RLS, photo downloads, cloud backup write/restore, physical Android/iPhone, private feedback delivery path, and owner-reviewed **15 licensed-photo visual PASS** remain unverified. Previous licensed count **0 PASS / 5 REVIEW / 10 FAIL** is unchanged. Work #53/#54 continue independently; no changes to their code. No merge, spending, Supabase/Cloudflare/Resend writes, real family photos, test invites or Drive Duel changes. **HOLD.**
