# Closet Current — Priority #120 / MAIN-APP-REVIEWED-CAMERA-TO-PRIVATE-CLOSET-120

**RESEARCH ONLY · Family Alpha Issue #255 HOLD · DO NOT MERGE OR DEPLOY · NO production or existing staging modification.**

## Verified parent

Priority #119 [draft PR #673](https://github.com/nickhaney916-lang/Closet-Current/pull/673), exact verified SHA `90a9e39f5851809188bf1a5f9bd839ba92821789`, [dedicated CI #42313829988](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42313829988) SUCCESS: **1,090/1,090 Node PASS**, **17/17 manual-reviewed save tests**, real Chromium 320/390/430 plus WebKit 390 screenshots **4/4 PASS**. Previous priority implemented and verified an atomic owner-private original JPEG reviewed save as standalone research only; the real app's Adjust button still bypassed it.

## Implemented main-development integration on research checkout

This priority closes that specific handoff gap in the **actual Closet Current `public/index.html` and `public/app.js` UI**, but strictly on a **new isolated research branch**. A new feature switch `?reviewedSave120=research&captureProof01=after&index04=after` is **OFF by default**. It is also constrained to **newly captured unsaved clothing**, never edits of already committed garments. The default user experience and existing installed deployments are unchanged until separately approved/merged/deployed.

1. The app's existing **clothing photo import/camera capture** retains the real original JPEG source identity and signed-in account-bound IndexedDB draft (existing `captureProof01` original-photo verifier). Model inference and image understanding remain independent; the user may choose Adjust even if the model is unavailable or inaccurate.
2. The actual **Adjust** dialog now presents explicit, unchecked, required checkboxes for reviewing **category, item type and color** and for confirming **one original photographed garment** or **the specific reviewed multi-garment cutout**. Both must be deliberately checked before a research save. The form retains the original garment image preview and its existing editable fields. No model-derived field is automatically marked owner-confirmed.
3. The opt-in branch constructs a source-bound review decision from the user's chosen form category/type/color and the unchanged original captured source record. It checks signed owner, session gate, exact current owner IndexedDB namespace, active dialog and still-pending same draft item, and imports the previously verified P119 research `commitHumanReviewedPhoto119` adapter.
4. P119 **independently SHA-256 checks real original JPEG bytes** and, where supported with genuine existing cutout bytes/provenance, checks the distinct cutout JPEG too. It validates the catalog category/type pairing and owner color and uses **one IndexedDB readwrite transaction** to reread and compare the owner saved wardrobe plus draft, block duplicate source and cross-owner data, insert the human-reviewed garment without overwriting other clothes and remove just the saved candidate from the current unsaved draft. Late revoked lease or source/owner change aborts both writes.
5. After successful atomic persistence the app reloads the exact committed item rather than trusting stale recognition and updates My Closet and the optional private index. It does **not** run another post-save `persistDraft` that might overwrite a newer draft. Rejections keep the dialog, original photo and unsaved garment available for correction.

**Privacy boundary:** This is a local research IndexedDB transaction. It is **not** authenticated cloud RLS, and original user photographs are neither uploaded to a new service nor used as benchmark fixtures. The only browser fixture is the repository's existing genuine, licensed public JPEG.

## Independent tests

- New P120 static code tests inspect opt-in gates, actual app Adjust binding, required unchecked review controls, owner/session/lease checks, unique P119 atomic write path, postcommit reload, and default code not being changed outside research mode.
- The actual app browser script `scripts/test-reviewed-app-capture-closet-120-browser.mjs` serves the real `public/index.html` (not a standalone demonstration form) and executes: genuine original-licensed JPEG through the actual app's picture/file import → original SHA verified → existing original-photo review card → **actual Adjust** → owner changes incorrect model subtype and color → Save denied until both explicit confirmations → single owner-private IndexedDB atomic reviewed save → My Closet saved category/item/color → repeat original source blocked. It verifies **Chromium 320/390/430** and **WebKit 390** mobile-style viewports, checks horizontal overflow, captures source-backed screenshots and blocks outbound traffic.
- Authentication and AI worker responses are **controlled test doubles**; this does not claim actual signed-user cloud RLS or independently correct recognition. The photo import is a real browser file input; actual physical phone-camera sensor capture and true AI inference are **not** validated by this test.
- Strict P120 no-deploy CI pins the exact green P119 parent and checks only five research-branch files, complete inherited Node regressions, actual Chromium/WebKit browser acceptance and screenshot SHA/source-only evidence.

## Boundaries and next required acceptance

Changing `public/app.js` **only in this unmerged research branch** is necessary for actual UI integration testing; the active production branch and existing staging are **NOT touched or deployed**. This is the first actual-app path for research acceptance, not production publication.

The P119 adapter's `confirmed:true` and existing cutout `ownerReviewedInstance` are explicit in-app confirmation metadata, **not independently certified human review**. Original/cutout JPEG hashes establish image-byte identity, **not independent semantic instance mask quality**. The framework's simulated signed-in test context does **not prove cloud JWT/RLS**, two actual authenticated accounts, service-worker runtime or physical devices. Model category/subtype/color actual scientific performance remains Parallel #48; female/male humanoid photorealism remains Parallel #49; mobile 3D saved-look integration remains Parallel #47.

Do not authorize Family Alpha based on local browser synthetic classifier acceptance. Family Alpha Issue #255 remains HOLD.

**Research completion standard:** exact-HEAD green Node + actual app browser tests, clear real vs mocked evidence; never merge, deploy or alter production/existing staging.
