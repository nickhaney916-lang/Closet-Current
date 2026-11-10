"""P799 actual source-original SAM2 ONNX: publisher-ORACLE point vs box vs point+box.

Ten pre-registered P792 originals, ALL 23 published human polygon instances.
Bounding rectangles are mathematically DERIVED FROM ORIGINAL PUBLISHER POLYGON;
they are NOT real owner drawn rectangles, unseen truth or true human taps.
No threshold calibration, no selected photo/garment dropping, no auto save.
"""
import hashlib
import io
import json
import os
import gc
import sys
from pathlib import Path
import time
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"research"/"mission1-bounded-sam2-797"))
from bounded_source_io import load_model_checkpoint,open_source_once,linux_process_memory_mib,CHUNK,CAP_BYTES
from urllib.request import Request,urlopen

import numpy as np
import onnxruntime as ort
from PIL import Image,ImageDraw

MODEL_REPO="cstr/sam2.1-hiera-tiny-ONNX"
REVISION="8cef213"
MODEL_FILES={
 "encoder.onnx":"4fda6e68561e27808cedffa8689749a622bba5f11ba66f4ca4e3a8a9f6360db5",
 "decoder.onnx":"0ae944e08e55814c19afa4d143ef07b1a3dbad2decd77c15ec3ab220b9f57247"
}
SOURCE_IDS=[15201,20490,13428,12197,15461,18553,19659,13585,17509,17401]
BASE=Path("benchmark/mission1-additional-publisher-originals-792")
OUT=Path("benchmark/mission1-sam2-box-prompt-799")
MODEL_PATH=Path("/tmp/m1-sam2-796-weights")
sha=lambda b:hashlib.sha256(b).hexdigest()

def download_pinned(file):
    return load_model_checkpoint(file,MODEL_PATH)

def source_truth(row,annotation=None,verified_photo=None):
    # For production research, the verified original JPEG is hash-scanned and
    # decoded once before the encoder pass. Reuse the same image for every
    # publisher polygon; standalone source_truth still verifies its input.
    photo=verified_photo if verified_photo is not None else open_source_once(row,BASE/"originals")
    w,h=photo.size
    if (w,h)!=(row["width"],row["height"]):
        raise RuntimeError("Verified original source photo dimensions mismatch")
    # First polygon annotation by frozen publisher ID (not selected by IoU).
    annotated=sorted(row["annotations"],key=lambda x:int(x["id"]))
    if not annotated or not annotated[0].get("segmentation"):
        raise RuntimeError("No true publisher original polygon")
    original=annotation if annotation is not None else annotated[0]
    mask=Image.new("L",(w,h),0)
    draw=ImageDraw.Draw(mask)
    for poly in original["segmentation"]:
        if len(poly)<6 or len(poly)%2:
            raise RuntimeError("Invalid publisher human polygon")
        pts=[(float(poly[i]),float(poly[i+1])) for i in range(0,len(poly),2)]
        draw.polygon(pts,fill=1)
    actual=np.asarray(mask,dtype=np.uint8).astype(bool)
    if int(actual.sum())<1:
        raise RuntimeError("Publisher source instance mask insufficient")
    yy,xx=np.where(actual)
    centerx=(float(xx.min())+float(xx.max()))/2
    centery=(float(yy.min())+float(yy.max()))/2
    nearest=np.argmin((xx.astype(np.float32)-centerx)**2+(yy.astype(np.float32)-centery)**2)
    # Positive point is DERIVED from the publisher polygon (oracle) and is
    # NOT evidence that the user really clicked the pictured garment.
    point=(float(xx[nearest]),float(yy[nearest]))
    return photo,actual,point,original["id"],original["category_id"]

def oracle_rect_source799(truth):
    """Smallest positive SOURCE-pixel bbox with the actual original truth.

    A deliberately privileged human publisher mask derived bounding box.
    This is NOT evidence of a human drawing a rectangle in the app.
    """
    if truth.ndim!=2 or truth.dtype!=np.dtype(bool) or not truth.any():
        raise RuntimeError("P799 source publisher rectangle requires a nonempty true polygon mask")
    yy,xx=np.where(truth)
    x0,y0,x1,y1=int(xx.min()),int(yy.min()),int(xx.max())+1,int(yy.max())+1
    if not (0<=x0<x1<=truth.shape[1] and 0<=y0<y1<=truth.shape[0]):
        raise RuntimeError("P799 invalid source-pixel original publisher rectangle")
    return (x0,y0,x1,y1)

