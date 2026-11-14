#!/usr/bin/env python3
"""Fetch exact P68 validation JPEG members with HTTP ranges; never download or publish private photos.

This cohort is already exposed in P68 and is NOT blind/novel model acceptance.
The official S3 ZIP need not be downloaded in full; each extracted JPEG has
to match the independently frozen source SHA-256 and size.
"""
import argparse
import hashlib
import io
import json
import re
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = Path(__file__).with_name("frozen-public-validation-68.json")
MANIFEST_SHA256 = "b76e9890bda49c58c6adbbafb6f7dd738f4dcf604357fc56aa0b6e770ebe35bd"
OUT = ROOT / "benchmark" / "p88-public-validation-jpegs"
UA = "ClosetCurrentMission88/1.0 (attributed P68 public research; no owner data)"
HEX = re.compile(r"^[a-f0-9]{64}$")


class HTTPRangeZip(io.RawIOBase):
    """Minimal seekable read-only range file. Refuse servers that ignore ranges."""
    def __init__(self, url):
        self.url = url
        probe = urllib.request.Request(url, headers={"Range": "bytes=0-0", "User-Agent": UA})
        with urllib.request.urlopen(probe, timeout=60) as response:
            size = response.headers.get("Content-Range", "")
            if response.status != 206 or not re.fullmatch(r"bytes 0-0/[1-9][0-9]*", size):
                raise RuntimeError("Official archive does not support verified byte ranges")
            self.length = int(size.split("/")[-1])
        if not 0 < self.length <= 20 * 1024**3:
            raise RuntimeError("Unexpected archive length")
        self.position = 0

    def readable(self): return True
    def seekable(self): return True
    def tell(self): return self.position

    def seek(self, offset, whence=io.SEEK_SET):
        if whence == io.SEEK_SET: pos = offset
        elif whence == io.SEEK_CUR: pos = self.position + offset
        elif whence == io.SEEK_END: pos = self.length + offset
        else: raise ValueError("Invalid seek")
        if not 0 <= pos <= self.length: raise ValueError("Archive offset out of range")
        self.position = pos
        return pos

    def read(self, length=-1):
        if length == 0 or self.position == self.length: return b""
        if length < 0 or length > 8 * 1024**2:
            raise RuntimeError("Refusing unbounded archive read")
        end = min(self.position + length, self.length)
        request = urllib.request.Request(
            self.url, headers={"Range": "bytes=%d-%d" % (self.position, end - 1), "User-Agent": UA}
        )
        with urllib.request.urlopen(request, timeout=90) as response:
            if response.status != 206:
                raise RuntimeError("Archive server ignored byte range")
            value = response.read(length + 1)
        if len(value) != end - self.position:
            raise RuntimeError("Incomplete official ZIP range")
        self.position = end
        return value


def frozen():
    raw = MANIFEST.read_bytes()
    if hashlib.sha256(raw).hexdigest() != MANIFEST_SHA256:
        raise RuntimeError("Pinned P68 human-validation manifest has changed")
    data = json.loads(raw)
    rows = data.get("rows", [])
    if data.get("split") != "validation" or len(rows) != 16:
        raise RuntimeError("Unexpected previously exposed validation cohort")
    if sum(len(x["annotations"]) for x in rows) != 53:
        raise RuntimeError("Human mask count changed")
    if len({x["id"] for x in rows}) != 16 or len({x["sha256"] for x in rows}) != 16:
        raise RuntimeError("Duplicate original JPEGs in manifest")
    for row in rows:
        if not HEX.fullmatch(row["sha256"]) or not row["archiveMember"].startswith("test/"):
            raise RuntimeError("Invalid frozen image receipt")
        if not re.fullmatch(r"fashionpedia-val-[0-9]+\.jpg", row["image"]):
            raise RuntimeError("Unsafe image filename")
        license_url = row.get("photoLicenseReceipt", {}).get("primaryLicenseUrl")
        if license_url not in ("https://creativecommons.org/licenses/by/2.0/",
                               "https://creativecommons.org/licenses/by-sa/2.0/"):
            raise RuntimeError("Missing original Flickr license receipt")
    return data


def verify_or_extract(data):
    OUT.mkdir(parents=True, exist_ok=True)
    missing = []
    for row in data["rows"]:
        path = OUT / row["image"]
        if path.exists():
            photo = path.read_bytes()
            if (len(photo) != row["bytes"] or
                hashlib.sha256(photo).hexdigest() != row["sha256"] or not photo.startswith(b"\xff\xd8")):
                raise RuntimeError("Preexisting source photo did not match frozen SHA: " + row["id"])
        else:
            missing.append(row)
    if missing:
        with zipfile.ZipFile(HTTPRangeZip(data["imageArchiveSource"])) as archive:
            for row in missing:
                member = archive.getinfo(row["archiveMember"])
                if member.file_size != row["bytes"] or member.file_size > 12 * 1024**2:
                    raise RuntimeError("Unexpected original photo size")
                photo = archive.read(member)
                if hashlib.sha256(photo).hexdigest() != row["sha256"] or not photo.startswith(b"\xff\xd8"):
                    raise RuntimeError("Original Fashionpedia source SHA mismatch: " + row["id"])
                (OUT / row["image"]).write_bytes(photo)
    print(json.dumps({"cohort": "P68 exposed public validation", "photos": len(data["rows"]),
        "humanInstances": 53, "downloadedNow": len(missing),
        "sourceSha256Verified": True, "blindAcceptance": False,
        "privateOrFamilyPhotos": False}, separators=(",", ":")))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify-manifest-only", action="store_true")
    args = parser.parse_args()
    data = frozen()
    if args.verify_manifest_only:
        print(json.dumps({"frozenManifestSha256": MANIFEST_SHA256, "photos": len(data["rows"]),
                          "humanInstances": 53, "modelAccuracy": "NOT_MEASURED"}))
    else:
        verify_or_extract(data)
