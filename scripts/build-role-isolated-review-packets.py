#!/usr/bin/env python3
"""Produce *separate*, reproducible, offline role ZIPs from validated fixture packet.

First packet is blind: original licensed JPEG bytes + independent first editor,
blind first worklist/manifest only. Second packet contains second-person risk
notes/rights metadata but no first-person predictions. Neither includes customer
photos, any human drafts, model proposals, or authentic approvals.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED, BadZipFile

ROOT = Path(__file__).resolve().parents[1]
PHOTO_COUNT = 12
FIXED_ZIP_TIMESTAMP = (2026, 10, 20, 0, 0, 0)
FIRST_FILES = ("FIRST-REVIEW.html", "FIRST-ANNOTATE.html", "BLIND-FIRST-SOURCES.json")
SECOND_FILES = ("SECOND-REVIEW.html", "SECOND-APPROVE.html", "RIGHTS-AUDIT.json", "REVIEW-STATUS.json")


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def serialize(record: dict) -> bytes:
    return (json.dumps(record, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode("utf-8")


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def local_root(argument: str, *, output: bool = False) -> Path:
    p = Path(argument).resolve()
    base = (ROOT / "artifacts").resolve()
    ensure(p.is_relative_to(base), "Role bundles must remain under local ignored artifacts/")
    ensure(p != base, "Role bundle path must not be artifact root")
    if not output:
        ensure(p.is_dir() and not p.is_symlink(), "Missing non-symlink source packet directory")
    else:
        ensure(not p.is_symlink(), "Output path cannot be symlink")
    return p


def entry_bytes(src: Path, filename: str) -> bytes:
    path = src / filename
    ensure(path.is_file() and not path.is_symlink(), "Missing non-symlink packet entry " + filename)
    ensure(path.resolve().is_relative_to(src), "Packet path escapes source")
    raw = path.read_bytes()
    ensure(0 < len(raw) <= 16_000_000, "Invalid packet file size: " + filename)
    return raw


def safe_entry(info: str) -> bool:
    return ".." not in Path(info).parts and not info.startswith("/") and "\\" not in info


def create_role_zip(dest: Path, role: str, data: dict[str, bytes]) -> dict:
    ensure(set(data).isdisjoint({"PACKAGE-MANIFEST.json"}), "Manifest may not be provided externally")
    for p in data:
        ensure(safe_entry(p) and (p.startswith("originals/") or "/" not in p), "Unsafe zip entry")
    record = {
        "schemaVersion": 1,
        "role": role,
        "purpose": "offline-independent-original-photo-human-review",
        "originalPhotos": PHOTO_COUNT,
        "humanAnnotationsPresent": 0,
        "independentlyApprovedMasks": 0,
        "humanIdentitiesAuthenticated": False,
        "commercialRightsApproved": False,
        "modelPredictionsAsReference": False,
        "sourcePixelsChanged": False,
        "sourcePhotoVerification": "sha256-matched-to-two-locked-manifests",
        "files": {name: sha(content) for name, content in sorted(data.items())},
    }
    entries = {**data, "PACKAGE-MANIFEST.json": serialize(record)}
    # Atomically exclusive files prevent accidental overwrites of past
    # packets and avoid modifying human-reviewed evidence folders.
    ensure(not dest.exists(), "Refusing to overwrite existing role packet")
    with dest.open("xb") as handle:
        with ZipFile(handle, "w", compression=ZIP_DEFLATED, compresslevel=6) as zip_file:
            for name, raw in sorted(entries.items()):
                info = ZipInfo(name, FIXED_ZIP_TIMESTAMP)
                info.compress_type = ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                zip_file.writestr(info, raw, compress_type=ZIP_DEFLATED, compresslevel=6)
    return {"filename": dest.name, "sha256": sha(dest.read_bytes()), "fileCount": len(entries),
            "originalPhotoCount": PHOTO_COUNT, "role": role}


def build(source: str = "artifacts/independent-mask-review",
          output: str = "artifacts/private-human-review/role-packets") -> dict:
    src = local_root(source)
    out = local_root(output, output=True)
    ensure(not (out / "first-human-originals.zip").exists()
           and not (out / "second-human-originals.zip").exists()
           and not (out / "ROLE-DELIVERY-MANIFEST.json").exists(),
           "Existing review package: use a fresh output folder")
    blind = json.loads(entry_bytes(src, "BLIND-FIRST-SOURCES.json"))
    state = json.loads(entry_bytes(src, "REVIEW-STATUS.json"))
    locked = json.loads((ROOT / "benchmark/locked-photo-sources.json").read_text())
    expected = {r["image"]: r["sha256"] for r in locked}
    originals = blind.get("sourceOriginals")
    ensure(isinstance(originals, list) and len(originals) == PHOTO_COUNT
           and len(expected) == PHOTO_COUNT, "Need twelve locked originals")
    ensure(blind.get("modelPredictionsIncluded") == 0
           and blind.get("manifestCategoryLabelsIncluded") == 0
           and blind.get("approvedMasks") == 0
           and state.get("independentlyReviewedFullSizeReferenceMasks") == 0
           and state.get("humanReviewerOneCompleted") == 0
           and state.get("humanReviewerTwoApproved") == 0
           and state.get("independentRightsApproval") is False
           and state.get("productionAuthorized") is False,
           "Cannot package unreviewed masks or real identity/rights as approved")
    ensure(state.get("currentEditorOutputsExactOriginalGrid") is True
           and state.get("nativeGridSupportedOriginals") == PHOTO_COUNT,
           "Original-grid editor cannot support every source; fail closed")
    originals_data: dict[str, bytes] = {}
    for record in originals:
        name = record.get("image")
        ensure(isinstance(name, str) and name in expected and name == record.get("id") + ".jpg",
               "Noncanonical original name")
        rel = record.get("sourceRelativePath")
        ensure(rel == "originals/" + name and record.get("nativeGridReviewSupported") is True,
               "Wrong source filename or review grid")
        ensure(record.get("sourceSha256") == expected[name]
               and record.get("approvedReferenceMask") is None,
               "Source digest mismatch or unexpected reference")
        raw = entry_bytes(src, rel)
        ensure(sha(raw) == expected[name], "Original image bytes changed: " + name)
        ensure(rel not in originals_data, "Duplicate original JPG")
        originals_data[rel] = raw
    ensure(len(originals_data) == PHOTO_COUNT, "Source count missing")
    ensure(entry_bytes(src, "FIRST-ANNOTATE.html") ==
           (ROOT / "benchmark/annotate-garment-native.html").read_bytes(),
           "Source-native first editor does not match reviewed code")
    ensure(entry_bytes(src, "SECOND-APPROVE.html") ==
           (ROOT / "benchmark/approve-garment-mask-native.html").read_bytes(),
           "Source-native independent second reviewer code mismatch")
    # Blindness invariant: no second review hint strings or category labels
    # from the evidence/manifest may enter the FIRST source worklist.
    manifest = json.loads((ROOT / "benchmark/local-fitting-real-photo-manifest.json").read_text())
    blind_sources = (entry_bytes(src, "FIRST-REVIEW.html")
                     + entry_bytes(src, "BLIND-FIRST-SOURCES.json")).decode("utf-8")
    for row in manifest["cases"]:
        hints = row.get("sourceInspection")
        ensure(not hints or hints not in blind_sources,
               "First role worklist contains second reviewer risk hint: " + row["id"])
    ensure("SECOND-APPROVE.html" not in blind_sources
           and "SECOND-REVIEW.html" not in blind_sources,
           "First role worklist links to unblinded reviewer materials")
    first = {name: entry_bytes(src, name) for name in FIRST_FILES}
    second = {name: entry_bytes(src, name) for name in SECOND_FILES}
    first.update(originals_data)
    second.update(originals_data)
    ensure(not (set(FIRST_FILES) & set(SECOND_FILES)), "Reviewer roles overlap")
    out.mkdir(parents=True, exist_ok=True)
    a = create_role_zip(out / "first-human-originals.zip", "first-human-model-blind", first)
    b = create_role_zip(out / "second-human-originals.zip", "second-independent-review", second)
    result = {
        "schemaVersion": 1, "separateRoleArchives": True,
        "sourceOriginalsVerified": PHOTO_COUNT, "referenceMasksAuthenticated": 0,
        "realPhotoMaskAccuracyMeasured": False, "productionAuthorized": False,
        "firstRoleContainsSecondReviewHints": False, "reviewersAreAuthenticated": False,
        "archives": [a, b],
    }
    (out / "ROLE-DELIVERY-MANIFEST.json").write_bytes(serialize(result))
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--packet", default="artifacts/independent-mask-review")
    parser.add_argument("--out", default="artifacts/private-human-review/role-packets")
    args = parser.parse_args()
    print(json.dumps(build(args.packet, args.out), indent=2))
