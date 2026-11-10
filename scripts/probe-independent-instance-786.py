#!/usr/bin/env python3
"""Mission1 P786: exact real-source ONNX probe of third-party instance model.
No generated masks or human labels; public P66 images are already exposed.
This deliberately does NOT promote model rights or claim segmentation accuracy.
"""
import hashlib, json, pathlib, urllib.request, numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps
from score_independent_instance_masks_786 import choose_detections, reconstruct, source_truth, match_instances

MODEL_URL=("https://huggingface.co/HasanKabir23/Yolov26s-DeepFashion2/"
           "resolve/670bd8b/best.onnx")
PINNED_ONNX_SHA256="485bc106721febbd82fe24297e12a9fb49a435a552afff1e6b76308716555f76"
ROOT=pathlib.Path("benchmark")
OUT=ROOT/"mission1-instance-model-786"
OLD=ROOT/"real-garment-acceptance-66"/"fashionpedia"
REGISTRY=pathlib.Path("research/real-garment-acceptance-66/fashionpedia-sample.json")
LABELS=("short_sleeve_top","long_sleeve_top","short_sleeve_outwear",
 "long_sleeve_outwear","vest","sling","shorts","trousers","skirt",
 "short_sleeve_dress","long_sleeve_dress","vest_dress","sling_dress")

def download():
    req=urllib.request.Request(MODEL_URL,headers={"User-Agent":"ClosetCurrentResearchNoDeploy/1"})
    with urllib.request.urlopen(req,timeout=180) as response:
        value=response.read(25_000_001)
    if len(value)<100_000 or len(value)>25_000_000:
        raise RuntimeError("Unexpected ONNX model weight byte size")
    digest=hashlib.sha256(value).hexdigest()
    if digest!=PINNED_ONNX_SHA256:
        raise RuntimeError("External model ONNX source SHA changed; reject unknown weights")
    OUT.mkdir(parents=True,exist_ok=True)
    model=OUT/"temporary-licensed-unverified-model.onnx"
    model.write_bytes(value)
    return model,digest

