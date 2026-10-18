#!/usr/bin/env python3
"""Real model-backed LIP garment previews using ONLY source pixels.

Research-only. This is a 20-class human parser, not instance segmentation.
Independent ground truth and mobile performance are unavailable.
"""
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import sys
import time

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path("benchmark").resolve()))
from lip_garment_instance_candidates import candidate_class_regions, GARMENT_CLASSES
from lip_boundary_review import lip_boundary_review

# Reuse exactly the pinned MIT ONNX model, checksum-verifying loader and
# preprocessing used in the established two-real-photo LIP benchmark.
spec = importlib.util.spec_from_file_location(
    "lip_socks_baseline", Path("scripts/run-lip-socks-baseline.py"))
lip = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lip)

DEST = Path(sys.argv[1] if len(sys.argv)>1 else "benchmark/lip-garment-instance-review")
LOCKED = json.loads(Path("benchmark/locked-photo-sources.json").read_text())
VISIBLE = json.loads(Path("benchmark/manifest-visible-legwear-2.json").read_text())
FRESH = json.loads(Path("benchmark/manifest-fresh-11.json").read_text())
SOURCES = {r["id"]:r for r in LOCKED+VISIBLE+FRESH}
IDS = ["validation-0031", "commons-0059", "validation-0030", "validation-0017"]


def source_photo(row):
    if row.get("verified") is not True or row["id"] not in IDS:
        raise ValueError("Source lacks explicit licensed verification")
    raw=(Path("benchmark/photos") / row["image"]).read_bytes()
    if hashlib.sha256(raw).hexdigest()!=row["sha256"]:
        raise ValueError("Original source image checksum mismatch")
    photo=Image.open(io.BytesIO(raw))
    photo.load()
    return photo.convert("RGB")


def model_scores(session, photo):
    """Reuse the pinned model's exact RGB normalization and input size."""
    n=lip.REF["inputSize"]
    rgb=np.asarray(photo.resize((n,n),Image.Resampling.BILINEAR),
                   dtype=np.float32)/255.0
    mean=np.array(lip.REF["means"],dtype=np.float32)
    std=np.array(lip.REF["stds"],dtype=np.float32)
    inp=np.transpose((rgb-mean)/std,(2,0,1))[None].copy()
    start=time.perf_counter()
    result=session.run(None,{session.get_inputs()[0].name:inp})
    names=[o.name for o in session.get_outputs()]
    index=names.index("logits") if "logits" in names else 0
    logits=result[index]
    if logits.ndim!=4 or logits.shape[0]!=1 or logits.shape[1]!=20:
        raise RuntimeError("Unexpected LIP model logit shape")
    raw=logits[0]
    return np.argmax(raw,axis=0).astype(np.uint8),raw,round((time.perf_counter()-start)*1000)


def ambiguous_preview(photo, strict, uncertain, scale=380):
    """Mark *model-only* competing garment pixels magenta on original RGB."""
    w=scale
    h=max(1,round(photo.height*w/photo.width))
    base=photo.resize((w,h),Image.Resampling.LANCZOS)
    candidate=Image.fromarray((uncertain.astype(np.uint8)*255),"L").resize(
        (w,h),Image.Resampling.NEAREST)
    magenta=Image.new("RGB",(w,h),(219,38,160))
    marked=Image.blend(base,magenta,.65)
    return Image.composite(marked,base,candidate)


def preview(photo, mask, scale=380):
    # A mask is a human-parsing model prediction, not independent annotation.
    native=Image.fromarray((mask.astype(np.uint8)*255),"L").resize(
        photo.size,Image.Resampling.NEAREST)
    rgba=photo.copy().convert("RGBA")
    rgba.putalpha(native)
    background=Image.new("RGBA",photo.size,(241,240,243,255))
    background.alpha_composite(rgba)
    w=scale;h=max(1,round(photo.height*w/photo.width))
    return background.convert("RGB").resize((w,h),Image.Resampling.LANCZOS)


