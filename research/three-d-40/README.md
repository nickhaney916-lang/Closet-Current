# 3D-40 — independently hanging photographed shirt torso and rear trouser silhouettes

**Base:** exact committed dedicated-green PR445 `d30f5e0340ccc0c9b7e93436176b9162b889ce8d`. New isolated no-deploy draft PR on top of research development only. Family Alpha Issue #255 HOLD, **production/staging never modified**.

Previous 3D38–39 improved photographed black AJ shirt / blue jeans contact but the front-on torso felt flat and rear jeans legs followed the original anatomy. This stage provides **real separate geometry shaping of the original cloth**, concentrated on *unphotographed side and rear*, protecting the front photo and registration. No made-up rear images, seams, pockets, texture details or per-image token costs.

`independent-hanging-silhouettes.mjs` has two features with independent rollback:
1. `drapeOriginalPhotographedShirtTorso`: original skinned photographed shirt's side/rear true vertices shaped into a downward hanging panel extending below the upper chest and tapering back into the original waist/shoulder. Original front AJ logo/texture coordinates byte-identical. Max 32mm change, actual double side + rear geometry only. Not a flat sprite layer or new graphic.
2. `hangOriginalPhotographedDenimPanels`: actual first/second authentic photo-derived skinned pants source sample back-depth sections separately for each leg, preserve source-photo front and connected crotch original topology, clone a new cloth geometry that hangs behind muscular thigh rather than adhering to buttock/leg shapes; real rear panel fall max 40mm. No source image texture change, fictional pockets or new sewing triangles.

**Real source and rig constraints:** both original source JPEG/PNG SHA exact with independently licensed Wikimedia originals, original shirt original RGB source parameters `panelPosition`/`panelNormal`, jeans original `pantsSourceUV`/`pantsRest` and all 4 original bone influences unchanged, original anatomical body and 163-bone rigs unchanged. Existing cloth waist contact 3D39 still active on actual full outfit. Neutral/dress unchanged. Source image back color always neutral, not masquerading as photographed texture. True physics and signed full collision NOT CLAIMED.

**A/B:** localhost original second jeans research preview `?hanging=before` vs `?hanging=after`, with explicit original-photo review click. Older 3D37/38/39 regressions explicitly disable new silhouette so they continue testing their own dedicated technical acceptance without accidental visual false positives.

**Dedicated QA:** exact-parent no-deploy file allowlist, original photograph SHA and cutout, true original CC0 female/male with both original pants sources and source-true photographed AJ shirt, 320/390/430 mobile genuine Chromium WebGL screenshots for source/relaxed front/3/4/side/back, neutral and photographed-jeans-only controls (jeans-only now WILL change silhouette while preserving original pixels), meaningful front/side/rear pixel comparisons, human visual review separate from CI. Family Alpha stays HOLD; no account, production, staging, Drive Duel, private photo or paid inference work.

**Acceptance requirement:** visibly distinct side/back silhouette on both figures while front source logo/photo remain accurate. Do NOT equate a technical CI green with realistic full cloth fit/owner approval.
