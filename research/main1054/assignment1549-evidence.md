# Assignment #1549 application evidence

| Change | Verified relationship |
| --- | --- |
| #1545 | Two grid selection paths, exact head 15ed37c35dfe0830e73d007bce64a090b0f53333 |
| #1547 | Two closet visibility paths, directly stacked on #1545; exact candidate ed340449514255c4bda84eb47f64187e5bd546c8 |
| #1215, #1217, #1221, #1452 | Separate journey, convergence, assembly and gate migration work. Compatibility with this stack requires independent verification. |

The gate checks the actual detached candidate, with only QA additions on its
own head. It tests the existing application build and Node suite. Browser
acceptance, original owner flow and native repair are outside this receipt.

Obtain raw run and first-attempt job objects from the authenticated GitHub
Actions API for this PR. Construct a JSON envelope containing:

- `gateSha` from the reviewed draft PR head.
- `candidateSha` from its reviewed base and `candidateParent` from the
  verified #1544 head.
- `run` containing raw run metadata. `jobs` contains the job array
  from the first-attempt Jobs response, including step results.
- `claims` with `familyAlpha: "HOLD"` and booleans `nativeRepair`,
  `originalOwnerFlow`, `chromium`, and `webkit` all false.

Run `node research/main1054/assignment1549-evidence.mjs receipt.json`.
The verifier cross-checks supplied metadata. It does not authenticate arbitrary
JSON, so keep authenticated retrieval and reviewed source inputs separate
from the receipt producer. Preserve run links, first failures and available
TAP artifacts. PASS is scoped to the listed Node steps and carries no
release decision.
