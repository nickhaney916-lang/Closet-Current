import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {runVerifiedMockEdit,verifyMockReceipt} from '../supabase/functions/garment-normalize/verified-pipeline.mjs';

const img='data:image/png;base64,'+
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ck5wAAAAASUVORK5CYII=';
const preview='data:image/png;base64,'+
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLJPQAAAABJRU5ErkJggg==';
const sha=uri=>createHash('sha256').update(Buffer.from(uri.split(',')[1],'base64')).digest('hex');
const now=1760757600000;
const key='super-private-test-secret-at-least-thirty-two-bytes-2026';
const requestId='request_2026_12345';
const owner='test_user_00000001';
const itemId='garment-orange-shorts';
const base=()=>({
 candidate:{action:'normalize-preview',category:'Bottoms',
  garmentImage:img,itemId,photoSha256:sha(img),userInitiated:true,storeResult:false},
 principal:{id:owner,authenticatedByServer:true},requestId,secret:key,now,enabled:true,
 reservation:{mode:'simulation',allowed:true,ownerId:owner,requestId,
  maxJobs:1,expiresAt:now+60000},
 adapter:{kind:'mock',edit:async payload=>{
  assert.equal(payload.model_name,'edit');assert.equal(payload.inputs.image,img);
  assert.equal(payload.inputs.num_images,1);
  return preview;
 }}
});
test('one exact source-in / one output mock edit yields bound private receipt, not saved asset',async()=>{
 const source=base(),before=structuredClone(source.candidate);
 const r=await runVerifiedMockEdit(source);
 assert.equal(r.evidence.sourceSha256,sha(img));
 assert.equal(r.evidence.previewSha256,sha(preview));
 assert.equal(r.evidence.itemId,itemId);
 assert.equal(r.preview,preview);
 assert.equal(r.actualAIReconstructionRun,false);
 assert.equal(r.canReplaceOriginal,false);
 assert.equal(r.cannotAutoSave,true);
 assert.deepEqual(source.candidate,before);
 const request={receipt:r.receipt,sourceSha256:sha(img),previewSha256:sha(preview),
  userId:owner,itemId,category:'Bottoms',requestId,now,secret:key};
 assert.equal(await verifyMockReceipt(request),true);
 assert.equal(await verifyMockReceipt({...request,userId:'other_user_2222'}),false);
 assert.equal(await verifyMockReceipt({...request,itemId:'wrong-jeans'}),false);
 assert.equal(await verifyMockReceipt({...request,sourceSha256:'0'.repeat(64)}),false);
 assert.equal(await verifyMockReceipt({...request,previewSha256:'1'.repeat(64)}),false);
 assert.equal(await verifyMockReceipt({...request,requestId:'wrong_request_444'}),false);
 assert.equal(await verifyMockReceipt({...request,now:now+10*60*1000+1}),false);
 assert.equal(await verifyMockReceipt({...request,now:now-1}),false);
 assert.equal(await verifyMockReceipt({...request,secret:key+'tampered'}),false);
 assert.equal(await verifyMockReceipt({...request,receipt:r.receipt.slice(0,-6)+'000000'}),false);
});
test('fake claimed source hash is blocked BEFORE mock provider receives data',async()=>{
 const x=base();x.candidate.photoSha256='f'.repeat(64);
 let calls=0;x.adapter.edit=async()=>{calls++;return preview;};
 await assert.rejects(runVerifiedMockEdit(x),/Original source bytes/);
 assert.equal(calls,0);
});
test('fake MIME, malformed input bytes, same-image output and fake output MIME fail closed',async()=>{
 const a=base();a.candidate.garmentImage='data:image/jpeg;base64,'+img.split(',')[1];
 a.candidate.photoSha256=sha(img);
 await assert.rejects(runVerifiedMockEdit(a),/does not match claimed MIME/);
 const b=base();b.adapter.edit=async()=>img;
 await assert.rejects(runVerifiedMockEdit(b),/No distinct generated preview/);
 const c=base();c.adapter.edit=async()=>('data:image/png;base64,'+'A'.repeat(300));
 await assert.rejects(runVerifiedMockEdit(c),/does not match claimed MIME/);
});
test('disabled, real provider, no authorized user or no spend reservation never run',async()=>{
 for(const mutate of [
  x=>{x.enabled=false;},
  x=>{x.adapter.kind='real';},
  x=>{x.principal.authenticatedByServer=false;},
  x=>{x.principal.id='other_user_2222';},
  x=>{x.reservation.allowed=false;},
  x=>{x.reservation.maxJobs=2;},
  x=>{x.reservation.mode='paid';},
  x=>{x.reservation.expiresAt=x.now-1;}
 ]){
  const x=base();let calls=0;
  x.adapter.edit=async()=>{calls++;return preview;};
  mutate(x);
  await assert.rejects(runVerifiedMockEdit(x));
  assert.equal(calls,0);
 }
});
test('unreviewed output metadata never asserts garment fidelity or provider authenticity',async()=>{
 const x=await runVerifiedMockEdit(base());
 assert.equal(x.evidence.identityVerified,false);
 assert.equal(x.evidence.providerRunAuthenticated,false);
 assert.equal(x.evidence.trial,'mock-only');
 assert.equal(x.requiresOwnerReview,true);
 assert.equal(x.paidProviderUsed,false);
});
