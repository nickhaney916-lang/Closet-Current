#!/usr/bin/env python3
"""Mission 1 P772: Select-before-inference real publisher human polygon cohort.

This script deliberately DOES NOT consult model outputs, previously scored
masks, or human annotations invented by the assistant. It reads the exact
publisher Fashionpedia validation annotation JSON, verifies its pinned SHA,
selects one fresh Pexels-recorded photograph for each of twelve supported
semantic garment categories by a deterministic precommitted image-ID hash,
and verifies each actual archive JPEG byte before publishing the manifest.

A publisher human polygon does NOT establish independently blinded second
review, exact subtype/primary color, source-page license, training novelty,
or private owner source approval. This is exploratory validation only.
"""
import hashlib
import io
import json
import pathlib
import sys
import urllib.request
import zipfile

PUBLISHER_ANNOTATION_URL = (
    "https://s3.amazonaws.com/ifashionist-dataset/annotations/"
    "instances_attributes_val2020.json"
)
ANNOTATION_SHA256 = "f831f415edad12d52acde8b138fe7ebd1592b57bf0dcd6a3b63ba8cabd208223"
PUBLISHER_ARCHIVE_URL = "https://s3.amazonaws.com/ifashionist-dataset/images/val_test2020.zip"
SELECTION_SALT = "closet-current-M1-P772-publisher-first-inference-2026-11-09-LOCKED"
CATEGORY_TARGETS = (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 23)
ALLOWED_CATEGORY_IDS = frozenset(CATEGORY_TARGETS)
MAX_INSTANCES = 16
EXPOSED_P66_IDS = frozenset((9029, 10395, 11321, 10904, 10775, 12042))
GUTTER = "MISSION1_PUBLISHER_772: "


def fail(why):
    raise ValueError(GUTTER + why)


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def valid_polygon(ann):
    p = ann.get("segmentation")
    return isinstance(p, list) and bool(p) and all(
        isinstance(poly, list) and len(poly) >= 6
        and len(poly) % 2 == 0
        and all(isinstance(x, (int, float)) and x >= 0 for x in poly)
        for poly in p
    )


def choose_published_photos(document, excluded_ids, targets=CATEGORY_TARGETS):
    """Pure deterministic selection independent of ANY model predictions."""
    images = {im["id"]: im for im in document["images"]}
    by_image = {}
    for ann in document["annotations"]:
        if ann["category_id"] in ALLOWED_CATEGORY_IDS and valid_polygon(ann):
            by_image.setdefault(ann["image_id"], []).append(ann)
    options = []
    for image_id, image in images.items():
        if image_id in excluded_ids or image.get("license") != 8:
            continue
        filename = image.get("file_name", "")
        width, height = image.get("width"), image.get("height")
        if not isinstance(filename, str) or not filename.endswith(".jpg") or "/" in filename:
            continue
        if not isinstance(width, int) or not isinstance(height, int):
            continue
        if min(width, height) < 256 or max(width, height) > 2048:
            continue
        ann = by_image.get(image_id, [])
        if not (1 <= len(ann) <= MAX_INSTANCES):
            continue
        candidate_categories = {a["category_id"] for a in ann}
        key = sha256((SELECTION_SALT + ":" + str(image_id)).encode("utf-8"))
        options.append((key, image_id, image, ann, candidate_categories))
    options.sort(key=lambda x: (x[0], x[1]))
    selected, claimed = [], set()
    for target in targets:
        candidate = next((row for row in options
                          if row[1] not in claimed and target in row[4]), None)
        if not candidate:
            fail("not enough publisher-licensed polygon photos for category " + str(target))
        key, image_id, image, polygons, _ = candidate
        claimed.add(image_id)
        selected.append({
            **image, "archiveMember": "test/" + image["file_name"],
            "annotations": sorted(polygons, key=lambda a: a["id"]),
            "selectionTargetCategoryID": target,
            "selectionIDHash": key
        })
    if len(selected) != len(targets) or len(claimed) != len(targets):
        fail("bad deterministic cohort cardinality")
    return selected


