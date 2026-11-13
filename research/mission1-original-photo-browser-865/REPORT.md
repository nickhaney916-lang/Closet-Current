# Mission 1 P865 — Native browser acceptance of retained owner originals

**Family Alpha HOLD #255 OPEN. DRAFT / UNMERGED / UNDEPLOYED.** 
Immutable parent: [verified Mission 1 P864 PR #1030](https://github.com/nickhaney916-lang/Closet-Current/pull/1030) exact `bdb1b535fba9ec8b0177b9020b9dc657c2f945a8`, [NO DEPLOY #43485842897](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43485842897) 2/2 passed, 561/561 inherited native. #82 independently owns actual dual-model camera integration and must not change this branch.

## Why this milestone
P864 ported Mission3's safety fix to actual Mission1 source: a blank/featureless captured garment and an accepted exact-source duplicate can no longer be silently removed from the private review draft during model inspection. Its tests executed the scanner via Node VM, but the P864 browser suite had only **inherited** owner/source safety checks, not a new in-browser reloading original JPEG preservation test. This milestone closes that evidence gap without touching model weights or risking sibling branches.

## Exact no-deploy acceptance
A new desktop Chromium/WebKit scripted acceptance suite loads the **actual research `public/index.html` and `app.js`**, with the real IndexedDB implementation and real UI Adjust/Remove controls. Three viewport widths (320/390/430 px) × two engines = 6 cases. It generates two synthetically uniform genuine JPEG files, computes SHA-256, captures the *real app candidate()* queue, commits state to native owner-scoped IDB, invokes the real `recognizeItem()` with injected simulated quality responses, then observes that neither blank nor exact-match decision discards a captured original. Both original **JPEG bytes** (SHA-256), separate entries and ownership review statuses must survive a complete page reload. The app's actual Adjust / Remove photo UI must remove just the selected row. The same browser origin's separate synthetic signed-account IDB namespace must not reveal the original. All off-origin HTTP blocked; test never calls hosted private services.

This is **actual native desktop browser storage/UI**, but synthetic photographs, mock auth, injected quality flags and inert model worker. It is not proof from real owner's signed login, mobile camera or physical Android/iPhone. The test also does not claim generic OS crash/low-storage recovery, live auth RLS or cloud export.

## Preservation and release constraints
Only add scripted acceptance test, minimal no-deploy CI and report; keep P864 original-photo code, review-first, human acknowledgement, duplicate/pair reconciliation, source leases, taxonomy, weights, production/staging/hosted data untouched. Existing separate public-photo real-model benchmark remains **red on 10 historical boot automatic-index/type assertions across five sources**; no waivers or accuracy claims. Human-blind correctness remains unproved and Family Alpha #255 stays OPEN. Record exact-head job results only when observed.
