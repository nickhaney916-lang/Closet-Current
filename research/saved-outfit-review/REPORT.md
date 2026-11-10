# Saved outfit history review — Family Alpha HOLD

Isolated follow-on to PR #779, parent fbce0b66d7acf5b1ea0dffcb20f793abda06b793. No deployment or merge.

Saved history previously passed through the working-board cleaner on load, silently dropping missing or incompatible garment references. Known slot references now survive load, import and refresh. Each affected saved row explains its missing or changed pieces. Opening it creates a usable working copy with a separate review notice; choosing replacements and saving appends a new outfit without rewriting the original saved record. Existing wardrobe consistency, transaction and owner protections remain.

The browser regression first reproduces the silent loss on the exact parent, then checks deletion, reload, recategorization, original roster integrity and replacement saves in Chromium and WebKit at widths 320/390/430. Axe checks and screenshots cover both review states. Existing draft, save, source-photo and bounded simulated backup regressions remain in the dedicated no-deploy workflow. Four focused tests cover missing IDs, changed categories, bounded input and dress suppression, alongside the full Node suite.

Evidence uses synthetic authentication and fixture garments. Physical phones, genuine signed accounts and live cloud acceptance are not verified. Historical records contain IDs rather than photo/color snapshots, so this change cannot identify past appearance changes or recover deleted photographs. Malformed or unknown slot keys are not retained. Existing production, staging, inference and cloud code remain unchanged. Family Alpha HOLD #255 remains.