def publisher_bytes(url):
    with urllib.request.urlopen(
        urllib.request.Request(url, headers={"User-Agent": "ClosetCurrentMission1Research/1.0"}),
        timeout=90,
    ) as res:
        return res.read()


def main():
    if len(sys.argv) != 3:
        fail("usage: select-publisher-mask-holdout-772.py OUTPUT_MANIFEST_JSON OUT_PHOTO_FOLDER")
    manifest_path = pathlib.Path(sys.argv[1])
    out_dir = pathlib.Path(sys.argv[2])
    locked = json.loads(pathlib.Path("benchmark/locked-photo-sources.json").read_text())
    previous = json.loads(pathlib.Path(
        "research/real-garment-acceptance-66/pinned-published-exposed.json").read_text())
    previous_shas = {x["sha256"] for x in locked} | {x["sha256"] for x in previous["rows"]}
    assert len(locked) == 59 and len(previous["rows"]) == 6 and len(previous_shas) == 65
    raw = publisher_bytes(PUBLISHER_ANNOTATION_URL)
    if sha256(raw) != ANNOTATION_SHA256:
        fail("publisher annotated source changed from pinned SHA")
    source = json.loads(raw)
    rows = choose_published_photos(source, EXPOSED_P66_IDS)
    original_archive = publisher_bytes(PUBLISHER_ARCHIVE_URL)
    archive = zipfile.ZipFile(io.BytesIO(original_archive))
    out_dir.mkdir(parents=True, exist_ok=True)
    seen_sha = set()
    for row in rows:
        photo = archive.read(row["archiveMember"])
        digest = sha256(photo)
        if len(photo) < 1000 or len(photo) > 8 * 1024 * 1024 or (
            not photo.startswith(b"\xff\xd8") or not photo.endswith(b"\xff\xd9")
        ):
            fail("invalid original JPEG bytes " + str(row["id"]))
        if digest in previous_shas or digest in seen_sha:
            fail("previously examined source byte SHA or duplicate selected " + str(row["id"]))
        seen_sha.add(digest)
        row["sha256"], row["bytes"] = digest, len(photo)
        row["file_name"] = pathlib.Path(row["file_name"]).name
        out_dir.joinpath(row["file_name"]).write_bytes(photo)
    result = {
        "schema": "closet-current-publisher-polygon-preinference-772/v1",
        "annotationURL": PUBLISHER_ANNOTATION_URL,
        "annotationSHA256": ANNOTATION_SHA256,
        "archiveURL": PUBLISHER_ARCHIVE_URL,
        "selectionSalt": SELECTION_SALT,
        "selectionFixedBeforeInference": True,
        "selectionCriteria": "Deterministic lowest salted hash across approved validation images per category 0–10,23, excluding all six prior P66 image IDs",
        "annotationLicense": "Fashionpedia publisher dataset annotation CC BY 4.0",
        "photoLicense": "Pexels license recorded by Fashionpedia image license id 8; original source page unavailable",
        "photoLicenseURL": "https://www.pexels.com/license/",
        "publisherHumanAnnotationsNotTwoBlindedReviewers": True,
        "exactGarmentSubtypesLabeled": False,
        "primaryColorsHumanLabeled": False,
        "modelTrainingOverlapIndependentVerified": False,
        "publisherPhotoPagesIndependentlyRightsVerified": False,
        "independentOwnerReview": False,
        "releaseAuthorized": False,
        "familyAlpha": "HOLD",
        "rows": rows,
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({
        "selectedRealPublisherJPEGs": len(rows),
        "publishedHumanPolygons": sum(len(r["annotations"]) for r in rows),
        "excludedPreviouslyExposedSourceSHA": len(previous_shas),
        "selectedIDs": [r["id"] for r in rows],
        "selectedCategories": [r["selectionTargetCategoryID"] for r in rows],
        "manifestSHA256": sha256(manifest_path.read_bytes()),
        "humanDoubleBlindedGroundTruth": False,
        "familyAlpha": "HOLD",
    }))


if __name__ == "__main__":
    main()