def prepare(file,side):
    with Image.open(file) as image:
        im=ImageOps.exif_transpose(image).convert("RGB")
        w,h=im.size
        ratio=min(side/w,side/h)
        nw=max(1,round(w*ratio));nh=max(1,round(h*ratio))
        resized=im.resize((nw,nh),Image.Resampling.BILINEAR)
    padded=Image.new("RGB",(side,side),(114,114,114))
    padded.paste(resized,((side-nw)//2,(side-nh)//2))
    a=np.asarray(padded,dtype=np.float32)/np.float32(255.0)
    return a.transpose(2,0,1)[None,...].copy(),{'width':w,'height':h,
      'side':side,'newWidth':nw,'newHeight':nh,'padX':(side-nw)//2,
      'padY':(side-nh)//2,'scale':ratio}

def main():
    model,digest=download()
    try:
        session=ort.InferenceSession(str(model),providers=["CPUExecutionProvider"])
        ins=session.get_inputs();outs=session.get_outputs()
        if len(ins)!=1 or len(outs)<1 or len(outs)>5:
            raise RuntimeError("Unknown model ONNX I/O contract")
        info=ins[0]
        if len(info.shape)!=4 or info.shape[1]!=3:
            raise RuntimeError("Expected 1x3xHxW real image input")
        side=info.shape[2] if isinstance(info.shape[2],int) else 416
        if side not in (416,640):
            raise RuntimeError("Unsupported pinned input crop width")
        manifest=json.loads(REGISTRY.read_text())
        rows=[]
        for original in manifest["rows"]:
            path=OLD/original["file_name"]
            data=path.read_bytes()
            actual=hashlib.sha256(data).hexdigest()
            if actual!=original["sha256"]:
                raise RuntimeError("Real source photo SHA does not match published P66")
            pixels,meta=prepare(path,side)
            w,h=meta['width'],meta['height']
            values=session.run(None,{info.name:pixels})
            if len(values)!=2 or np.asarray(values[0]).shape!=(1,300,38) or \
               np.asarray(values[1]).shape!=(1,32,side//4,side//4):
                raise RuntimeError('Unrecognized actual ONNX instance segmentation contract')
            selected,raw_candidates=choose_detections(np.asarray(values[0]),side)
            predictions=reconstruct(selected,np.asarray(values[1]),meta)
            truth=source_truth(original,w,h)
            instance=match_instances(truth,predictions)
            if instance['truePositives']+instance['falseNegatives']!=len(truth) or \
               instance['truePositives']+instance['falsePositives']!=len(predictions):
                raise RuntimeError('Actual source instance scores do not conserve all labels')
            descriptions=[]
            for name,output in zip((x.name for x in outs),values):
                array=np.asarray(output)
                if array.size<1 or not np.isfinite(array).all():
                    raise RuntimeError("Real model emitted invalid/nonfinite values")
                descriptions.append({"name":name,"shape":list(array.shape),
                  "dtype":str(array.dtype),"minimum":float(array.min()),
                  "maximum":float(array.max()),
                  "mean":float(array.mean())})
            # Examine actual model output cells before choosing a decoder.
            # 300 detections x 38 columns is likely 6 attributes + 32 mask
            # coefficients, but model card information alone cannot verify it.
            detection=np.asarray(values[0])
            preview=[]
            if detection.ndim==3 and detection.shape[2]==38:
                for rec in detection[0,:8]:
                    preview.append([round(float(x),5) for x in rec[:8]])
            rows.append({
             'realOriginalSourceMaskScore':instance,
             'truePublisherGarments':len(truth),
             'publisherGarmentsByBroadFamily':[t['category'] for t in truth],
             'retainedDetectionCountBeforeNMS':raw_candidates,
             'modelMaskDecodedCount':len(predictions),
             'modelDetections':[{'detectorRow':p['row'],'classId':p['classId'],
                  'family':p['category'],'confidence':round(p['confidence'],6),
                  'originalSourceBounds':p['originalSourceBounds'],
                  'maskSHA256':p['maskSHA256'],'sourcePixelCount':p['area']}
                   for p in predictions],
             'maskDecodeRule':'prototype 32 basis coefficients sigmoid, bilinear 416, source letterbox removed, original source threshold .5',
             'iouMatching':'same-family original-source-mask IoU >=.50; cardinality-max one-to-one',
             'outputPreviewFirstEight':preview,
             "rawDetectionShape":list(detection.shape),
             "rawClassColumnCandidates":({
              "col4":[round(float(x),4) for x in detection[0,:12,4]],
              "col5":[round(float(x),4) for x in detection[0,:12,5]]
             } if detection.ndim==3 and detection.shape[2]==38 else {}),
             "originalImageId":original["id"],"sourceSHA256":actual,
             "originalDimensions":[w,h],"publisherGarmentAnnotationCount":len(original["annotations"]),
             "publisherCategoryIds":sorted(set(a["category_id"] for a in original["annotations"])),
             "trueModelInferenceExecuted":True,"modelRawOutput":descriptions,
             "sourcePublisherOriginalImagePresent":True,
             "modelPredictionAccuracyVerified":False})
        if len(rows)!=6:
            raise RuntimeError("Six exact known P66 original photo benchmarks required")
        tp=sum(r['realOriginalSourceMaskScore']['truePositives'] for r in rows)
        fp=sum(r['realOriginalSourceMaskScore']['falsePositives'] for r in rows)
        fn=sum(r['realOriginalSourceMaskScore']['falseNegatives'] for r in rows)
        if tp+fn!=16:
            raise RuntimeError('Must retain all 16 genuine publisher human polygon instances including shoes')
        aggregate={'truePositives':tp,'falsePositives':fp,'falseNegatives':fn,
          'precision':tp/(tp+fp) if tp+fp else None,
          'recall':tp/(tp+fn) if tp+fn else None,
          'f1':2*tp/(2*tp+fp+fn) if 2*tp+fp+fn else None}
        print('M1_P786_REAL_ORIGINAL_SOURCE_PUBLISHER_MASK_IOU50',json.dumps(aggregate,sort_keys=True))
        report={"schema":"m1-p786-real-original-instance-mask-IoU50/v2",
         "provider":"HasanKabir23/Yolov26s-DeepFashion2",
         "modelUrl":MODEL_URL,"modelWeightsSHA256":digest,
         "modelTaskClaim":"13-category clothing instance segmentation",
         "pinnedModelCardReportedLicense":"Apache-2.0",
         "trainedOn":"DeepFashion2; original DeepFashion2 permission for commercial model derivatives unverified",
         "publisherSourcePhotos":6,"alreadyExposedDevelopmentPhotos":True,
         "independentHumanLabelsVerified":False,"modelCommercialRightsCleared":False,
         "sourceImageRepublicationAuthorized":False,
         'humanSourceInstanceIoU':0.5,'humanSourceSubtypeAccuracy':None,
         'sourceInstanceMaskIoUThreshold':0.5,
         'sourceInstanceScore':aggregate,
         'rawDetectionMinimumConfidence':0.25,'classAwareBoxNMSThreshold':0.6,
         'scoredModelInstanceMasks':True,
         "trainingSourceOverlapIndependentlyExcluded":False,
         "savedNativeClosetGarments":0,"releaseAuthorized":False,
         "modelPromotionRecommended":False,
         "independentRealHumanReviewRequired":True,
         "realSourceMaskIoU50AcceptancePass":False,
         "familyAlpha":"HOLD","inputShape":info.shape,
         "modelOutputContract":[{"name":o.name,"shape":o.shape} for o in outs],
         "possibleClasses":list(LABELS),"observations":rows}
        (OUT/"research-only-inference.json").write_text(json.dumps(report,indent=2))
        print("M1_P786_GENUINE_SHA_PINNED_FASHIONPEDIA_SIX_ONNX_INFERENCES_EXECUTED")
        print("M1_P786_OUTPUT_CONTRACT",json.dumps(report["modelOutputContract"]))
        print('M1_P786_REAL_PUBLISHER_MASK_SCORE_EXPOSED_DEVELOPMENT_ONLY')
        print('M1_P786_NO_MODEL_LICENSE_PROMOTION_OR_RELEASE')
    finally:
        model.unlink(missing_ok=True)

if __name__=="__main__":
    main()
