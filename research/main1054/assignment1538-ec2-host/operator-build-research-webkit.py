#!/usr/bin/env python3
"""M1538 approved-only, isolated WPE WebKit diagnostic BUILD (never launch/tracing).

Nothing here authorizes a cloud charge, IAM/security adjustment or debugger.
Source, downstream patch, and three JSC research patches are verified by Git SHA.
A build needs an externally signed, specific approval and interactive operator.
"""
import argparse
import base64
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import urllib.request

WEBKIT_REV = "db897909f7c31d9b38793374c66427b6a4cb3dd3"
PLAYWRIGHT_BLOB = "f713c6fa093a1f45956c84844d50635376923b75"
PATCHES = (
    ("source-pinned-jsc-signal-faultpc.patch", "631bff7691d05fe0eeaca76a948236b9e6aa56b2"),
    ("source-pinned-jsc-bbq-pc-origin.patch", "47e34bb943d9745c6b29c5323dbad9f355fcf45f"),
    ("source-pinned-jsc-bbq-explicit-bounds-site.patch", "50744793ab309587e6f67cdfff4cc5d37327f44b"),
)
BUILD_COMMAND = ["Tools/Scripts/build-webkit", "--wpe", "--debug"]
PURPOSE = "separate-diagnostic-webkit-build-only-no-debugger-or-deployment"
ROOT = Path(__file__).resolve().parents[3]
PATCH_DIR = Path(__file__).resolve().parent


class Blocked(Exception):
    pass


def require(ok, why):
    if not ok:
        raise Blocked(why)


def run(args, *, cwd=None, capture=True, check=True, **kwargs):
    p = subprocess.run(args, cwd=cwd, text=True, stdout=subprocess.PIPE if capture else None,
                       stderr=subprocess.PIPE if capture else None, check=False, **kwargs)
    if check and p.returncode != 0:
        raise Blocked("COMMAND_FAILED: " + str(args[:3]) + ": " + (p.stderr or "")[-500:])
    return (p.stdout or "").strip()


def git_blob(path):
    return run(["git", "hash-object", str(path)])


def git_head(path):
    return run(["git", "-C", str(path), "rev-parse", "HEAD"])


def clean_tree(path):
    return not run(["git", "-C", str(path), "status", "--porcelain", "--untracked-files=normal"])


def verify_inputs(repo, source, downstream, workspace):
    for binary in ("git", "perl", "cmake", "ninja", "openssl", "readelf"):
        require(shutil.which(binary), "TOOL_MISSING_" + binary.upper())
    require(os.geteuid() != 0, "ROOT_BUILD_FORBIDDEN")
    require(repo.is_dir() and source.is_dir() and downstream.is_file(), "REQUIRED_INPUT_MISSING")
    require(not repo.is_symlink() and not source.is_symlink(), "SYMLINK_INPUT_FORBIDDEN")
    require(git_head(source) == WEBKIT_REV, "WRONG_ORIGINAL_WEBKIT_REVISION")
    require(clean_tree(source), "UPSTREAM_SOURCE_NOT_CLEAN")
    require(clean_tree(repo), "RESEARCH_REPOSITORY_NOT_CLEAN")
    require(git_blob(downstream) == PLAYWRIGHT_BLOB, "PLAYWRIGHT_PATCH_HASH_MISMATCH")
    for name, expected in PATCHES:
        require(git_blob(repo / "research/main1054/assignment1538-ec2-host" / name) == expected,
                "DIAGNOSTIC_PATCH_HASH_MISMATCH_" + name)
    require(workspace.is_absolute() and not workspace.exists(), "OUTPUT_MUST_BE_NEW_ABSOLUTE_PATH")
    require(workspace.parent.is_dir(), "OUTPUT_PARENT_NOT_PREPARED")
    for blocked_root in (repo.resolve(), source.resolve()):
        require(not workspace.is_relative_to(blocked_root) and
                not blocked_root.is_relative_to(workspace), "WORKSPACE_MUST_BE_SEPARATE")
    return git_head(repo)


def public_key_fingerprint(key):
    der = subprocess.run(["openssl", "pkey", "-pubin", "-in", str(key), "-outform", "DER"],
                         capture_output=True, check=False)
    require(der.returncode == 0, "APPROVER_PUBLIC_KEY_INVALID")
    return hashlib.sha256(der.stdout).hexdigest()


