# Closet Current Mission 1 P833 — bounded worker recovery for recognition-only photo trial

**FAMILY ALPHA HOLD #255 — draft/unmerged/undeployed. No real account, customer original photographs or model-weight modifications. Mission 1 is NOT complete.**

## Verified independent baseline
P832 [PR #883](https://github.com/nickhaney916-lang/Closet-Current/pull/883), exact green head `89e9176ae3fd92bf17438fa8a3df6b9a51ee7d08`, [3/3 no-deploy Actions #43138595523](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43138595523): native application build, 270/270 Node, genuine publisher-original FashionCLIP in Chromium/WebKit, SHA-verified 13-file isolated preview bundle, no photo upload, abort/late original JPEG decode guarantees. This is a known research-only parent, not a production baseline.

## Actual source issue
`photoTestSession()` closes and terminates its worker when a single classification exceeds 60 seconds or crashes. The existing trial UI kept using the same closed `session` for the remaining original photos. A 10-photo recognition batch with one timeout could therefore report many subsequent `cancelled` failures **without ever attempting classification**. This has no demonstrated live family incidence, but the code path and unit tests establish the failure mode.

## Repair
- Add a deterministic, **one-recovery-only**, no-account wrapper `phone-photo-run-recovery-833.mjs`. A failed source JPEG stays an **error**, is never re-inferred and never becomes a synthetic correct guess. Only a subsequent photo may trigger one new `photoTestSession` + full model load. If the replacement crashes or cannot load, all later photos fail quickly with honest `runtime` errors and **no unbounded restart loop**.
- Nonfatal image/classification errors do not reload a working model. `Start over`/pagehide calls `close`, which stops any old or newly loading model, rejects stale replies, never leaks raw worker errors, and obeys P832's existing abort signal and generation identity.
- Original recognition model, 60s classify timeout, 5m initial model load timeout, scoring, color and subtype evidence, original JPEG processing, photo-file network privacy and cloud remain unchanged.
- Add seven adversarial Node tests for stable successful classification, worker timeout followed by exactly-one later-photo recovery, second crash terminal, nonfatal error, failed reload terminal, close during asynchronously loading replacement, invalid configurations/privacy. These are simulated failure tests and do **not** claim an actual Chrome/WebKit FashionCLIP crash was observed.
- Extend genuine pinned original-worker browser test: Chromium and WebKit must still recognize the original SHA-reviewed positive + nonclothing negative and check 320/390/430 CSS widths, sanitized JSON, zero original photo uploads, no late JPEG on cancel. Additionally, within the actual browser, the shipped wrapper is exercised with a **synthetically crashed** first worker and a second successful fake worker; test verifies exactly one model load/classification for each distinct photo and **no retry of the failed source**.
- The SHA-verified non-hosted recognition-only artifact grows to **14 explicit runtime files** (P832's 13 + this wrapper) plus its README/manifest. No hosted site, login, wardrobe, cloud or photo files.

## Gating
Dedicated no-deploy Actions must verify **exact P832 green parent**, exactly eight strictly allowlisted paths, 2 standalone bundle tests, 7 new adversarial worker-recovery tests, the complete 270-case native tests plus 7 = **277 full Node cases expected**, and actual Chromium/WebKit worker/browser tests. The final branch must remain draft and unmerged; do not invite a user or claim a protected HTTPS preview exists based on a ZIP alone.

Still needed: prospective, independently labeled new photo cohort, real physical Android/iPhone testing, authenticated private wardrobe/cloud E2E, and separate explicit approval for a protected HTTPS diagnostic preview. The 23 publisher polygon whole-outfit benchmark remains a materially weak recognition block; no model accuracy increase is claimed.

**FAMILY ALPHA HOLD #255 remains OPEN.**
