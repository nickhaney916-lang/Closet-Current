# Closet Current — Mission 3 integrated private cloud controller (Family Alpha HOLD #255)

## Purpose

Integrate two independently CI-verified but divergent Mission 3 research streams into one non-release cloud controller without weakening either:
- Direct integration parent: draft PR #822 HEAD `2ef3202ee60a13ef0d61c6493a1da02dd2ad7224` (1,429 Node tests; 6 genuine Chromium/WebKit synthetic-owner browser cases at 320/390/430) includes **owner-tagged item + camera draft refusal**, **revision-only clean/dirty cloud checks**, full document fetch on remote version mismatch.
- Independent review sources: draft PR #819 HEAD `6a122c8a194acc018566a46e3a33b35dc16ca9ad` (1,418 Node tests) and PR #821 HEAD `06305a30b08d548c27c4f0ab97d3fb99129032e5` (1,423 Node tests); these add **durable per-owner device-quota stop across reload**, **SHA-corrupt immutable cloud JPEG quarantine across reload**, manual owner recovery, and owner/session revocation protection.

The direct-parent SHA is fixed. The reviewed stream is ported as isolated changes, not merged or deployed. Original parent source, existing staging, production, hosted auth, Supabase configuration, original user photos and parallel Mission 1/2 branches are untouched.

## Compatibility rules

1. Preserve revision-only `select=revision` for routine checks. Fetch `revision,document` only when a remote revision differs or restoration is required; do not read every original JPEG on focus or timer.
2. Reject every explicit foreign-owner garment and uncommitted camera draft before local owner backup or cloud restore/merge. Unknown legacy ownerless records remain unverified but compatible. The message remains a distinct foreign-owner security error (not incorrectly typed as repairable JPEG integrity).
3. Reject SHA-inconsistent remote originals, reviewed cutouts and private paths. Do not replace local original photos, garment corrections, drafts, saved outfits or local revision. Persist `integrityPause` in owner-specific local IndexedDB state; never upload it. Pause automatic cloud reads after reload. Let the current signed owner explicitly click Sync to retry only after repairing the source.
4. Preserve the atomic IndexedDB quota rollback of PR #817. On local quota exhaustion, save an owner-keyed stop bit in localStorage with sessionStorage fallback if possible; do not write photo data or session secrets into these stores. Block automatic redownload across reload. Manual Sync retries after the owner frees storage; if both web storage APIs fail, disclose non-persistence.
5. Preserve PR #814 durable 413/507 cloud capacity marker and transient 503 exponential backoff. A stale login/session may never clear another owner's pause.
6. No pretend physical device or hosted signed two-owner JWT/RLS/Storage test claims. Synthetic fixtures are explicit.

## Acceptance matrix

The integrated branch's dedicated `mission3-integrated-private-cloud-no-deploy.yml` requires:
- Exact parent ancestry and a strict changed-path allowlist excluding deployments, Supabase, auth, recognition, camera and Mission 1/2 source.
- Inherited 8/8 owner-tag tests and revision-first metadata tests; new corrupt-SHA and device-quota focused Node tests, plus the **entire serial Node suite** and production build output checked locally in CI only.
- Actual Chromium and WebKit **320, 390, 430 CSS-pixel** source/JPEG journeys for signed-owner safeguards, revision-first 1,000-photo synthetic wardrobe, malformed cloud photo quarantine, persistent device-quota reload, original/cutout backup, photo-to-closet styling, atomic restore and accessibility.
- Browser screenshots and test JSON preserved in ephemeral GitHub Actions artifact for independent inspection.

**Result status at creation:** pending exact HEAD CI; do not claim integrated pass until the final commit's independent Actions run succeeds.

**Release gate:** draft, unmerged, undeployed. Family Alpha HOLD #255 remains active. Physical Android Chrome / iPhone Safari on genuine devices, true signed hosted two-account JWT/RLS and Storage, owner consent and large real-JPEG peak heap remain open.
