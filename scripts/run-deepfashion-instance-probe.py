#!/usr/bin/env python3
"""Review-only pinned garment-instance ONNX feasibility on licensed source images.
No inference over user data, no automated wardrobe entries, no model promotion.
"""
from pathlib import Path
import hashlib, io, json, sys, time, urllib.request
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageDraw
sys.path.insert(0,str(Path('benchmark').resolve()))
from deepfashion_instance_decode import decode,instance_overlap_review
from deepfashion_review_risks import review_instance_scene,category_union_preview
from deepfashion_mask_seed import proposal_seed
from whole_outfit_review_packet import make_complete_review_packet
D=Path(sys.argv[1] if len(sys.argv)>1 else "benchmark/deepfashion-instance-review")
R=Path("benchmark")
M=json.loads((R/"deepfashion-instance-onnx-reference.json").read_text())
L=json.loads((R/"locked-photo-sources.json").read_text())
V=json.loads((R/"manifest-visible-legwear-2.json").read_text())
F=json.loads((R/"manifest-fresh-11.json").read_text())
SUITE=json.loads((R/"deepfashion-real-photo-suite.json").read_text())
S={v["id"]:v for v in L+V+F}
if SUITE.get("realPhotoCount")!=10 or len(SUITE.get("cases",[]))!=10:
    raise ValueError("The independent ten-photo trial is incomplete")
CASES=SUITE["cases"]
IDS=[case["id"] for case in CASES]
if len(set(IDS))!=len(IDS):
    raise ValueError("Duplicate photo identity in test suite")
CATEGORIES={"Bottoms":("shorts","trousers","skirt"),
 "Dresses":("short_sleeve_dress","long_sleeve_dress","vest_dress","sling_dress"),
 "Outerwear":("short_sleeve_outwear","long_sleeve_outwear"),
 "Shoes":(), "Layered":()}
if (any(case.get("expectedCategory") not in CATEGORIES or
        case.get("photoContext") not in ("worn","flat-lay","retail","product")
        or not isinstance(case.get("reason"),str)
        or case.get("expectedTypeHint") not in
            ("shorts","trousers","dress","outerwear","shoes","mixed")
        for case in CASES)
        or not all(id in S for id in IDS)):
    raise ValueError("Unverified trial scenario")
digest=lambda b:hashlib.sha256(b).hexdigest()

def model_path():
    if M["license"]!="Apache-2.0" or not M["researchOnly"]:
        raise ValueError("Unapproved model provenance")
    path=D/M["file"]
    if path.exists() and digest(path.read_bytes())==M["sha256"]:return path
    path.unlink(missing_ok=True)
    url="https://huggingface.co/"+M["modelRepo"]+"/resolve/"+M["revision"]+"/"+M["file"]
    temp=path.with_suffix(".partial");h=hashlib.sha256();total=0
    with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"ClosetCurrentOfflineResearch/1.0"}),timeout=90) as stream,temp.open("wb") as file:
        while True:
            part=stream.read(1<<20)
            if not part:break
            total+=len(part)
            if total>20_000_000:raise ValueError("Model exceeds pinned expected size")
            file.write(part);h.update(part)
    if h.hexdigest()!=M["sha256"]:
        temp.unlink(missing_ok=True);raise ValueError("Pinned ONNX checksum mismatch")
    temp.replace(path);return path

def photo(row):
    if row.get("verified") is not True or row["id"] not in IDS:
        raise ValueError("Source identity not approved")
    data=(R/"photos"/row["image"]).read_bytes()
    if digest(data)!=row["sha256"]:raise ValueError("Original source changed")
    img=Image.open(io.BytesIO(data));img.load();return img.convert("RGB")

def letterbox(img,n):
    w,h=img.size;r=min(n/w,n/h);nw=max(1,round(w*r));nh=max(1,round(h*r))
    x=(n-nw)//2;y=(n-nh)//2
    canvas=Image.new("RGB",(n,n),(114,114,114))
    canvas.paste(img.resize((nw,nh),Image.Resampling.BILINEAR),(x,y))
    inp=np.asarray(canvas,dtype=np.float32).transpose((2,0,1))[None]/255.0
    return inp,dict(originalWidth=w,originalHeight=h,scale=r,xPad=x,yPad=y,inputSize=n)

