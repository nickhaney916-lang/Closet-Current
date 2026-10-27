# Closet Current Family Alpha — staging-only 4-person preflight

**27 October 2026 · Owner requested one simultaneous four-person alpha test; no two-person pilot · NO DEPLOY**

This supplements, not replaces, the [existing twelve-gate Family Alpha acceptance runbook](ACCEPTANCE.md). No additional Work assignments have been created.

## Actual read-only findings

Staging Supabase project `fbnplztkbsteuzrmbgib` was queried through a connected account on 2026-10-27. **Production `hlkgymugtfbirlpunsra` was not queried or modified.** Only system metadata and aggregate counts were retrieved; no JWT, passwords, account identities, real user files, source photos, backups, or server logs were examined.

| Metadata check | Actual observed staging finding | Interpretation |
|---|---|---|
| Project | `ACTIVE_HEALTHY` | Staging available, not evidence full UI release |
| Registered Auth users | **1** | Only one actual account exists; needs 4 *distinct family* accounts, not just 4 browsers |
| Public tables | `closet_backups` has RLS **ON** | Row-level protection configured |
| Backup policies | `authenticated` owner-based `USING` and `WITH CHECK`; backup-writer owner predicate | Owner restriction appears present; **real signed-in cross-owner JWT proof still required** |
| Public grants | Only `authenticated SELECT` returned for closet_backups in observed catalog | Backup write path uses separate role; check actual cloud save/restore before authorization |
| Photo storage | 1 private bucket, 0 public | Bucket metadata only, not proof of live object access isolation |
| `storage.objects` policies | `closet-private` SELECT/INSERT/DELETE scoped to folder segment matching `auth.uid()` | Directory ownership enforced by policy shape; verify as 2 real JWTs |
| Storage UPDATE | No UPDATE policy for bucket observed | Upsert is not verified; normal application's POST-then-read immutable photo flow must be tested. Do not widen permissions reflexively |
| Auth advisor | **Leaked password protection disabled** | Warning; enable or resolve before inviting real family accounts |

The current file `staging-metadata-audit-20261027.json` records exactly these *metadata-level* findings and explicitly sets all real-account, Cloudflare Access, phone, photo restoration and owner-release gates to NOT TESTED. The script `scripts/check-family-alpha-stage-live-preflight.mjs` deliberately outputs HOLD. Its no-deploy tests exercise false approvals and stale snapshots. This is a **human-reviewed evidence gate**, not an Auth service that can independently prove JWT ownership.

## Single four-person Family Alpha session — ordered safety checks WITHIN that session

1. Once the garment/figure and clipping quality are approved, prepare four **separate invited Auth users** on staging for owner, partner and two daughters. Do not invent accounts or collect/store passwords in GitHub. Check the preflight again: at least 4 registered total, with four distinct verified participant JWT subjects (don't confuse account-count with family identity). Restore/test auth invitation, email link, login and logout.
2. Start **one coordinated four-person session**. Both adult accounts first do harmless, synthetic staging-only backup/photo probes to show A cannot read/update/delete B's backup or private storage folder, and vice versa. Run the probes under real sessions and live staging RLS, not an admin key or impersonated fake role. Record anonymous check IDs and PASS/FAIL, **never raw JWTs or photos**. This is a short privacy gate within the same four-person session, **not a separate two-person pilot**.
3. After adult RLS privacy PASS, allow each of four participants on their own browser/profile/phone to sign in and confirm zero other-owner closet, originals, previews, favorites, backups or source images; independent local IndexedDB names and stale logout state cleared. Test simultaneous uploads/saves with harmless samples. If data crosses accounts, **STOP** before any real family/minor photo.
4. On actual supported Android/iPhone, use consented real garment photos only after safeguards pass. Test original JPEG classification before cutout, manual masking/retake, one-shoe safe reference, manually aligned shoulders/waist, outfit visual appearance and swap, favorites, failed save/rollback and cloud restore. Record actual pass/fail and screenshots only with appropriate consent.
5. Update the 12 original gates with tested UTC date, exact built revision, evidence and **physical-device/live-staging** method. Refresh metadata to the current day, fix the password advisor, inspect the actually deployed staging assets to ensure Auth and backup point ONLY at `fbnplztkbsteuzrmbgib` (production `hlkgymugtfbirlpunsra` must never be contacted), and obtain owner review. `READY FOR MAIN-THREAD REVIEW` is **not deployment approval**.

## Important release blocker independent of database policy shape

The ordinary source `public/cloud-backup.js` defaults to the production Supabase project. The separate **staging-only Auth builder** `scripts/build-family-alpha-staging-auth-hold.mjs` intentionally rewrites that base and refuses production strings in its transformed assets. That is source evidence of a defensive candidate, **not proof of the currently deployed staging site's backup routing**. Inspect actual staged/network behavior with owner permission before any uploads.

**Current stop conditions:** One account; no live JWT/phone/cloud isolation; disabled leaked-password protection; full garment-on-avatar photographic fitting still not owner-approved. Staging visual application and four-person release remain HOLD, regardless of passing synthetic checks.

### Read-only catalog checks used
`pg_tables` in public, `pg_policies` for `public` and `storage.objects`, `information_schema.role_table_grants` for authenticated and anon, counts of `auth.users` and `storage.buckets` public/private, and Supabase Auth security advisor. Re-run this audit when things change; do not treat this frozen 2026-10-27 snapshot as a current status on later dates.

No production changes; no stage modifications, real account invitations, paid services, merges, deployment, photo collection or Drive Duel changes.
