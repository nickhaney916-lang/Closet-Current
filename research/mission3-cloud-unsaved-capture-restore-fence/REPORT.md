# Mission 3 — Cloud restore must not erase an unfinished source original

**Draft only. Family Alpha HOLD #255 OPEN. Do not merge, deploy or access customer data.**

Parent: Mission 3 draft PR #993, exact verified commit 494f24014c46670f0d21613d1890c4439ae1d849. Six allowlisted files, no changes to main, production, staging, or other mission branches.

## Source-verified issue

The cloud-backup-bridge.js canRestore callback only checked general busy/automatic flags. It did not detect failedDraftCaptures or live source-JPEG hashing, pending recognition, active gallery/video import, or open camera. A JPEG whose required IndexedDB save fails remains only in the owner's current page memory, behind the Retry saving photo control. Automatic cloud restore could atomically replace the local saved and draft rows, then rehydrate the screen from disk and hide that unsaved original.

There was also a precise transaction race: cloud-backup.js apply() checked canRestore before decode and queued work, not inside the IDB state.get onsuccess callback before items.clear and state.delete. A newly unsaved JPEG could arise after initial approval.

## Implementation

- Real signed-owner cloud bridge now evaluates mission3CloudRestoreReviewIdle(), rejecting restores during failed required original save, in-flight canonical capture, camera startup, active stream, gallery/video import, pending recognition, queued analysis or garment saving. A clean, already durable draft alone does not block restore.
- Real cloud apply() rechecks callbacks.canRestore() inside the native IDB state request callback immediately before any saved item, draft, or outfit row is cleared or replaced. On changed safety status it returns false with no mutation; cloud recovery schedules a later attempt. No new schema, API, cloud project, or private photo access.
- Source-executed fake IndexedDB tests exercise both exact production guard and apply code, including nine local blockers, a failed original appearing during queued restore, valid clean restore, existing dirty cloud marker and transactional refusal.
- Native Chromium and WebKit tests at CSS widths 320/390/430 run the actual production apply implementation, bridge callbacks and browser IndexedDB with synthetic JPEG/SHA and owners; remote transport is stubbed and all off-host requests are blocked. They cover failed original retention, in-flight source verification, a newly unsafe queued restore, clean successful restore and distinct-owner isolation.
- The exact-parent six-path no-deploy CI also runs inherited Node, photo, native mobile, cloud, session, legacy atomic recovery, signed disposable PostgreSQL Storage RLS and styling tests.

**CI verification status:** Pending the final exact-head success; no claim of release readiness until then.

## Still unverified for release

Real physical Android Chrome and iPhone Safari camera/PWA testing, authorized live hosted Supabase Auth/Storage backup and restore with two owners, independent genuine human-labeled photo recognition, photorealistic photograph-to-3D fabric fitting, cross-mission integration, and explicit owner signoff. Family Alpha HOLD #255 remains OPEN.
