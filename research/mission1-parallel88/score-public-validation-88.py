#!/usr/bin/env python3
"""One-to-one original-resolution COCO polygon IoU for genuine P68 public photos.

No new human annotations are asserted. This is exposed validation research,
never sealed, prospective, population, subtype/color or physical phone proof.
"""
import gzip
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from pycocotools import mask as coco

ROOT = Path(__file__).resolve().parents[2]
SRC = Path(__file__).parent
MANIFEST = SRC / "frozen-public-validation-68.json"
MASKS = ROOT / "benchmark" / "p88-real-validation-masks"
EXPECTED = "b76e9890bda49c58c6adbbafb6f7dd738f4dcf604357fc56aa0b6e770ebe35bd"


def category(cid):
    if cid in (0, 1, 2): return "Tops"
    if cid in (3, 4, 5, 9, 12): return "Outerwear"
    if cid in (6, 7, 8, 21): return "Bottoms"
    if cid in (10, 11): return "Dresses"
    if cid == 23: return "Shoes"
    return "Accessories"


def one_to_one(iou, compatible=None, threshold=0.5):
    """Match P68's max-cardinality one-to-one protocol, not greedy reuse."""
    matrix = np.asarray(iou, dtype=float)
    if matrix.ndim != 2 or not np.isfinite(matrix).all() or (matrix < 0).any() or (matrix > 1).any():
        raise ValueError("Invalid pairwise IoU")
    truth, pred = matrix.shape
    allowed = np.ones((truth, pred), bool) if compatible is None else np.asarray(compatible, bool)
    if allowed.shape != matrix.shape: raise ValueError("Category compatibility shape")
    edges = [sorted(
        [j for j in range(pred) if allowed[i, j] and matrix[i, j] >= threshold],
        key=lambda j: (-matrix[i, j], j)
    ) for i in range(truth)]
    chosen = {}
    def assign(i, seen):
        for j in edges[i]:
            if j in seen: continue
            seen.add(j)
            if j not in chosen or assign(chosen[j], seen):
                chosen[j] = i
                return True
        return False
    for i in range(truth):
        assign(i, set())
    return sorted([{"truthIndex": i, "predictionIndex": j,
                    "iou": float(matrix[i, j])} for j, i in chosen.items()],
                  key=lambda x: x["truthIndex"])


def human_rle(annotation, height, width):
    polygon = annotation["segmentation"]
    rle = coco.frPyObjects(polygon, height, width) if isinstance(polygon, list) else polygon
    return coco.merge(rle) if isinstance(rle, list) else rle


def measure(manifest, report):
    expected = {r["id"]: r for r in manifest["rows"]}
    observations = report["rows"]
    if len(observations) != 16 or set(r["id"] for r in observations) != set(expected):
        raise ValueError("Real photo cohort is incomplete, missing or duplicated")
    rows = []
    for observed in observations:
        row = expected[observed["id"]]
        if (row["sha256"] != observed["sha256"] or
            (row["width"], row["height"]) != (observed["width"], observed["height"]) or
            observed["sourceMatch"] is not True):
            raise ValueError("Original photographed source identity mismatch")
        height, width = row["height"], row["width"]
        truth = [a for a in row["annotations"] if a["category_id"] <= 26]
        originals = [human_rle(a, height, width) for a in truth]
        masks = []
        for region in observed["regions"]:
            name = region["maskFile"]
            if name != Path(name).name or not name.endswith(".bin.gz"):
                raise ValueError("Untrusted mask path")
            binary = gzip.decompress((MASKS / name).read_bytes())
            if (len(binary) != width * height or
                hashlib.sha256(binary).hexdigest() != region["maskSha256"]):
                raise ValueError("Original-resolution predicted mask bytes altered")
            arr = np.frombuffer(binary, dtype=np.uint8).reshape(height, width)
            if not np.isin(arr, [0, 1]).all():
                raise ValueError("Predicted mask nonbinary")
            if int(arr.sum()) != region["measuredOriginalResolutionPixels"]:
                raise ValueError("Pixel count is not source-bound")
            masks.append(coco.encode(np.asfortranarray(arr)))
        matrix = np.asarray(coco.iou(masks, originals, [0] * len(originals))).T if masks \
            else np.zeros((len(originals), 0))
        compatible = np.asarray([
            [category(t["category_id"]) in p["categories"] for p in observed["regions"]]
            for t in truth], dtype=bool).reshape(len(truth), len(masks))
        rows.append({
            "id": observed["id"], "sha256": observed["sha256"],
            "truth": len(truth), "predicted": len(masks),
            "classAgnosticMatches": one_to_one(matrix),
            "categoryCompatibleMatches": one_to_one(matrix, compatible),
            "perHumanCategory": [category(t["category_id"]) for t in truth],
            "predictedRegions": [
                {"method": p["instanceMethod"], "categories": p["categories"],
                 "maskSha256": p["maskSha256"]} for p in observed["regions"]
            ],
            "inferenceMs": observed["inferenceMs"]
        })
    def totals(field):
        tp = sum(len(x[field]) for x in rows)
        human = sum(x["truth"] for x in rows)
        predicted = sum(x["predicted"] for x in rows)
        return {"matched": tp, "human": human, "predicted": predicted,
                "falseNegatives": human-tp, "falsePositives": predicted-tp,
                "recall": tp/human, "precision": tp/predicted if predicted else 0}
    class_summary = {}
    for cls in ["Tops", "Outerwear", "Bottoms", "Dresses", "Shoes", "Accessories"]:
        total = sum(x["perHumanCategory"].count(cls) for x in rows)
        matched = sum(sum(x["perHumanCategory"][m["truthIndex"]] == cls
                          for m in x["categoryCompatibleMatches"]) for x in rows)
        class_summary[cls] = {"matched": matched, "human": total,
                              "recall": matched/total if total else None}
    times = sorted(x["inferenceMs"] for x in rows)
    return {
        "classAgnostic": totals("classAgnosticMatches"),
        "categoryCompatible": totals("categoryCompatibleMatches"),
        "perCategory": class_summary,
        "latencyMs": {"median": float(np.median(times)),
                      "p95": times[math.ceil(len(times)*.95)-1]},
        "rows": rows
    }


