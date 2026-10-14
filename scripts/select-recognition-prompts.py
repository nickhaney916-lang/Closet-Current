#!/usr/bin/env python3
"""Make an explicit, bounded subset of an encoded prompt candidate for testing."""
import argparse, hashlib, json
from pathlib import Path
import numpy as np
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('baseline',type=Path);p.add_argument('candidate',type=Path);p.add_argument('output',type=Path);p.add_argument('--profile',choices=['coarse','half','footwear-coarse'],required=True)
a=p.parse_args()
def load(directory):
 meta=json.loads((directory/'recognition-vectors.json').read_text());payload=(directory/'recognition-vectors.bin').read_bytes()
 assert hashlib.sha256(payload).hexdigest()==meta['sha256']
 return meta,np.frombuffer(payload,dtype='<f4').reshape(len(meta['labels']),512).copy()
m,base=load(a.baseline);n,candidate=load(a.candidate)
assert all(m[k]==n[k] for k in ['model','revision','labels','dimensions','scale'])
coarse=['a shirt, blouse, sweater, or other top','pants, shorts, or a skirt','a dress, jumpsuit, or romper','a jacket, coat, or other outerwear','a blurry image with no identifiable garment']
labels=list(n['promptEnsembles']) if a.profile=='half' else coarse+(['sneakers','ankle boots'] if a.profile=='footwear-coarse' else [])
blend=1 if a.profile=='coarse' else .5
for label in labels:
 assert label in n['promptEnsembles'];i=m['labels'].index(label);row=base[i]*(1-blend)+candidate[i]*blend;norm=np.linalg.norm(row);assert norm>1e-8;base[i]=row/norm
payload=base.astype('<f4').tobytes();m['sha256']=hashlib.sha256(payload).hexdigest();m['textEncoder']='onnx/text_model.onnx';m['promptEnsembles']={x:n['promptEnsembles'][x] for x in labels};m['promptBlend']=blend
assert np.isfinite(base).all() and np.allclose(np.linalg.norm(base,axis=1),1,atol=.001)
a.output.mkdir(parents=True,exist_ok=True);(a.output/'recognition-vectors.bin').write_bytes(payload);(a.output/'recognition-vectors.json').write_text(json.dumps(m,indent=2)+'\n')
print(a.profile,len(labels),'rows; blend',blend)
