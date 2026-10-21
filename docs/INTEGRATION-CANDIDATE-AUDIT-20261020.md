# Frozen development integration candidate — October 20, 2026 Pacific

This is an integration audit and a reproducible **development-only** candidate,
not production approval. No PR was merged, source branch changed, hosted setting
edited, customer record accessed, paid inference enabled, or deployment run.

## Frozen inputs and independently checked evidence

- Candidate application source: PR #106, `55bd2fac37d45409473485b84e555ebab07d9630`.
- Source tree: `c6e51bd5cf4e9be1c3e58eb2fe029e7c29c8a026`.
- Observed main: `54c9e29ede069a05d1268e003f80cbda043c7d6a`.
- Snapshot: `docs/integration-audit/sources-20261021.json` records 100 open PR
  heads, bases, URLs and exact-head Actions metadata for 27 key PRs. Other CI
  entries are explicitly null, not presumed green. This is a dated snapshot;
  moving remote refs require a fresh audit before any future release.
- API GET `/actions/runs?head_sha=<full SHA>` verified the recorded run identity,
  conclusion and workflow path; PR descriptions alone were not accepted as CI.
  All recorded runs were completed/successful when inspected.
- PR #106 run [39532287957](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39532287957)
  completed at exactly the source SHA. Both original-photo inference and source
  regression jobs succeeded. The 59-photo measurement is **historical source
  evidence**, not an inference rerun by this audit. Four incorrect accepted
  subtypes remain; recognition promotion remains BLOCKED.
- Main has one commit absent from candidate ancestry, while candidate has 1,458
  commits absent from main ancestry. `git cherry <candidate> <main>` identifies
  the main commit as patch-equivalent. Both trend-data blobs are
  `0fd0911a32ff7c80fc027657465c96f34dfe532d`. A real non-mutating `merge-tree`
  yields the **identical candidate tree**, so main has no missing content.

## What is already integrated and what must stay separate

84 of 100 observed open PR heads are ancestors of #106. Re-merging these is
unnecessary. Sixteen heads are outside that history; fifteen produce conflicts
when Git attempts to combine them with the frozen source. A conflict is not
proof that the feature is missing, nor is shared ancestry proof of correct
behavior. Exact matching/divergent paths are exported in the audit artifact.

- Camera/import #88/#89, cloud #90, combined #92, startup #91 and combined
  startup/frozen-frame #94 are already ancestors of #106. Use the combined
  lineage; do not independently replace `public/app.js` from an older branch.
- Authentication/cloud security #95–#103 are already included. The security SQL
  remains a **draft design**; inclusion in Git does not apply hosted grants or
  authenticate real customers. Local disposable Auth/Storage and Mailpit runs
  are historical integration evidence, not live permission/SMTP approval.
- Recognition/style integration #80, native human-review integration #83,
  style #69/#74, color provenance #104 and duplicate save #105 are included.
  Thresholds, models, vectors, locked photo manifests and recognition source are
  byte-identical to #106 in this audit branch.
- #64/#65 share an older base and overlap `closet-stylist.js`, `outfit-board.js`,
  `reusable-figure-preview.js`, HTML/CSS and style browser tests. Their combined
  successor #69 is already included. Do not merge the original heads again.
- #34/#38 have older figure/runtime/test overlaps covered by later integration
  #35/#40. #37/#48 retain late research/workflow/checkpoint differences; #48 has
  14 of its 16 changed paths already matching the candidate. Review their
  residuals individually if still needed rather than overwriting current files.
- #14 has late AI-recovery differences, including `ai-tryon.js`; later pipeline
  integrations are present. Keep residual changes held for a focused semantic
  comparison. No claim that every late fix was superseded has been established.
- #4 is a divergent old timeout branch with 64 changed paths and ten conflict
  paths, including recognition code. Quarantine it from the release candidate.
- #52–#58 are an independent procedural Blender figure-research chain. Their
  creation/provenance scripts and evidence are absent from #106; no production
  figure replacement is integrated. #58 includes all the older research heads.
  If desired later, review that one frozen tip as an isolated research-only
  integration, reconcile checkpoint history and inspect rights/assets first.
  Git's checkpoint-only conflict does not constitute visual or licensing QA.
