# Staging bundle SHA-256 asset inventory — October 21, 2026

**Draft development safeguard.** This PR builds on isolated artifact verification PR #160. It does not modify Work #162 pilot-device validation and does not merge/deploy to production.

## The problem
PR #160's staging verifier detected unsafe linked files, lock remnants, incomplete outputs and known live URLs. But an app icon, clothing-reference test image or arbitrary bundled JS could change after building and still pass selected content checks. This mattered because staging pilot testers could unknowingly run unreviewed mixed or corrupted files.

## Resolution
`scripts/staging-asset-seal.mjs` creates a deterministic, **unsigned** SHA-256 manifest `staging-asset-seal.json` for every generated asset (all text and binary bytes, including icons and image examples) after the staging backend rewrites and privacy warnings. The manifest is written **inside the temporary staging candidate** and verified *before* the existing atomic rename publishes a finished local folder. Every manifest entry has a sorted relative path, safe integer byte count, SHA-256 digest. It explicitly denies release authorization.

The existing `scripts/verify-restricted-staging-bundle.mjs` now performs both its fail-closed staging artifact scan AND a full byte-by-byte cryptographic integrity comparison. It rejects added/deleted assets, different binary bytes (even same size), changed scripts, invalid or duplicate manifest entries, path traversal, missing/altered manifest, and unexpected link/special files. The manifest itself is not listed in the hashes because self-hashing cannot work; strict manifest format and release-denied fields are validated.

Targeted unit tests plus full synthetic staging build and targeted post-build failure-injection tests cover binary image corruption and tampered unrelated application JavaScript. The complete Node suite and source-preservation gates rerun on GitHub Actions.

## Security limitations
This is **not a signed or trusted-attestation system**. Anyone with edit access to both the assets *and manifest* could regenerate matching hashes. A passing SHA-256 check does **not** prove Cloudflare Access protection, independently approved source, hosted Supabase isolation, correct user identity, physical phones or garment recognition accuracy. A verified artifact may also change after checking: verify against the final artifact immediately before any owner-approved upload and preserve the reviewed build unchanged. No deployment authorization is granted.

No paid resources, real customer data, real hosted credentials, staging resource creation, live database writes, production merges or Drive Duel modifications.
