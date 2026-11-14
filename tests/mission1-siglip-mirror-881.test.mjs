/** P881 generated synthetic arrays/receipts only. NOT human truth or photo accuracy. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {mirrorRGB881,meanUnitEmbeddings881} from '../public/siglip-horizontal-view-881.mjs';
import {auditMirror881} from '../scripts/p881-siglip-mirror-audit.mjs';
import {VERSION82,MODEL_ASSETS82} from '../public/dual-core-82.mjs';
import {observation81,arbitrate81} from '../public/model-arbitration-81.mjs';
import {localCandidates} from '../public/local-catalog.mjs';

class FakeRawImage {
 constructor(data,width,height,channels){this.data=data;this.width=width;this.height=height;this.channels=channels;}
}
const sha=x=>x.repeat(64),worker=sha('c');
const binding=(digest,id)=>({sourceSha256:digest,inputSha256:digest,
 ownerSession:'synthetic-owner',photoRevision:'synthetic-revision-'+id,
 cropRevision:'synthetic-crop-'+id,maskRevision:'synthetic-mask-'+id,
 unitRevision:'one-unit',instanceId:id});
const rank=(type)=>localCandidates.map((x,i)=>({label:x.label,
 score:x.itemType===type?100:1/(i+1)}));
function entry(id,digit,original,mirror,paired,historical){
 const digest=sha(digit),bind=binding(digest,id);
 const observations=['fashionclip','fashionSiglip'].map(modelKey=>observation81({
  modelKey,binding:bind,scores:rank(original),workerSourceSha256:worker,
  vectorSha256:MODEL_ASSETS82[modelKey].vectorsSha256,latencyMs:3}));
 const decision=arbitrate81({binding:bind,observations});
 const alternate=type=>observation81({modelKey:'fashionSiglip',binding:bind,
  scores:rank(type),workerSourceSha256:worker,
  vectorSha256:MODEL_ASSETS82.fashionSiglip.vectorsSha256,latencyMs:5}).ranking;
 const expected=localCandidates.find(x=>x.itemType===historical);
 const output={schema:VERSION82,assets:MODEL_ASSETS82,sourceCodeSha256:worker,
  requestId:'p881-test-'+id,createdAt:1730000000000,automaticAdmissions:0,
  observations,experiment877:{schema:'p877-optional-full-frame-v1',
   modelKey:'fashionSiglip',mode:'fitWholePhoto224-white',
   sameModelNotIndependent:true,sourceCodeSha256:worker,
   vectorSha256:MODEL_ASSETS82.fashionSiglip.vectorsSha256,
   inputSha256:digest,extraMs:3,ranking:observations[1].ranking},
  experiment881:{schema:'p881-optional-horizontal-mirror-v1',
   mode:'same-original-rgb-horizontal-mirror',modelKey:'fashionSiglip',
   sameModelNotIndependent:true,weightsChanged:false,
   sourceCodeSha256:worker,vectorSha256:MODEL_ASSETS82.fashionSiglip.vectorsSha256,
   inputSha256:digest,mirrorMs:5,mirroredRanking:alternate(mirror),
   meanRanking:alternate(paired)}};
 return {row:{id,sourceSha256:digest,
    historicalExpectation:{category:expected.category,itemType:historical},output,decision},
  receipt:{id,image:id+'.jpg',sha256:digest,verified:true,
   attribution:{license:'CC BY 4.0',source:'https://commons.wikimedia.org/wiki/File:'+id+'.jpg'}},
  manifest:{id,image:id+'.jpg',verified:true,
   expectedCategory:expected.category,expectedType:historical}};
}
function fixture(){
 const a=entry('commons-0078','a','Ankle boots','Sneakers','Sneakers','Sneakers');
 const b=entry('commons-0001','b','T-shirt','Sweatshirt','Sweatshirt','T-shirt');
 return {data:{summary:{status:'PUBLIC_DEVELOPMENT_ONLY',blindAccuracy:null,
  physicalDevices:0,independentlyHumanReviewedPhotos:0,automaticAdmissions:0,
  nonGetOrExternalRequests:0,isolation:'one-browser-continuous-2-one-shot-workers',
  photos:2,rawTop1:{fashionSiglip:{exactSubtypeMatches:1}}},rows:[a.row,b.row]},
  receipts:[a.receipt,b.receipt],manifest:[a.manifest,b.manifest]};
}
const audit=x=>auditMirror881(x.data,x.receipts,x.manifest,{expectedRows:2});
test('P881 horizontal RGB mirror maintains every full-resolution source pixel without mutation',()=>{
 const bytes=new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12]);
 const image=new FakeRawImage(bytes,2,2,3),flipped=mirrorRGB881(image,FakeRawImage);
 assert.deepEqual(Array.from(flipped.data),[4,5,6,1,2,3,10,11,12,7,8,9]);
 assert.deepEqual(Array.from(image.data),Array.from(bytes));
 const back=mirrorRGB881(flipped,FakeRawImage);
 assert.deepEqual(Array.from(back.data),Array.from(bytes));
});
test('P881 malformed image, channels, dimensions and bytes fail closed',()=>{
 assert.throws(()=>mirrorRGB881({width:2,height:2,channels:4,data:new Uint8Array(16)},FakeRawImage),/P881_INVALID_RGB_IMAGE/);
 assert.throws(()=>mirrorRGB881({width:2,height:2,channels:3,data:new Uint8Array(11)},FakeRawImage),/P881_INVALID_RGB_IMAGE/);
 assert.throws(()=>mirrorRGB881({width:20000001,height:1,channels:3,data:new Uint8Array(3)},FakeRawImage),/P881_INVALID_RGB_IMAGE/);
});
test('P881 equal embedding mean is normalized without altering either family',()=>{
 const a=new Float32Array(768),b=new Float32Array(768);a[0]=1;b[1]=1;
 const out=meanUnitEmbeddings881(a,b);
 assert.ok(Math.abs(out[0]-Math.SQRT1_2)<1e-6);
 assert.ok(Math.abs(out[1]-Math.SQRT1_2)<1e-6);
 assert.equal(a[1],0);assert.equal(b[0],0);
});
test('P881 invalid or cancelling embeddings cannot produce fictional votes',()=>{
 const a=new Float32Array(768),b=new Float32Array(768);a[0]=1;b[0]=-1;
 assert.throws(()=>meanUnitEmbeddings881(a,b),/P881_CANCELLED_EMBEDDINGS/);
 a[0]=NaN;assert.throws(()=>meanUnitEmbeddings881(a,b),/P881_INVALID_EMBEDDINGS/);
 assert.throws(()=>meanUnitEmbeddings881(new Float32Array(1),b),/P881_INVALID_EMBEDDINGS/);
});
test('P881 synthetic historical gain and loss balanced, without any independent accuracy',()=>{
 const x=fixture(),report=audit(x),s=report.summary;
 assert.equal(s.photos,2);assert.equal(s.originalHistoricalSubtypeStringMatches,1);
 assert.equal(s.pairedHistoricalSubtypeStringMatches,1);
 assert.equal(s.pairedHistoricalStringGains,1);assert.equal(s.pairedHistoricalStringLosses,1);
 assert.equal(s.knownSneakerCase.pairedType,'Sneakers');
 assert.equal(s.modelPromoted,false);assert.equal(s.blindAccuracy,null);
 assert.equal(s.releaseReady,false);assert.equal(s.shouldLiftFamilyAlphaHold,false);
});
test('P881 modified mirror source, vector, identity or same-model provenance blocked',()=>{
 for(const [key,value,reason] of [
  ['inputSha256',sha('d'),'MIRROR_SOURCE'],
  ['sourceCodeSha256',sha('d'),'MIRROR_SOURCE'],
  ['weightsChanged',true,'EXPERIMENT_ORIGIN'],
  ['sameModelNotIndependent',false,'EXPERIMENT_ORIGIN'],
  ['vectorSha256',sha('d'),'MIRROR_SOURCE']]){
  const x=fixture();x.data.rows[0].output.experiment881[key]=value;
  assert.throws(()=>audit(x),new RegExp('P881_'+reason),key);
 }
});
test('P881 ranking truncation, corruption and unsorted scores rejected',()=>{
 const a=fixture();a.data.rows[0].output.experiment881.meanRanking.pop();
 assert.throws(()=>audit(a),/P881_INCOMPLETE_RANK/);
 const b=fixture();b.data.rows[0].output.experiment881.mirroredRanking[0].category='Tops';
 assert.throws(()=>audit(b),/P881_VOCABULARY_OR_SCORE/);
 const c=fixture();c.data.rows[0].output.experiment881.meanRanking[0].score=-1000;
 assert.throws(()=>audit(c),/P881_RANK_SORT/);
});
test('P881 original swap, forged historical label or automatic save blocked by P878',()=>{
 const a=fixture();a.data.rows[0].sourceSha256=sha('f');
 assert.throws(()=>audit(a),/P878_PHOTO_RECEIPT/);
 const b=fixture();b.data.rows[0].historicalExpectation.itemType='T-shirt';
 assert.throws(()=>audit(b),/P878_MANIFEST_PROVENANCE/);
 const c=fixture();c.data.rows[0].output.automaticAdmissions=1;
 assert.throws(()=>audit(c),/P878_MODEL_REQUEST/);
});
