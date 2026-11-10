"""P786 real ONNX segmentation postprocessor; research only, never release.

The ONNX model produces [1,300,38]: x1 y1 x2 y2 confidence class 32
mask coefficients; and [1,32,104,104] mask prototypes. The contract was
independently observed on all 6 SHA-pinned original JPEGs before decoding.
No source-dependent thresholds or ground-truth-informed candidate selection.
"""
import hashlib
import numpy as np
from PIL import Image, ImageDraw

MODEL_FAMILY={0:'Tops',1:'Tops',2:'Outerwear',3:'Outerwear',
 4:'Outerwear',5:'Tops',6:'Bottoms',7:'Bottoms',8:'Bottoms',
 9:'Dresses',10:'Dresses',11:'Dresses',12:'Dresses'}
PUBLISHER_FAMILY={0:'Tops',1:'Tops',2:'Tops',3:'Outerwear',
 4:'Outerwear',5:'Outerwear',6:'Bottoms',7:'Bottoms',8:'Bottoms',
 9:'Outerwear',10:'Dresses',11:'Dresses',23:'Shoes'}
CONF_THRESHOLD=0.25
BOX_NMS_IOU=0.60
MASK_IOU_MATCH=0.50
MAX_PROPOSALS=32

def sha(mask):
    return hashlib.sha256(np.asarray(mask,dtype=np.uint8).tobytes()).hexdigest()

def box_iou(a,b):
    x1=max(a[0],b[0]);y1=max(a[1],b[1])
    x2=min(a[2],b[2]);y2=min(a[3],b[3])
    inter=max(0,x2-x1)*max(0,y2-y1)
    aa=max(0,a[2]-a[0])*max(0,a[3]-a[1])
    ab=max(0,b[2]-b[0])*max(0,b[3]-b[1])
    return inter/(aa+ab-inter) if aa+ab>inter else 0.

def source_truth(original,width,height):
    truth=[]
    for a in original['annotations']:
        canvas=Image.new('L',(width,height),0)
        draw=ImageDraw.Draw(canvas)
        for polygon in a.get('segmentation',[]):
            if len(polygon)<6 or len(polygon)%2:
                raise ValueError('publisher polygon missing/truncated')
            points=[(float(polygon[i]),float(polygon[i+1]))
                    for i in range(0,len(polygon),2)]
            if any(not(np.isfinite(x) and np.isfinite(y)) for x,y in points):
                raise ValueError('publisher polygon nonfinite')
            draw.polygon(points,fill=1)
        binary=np.asarray(canvas,dtype=np.uint8).copy()
        if not binary.any():
            raise ValueError('publisher has empty original-resolution real polygon')
        truth.append({'id':int(a['id']),'categoryId':int(a['category_id']),
                      'category':PUBLISHER_FAMILY.get(int(a['category_id']),'Unsupported'),
                      'mask':binary,'area':int(binary.sum()),
                      'maskSHA256':sha(binary)})
    return truth

def choose_detections(detections,side):
    if detections.shape!=(1,300,38):
        raise ValueError('unexpected real ONNX detector contract')
    candidates=[]
    for i,d in enumerate(detections[0]):
        x1,y1,x2,y2,conf,class_number=d[:6]
        if conf<CONF_THRESHOLD:continue
        if not(np.isfinite(d).all() and np.isfinite(class_number)):
            raise ValueError('nonfinite actual ONNX detected clothing proposal')
        c=round(float(class_number))
        if abs(c-float(class_number))>1e-4 or c not in MODEL_FAMILY:
            raise ValueError('unsupported model class index / score contract')
        x1=max(0.0,min(float(side),float(x1)))
        y1=max(0.0,min(float(side),float(y1)))
        x2=max(0.0,min(float(side),float(x2)))
        y2=max(0.0,min(float(side),float(y2)))
        if x2-x1<1 or y2-y1<1:continue
        candidates.append({'row':i,'confidence':float(conf),'classId':c,
                           'category':MODEL_FAMILY[c],
                           'box':[x1,y1,x2,y2],
                           'coefficients':d[6:].astype(np.float32)})
    candidates.sort(key=lambda x:(-x['confidence'],x['row']))
    selected=[]
    for p in candidates:
        if any(q['classId']==p['classId'] and box_iou(q['box'],p['box'])>=BOX_NMS_IOU
               for q in selected):
            continue
        selected.append(p)
        if len(selected)>=MAX_PROPOSALS:break
    return selected,len(candidates)

