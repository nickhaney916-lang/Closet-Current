"""M1 P804: REAL pinned SAM2 ONNX inference from native original-image browser
P800 gesture coordinates on an authentic licensed public source photo.

NO publisher polygon generated this prompt. NO independent human clicked:
Playwright's actual native mouse gesture draws the box and point. This is
scientifically distinct from P799 *publisher-ORACLE* boxes, but not a
blind-human accuracy test. NEVER upload private JPEGs or persist owner masks.

This script takes ONLY the P782 original public commons-0053 JPEG fixture.
"""
from __future__ import annotations
import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

REPO_ROOT=Path(__file__).resolve().parents[1]
INPUT=REPO_ROOT/"benchmark/mission1-real-model-native-closet-782/browser-results.json"
OUTPUT=REPO_ROOT/"benchmark/mission1-native-gesture-real-sam2-804"
ORIGINAL=REPO_ROOT/"benchmark/fixtures/commons-0053.jpg"
SOURCE_ID="commons-0053"
SCHEMA="closet-current-m1-original-native-gesture-sam2-research-804/v1"
EVIDENCE_SCHEMA="m1-p804-original-native-gesture-pinned-real-sam2-no-human-truth/v1"
CAP_JPEG=10*1024*1024

def fail(reason):
    raise ValueError("M1_P804_REAL_SAM2 "+reason)

def pinned_source():
    if not ORIGINAL.is_file() or ORIGINAL.stat().st_size>CAP_JPEG:
        fail("approved public original JPEG missing or too large")
    expected=next((row for row in json.loads((REPO_ROOT/"benchmark/locked-photo-sources.json").read_text())
                   if row.get("id")==SOURCE_ID),None)
    if not expected or expected.get("verified") is not True or expected.get("attribution",{}).get("license")!="CC BY 4.0":
        fail("immutable source register or legal-use attribution absent")
    digest=hashlib.sha256(ORIGINAL.read_bytes()).hexdigest()
    if expected["sha256"]!=digest:
        fail("public original JPEG bytes changed")
    with Image.open(ORIGINAL) as file:
        photo=file.convert("RGB")
    if min(photo.size)<8 or max(photo.size)>3072:
        fail("original source dimensions outside proven model budget")
    return photo,digest,expected["attribution"]