def sam2_source_prompt799(kind,positive_point,bbox,width,height):
    """Fixed box-only / point+box SAM2 convention, never GT-score selected."""
    if kind not in ("point","box","pointBox"):
        raise RuntimeError("P799 unknown SAM2 source prompt")
    x0,y0,x1,y1=bbox
    if not(0<=x0<x1<=width and 0<=y0<y1<=height):
        raise RuntimeError("P799 original-photo geometry outside source")
    coords=[]
    labels=[]
    if kind!="box":
        x,y=positive_point
        if not(0<=x<width and 0<=y<height):
            raise RuntimeError("P799 source positive oracle point outside photo")
        coords.append((x*1024/width,y*1024/height));labels.append(1)
    if kind!="point":
        coords.extend([(x0*1024/width,y0*1024/height),
                       (x1*1024/width,y1*1024/height)])
        labels.extend((2,3))
    return (np.asarray([coords],dtype=np.float32),
            np.asarray([labels],dtype=np.int64))

def preprocess(photo):
    im=photo.resize((1024,1024),resample=Image.Resampling.BILINEAR)
    a=np.asarray(im,dtype=np.float32)/255.0
    a=(a-np.array([.485,.456,.406],np.float32))/np.array([.229,.224,.225],np.float32)
    return np.ascontiguousarray(np.transpose(a,(2,0,1))[None,...])

def score_logits(logits,truth,w,h):
    # Both true masks and predictions evaluated in exact original photo pixels
    # with bilinear image resizing (SAM2 published ONNX output contract).
    out=np.asarray(Image.fromarray(np.asarray(logits,dtype=np.float32),mode="F").resize(
        (w,h),resample=Image.Resampling.BILINEAR),dtype=np.float32)>0
    tp=int(np.logical_and(out,truth).sum())
    fp=int(np.logical_and(out,~truth).sum())
    fn=int(np.logical_and(~out,truth).sum())
    iou=tp/(tp+fp+fn) if tp+fp+fn else 0
    return {"sourcePixelMaskIoU":round(iou,6),
            "truePositives":tp,"falsePositives":fp,"falseNegatives":fn,
            "predictedSourcePixelCount":int(out.sum()),
            "publisherSourcePixelCount":int(truth.sum())}

