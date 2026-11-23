"""Offline tests only. Synthetic approvals never authorize a real build."""
import importlib.util
import json
import pathlib
import shutil
import subprocess
import tempfile
import unittest
from datetime import datetime, timedelta, timezone

ROOT = pathlib.Path(__file__).resolve().parents[1]
FILE = ROOT / "research/main1054/assignment1538-ec2-host/operator-build-research-webkit.py"
spec = importlib.util.spec_from_file_location("cc1538_approved_build", FILE)
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


def command(*args, **kwargs):
    return subprocess.run(args, check=True, capture_output=True, **kwargs)


class TestNativeBuildAuthorization(unittest.TestCase):
    def test_canonical_source_and_patch_chain(self):
        self.assertEqual(build.WEBKIT_REV, "db897909f7c31d9b38793374c66427b6a4cb3dd3")
        self.assertEqual(build.PLAYWRIGHT_BLOB, "f713c6fa093a1f45956c84844d50635376923b75")
        self.assertEqual(build.BUILD_COMMAND, ["Tools/Scripts/build-webkit", "--wpe", "--debug"])
        self.assertEqual(len(build.PATCHES), 3)
        self.assertIn("explicit-bounds-site", build.PATCHES[-1][0])
        for name, blob in build.PATCHES:
            self.assertEqual(build.git_blob(build.PATCH_DIR / name), blob)

    def test_no_build_without_independent_approval_inputs(self):
        with self.assertRaisesRegex(build.Blocked, "INDEPENDENT_APPROVAL_INPUT_REQUIRED"):
            build.check_signed_approval(type("Args", (), {
                "approval": None, "signature": None, "public_key": None,
                "trusted_spki_sha256": None,
            })(), "a"*40, pathlib.Path("/tmp/not-a-real-build"))

    @unittest.skipUnless(shutil.which("openssl"), "openssl required")
    def test_synthetic_signature_verifies_only_under_explicit_trust_anchor(self):
        with tempfile.TemporaryDirectory() as td:
            p = pathlib.Path(td)
            private, public, approval, sig = (p / n for n in
                                               ("private.pem", "public.pem", "approval.json", "approval.sig"))
            command("openssl", "genpkey", "-algorithm", "ED25519", "-out", str(private))
            command("openssl", "pkey", "-in", str(private), "-pubout", "-out", str(public))
            work = p / "isolated-output-that-must-not-be-created"
            head = "f"*40
            body = {
                "schema": "CC1538_WEBKIT_BUILD_APPROVAL_V1",
                "purpose": build.PURPOSE,
                "webkitRevision": build.WEBKIT_REV,
                "playwrightGitBlob": build.PLAYWRIGHT_BLOB,
                "researchGitHead": head,
                "patchGitBlobs": [h for _, h in build.PATCHES],
                "workspace": str(work),
                "command": build.BUILD_COMMAND,
                "billingScope": "previously-approved-existing-host-only",
                "ticket": "CC-M4-TEST-ONLY-1234",
                "expiresUtc": (datetime.now(timezone.utc)+timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
            }
            approval.write_text(json.dumps(body, sort_keys=True) + "\n")
            command("openssl", "pkeyutl", "-sign", "-inkey", str(private),
                    "-rawin", "-in", str(approval), "-out", str(sig))
            fingerprint = build.public_key_fingerprint(public)
            class Args:
                pass
            args=Args()
            args.approval, args.signature, args.public_key = map(str, (approval,sig,public))
            args.trusted_spki_sha256 = fingerprint
            ticket, approval_hash = build.check_signed_approval(args, head, work)
            self.assertEqual(ticket, body["ticket"])
            self.assertEqual(len(approval_hash), 64)
            self.assertFalse(work.exists(), "verification must NEVER start a build")

            args.trusted_spki_sha256 = "0"*64
            with self.assertRaisesRegex(build.Blocked, "UNTRUSTED_APPROVER_PUBLIC_KEY"):
                build.check_signed_approval(args, head, work)
            args.trusted_spki_sha256 = fingerprint

            approval.write_text(approval.read_text().replace("CC-M4-TEST-ONLY-1234",
                                                              "CC-M4-TAMPERED-1234"))
            with self.assertRaisesRegex(build.Blocked, "INDEPENDENT_SIGNATURE_INVALID"):
                build.check_signed_approval(args, head, work)
            approval.write_text(json.dumps(body, sort_keys=True)+"\n")
            command("openssl", "pkeyutl", "-sign", "-inkey", str(private),
                    "-rawin", "-in", str(approval), "-out", str(sig))
            with self.assertRaisesRegex(build.Blocked, "APPROVAL_SCOPE_OR_PINS_MISMATCH"):
                build.check_signed_approval(args, "e"*40, work)
            with self.assertRaisesRegex(build.Blocked, "APPROVAL_SCOPE_OR_PINS_MISMATCH"):
                build.check_signed_approval(args, head, p / "different-workspace")
            body["expiresUtc"] = "2025-01-01T00:00:00Z"
            approval.write_text(json.dumps(body,sort_keys=True)+"\n")
            command("openssl", "pkeyutl", "-sign", "-inkey", str(private),
                    "-rawin", "-in", str(approval), "-out", str(sig))
            with self.assertRaisesRegex(build.Blocked, "APPROVAL_EXPIRED"):
                build.check_signed_approval(args, head, work)
            self.assertFalse(work.exists())

    def test_misconfigured_source_cannot_be_built_or_treated_as_approved(self):
        with tempfile.TemporaryDirectory() as td:
            p = pathlib.Path(td)
            git_repo = p / "upstream"
            git_repo.mkdir()
            command("git", "-C", str(git_repo), "init", "-q")
            command("git", "-C", str(git_repo), "-c", "user.email=test@example.invalid",
                    "-c", "user.name=Test", "commit", "--allow-empty", "-qm", "TEST")
            patch = p / "fake.patch"
            patch.write_text("diff --git a/foo b/foo\n")
            with self.assertRaisesRegex(build.Blocked, "WRONG_ORIGINAL_WEBKIT_REVISION"):
                # Even if WebKit checkout exists, a wrong commit fails before a build.
                # Directly patch the root guard for test runners in uid-0 containers.
                from unittest.mock import patch as mock_patch
                with mock_patch.object(build.os, "geteuid", return_value=1000):
                    build.verify_inputs(ROOT, git_repo, patch, p / "new-build")
            self.assertFalse((p / "new-build").exists())

    def test_no_forged_manifest_when_build_binary_absent(self):
        with tempfile.TemporaryDirectory() as td:
            with self.assertRaisesRegex(build.Blocked, "BUILD_OUTPUT_ELF_NOT_FOUND"):
                build.emit_manifest(pathlib.Path(td), "f"*40, "a"*64, "CC-M4-TEST-ONLY-1234")
            self.assertFalse((pathlib.Path(td) / "cc1538-research-build-manifest.private.json").exists())


if __name__ == "__main__":
    unittest.main()
