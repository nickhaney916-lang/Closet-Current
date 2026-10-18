#!/usr/bin/env python3
"""Review-only pinned garment-instance ONNX feasibility on licensed source images.
No inference over user data, no automated wardrobe entries, no model promotion.
"""
from pathlib import Path
import hashlib, io, json, sys, time, urllib.request
import numpy as np
import onnxruntime as ort
from PIL import Image
D=Path(sys.argv[1] if len(sys.argv)>1 else "benchmark/deepfashion-instance-review")
R=Path("benchmark")
M=json.loads((R/"deepfashion-instance-onnx-reference.json").read_text())
L=json.loads((R/"locked-photo-sources.json").read_text())
V=json.loads((R/"manifest-visible-legwear-2.json").read_text())
S={v["id"]:v for v in L+V}
IDS=["validation-0031","commons-0059"]
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
    save();photos=[(S[i],photo(S[i])) for i in IDS]
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
    for row,img in photos:
        tensor,transform=letterbox(img,n)
        start=time.perf_counter()
        outputs=session.run(None,{inputs[0].name:tensor})
        ms=round((time.perf_counter()-start)*1000)
        if any(not np.isfinite(x).all() for x in outputs):
            raise ValueError("Nonfinite model prediction")
        case=dict(id=row["id"],sourceSha256=row["sha256"],source=row["attribution"]["source"],
          license=row["attribution"]["license"],modelOutputShapes=[list(x.shape) for x in outputs],
          sourceGeometry=transform,cpuInferenceMs=ms,instanceMasksVerified=0,
          masksNotDecoded=True,automaticItemsSaved=0,originalPreserved=True)
        report["cases"].append(case);save()
        print("DEEPFASHION_INSTANCE_PROFILE "+json.dumps(case),flush=True)
    report["status"]="complete";report["sourceHashesVerified"]=True;save()

if __name__=="__main__":main()
