"""Verify the actual downloaded inference graphs against publisher LFS SHA."""
import hashlib,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
spec=json.loads((root/'research/parallel67-reference/reference-sources.json').read_text())
expected={
 'onnx-community/Florence-2-base-ft':['onnx/'+name+'_quantized.onnx' for name in ['decoder_model_merged','embed_tokens','encoder_model','vision_encoder']],
 'onnx-community/sam2.1-hiera-tiny-ONNX':['onnx/'+name+'_quantized.onnx'+suffix for name in ['vision_encoder','prompt_encoder_mask_decoder'] for suffix in ['', '_data']]
}
receipts=[]
for model_id,files in expected.items():
    model=next(x for x in spec['models'] if x['id']==model_id)
    for filename in files:
        record=next(x for x in model['files'] if x['path']==filename)
        data=(root/'node_modules/@huggingface/transformers/.cache'/model_id/model['revision']/filename).read_bytes()
        sha=hashlib.sha256(data).hexdigest()
        if sha!=record['sha256'] or len(data)!=record['bytes']:raise ValueError('Pinned model graph/data SHA mismatch: '+filename)
        receipts.append({'model':model_id,'revision':model['revision'],'path':filename,'bytes':len(data),'sha256':sha})
(root/'research/parallel67-reference/results/verified-model-bytes.json').write_text(json.dumps(receipts,indent=2)+'\n')
print('Verified',len(receipts),'actual pinned model graph/data files')