- #107 is a newer descendant of #106 and merges mechanically without conflicts.
  Its exact-head run [39534184672](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39534184672)
  is green, but both tested recognition policies were rejected. Keep it separate
  under the main recognition owner's control. Green CI is not model promotion.

## Safest integration order

1. Preserve main, #106 and this audit by exact SHA, with a full-history checkout.
   Use #106 as the already integrated source; do not serially merge 84 old PRs.
2. Run the new scope/graph audit, then historical #106 source/reviewer guards
   in a detached temporary worktree. The original guards remain unchanged and
   intentionally reject additional files outside their old scope. Historical
   results are labeled as historical. The new scope guard independently checks
   the current candidate and requires **every existing source file unchanged**,
   except prepending the checkpoint and one byte-exact browser-test scheduling
   adjustment; only five named audit additions are allowed. Application and
   benchmark bytes remain unchanged.
3. Run the complete current Node suite/build and the camera, import, duplicate,
   Auth callback, cloud-owner, saved-closet and owned-outfit browser checks on
   this candidate. Keep hardware, live cloud/email and actual model accuracy
   separate from synthetic browser acceptance.
4. Leave #4/#14/#34/#37/#38/#48/#52–#58/#64/#65/#107 outside the candidate.
   Do not close or delete their branches. A future residual patch must have its
   own reviewed diff, source lock and fresh regression/browser validation.
5. Before a release decision, refresh all remote heads, capture actual deployed
   versions on **both** hosts, resolve the blockers below and review the complete
   main-to-candidate diff. A draft PR based on #106 is an audit-only review, not
   authorization to merge the stacked application into main.

## Reproduce and roll back the development candidate

The candidate commit is the draft audit PR's full head SHA. Its application
bytes are locked to #106; candidate changes consist only of this audit tooling,
source snapshot, workflow, regression tests, prepended checkpoint and one
precisely checked existing browser-test scheduling adjustment.

```sh
git clone https://github.com/nickhaney916-lang/Closet-Current.git
cd Closet-Current
git fetch origin --prune
git switch --detach <full-audit-PR-head-SHA>
node scripts/audit-integration-candidate.mjs --historical
node scripts/build.mjs
PYTHONDONTWRITEBYTECODE=1 node --test tests/*.test.cjs tests/*.test.mjs
node scripts/check-customer-pilot-release-gates.mjs
```

The dedicated workflow installs `playwright@1.56.1` and Chromium/WebKit, runs
all eleven browser commands recorded in its YAML, then uploads **development
only** `dist`, source/merge inventory, exact candidate SHA and per-file SHA-256
checksums. The build uses Node 22. Build version metadata embeds Git identity;
compare output hashes only for the same exact commit/runtime. Browser binaries
and external model CDN availability are not bundled or guaranteed offline.

Developer rollback is a new detached checkout of the frozen #106 SHA above;
this audit makes no runtime, database or customer-data transition to reverse.
Never force-reset shared branches. The previously observed main SHA is retained
as a source fallback, but is **not verified as either host's current deployment**.
Before any later deployment, retain the actual previous immutable deployment
artifact/checksums and deployment IDs for GitHub Pages and Cloudflare, confirm
service-worker cache recovery on both phones, and rehearse static-artifact
rollback. No production rollback readiness is claimed until that evidence is
present. Do not execute security SQL or attempt schema downgrade as rollback.

## Production blockers

- Four wrong accepted garment subtypes from source-verified original-photo
  inference; physical whole-outfit accuracy not established. Main recognition
  owner must resolve admission quality without tuning on held-out evidence.
- No independently approved real garment masks; production figure rights and
  master source evidence remain unapproved. Procedural figure research is held.
- Physical Android/iPhone focus, color, low light, orientation, OS interruptions,
  memory and two-device wardrobe recovery remain unverified.
- Hosted SMTP/external inbox, redirect allowlist/canonical host transition,
  actual live Auth/RLS/Storage/CAS behavior and deletion require separate approved
  validation. Draft SQL was **not** applied by this audit.
- Two production deployment workflows exist: GitHub Pages ignores trend-only
  pushes; Cloudflare deploys every main push. Both also support manual dispatch.
  A future main merge could publish both hosts. This branch triggers only its
  audit workflow, which has contents-read permission and no deploy steps.
