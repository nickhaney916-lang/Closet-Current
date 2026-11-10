#!/usr/bin/env python3
"""P787: genuine ONNX clothing-instance MASKS scored against P66 publisher polygons.
Research ONLY: six already exposed photos, licensing unverified, no owner or release.
Frozen before examining publisher masks: conf>=.25, binary mask>=.5, IoU>=.5.
"""
import hashlib
import importlib.util
import json
import math
import pathlib
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageDraw

BASE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("p786_source_probe", BASE / "probe-independent-instance-786.py")
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)

MODEL_SHA = "485bc106721febbd82fe24297e12a9fb49a435a552afff1e6b76308716555f76"
CONF = 0.25
MASK_CUTOFF = 0.5
IOU_CUTOFF = 0.50
# Source publisher categories -> externally claimed DeepFashion2 model classes.
# No equivalence asserted for fashion accessories, jumpsuit, sweater, cardigan.
PUBLISHER_TO_MODEL = {
    0: (0, 1), 1: (0, 1), 4: (2, 3), 5: (4,),
    6: (7,), 7: (6,), 8: (8,), 9: (2, 3),
    10: (9, 10, 11, 12)
}

def source_mask(annotation, width, height):
    """Rasterize every separate published polygon without inventing filled holes."""
    out = Image.new("L", (width, height), 0)
    drawer = ImageDraw.Draw(out)
    components = annotation.get("segmentation")
    if not isinstance(components, list) or not components:
        raise ValueError("publisher polygon components missing")
    for polygon in components:
        if not isinstance(polygon, list) or len(polygon) < 6 or len(polygon) % 2:
            raise ValueError("invalid publisher polygon")
        if not all(isinstance(v, (float, int)) and math.isfinite(v) for v in polygon):
            raise ValueError("publisher polygon nonfinite")
        drawer.polygon(list(zip(polygon[0::2], polygon[1::2])), fill=255)
    return np.asarray(out, dtype=np.uint8) > 0

def project_instance_mask(coeffs, prototype, box, original_width, original_height, side=416):
    """Decode YOLO post-NMS 32 basis coefficients in original JPEG pixels.

    Output0 [1,300,38] means xyxy, confidence, class, 32 mask coefficients.
    Output1 [1,32,104,104] contains the native prototype grid.
    Inverse letterbox uses EXACT P786 round()/center-crop placement.
    """
    if prototype.shape != (32, 104, 104) or np.shape(coeffs) != (32,):
        raise ValueError("unexpected verified model mask tensor layout")
    if original_width < 1 or original_height < 1 or side != 416:
        raise ValueError("invalid original dimensions")
    x1, y1, x2, y2 = (float(a) for a in box)
    if not (0 <= x1 < x2 <= side + 2 and 0 <= y1 < y2 <= side + 2):
        raise ValueError("invalid model xyxy crop")
    if not np.isfinite(coeffs).all() or not np.isfinite(prototype).all():
        raise ValueError("non-finite model mask")
    # Actual ONNX logits, not a rectangle proxy or publisher mask.
    logits = np.tensordot(np.asarray(coeffs, dtype=np.float32),
                          np.asarray(prototype, dtype=np.float32), axes=(0,0))
    prob = 1.0 / (1.0 + np.exp(-np.clip(logits, -40, 40)))
    mask = prob >= MASK_CUTOFF
    yy, xx = np.ogrid[:104, :104]
    mask &= ((xx + 0.5) * (side / 104) >= x1)
    mask &= ((xx + 0.5) * (side / 104) < x2)
    mask &= ((yy + 0.5) * (side / 104) >= y1)
    mask &= ((yy + 0.5) * (side / 104) < y2)
    # Nearest-neighbor reconstruction keeps actual binary prototype geometry.
    full = Image.fromarray(mask.astype(np.uint8) * 255, "L").resize(
        (side, side), Image.Resampling.NEAREST)
    ratio = min(side / original_width, side / original_height)
    nw = max(1, round(original_width * ratio))
    nh = max(1, round(original_height * ratio))
    offx, offy = (side - nw)//2, (side - nh)//2
    if not (0 <= offx and 0 <= offy and offx + nw <= side and offy + nh <= side):
        raise ValueError("letterbox reverse mapping failed")
    native = full.crop((offx, offy, offx + nw, offy + nh)).resize(
        (original_width, original_height), Image.Resampling.NEAREST)
    return np.asarray(native, dtype=np.uint8) > 0

