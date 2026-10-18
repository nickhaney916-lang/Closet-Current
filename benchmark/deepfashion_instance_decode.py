"""Experimental pinned DeepFashion ONNX instance mask decoder; no autosaving."""
import numpy as np
from PIL import Image

NAMES=["short_sleeve_top","long_sleeve_top","short_sleeve_outwear",
 "long_sleeve_outwear","vest","sling","shorts","trousers","skirt",
 "short_sleeve_dress","long_sleeve_dress","vest_dress","sling_dress"]

def decode(decs,proto,geo,threshold=.20):
    d=np.asarray(decs);p=np.asarray(proto)
    n=geo["inputSize"];w=geo["originalWidth"];h=geo["originalHeight"]
    xp=geo["xPad"];yp=geo["yPad"];ratio=geo["scale"]
    if (d.shape!=(1,300,38) or p.ndim!=4 or p.shape[0]!=1 or
       p.shape[1]!=32 or p.shape[2]!=p.shape[3] or p.shape[2]!=n//4 or
       not np.isfinite(d).all() or not np.isfinite(p).all() or
       n not in (416,640) or w*h>12_000_000 or w<1 or h<1 or
       not .05<=threshold<=.9):
        raise ValueError("Unknown/unsafe ONNX instance output")
    nw=round(w*ratio);nh=round(h*ratio)
    if not (0<=xp and 0<=yp and nw>0 and nh>0 and xp+nw<=n and yp+nh<=n):
        raise ValueError("Incorrect source-photo letterbox geometry")
    xx,yy=np.meshgrid(np.arange(n),np.arange(n))
    result=[];protop=p.shape[-1];flat=p[0].reshape(32,protop*protop)
    for row in sorted(d[0],key=lambda r:float(r[4]),reverse=True):
        conf=float(row[4])
        if conf<threshold:break
        cls=int(round(float(row[5])));box=row[:4]
        if not (0<=conf<=1 and 0<=cls<13 and abs(cls-row[5])<1e-4 and
           0<=box[0]<box[2]<=n+1 and 0<=box[1]<box[3]<=n+1):
            raise ValueError("Invalid garment class/box, possible unknown ONNX format")
        logits=np.clip(row[6:38]@flat,-40,40).reshape(protop,protop)
        probabilities=1/(1+np.exp(-logits))
        preview=Image.fromarray((probabilities*255).astype(np.uint8),'L').resize((n,n),Image.Resampling.BILINEAR)
        mask=np.asarray(preview)>127
        mask &= (xx>=box[0])&(xx<box[2])&(yy>=box[1])&(yy<box[3])
        native=Image.fromarray(mask[yp:yp+nh,xp:xp+nw].astype(np.uint8)*255,'L')
        original=np.asarray(native.resize((w,h),Image.Resampling.NEAREST))>127
        area=int(original.sum())
        if area<32:continue
        result.append(dict(itemType=NAMES[cls],classId=cls,score=conf,
            pixels=area,mask=original))
        if len(result)==8:break
    return dict(candidates=result,physicalInstancesVerified=0,
        pixelGroundTruthAccuracy=None,automaticSavedItems=0,
        sourcePhotoChanged=False,productionAuthorized=False)
