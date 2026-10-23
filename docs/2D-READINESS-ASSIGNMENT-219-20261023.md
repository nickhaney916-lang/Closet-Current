# Assignment #219 — independent 2D integration readiness

## Review and coordination

PR #217 advanced from 8a7f1d6 to f76f7df10199972b6d0e7f27b808c6cf3edbe611
after the prior integration. Latest prototype QA 39964748532 and camera QA
39964743072 both succeeded. Three new adapter checks cover malformed matching
hashes, duplicate saved identity and blank identity. This isolated branch ports
those checks and their adapter safeguards while preserving PR #219's outer
account binding and dress/layer restrictions. No existing branch was moved.

Base is verified PR #219 application 883c8ed8f751edead21f9dff41074da03412f9b6,
not the old main-based prototype app. Open #216, #217 and #219 work was inspected;
3D and marketing are separate and unchanged. Existing security, human-reviewed
recognition and physical-mobile issues remain open. All new work targets a
separate `qa/2d-outfit-readiness-20261023` branch stacked on PR #219.

## Reproduced defect and narrow repair

Duplicate saved IDs were silently collapsed by the stylist (last record wins)
but resolved by the figure (first record wins). An outfit could therefore name
one identity while different source pixels appeared. Duplicate swap alternatives
were also admitted. Four independent regression tests fail on the unchanged
PR #219 baseline and pass on this candidate, covering both array orders,
foreign duplicates, swap alternatives/current sources, and unchanged valid
clothing remaining visible while the ambiguous record is held.

The stylist now excludes every record with an ambiguous ID before recommendation
or swapping; the figure holds that identity rather than choosing either source.
No stored data is deleted, renumbered, recolored or rewritten. This is identity
validation, not a claim that visually identical garments with different IDs
are the same physical object.

## Evidence

- Latest prototype adapter tests are included without weakening assertions:
  avatar/garment-transfer suite **49 passed / 0 failed / 0 skipped**.
- Full local repository regression with all original licensed fixtures:
  **1849 passed / 0 failed / 0 skipped**. Exact-head repeated CI is recorded in PR.
- Independent locked outfit acceptance remains **22/22 PASS**, and result JSON
  is byte-identical to the existing benchmark. No accuracy labels, thresholds,
  recognition model or expected benchmark results changed.
- **59 original licensed photographs** SHA-verified; no image re-encoding or
  replacement. Runtime source-original/crop/cache/ownership guards from #219
  remain. The research adapter validates matching hash *format and metadata*;
  it still cannot authenticate human review or bind caller RGBA to encoded bytes.
- Chromium/WebKit workflow runs existing recommendation/pin/swap/save/backup/
  owner-isolation tests and the extensive figure/dress/jacket/shoe/recovery suite.
  New browser checks use 1200×1800 synthetic originals with deliberately different
  display RGB, original-only replacement, two-color pattern sampling, duplicate
  identity holding, foreign/corrupt originals, source immutability and 390×844
  mobile overflow. Existing figure suite uses Android viewport and iPhone 13
  device emulation; these are browser engines, **not physical devices**.
- The unchanged Deno entrypoint is type-checked and its two existing synthetic
  runtime tests run with network permission restricted to 127.0.0.1. This is
  loopback HTTP and fake Auth/provider/ledger dependencies, not hosted access
  or paid AI. The existing Style this UI test also runs in both engines.
  It initially failed because its old SVG fixtures are correctly rejected by
  the current raster-only security gate. Fixtures now use local canvas PNGs;
  all interaction assertions and security gates remain unchanged.

## Integration and launch limits

Recommend code review and consideration for the guarded development candidate
only after final exact-head CI. All integration/release decisions remain with
the main conversation. This remains an approximate 2D styling collage. Three
challenging licensed photo hold cases remain held; successful fallback is not
successful realistic transfer. Solid RGB/two-color synthetic patterns do not
measure real fabric-texture fidelity, occlusion, physical fit or segmentation
accuracy. Human-reviewed masks/fidelity, physical Android+iPhone and existing
hosted security/privacy release evidence remain missing. Fixed figure reference
resolution and conservative extraction/20MP display decode budget remain limits.
No physical-phone test or realistic-rendering quality score is claimed.

No merge/deploy, production/Supabase/Cloudflare changes, customer photos, paid AI,
expenses or Drive Duel work. 3D/marketing do not gate this 2D implementation.