- Actual paid two-pass AI provider fidelity and physical rendering remain
  unverified; paid inference switches stay disabled.
- Outstanding residual/conflicting heads and production fallback artifacts need
  explicit disposition. Automated green checks do not remove the release veto.

## Verification during this audit

Initial local frozen-source run: build passed; **1,246 passed, zero failed,
three skipped**. Nine added adversarial integration-audit regressions passed. The final local
full candidate suite passed **1,255 tests, zero failed, three skipped**; the
build and original historical provenance guards also passed.
Local Chromium/WebKit installation returned invalid download archives; no local
browser success is claimed. Final candidate full-suite and cross-engine results
are reported in the draft PR after its exact-head Actions run completes.

### Integration QA findings and exact harness correction

The first candidate run passed all browser flows but its final source guard
correctly rejected the generated screenshot `artifacts/local-fitting/style-chromium.png`.
The workflow now archives known synthetic screenshot/report directories outside
the checkout before the final guard; it first asserts they contain no tracked
source files. The source guard was not weakened to ignore unexpected files.

A second run passed camera/import, Auth (8 scenarios per engine), cloud-owner,
saved-closet and Chromium styling, but WebKit's stale-selection recovery test
waited for a Retry button that became hidden. The inherited harness observed the
required empty stale preview, then performed a separate driver-level click;
background board recovery can change button visibility between those steps.
The isolated correction observes and clicks a visible Retry in **one browser
turn**, allowing an already-started automatic recovery to finish. It preserves
the empty stale-image assertion and mandatory eventual one-layer recovery.
No application behavior was changed or retry assertion removed. A SHA-256-bound
regression and candidate scope gate require every other harness byte unchanged.
Final exact-head cross-engine acceptance must pass before claiming completion;
a successful rerun does not establish a physical-phone timing guarantee.

## Complete observed PR inventory

The following table is generated from the pinned API snapshot and real Git
ancestry. “Included” describes commit ancestry only. “Held” describes a head
outside #106 and does not assert all its feature changes are absent.

