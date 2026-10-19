import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateStart,validateContinuation,completedIntermediateImage,providerRequest,safeJobId,normalizeStatus} from '../supabase/functions/ai-try-on/protocol.mjs';

const img='data:image/jpeg;base64,'+'Ab9/'.repeat(40);
test('conservative server request uses real virtual try-on inference with base64-only output',()=>{
 const input=validateStart({action:'start',figure:'female',category:'tops',garmentImage:img});
 const payload=providerRequest({modelImage:'https://example.com/standard-female.jpg',garmentImage:input.garmentImage,category:input.category});
 assert.equal(payload.model_name,'tryon-v1.6');
 assert.equal(payload.inputs.category,'tops');
 assert.equal(payload.inputs.garment_image,img);
 assert.equal(payload.inputs.model_image,'https://example.com/standard-female.jpg');
 assert.equal(payload.inputs.return_base64,true);
 assert.equal(payload.inputs.moderation_level,'conservative');
 assert.equal(payload.inputs.num_samples,1);
});
test('malicious or wrongly typed image inputs cannot be used to start paid inference',()=>{
 const request={action:'start',figure:'male',category:'one-pieces',garmentImage:img};
 assert.equal(validateStart(request).category,'one-pieces');
 for(const bad of [
  {...request,figure:'child'},
  {...request,category:'shoes'},
  {...request,garmentImage:'https://tracking.example/photo.jpg'},
  {...request,garmentImage:'data:text/html;base64,'+'A'.repeat(200)},
  {...request,garmentImage:'data:image/jpeg;base64,'+'A'.repeat(7_500_001)},
  {...request,action:'status'}
 ])assert.throws(()=>validateStart(bad),/Invalid/);
 for(const bad of ['http://insecure.example/model.jpg','file:///etc/passwd','javascript:alert(1)'])
  assert.throws(()=>providerRequest({modelImage:bad,garmentImage:img,category:'tops'}),/Standard figure/);
});
test('provider responses are strictly normalized and do not expose arbitrary redirects',()=>{
 assert.equal(normalizeStatus({status:'starting'}).status,'processing');
 assert.equal(normalizeStatus({status:'processing'}).status,'processing');
 assert.equal(normalizeStatus({status:'failed',error:{message:'secret provider debug'}}).status,'failed');
 assert.deepEqual(normalizeStatus({status:'completed',output:[img]}),{status:'completed',image:img});
 assert.throws(()=>normalizeStatus({status:'completed',output:['https://evil.example/out.png']}),/unavailable/);
 assert.throws(()=>normalizeStatus({status:'unknown'}),/Unexpected/);
 assert.equal(safeJobId('123a87r9-4129-4bb3-be18-9c9fb5bd7fc1-u1'),true);
 assert.equal(safeJobId('../evil'),false);
});
test('server is deny-by-default, requires signed user-bound jobs, and keeps provider key off client',()=>{
 const server=readFileSync('supabase/functions/ai-try-on/index.ts','utf8');
 assert.match(server,/TRYON_ENABLED.*==='true'/);
 assert.match(server,/action==='availability'/);
 assert.match(server,/status:enabled&&allowedAccount\?'ready':'unavailable'/);
 assert.match(server,/TRYON_PILOT_USER_IDS/);
 assert.match(server,/TRYON_JOB_SIGNING_KEY/);
 assert.match(server,/crypto\.subtle\.verify/);
 assert.match(server,/userFromToken/);
 assert.match(server,/\/auth\/v1\/user/);
 assert.match(server,/FASHN_API_KEY/);
 assert.match(server,/input\.figure==='female'/);
 assert.doesNotMatch(readFileSync('public/ai-tryon.js','utf8'),/FASHN_API_KEY/);
});

test('a second AI garment requires a signed compatible first-stage server job, not a client model image',()=>{
 const first={step:1,figure:'female',category:'tops'};
 const second=validateContinuation({action:'continue',figure:'female',category:'bottoms',garmentImage:img},first);
 assert.equal(second.figure,'female');
 assert.equal(second.category,'bottoms');
 assert.equal(second.garmentImage,img);
 const sequential=providerRequest({modelImage:img,garmentImage:second.garmentImage,category:second.category});
 assert.equal(sequential.inputs.model_image,img,'provider-verified first output becomes second model input');
 assert.equal(sequential.inputs.garment_image,img);
 assert.equal(sequential.inputs.num_samples,1);
 for(const bad of [
  {action:'continue',figure:'female',category:'tops',garmentImage:img},
  {action:'continue',figure:'male',category:'bottoms',garmentImage:img},
  {action:'continue',figure:'female',category:'shoes',garmentImage:img},
  {action:'continue',figure:'female',category:'bottoms',garmentImage:'https://attacker.example/photo'},
  {action:'start',figure:'female',category:'bottoms',garmentImage:img}
 ])assert.throws(()=>validateContinuation(bad,first),/Invalid multi/);
 assert.throws(()=>validateContinuation({action:'continue',figure:'female',category:'bottoms',garmentImage:img},{...first,step:2}),/Invalid multi/);
});
test('only completed provider-image data is acceptable for second-stage model image',()=>{
 assert.equal(completedIntermediateImage({status:'completed',output:[img]}),img);
 for(const v of [{status:'processing'},{status:'failed'},
   {status:'completed',output:['https://example.com/hijacked-source.jpg']},
   {status:'completed',output:['data:text/html;base64,'+'A'.repeat(200)]}])
  assert.throws(()=>completedIntermediateImage(v),/incomplete|unavailable/);
});
test('multi-garment production activation is hard-disabled pending consent, quotas and source fidelity',()=>{
 const server=readFileSync('supabase/functions/ai-try-on/index.ts','utf8');
 assert.match(server,/CHAINED_PAID_INFERENCE_APPROVED=false/);
 assert.match(server,/TRYON_MULTI_ENABLED/);
 assert.match(server,/action==='continue'/);
 assert.match(server,/readPrediction\(body\.previousToken,user\)/);
 assert.match(server,/completedIntermediateImage/);
 assert.match(server,/signPrediction\(response\.id,user,input\.figure,input\.category,1\)/);
 assert.match(server,/previousToken/);
 assert.match(server,/crypto\.subtle\.verify/);
});
