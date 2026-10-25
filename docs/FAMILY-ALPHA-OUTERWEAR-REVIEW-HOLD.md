# Family Alpha — Outerwear original-photo confirmation (HOLD)

**October 24, 2026 · Isolated draft child of PR #288.** No merge, deployment, production changes, Supabase/Cloudflare/Resend configuration, customer photos or paid inference.

## Observed reason
The unchanged licensed original-photo recognition benchmark contains **4 jackets and only 1 correct broad-category recognition** in the existing archived run. That is inadequate support for auto-accepting Outerwear identity. The project already uses independent recovery checks to suggest ambiguous jackets in Adjust, but the current mobile acknowledgment gate covers Shoes, Dresses and ambiguous Bottoms without covering Outerwear.

## Minimal product change

Update only the source-pinned mobile Adjust overlay within the current held Family Alpha integration builder to require the same user confirmation for `Outerwear` as for other error-prone types:

- The original garment photo is available in Adjust, and the person must inspect category, specific type and color.
- Jacket/coat subtype can **remain `Unknown`** instead of being fabricated from weak evidence.
- Save without the checked acknowledgment is rejected and the draft remains available.
- Changing clothing category, type or color resets the checkbox and requires another review.
- Changing source photo, mask/scene or account still invalidates a previously opened editor.
- On explicit user confirmation, the existing #283 queued save and original-JPEG/crop/backup protections remain intact. #281 invalid-worker/individual JPEG recovery remains unchanged.
- No model threshold, inference vectors, automatic category assignment or photo crop altered. This reduces unreviewed saves; it **does not increase measured recognition accuracy**.

The local compiled staging-HOLD app remains login-disabled and restricted to mocked browser fixtures. The adapted mobile Chromium/WebKit test now has a **fourth** scenario at each 320px/390px width: Outerwear/Unknown, valid initial color, refusal to save without acknowledgment, changing color invalidates the existing checkbox, human reconfirms then successfully saves Outerwear with subtype Unknown. Three earlier scenarios (Bottoms subtype correction, layered outfit source comparison, invalidated photo) still run. All earlier source→IndexedDB→reviewed 2D avatar, worker recovery and staged Auth HOLD tests remain mandatory.

## Actual accuracy priority, not solved here

Do not call this a model accuracy improvement or claim 100%. Before revising jacket/coat/blazer classification, collect a **separate labeled licensed or consented original-photo holdout** with jacket vs sweater/blouse confusion, sleeves/closures, on-body and flat lays, background and lighting; track `Unknown`, abstentions and manual confirmations with fixed denominators. The current four jacket examples are too few for a reliable field accuracy estimate. No customer photos were accessed by this change.

**Family Alpha release HOLD.**