def check_signed_approval(args, research_head, workspace):
    required = (args.approval, args.signature, args.public_key, args.trusted_spki_sha256)
    require(all(required), "INDEPENDENT_APPROVAL_INPUT_REQUIRED")
    approval, sig, pub = (Path(x).resolve() for x in required[:3])
    require(all(p.is_file() for p in (approval, sig, pub)), "APPROVAL_FILES_MISSING")
    anchor = args.trusted_spki_sha256.lower()
    require(re.fullmatch(r"[0-9a-f]{64}", anchor), "TRUST_FINGERPRINT_INVALID")
    require(public_key_fingerprint(pub) == anchor, "UNTRUSTED_APPROVER_PUBLIC_KEY")
    verify = subprocess.run(["openssl", "pkeyutl", "-verify", "-pubin",
                             "-inkey", str(pub), "-rawin", "-in", str(approval),
                             "-sigfile", str(sig)], capture_output=True)
    require(verify.returncode == 0, "INDEPENDENT_SIGNATURE_INVALID")
    data = json.loads(approval.read_text(encoding="utf-8"))
    require(type(data) is dict, "APPROVAL_DOCUMENT_INVALID")
    exact = {
        "schema": "CC1538_WEBKIT_BUILD_APPROVAL_V1",
        "purpose": PURPOSE,
        "webkitRevision": WEBKIT_REV,
        "playwrightGitBlob": PLAYWRIGHT_BLOB,
        "researchGitHead": research_head,
        "patchGitBlobs": [sha for _, sha in PATCHES],
        "workspace": str(workspace),
        "command": BUILD_COMMAND,
        "billingScope": "previously-approved-existing-host-only"
    }
    require(all(data.get(k) == v for k, v in exact.items()), "APPROVAL_SCOPE_OR_PINS_MISMATCH")
    ticket = data.get("ticket", "")
    require(isinstance(ticket, str) and re.fullmatch(r"CC-M4-[A-Za-z0-9-]{8,94}", ticket),
            "CHANGE_TICKET_INVALID")
    date = data.get("expiresUtc", "")
    require(isinstance(date, str) and date.endswith("Z"), "APPROVAL_EXPIRY_INVALID")
    expires = datetime.fromisoformat(date.replace("Z", "+00:00"))
    require(datetime.now(timezone.utc) < expires, "APPROVAL_EXPIRED")
    return ticket, hashlib.sha256(approval.read_bytes()).hexdigest()


def fetch_pinned_playwright_patch(destination):
    require(not destination.exists() and destination.parent.is_dir(), "OUTPUT_MUST_BE_NEW")
    url = "https://api.github.com/repos/microsoft/playwright/git/blobs/" + PLAYWRIGHT_BLOB
    request = urllib.request.Request(url, headers={
        "Accept": "application/vnd.github+json", "User-Agent": "closet-current-research-read-only"})
    with urllib.request.urlopen(request, timeout=60) as result:
        data = json.load(result)
    require(data.get("sha") == PLAYWRIGHT_BLOB and data.get("encoding") == "base64",
            "PLAYWRIGHT_REMOTE_BLOB_MISMATCH")
    raw = base64.b64decode(data["content"], validate=False)
    require(raw.startswith(b"diff --git "), "PLAYWRIGHT_BLOB_NOT_PATCH")
    # Verify the Git *blob* digest, not a bare file SHA256.
    expected = hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()
    require(expected == PLAYWRIGHT_BLOB, "PLAYWRIGHT_BLOB_CONTENT_CHANGED")
    destination.write_bytes(raw)
    print("PINNED_PLAYWRIGHT_PATCH_FETCHED_ONLY", destination, PLAYWRIGHT_BLOB)


def emit_manifest(workspace, repo_head, approval_digest, ticket):
    found = []
    for path in (workspace / "WebKitBuild").rglob("*"):
        if not path.is_file() or path.is_symlink():
            continue
        if path.name != "WPEWebProcess" and not (path.name.startswith("libWPEWebKit") or
                                                 path.name.startswith("libjavascriptcore")):
            continue
        try:
            if path.stat().st_size < 1024:
                continue
        except OSError:
            continue
        elf = run(["readelf", "-h", str(path)], check=False)
        if "ELF" not in elf:
            continue
        notes = run(["readelf", "-n", str(path)], check=False)
        build_ids = re.findall(r"Build ID:\s*([0-9a-f]+)", notes)
        found.append({
            "pathRelativeToWorkspace": str(path.relative_to(workspace)),
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "buildId": build_ids[0] if build_ids else None,
        })
    require(bool(found), "BUILD_OUTPUT_ELF_NOT_FOUND")
    report = {
        "schema": "CC1538_RESEARCH_WEBKIT_BUILD_V1",
        "status": "DIAGNOSTIC_ENGINE_BUILT_ONLY_ORIGINAL_FAILURE_NOT_OBSERVED",
        "researchHead": repo_head,
        "webkitRevision": WEBKIT_REV,
        "playwrightPatchGitBlob": PLAYWRIGHT_BLOB,
        "diagnosticPatchGitBlobs": [h for _, h in PATCHES],
        "approvalDocumentSha256": approval_digest,
        "approvalTicket": ticket,
        "buildCommand": BUILD_COMMAND,
        "binaries": found,
        "originalModelExecuted": False,
        "originalWebkitBinaryIdentical": False,
        "causalRepairProven": False,
        "familyAlpha": "HOLD-255",
    }
    manifest = workspace / "cc1538-research-build-manifest.private.json"
    manifest.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    manifest.chmod(0o600)
    print("DIAGNOSTIC_WEBKIT_BUILT_NOT_NATIVE_TRAP_CAPTURED", manifest)


