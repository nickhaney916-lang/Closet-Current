/** P878 synthetic tampering tests: no claim of photograph recognition accuracy. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyPublicPhotoCustody878} from '../scripts/p878-public-photo-custody.mjs';
import {VERSION82,MODEL_ASSETS82} from '../public/dual-core-82.mjs';
import {observation81,arbitrate81} from '../public/model-arbitration-81.mjs';
import {localCandidates} from '../public/local-catalog.mjs';

const hex=n=>String(n).repeat(64);
const worker=hex('c');
const scores=()=>localCandidates.map((x,i)=>({label:x.label,score:localCandidates.length-i}));
const binding=(source,id)=>({sourceSha256:source,inputSha256:source,ownerSession:'synthetic-public-review',
 photoRevision:'r-'+id,cropRevision:'crop-'+id,maskRevision:'mask-'+id,
 unitRevision:'single-photo-owner-reviewed',instanceId:id});
function entry(id,digit){
 const digest=hex(digit),bound=binding(digest,id);
 const observations=['fashionclip','fashionSiglip'].map(modelKey=>observation81({
  modelKey,binding:bound,scores:scores(),workerSourceSha256:worker,
  vectorSha256:MODEL_ASSETS82[modelKey].vectorsSha256,latencyMs:5}));
 const decision=arbitrate81({binding:bound,observations});
 const out={schema:VERSION82,assets:MODEL_ASSETS82,sourceCodeSha256:worker,
  requestId:'test-request-878-'+id,createdAt:1730000000000,automaticAdmissions:0,observations,
  experiment877:{schema:'p877-optional-full-frame-v1',modelKey:'fashionSiglip',
   mode:'fitWholePhoto224-white',sameModelNotIndependent:true,sourceCodeSha256:worker,
   vectorSha256:observations[1].vectorSha256,inputSha256:digest,extraMs:9,ranking:observations[1].ranking}};
 return {row:{id,sourceSha256:digest,output:out,decision},
  receipt:{id,image:id+'.jpg',sha256:digest,verified:true,
   attribution:{license:'CC BY 4.0',source:'https://commons.wikimedia.org/wiki/File:'+id+'.jpg'}}};
}
function fixture(){
 const a=entry('commons-A','a'),b=entry('commons-B','b');
 return {data:{summary:{status:'PUBLIC_DEVELOPMENT_ONLY',blindAccuracy:null,physicalDevices:0,
  independentlyHumanReviewedPhotos:0,automaticAdmissions:0,nonGetOrExternalRequests:0,
  isolation:'one-browser-continuous-2-one-shot-workers',photos:2},rows:[a.row,b.row]},
 receipts:[a.receipt,b.receipt]};
}
const verify=(x)=>verifyPublicPhotoCustody878(x.data,x.receipts,{expectedRows:2});
test('P878 accepts exact original, independent pinned model bindings and unsaved owner review',()=>{
 const v=verify(fixture());
 assert.equal(v.summary.photos,2);
 assert.equal(v.summary.distinctPhotoDigests,2);
 assert.equal(v.summary.releaseReady,false);
 assert.equal(v.summary.blindAccuracy,null);
 assert.equal(v.summary.automaticallySavedGarments,0);
});
test('P878 rejects arbitrary photo SHA even when model claims agree',()=>{
 const x=fixture();x.data.rows[0].sourceSha256=hex('d');
 assert.throws(()=>verify(x),/P878_PHOTO_RECEIPT/);
});
test('P878 rejects duplicate physical photo under a different photo id',()=>{
 const x=fixture();x.receipts[1].sha256=hex('a');
 x.data.rows[1].sourceSha256=hex('a');
 x.data.rows[1].output.observations.forEach(o=>{o.binding.sourceSha256=hex('a');o.binding.inputSha256=hex('a')});
 x.data.rows[1].decision.binding.sourceSha256=hex('a');x.data.rows[1].decision.binding.inputSha256=hex('a');
 x.data.rows[1].output.experiment877.inputSha256=hex('a');
 assert.throws(()=>verify(x),/P878_DUPLICATE_PHOTO_DIGEST/);
});
test('P878 rejects a mismatched model input while source receipt remains genuine',()=>{
 const x=fixture();x.data.rows[1].output.observations[0].binding.inputSha256=hex('e');
 assert.throws(()=>verify(x),/P878_ORIGINAL_INPUT_BINDING/);
});
test('P878 rejects cross-model swapped owner session and unsound decision provenance',()=>{
 const x=fixture();x.data.rows[1].output.observations[0].binding.ownerSession='other-owner';
 assert.throws(()=>verify(x),/P878_CROSS_MODEL_BINDING/);
 const y=fixture();y.data.rows[0].decision.binding.ownerSession='other-owner';
 assert.throws(()=>verify(y),/P878_NO_OWNER_APPROVAL/);
});
test('P878 rejects forged model/vector hashes',()=>{
 const x=fixture();x.data.rows[0].output.observations[1].vectorSha256=hex('d');
 assert.throws(()=>verify(x),/P878_MODEL_HASH/);
 const y=fixture();y.data.rows[0].output.observations[0].model.revision='untrusted';
 assert.throws(()=>verify(y),/P878_MODEL_REVISION/);
});
test('P878 rejects cloned request IDs, invalid photo licenses and unverified sources',()=>{
 const a=fixture();a.data.rows[1].output.requestId=a.data.rows[0].output.requestId;
 assert.throws(()=>verify(a),/P878_MODEL_REQUEST/);
 const b=fixture();b.receipts[0].attribution.license='all rights reserved';
 assert.throws(()=>verify(b),/P878_SOURCE_LICENSE/);
 const c=fixture();c.receipts[0].verified=false;
 assert.throws(()=>verify(c),/P878_SOURCE_LEDGER/);
});
test('P878 rejects third family/candidate corruption and allegedly independent alt',()=>{
 const a=fixture();a.data.rows[1].output.observations.push(a.data.rows[1].output.observations[0]);
 assert.throws(()=>verify(a),/P878_TWO_FAMILIES/);
 const b=fixture();b.data.rows[0].output.experiment877.sameModelNotIndependent=false;
 assert.throws(()=>verify(b),/P878_ALT_IDENTITY/);
 const c=fixture();c.data.rows[1].output.experiment877.ranking[0].category='Shoes';
 assert.throws(()=>verify(c),/P878_RANK_SOURCE/);
});
test('P878 forbids promotions, cloud mutations, owner auto-save and non-GET or isolated session',()=>{
 const a=fixture();a.data.summary.blindAccuracy=1;
 assert.throws(()=>verify(a),/P878_RESEARCH_ONLY/);
 const b=fixture();b.data.rows[0].output.automaticAdmissions=1;
 assert.throws(()=>verify(b),/P878_MODEL_REQUEST/);
 const c=fixture();c.data.summary.nonGetOrExternalRequests=1;
 assert.throws(()=>verify(c),/P878_SESSION_POLICY/);
 const d=fixture();d.data.summary.isolation='fresh-browser-per-photo-NOT-continuous-session';
 assert.throws(()=>verify(d),/P878_SESSION_POLICY/);
});
