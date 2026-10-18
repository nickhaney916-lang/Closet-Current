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
from lip_garment_instance_candidates import candidate_class_regions

# Reuse exactly the pinned MIT ONNX model, checksum-verifying loader and
# preprocessing used in the established two-real-photo LIP benchmark.
spec = importlib.util.spec_from_file_location(
    "lip_socks_baseline", Path("scripts/run-lip-socks-baseline.py"))
lip = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lip)

DEST = Path(sys.argv[1] if len(sys.argv)>1 else "benchmark/lip-garment-instance-review")
LOCKED = json.loads(Path("benchmark/locked-photo-sources.json").read_text())
VISIBLE = json.loads(Path("benchmark/manifest-visible-legwear-2.json").read_text())
SOURCES = {r["id"]:r for r in LOCKED+VISIBLE}
IDS = ["validation-0031", "commons-0059"]


def source_photo(row):
    if row.get("verified") is not True or row["id"] not in IDS:
        raise ValueError("Source lacks explicit licensed verification")
    raw=(Path("benchmark/photos") / row["image"]).read_bytes()
    if hashlib.sha256(raw).hexdigest()!=row["sha256"]:
        raise ValueError("Original source image checksum mismatch")
    photo=Image.open(io.BytesIO(raw))
    photo.load()
    return photo.convert("RGB")


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
        labels,ms=lip.inference(session,photo)
        details=candidate_class_regions(labels)
        groups=details.pop("classCandidates")
        source=preview(photo,np.ones_like(labels,dtype=bool))
        names=["coat","upper","skirt","dress","shoe_pair"]
        by={c["role"]:c for c in groups}
        panes=[source]
        for name in names:
            region=by.get(name)
            pane=preview(photo,region["mask"] if region else
                np.zeros_like(labels,dtype=bool))
            panes.append(pane)
        width=380;height=panes[0].height
        canvas=Image.new("RGB",(width*3,(height+64)*2),"white")
        drawer=ImageDraw.Draw(canvas)
        for i,pane in enumerate(panes):
            x=(i%3)*width;y=(i//3)*(height+64)
            canvas.paste(pane,(x,y+64))
            name="Original source" if i==0 else names[i-1]+" model pixels"
            drawer.text((x+12,y+12),name,fill="black")
            drawer.text((x+12,y+36),"Unverified source-RGB mask review",fill="black")
        canvas.save(DEST/(row["id"]+"-separate-classes.png"))
        for region in groups:
            mask=region.pop("mask")
            Image.fromarray(mask.astype(np.uint8)*255,"L").save(
                DEST/(row["id"]+"-"+region["role"]+"-unverified-mask.png"))
        case={"id":row["id"],"sourceSha256":row["sha256"],
          "originalAttribution":row["attribution"]["source"],
          "license":row["attribution"]["license"],
          "imageDimensions":[photo.width,photo.height],
          "maskDimensions":[int(labels.shape[1]),int(labels.shape[0])],
          "cpuInferenceMs":ms,
          **details,"classCandidates":groups,"sourceRgbPreserved":True,
          "automaticItemsCreated":0,"independentMaskAccuracyVerified":False}
        report["cases"].append(case);save()
        print("LIP_GARMENT_INSTANCE_CASE "+json.dumps({
          "id":row["id"],"cpuInferenceMs":ms,
          "possibleCoatSkirtDistinctClassEvidence":
            case["possibleSeparateCoatSkirtClassEvidence"],
          "roles":[{"name":x["role"],"pixels":x["pixels"],
                    "substantial":x["substantialModelRegion"]} for x in groups],
          "automaticItemsCreated":0
        }),flush=True)
    report["status"]="complete";report["sourceHashesVerified"]=True;save()

if __name__=="__main__":main()
