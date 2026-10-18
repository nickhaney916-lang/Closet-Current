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
           -n*.05<=box[0]<box[2]<=n*1.05 and
           -n*.05<=box[1]<box[3]<=n*1.05):
            raise ValueError("Invalid garment class/box, possible unknown ONNX format")
        # YOLO boxes can extend a few pixels beyond the letterbox canvas.
        # Clamp only after checking that extension is bounded and finite.
        box=np.clip(box,0,n)
        if box[2]<=box[0] or box[3]<=box[1]:
            continue
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


def instance_overlap_review(candidates, *, iou_threshold=.65, nested_threshold=.90):
    """Expose conflicting overlapping instance masks without deleting any.

    An outer jacket can legitimately overlap an inner top. Both duplicate
    proposals and genuine layered items therefore remain human-review-only.
    """
    if (not isinstance(candidates,list) or len(candidates)>20 or
        not 0.3<=iou_threshold<=.95 or not 0.7<=nested_threshold<=1):
        raise ValueError("Invalid overlap review request")
    flagged=[];matched=set()
    for i,a in enumerate(candidates):
        m=a.get("mask")
        if (not isinstance(m,np.ndarray) or m.dtype!=bool or m.ndim!=2 or
            not 0<m.size<=12_000_000):
            raise ValueError("Invalid instance evidence pixels")
        for j,b in enumerate(candidates[:i]):
            n=b.get("mask")
            if not isinstance(n,np.ndarray) or n.shape!=m.shape or n.dtype!=bool:
                raise ValueError("Mismatched mask dimensions")
            intersection=int(np.count_nonzero(m&n))
            count_a=int(m.sum());count_b=int(n.sum())
            union=count_a+count_b-intersection
            iou=intersection/max(1,union)
            nested=intersection/max(1,min(count_a,count_b))
            if iou>=iou_threshold or nested>=nested_threshold:
                matched.update((i,j))
                flagged.append(dict(firstIndex=j,secondIndex=i,
                    overlapIoU=round(iou,4),smallerMaskOverlap=round(nested,4),
                    crossCategory= a.get("classId")!=b.get("classId"),
                    reason="possible-same-garment-or-layered-clothing",
                    independentlyVerifiedSeparateItems=False))
    return dict(conflicts=flagged,ambiguousProposalCount=len(matched),
        inputCandidates=len(candidates),independentInstancesVerified=0,
        canAutoSaveAnyProposal=False,originalSourceChanged=False,
        pixelAccuracyMeasured=False)
