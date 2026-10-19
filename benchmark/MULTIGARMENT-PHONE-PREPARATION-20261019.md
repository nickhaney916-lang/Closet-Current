# Multi-garment phone validation packet

This packet prepares tests; no physical device result or live AI quality result exists.
Use with `TWO-GARMENT-PHYSICAL-PHONE-RELEASE-GATE-20261018.md` and a separate copy
of `MULTIGARMENT-PHONE-EVIDENCE-TEMPLATE.json` per real phone. Never replace
null with true based on browser emulation. A tester must record a failure as false.

## Environment prerequisites

- Owner-approved protected staging URL and dedicated authorized test accounts.
  No site has been deployed by this change. Never use the production site to test
  this branch. Record the exact full branch SHA and verify the loaded build.
- One physical Android phone with Chrome and one physical iPhone with Safari;
  record actual model/OS/browser builds, date/offset, viewport and network.
- Before live inference approval, retain `CHAINED_PAID_INFERENCE_APPROVED=false`,
  keep provider billing disabled, and verify Generate cannot start any paid job.
- Use ordinary garment-only photos; no face/selfie is needed. Retain evidence
  privately and publish only safe summaries/digests. Never copy auth headers,
  signing tokens, account IDs or source data URIs into shared reports.

## Safe physical checks with billing disabled

1. Deny then grant camera permission. Capture a flat-lay top and bottoms and
   confirm orientation, photo clarity, original dimensions and no horizontal
   overflow. Check original-file SHA-256 before/after processing and reload.
   Verify recognition uses original RGB data, not generated try-on pixels.
2. Style the new owned top, swap owned bottoms, save deliberately and reopen.
   Confirm the pinned top, owned-only options and unchanged original photos.
3. Choose top/bottom/shoes; verify generation is disabled and zero provider
   jobs start. Shoes/outer layers are unsupported by this AI pipeline.
4. Rotate, background/foreground, lock/unlock, interrupt/reconnect network,
   expire login and switch accounts. Record delays, crashes, layout changes,
   access failures, unexpected retention and cross-account visibility.
5. Check TalkBack/VoiceOver focus, 200% text size, touch controls and memory
   behavior on the real hardware. Attach private screen-recording references.

These steps cannot physically validate a live two-stage result while billing is
disabled. Do not mark the late-provider-result checks passed from them; leave
those null until the separately authorized live phase. CI uses synthetic images
for those scenarios and does not satisfy hardware evidence requirements.

## Live AI checks — blocked until separate financial approval and controls

Required first: durable per-account quotas and atomic idempotency reservations
for starts AND continuations; provider-wide spend cap; licensed hosted model
assets; approved third-party disclosures, consent and retention; staging review.
The undeployed HTTP/ledger integration now reserves both passes before the
first job, binds the second crop digest, and rejects continuation replays under
new request IDs. These controls have local tests; the hosted ledger is still
unprovisioned. A signed predecessor alone is not a substitute for that ledger.
Both submission and chaining approval constants remain false.

After approval and controls, test at least three contrasting real owned pairs
for both standard figures in two poses. Record original and stage-output
SHA-256 digests. A reviewer must compare originals, first pass and second pass:
category, color, print/logo, collar, sleeves, seams and fabric identity of BOTH
pieces. Every identifiable feature must remain recognizable; any changed,
erased or substituted garment fails the pair. Review sizing/drape separately
as illustrative rather than measurement-accurate. Report per-pair outcomes,
not an unsupported overall accuracy percentage.

For each stage, change garment/figure/account during the pending result;
background and reconnect the phone; inspect zero silent retries and no obsolete
image display. Exercise provider failure, undecodable output and timeout.
A timed-out HTTP request can still leave a billable provider job running:
a retry with the same retained browser request IDs can recover a recorded job.
If those references were lost or inputs changed, check the provider ledger
before creating a new generation. Client network abortion is not provider
cancellation. Browser request-ID recovery has not been tested on real phones.

## Evidence and completion

The JSON template is a recording aid, not a device-attestation mechanism or an
automatic pass. Require two independent physical-device reports with private
captures plus live garment fidelity review. Report separately:

| Track | Evidence required |
| --- | --- |
| Software regression | full Node suite and Deno check |
| Browser emulation | Chromium Pixel and WebKit iPhone mock tests |
| Actual provider fidelity | approved capped inference and independent pair review |
| Actual hardware | physical Android and iPhone records with captures |

If a progress number is required, report completed tracks / 4 with equal
weighting and name the incomplete tracks. This is an acceptance-checklist
percentage, not a prediction of product completion or photo accuracy.

## Provider contract reference

Reviewed October 19, 2026: the official [v1.6 reference](https://docs.fashn.ai/api-reference/tryon-v1-6)
documents one garment per request, a base64 model-image input and prefixed data-URI
output with `return_base64`. The [status quickstart](https://docs.fashn.ai/guides/tryon-python-quickstart-guide)
uses a stable prediction ID through processing replies. These describe the
request contract; they do not establish preservation of a first garment after
a second inference. The [retention reference](https://docs.fashn.ai/api-overview/data-retention-privacy)
must be reviewed for the final consent text before enabling the service.