def read_actual_native_prompts(source_sha,source_size):
    payload=json.loads(INPUT.read_text())
    if payload.get("researchOnly") is not True or payload.get("familyAlpha")!="HOLD" or payload.get("releaseAuthorized") is not False:
        fail("source browser receipt is not hold-gated research")
    scenarios=payload.get("scenarios")
    if not isinstance(scenarios,list) or len(scenarios)!=2 or {row.get("browser") for row in scenarios}!={"chromium","webkit"}:
        fail("native browser source gestures must come from BOTH engines")
    checked=[]
    for row in scenarios:
        prompt=row.get("sourcePromptForActualSAM2804")
        if not isinstance(prompt,dict) or prompt.get("schema")!=SCHEMA or prompt.get("sourceId")!=SOURCE_ID or prompt.get("sourceSHA256")!=source_sha:
            fail("native source gesture is not bound to the public original SHA")
        for name,required in (
            ("actualOriginalGestureInNativeAdjust",True),
            ("automatedPlaywrightFixture",True),
            ("publisherPolygonNotUsedToConstructPrompt",True),
            ("independentHumanDrawnBox",False),
            ("ownerApprovedMask",False),
            ("privateOwnerPhoto",False),
            ("autoSaveAllowed",False),
        ):
            if prompt.get(name) is not required:
                fail("native source gesture requires honest "+name)
        if (prompt.get("originalWidth"),prompt.get("originalHeight"))!=source_size:
            fail("native source dimensions mismatch")
        box=prompt.get("originalPixelBox")
        pt=prompt.get("originalPixelPositivePoint")
        if not isinstance(box,list) or len(box)!=4 or not all(type(x) is int for x in box):
            fail("actual native source rectangle requires four integer pixels")
        if not isinstance(pt,list) or len(pt)!=2 or not all(type(x) is int for x in pt):
            fail("native garment seed point requires two integer pixels")
        x0,y0,x1,y1=box
        x,y=pt
        w,h=source_size
        if not(0<=x0<x1<=w and 0<=y0<y1<=h and
               x1-x0>=max(2,w//50) and y1-y0>=max(2,h//50) and
               x0<=x<x1 and y0<=y<y1):
            fail("source rectangle/point outside original dimensions or too small")
        if row.get("actualOriginalSourceOwnerBox800BrowserDrawn") is not True or row.get("actualOriginalSourceOwnerPoint798ReviewedInNativeAdjust") is not True:
            fail("native source gesture proof flags missing")
        if row.get("actualHumanGroundTruthIndependentlyVerified") is not False:
            fail("automated browser actor is not independent human truth")
        checked.append({"browser":row["browser"],"box":box,"point":pt})
    return checked

def load_research_model():
    # Reuse exactly the already-verified P799 input normalization, model hashes,
    # SAM2 box codes (2,3), and point+box codes (1,2,3).
    path=REPO_ROOT/"scripts/test-mission1-sam2-box-prompt-799.py"
    spec=importlib.util.spec_from_file_location("p799_research",str(path))
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    opts=ort.SessionOptions()
    opts.intra_op_num_threads=2
    opts.inter_op_num_threads=1
    opts.graph_optimization_level=ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    opts.enable_mem_pattern=False
    opts.enable_cpu_mem_arena=False
    encoder=ort.InferenceSession(str(module.download_pinned("encoder.onnx")),opts,providers=["CPUExecutionProvider"])
    decoder=ort.InferenceSession(str(module.download_pinned("decoder.onnx")),opts,providers=["CPUExecutionProvider"])
    if [t.name for t in encoder.get_inputs()]!=["image"]:
        fail("pinned SAM2 encoder contract changed")
    if {t.name for t in decoder.get_inputs()}!={"image_embed","high_res_0","high_res_1","point_coords","point_labels"}:
        fail("pinned SAM2 decoder contract changed")
    return module,encoder,decoder

def model_outputs(decoded,source_w,source_h):
    # The caller passes normalized (output-name, tensor) tuples, not ORT
    # NodeArg objects. Preserve the real immutable decoder output contract.
    keys={name:tensor for name,tensor in decoded}
    if set(keys)!={"mask_logits","iou"} or keys["mask_logits"].shape!=(1,4,256,256) or keys["iou"].shape!=(1,4):
        fail("real SAM2 original box decoder shapes changed")
    scores=keys["iou"][0]
    masks=keys["mask_logits"][0]
    if not np.isfinite(scores).all() or not np.isfinite(masks).all():
        fail("nonfinite SAM2 original-source mask logits")
    # Only model-predicted quality chooses a mask; there is NO ground-truth
    # polygon for this native browser source prompt.
    selected=1+int(np.argmax(scores[1:]))
    resized=np.asarray(Image.fromarray(masks[selected],mode="F").resize(
        (source_w,source_h),resample=Image.Resampling.BILINEAR),dtype=np.float32)>0
    return selected,resized,scores

def execute():
    photo,sha,attrib=pinned_source()
    prompts=read_actual_native_prompts(sha,photo.size)
    mod,enc,dec=load_research_model()
    raw=enc.run(None,{"image":mod.preprocess(photo)})
    names=[z.name for z in enc.get_outputs()]
    if set(names)!={"image_embed","high_res_0","high_res_1"} or len(raw)!=3:
        fail("real SAM2 source feature contract changed")
    features=dict(zip(names,raw))
    if (features["image_embed"].shape!=(1,256,64,64) or
        features["high_res_0"].shape!=(1,32,256,256) or
        features["high_res_1"].shape!=(1,64,128,128)):
        fail("real SAM2 source encoder shape changed")
    OUTPUT.mkdir(parents=True,exist_ok=True)
    receipts=[]
    for gesture in prompts:
        for arm in ("box","pointBox"):
            pointcoords,labels=mod.sam2_source_prompt799(
                arm,gesture["point"],gesture["box"],photo.width,photo.height)
            outputs=dec.run(None,{**features,"point_coords":pointcoords,"point_labels":labels})
            idx,mask,scores=model_outputs(zip([x.name for x in dec.get_outputs()],outputs),photo.width,photo.height)
            # Binary PNG is a model prediction on the public fixture, NEVER
            # a private user cutout, human-reviewed or approved saved image.
            mask_name=f'mask-{gesture["browser"]}-{arm}-UNVERIFIED.png'
            Image.fromarray(np.where(mask,255,0).astype(np.uint8),mode="L").save(OUTPUT/mask_name)
            result={
                "browser":gesture["browser"],"promptArm":arm,
                "actualOriginalSourcePixelBox":gesture["box"],
                "actualOriginalSourcePixelPositivePoint":gesture["point"],
                "sam2PromptCodes":labels[0].tolist(),
                "actualPinnedONNXEncoderExecuted":True,
                "actualPinnedONNXDecoderExecuted":True,
                "modelSelectedMultimaskIndex":idx,
                "modelPredictedIoU_NotTruth":round(float(scores[idx]),6),
                "originalPixelPredictedMaskCount":int(mask.sum()),
                "originalPixelMaskFraction":round(float(mask.mean()),6),
                "maskFile":mask_name,
                "independentHumanMaskIoU":None,
                "oraclePolygonDerivedPrompt":False,
                "simulatedGestureFromNativeBrowser":True,
                "independentRealHumanGesture":False,
                "ownerMaskApproved":False,
                "categoryVerified":False,"subtypeVerified":False,"colorVerified":False,
                "privateSavedCutout":False,"autoSaveAllowed":False
            }
            receipts.append(result)
            print("M1_P804_REAL_SAM2_NATIVE_BROWSER_BOX_MODEL_MASK",json.dumps(result,sort_keys=True),flush=True)
    if len(receipts)!=4 or set((x["browser"],x["promptArm"]) for x in receipts)!={
        ("chromium","box"),("chromium","pointBox"),("webkit","box"),("webkit","pointBox")}:
        fail("all native P804 browser gestures and SAM2 prompt arms must be evaluated")
    evidence={
        "schema":EVIDENCE_SCHEMA,"familyAlpha":"HOLD","releaseAuthorized":False,
        "realOriginalJPEGSourceId":SOURCE_ID,"sourceSHA256":sha,
        "actualSourcePixelDimensions":[photo.width,photo.height],
        "sourceLicense":attrib["license"],"sourceAttribution":attrib["source"],
        "realModel":"cstr/sam2.1-hiera-tiny-ONNX@8cef213",
        "pinnedEncoderSHA256":mod.MODEL_FILES["encoder.onnx"],
        "pinnedDecoderSHA256":mod.MODEL_FILES["decoder.onnx"],
        "originalSourcePhotoDecodedOnce":True,
        "actualRealNativeBrowserGesturePrompts":2,
        "actualIndependentHumanGesturePrompts":0,
        "developerExposedSourceNotHeldOut":True,
        "publisherMaskTruthWasUsedForPrompts":False,
        "actualPublisherMaskTruthAvailableForThisPhoto":False,
        "modelRunInHostedLinuxRunnerNotPhysicalPhone":True,
        "actualPhysicalPhoneTests":0,"independentBlindHumanMaskReviewers":0,
        "ownerMaskApproved":False,"privateCutoutSaved":False,
        "automaticGarmentDetectionProven":False,
        "realCategorySubtypeColorAccuracyProven":False,
        "modelPredictedIoUIsNotGroundTruth":True,
        "measuredLinuxProcessMemoryAfterInferenceMiB":mod.linux_process_memory_mib(),
        "arms":receipts
    }
    (OUTPUT/"real-native-browser-box-sam2-results.json").write_text(json.dumps(evidence,indent=2)+"\n")
    (OUTPUT/"SOURCE-ATTRIBUTION.txt").write_text(
       "Public research source: "+attrib["title"]+"\nOriginal attribution: "+attrib["source"]+
       "\nLicense: "+attrib["license"]+" "+attrib["licenseUrl"]+
       "\nResearch-only generated model masks are UNVERIFIED and must not be used as approved garments.\n")
    print("M1_P804_REAL_SAM2_NATIVE_CHROMIUM_WEBKIT_GESTURES_ON_ORIGINAL_PUBLIC_JPEG",
          json.dumps({"actualRealDecoderArms":len(receipts),"independentHumanReviews":0,
                      "sourceSHA256":sha,"familyAlpha":"HOLD","releaseAuthorized":False,
                      "linuxMemory":evidence["measuredLinuxProcessMemoryAfterInferenceMiB"]},sort_keys=True),flush=True)

if __name__=="__main__":execute()
