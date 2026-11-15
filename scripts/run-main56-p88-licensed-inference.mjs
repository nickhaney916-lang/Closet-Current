/**
 * MAIN1054 M56 — genuine pinned SegFormer fp32 model on two ORIGINAL
 * licensed public JPEGs → exact P88 grouping source → M55 owner-safe intake.
 *
 * NOT the P88 browser Web Worker itself; its segmentation modules, model ID,
 * revision, inference settings and receipt semantics are pinned and reused.
 * No owner wardrobe writes or synthetic replacement logits in this runner.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {AutoModelForSemanticSegmentation,AutoProcessor,RawImage} from '@huggingface/transformers';
import {openP88SourceIntake55} from '../research/master-consolidation-1054/p88-source-key-adapter-55.mjs';
import {evidenceFromP88Mask56} from '../research/master-consolidation-1054/p88-source-mask-ledger-56.mjs';
import {canConfirmScene32} from '../research/multi-garment-capture-01/scene-class-guard-32.mjs';
import {UNRESOLVED_SEGMENT_STATUS54} from '../research/multi-garment-capture-01/atomic-group.mjs';

if(!globalThis.crypto?.subtle)globalThis.crypto=webcrypto;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const path=resolve('.m56-exact-p88-donor/public');
const seg=await import(pathToFileURL(resolve(path,'outfit-segmentation.mjs')).href);
const p88=await import(pathToFileURL(resolve(path,'outfit-instance-review-840.mjs')).href);
const sourceRegistry=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const originals=['commons-0003','commons-0090'];
const MODEL='Xenova/segformer_b0_clothes';
const REVISION='a2489ea8e7ec1ee912190546bad31a4906ccca76';
const out='benchmark/main56-p88-real-original-owner-bridge';
await mkdir(out,{recursive:true});
const modelLoadStart=performance.now();
const processor=await AutoProcessor.from_pretrained(MODEL,{revision:REVISION});
const model=await AutoModelForSemanticSegmentation.from_pretrained(MODEL,{
 revision:REVISION,device:'cpu',dtype:'fp32',
 session_options:{intraOpNumThreads:2,interOpNumThreads:1}
});
const loadMs=performance.now()-modelLoadStart;
const observations=[];
try{
 for(const id of originals){
  const registry=sourceRegistry.find(x=>x.id===id);
  assert.equal(registry?.verified,true,'source must be rights-registry approved: '+id);
  const file=resolve('benchmark/fixtures/'+registry.image);
  const original=await readFile(file);
  const sourceSHA256=digest(original);
  assert.equal(sourceSHA256,registry.sha256,'original byte SHA-256 mismatch');
  assert.ok(original.length>=128&&original.length<=10*1024*1024);
  assert.equal(original[0],255);assert.equal(original[1],216);
  const image='data:image/jpeg;base64,'+original.toString('base64');
  const decoded=await RawImage.read(file);
  if(decoded.width>3072||decoded.height>3072||image.length>12_000_000)
   throw Error('P88 worker cannot handle original unmodified dimensions; do not downsample source');
  const proof={image,sourceSHA256,sourceHashVerified:true,
   originalPhoto:{image,sha256:sourceSHA256,
    origin:'licensed-public-main56',width:decoded.width,height:decoded.height}};
  const owner='m56-synthetic-'+randomUUID();
  const lease={owner,source:sourceSHA256,epoch:1,request:randomUUID(),
   db:'closet-current-user-'+owner};
  const adapter=await openP88SourceIntake55({
   proof,ownerId:owner,requestId:lease.request,reviewEpoch:lease.epoch,
   getOwner:()=>lease.owner,getSourceSHA256:()=>lease.source,
   getReviewEpoch:()=>lease.epoch,getActiveRequestId:()=>lease.request,
   getDbName:()=>lease.db
  });
  const requested=adapter.workerRequest();
  assert.equal(requested.image,image);
  assert.equal(requested.instanceReview70,true);
  assert.equal(requested.instanceReview840,true);
  const start=performance.now();
  const inputs=await processor(decoded),output=await model(inputs);
  const map=seg.clothingLabelMap(output.logits.data,output.logits.dims);
  const groups=map.personDetected?p88.clothingReviewInstances840(map):[];
  const modelMs=performance.now()-start;
  const prior=[],regionResults=[],maskSet=new Set();
  for(const [ordinal,group]of groups.entries()){
   // Identical original-photo pixel/crop geometry as P88 worker. No
   // source photo is replaced with a synthetic or masked image.
   const bounds=seg.clothingCropBounds(decoded,map,group);
   const cropBounds={x:bounds.left/decoded.width,y:bounds.top/decoded.height,
    width:bounds.width/decoded.width,height:bounds.height/decoded.height};
   const evidence=evidenceFromP88Mask56({
    map,group,sourceSHA256,instanceOrdinal:ordinal,cropBounds,
    requestId:lease.request
   });
   assert.equal(evidence.maskSha256,digest(group.selected));
   assert.equal(maskSet.has(evidence.maskSha256),false,'duplicate physical-mask data');
   maskSet.add(evidence.maskSha256);
   const result=adapter.intake(evidence.event,prior);
   if(result.accepted){
    assert.equal(result.piece.instanceKey,'seg-'+BigInt('0x'+evidence.maskSha256).toString(10));
    assert.equal(result.piece.personDetected,false,'P88 has no person flag');
    assert.equal(canConfirmScene32({...result.piece,cropReviewed:false},{}),false);
    if(group.instanceMethod==='native_semantic_group_unresolved_fragments'){
     assert.equal(result.piece.hint.componentReviewStatus,UNRESOLVED_SEGMENT_STATUS54);
     assert.equal(canConfirmScene32({...result.piece,category:'Tops',itemType:'T-shirt',
      color:'Blue',cropReviewed:true},
      {types:{Tops:['T-shirt']}}),false);
    }
    prior.push({...result.piece,manual:false});
   }
   regionResults.push({
    ordinal,maskSha256:evidence.maskSha256,
    predictedLabel:group.label,sourceMaskPositivePixels:evidence.positive,
    predictedMethod:evidence.method,acceptedForManualReview:result.accepted,
    rejectReason:result.accepted?null:result.reason,
    humanConfirmed:false,ownerPrivateSaved:false,threeDReady:false
   });
  }
  output.logits?.dispose?.();
  for(const item of Object.values(inputs))item?.dispose?.();
  adapter.close();
  const row={
   id,sourceSHA256,license:registry.attribution?.license||'UNKNOWN',
   originalJPEGBytes:original.length,originalWidth:decoded.width,
   originalHeight:decoded.height,modelPersonDetected:map.personDetected,
   modelMaskWidth:map.width,modelMaskHeight:map.height,
   realSourceGroupCount:groups.length,reviewAdmittedCount:prior.length,
   reviewRefusedCount:groups.length-prior.length,
   unresolvedCount:regionResults.filter(x=>x.predictedMethod==='native_semantic_group_unresolved_fragments').length,
   inferenceMs:Math.round(modelMs),
   regions:regionResults,originalPreserved:true,
   humanGroundTruthVerified:false,ownerPrivateSaved:false,
   sourcePhoto2DFallback:true,sourcePhoto3DClothApproved:false
  };
  observations.push(row);
  console.log('M56_REAL_MODEL_SOURCE_MASK',JSON.stringify({
   id,personDetected:row.modelPersonDetected,groups:groups.length,
   accepted:prior.length,refused:row.reviewRefusedCount,
   unresolved:row.unresolvedCount,inferenceMs:row.inferenceMs
  }));
 }
}finally{await model.dispose();}
const receipt={
 schema:'MAIN1054_M56_REAL_MODEL_MASK_TO_PRIVATE_REVIEW_RESEARCH/v1',
 model:MODEL,revision:REVISION,dtype:'fp32',device:'cpu',
 modelAssetChecksumIndependentlyVerified:false,
 modelLoadMs:Math.round(loadMs),sourcePhotos:observations,
 sourceDonor:'P88 cc4554ef0104506a72bf0a28423fee52b6e4fff2',
 sourceBrowserWorkerExecuted:false,
 exactP88SegmentationAndReviewModulesExecuted:true,
 syntheticLogitsUsed:false,syntheticOwnersOnly:true,
 historicalExposedSources:true,newBlindHoldout:false,
 automaticClosetSave:false,physicalPhoneAcceptance:false,
 signedHostedRLSProven:false,threeDGarmentFidelityApproved:false,
 familyAlpha:'HOLD',releaseApproved:false
};
await writeFile(out+'/M56-GENUINE-MODEL-MASK-TO-MANUAL-REVIEW.json',
 JSON.stringify(receipt,null,2)+'\n');
console.log('M56_GENUINE_SOURCE_TRIAL',JSON.stringify({
 photos:observations.length,
 proposed:observations.reduce((n,x)=>n+x.realSourceGroupCount,0),
 admittedForManualReview:observations.reduce((n,x)=>n+x.reviewAdmittedCount,0),
 file:out+'/M56-GENUINE-MODEL-MASK-TO-MANUAL-REVIEW.json',
 familyAlpha:'HOLD',fullNativeWorkerExecution:false
}));