| PR | Frozen head | Base PR/branch | Ancestry | Exact-head CI observed |
|---|---|---|---|---|
| [#4](https://github.com/nickhaney916-lang/Closet-Current/pull/4) | `0a6bf4d070f13c43a6f237269c725dff8a646053` | main | Held | Not individually fetched |
| [#7](https://github.com/nickhaney916-lang/Closet-Current/pull/7) | `510ee14d437bbe266e2f7aa463504998ef7a75cb` | main | Included | Not individually fetched |
| [#10](https://github.com/nickhaney916-lang/Closet-Current/pull/10) | `b28708dcaf9221e99b36a8c84ca02e5e2eecbc66` | #7 | Included | Not individually fetched |
| [#11](https://github.com/nickhaney916-lang/Closet-Current/pull/11) | `5d214c9b557bce6a12e3bd71692b98e7393c4912` | #7 | Included | Not individually fetched |
| [#12](https://github.com/nickhaney916-lang/Closet-Current/pull/12) | `5e9cb665054b022a7ccfeced79ecdcef957b8b1b` | #11 | Included | Not individually fetched |
| [#13](https://github.com/nickhaney916-lang/Closet-Current/pull/13) | `fe1f5c985740c8bc51884cc24622e88df63d6fc6` | #12 | Included | Not individually fetched |
| [#14](https://github.com/nickhaney916-lang/Closet-Current/pull/14) | `e758f2098b300887e35a3da1b0afe3f4733b09fa` | #12 | Held | Not individually fetched |
| [#15](https://github.com/nickhaney916-lang/Closet-Current/pull/15) | `819d0eadf1728c257dc8e029b4ca3bb5d74751c9` | #10 | Included | Not individually fetched |
| [#16](https://github.com/nickhaney916-lang/Closet-Current/pull/16) | `d88b8e635d5be10d07f8a68af776be228146d839` | #15 | Included | Not individually fetched |
| [#17](https://github.com/nickhaney916-lang/Closet-Current/pull/17) | `20a241b63bf074a6a2d9bd513b622512b7d589db` | #13 | Included | Not individually fetched |
| [#18](https://github.com/nickhaney916-lang/Closet-Current/pull/18) | `a1da967ac3a6f2fea3fbe44b06bf70f3273fcf67` | #16 | Included | Not individually fetched |
| [#19](https://github.com/nickhaney916-lang/Closet-Current/pull/19) | `9c02c9519efda72b7283d852da3d77bdc5f86640` | #18 | Included | Not individually fetched |
| [#20](https://github.com/nickhaney916-lang/Closet-Current/pull/20) | `1afcd9a5d96230eb786b90d2c251bf03effff391` | #17 | Included | Not individually fetched |
| [#21](https://github.com/nickhaney916-lang/Closet-Current/pull/21) | `de783286cd4b5eb7e2bbda2a7bd6361dca5e87ea` | #20 | Included | [39287434641](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39287434641) success, [39287434756](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39287434756) success |
| [#22](https://github.com/nickhaney916-lang/Closet-Current/pull/22) | `a02dab2299ade4f5f1692978d47c7dbcc6453b4c` | #21 | Included | Not individually fetched |
| [#23](https://github.com/nickhaney916-lang/Closet-Current/pull/23) | `40d2b63897dcc4730df3faf04e36b8d32fca9590` | #22 | Included | Not individually fetched |
| [#24](https://github.com/nickhaney916-lang/Closet-Current/pull/24) | `def28830f0d4f9ccc3550f4d816325669e315cc9` | #23 | Included | Not individually fetched |
| [#25](https://github.com/nickhaney916-lang/Closet-Current/pull/25) | `ead2d89e2e81b5e5c53ad07b14c198fe3d66ee46` | #24 | Included | Not individually fetched |
| [#26](https://github.com/nickhaney916-lang/Closet-Current/pull/26) | `00094ee56220c299e4b417cb1edf53298f0cc1d3` | #25 | Included | Not individually fetched |
| [#27](https://github.com/nickhaney916-lang/Closet-Current/pull/27) | `effc0c40856b0d087470308e2337f656b86cdfd3` | #26 | Included | Not individually fetched |
| [#28](https://github.com/nickhaney916-lang/Closet-Current/pull/28) | `29be79c8998ddd6c378979954304086992363d3a` | #27 | Included | Not individually fetched |
| [#29](https://github.com/nickhaney916-lang/Closet-Current/pull/29) | `339592f9e0e56a68c388cef306b528e15f22f84f` | #28 | Included | Not individually fetched |
| [#30](https://github.com/nickhaney916-lang/Closet-Current/pull/30) | `102cde1c1b131cdf1bd0a4e8927bbc6de3ae1576` | #29 | Included | Not individually fetched |
| [#31](https://github.com/nickhaney916-lang/Closet-Current/pull/31) | `6ad90b5a9549f17e3a75ff45b20e52a798162740` | #30 | Included | Not individually fetched |
| [#32](https://github.com/nickhaney916-lang/Closet-Current/pull/32) | `1b36749fc6a3a7c2b46d9a85d72cbda470e23897` | #31 | Included | Not individually fetched |
| [#33](https://github.com/nickhaney916-lang/Closet-Current/pull/33) | `ec32f7773451dcd3001ecea5c5747c71bd09e0b6` | #32 | Included | Not individually fetched |
| [#34](https://github.com/nickhaney916-lang/Closet-Current/pull/34) | `c7f0b0d9ef2d3c867ffd0a21ce569a0b6477a8fd` | #32 | Held | Not individually fetched |
| [#35](https://github.com/nickhaney916-lang/Closet-Current/pull/35) | `654ddfc636ab36fae8204b2c2ba7d04eff9dede8` | #33 | Included | [39318365162](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39318365162) success |
| [#36](https://github.com/nickhaney916-lang/Closet-Current/pull/36) | `9943f7e232cc793a06df4100b3ebaa139dfee2cd` | #35 | Included | Not individually fetched |
| [#37](https://github.com/nickhaney916-lang/Closet-Current/pull/37) | `7f0378d6656bf6a4086385f1f889390691153b61` | #33 | Held | Not individually fetched |
| [#38](https://github.com/nickhaney916-lang/Closet-Current/pull/38) | `cb60e2aa55a20c6920496bf25f2967f5dc4efe7a` | #36 | Held | Not individually fetched |
| [#39](https://github.com/nickhaney916-lang/Closet-Current/pull/39) | `8d009ec056f8b7178185efb422beb94cd085a07c` | #36 | Included | Not individually fetched |
| [#40](https://github.com/nickhaney916-lang/Closet-Current/pull/40) | `80c40d466fd0e56b297e6dcca2343595c4191865` | #39 | Included | Not individually fetched |
| [#41](https://github.com/nickhaney916-lang/Closet-Current/pull/41) | `28a666d37b2c93599d34b32d0f7796d11fdab278` | #39 | Included | Not individually fetched |
| [#42](https://github.com/nickhaney916-lang/Closet-Current/pull/42) | `07f96197c1d5dd27dff5f89f904b732e26838d68` | #40 | Included | Not individually fetched |
| [#43](https://github.com/nickhaney916-lang/Closet-Current/pull/43) | `81e36f9a3cc0914a653057e6082d3176ebee5f6e` | #42 | Included | Not individually fetched |
| [#44](https://github.com/nickhaney916-lang/Closet-Current/pull/44) | `6dee7851288cac57b1394a8082c1daba769b7b16` | #43 | Included | Not individually fetched |
| [#45](https://github.com/nickhaney916-lang/Closet-Current/pull/45) | `1a96a63cc5c099353b2678cd6f895abf01c01b4e` | #41 | Included | Not individually fetched |
| [#46](https://github.com/nickhaney916-lang/Closet-Current/pull/46) | `4b0e6ac35aeec92c43d51437e0981f6ba9446e0c` | #44 | Included | Not individually fetched |
| [#47](https://github.com/nickhaney916-lang/Closet-Current/pull/47) | `29e5406119733eacbdb0f4892329fe0824a7cdaf` | #46 | Included | Not individually fetched |
| [#48](https://github.com/nickhaney916-lang/Closet-Current/pull/48) | `874fcfef2a4570d94e4a957ba238fbd893ecf93d` | #44 | Held | Not individually fetched |
| [#49](https://github.com/nickhaney916-lang/Closet-Current/pull/49) | `15c7d16a27ab338d193e6f001e8f38cb77e919d5` | #47 | Included | [39329253661](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39329253661) success, [39329253510](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39329253510) success |
| [#50](https://github.com/nickhaney916-lang/Closet-Current/pull/50) | `faaaaed814e434e274d928838e692f003fcc8d15` | #49 | Included | Not individually fetched |
| [#51](https://github.com/nickhaney916-lang/Closet-Current/pull/51) | `9d1dd7d4898dff7697f43eeecafdcfa1c10fe588` | #50 | Included | Not individually fetched |
| [#52](https://github.com/nickhaney916-lang/Closet-Current/pull/52) | `4cc75cfe827cafab7bd1c72048ee52b2493c6238` | #49 | Held | Not individually fetched |
| [#53](https://github.com/nickhaney916-lang/Closet-Current/pull/53) | `d155cd40655f19ee45c363487c56d00e26359f3f` | #52 | Held | Not individually fetched |
| [#54](https://github.com/nickhaney916-lang/Closet-Current/pull/54) | `0eb820a34cc65b37ff6c2b042a7cb96413738739` | #53 | Held | Not individually fetched |
| [#55](https://github.com/nickhaney916-lang/Closet-Current/pull/55) | `18fbea842303b438754d1eac11c5a6064926bfa7` | #54 | Held | Not individually fetched |
| [#56](https://github.com/nickhaney916-lang/Closet-Current/pull/56) | `00b9b76ff85cbf549e8f5c85fb892eeec477f1c6` | #55 | Held | Not individually fetched |
| [#57](https://github.com/nickhaney916-lang/Closet-Current/pull/57) | `e8d01f9ceb54fa98941321dd3c79217b66549739` | #56 | Held | Not individually fetched |
| [#58](https://github.com/nickhaney916-lang/Closet-Current/pull/58) | `ccf9610c7a0f575b79e8d0133b61cdba86425ae0` | #57 | Held | Not individually fetched |
| [#59](https://github.com/nickhaney916-lang/Closet-Current/pull/59) | `ff996906727ad7c577e304033e15d914a6d3cc61` | #45 | Included | Not individually fetched |
| [#60](https://github.com/nickhaney916-lang/Closet-Current/pull/60) | `4c3d9cfa666e690763a6664ad9233ec13e02db93` | #59 | Included | Not individually fetched |
| [#61](https://github.com/nickhaney916-lang/Closet-Current/pull/61) | `a2177793edd947598c1deb4d0bbf4c65d26905cf` | #60 | Included | Not individually fetched |
| [#62](https://github.com/nickhaney916-lang/Closet-Current/pull/62) | `971b7ce23fab83f6fd48838b3032de1951b86ec9` | #61 | Included | Not individually fetched |
| [#63](https://github.com/nickhaney916-lang/Closet-Current/pull/63) | `b3d5085dcef4eadc061bff24a84ea12757a66fc4` | #62 | Included | Not individually fetched |
| [#64](https://github.com/nickhaney916-lang/Closet-Current/pull/64) | `da7138acec65fffe45e3c53beef9eadee99607cb` | #51 | Held | Not individually fetched |
| [#65](https://github.com/nickhaney916-lang/Closet-Current/pull/65) | `6bf0364c1fd9d838e432a3a7e02eb60bc17602fd` | #51 | Held | Not individually fetched |
| [#66](https://github.com/nickhaney916-lang/Closet-Current/pull/66) | `c7cec342dd84224fc9f5745939b1f95829bf3cc2` | #63 | Included | Not individually fetched |
| [#67](https://github.com/nickhaney916-lang/Closet-Current/pull/67) | `6ce984b747cabf606509113608c850463e847ad3` | #66 | Included | Not individually fetched |
| [#68](https://github.com/nickhaney916-lang/Closet-Current/pull/68) | `ff07971bfc88868f0446c9282d228b3204c90e38` | #67 | Included | Not individually fetched |
| [#69](https://github.com/nickhaney916-lang/Closet-Current/pull/69) | `d6d2f7130e05e4643eb1c9e050d9f1ad744335a7` | #51 | Included | [39450574991](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39450574991) success |
| [#70](https://github.com/nickhaney916-lang/Closet-Current/pull/70) | `95426572be608152acf32b61811b2eaa77f01a53` | #68 | Included | Not individually fetched |
| [#71](https://github.com/nickhaney916-lang/Closet-Current/pull/71) | `f158b5f117937b66a30262f59c6cb22b84082408` | #70 | Included | Not individually fetched |
| [#72](https://github.com/nickhaney916-lang/Closet-Current/pull/72) | `75b4b9d5eb8d34367aef07cf6a35fc8f71191e83` | #71 | Included | Not individually fetched |
| [#73](https://github.com/nickhaney916-lang/Closet-Current/pull/73) | `d24432457c46a4720300c010dbaef31c00d846e9` | #72 | Included | Not individually fetched |
| [#74](https://github.com/nickhaney916-lang/Closet-Current/pull/74) | `c01a66845729b02afbbc6b56151984565284816f` | #69 | Included | [39456324538](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39456324538) success |
| [#75](https://github.com/nickhaney916-lang/Closet-Current/pull/75) | `bb81ce4d1223b954e742af756cbf19c205b542e9` | #73 | Included | Not individually fetched |
| [#76](https://github.com/nickhaney916-lang/Closet-Current/pull/76) | `4acc449a5292f8254fdc1d4edf90520ca053c079` | #75 | Included | Not individually fetched |
| [#77](https://github.com/nickhaney916-lang/Closet-Current/pull/77) | `582b9e65ad0e80246e868d7cf484c908c391a08b` | #74 | Included | Not individually fetched |
| [#78](https://github.com/nickhaney916-lang/Closet-Current/pull/78) | `386c1dbf967753184b4b70fd48b4ecea8636b612` | #77 | Included | Not individually fetched |
| [#79](https://github.com/nickhaney916-lang/Closet-Current/pull/79) | `305cca508040bfbe865eec66061dd1ba55614a9b` | #78 | Included | Not individually fetched |
| [#80](https://github.com/nickhaney916-lang/Closet-Current/pull/80) | `c65e91810f260413cce8ed9adfd03359b68a48c6` | #79 | Included | [39466219846](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39466219846) success |
| [#81](https://github.com/nickhaney916-lang/Closet-Current/pull/81) | `0ac469cbf091dd6ec7a0d68e262b3b1534c24685` | #80 | Included | Not individually fetched |
| [#82](https://github.com/nickhaney916-lang/Closet-Current/pull/82) | `36d55cccb782d012885d7fd970804826b9262208` | #81 | Included | Not individually fetched |
| [#83](https://github.com/nickhaney916-lang/Closet-Current/pull/83) | `4c0542bd50f9de216f6806157f7b29efc9fcbb76` | #82 | Included | [39472336347](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39472336347) success |
| [#84](https://github.com/nickhaney916-lang/Closet-Current/pull/84) | `a10adface2a2e8be62b834b2cd13ec3d85806162` | #83 | Included | Not individually fetched |
| [#85](https://github.com/nickhaney916-lang/Closet-Current/pull/85) | `d20ed6157b368f082f9e2ed72f69e73dcdc4c7e4` | #84 | Included | Not individually fetched |
| [#86](https://github.com/nickhaney916-lang/Closet-Current/pull/86) | `b931c10e766274c440862691090229c808978c38` | #85 | Included | Not individually fetched |
| [#87](https://github.com/nickhaney916-lang/Closet-Current/pull/87) | `6451d8a61e1ca6897f762ca55800796450622406` | #86 | Included | Not individually fetched |
| [#88](https://github.com/nickhaney916-lang/Closet-Current/pull/88) | `ccf308b3807bc5f2b321699a306d7157daf4a845` | #87 | Included | [39499384479](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39499384479) success |
| [#89](https://github.com/nickhaney916-lang/Closet-Current/pull/89) | `7fe867fdd392759e0b5106d529e60a37c6438ef7` | #88 | Included | [39500996563](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39500996563) success, [39500986621](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39500986621) success |
| [#90](https://github.com/nickhaney916-lang/Closet-Current/pull/90) | `e61a7c9f6ee0fe1f7d11d18c83483aa5c675c872` | #88 | Included | [39502225312](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39502225312) success, [39502225286](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39502225286) success |
| [#91](https://github.com/nickhaney916-lang/Closet-Current/pull/91) | `2d364a8537dc0e5be8ac7495d64bb78abad9b208` | #89 | Included | [39503986925](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39503986925) success, [39503980942](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39503980942) success |
| [#92](https://github.com/nickhaney916-lang/Closet-Current/pull/92) | `52e448b4b23eea1628e3cfb1e449c208d96a10cf` | #88 | Included | [39504086717](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39504086717) success, [39503978498](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39503978498) success |
| [#93](https://github.com/nickhaney916-lang/Closet-Current/pull/93) | `cd99b47dce2ccd3fc2efa5c25c51d8b4f8837458` | #92 | Included | [39506881915](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39506881915) success, [39506881949](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39506881949) success |
| [#94](https://github.com/nickhaney916-lang/Closet-Current/pull/94) | `31475b165dce56432a289484c481a62a787ae20b` | #93 | Included | [39513310135](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39513310135) success, [39513310099](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39513310099) success |
| [#95](https://github.com/nickhaney916-lang/Closet-Current/pull/95) | `37625f7fa7ff134cd9626d336d522650b696c992` | #94 | Included | [39515706562](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39515706562) success, [39515706575](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39515706575) success |
| [#96](https://github.com/nickhaney916-lang/Closet-Current/pull/96) | `de817c28ac495cf32643e80ed223edca2ee00e73` | #95 | Included | [39518565219](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39518565219) success, [39518565193](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39518565193) success |
| [#97](https://github.com/nickhaney916-lang/Closet-Current/pull/97) | `ce48891500b6c2afa1e35cdda427ec5ef4413af5` | #96 | Included | [39521961146](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39521961146) success, [39521961219](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39521961219) success |
| [#98](https://github.com/nickhaney916-lang/Closet-Current/pull/98) | `53e0d12e32f44e6b54f594a1d53547cefb441e78` | #97 | Included | [39523493819](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39523493819) success |
| [#99](https://github.com/nickhaney916-lang/Closet-Current/pull/99) | `4b87db357fcf29d08979983c4a2b8415e77c1fbc` | #98 | Included | [39524120275](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39524120275) success |
| [#100](https://github.com/nickhaney916-lang/Closet-Current/pull/100) | `fefdd165cb1ec66bb935a516598829e435a8f128` | #99 | Included | [39525067736](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39525067736) success |
| [#101](https://github.com/nickhaney916-lang/Closet-Current/pull/101) | `7a30d1e8c57c4f596acd4619e57005446537703b` | #100 | Included | [39526379314](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39526379314) success, [39526379376](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39526379376) success |
| [#102](https://github.com/nickhaney916-lang/Closet-Current/pull/102) | `7537b1eb4e73adfcf764cf03dc63851706cd89b7` | #101 | Included | [39527508029](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39527508029) success |
| [#103](https://github.com/nickhaney916-lang/Closet-Current/pull/103) | `a441f791283596bdc7bc08fe3446c41fd64f1bce` | #102 | Included | [39528715002](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39528715002) success |
| [#104](https://github.com/nickhaney916-lang/Closet-Current/pull/104) | `844ccd64c90d5b31664b422b07bf301b5071bf60` | #103 | Included | [39529726203](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39529726203) success |
| [#105](https://github.com/nickhaney916-lang/Closet-Current/pull/105) | `cebbdab60eb85af914d8ce39ac6f62fdb00e8f0a` | #104 | Included | [39530829469](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39530829469) success |
| [#106](https://github.com/nickhaney916-lang/Closet-Current/pull/106) | `55bd2fac37d45409473485b84e555ebab07d9630` | #105 | Included | [39532287957](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39532287957) success |
| [#107](https://github.com/nickhaney916-lang/Closet-Current/pull/107) | `9b2cfa722cee058ab5de22d569ded02ffec23134` | #106 | Held | [39534184672](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39534184672) success |

## Unresolved dry-merge conflict paths

| PR | Conflicting paths |
|---|---|
| #4 | `.github/workflows/mobile-flow.yml`, `public/benchmark-runner.mjs`, `public/closet-stylist.js`, `public/index.html`, `public/outfit-worker.mjs`, `public/recognition-engine.mjs`, `public/style.css`, `scripts/run-browser-photo-benchmark.mjs`, `scripts/run-mobile-flow.mjs`, `tests/outfit-worker.test.mjs` |
| #14 | `.github/workflows/research-two-garment-qa.yml`, `docs/PROGRESS-CHECKPOINT.md`, `public/ai-tryon.js`, `scripts/test-multigarment-device-emulation.mjs`, `tests/ai-tryon-recovery.test.cjs` |
| #34 | `.github/workflows/reusable-figure-local-preview-qa.yml`, `public/garment-fit-geometry.js`, `public/index.html`, `public/reusable-figure-preview.js`, `scripts/test-reusable-figure-phone-browsers.mjs`, `tests/garment-fit-geometry.test.cjs` |
| #37 | `docs/PROGRESS-CHECKPOINT.md` |
| #38 | `.github/workflows/reusable-figure-local-preview-qa.yml`, `public/reusable-figure-preview.js`, `scripts/test-reusable-figure-phone-browsers.mjs`, `tests/figure-preview-cache.test.cjs`, `tests/reusable-figure-preview.test.cjs` |
| #48 | `.github/workflows/production-figure-readiness.yml`, `docs/PROGRESS-CHECKPOINT.md` |
| #52 | `docs/PROGRESS-CHECKPOINT.md` |
| #53 | `docs/PROGRESS-CHECKPOINT.md` |
| #54 | `docs/PROGRESS-CHECKPOINT.md` |
| #55 | `docs/PROGRESS-CHECKPOINT.md` |
| #56 | `docs/PROGRESS-CHECKPOINT.md` |
| #57 | `docs/PROGRESS-CHECKPOINT.md` |
| #58 | `docs/PROGRESS-CHECKPOINT.md` |
| #64 | `docs/PROGRESS-CHECKPOINT.md`, `public/closet-stylist.js`, `public/index.html`, `public/reusable-figure-preview.js`, `public/style.css`, `scripts/test-style-my-new-item-mobile.mjs`, `tests/local-preview-recovery.test.cjs` |
| #65 | `.github/workflows/style-new-clothes-experience.yml`, `docs/PROGRESS-CHECKPOINT.md`, `public/closet-stylist.js`, `public/outfit-board.js`, `public/reusable-figure-preview.js`, `public/style.css`, `scripts/test-style-my-new-item-mobile.mjs`, `tests/outfit-save-recovery.test.cjs`, `tests/style-preview-recovery.test.cjs` |
