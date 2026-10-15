# Closet Current — family/friends pilot release gate (October 15, 2026)

Scope: Closet Current only; no Drive Duel changes. This is a checklist, not evidence of live completion.

## Must pass before inviting outside testers

1. **Authentication email — BLOCKED.** Project `hlkgymugtfbirlpunsra` is healthy, but the documented default Supabase email sender is restricted; custom SMTP/provider verification is not established. Configure an authorized sender, then complete real external-inbox signup confirmation, resend, password reset, expired link, and login tests. Do not disable confirmation to bypass the block.
2. **Phone camera — UNVERIFIED ON HARDWARE.** On at least one actual Android and one iPhone, capture a single garment and a whole outfit, verify saved image sharpness, orientation, recognition wait/fallback, duplicates, and automatic indexing.
3. **Account safety and recovery — UNVERIFIED ON HARDWARE.** Create two ordinary accounts and verify no cross-account clothing/photo leakage; sign out/in; restore account A on a second device; verify pending writes and user-visible cloud-backup status. Keep exports of any test wardrobes.
4. **Install and persistence — UNVERIFIED.** Install via home screen, reopen, check offline shell and media restoration, and validate the camera after browser permissions and reload.
5. **Terms/privacy and support — REVIEW NEEDED.** Verify accessible policies describing account, photo storage, retention/deletion, and support before a broader public invitation.

## Known machine evidence (not substitute for phone testing)

- GitHub Actions run 38814908844: simulate, independent-approved-photo-smoke, and collect-independent-photos succeeded.
- Gray hard shell: Outerwear/Jacket recognized correctly in the real browser diagnostic.
- Red rain jacket with additional garments visible: Outerwear identified; subtype withheld.
- Yellow rain cape: classification withheld due to conflicting evidence.
- Historical raincoat: Coat subtype mismatch confirmed.
- Do not promote unscored diagnostic images into accuracy statistics. Do not change production crop/type thresholds without an independent ordinary-photo gain.

## Pilot acceptance decision

**NO-GO for open invitations while outside-recipient confirmation email is unverified.**
A limited pilot can proceed after the email delivery gate and real-phone tests pass. Do not deploy or merge branch changes solely because the checklist exists.

Review and update evidence after real inbox/device runs. Keep Closet Current and Drive Duel deployments isolated.
