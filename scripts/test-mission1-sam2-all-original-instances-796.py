"""P796 research: all 23 original publisher garment instances with actual pinned SAM2 ONNX.

Three pre-registered source ORIGINAL publisher photo IDs, first publisher
polygon per photo, source annotation-derived ONE positive oracle point.
This is NOT a real person's click, human-blind truth, owner confirmation, nor
unprompted AI garment recognition. Never auto-save or include owner photos.
No feedback tuning or selective omission after measuring model scores.
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
OUT=Path("benchmark/mission1-sam2-all-instances-796")
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
            prompt=np.asarray([[[pt[0]*1024/w,pt[1]*1024/h]]],np.float32)
            labels=np.array([[1]],np.int64)
            start=time.perf_counter()
            output=dec.run(None,{**prepared,"point_coords":prompt,"point_labels":labels})
            decoder_seconds=round(time.perf_counter()-start,4)
            got={k:v for k,v in zip([x.name for x in dec.get_outputs()],output)}
            if set(got)!={"mask_logits","iou"} or got["mask_logits"].shape!=(1,4,256,256) or got["iou"].shape!=(1,4):
                raise RuntimeError("P796 actual prompt decoder output shape invalid")
            masks=got["mask_logits"][0]
            predicts=got["iou"][0]
            if not np.isfinite(masks).all() or not np.isfinite(predicts).all():
                raise RuntimeError("P796 nonfinite real SAM2 raw mask logits")
            predicted_choice=1+int(np.argmax(predicts[1:]))
            single=score_logits(masks[0],truth,w,h)
            multimask=score_logits(masks[predicted_choice],truth,w,h)
            receipt={
              "publisherImageId":id,
              "publisherInstanceId":int(aid),
              "publisherCategoryId":int(cat),
              "sourceOriginalSHA256":row["sha256"],
              "originalWidth":w,"originalHeight":h,
              "oracleClickFromPublisherPolygon":[round(x,2) for x in pt],
              "clickWasActualIndependentHuman":False,
              "sourceMaskWasActualPublisherPolygon":True,
              "model":"SAM2.1-Hiera-Tiny-ONNX source-image single oracle click",
              "encoderSHA256":MODEL_FILES["encoder.onnx"],
              "decoderSHA256":MODEL_FILES["decoder.onnx"],
              "selectedHighestModelIoUMaskIndex":predicted_choice,
              "predictedModelIoUSingle":round(float(predicts[0]),6),
              "predictedModelIoUMultimask":round(float(predicts[predicted_choice]),6),
              "single":single,
              "modelSelectedMultimask":multimask,
              "imageEncoderWallSeconds":encoding_seconds,
              "instanceDecoderWallSeconds":decoder_seconds,
              "ownerSourceCutoutConfirmed":False,
              "exactAppClothingSubtypeVerified":False,
              "ownerColorConfirmed":False,
              "autoSaveAllowed":False
            }
            rows.append(receipt)
            print("M1_P796_ACTUAL_SAM2_PUBLISHER_INSTANCE",json.dumps({
             "photoId":id,"instanceId":int(aid),"publisherCategoryId":int(cat),
             "oraclePointNotRealHuman":True,"singleSourceIoU":single["sourcePixelMaskIoU"],
             "modelMultimaskSourceIoU":multimask["sourcePixelMaskIoU"],
             "actualMaskSelectionFromModelOnly":True,"autoSaveAllowed":False
            },sort_keys=True),flush=True)
            del photo,truth,masks,predicts,output,got
        del first_photo,features,prepared
        gc.collect()
        memory={"publisherImageId":id,**linux_process_memory_mib()}
        per_photo_memory.append(memory)
        print("M1_P797_SAM2_PROCESS_MEMORY_AFTER_SOURCE",json.dumps(memory,sort_keys=True),flush=True)
    if len(rows)!=23 or len(all_source_sha)!=10 or len(set((r["publisherImageId"],r["publisherInstanceId"]) for r in rows))!=23:
        raise RuntimeError("P796 no missing, duplicated or cherry-picked photo/polygon instance")
    by_category={}
    for cat in sorted(set(r["publisherCategoryId"] for r in rows)):
        rr=[r for r in rows if r["publisherCategoryId"]==cat]
        by_category[str(cat)]={
          "sourcePublisherInstances":len(rr),
          "singleMaskIoU50":sum(r["single"]["sourcePixelMaskIoU"]>=.5 for r in rr),
          "modelMultimaskIoU50":sum(r["modelSelectedMultimask"]["sourcePixelMaskIoU"]>=.5 for r in rr)
        }
    data={
     "schema":"m1-p796-actual-sam2-all-source-original-23-oracle-instances/v1",
     "selectedPhotoIds":SOURCE_IDS,
     "publisherPhotoCount":10,"realPublisherPolygonInstanceCount":23,
     "sourceOriginalsSHA256Verified":True,
     "allAlreadyExposedDevelopmentSources":True,
     "modelTrainingDisjointnessIndependentlyConfirmed":False,
     "independentHumanAnnotatorCount":0,
     "oracleClickDerivedFromPublisherPolygon":True,
     "realUserClickCount":0,
     "modelLicense":"Meta upstream SAM2 Apache-2.0; third party converted checkpoint claims Apache-2.0; separate legal review required",
     "modelWeightsSHA256":MODEL_FILES,
     "boundedModelDownload":True,
     "modelDownloadChunkBytes":CHUNK,
     "modelAssetByteCaps":CAP_BYTES,
     "verifiedOriginalJPEGDecodedOncePerPhoto":True,
     "ORTCpuMemoryArenaEnabled":False,
     "ORTMemoryPatternEnabled":False,
     "processMemoryAfterEachSourceMiB":per_photo_memory,
     "measuredPeakProcessRSSMiB":per_photo_memory[-1]["VmHWMMiB"],
     "modelSessionResidentDuringTenImages":True,
     "ownerPhotosUploaded":False,
     "nativeMobilePerformanceVerified":False,
     "automaticGarmentDetectionMeasured":False,
     "ownerMaskAcceptedCount":0,
     "releaseAuthorized":False,"familyAlpha":"HOLD",
     "singleMaskIoU50Count":sum(r["single"]["sourcePixelMaskIoU"]>=.5 for r in rows),
     "modelSelectedMaskIoU50Count":sum(r["modelSelectedMultimask"]["sourcePixelMaskIoU"]>=.5 for r in rows),
     "singleMeanOriginalPixelIoU":round(sum(r["single"]["sourcePixelMaskIoU"] for r in rows)/len(rows),6),
     "modelSelectedMeanOriginalPixelIoU":round(sum(r["modelSelectedMultimask"]["sourcePixelMaskIoU"] for r in rows)/len(rows),6),
     "perPublisherCategory":by_category,
     "rows":rows
    }
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/"all-publisher-instance-results.json").write_text(json.dumps(data,indent=2)+"\n")
    print("M1_P796_ACTUAL_SAM2_ALL_23_REAL_PUBLISHER_GARMENT_PROMPTS",json.dumps({
     "realPublicOriginals":len(all_source_sha),
     "publisherInstancePolygons":len(rows),
     "singleIoU50":data["singleMaskIoU50Count"],
     "modelPredictedSelectionIoU50":data["modelSelectedMaskIoU50Count"],
     "meanSelectedSourcePixelIoU":data["modelSelectedMeanOriginalPixelIoU"],
     "perPublisherCategory":by_category,"humanOwnerClicks":0,
     "automaticDetectionClaim":False,
     "measuredPeakProcessRSSMiB":per_photo_memory[-1]["VmHWMMiB"],
     "releaseAuthorized":False
    },sort_keys=True),flush=True)
if __name__=="__main__":run()