def candidates(raw, prototypes, width, height):
    if raw.shape != (1, 300, 38) or prototypes.shape != (1, 32, 104, 104):
        raise ValueError("pinned model output shape changed")
    if not np.isfinite(raw).all() or not np.isfinite(prototypes).all():
        raise ValueError("pinned model output nonfinite")
    predictions=[]
    for index, rec in enumerate(raw[0]):
        confidence = float(rec[4])
        if not (0 <= confidence <= 1):
            raise ValueError("invalid model confidence")
        if confidence < CONF:
            continue
        category = float(rec[5])
        if not category.is_integer() or not 0 <= category < 13:
            raise ValueError("model class not one of 13")
        mask = project_instance_mask(rec[6:38], prototypes[0], rec[:4], width, height)
        area = int(mask.sum())
        if area < 32:  # Real model mask is degenerate: record as rejected, not a TP.
            continue
        predictions.append({"modelClass":int(category), "confidence":confidence,
           "mask":mask, "sourceArea":area, "modelRowIndex":index})
    return predictions

def mask_iou(a,b):
    if a.shape!=b.shape or a.dtype!=np.bool_ or b.dtype!=np.bool_:
        raise ValueError("mismatched binary geometry")
    union = np.logical_or(a,b).sum()
    return float(np.logical_and(a,b).sum() / union) if union else 0.0

def score(predictions, publisher, width, height):
    supported = [(i,a,source_mask(a,width,height)) for i,a in enumerate(publisher)
                 if a.get("category_id") in PUBLISHER_TO_MODEL and a.get("iscrowd",0)==0]
    unsupported = len(publisher) - len(supported)
    # Frozen, deterministic one-to-one matching. Match only compatible categories.
    edges=[]
    for i,p in enumerate(predictions):
        for j, (_, annotation, mask) in enumerate(supported):
            if p["modelClass"] not in PUBLISHER_TO_MODEL[annotation["category_id"]]:
                continue
            similarity = mask_iou(p["mask"],mask)
            if similarity >= IOU_CUTOFF:
                edges.append((-similarity, -p["confidence"], i, j))
    used_predictions=set(); used_truth=set(); matches=[]
    for neg_iou,neg_conf,i,j in sorted(edges):
        if i in used_predictions or j in used_truth: continue
        used_predictions.add(i);used_truth.add(j)
        original_position,a,_=supported[j]
        matches.append({"modelRowIndex":predictions[i]["modelRowIndex"],
                        "publisherAnnotationId":a.get("id"),
                        "publisherCategoryId":a["category_id"],
                        "modelClass":predictions[i]["modelClass"],
                        "confidence":round(-neg_conf,6),
                        "maskIoU":round(-neg_iou,6)})
    n=len(predictions);m=len(supported);tp=len(matches)
    return {"publisherSupportedInstances":m,"publisherUnsupportedExcluded":unsupported,
            "decodedModelCandidates":n,"truePositives":tp,
            "falsePositives":n-tp,"falseNegatives":m-tp,
            "precision":round(tp/n,6) if n else 0.,
            "recall":round(tp/m,6) if m else 0.,
            "matches":matches,
            "missedPublisherAnnotationIds":[a.get("id") for j,(_,a,_) in enumerate(supported)
                                            if j not in used_truth],
            "unmatchedModelRows":[p["modelRowIndex"] for i,p in enumerate(predictions)
                                  if i not in used_predictions]}

