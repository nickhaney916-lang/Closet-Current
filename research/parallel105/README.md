# Assignment 105 browser receipt gate

Run `node research/parallel105/closeout.mjs ledger.json`. The command exits 0
for a complete receipt matrix, 1 for a candidate journey failure, or 2 for
insufficient evidence. The command checks an already collected ledger. Use
trusted CI logs and artifacts to populate it. It does not authenticate reports,
measure browser stability, or authorize release.

Supply `candidate` (the exact adopted commit SHA), `source` (trusted SHA-256
pins for `jpeg`, `model`, and `jsep`), and `browsers` (individual attempt
receipts). Each receipt uses the actual `checkout` SHA, `engine`, `width`,
unique `process` ID, numeric `attempt`, `profile`, and `status`.
Use the profile `original-owner-journey` only for the genuine full original
journey with human-directed synthetic owner approval and private source
recovery. A positive receipt needs `observed` with the same process ID and
all three hashes observed in that process. Record a missing observation as
missing. Keep donor failures in the ledger at their own checkout SHA.
Failure receipts remain visible even when hashes could not be collected.

The six-cell Actions workflow reuses the inherited P94 browser runner.
A successful job by itself does not supply all fields for this guard.
A complete receipt matrix clears this gate only. Native causal repair,
integrated privacy and source boundaries, 3D, and release have separate gates.
