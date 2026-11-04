#!/usr/bin/env python3
"""Research-only, source-verified SCHP/LIP sock-shoe benchmark. Never deploy.

A pinned 68.3 MB MIT-licensed ONNX model is used only in GitHub Actions.
See benchmark/schp-lip-20-reference.json for SHA-256, labels and preprocessing.
"""
import hashlib
import io
import json
import os
from pathlib import Path
import sys
import time
import urllib.request

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageDraw

from lip_mask_evidence import analyze_lip_labels

ROOT = Path("benchmark")
DEST = Path(sys.argv[1] if len(sys.argv) > 1 else "benchmark/lip-socks-baseline")
REF = json.loads((ROOT / "schp-lip-20-reference.json").read_text())
SOURCES = json.loads((ROOT / "manifest-visible-legwear-2.json").read_text())
EXPECTED_IDS = {"validation-0030", "validation-0031"}


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def load_model():
    cache = DEST / "schp-lip-20-int8-static.onnx"
    # Model cache resides only in GitHub runner; do not include it in artifact.
    if cache.exists():
        if sha256(cache.read_bytes()) == REF["modelSha256"]:
            return cache
        cache.unlink()
    url = REF["modelUrl"]
    if not url.startswith("https://huggingface.co/pirocheto/schp-lip-20/resolve/"):
        raise RuntimeError("Model source not allowlisted")
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "ClosetCurrentResearch/1.0",
            })
            tmp = cache.with_suffix(".partial")
            digest = hashlib.sha256()
            written = 0
            with urllib.request.urlopen(req, timeout=90) as response, tmp.open("wb") as stream:
                if not response.url.startswith("https://"):
                    raise RuntimeError("Unsecured model redirect")
                while True:
                    part = response.read(1 << 20)
                    if not part:
                        break
                    digest.update(part)
                    written += len(part)
                    if written > 80_000_000:
                        raise RuntimeError("Overlarge model download")
                    stream.write(part)
            if digest.hexdigest() != REF["modelSha256"]:
                raise RuntimeError("Model SHA-256 did not match pinned release")
            tmp.replace(cache)
            return cache
        except Exception:
            if attempt == 1:
                raise
            time.sleep(2)
    raise RuntimeError("Model unavailable")


def source_photo(row):
    if row["id"] not in EXPECTED_IDS or row.get("verified") is not True:
        raise RuntimeError("Unverified image source")
    data = (ROOT / "photos" / row["image"]).read_bytes()
    if sha256(data) != row["sha256"]:
        raise RuntimeError("Image hash mismatch")
    image = Image.open(io.BytesIO(data))
    image.load()
    return image.convert("RGB")


def overlay(image, labels):
    # Diagnostic overlay only. It never supplies a cutout to the app.
    hues = {8: (38, 151, 215), 18: (246, 149, 54),
            19: (246, 149, 54), 7: (143, 91, 206),
            5: (58, 187, 130), 16: (210, 205, 186),
            17: (210, 205, 186)}
    resized = Image.fromarray(labels.astype(np.uint8), "L").resize(
        image.size, Image.Resampling.NEAREST)
    indexed = np.array(resized)
    rgb = np.asarray(image, dtype=np.uint8)
    visualization = rgb.copy()
    for cls, color in hues.items():
        mask = indexed == cls
        visualization[mask] = (0.4 * rgb[mask] + 0.6 *
                               np.array(color)).astype(np.uint8)
    return Image.fromarray(visualization, "RGB")


def inference(session, image):
    n = REF["inputSize"]
    rgb = np.asarray(image.resize((n, n), Image.Resampling.BILINEAR),
                     dtype=np.float32) / 255.0
    mean = np.array(REF["means"], dtype=np.float32)
    std = np.array(REF["stds"], dtype=np.float32)
    tensor = np.transpose((rgb - mean) / std, (2, 0, 1))[None].copy()
    input_meta = session.get_inputs()[0]
    start = time.perf_counter()
    outputs = session.run(None, {input_meta.name: tensor})
    elapsed = round((time.perf_counter() - start) * 1000)
    names = [o.name for o in session.get_outputs()]
    idx = names.index("logits") if "logits" in names else 0
    logits = outputs[idx]
    if logits.ndim != 4 or logits.shape[0] != 1 or logits.shape[1] != 20:
        raise RuntimeError(f"Expected 20 LIP classes, got {logits.shape}")
    return np.argmax(logits[0], axis=0).astype(np.uint8), elapsed


