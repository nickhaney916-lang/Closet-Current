#!/usr/bin/env python3
"""One-to-one original-resolution COCO polygon IoU for genuine P68 public photos.

No new human annotations are asserted. This is exposed validation research,
never sealed, prospective, population, subtype/color or physical phone proof.
"""
import gzip
from collections import Counter
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
                 "maskSha256": p["maskSha256"], "confidence": p["confidence"]}
                for p in observed["regions"]
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


def retained_fixed_match_diagnostic(rows, thresholds=(0.80, 0.85, 0.90, 0.95)):
    """Retain originally matched proposals by confidence; NOT rematched IoU.

    Research-only, previously EXPOSED P68 validation. Removing candidates may
    change optimal one-to-one matching; these are *retained existing matches*,
    not independently recomputed precision/recall or a safe release cutoff.
    """
    if not rows or not all(isinstance(t, (int, float)) and math.isfinite(t) and
                           0 <= t <= 1 for t in thresholds):
        raise ValueError("Invalid diagnostic rows or thresholds")
    truth = sum(row["truth"] for row in rows)
    if truth <= 0: raise ValueError("No human truth for confidence diagnostic")
    result = []
    for threshold in thresholds:
        proposals = agnostic = compatible = 0
        for row in rows:
            regions = row["predictedRegions"]
            if row["predicted"] != len(regions):
                raise ValueError("Predicted proposal count altered")
            kept = set()
            for index, region in enumerate(regions):
                score = region.get("confidence")
                if not isinstance(score, (int, float)) or not math.isfinite(score) or not 0 <= score <= 1:
                    raise ValueError("Missing or invalid real model confidence")
                if score >= threshold: kept.add(index)
            proposals += len(kept)
            for key in ("classAgnosticMatches", "categoryCompatibleMatches"):
                matches = row[key]
                used = [m["predictionIndex"] for m in matches]
                if len(used) != len(set(used)) or any(not isinstance(i, int) or i < 0 or i >= len(regions) for i in used):
                    raise ValueError("Untrusted original one-to-one match indices")
            agnostic += sum(m["predictionIndex"] in kept for m in row["classAgnosticMatches"])
            compatible += sum(m["predictionIndex"] in kept for m in row["categoryCompatibleMatches"])
        if compatible > agnostic or agnostic > proposals:
            raise ValueError("Retained match invariants violated")
        result.append({
            "threshold": threshold, "originalHumanInstances": truth,
            "retainedProposals": proposals,
            "retainedPriorClassAgnosticMatches": agnostic,
            "retainedPriorCategoryCompatibleMatches": compatible,
            "retainedPriorCategoryCompatibleFraction": compatible/proposals if proposals else None,
            "retainedPriorCategoryCompatibleHumanCoverage": compatible/truth,
            "notRematchedIoU": True,
            "notNovelCalibration": True, "noAutoSaveAuthority": True
        })
    return result


