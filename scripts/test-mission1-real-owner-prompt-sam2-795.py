"""P795 research: actual SHA-pinned Apache-2.0 SAM2.1 tiny ONNX source->mask.

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
from pathlib import Path
import time
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
SOURCE_IDS=[15201,20490,13428]
BASE=Path("benchmark/mission1-additional-publisher-originals-792")
OUT=Path("benchmark/mission1-sam2-promptable-795")
MODEL_PATH=Path("/tmp/m1-sam2-795-weights")
sha=lambda b:hashlib.sha256(b).hexdigest()

def download_pinned(file):
    expected=MODEL_FILES[file]
    location=MODEL_PATH/file
    if location.exists() and sha(location.read_bytes())==expected:
        return location
    url=f"https://huggingface.co/{MODEL_REPO}/resolve/{REVISION}/{file}?download=true"
    with urlopen(Request(url,headers={"User-Agent":"ClosetCurrentResearch-795/1.0"}),timeout=180) as response:
        if response.status!=200:
            raise RuntimeError(f"SAM2 immutable model retrieval HTTP {response.status}")
        from urllib.parse import urlsplit
        target=urlsplit(response.url)
        host=target.hostname or ""
        if target.scheme!="https" or not (
            host=="huggingface.co" or host.endswith(".xethub.hf.co") or
            host.endswith(".hf.co")
        ):
            # Never log presigned URLs/tokens; only the external host.
            raise RuntimeError("Unapproved SAM2 model host redirect: "+host)
        raw=response.read()
    if sha(raw)!=expected:
        raise RuntimeError("SAM2 external converted ONNX MODEL SHA mismatch: refuse")
    MODEL_PATH.mkdir(parents=True,exist_ok=True)
    location.write_bytes(raw)
    return location

def source_truth(row):
    image_path=BASE/"originals"/row["file_name"]
    raw=image_path.read_bytes()
    if sha(raw)!=row["sha256"]:
        raise RuntimeError("Real publisher original JPEG bytes or source SHA mismatch")
    photo=Image.open(io.BytesIO(raw)).convert("RGB")
    w,h=photo.size
    if (w,h)!=(row["width"],row["height"]) or w>3072 or h>3072:
        raise RuntimeError("Actual publisher image dimensions invalid")
    # First polygon annotation by frozen publisher ID (not selected by IoU).
    annotated=sorted(row["annotations"],key=lambda x:int(x["id"]))
    if not annotated or not annotated[0].get("segmentation"):
        raise RuntimeError("No true publisher original polygon")
    original=annotated[0]
    mask=Image.new("L",(w,h),0)
    draw=ImageDraw.Draw(mask)
    for poly in original["segmentation"]:
        if len(poly)<6 or len(poly)%2:
            raise RuntimeError("Invalid publisher human polygon")
        pts=[(float(poly[i]),float(poly[i+1])) for i in range(0,len(poly),2)]
        draw.polygon(pts,fill=1)
    actual=np.asarray(mask,dtype=np.uint8).astype(bool)
    if int(actual.sum())<200:
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
        raise RuntimeError("Exactly ten P792 already-exposed ORIGINAL publisher photos required")
    catalog={r["id"]:r for r in manifest["rows"]}
    if any(i not in catalog for i in SOURCE_IDS):
        raise RuntimeError("Three pre-registered original publisher photos not in fixed ten")
    import platform
    opts=ort.SessionOptions()
    opts.intra_op_num_threads=2
    opts.inter_op_num_threads=1
    opts.graph_optimization_level=ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    enc=ort.InferenceSession(str(download_pinned("encoder.onnx")),opts,
        providers=["CPUExecutionProvider"])
    dec=ort.InferenceSession(str(download_pinned("decoder.onnx")),opts,
        providers=["CPUExecutionProvider"])
    enc_inputs=[x.name for x in enc.get_inputs()]
    dec_inputs=[x.name for x in dec.get_inputs()]
    if enc_inputs!=["image"] or set(dec_inputs)!={
       "image_embed","high_res_0","high_res_1","point_coords","point_labels"
    }:
        raise RuntimeError("Actual source-pinned SAM2 encoder/decoder ONNX contract changed")
    rows=[]
    for id in SOURCE_IDS:
        row=catalog[id]
        img,truth,pt,aid,cat=source_truth(row)
        w,h=img.size
        tic=time.perf_counter()
        features=enc.run(None,{"image":preprocess(img)})
        names=[z.name for z in enc.get_outputs()]
        if len(features)!=3 or set(names)!={"image_embed","high_res_0","high_res_1"}:
            raise RuntimeError("Unexpected original SAM2 encoder outputs")
        prepared={name:feature for name,feature in zip(names,features)}
        if prepared["image_embed"].shape!=(1,256,64,64) or             prepared["high_res_0"].shape!=(1,32,256,256) or             prepared["high_res_1"].shape!=(1,64,128,128):
            raise RuntimeError("SAM2 wrong image feature tensor output contract")
        prompt=np.asarray([[[pt[0]*1024/w,pt[1]*1024/h]]],np.float32)
        labels=np.array([[1]],np.int64)
        dec_outputs=dec.run(None,{**prepared,"point_coords":prompt,"point_labels":labels})
        output_names=[x.name for x in dec.get_outputs()]
        got={k:v for k,v in zip(output_names,dec_outputs)}
        if set(got)!={"mask_logits","iou"} or got["mask_logits"].shape!=(1,4,256,256) or got["iou"].shape!=(1,4):
            raise RuntimeError("Promptable SAM2 output tensor identity invalid")
        mask_set=got["mask_logits"][0];pred_iou=got["iou"][0]
        if not np.isfinite(mask_set).all() or not np.isfinite(pred_iou).all():
            raise RuntimeError("Nonfinite actual SAM2 mask or score")
        # Fixed predeclared selection: official single-mask index 0 and
        # highest predicted IoU of indices 1..3 (NOT ground-truth selected).
        multimask_choice=int(np.argmax(pred_iou[1:]))+1
        single=score_logits(mask_set[0],truth,w,h)
        multi=score_logits(mask_set[multimask_choice],truth,w,h)
        receipt={"publisherImageId":id,"publisherInstanceId":int(aid),
         "publisherCategoryId":int(cat),"sourceOriginalSHA256":row["sha256"],
         "originalWidth":w,"originalHeight":h,
         "oracleClickFromPublisherPolygon":[round(x,2) for x in pt],
         "clickWasActualIndependentHuman":False,
         "model":"SAM 2.1 Hiera tiny, ONNX full source, research",
         "modelSHA256":MODEL_FILES,
         "selectedHighestModelIoUMaskIndex":multimask_choice,
         "predictedModelIoUSingle":round(float(pred_iou[0]),6),
         "predictedModelIoUBestMultimask":round(float(pred_iou[multimask_choice]),6),
         "single":single,"modelSelectedMultimask":multi,
         "wallTimeSeconds":round(time.perf_counter()-tic,2),
         "ownerPhotoSaved":False,"ownerSourceCutoutConfirmed":False}
        rows.append(receipt)
        print("M1_P795_REAL_SAM2_SOURCE_PROMPT_RESULT",json.dumps({
         "publisherImageId":id,"instanceId":int(aid),
         "pointPromptSource":"PUBLISHER_POLYGON_ORACLE_NOT_REAL_OWNER",
         "singleIoU":single["sourcePixelMaskIoU"],
         "modelSelectedMultimaskIoU":multi["sourcePixelMaskIoU"],
         "modelSelectedMaskIndex":multimask_choice,
         "ownerConfirmed":False,
         "modelReferenceRightsIndependentlyApproved":False},sort_keys=True),flush=True)
    data={
      "schema":"m1-p795-actual-sam2-owner-prompt-polygon-oracle-research/v1",
      "selectedPhotoIds":SOURCE_IDS,
      "sourceOriginalsSHA256Verified":True,
      "publisherHumanPolygonSourceExisting":True,
      "sourceTrainingOverlapIndependentlyExcluded":False,
      "newlyBlindlyReviewedByTwoPeople":False,
      "oracleClickFromPublisherTruth":True,
      "genuineIndependentHumanPromptsPerformed":0,
      "modelLicense":"Upstream SAM2 and third-party format conversion metadata Apache-2.0; full legal provenance review outstanding",
      "realOwnerPhotosSentToNetwork":False,
      "shippingModelModified":False,
      "maskModelAutoSaveAllowed":False,
      "nativeMobilePerformanceVerified":False,
      "releaseAuthorized":False,"familyAlpha":"HOLD",
      "sourceMaskIoU50SingleCount":sum(r["single"]["sourcePixelMaskIoU"]>=.5 for r in rows),
      "sourceMaskIoU50MultimaskCount":sum(r["modelSelectedMultimask"]["sourcePixelMaskIoU"]>=.5 for r in rows),
      "rows":rows
    }
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/"source-prompt-results.json").write_text(json.dumps(data,indent=2)+"\n")
    print("M1_P795_REAL_SAM2_THREE_SOURCE_PROMPT_SUMMARY",json.dumps({
     "model":MODEL_REPO,"sources":len(rows),
     "sourceMaskIoU50Single":data["sourceMaskIoU50SingleCount"],
     "sourceMaskIoU50Multimask":data["sourceMaskIoU50MultimaskCount"],
     "realUserPromptCount":0,"releaseAuthorized":False},sort_keys=True))
if __name__=="__main__":run()
