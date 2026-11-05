import test from 'node:test';
import assert from 'node:assert/strict';
import {allowedFashionClipAsset52,MODEL52_REVISION,SEGFORMER52_REVISION,modelAssetFamily52} from '../research/model-asset-reliability-52/asset-policy.mjs';
const request=(url,method='GET')=>({url:()=>url,method:()=>method});
const good=[
 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js',
 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/ort-wasm-simd-threaded.jsep.wasm',
 'https://huggingface.co/ff13/fashion-clip/resolve/'+MODEL52_REVISION+'/config.json',
 'https://huggingface.co/ff13/fashion-clip/resolve/'+MODEL52_REVISION+'/preprocessor_config.json',
 'https://huggingface.co/api/resolve-cache/models/ff13/fashion-clip/'+MODEL52_REVISION+'/preprocessor_config.json',
 'https://huggingface.co/api/resolve-cache/models/ff13/fashion-clip/'+MODEL52_REVISION+'/config.json',
 'https://us.aws.cdn.hf.co/xet-bridge-us/real-file',
 'https://cas-bridge.xethub.hf.co/xet-bridge/real-file',
 'https://cas-server.xethub.hf.co/file',
 'https://transfer.xethub.hf.co/file'
];
test('MODEL52 allows actual observed pinned vision model runtime and revision-specific HF cache redirects',()=>{
 for(const url of good)assert.equal(allowedFashionClipAsset52(request(url)),true,url);
});
test('MODEL52 never permits user photo exfil over POST/PUT/DELETE/HEAD, even to approved model hosts',()=>{
 for(const url of good)for(const method of ['POST','PUT','PATCH','DELETE','HEAD'])
  assert.equal(allowedFashionClipAsset52(request(url,method)),false,url+' '+method);
});
test('MODEL52 blocks unpinned model versions, other repositories, deceptive hosts, insecure HTTP and URL credentials',()=>{
 for(const url of [
  'https://huggingface.co/ff13/fashion-clip/resolve/main/config.json',
  'https://huggingface.co/other-owner/fashion-clip/resolve/'+MODEL52_REVISION+'/config.json',
  'https://huggingface.co/api/resolve-cache/models/ff13/other-model/'+MODEL52_REVISION+'/config.json',
  'https://huggingface.co/api/resolve-cache/models/ff13/fashion-clip/other-commit/config.json',
  'https://huggingface.co.evil.invalid/ff13/fashion-clip/resolve/'+MODEL52_REVISION+'/config.json',
  'https://cdn.jsdelivr.net.evil.invalid/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js',
  'http://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js',
  'https://user:password@huggingface.co/ff13/fashion-clip/resolve/'+MODEL52_REVISION+'/config.json',
  'https://us.aws.cdn.hf.co/unrelated/file',
  'data:image/jpeg;base64,AAAA',
  'file:///private/owner-photo.jpg'
 ])assert.equal(allowedFashionClipAsset52(request(url)),false,url);
});
test('MODEL52 invalid opaque network requests default to blocked',()=>{
 for(const arg of [null,undefined,{}, {url:()=>{throw Error('no URL');},method:()=> 'GET'},{url:()=> 'bad-url',method:()=> 'GET'}])
  assert.equal(allowedFashionClipAsset52(arg),false);
});

test('MODEL52 archived browser failure belongs to optional blocked SegFormer, not FashionCLIP',()=>{
 const seg={host:'huggingface.co',method:'GET',
  path:'/Xenova/segformer_b0_clothes/resolve/'+SEGFORMER52_REVISION+'/preprocessor_config.json'};
 assert.equal(modelAssetFamily52(seg),'optional-segformer');
 assert.equal(modelAssetFamily52({host:'huggingface.co',
  path:'/api/resolve-cache/models/Xenova/segformer_b0_clothes/'+SEGFORMER52_REVISION+'/preprocessor_config.json'}),'optional-segformer');
 assert.equal(modelAssetFamily52({host:'huggingface.co',
  path:'/ff13/fashion-clip/resolve/'+MODEL52_REVISION+'/config.json'}),'fashionclip');
 assert.equal(modelAssetFamily52({host:'huggingface.co',
  path:'/api/resolve-cache/models/ff13/fashion-clip/'+MODEL52_REVISION+'/config.json'}),'fashionclip');
 assert.equal(modelAssetFamily52({host:'huggingface.co',
  path:'/Xenova/segformer_b0_clothes/resolve/main/config.json'}),'unknown');
 assert.equal(modelAssetFamily52({host:'huggingface.co',
  path:'/ff13/other-model/resolve/'+MODEL52_REVISION+'/config.json'}),'unknown');
});