def decode_real_mask(prototypes,p,meta):
    side=meta['side'];width=meta['width'];height=meta['height']
    nw=meta['newWidth'];nh=meta['newHeight'];px=meta['padX'];py=meta['padY']
    if prototypes.shape!=(1,32,side//4,side//4):
        raise ValueError('prototype shape incompatible with actual ONNX')
    coefficients=p['coefficients']
    if coefficients.shape!=(32,):
        raise ValueError('actual model mask coefficient dimensions wrong')
    raw=np.tensordot(coefficients,prototypes[0],axes=(0,0))
    raw=np.clip(raw,-45.0,45.0)
    probs=(1.0/(1.0+np.exp(-raw))).astype(np.float32)
    # Bilinear interpolation of the real model's 104x104 mask prototype into
    # the 416x416 letterbox, clipped to the actual detected box in that space.
    im=Image.fromarray(probs,mode='F').resize((side,side),Image.Resampling.BILINEAR)
    full=np.asarray(im,dtype=np.float32).copy()
    yy,xx=np.ogrid[:side,:side]
    x1,y1,x2,y2=p['box']
    full[(xx<x1)|(xx>=x2)|(yy<y1)|(yy>=y2)]=0
    source_crop=full[py:py+nh,px:px+nw]
    if source_crop.shape!=(nh,nw):
        raise ValueError('letterbox original image crop dimension mismatch')
    source=Image.fromarray(source_crop,mode='F').resize(
        (width,height),Image.Resampling.BILINEAR)
    binary=(np.asarray(source,dtype=np.float32)>0.5).astype(np.uint8)
    return binary

def reconstruct(proposals,prototype,meta):
    predictions=[]
    for p in proposals:
        mask=decode_real_mask(prototype,p,meta)
        if not mask.any():continue
        x1,y1,x2,y2=p['box']
        ratio=meta['scale'];px=meta['padX'];py=meta['padY']
        bounds=[max(0,round((x1-px)/ratio)),max(0,round((y1-py)/ratio)),
                min(meta['width'],round((x2-px)/ratio)),
                min(meta['height'],round((y2-py)/ratio))]
        predictions.append({'row':p['row'],'category':p['category'],
            'classId':p['classId'],'confidence':p['confidence'],
            'mask':mask,'maskSHA256':sha(mask),
            'area':int(mask.sum()),'originalSourceBounds':bounds})
    return predictions

def match_instances(truth,predictions):
    # This is maximum-cardinality, deterministic one-to-one *mask* IoU>=.5,
    # NOT box IoU, not a manually selected subset, and not claimed official AP.
    eligible=[]
    for i,t in enumerate(truth):
        for j,p in enumerate(predictions):
            if t['category']!=p['category']:continue
            a=t['mask'].astype(bool);b=p['mask'].astype(bool)
            intersection=np.count_nonzero(a&b)
            union=np.count_nonzero(a|b)
            iou=intersection/union if union else 0
            if iou>=MASK_IOU_MATCH:
                eligible.append((i,j,float(iou)))
    graph={}
    for i,j,iou in sorted(eligible,key=lambda x:(-x[2],x[0],x[1])):
        graph.setdefault(i,[]).append((j,iou))
    paired={}
    def augment(i,seen):
        for j,iou in graph.get(i,[]):
            if j in seen:continue
            seen.add(j)
            if j not in paired or augment(paired[j][0],seen):
                paired[j]=(i,iou)
                return True
        return False
    for i in range(len(truth)):
        augment(i,set())
    pairs=[{'publisherInstanceId':truth[i]['id'],'sourceOriginalClass':truth[i]['category'],
            'detectorRow':predictions[j]['row'],'sourceMaskIoU':iou,
            'originalPredictionSHA256':predictions[j]['maskSHA256']}
           for j,(i,iou) in sorted(paired.items())]
    tp=len(paired);fp=len(predictions)-tp;fn=len(truth)-tp
    return {'truePositives':tp,'falsePositives':fp,'falseNegatives':fn,
      'precision':tp/(tp+fp) if tp+fp else None,
      'recall':tp/(tp+fn) if tp+fn else None,
      'f1':2*tp/(2*tp+fp+fn) if 2*tp+fp+fn else None,
      'matches':pairs}