def source_category_failure_diagnostic(rows):
    """Class error atlas from the ORIGINAL agnostic one-to-one mask matching.

    A separately optimized category-compatible assignment may select different
    pairs. Do not call these mismatches calibrated model error rates, root
    causes, or novel/blind recognition acceptance.
    """
    if not isinstance(rows, list) or not rows:
        raise ValueError("Missing human instance rows")
    missing, orphan, wrong_by_truth, wrong = Counter(), Counter(), Counter(), []
    matched = supported = predictions = humans = separately_compatible = 0
    for row in rows:
        originals, regions = row["perHumanCategory"], row["predictedRegions"]
        if row["truth"] != len(originals) or row["predicted"] != len(regions):
            raise ValueError("Original human or region counts changed")
        observed = row["classAgnosticMatches"]
        independent = row["categoryCompatibleMatches"]
        for matches in (observed, independent):
            truth_ids, predicted_ids = [], []
            for match in matches:
                truth, pred, iou = (match["truthIndex"],
                                   match["predictionIndex"], match["iou"])
                if (not isinstance(truth,int) or isinstance(truth,bool) or
                    not isinstance(pred,int) or isinstance(pred,bool) or
                    truth < 0 or truth >= len(originals) or
                    pred < 0 or pred >= len(regions) or
                    not isinstance(iou,(int,float)) or not .5 <= iou <= 1):
                    raise ValueError("Invalid original one-to-one IoU match")
                truth_ids.append(truth)
                predicted_ids.append(pred)
            if (len(set(truth_ids)) != len(truth_ids) or
                len(set(predicted_ids)) != len(predicted_ids)):
                raise ValueError("Duplicate original mask assignment")
        matched += len(observed)
        separately_compatible += len(independent)
        predictions += len(regions)
        humans += len(originals)
        localized_truth = {m["truthIndex"] for m in observed}
        localized_pred = {m["predictionIndex"] for m in observed}
        for i, category in enumerate(originals):
            if i not in localized_truth: missing[category] += 1
        for i, region in enumerate(regions):
            categories = region.get("categories")
            if (not isinstance(categories,list) or not categories or
                any(not isinstance(c,str) or not c for c in categories)):
                raise ValueError("Invalid original model category support")
            if i not in localized_pred: orphan["|".join(categories)] += 1
        for match in observed:
            truth, pred = match["truthIndex"], match["predictionIndex"]
            category = originals[truth]
            types = regions[pred]["categories"]
            if category not in types:
                wrong_by_truth[category] += 1
                wrong.append({
                    "photoId":row["id"], "truthCategory":category,
                    "proposalCategories":types, "iou":match["iou"],
                    "truthIndex":truth, "predictionIndex":pred
                })
            else:
                supported += 1
    if not 0 <= supported <= matched <= min(humans,predictions):
        raise ValueError("Original matching totals are inconsistent")
    if sum(missing.values())+matched != humans or sum(orphan.values())+matched != predictions:
        raise ValueError("Original unmatched counts are inconsistent")
    return {
        "schema":"closet-current-p88-exposed-error-attribution/v1",
        "assignment":"previously observed class-agnostic one-to-one original-resolution IoU",
        "photos":len(rows), "humanInstances":humans, "proposals":predictions,
        "originalClassAgnosticMatches":matched,
        "categorySupportedWithinAgnostic":supported,
        "wrongCategoryWithinAgnostic":len(wrong),
        "separatelyOptimizedCategoryCompatibleMatches":separately_compatible,
        "humanWithoutIoUMatch":humans-matched,
        "proposalWithoutIoUMatch":predictions-matched,
        "humanWithoutIoUByCategory":dict(sorted(missing.items())),
        "unmatchedProposalByModelCategorySet":dict(sorted(orphan.items())),
        "wrongCategoryMatchedByHumanCategory":dict(sorted(wrong_by_truth.items())),
        "wrongCategoryExamples":wrong,
        "notNewBlindTruth":True,
        "notRootCauseProven":True,
        "doesNotAuthorizeModelChangesOrAutoSave":True
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
    research_modes = ("researchLoose65", "researchLoose55", "researchLoose65ShoeSplit")
    all_modes = ("baseline", "shoeOnly68", "p88Safe", "p88") + research_modes
    if (data.get("schema") != "closet-current-p88-exposed-real-photo-comparison/v1" or
        data.get("pixelGateResearchOnly") is not True or
        data.get("pixelGatePreservesOriginalPersonDetector") is not True or
        data.get("pixelGateNativeControlParityVerified") is not True or
        data.get("noProductionThresholdChange") is not True or
        data.get("newSealedBlindAcceptance") is not False or
        any(data[x].get("manifestSha256") != EXPECTED or
            data[x].get("automaticSave") is not False or
            data[x].get("sourceDisjointFromP68Development") is not False
            for x in all_modes)):
        raise ValueError("Real model or research gate receipt is not from unchanged exposed source")
    if (data["researchLoose65"].get("researchOnlyPixelGate") !=
            {"pixelConfidence": 0.65, "pixelMargin": 0.12} or
        data["researchLoose55"].get("researchOnlyPixelGate") !=
            {"pixelConfidence": 0.55, "pixelMargin": 0.08} or
        data["researchLoose65ShoeSplit"].get("researchOnlyPixelGate") !=
            {"pixelConfidence": 0.65, "pixelMargin": 0.12} or
        data["researchLoose65ShoeSplit"].get("researchOnlyShoeComponentReview") is not True or
        any(data[x].get("researchOnlyShoeComponentReview") is not False
            for x in ("baseline", "shoeOnly68", "p88Safe", "p88", "researchLoose65", "researchLoose55")) or
        any(data[x].get("researchOnlyPixelGate") is not None
            for x in ("baseline", "shoeOnly68", "p88Safe", "p88"))):
        raise ValueError("Research threshold definition altered")
    baseline, shoes, safe, candidate, loose65, loose55, loose65_split = (
        measure(truth, data[mode]) for mode in all_modes)
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
        "exposedResearchPixelGateControlParity": True,
        "exposedResearchReusesSameHumanSource": True,
        "exposedResearchNoModelOrAutoSavePromotion": True,
        "exposedResearchPixelGateParameters": {
            "researchLoose65": {"pixelConfidence": 0.65, "pixelMargin": 0.12},
            "researchLoose55": {"pixelConfidence": 0.55, "pixelMargin": 0.08},
            "researchLoose65ShoeSplit": {"pixelConfidence": 0.65, "pixelMargin": 0.12,
                                          "conservativeShoeComponentReview": True}
        },
        "confidenceRetentionResearchOnly": retained_fixed_match_diagnostic(safe["rows"]),
        "categoryFailureAttributionResearchOnly": source_category_failure_diagnostic(safe["rows"]),
        "confidenceRetentionMethod": "fixed prior one-to-one matches; candidate masks NOT re-matched",
        "confidenceCutoffPromotionAllowed": False,
        "physicalDevice": False, "privateAccountTouched": False,
        "baseline": baseline, "shoeOnly68": shoes, "p88Safe": safe, "p88": candidate,
        "researchLoose65": loose65, "researchLoose55": loose55,
        "researchLoose65ShoeSplit":loose65_split,
        "researchOnlyPixelGateDiffVsSafe": {
            x: {
                "addedProposals": value["classAgnostic"]["predicted"]-safe["classAgnostic"]["predicted"],
                "newClassAgnosticMatches": value["classAgnostic"]["matched"]-safe["classAgnostic"]["matched"],
                "newCategoryCompatibleMatches": value["categoryCompatible"]["matched"]-safe["categoryCompatible"]["matched"],
                "deltaUnmatchedProposals": value["classAgnostic"]["falsePositives"]-safe["classAgnostic"]["falsePositives"],
                "notSealedAccuracy": True, "notProductionPromotion": True
            }
            for x, value in (("researchLoose65",loose65),("researchLoose55",loose55),
                             ("researchLoose65ShoeSplit",loose65_split))
        },
        "researchShoeComponentRescueVsLoose65": {
            "extraProposals":loose65_split["classAgnostic"]["predicted"]-loose65["classAgnostic"]["predicted"],
            "extraAgnosticMatches":loose65_split["classAgnostic"]["matched"]-loose65["classAgnostic"]["matched"],
            "extraCategoryMatches":loose65_split["categoryCompatible"]["matched"]-loose65["categoryCompatible"]["matched"],
            "notBlindGeneralization":True,
            "notDeploymentPermission":True
        },
        "deltaClassAgnosticRecall": candidate["classAgnostic"]["recall"] - baseline["classAgnostic"]["recall"],
        "deltaCategoryCompatibleRecall": candidate["categoryCompatible"]["recall"] - baseline["categoryCompatible"]["recall"],
        "deltaP88VsShoeOnlyRecall": candidate["classAgnostic"]["recall"] - shoes["classAgnostic"]["recall"],
        "deltaP88VsShoeOnlyPrecision": candidate["classAgnostic"]["precision"] - shoes["classAgnostic"]["precision"],
        "deltaSafeVsShoeOnlyRecall": safe["classAgnostic"]["recall"] - shoes["classAgnostic"]["recall"],
        "deltaSafeVsShoeOnlyPrecision": safe["classAgnostic"]["precision"] - shoes["classAgnostic"]["precision"]
    }
    (MASKS / "real-validation-measured-88.json").write_text(json.dumps(result, indent=2)+"\n")
    print("P88_GENUINE_HUMAN_MASK_EVALUATION", json.dumps({
        k: v for k, v in result.items() if k not in ("baseline", "shoeOnly68", "p88Safe", "p88")
    }, separators=(",", ":")))
    print("P88_EXPOSED_CATEGORY_FAILURES_RESEARCH", json.dumps(
        result["categoryFailureAttributionResearchOnly"],separators=(",", ":")))
    print("P88_EXPOSED_SAME_LOGIT_PIXEL_GATE_RESEARCH",json.dumps({
        "manifestSha256":EXPECTED,"photos":16,"humanInstances":53,
        "nativeThresholdsUnchanged":True,"newBlindTruth":False,
        "baseline": {"agnostic":safe["classAgnostic"],
                     "category":safe["categoryCompatible"]},
        "probes": {x:{
            "agnostic":result[x]["classAgnostic"],
            "category":result[x]["categoryCompatible"],
            "delta":result["researchOnlyPixelGateDiffVsSafe"][x],
            "perCategory":result[x]["perCategory"]}
             for x in research_modes}
    },separators=(",",":")))
    print("P88_EXPOSED_FIXED_MATCH_CONFIDENCE_RESEARCH", json.dumps({
        "sourceDigest": EXPECTED,
        "rows": 16, "humanInstances": 53,
        "thresholds": result["confidenceRetentionResearchOnly"],
        "newBlindEvidence": False, "safeThresholdPromotion": False
    }, separators=(",", ":")))
    for mode in ("baseline", "shoeOnly68", "p88"):
        print(mode.upper()+"_EXPOSED_VALIDATION", json.dumps({
            "classAgnostic": result[mode]["classAgnostic"],
            "categoryCompatible": result[mode]["categoryCompatible"],
            "perCategory": result[mode]["perCategory"],
            "latencyMs": result[mode]["latencyMs"]
        }, separators=(",", ":")))


if __name__ == "__main__":
    main()
