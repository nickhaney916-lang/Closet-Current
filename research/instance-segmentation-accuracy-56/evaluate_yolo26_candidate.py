"""Reproducible CPU pilot for a third-party DeepFashion2 ONNX instance model.

Uses the repo's existing SHA-frozen photo fixtures and coarse box annotations.
These are prior, single-reviewer labels, not a blinded independent test set.
The model's own end-to-end output is scored as-is at confidence >= 0.50.
"""
from __future__ import annotations

import hashlib
import io
import json
import time
import urllib.request
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
MODEL_ID = "HasanKabir23/Yolov26s-DeepFashion2"
MODEL_REVISION = "670bd8b4a9a94c687c85df0b1376497c40a3759b"
MODEL_SHA256 = "485bc106721febbd82fe24297e12a9fb49a435a552afff1e6b76308716555f76"
MODEL_URL = (f"https://huggingface.co/{MODEL_ID}/resolve/{MODEL_REVISION}/best.onnx")
MODEL_CLASSES = {
    0: ("short_sleeve_top", "upper"),
    1: ("long_sleeve_top", "upper"),
    2: ("short_sleeve_outwear", "upper"),
    3: ("long_sleeve_outwear", "upper"),
    4: ("vest", "upper"),
    5: ("sling", "upper"),
    6: ("shorts", "bottom"),
    7: ("trousers", "bottom"),
    8: ("skirt", "bottom"),
    9: ("short_sleeve_dress", "dress"),
    10: ("long_sleeve_dress", "dress"),
    11: ("vest_dress", "dress"),
    12: ("sling_dress", "dress"),
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def model_path() -> Path:
    target = Path("/tmp/closet-current-yolo26s-deepfashion2.onnx")
    if not target.exists() or sha(target.read_bytes()) != MODEL_SHA256:
        request = urllib.request.Request(MODEL_URL, headers={"User-Agent": "ClosetCurrent-Research/56"})
        with urllib.request.urlopen(request, timeout=90) as response:
            data = response.read()
        if sha(data) != MODEL_SHA256:
            raise RuntimeError("Pinned model asset SHA-256 mismatch")
        target.write_bytes(data)
    return target


def iou(a, b):
    left, top = max(a[0], b[0]), max(a[1], b[1])
    right, bottom = min(a[2], b[2]), min(a[3], b[3])
    intersection = max(0, right-left) * max(0, bottom-top)
    area_a = max(0, a[2]-a[0]) * max(0, a[3]-a[1])
    area_b = max(0, b[2]-b[0]) * max(0, b[3]-b[1])
    return intersection / (area_a + area_b - intersection + 1e-12)


def preprocess(image):
    width, height = image.size
    scale = min(416/width, 416/height)
    resized_width, resized_height = round(width*scale), round(height*scale)
    resized = image.resize((resized_width, resized_height), Image.Resampling.BILINEAR)
    canvas = Image.new("RGB", (416, 416), (114, 114, 114))
    pad_x, pad_y = (416-resized_width)//2, (416-resized_height)//2
    canvas.paste(resized, (pad_x, pad_y))
    pixels = np.asarray(canvas, dtype=np.float32) / 255.0
    return pixels.transpose(2, 0, 1)[None], (width, height, resized_width, resized_height, pad_x, pad_y)


def evaluate_photo(session, row, image_path):
    image_bytes = image_path.read_bytes()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor, geometry = preprocess(image)
    width, height, resized_width, resized_height, pad_x, pad_y = geometry
    start = time.perf_counter()
    detection_output, prototype_output = session.run(None, {"images": tensor})
    inference_ms = (time.perf_counter()-start)*1000
    if detection_output.shape != (1, 300, 38) or prototype_output.shape != (1, 32, 104, 104):
        raise RuntimeError(f"Unexpected ONNX outputs: {detection_output.shape}, {prototype_output.shape}")

    proposals = []
    for values in detection_output[0]:
        score, class_id = float(values[4]), int(values[5])
        if score < 0.50 or class_id not in MODEL_CLASSES:
            continue
        x1, y1, x2, y2 = map(float, values[:4])
        box = [
            min(1, max(0, (x1-pad_x)/resized_width)),
            min(1, max(0, (y1-pad_y)/resized_height)),
            min(1, max(0, (x2-pad_x)/resized_width)),
            min(1, max(0, (y2-pad_y)/resized_height)),
        ]
        if box[2] <= box[0] or box[3] <= box[1]:
            continue
        coefficients = values[6:38]
        mask_logits = np.tensordot(coefficients, prototype_output[0], axes=(0, 0))
        mask = (1/(1+np.exp(-np.clip(mask_logits, -30, 30))) >= 0.5).astype(np.uint8)
        # The output includes genuine per-instance prototype masks. Crop them
        # using the model's decoded box in prototype coordinates for review.
        mh, mw = mask.shape
        lx = max(0, min(mw, int((x1-pad_x)/resized_width*mw)))
        rx = max(0, min(mw, int((x2-pad_x)/resized_width*mw)))
        ty = max(0, min(mh, int((y1-pad_y)/resized_height*mh)))
        by = max(0, min(mh, int((y2-pad_y)/resized_height*mh)))
        cropped_mask = np.zeros_like(mask)
        if rx > lx and by > ty:
            cropped_mask[ty:by, lx:rx] = mask[ty:by, lx:rx]
        mask_bytes = np.packbits(cropped_mask).tobytes()
        name, family = MODEL_CLASSES[class_id]
        proposals.append({
            "classId": class_id, "subtype": name, "family": family,
            "confidence": round(score, 6), "box": box,
            "maskShape": [mh, mw], "maskPixelCount": int(cropped_mask.sum()),
            "maskSha256": sha(mask_bytes),
        })

    # Current frozen labels are normalized boxes and were previously reviewed
    # once. They have no pixel masks and no category/color adjudication.
    ground_truth = []
    for region in row["regions"]:
        b = region["box"]
        ground_truth.append({"family": region["family"], "label": region["label"],
                             "box": [b["x"], b["y"], b["x"]+b["width"], b["y"]+b["height"]]})
    proposals.sort(key=lambda p: -p["confidence"])
    used, matches = set(), []
    for proposal in proposals:
        possible = [(iou(proposal["box"], gt["box"]), idx) for idx, gt in enumerate(ground_truth)
                    if idx not in used and gt["family"] == proposal["family"]]
        if possible:
            overlap, idx = max(possible)
            if overlap >= 0.50:
                used.add(idx)
                matches.append({"groundTruthIndex": idx, "iou": round(overlap, 6),
                                "proposalClass": proposal["subtype"],
                                "groundTruthLabel": ground_truth[idx]["label"]})
    return {
        "id": row["id"], "priorSplit": row["split"], "fixtureSha256": sha(image_bytes),
        "fixtureDimensions": [width, height], "groundTruthSourcePhotoSha256": row["sha256"],
        "groundTruthCount": len(ground_truth), "proposals": proposals,
        "truePositives": len(matches), "falsePositives": len(proposals)-len(matches),
        "falseNegatives": len(ground_truth)-len(matches), "matches": matches,
        "latencyMsCpu": round(inference_ms, 3), "groundTruth": ground_truth,
    }


def main():
    annotations = json.loads((ROOT/"research/multi-review-triage-28/frozen-photo-annotations-16.json").read_text())
    pinned_model_path = model_path()
    load_start = time.perf_counter()
    session = ort.InferenceSession(str(pinned_model_path), providers=["CPUExecutionProvider"])
    cold_load_ms = round((time.perf_counter()-load_start)*1000, 3)
    if session.get_providers() != ["CPUExecutionProvider"]:
        raise RuntimeError("Unexpected inference provider")
    rows = [evaluate_photo(session, row, ROOT/"benchmark/fixtures"/(row["id"]+".jpg"))
            for row in annotations if (ROOT/"benchmark/fixtures"/(row["id"]+".jpg")).exists()]
    tp, fp, fn = (sum(x[key] for x in rows) for key in ("truePositives", "falsePositives", "falseNegatives"))
    report = {
        "assignment": "INSTANCE-SEGMENTATION-ACCURACY-56",
        "model": {"id": MODEL_ID, "revision": MODEL_REVISION, "sha256": MODEL_SHA256,
                  "onnxOutputs": {"detections": [1, 300, 38], "maskPrototypes": [1, 32, 104, 104]},
                  "provider": "ONNX Runtime CPU", "inputSize": [416, 416],
                  "confidenceThreshold": 0.50, "NMS": "model end-to-end outputs; no additional NMS"},
        "dataset": {"photoCount": len(rows), "groundTruthInstances": sum(x["groundTruthCount"] for x in rows),
                    "fixtureSource": "existing benchmark/fixtures JPEGs; normalized annotations from frozen-photo-annotations-16.json",
                    "annotationQuality": "historical single-reviewer coarse boxes; not blinded or independent; no pixel masks, no colors; some fixtures are resized derivatives",
                    "splitStatus": "historical split metadata retained; not a locked test set for this candidate",
                    "photos": [{"id": x["id"], "priorSplit": x["priorSplit"], "fixtureSha256": x["fixtureSha256"],
                                "fixtureDimensions": x["fixtureDimensions"], "annotationSourcePhotoSha256": x["groundTruthSourcePhotoSha256"]} for x in rows]},
        "metricDefinition": "Greedy confidence-ordered one-to-one matching by broad family and normalized box IoU >= 0.50. Shoes/accessories remain labeled ground truth; candidate has no corresponding class.",
        "counts": {"tp": tp, "fp": fp, "fn": fn},
        "precision": tp/(tp+fp) if tp+fp else 0,
        "recall": tp/(tp+fn) if tp+fn else 0,
        "f1": 2*tp/(2*tp+fp+fn) if 2*tp+fp+fn else 0,
        "meanMatchedBoxIou": sum(m["iou"] for r in rows for m in r["matches"])/max(1,tp),
        "pixelMaskIou": None, "categoryAccuracy": None, "subtypeAccuracy": None,
        "primaryColorAccuracy": None, "sameClassInstanceSeparation": "not measured; benchmark has no qualifying two-identical-category fixture with per-instance adjudication",
        "timing": {"coldSessionCreateMs": cold_load_ms, "modelDownloadMeasured": False,
                    "warmCpuInferenceMs": [x["latencyMsCpu"] for x in rows]},
        "rows": rows,
        "verdict": "NEEDS REWORK: candidate is an unaudited third-party baseline with known coverage gaps and provenance/licensing metadata conflict; pilot labels are weak; no browser/app integration or independent validation.",
    }
    out = ROOT/"research/instance-segmentation-accuracy-56/pilot-report.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2)+"\n")
    print(json.dumps({"photos": len(rows), "gt": sum(x["groundTruthCount"] for x in rows),
                      "tp": tp, "fp": fp, "fn": fn, "precision": report["precision"],
                      "recall": report["recall"], "f1": report["f1"],
                      "meanMatchedBoxIou": report["meanMatchedBoxIou"],
                      "coldLoadMs": cold_load_ms,
                      "meanWarmCpuInferenceMs": sum(x["latencyMsCpu"] for x in rows)/max(1,len(rows)),
                      "output": str(out.relative_to(ROOT))}, indent=2))


if __name__ == "__main__":
    main()
