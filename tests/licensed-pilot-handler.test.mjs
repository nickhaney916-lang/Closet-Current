import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {APPROVED_LICENSED_SOURCE_SET,createLicensedPilotHandler,PILOT_ENABLED_BY_DEFAULT}
 from '../supabase/functions/garment-normalize/licensed-pilot-handler.mjs';
const owner='33333333-3333-4333-8333-333333333333';
const requestId='11111111-1111-4111-8111-111111111111';
const origin='https://closet-current.pages.dev',token='Bearer fake-test-token-authenticated-1234567';
const sampleId='commons-0035',allowed=APPROVED_LICENSED_SOURCE_SET[sampleId];
function ctx({enabled=true,authenticated=true}={}){
 let submissions=0,authCalls=0,polls=0;const calls=[];
 const ledger={
  reserve:async input=>{calls.push('reserve');return {
   approved:true,durableDbReservation:true,costCredits:1,maxOutputs:1,
   requestId:input.requestId,ownerId:input.owner.id,
   category:input.category,sourceSha256:input.sourceSha256
  };},
  claim:async()=>{calls.push('claim');return true;},
  bind:async()=>{calls.push('bind');return true;},
  status:async({owner:principal})=>{
   calls.push('status');if(principal.id!==owner)throw Error('wrong owner');
   return {status:'submitted',jobId:'12345678-abcd-4def-8999-123456789abc',
    sourceSha256:allowed.sourceSha256,category:'Bottoms'};
  }
 };
 const transportFactory=()=>({submit:async()=>{submissions++;return{jobId:'12345678-abcd-4def-8999-123456789abc'};},
  poll:async()=>{polls++;return {status:'preview-ready',canAutoSave:false,
   image:'data:image/png;base64,'+'A'.repeat(300)};}});
 const app=createLicensedPilotHandler({
  enabled,allowedOrigin:origin,allowedUserId:owner,ledger,transportFactory,
  verifyJwt:async()=>{authCalls++;return authenticated?owner:'44444444-4444-4444-8444-444444444444';}
 });
 return {app,calls,get authCalls(){return authCalls},get submissions(){return submissions},get polls(){return polls}};
}
function req(body,{method='POST',from=origin,authorization=token}={}){
 return new Request('https://somewhere.example/normalize',{method,
 headers:{origin:from,authorization,'Content-Type':'application/json'},
 body:method==='POST'?JSON.stringify(body):undefined
 });
}
const input=(extra={})=>({action:'start',requestId,consentToProvider:true,
 consentVersion:'pilot-licensed-v1',
 candidate:{action:'normalize-preview',category:'Bottoms',itemId:sampleId,
 photoSha256:allowed.sourceSha256,
 // Simulated bytes do not match licensed hash; do not actually reserve.
 garmentImage:'data:image/png;base64,'+'A'.repeat(300),
 userInitiated:true,storeResult:false},...extra});
test('no enabled pilot means no network or credentials used',async()=>{
 const x=ctx({enabled:false});const response=await x.app.handle(req(input()));
 assert.equal(response.status,503);assert.deepEqual(x.calls,[]);
 assert.equal(x.authCalls,0);assert.equal(PILOT_ENABLED_BY_DEFAULT,false);
});
test('origin or token or non-allowlisted user fails before touching database',async()=>{
 const x=ctx(),y=ctx({authenticated:false});
 assert.equal((await x.app.handle(req(input(),{from:'https://evil.example'}))).status,403);
 assert.equal((await x.app.handle(req(input(),{authorization:'Bearer invalid'}))).status,401);
 assert.equal((await y.app.handle(req(input()))).status,403);
 assert.deepEqual(x.calls,[]);assert.deepEqual(y.calls,[]);
});
test('only four locked licensed garments and exact source/category are eligible',async()=>{
 assert.equal(Object.keys(APPROVED_LICENSED_SOURCE_SET).length,4);
 for(const id of ['commons-0035','commons-0065','validation-0017','validation-0019']){
  assert.match(APPROVED_LICENSED_SOURCE_SET[id].sourceSha256,/^[a-f0-9]{64}$/);
 }
 const x=ctx(),wrong=input();wrong.candidate.itemId='customer-selfie';
 assert.equal((await x.app.handle(req(wrong))).status,403);
 const changed=input();changed.candidate.category='Shoes';
 assert.equal((await x.app.handle(req(changed))).status,403);
 const altered=input();altered.candidate.photoSha256='0'.repeat(64);
 assert.equal((await x.app.handle(req(altered))).status,403);
 assert.deepEqual(x.calls,[]);
});
test('source-specific consent must be explicitly given on each licensed start',async()=>{
 const x=ctx();
 assert.equal((await x.app.handle(req(input({consentToProvider:false})))).status,400);
 assert.equal((await x.app.handle(req(input({consentVersion:'wrong'})))).status,400);
 assert.deepEqual(x.calls,[]);
});
test('valid candidate but fabricated image hash does not reserve or submit',async()=>{
 const x=ctx();const r=await x.app.handle(req(input()));
 assert.equal(r.status,409);
 assert.deepEqual(x.calls,[]);
 assert.equal(x.submissions,0);
});
test('status polling retrieves via authenticated owner scoped ledger only',async()=>{
 const x=ctx();
 const res=await x.app.handle(req({action:'status',requestId}));
 assert.equal(res.status,200);
 const data=await res.json();
 assert.equal(data.status,'preview-ready');
 assert.equal(data.canAutoSave,false);
 assert.equal(data.requiresVisualReview,true);
 assert.equal(x.polls,1);
 assert.deepEqual(x.calls,['status']);
});
test('large, malformed, non-POST, bad request IDs and unsupported action blocked',async()=>{
 const x=ctx();
 assert.equal((await x.app.handle(req({action:'wrong',requestId}))).status,400);
 assert.equal((await x.app.handle(req({action:'status',requestId:'invalid'}))).status,400);
 const bad=new Request('https://somewhere.example/normalize',{
  method:'POST',headers:{origin,authorization:token,'Content-Type':'application/json',
   'Content-Length':'7600001'},body:'{}'});
 assert.equal((await x.app.handle(bad)).status,413);
 const pre=await x.app.handle(req(null,{method:'OPTIONS'}));
 assert.equal(pre.status,204);
 const get=await x.app.handle(req(null,{method:'GET'}));
 assert.equal(get.status,405);
});