def main():
    manifest=json.loads(probe.REGISTRY.read_text())
    model,digest=probe.download()
    if digest != MODEL_SHA:
        model.unlink(missing_ok=True)
        raise ValueError("unexpected pinned external model SHA")
    rows=[]
    try:
        session=ort.InferenceSession(str(model),providers=["CPUExecutionProvider"])
        assert [list(x.shape) for x in session.get_outputs()] == [[1,300,38],[1,32,104,104]]
        inp=session.get_inputs()[0]
        assert list(inp.shape)==[1,3,416,416]
        for row in manifest["rows"]:
            file=probe.OLD/row["file_name"]
            actual=hashlib.sha256(file.read_bytes()).hexdigest()
            if actual!=row["sha256"]:
                raise ValueError("publisher original JPEG SHA mismatched")
            pixels,(width,height)=probe.prepare(file,416)
            if (width,height)!=(row["width"],row["height"]):
                raise ValueError("original decoded dimensions changed")
            outs=session.run(None,{inp.name:pixels})
            preds=candidates(np.asarray(outs[0]),np.asarray(outs[1]),width,height)
            scores=score(preds,row["annotations"],width,height)
            rows.append({"originalImageId":row["id"],"sourceSHA256":actual,
               "originalSize":[width,height],"modelInputSHA256":digest,
               "publisherPolygonSource":"existing Fashionpedia human polygon source, NOT blind two-human truth",
               **scores})
            print("P787_ACTUAL_PUBLISHER_GEOMETRY",row["id"],
                  "pred",len(preds),"TP",scores["truePositives"],
                  "FP",scores["falsePositives"],"FN",scores["falseNegatives"])
        if len(rows)!=6 or len({r["sourceSHA256"] for r in rows})!=6:
            raise ValueError("incomplete frozen six-original development cohort")
        total={k:sum(r[k] for r in rows) for k in ("publisherSupportedInstances",
               "publisherUnsupportedExcluded","decodedModelCandidates",
               "truePositives","falsePositives","falseNegatives")}
        tp=total["truePositives"]; fp=total["falsePositives"]; fn=total["falseNegatives"]
        total.update({"precision":round(tp/(tp+fp),6) if tp+fp else 0.,
                      "recall":round(tp/(tp+fn),6) if tp+fn else 0.,
                      "f1":round(2*tp/(2*tp+fp+fn),6) if 2*tp+fp+fn else 0.})
        report={"schema":"m1-p787-actual-onnx-original-mask-polygon-evaluation/v1",
            "model":"HasanKabir23/Yolov26s-DeepFashion2",
            "pinnedModelWeightSHA256":digest,"sourceCohort":"six PREVIOUSLY EXPOSED development photos",
            "thresholdsPinnedBeforeScoring":{"confidence":CONF,"maskProbability":MASK_CUTOFF,
                                             "maskIoU":IOU_CUTOFF},
            "pixelMaskIsRealOnnxPrototype":True,"modelAutomaticallyPromoted":False,
            "commercialModelRightsIndependentlyCleared":False,
            "independentBlindedHumanTruthAvailable":False,
            "newHeldoutPhotos":0,"independentSourceModelOverlapExcluded":False,
            "nativeAppChanged":False,"photoOrModelBytesInArtifacts":False,
            "releaseAuthorized":False,"familyAlpha":"HOLD",
            "summary":total,"rows":rows}
        probe.OUT.mkdir(parents=True,exist_ok=True)
        (probe.OUT/"p787-scored-real-publisher-polygons.json").write_text(
            json.dumps(report,indent=2)+"\n")
        print("M1_P787_REAL_ONNX_MASKS_SCORE_RESEARCH_ONLY_NO_MODEL_PROMOTION")
        print("M1_P787_TOTALS",json.dumps(total))
    finally:
        model.unlink(missing_ok=True)

if __name__=="__main__":
    main()