def main():
    if lip.REF["modelLicense"]!="MIT" or not lip.REF["researchOnly"]:
        raise ValueError("Pinned license or model purpose changed")
    DEST.mkdir(parents=True,exist_ok=True)
    report={"status":"running","model":lip.REF["modelRepo"],
       "modelSha256":lip.REF["modelSha256"],"sourceHashesVerified":False,
       "independentGarmentInstanceMasks":False,"humanReferenceMasksAvailable":False,
       "automaticItemsCreated":0,"realDeviceLatencyTested":False,
       "productionAuthorized":False,"sourcePhotosPreserved":True,
       "perClassSourceRgbOnly":True,"cases":[]}
    def save(): (DEST/"summary.json").write_text(json.dumps(report,indent=2))
    save()
    photos=[(SOURCES[i],source_photo(SOURCES[i])) for i in IDS]
    model_path=lip.load_model()
    opts=ort.SessionOptions();opts.intra_op_num_threads=4
    start=time.perf_counter()
    session=ort.InferenceSession(str(model_path),sess_options=opts,
        providers=["CPUExecutionProvider"])
    report["modelLoadMs"]=round(1000*(time.perf_counter()-start))
    model_path.unlink(missing_ok=True)
    for row,photo in photos:
        labels,raw_logits,ms=model_scores(session,photo)
        details=candidate_class_regions(labels)
        boundary=lip_boundary_review(labels,raw_logits)
        groups=details.pop("classCandidates")
        source=preview(photo,np.ones_like(labels,dtype=bool))
        names=list(GARMENT_CLASSES)
        by={c["role"]:c for c in groups}
        panes=[source]
        for name in names:
            region=by.get(name)
            pane=preview(photo,region["mask"] if region else
                np.zeros_like(labels,dtype=bool))
            panes.append(pane)
        width=380;height=panes[0].height
        rows=(len(panes)+2)//3
        canvas=Image.new("RGB",(width*3,(height+64)*rows),"white")
        drawer=ImageDraw.Draw(canvas)
        for i,pane in enumerate(panes):
            x=(i%3)*width;y=(i//3)*(height+64)
            canvas.paste(pane,(x,y+64))
            name="Original source" if i==0 else names[i-1]+" model pixels"
            drawer.text((x+12,y+12),name,fill="black")
            drawer.text((x+12,y+36),"Unverified source-RGB mask review",fill="black")
        canvas.save(DEST/(row["id"]+"-separate-classes.png"))
        # A separate diagnostic compares the strict skirt with a near-edge
        # runner-up proposal. Magenta means uncertain/model conflict,
        # NEVER a verified skirt pixel or approved alpha.
        comparison=Image.new("RGB",(width*3,height+66),"white")
        s=boundary["masks"]["skirt"]
        panels=[source,preview(photo,s["strict"]),
                ambiguous_preview(photo,s["strict"],s["ambiguous"])]
        context=ImageDraw.Draw(comparison)
        for index,pane in enumerate(panels):
            x=index*width
            comparison.paste(pane,(x,66))
            context.text((x+12,10),
              ["Original source","Strict model skirt","Magenta: contested edge pixels"][index],
              fill="black")
        context.text((12,39),
          "Unverified class alternatives only; not a recovered garment mask",fill="black")
        comparison.save(DEST/(row["id"]+"-skirt-boundary-review.png"))
        for region in groups:
            mask=region.pop("mask")
            Image.fromarray(mask.astype(np.uint8)*255,"L").save(
                DEST/(row["id"]+"-"+region["role"]+"-unverified-mask.png"))
        case={"id":row["id"],"sourceSha256":row["sha256"],
          "originalAttribution":row["attribution"]["source"],
          "license":row["attribution"]["license"],
          "imageDimensions":[photo.width,photo.height],
          "maskDimensions":[int(labels.shape[1]),int(labels.shape[0])],
          "exportedRoles":names,
          "modelLabelPixelCounts":{str(i):int((labels==i).sum()) for i in range(20)},
          "cpuInferenceMs":ms,
          **details,"classCandidates":groups,
          "skirtBoundaryReview":{
            "classes":boundary["classes"],
            "pixelsClaimedByMultipleReviewVariants":
                boundary["pixelsClaimedByMultipleReviewVariants"],
            "maximumLogitGap":boundary["maximumLogitGap"],
            "verifiedRecoveredFabricPixels":0,
            "independentGarmentAccuracyMeasured":False,
            "productionAuthorized":False,
          },
          "sourceRgbPreserved":True,
          "automaticItemsCreated":0,"independentMaskAccuracyVerified":False}
        report["cases"].append(case);save()
        print("LIP_GARMENT_INSTANCE_CASE "+json.dumps({
          "id":row["id"],"cpuInferenceMs":ms,
          "possibleCoatSkirtDistinctClassEvidence":
            case["possibleSeparateCoatSkirtClassEvidence"],
          "roles":[{"name":x["role"],"pixels":x["pixels"],
                    "substantial":x["substantialModelRegion"]} for x in groups],
          "automaticItemsCreated":0,
          "skirtPotentiallyMissingPixels":next((
            r["additionalUncertainModelPixels"] for r in
            boundary["classes"] if r["role"]=="skirt"),0),
          "skirtPixelsVerifiedRecovered":0
        }),flush=True)
    report["status"]="complete";report["sourceHashesVerified"]=True;save()

if __name__=="__main__":main()
