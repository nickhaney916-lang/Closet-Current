import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {OUTFITS,sourceForOutfit} from '../research/three-d-15/outfit-controller.mjs';
import {NECKLINE} from '../research/three-d-23/dress-neckline.mjs';

test('3D-24 joins both independently verified modules without disabling either one',async()=>{
 const [controller,showroom,demo]=await Promise.all([
  readFile('research/three-d-15/outfit-controller.mjs','utf8'),
  readFile('research/three-d-15/showroom.mjs','utf8'),
  readFile('research/three-d-15/demo.mjs','utf8')
 ]);
 assert.match(controller,/finishNecklineAndSeams\(built\.shirt,root\)/);
 assert.match(controller,/shapePhysicalDressNeckline\(raw,\{enabled:dressNeckline\}\)/);
 assert.match(controller,/if\(necklineSeams\)built\.shirt=/);
 assert.match(controller,/if\(next==='dress'\)/);
 assert.match(controller,/necklineSeams=true,dressNeckline=true/);
 assert.match(showroom,/enableCuffBridge,naturalFit,necklineSeams,dressNeckline/);
 assert.match(demo,/necklineSeams:new URLSearchParams\(location\.search\)/);
 assert.match(demo,/dressNeckline:new URLSearchParams\(location\.search\)/);
 assert.equal(NECKLINE.releaseAuthorized,false);
 assert.equal(NECKLINE.humanVisualApproval,false);
});
test('Source identity, privacy, dress exclusivity and explicit original-photo review survive integration',async()=>{
 const s=await readFile('research/three-d-15/outfit-controller.mjs','utf8');
 const demo=await readFile('research/three-d-15/demo.mjs','utf8');
 assert.deepEqual(OUTFITS,['none','pants','shirt','shirt-pants','dress']);
 assert.equal(sourceForOutfit('shirt-pants'),'commons-0003');
 assert.equal(sourceForOutfit('dress'),'commons-0053');
 assert.equal(sourceForOutfit('pants'),null);
 assert.throws(()=>sourceForOutfit('unknown'));
 assert.match(s,/requireDress\(candidate,reviewed\)/);
 assert.match(s,/requireAnatomicalShirtPreview\(candidate,\{acknowledged:reviewed\}\)/);
 assert.match(s,/if\(next.includes\('shirt'\)\)/);
 assert.match(s,/if\(next==='dress'\)/);
 assert.match(s,/Object\.values\(parts\)\.forEach\(g=>g\.dispose\(\)\)/);
 assert.match(s,/setFashionPose\(root,pose\)/);
 assert.match(demo,/event\.isTrusted/);
 assert.match(demo,/readVerifiedAsset\('\/benchmark\/work47\/assets\/'\+id\+'\.jpg'/);
 assert.match(demo,/readVerifiedAsset\('\/benchmark\/work47\/assets\/'\+id\+'\.png'/);
 for(const text of [s,demo]){
  assert.doesNotMatch(text,/localStorage\.setItem|indexedDB\.open|supabase\.co|openai\.com|sendBeacon|getUserMedia/);
 }
});
test('Unchanged source-only dress and shirt modules remain independently toggled and unreleased',async()=>{
 const [shirt,dress]=await Promise.all([
  readFile('research/three-d-22/neckline-seams.mjs','utf8'),
  readFile('research/three-d-23/dress-neckline.mjs','utf8')
 ]);
 assert.match(shirt,/releaseAuthorized:false|humanVisualApproval:false/);
 assert.match(dress,/releaseAuthorized:false/);
 assert.match(dress,/unverifiedRearNecklineUnchanged:true/);
 assert.match(dress,/originalPhotoCoordinatesUnchanged:true/);
 assert.match(dress,/skinWeightsUnchanged:true/);
 assert.doesNotMatch(shirt,/fetch\(|indexedDB|localStorage/);
 assert.doesNotMatch(dress,/fetch\(|indexedDB|localStorage/);
});