def main():
    if len(M["classes"])!=13 or M["classes"][8]!="skirt":
        raise ValueError("Unsupported garment labels")
    D.mkdir(parents=True,exist_ok=True)
    report=dict(status="running",model=M["modelRepo"],revision=M["revision"],
      modelHashVerified=False,sourceHashesVerified=False,
      originalPhotosPreserved=True,parsedInstanceMasks=0,
      automaticItemsCreated=0,customerModelChanged=False,
      independentReferencesAvailable=False,paidServicesUsed=False,cases=[])
    save=lambda:(D/"summary.json").write_text(json.dumps(report,indent=2))
    save();photos=[(S[c["id"]],photo(S[c["id"]]),c) for c in CASES]
    review_dir=D/"independent-outline-review"
    seed_dir=review_dir/"model-seeds"
    original_dir=review_dir/"original-photos"
    seed_dir.mkdir(parents=True,exist_ok=True)
    original_dir.mkdir(parents=True,exist_ok=True)
    focus={"commons-0035","validation-0017","commons-0049",
           "commons-0065","validation-0031"}
    review_entries=[]
    path=model_path();report["modelHashVerified"]=True
    opts=ort.SessionOptions();opts.intra_op_num_threads=4
    session=ort.InferenceSession(str(path),sess_options=opts,providers=["CPUExecutionProvider"])
    path.unlink(missing_ok=True)
    inputs=session.get_inputs()
    if len(inputs)!=1 or inputs[0].type!="tensor(float)":
        raise ValueError("Unexpected ONNX input")
    shape=inputs[0].shape
    if len(shape)!=4 or shape[1]!=3 or shape[2]!=shape[3]:
        raise ValueError("Unknown model input shape")
    n=shape[2] if isinstance(shape[2],int) else 416
    if n not in (416,640):raise ValueError("Unexpected model size")
    report["onnxInputs"]=[dict(name=i.name,shape=i.shape,type=i.type) for i in inputs]
    report["onnxOutputs"]=[dict(name=o.name,shape=o.shape,type=o.type) for o in session.get_outputs()]
    for row,img,scenario in photos:
        tensor,transform=letterbox(img,n)
        start=time.perf_counter()
        outputs=session.run(None,{inputs[0].name:tensor})
        ms=round((time.perf_counter()-start)*1000)
        if any(not np.isfinite(x).all() for x in outputs):
            raise ValueError("Nonfinite model prediction")
        ranked=sorted(outputs[0][0],key=lambda r:float(r[4]),reverse=True)
        print("DEEPFASHION_RAW_DETECTION_HEAD "+json.dumps({
          "photo":row["id"],
          "topSixColumns":[[round(float(x),3) for x in rec[:6]] for rec in ranked[:8]]
        }),flush=True)
        decoded=decode(outputs[0],outputs[1],transform)
        candidates=decoded["candidates"]
        baseline=decode(outputs[0],outputs[1],transform,max_candidates=8)
        old=baseline["candidates"]
        unchanged=len(candidates)>=len(old) and all(
            a["itemType"]==b["itemType"] and a["score"]==b["score"] and
            np.array_equal(a["mask"],b["mask"])
            for a,b in zip(old,candidates))
        if not unchanged:raise ValueError("Baseline proposal pixels changed")
        coverage_comparison=dict(baselineLimit=8,candidateLimit=20,
            baselineProposals=len(old),candidateProposals=len(candidates),
            baselineMasksUnchanged=unchanged,
            additionalUnapprovedProposals=len(candidates)-len(old),
            additionalProposalTypes=[c["itemType"] for c in candidates[len(old):]],
            baselineCoverage=baseline["proposalCoverage"],
            recoveredPhysicalGarments=None,realPhotoAccuracyImprovement=None)
        overlap=instance_overlap_review(candidates)
        exported=[]
        for index,candidate in enumerate(candidates,1):
            seed=proposal_seed(row,candidate,index,M["modelRepo"]+"@"+M["revision"])
            stem=f'{row["id"]}-candidate-{index:02d}'
            destination=seed_dir/(stem+".prediction.json")
            destination.write_text(json.dumps(seed,separators=(",",":")))
            exported.append({"id":stem,"prediction":str(destination.relative_to(D)),
                "label":candidate["itemType"],"confidence":seed["modelConfidence"],
                "referenceStatus":"pending-human-annotation",
                "approvedReference":None})
        review_entries.append({"id":row["id"],"image":row["image"],
             "sourceSha256":row["sha256"],"reviewFirst":row["id"] in focus,
             "candidateSeeds":exported,"allMasksUnapproved":True,
             "userPhotoModified":False,
             "exactOriginalIncludedForReview":True,
             "attribution":row["attribution"]})
        risk=review_instance_scene(
            [{"itemType":x["itemType"]} for x in candidates],
            scenario["expectedCategory"],scenario["expectedTypeHint"],overlap)
        reviewUnions=[]
        for broad in ("Bottoms","Outerwear","Dresses","Tops"):
            part=category_union_preview(candidates,broad)
            if part is None:continue
            mask=Image.fromarray(part["sourceMaskUnion"].astype(np.uint8)*255,'L')
            rgba=img.copy().convert('RGBA')
            rgba.putalpha(mask)
            panel_bg=Image.new('RGBA',img.size,(235,235,240,255))
            panel_bg.alpha_composite(rgba)
            width_r=400
            height_r=max(1,round(img.height*width_r/img.width))
            comparative=Image.new('RGB',(width_r*2,height_r+72),'white')
            comparative.paste(img.resize((width_r,height_r),Image.Resampling.LANCZOS),(0,72))
            comparative.paste(panel_bg.convert('RGB').resize(
                (width_r,height_r),Image.Resampling.LANCZOS),(width_r,72))
            text=ImageDraw.Draw(comparative)
            text.text((8,10),'Original unchanged source',fill='black')
            text.text((width_r+8,10),'Candidate panel union — not verified',fill='black')
            text.text((8,42),f'{broad}: {part["modelProposals"]} proposals, no wardrobe save',fill='black')
            comparative.save(D/(row["id"]+"-"+broad.lower()+"-union-review.png"))
            reviewUnions.append({k:v for k,v in part.items() if k!="sourceMaskUnion"})
        width=400;height=max(1,round(img.height*width/img.width))
        original=img.resize((width,height),Image.Resampling.LANCZOS)
        source=np.asarray(img).copy()
        colorful=source.copy();alpha=np.zeros(source.shape[:2],dtype=np.uint8)
        colors=[(225,68,122),(24,137,202),(219,143,42),(77,169,101)]
        for ix,c in enumerate(candidates):
            colorful[c["mask"]]=colors[ix%len(colors)]
            alpha[c["mask"]]=115
        overlay=Image.composite(Image.fromarray(colorful),img,Image.fromarray(alpha,'L'))
        overlay=overlay.resize((width,height),Image.Resampling.LANCZOS)
        panel=Image.new('RGB',(width*2,height+72),'white')
        panel.paste(original,(0,72));panel.paste(overlay,(width,72))
        draw=ImageDraw.Draw(panel)
        draw.text((10,10),'Original verified RGB',fill='black')
        draw.text((width+10,10),'Separate instance mask proposals',fill='black')
        caption=', '.join(x['itemType'] for x in candidates[:5]) or 'No masks above threshold'
        draw.text((10,40),caption,fill='black')
        # Overlaps are warnings, not license to remove real layers.
        draw.text((width+10,40),
          str(overlap["ambiguousProposalCount"])+" potentially duplicate/overlapping masks",
          fill='black')
        panel.save(D/(row['id']+'-instance-overlays.png'))
        broad=scenario["expectedCategory"]
        proposed_kinds=[x["itemType"] for x in candidates]
        comparison={"expectedBroadCategoryContextOnly":broad,
         "sourcePhotoContext":scenario["photoContext"],
         "categorySupportedByThisModel":broad not in ("Shoes","Layered"),
         "matchingBroadClassProposals":
             sum(kind in CATEGORIES[broad] for kind in proposed_kinds)
             if broad not in ("Shoes","Layered") else None,
         "negativeFootwearControl":broad=="Shoes",
         "contextCategoryIsNotGroundTruth":True,
         "instancePrecisionRecallMeasured":False}
        case=dict(id=row["id"],sourceSha256=row["sha256"],source=row["attribution"]["source"],
          license=row["attribution"]["license"],modelOutputShapes=[list(x.shape) for x in outputs],
          sourceGeometry=transform,cpuInferenceMs=ms,instanceMasksVerified=0,
          masksNotDecoded=False,proposedMasks=len(candidates),
          proposalCoverage=decoded["proposalCoverage"],
          proposalLimitComparison=coverage_comparison,
          independentHumanReferenceCount=0,
          candidateSeedsExported=len(exported),
          unapprovedSeedFiles=[x["prediction"] for x in exported],
          categoryCoverageReview=comparison,manualReviewRisk=risk,
          unverifiedCategoryUnions=reviewUnions,
          overlapReview={k:v for k,v in overlap.items()},
          proposals=[dict(itemType=c["itemType"],confidence=round(c["score"],3),
            pixelArea=c["pixels"]) for c in candidates],
          automaticItemsSaved=0,originalPreserved=True)
        report["cases"].append(case);save()
        print("DEEPFASHION_INSTANCE_PROFILE "+json.dumps(case),flush=True)
    review_index={"status":"awaiting-independent-human-outlines",
      "imageCount":len(review_entries),"approvedReferences":0,
      "pendingIndividualPredictions":sum(len(x["candidateSeeds"]) for x in review_entries),
      "predictionMasksAreGroundTruth":False,
      "automaticCustomerMaskPromotion":False,
      "sourcePhotosPreserved":True,"cases":review_entries}
    (review_dir/"reference-review-index.json").write_text(json.dumps(review_index,indent=2))
    # All ten originals are essential for independent full-photo inventory:
    # five reviewFirst originals previously left five other scenes unscorable.
    original_packet=make_complete_review_packet(
        review_dir,R/"photos",review_entries,expected_count=SUITE["realPhotoCount"])
    if original_packet["verifiedOriginalCount"]!=len(review_entries):
        raise ValueError("Partial real-photo review packet cannot be scored")
    report["independentReferenceReview"]=dict(status=review_index["status"],
      approvedReferences=0,predictions=review_index["pendingIndividualPredictions"],
      originalPhotosIncluded=sum(x["exactOriginalIncludedForReview"] for x in review_entries),
      canPromoteModel=False)
    report["parsedInstanceMasks"]=sum(c["proposedMasks"] for c in report["cases"])
    from collections import Counter
    report["manualReviewRiskCounts"]=dict(Counter(
        flag for c in report["cases"] for flag in c["manualReviewRisk"]["manualReviewFlags"]))
    report["status"]="complete";report["sourceHashesVerified"]=True;save()

if __name__=="__main__":main()