def main():
    manifest_bytes = MANIFEST.read_bytes()
    if hashlib.sha256(manifest_bytes).hexdigest() != EXPECTED:
        raise ValueError("Frozen human labels modified")
    truth = json.loads(manifest_bytes)
    if truth["split"] != "validation" or len(truth["rows"]) != 16 or \
            sum(len(r["annotations"]) for r in truth["rows"]) != 53:
        raise ValueError("Human truth source changed")
    data = json.loads((MASKS / "real-validation-predictions-88.json").read_text())
    if (data.get("schema") != "closet-current-p88-exposed-real-photo-comparison/v1" or
        any(data[x].get("manifestSha256") != EXPECTED or
            data[x].get("automaticSave") is not False for x in ("baseline", "p88"))):
        raise ValueError("Real model receipt is not from the frozen source")
    baseline, candidate = measure(truth, data["baseline"]), measure(truth, data["p88"])
    result = {
        "schema": "closet-current-p88-exposed-human-instance-iou/v1",
        "source": "Exact official Fashionpedia JPEGs, independently annotated public P68 validation",
        "manifestSha256": EXPECTED, "photos": 16, "humanInstances": 53,
        "matching": "same-image one-to-one original-resolution COCO mask IoU >= 0.5",
        "pretrainedModelOverlap": "UNKNOWN_PUBLIC_DATASET",
        "alreadyExposedValidation": True, "newSealedAcceptance": False,
        "fineSubtypeAccuracy": "NO_INDEPENDENT_HUMAN_SUBTYPE_TRUTH",
        "primaryColorAccuracy": "NO_INDEPENDENT_HUMAN_COLOR_TRUTH",
        "autoSaveAcceptance": "BLOCKED_NOT_CALIBRATED",
        "physicalDevice": False, "privateAccountTouched": False,
        "baseline": baseline, "p88": candidate,
        "deltaClassAgnosticRecall": candidate["classAgnostic"]["recall"] - baseline["classAgnostic"]["recall"],
        "deltaCategoryCompatibleRecall": candidate["categoryCompatible"]["recall"] - baseline["categoryCompatible"]["recall"]
    }
    (MASKS / "real-validation-measured-88.json").write_text(json.dumps(result, indent=2)+"\n")
    print("P88_GENUINE_HUMAN_MASK_EVALUATION", json.dumps({
        k: v for k, v in result.items() if k not in ("baseline", "p88")
    }, separators=(",", ":")))
    for mode in ("baseline", "p88"):
        print(mode.upper()+"_EXPOSED_VALIDATION", json.dumps({
            "classAgnostic": result[mode]["classAgnostic"],
            "categoryCompatible": result[mode]["categoryCompatible"],
            "perCategory": result[mode]["perCategory"],
            "latencyMs": result[mode]["latencyMs"]
        }, separators=(",", ":")))


if __name__ == "__main__":
    main()
