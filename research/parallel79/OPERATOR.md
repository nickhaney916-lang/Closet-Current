# Offline independent photograph review — operator quick-start

FAMILY ALPHA HOLD #255 OPEN. Research only. No deployment or wardrobe access.

## Custodian preparation and rights checklist

Use a dedicated offline computer/browser profile with extensions and sync disabled. Install Node 22 before disconnecting. The workstation runtime uses only Node built-ins; sharp/Playwright/axe are synthetic test dependencies, not production runtime dependencies. Use a current Chromium or WebKit-based browser, then disconnect the computer from external networks. Only loopback requests are necessary. Do not expose, proxy or share the capability URL.

Create a restricted, encrypted working folder **outside every Git checkout**. Put authorized exact originals, #75 source receipts, legal evidence, registry, session requests and exported drafts there. Use file permissions 0600, an owner-controlled encryption system, and a browser configured to ask where every download is saved. Do not accept a default download path inside a checkout or a cloud-synced folder. Clear downloads/history and stop the server after each reviewer. Do not use this system for private family/customer photos without separate owner authorization; the current #75 validator supports vetted Commons sources only.

Before any photo is shown, the independent curator must verify:

- Actual original JPEG/PNG/WebP, authoritative SHA-1/SHA-256, length, MIME, dimensions and EXIF orientation. No thumbnails, automatic crops or replacements.
- Exact compatible license/version, creator credit, actual permitted use, publication/source group, and product-only or documented subject release. `legalEvidenceSha256` binds the real restricted legal review note.
- #75 signed curator approval and independently pinned registrar fingerprint, independently verified rater public-key identity attestation, no development exposure for sealed sessions, and duplicate/source-series review.
- Sealed access uses the complete historical SHA/perceptual ledger and owner-approved external registrar authorization. Empty or partial old-image ledgers block blind sessions. The workstation is not a substitute for #75 audit/sealing.

Do not use the synthetic fixture generator to make real sources, permissions, reviewers, or human labels. Its crypto/rights fields are explicitly test doubles.

## Private session bundle contract

Prepare a JSON bundle outside the checkout:

```json
{
  "registry": {"registrarPublicKey": "PEM", "reviewers": []},
  "authorization": {"schema": "p79-v1", "sessionId": "random-session-id", "reviewerId": "approved-pseudonym", "expiresAt": "ISO time, within 24 hours", "access": "development", "sourceReceiptDigests": ["SHA256(canonical complete P75 source receipt)"], "signature": "registrar Ed25519 signature over authorization without signature"},
  "sources": [{"path": "/absolute/external/original.png", "source": "complete unchanged P75 source object"}],
  "exposed": []
}
```

`source` above is an object, not a string in an actual bundle. It has all fields required by `verifiedSource` and `verifyCuratorApproval` from `scripts/p75-dataset-core.mjs`, plus `split`. Each session contains 1–60 individually approved originals, all in the same access tier. Exact, source-series and perceptual duplicate candidates block the batch; the curator must deliberately resolve/rebatch them. The reviewer never sees source filenames, URLs, split or other annotations. Each per-image source receipt revision must be authorized, so modifying a signed-but-unbound field also requires new session authorization.

For a blind authorization, add signed `sealedAccessApproved: true`, `exposureLedgerApproved: true` and `exposureLedgerDigest: SHA256(canonical exposed array)`. Supply every historical exposed original with original SHA, canonical source page, curator-reviewed dHash and grouping information. The workstation checks historical coverage against #75's four immutable inherited manifests; P75's final audit remains mandatory. Never mark a public development candidate as blind.

The independently vetted registrar signs an authorization **request** containing the fields above without `signature`. This grants view access only, not garment truth. Run from repository root, keeping all file arguments external:

```bash
export P75_APPROVED_REGISTRAR_FINGERPRINT=OWNER_INDEPENDENTLY_PINNED_PUBLIC_KEY_SHA256
export P79_REGISTRAR_CONFIRMATION='I independently vetted this reviewer, source custody and session access'
node scripts/p79-workstation.mjs authorize /encrypted/session-request.json /encrypted/registrar-private.pem /encrypted/new-authorization.json
node scripts/p79-workstation.mjs serve /encrypted/session-bundle.json
```

Copy the resulting signed authorization into the private bundle. The trust fingerprint comes from the environment and is never trusted from a bundle. Keys never enter the browser. `authorize` creates a new external file exclusively; existing valid files are not overwritten. `serve` binds to random-port **127.0.0.1** with a random capability path, rejects cross-site/wrong-Host requests and all HTTP write methods, and stops accepting expired sessions. Ctrl-C stops it. Private CLI commands refuse CI.