def run():
    manifest=json.loads((BASE/"manifest.json").read_text())
    if manifest["schema"]!="m1-p792-additional-publisher-originals-research-not-holdout/v1" or len(manifest["rows"])!=10:
        raise RuntimeError("All ten source-registered actual publisher original JPEGs required")
    catalog={r["id"]:r for r in manifest["rows"]}
    if len(catalog)!=10 or set(SOURCE_IDS)!=set(catalog) or len(SOURCE_IDS)!=10:
        raise RuntimeError("P796 all 10 exact P792 development image IDs required: no photo cherry-picking")
    publisher_instance_total=sum(len(catalog[i]["annotations"]) for i in SOURCE_IDS)
    if publisher_instance_total!=23:
        raise RuntimeError("P796 all 23 source-polygon annotated garment instances required")
    opts=ort.SessionOptions()
    opts.intra_op_num_threads=2
    opts.inter_op_num_threads=1
    opts.graph_optimization_level=ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    opts.enable_mem_pattern=False
    opts.enable_cpu_mem_arena=False
    enc=ort.InferenceSession(str(download_pinned("encoder.onnx")),opts,
        providers=["CPUExecutionProvider"])
    dec=ort.InferenceSession(str(download_pinned("decoder.onnx")),opts,
        providers=["CPUExecutionProvider"])
    if [x.name for x in enc.get_inputs()]!=["image"] or set(x.name for x in dec.get_inputs())!={
        "image_embed","high_res_0","high_res_1","point_coords","point_labels"
    }:
        raise RuntimeError("Actual SAM2 image encoder/decoder IO contract changed")
    rows=[]
    all_source_sha=set()
    per_photo_memory=[]
    for id in SOURCE_IDS:
        row=catalog[id]
        ann=sorted(row["annotations"],key=lambda x:int(x["id"]))
        if not ann or len(ann)>8:
            raise RuntimeError("All 1–8 frozen original publisher instances required")
        first_photo=open_source_once(row,BASE/'originals')
        w,h=first_photo.size
        all_source_sha.add(row["sha256"])
        tic=time.perf_counter()
        features=enc.run(None,{"image":preprocess(first_photo)})
        encoding_seconds=round(time.perf_counter()-tic,3)
        names=[z.name for z in enc.get_outputs()]
        if len(features)!=3 or set(names)!={"image_embed","high_res_0","high_res_1"}:
            raise RuntimeError("P796 actual model image-feature outputs missing")
        prepared={name:feature for name,feature in zip(names,features)}
        if prepared["image_embed"].shape!=(1,256,64,64) or \
           prepared["high_res_0"].shape!=(1,32,256,256) or \
           prepared["high_res_1"].shape!=(1,64,128,128):
            raise RuntimeError("P796 actual SAM2 image feature shapes changed")
        for ground_truth in ann:
            # Model encoder is run ONCE for the real photo; each original
            # publisher garment gets one independent annotation-derived oracle
            # point. No difficult annotations or failures are dropped.
            photo,truth,pt,aid,cat=source_truth(row,ground_truth,verified_photo=first_photo)
            if photo.size!=(w,h):
                raise RuntimeError("Different source image was substituted")
            bbox=oracle_rect_source799(truth)
            results={}
            total_decode_seconds=0.0
            for prompt_kind in ("point","box","pointBox"):
                point_coords,point_labels=sam2_source_prompt799(prompt_kind,pt,bbox,w,h)
                start=time.perf_counter()
                output=dec.run(None,{**prepared,
                  "point_coords":point_coords,"point_labels":point_labels})
                total_decode_seconds+=time.perf_counter()-start
                got={k:v for k,v in zip([x.name for x in dec.get_outputs()],output)}
                if set(got)!={"mask_logits","iou"} or got["mask_logits"].shape!=(1,4,256,256) or got["iou"].shape!=(1,4):
                    raise RuntimeError("P799 actual SAM2 decoder output shape invalid for "+prompt_kind)
                masks=got["mask_logits"][0]
                predicts=got["iou"][0]
                if not np.isfinite(masks).all() or not np.isfinite(predicts).all():
                    raise RuntimeError("P799 actual SAM2 source logits nonfinite for "+prompt_kind)
                predicted_choice=1+int(np.argmax(predicts[1:]))
                results[prompt_kind]={
                  "single":score_logits(masks[0],truth,w,h),
                  "modelSelectedMultimask":score_logits(masks[predicted_choice],truth,w,h),
                  "selectedHighestModelIoUMaskIndex":predicted_choice,
                  "predictedModelIoUSingle":round(float(predicts[0]),6),
                  "predictedModelIoUMultimask":round(float(predicts[predicted_choice]),6),
                  "promptLabelCodes":point_labels[0].tolist(),
                  "actualDecoderInvocation":True
                }
                del output,got,masks,predicts,point_coords,point_labels
            receipt={
              "publisherImageId":id,
              "publisherInstanceId":int(aid),
              "publisherCategoryId":int(cat),
              "sourceOriginalSHA256":row["sha256"],
              "originalWidth":w,"originalHeight":h,
              "oracleClickFromPublisherPolygon":[round(x,2) for x in pt],
              "oracleRectFromPublisherPolygon":list(bbox),
              "publisherTruthWasUsedToConstructPrompt":True,
              "actualOwnerClickedOrDrewBox":False,
              "humanBlindedNewAnnotations":0,
              "sourceMaskWasActualPublisherPolygon":True,
              "model":"SAM2.1-Hiera-Tiny-ONNX immutable CPU source research",
              "encoderSHA256":MODEL_FILES["encoder.onnx"],
              "decoderSHA256":MODEL_FILES["decoder.onnx"],
              "point":results["point"],
              "box":results["box"],
              "pointBox":results["pointBox"],
              "imageEncoderWallSeconds":encoding_seconds,
              "allThreeDecoderArmsWallSeconds":round(total_decode_seconds,4),
              "ownerSourceCutoutConfirmed":False,
              "exactAppClothingSubtypeVerified":False,
              "ownerColorConfirmed":False,
              "autoSaveAllowed":False
            }
            rows.append(receipt)
            print("M1_P799_REAL_SAM2_POINT_BOX_ORACLE_COMPARISON",json.dumps({
              "sourcePublisherImageId":id,"publisherOriginalInstance":int(aid),
              "modelInputSourceOwnerApproved":False,
              "oracleBoxPublishedGroundTruthDerived":True,
              "pointIoU":receipt["point"]["modelSelectedMultimask"]["sourcePixelMaskIoU"],
              "boxIoU":receipt["box"]["modelSelectedMultimask"]["sourcePixelMaskIoU"],
              "pointPlusBoxIoU":receipt["pointBox"]["modelSelectedMultimask"]["sourcePixelMaskIoU"],
              "allFalsePixelsCounted":True,"autoSaveAllowed":False
            },sort_keys=True),flush=True)
            del photo,truth,bbox,results,receipt
        del first_photo,features,prepared
        gc.collect()
        memory={"publisherImageId":id,**linux_process_memory_mib()}
        per_photo_memory.append(memory)
        print("M1_P797_SAM2_PROCESS_MEMORY_AFTER_SOURCE",json.dumps(memory,sort_keys=True),flush=True)
    if len(rows)!=23 or len(all_source_sha)!=10 or len(set((r["publisherImageId"],r["publisherInstanceId"]) for r in rows))!=23:
        raise RuntimeError("P796 no missing, duplicated or cherry-picked photo/polygon instance")
    arms=("point","box","pointBox")
    for receipt in rows:
        if set(receipt[arm]["promptLabelCodes"][0] for arm in arms)!={1,2}:
            raise RuntimeError("P799 expected actual distinct ORT point, box and point+box prompt labels")
        if receipt["point"]["promptLabelCodes"]!=[1] or receipt["box"]["promptLabelCodes"]!=[2,3] or receipt["pointBox"]["promptLabelCodes"]!=[1,2,3]:
            raise RuntimeError("P799 actual decoder prompt input labels not the fixed SAM2 convention")
    summary={
        arm:{
          "sourcePublisherMasks":len(rows),
          "modelSelectedMaskIoU50":sum(v[arm]["modelSelectedMultimask"]["sourcePixelMaskIoU"]>=.5 for v in rows),
          "index0SingleMaskIoU50":sum(v[arm]["single"]["sourcePixelMaskIoU"]>=.5 for v in rows),
          "sourcePixelMeanMaskIoU":round(sum(v[arm]["modelSelectedMultimask"]["sourcePixelMaskIoU"] for v in rows)/len(rows),6),
          "sourcePixelMeanSingleMaskIoU":round(sum(v[arm]["single"]["sourcePixelMaskIoU"] for v in rows)/len(rows),6),
        }
        for arm in arms
    }
    by_category={}
    for cat in sorted(set(r["publisherCategoryId"] for r in rows)):
        rr=[r for r in rows if r["publisherCategoryId"]==cat]
        by_category[str(cat)]={
           "sourceOriginalPublisherGarments":len(rr),
           **{arm+"MaskIoU50":sum(v[arm]["modelSelectedMultimask"]["sourcePixelMaskIoU"]>=.5 for v in rr) for arm in arms}
        }
    data={
     "schema":"m1-p799-actual-sam2-source-publisher-ORACLE-point-box-arm-comparison/v1",
     "selectedPhotoIds":SOURCE_IDS,
     "publisherPhotoCount":10,"realPublisherPolygonInstanceCount":23,
     "actualSourceOriginalSHA256Verified":True,
     "allAlreadyExposedDevelopmentSources":True,
     "existingPublisherTruthUsedToProduceAllPrompts":True,
     "newIndependentBlindReviewerCount":0,
     "actualUserPromptCount":0,
     "actualPhysicalPhoneTests":0,
     "trainingDisjointnessIndependentlyVerified":False,
     "modelWeightsSHA256":MODEL_FILES,
     "boundedModelDownload":True,
     "modelDownloadChunkBytes":CHUNK,
     "originalJPEGDecodedOncePerPhoto":True,
     "processMemoryAfterEachSourceMiB":per_photo_memory,
     "measuredPeakProcessRSSMiB":per_photo_memory[-1]["VmHWMMiB"],
     "ownerMaskApprovedCount":0,
     "automaticGarmentDetectionMeasured":False,
     "realGarmentSubtypeOrColorVerified":False,
     "autoSaveAllowed":False,
     "releaseAuthorized":False,"familyAlpha":"HOLD",
     "promptArmNames":list(arms),
     "summary":summary,"perPublisherCategory":by_category,"rows":rows
    }
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/"source-prompt-comparison.json").write_text(json.dumps(data,indent=2)+"\n")
    print("M1_P799_REAL_SAM2_ALL_23_PUBLISHER_ORACLE_POINT_BOX_RESULTS",json.dumps({
      "sourceOriginalCount":len(all_source_sha),
      "originalPublisherInstances":len(rows),
      "pointMaskIoU50":summary["point"]["modelSelectedMaskIoU50"],
      "boxMaskIoU50":summary["box"]["modelSelectedMaskIoU50"],
      "pointBoxMaskIoU50":summary["pointBox"]["modelSelectedMaskIoU50"],
      "byCategory":by_category,
      "measuredPeakProcessRSSMiB":per_photo_memory[-1]["VmHWMMiB"],
      "realOwnerDrawnBoxes":0,"independentHumanTruth":False,
      "realAutomaticModelCategoryOrSubtype":False,"releaseAuthorized":False
    },sort_keys=True),flush=True)
if __name__=="__main__":run()
