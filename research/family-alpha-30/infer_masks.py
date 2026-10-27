"""Offline U2NETP saliency experiment. No photo/model downloads in this script.
Model proposes alpha only; original RGB is applied by JS from independently
sha-verified native JPEG. Saliency is NOT garment/person semantic segmentation.
"""
import argparse,hashlib,json,time
from pathlib import Path
import numpy as np
import onnxruntime as ort
from PIL import Image,ImageOps
import PIL
p=argparse.ArgumentParser();p.add_argument('--model',required=True);p.add_argument('--output',required=True);a=p.parse_args()
model=Path(a.model);expected='309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8'
if hashlib.sha256(model.read_bytes()).hexdigest()!=expected:raise ValueError('Model checksum mismatch')
opts=ort.SessionOptions();opts.intra_op_num_threads=2;opts.inter_op_num_threads=1
session=ort.InferenceSession(str(model),sess_options=opts,providers=['CPUExecutionProvider'])
out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
labels=json.loads(Path('research/family-alpha-30/labels.json').read_text());sources={r['id']:r for r in json.loads(Path('benchmark/locked-photo-sources.json').read_text())};results=[]
for label in labels['rows']:
 row=sources[label['id']];path=Path('benchmark/fixtures')/row['image'];raw=path.read_bytes()
 if hashlib.sha256(raw).hexdigest()!=row['sha256']:raise ValueError('Original checksum mismatch')
 original=ImageOps.exif_transpose(Image.open(path)).convert('RGB');w,h=original.size
 if w*h>8_000_000:raise ValueError('Native image exceeds bounded decoder size')
 # Explicit ImageNet-style normalization, 320 square; alpha-only output.
 im=np.array(original.resize((320,320),Image.Resampling.LANCZOS)).astype(np.float32)/255.0
 im=(im-np.array([.485,.456,.406],dtype=np.float32))/np.array([.229,.224,.225],dtype=np.float32)
 tensor=np.transpose(im,(2,0,1))[None,...].astype(np.float32)
 start=time.perf_counter();pred=session.run(None,{session.get_inputs()[0].name:tensor})[0][0,0];elapsed=time.perf_counter()-start
 lo,hi=float(pred.min()),float(pred.max());mask=np.zeros_like(pred) if hi-lo<1e-6 else np.clip((pred-lo)/(hi-lo),0,1)
 alpha=Image.fromarray(np.uint8(mask*255),'L').resize((w,h),Image.Resampling.LANCZOS)
 target=out/(row['id']+'-alpha.png');alpha.save(target)
 results.append({'id':row['id'],'sourceSHA256':row['sha256'],'modelSHA256':expected,'onnxruntimeVersion':ort.__version__,'numpyVersion':np.__version__,'pillowVersion':PIL.__version__,'nativeSize':[w,h],'modelInput':[320,320],'inferenceSeconds':round(elapsed,4),'alphaSHA256':hashlib.sha256(target.read_bytes()).hexdigest()})
 print(row['id'],round(elapsed,3),flush=True)
(out/'model-results.json').write_text(json.dumps(results,indent=2)+'\n')