def main():
    p = argparse.ArgumentParser(description="Separately approved, opt-in native WPE debug build (HOLD)")
    p.add_argument("mode", choices=("preflight", "build", "fetch-playwright-patch"))
    p.add_argument("--repo", type=Path, default=ROOT)
    p.add_argument("--webkit-source", type=Path)
    p.add_argument("--playwright-patch", type=Path)
    p.add_argument("--workspace", type=Path)
    p.add_argument("--approval")
    p.add_argument("--signature")
    p.add_argument("--public-key")
    p.add_argument("--trusted-spki-sha256")
    p.add_argument("--destination", type=Path)
    args = p.parse_args()

    if args.mode == "fetch-playwright-patch":
        require(args.destination is not None, "DESTINATION_REQUIRED")
        fetch_pinned_playwright_patch(args.destination)
        return

    require(args.webkit_source and args.playwright_patch and args.workspace,
            "SOURCE_PATCH_AND_WORKSPACE_REQUIRED")
    repo, source, downstream = (x.expanduser().resolve() for x in
                                (args.repo, args.webkit_source, args.playwright_patch))
    workspace = args.workspace.expanduser()
    require(workspace.is_absolute(), "WORKSPACE_MUST_BE_ABSOLUTE")
    workspace = workspace.resolve()
    head = verify_inputs(repo, source, downstream, workspace)
    if args.mode == "preflight":
        print("PINNED_NATIVE_RESEARCH_BUILD_PREFLIGHT_ONLY", head)
        print("NO_APPROVAL_CLAIMED_NO_BUILD_NO_TRACING_NO_CLOUD_CHANGE")
        return

    ticket, digest = check_signed_approval(args, head, workspace)
    require(sys.stdin.isatty(), "INTERACTIVE_OPERATOR_REQUIRED")
    prompt = "APPROVE NATIVE RESEARCH BUILD " + ticket
    require(input("Type exactly [" + prompt + "] to build on this already-approved host: ") == prompt,
            "OPERATOR_CONFIRMATION_MISMATCH")
    # Do not add or alter AWS/IAM, sandbox, ptrace, debugger or host privileges.
    run(["git", "-C", str(source), "worktree", "add", "--detach", str(workspace), WEBKIT_REV])
    private_log = workspace / "cc1538-build.private.log"
    for patch in [downstream] + [repo / "research/main1054/assignment1538-ec2-host" / n
                                 for n, _ in PATCHES]:
        run(["git", "apply", "--check", str(patch)], cwd=workspace)
        run(["git", "apply", str(patch)], cwd=workspace)
    require((workspace / "Tools/Scripts/build-webkit").is_file(), "WEBKIT_BUILDER_MISSING")
    with private_log.open("w", encoding="utf-8") as logfile:
        env = {k: v for k, v in os.environ.items()
               if not (k.startswith("AWS_") or k.startswith("GITHUB_TOKEN") or
                       k in ("GH_TOKEN", "OPENAI_API_KEY"))}
        result = subprocess.run(["perl", *BUILD_COMMAND], cwd=workspace,
                                stdout=logfile, stderr=subprocess.STDOUT, env=env)
    private_log.chmod(0o600)
    require(result.returncode == 0, "NATIVE_BUILD_FAILED_INSPECT_PRIVATE_LOG_" + str(private_log))
    emit_manifest(workspace, head, digest, ticket)


if __name__ == "__main__":
    try:
        main()
    except (Blocked, ValueError, OSError, subprocess.SubprocessError) as error:
        print("CC1538_BUILD_BLOCKED", str(error), file=sys.stderr)
        sys.exit(2)
