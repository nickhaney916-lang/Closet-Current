# Garment editor accessibility — native dialog names, keyboard return, and review inputs

**October 21, 2026 — isolated draft development change only.**

## Customer defect

Two customer-critical native HTML `<dialog>` edit flows were created dynamically by `public/app.js`, but neither provided a dialog accessible name. Screen-reader users could encounter a generic "dialog" without knowing whether they were reviewing a newly photographed garment or editing an already saved item. The native outfit-builder picker contained a clear visible heading but did not explicitly reference it with `aria-labelledby`. The bulk review category dropdown inside Photo Results also lacked a visible label or accessible name.

## Verified minimal change

- Add the static descriptive accessible name **"Review clothing photo details"** to the new-photo correction dialog, and **"Adjust saved clothing details"** to the closet-item edit dialog. These deliberately avoid exposing customer clothing titles or account identifiers in dialog labels.
- Associate the native outfit picker with its pre-existing visible `boardPickerTitle` heading via `aria-labelledby`; name the incomplete-photo `batchCategory` selector using a specific aria-label.
- Retain native `showModal()` focus behavior, Escape closing, existing `onclose` cleanup, focus returning to the invoking saved-garment edit button, no custom modal focus trap or click handlers.
- **Exactly two additions in `public/app.js` and two attribute-only substitutions in `public/index.html`**. Full source guard proves all other app source and logic byte-identical to verified PR #135. No changes to cloud, wardrobe, photo quality, original-before-mask recognition, human-reviewed accuracy evidence, login, API keys, styling rules, saved original photos, pricing, or production.

## Technical QA boundaries

Node regression checks four actual source landmarks, native modal show/close wiring, and static markup. Android Chromium and iPhone WebKit emulation extracts the genuine customer modal creation and uses actual browser DOM to verify accessible role/name, active modal keyboard focus, Escape dismissals and return focus, static outfit dialog heading, and named photo-review dropdown.

Testing only establishes browser accessibility semantics and keyboard behavior on emulators; **physical-phone VoiceOver/TalkBack usability is not proven**, human real-photo labeling remains absent, and no automatic real-world recognition accuracy gains are claimed. Never merge/deploy or pay for AI services without approval. Distinct from Work #126 recognition, #128 integration, #130 login, #132 styling, #134 backup and #136 performance.

The next release milestone remains genuine signed-in Android/iPhone QA and controlled multi-branch integration, under the other assignments.