## Independent A/B reviewer separation checklist

1. The custodian verifies that A and B are **two distinct, authorized, independent real humans** and controls separate pseudonym-key attestations. Public-key signatures do not prove humanity or independence.
2. Create separate registrar-authorized sessions, isolated browser profiles/OS accounts, private download directories and separate reviewer work times. Do not share an open tab, browser download list, draft, filename classifications, source notes, model outputs, prior corrections or answer key.
3. Each reviewer inspects every exact original directly. Fit and zoom affect display only. All geometry uses **EXIF-upright normalized coordinates**; the exported `coordinateSpace` names that convention. No pixels are re-encoded or modified.
4. Choose image-level presence/category/subtype/colors and physical unit, then draw/edit individual boxes with mouse handles or keyboard numeric inputs. Each region also has optional versioned `observed` category/subtype/colors; these are validated against the same #75 vocabulary. For mixed outfits, image-level Unknown is appropriate while recording each visible region. Do not infer shoe matching from color; explicitly choose unknown if uncertain. Record clipped hems/straps/soles and occlusion. No masks are supported or claimed.
5. Unknown and uncertain are valid. Nonclothing requires zero regions and Unknown image category/subtype/unit. Defer rather than guess. Fields begin Unknown, never with a prediction. A default Unknown draft is not evidence of a review.
6. Undo is in-memory; Previous/Next preserve each photo's independent draft. Reset needs two deliberate presses and is undoable. Edits clear acknowledgment and invalidate the current export progress. Close/reload loses in-memory drafts. Nothing automatically persists.
7. Personally inspect the image and manually check the exact declaration before explicitly exporting an **unsigned** canonical JSON draft. Save only to approved protected external storage. The original is fetched and rehashed again at export. The acknowledgment is a claim, not human identity proof.
8. Draft restore requires exact reviewer/session/source/receipt revision, supported schema/vocabulary and a timestamp within 24 hours. It does not restore acknowledgment; reinspect and acknowledge. Changed/stale/corrupt input leaves the valid in-memory draft intact. For a later session, seek custodian-authorized renewal and fresh inspection; do not change IDs or timestamps by hand to bypass the gate.

## Validation, signing and custody handoff

Before signing, run P79 validation against the exact private session and unchanged originals:

```bash
node scripts/p79-workstation.mjs validate /encrypted/session-bundle.json /encrypted/unsigned-review.json
export P75_REVIEWER_HUMAN_CONFIRMATION='I independently reviewed the original clothing photograph'
node scripts/p75-review-offline.mjs sign /encrypted/unsigned-review.json /encrypted/rater-private.pem /encrypted/new-signed-receipt.json
```

Only the actual independently vetted human rater controls their key and attestation. Preserve all P79 extensions in the signed draft; P75 signs the complete canonical payload and reuses its own label validator. A raw unsigned draft, an unchecked UI, or a synthetic test can never count toward accepted human labels.

The private handoff file is `{source, receipts: [signedA, signedB], registry}`. Run:

```bash
node scripts/p79-workstation.mjs handoff /encrypted/signed-handoff.json
node scripts/p75-review-offline.mjs audit /encrypted/p75-private-bundle.json /encrypted/reviewer-registry.json
```

`handoff` prints only aggregate status/generic errors, verifies both receipts with #75 and rejects the same reviewer twice, invalid signatures, invalid geometry, and **any label difference**, including boxes, region observations, occlusion and color cast beyond #75's coarse agreement fields. Exact box/region-ID differences conservatively remain DISPUTED; this is intentional. READY means ready for custodian audit, **not accepted labels or sealed-blind eligibility**.

## Adjudicator checklist and mission boundaries

An independently verified third human receives the quarantined originals and the private disagreement record from the custodian, independently inspects them and records reasoned signed adjudication under #75 custody. This workstation does not auto-resolve, majority-vote, normalize boxes into consensus or override P75. Its handoff gate remains BLOCKED until an authorized independent review workflow produces matching valid receipts; do not edit an existing signed receipt. Preservation of disagreements takes precedence over a convenient eligibility count. P75's current audit does not provide a generic signed-adjudication override, so unresolved disagreement remains quarantined.

After #75 audit and any required private seal, give approved TRAIN/DEV material to the relevant #67–#77 owners, and transfer sealed media/answers privately to #71 for one frozen evaluation. #78 alone owns real Android/iPhone acceptance; desktop engine checks are not phone proof. P851 owns integration/release gates; Mission 3 owns wardrobe/cloud authorization. Do not send blind IDs, splits, photos, answers, private notes or reviewer keys to GitHub/CI/model developers. The report may contain aggregate counts only. No other assignment branch or production application is changed by this tool.
