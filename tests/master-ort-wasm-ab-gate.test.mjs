// Adversarial synthetic fixtures only, not real inference or Safari evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {compareNumericArrays,verifyWasmAB} from '../research/master-consolidation-1054/ort-wasm-ab-gate.mjs';
const commit='a'.repeat(40),sha=n=>String(n).repeat(64),id='commons-0035';
const models=['fashionclip','fashionSiglip'];
function fixture(){
 const make=flavor=>({
  status:'COMPLETE_OBSERVED',actualRuntime:flavor,browserErrors:[],
  wasmArtifact:flavor==='jsep'?'ort-wasm-simd-threaded.jsep.wasm':'ort-wasm-simd-threaded.wasm',
  wasmSha256:sha(1),jsSha256:sha(2),
  samples:4,rssComplete:true,maxSampledTreeRSSBytes:10e8,pssComplete:true,maxSampledTreePSSBytes:8e8,
  modelRuns:models.map((model,i)=>({
   sourceId:id,modelKey:model,sourceSHA256:sha(3),inputSHA256:sha(i+4),
   modelSHA256:sha(i+6),outputName:'image_embeds',outputShape:[1,3],
   outputLength:3,inferenceMs:100,values:[0.3,0.2,0.1]
  }))
 });
 return {x:{schema:'main1054-ort-direct-wasm-ab-m23-v1',codeCommit:commit,
  familyAlpha:'HOLD',releaseAuthorized:false,physicalIPhone:false,hostedCloudWrites:0,ownerAutoSaves:0,
  onnxRuntimeVersion:'1.22.0-dev.20250409-89f8206ba4',transformersVersion:'3.8.1',
  browser:'webkit-desktop-linux',sampledMemoryOnly:true,
  publicSources:[id],variants:{jsep:make('jsep'),wasm:make('wasm')}},sources:{[id]:sha(3)}};
}
test('equivalent pretrained output evidence is research-only',()=>{
 const {x,sources}=fixture(),r=verifyWasmAB(x,sources);
 assert.equal(r.status,'SOURCE_MATCHED_ONNX_INFERENCE_PARITY_NOT_RELEASE');
 assert.equal(r.releaseAuthorized,false);assert.equal(r.comparisons.length,2);
});
test('numeric comparison rejects nonfinite and unmatched vectors',()=>{
 assert.equal(compareNumericArrays([0,1],[0,1,2]),null);
 assert.equal(compareNumericArrays([NaN],[1]),null);
 assert.equal(compareNumericArrays([0,0],[0,0]),null);
});
const mutation={
 'unmatched photo hash':x=>x.variants.wasm.modelRuns[0].sourceSHA256=sha(9),
 'different preprocessing':x=>x.variants.wasm.modelRuns[0].inputSHA256=sha(9),
 'different model weights':x=>x.variants.jsep.modelRuns[1].modelSHA256=sha(9),
 'different output shape':x=>x.variants.wasm.modelRuns[0].outputShape=[3,1],
 'significant numerical drift':x=>x.variants.wasm.modelRuns[0].values=[-0.3,-0.2,-0.1],
 'nonfinite predictions':x=>x.variants.wasm.modelRuns[0].values=[NaN,0.2,0.1],
 'missing model output':x=>x.variants.jsep.modelRuns.pop(),
 'worker failed':x=>x.variants.wasm.status='BLOCKED',
 'missing non-JSEP binary':x=>x.variants.wasm.wasmArtifact='ort-wasm-simd-threaded.jsep.wasm',
 'fake JSEP build':x=>x.variants.jsep.wasmArtifact='ort-wasm-simd-threaded.wasm',
 'missing binary integrity':x=>x.variants.jsep.wasmSha256='no',
 'memory PSS missing':x=>x.variants.wasm.pssComplete=false,
 'zero RSS':x=>x.variants.wasm.maxSampledTreeRSSBytes=0,
 'network or JS error':x=>x.variants.wasm.browserErrors.push('network fetch external'),
 'changed runtime version':x=>x.onnxRuntimeVersion='1.31.0',
 'fake phone acceptance':x=>x.physicalIPhone=true,
 'unauthorized save':x=>x.ownerAutoSaves=1,
 'hosted cloud write':x=>x.hostedCloudWrites=1,
 'release unauthorized':x=>x.releaseAuthorized=true
};
for(const [name,f] of Object.entries(mutation))test('blocks '+name,()=>{
 const {x,sources}=fixture();f(x);
 assert.equal(verifyWasmAB(x,sources).status,'BLOCKED');
});
