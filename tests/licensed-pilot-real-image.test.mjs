import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {APPROVED_LICENSED_SOURCE_SET,createLicensedPilotHandler} from
 '../supabase/functions/garment-normalize/licensed-pilot-handler.mjs';

// This test deliberately runs the real licensed original photo bytes through
// the real in-repo verification/orchestration code but mocks the paid provider.
// It cannot prove faithful garment reconstruction or spend any model credit.
const owner='33333333-3333-4333-8333-333333333333';
const requestId='11111111-1111-4111-8111-111111111111';
const origin='https://closet-current.pages.dev';
const sample=APPROVED_LICENSED_SOURCE_SET['commons-0035'];
const fakeJwt='Bearer verified-test-token-not-a-real-user-session-123';
// The full application test suite does not download external photo fixtures.
// The dedicated pilot workflow DOES. Never misreport the photo benchmark as
// executed when the original source is absent.
const fixtureAvailable=existsSync('benchmark/photos/commons-0035.jpg');
const imageBytes=fixtureAvailable?await readFile('benchmark/photos/commons-0035.jpg'):null;
const actualHash=imageBytes?createHash('sha256').update(imageBytes).digest('hex'):null;
if(fixtureAvailable)assert.equal(actualHash,sample.sourceSha256,'Real licensed photo changed');
const requiresSource={skip:fixtureAvailable?false:'Licensed photo downloaded only by dedicated pilot CI'};
const input={
 action:'start',requestId,consentToProvider:true,consentVersion:'pilot-licensed-v1',
 candidate:{action:'normalize-preview',itemId:'commons-0035',category:'Bottoms',
  photoSha256:actualHash,garmentImage:'data:image/jpeg;base64,'+imageBytes.toString('base64'),
  userInitiated:true,storeResult:false}
};
const png='data:image/png;base64,'+
 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLJPQAAAABJRU5ErkJggg==';
function harness(){
 let claims=0,submissions=0,bound=null,polls=0,reservations=0;
 const ledger={
  reserve:async({owner:user,requestId:id,sourceSha256,category})=>{
   assert.equal(user.id,owner);assert.equal(id,requestId);
   assert.equal(sourceSha256,actualHash);assert.equal(category,'Bottoms');
   reservations++;
   return {approved:true,costCredits:1,durableDbReservation:true,maxOutputs:1,
    ownerId:owner,requestId,sourceSha256,category};
  },
  claim:async()=>{claims++;return claims===1;},
  bind:async({jobId})=>{bound=jobId;return true;},
  status:async({owner:user})=>{
   if(user.id!==owner||!bound)throw Error('Wrong account');
   return {jobId:bound,status:'submitted',sourceSha256:actualHash,category:'Bottoms'};
  }
 };
 const adapter=()=>({
  submit:async plan=>{
   assert.equal(plan.inputs.image,input.candidate.garmentImage);
   assert.equal(plan.inputs.num_images,1);submissions++;
   return {jobId:'licensed-shorts-pilot-123456789'};
  },
  poll:async jobId=>{
   assert.equal(jobId,bound);polls++;
   return {status:'preview-ready',image:png,canAutoSave:false,
    garmentFidelityVerified:false};
  }
 });
 const h=createLicensedPilotHandler({enabled:true,allowedOrigin:origin,
  allowedUserId:owner,verifyJwt:async()=>owner,ledger,transportFactory:adapter});
 const send=async data=>h.handle(new Request('https://private.test/normalize',{
  method:'POST',headers:{origin,Authorization:fakeJwt,'Content-Type':'application/json'},
  body:JSON.stringify(data)
 }));
 return {send,get claims(){return claims},get submissions(){return submissions},
  get reservations(){return reservations},get polls(){return polls}};
}
test('exact licensed source photo yields one simulated job, never enters closet',requiresSource,async()=>{
 const h=harness();
 const first=await h.send(input);
 assert.equal(first.status,202);
 const a=await first.json();
 assert.equal(a.sourceSha256,actualHash);
 assert.equal(a.canAutoSave,false);
 assert.equal(h.submissions,1);assert.equal(h.claims,1);
 const repeated=await h.send(input);
 assert.equal(repeated.status,409);
 assert.equal(h.submissions,1);assert.equal(h.reservations,2);
 const status=await h.send({action:'status',requestId});
 assert.equal(status.status,200);
 const b=await status.json();
 assert.equal(b.status,'preview-ready');
 assert.equal(b.image,png);
 assert.equal(b.requiresVisualReview,true);
 assert.equal(b.canAutoSave,false);
 assert.equal(h.polls,1);
});
test('a single altered pixel after photo license verification stops before credit',requiresSource,async()=>{
 const h=harness();
 const copy=structuredClone(input);
 const corrupted=Buffer.from(imageBytes);
 corrupted[corrupted.length-16]^=1;
 copy.candidate.garmentImage='data:image/jpeg;base64,'+corrupted.toString('base64');
 const result=await h.send(copy);
 assert.equal(result.status,409);
 assert.equal(h.reservations,0);assert.equal(h.submissions,0);
});
test('missing permission for external upload blocks even correctly sourced photo',requiresSource,async()=>{
 const h=harness();
 const candidate=structuredClone(input);candidate.consentToProvider=false;
 assert.equal((await h.send(candidate)).status,400);
 assert.equal(h.reservations,0);
});