def main():
    if len(SOURCES) != 2 or {x["id"] for x in SOURCES} != EXPECTED_IDS:
        raise RuntimeError("Two source-verified cases required")
    if REF["labels"][8] != "Socks" or REF["labels"][18] != "Left-shoe" or \
            REF["labels"][19] != "Right-shoe" or REF["researchOnly"] is not True:
        raise RuntimeError("Unknown model label meanings")

    DEST.mkdir(parents=True, exist_ok=True)
    report = dict(status="running", model=REF["modelRepo"], modelSha256=REF["modelSha256"],
                  sourceImagesHashVerified=False, maskGroundTruthAvailable=False,
                  trueSockRecognitionAccuracy=None, modelHasTightsLabel=False,
                  productionAuthorized=False, realDevicePerformanceMeasured=False,
                  wardrobeEntriesAdded=0, originalPhotoProtected=True, cases=[])
    result_path = DEST / "summary.json"

    def save():
        result_path.write_text(json.dumps(report, indent=2))

    save()
    photos = [(s, source_photo(s)) for s in SOURCES]
    model_path = load_model()
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = 4
    start = time.perf_counter()
    session = ort.InferenceSession(str(model_path), sess_options=opts,
                                   providers=["CPUExecutionProvider"])
    report["modelLoadMs"] = round((time.perf_counter() - start) * 1000)
    # Never bundle the large model with user-facing comparison artifacts.
    model_path.unlink(missing_ok=True)
    for row, photo in photos:
        mask, elapsed = inference(session, photo)
        detail = analyze_lip_labels(mask)
        w = 460
        h = max(1, round(photo.height * w / photo.width))
        left = photo.resize((w, h), Image.Resampling.LANCZOS)
        right = overlay(photo, mask).resize((w, h), Image.Resampling.LANCZOS)
        canvas = Image.new("RGB", (w * 2, h + 70), "white")
        canvas.paste(left, (0, 70))
        canvas.paste(right, (w, 70))
        draw = ImageDraw.Draw(canvas)
        draw.text((10, 10), "Verified original", fill="black")
        draw.text((w + 10, 10), "LIP model class overlay", fill="black")
        draw.text((10, 35), "Research only: not verified garment boundaries", fill="black")
        canvas.save(DEST / f"{row['id']}-model-overlay.png")
        rec = dict(id=row["id"], sourceSha256=row["sha256"],
                   source=row["attribution"]["source"],
                   license=row["attribution"]["license"],
                   width=photo.width, height=photo.height,
                   maskResolution=[int(mask.shape[1]), int(mask.shape[0])],
                   expectedVisibleGarmentsForReview=row["expectedVisibleGarments"],
                   evaluation=detail, cpuInferenceMs=elapsed,
                   humanAnnotationAvailable=False,
                   correctlyIdentifiedSocksUnverified=True,
                   wearerTypeUnverified=True,
                   automaticInventoryUpdates=0)
        report["cases"].append(rec)
        save()
        print("LIP_VISIBLE_RESULT " + json.dumps({
            "id": rec["id"], "sockPixels": detail["sockPixels"],
            "shoePixels": detail["shoePixels"],
            "sockAndShoeLabelsPresent": detail["sockAndShoeLabelsPresent"],
            "cpuInferenceMs": elapsed,
            "automaticInventoryUpdates": 0,
        }), flush=True)

    report["sourceImagesHashVerified"] = True
    report["status"] = "complete"
    save()


if __name__ == "__main__":
    main()
