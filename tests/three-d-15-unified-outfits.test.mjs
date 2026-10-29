import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DRESS_ID,dressRings,requireDress,fitDressEnvelope} from '../research/three-d-15/dress-shell.mjs';
import {isPinnedProviderUrl} from '../research/three-d-15/cc0-pinned-download.mjs';
const sample=()=>({id:DRESS_ID,type:'dress',sourceSHA256:'a'.repeat(64),ownerApproved:false,
 humanVisualApproval:false,releaseAuthorized:false,realFabricTexture:true,
 cutout:{naturalWidth:300,naturalHeight:450},cropRect:[.1,.13,.8,.8],baseColor:[.38,.30,.33]});
test('real original photograph or provisional cutout never auto-approves dress',()=>{
 assert.equal(DRESS_ID,'commons-0053');
 assert.throws(()=>requireDress(sample(),false));
 assert.equal(requireDress(sample(),true).id,'commons-0053');
 for(const bad of [{id:'commons-0003'},{type:'pants'},{sourceSHA256:'notverified'},
  {ownerApproved:true},{humanVisualApproval:true},{releaseAuthorized:true},
  {realFabricTexture:false},{cutout:null},{cropRect:[.4,.4,.9,.9]},{baseColor:[-1,1,1]}])
  assert.throws(()=>requireDress({...sample(),...bad},true));
});
test('original A-line dress is a separate skeleton-bound mesh with original front RGB and neutral unphotographed back',async()=>{
 const s=await readFile('research/three-d-15/dress-shell.mjs','utf8');
 const rings=dressRings(1.10,1.60,.245);
 assert.equal(rings.length,9);
 assert.ok(rings[0][1]>rings[3][1]+.10);
 assert.match(s,/new T\.SkinnedMesh/);
 assert.match(s,/mesh\.bind\(base\.skeleton,base\.bindMatrix\)/);
 assert.match(s,/triangles\.push\(a,a\+1,b,a\+1,b\+1,b\)/);
 assert.match(s,/samplePixel\.rgb/);
 assert.match(s,/smoothstep\(\.15,\.54,vDressNormal\.z\)/);
 assert.match(s,/sourceBodyEnvelope:true/);
 assert.match(s,/collisionValidated:false/);
 const points=[];
 for(const [y] of rings)for(const dx of [-.16,-.10,-.04,.04,.10,.16]){
  points.push({x:dx,y:y+.018,z:.31},{x:dx,y:y-.018,z:-.17});
 }
 assert.ok(fitDressEnvelope(rings,points).slice(2,-1).every(r=>r.front>=.345));
});
test('unified renderer uses exact Work60 pants and Work59 original shirt WITHOUT duplicating their modules',async()=>{
 const s=await readFile('research/three-d-15/showroom.mjs','utf8');
 assert.match(s,/createPantsFitter/);
 assert.match(s,/attachReviewedShirt/);
 assert.match(s,/buildSourceDress/);
 assert.match(s,/requireDress\(candidate,reviewed\)/);
 assert.match(s,/const applyDress=/);
 assert.match(s,/clearShirt\(\);clearPants\(\);clearDress\(\)/,'Dress must remove other garments');
 assert.match(s,/clearDress\(\);clearShirt\(\)/,'Shirt must remove dress');
 assert.match(s,/clearDress\(\);clearPants\(\)/,'Pants must remove dress');
 assert.match(s,/clearDress\(\);clearShirt\(\);clearPants\(\);releaseBodyPresentation\(selected\)/);
 assert.match(s,/dress:dress\?dress\.stats:null/);
 assert.match(s,/dress\?\.dispose\(\)/);
 assert.match(s,/setFashionPose\(selected,'source'\)/);
 assert.match(s,/finally\{setFashionPose\(selected,pose\);\}/);
 assert.match(s,/new THREE\.WebGLRenderer/);
 assert.doesNotMatch(s,/sourceSHA256:null.*dress|approved:true/);
});
test('independently verified source JPEG and PNG required for both apparel photographs; pants remains intentionally neutral',async()=>{
 const s=await readFile('research/three-d-15/demo.mjs','utf8');
 const pants=await readFile('research/three-d-13/pants-source.mjs','utf8');
 assert.match(s,/dressRow\.sourceSHA256!==dressLicense\.sha256/);
 assert.match(s,/readVerifiedAsset\('\/benchmark\/work47\/assets\/'\+DRESS_ID\+'\.jpg'/);
 assert.match(s,/readVerifiedAsset\('\/benchmark\/work47\/assets\/'\+DRESS_ID\+'\.png'/);
 assert.match(s,/loadLicensedCutout\(DRESS_ID,\{manifest,reviewConfirmed:true\}\)/);
 assert.match(s,/event\.isTrusted/);
 assert.match(s,/app\.applyDress\(item,\{reviewed:true\}\)/);
 assert.match(s,/app\.applyShirt\(source,\{acknowledged:true\}\)/);
 assert.match(pants,/hasCutout/);
 assert.match(s,/app\.clearDress\(\)/);
 const html=await readFile('research/three-d-15/index.html','utf8');
 assert.match(html,/id="dressReview"/);
 assert.match(html,/id="dressApply" disabled/);
 assert.match(html,/not visually accepted|NOT an accepted garment fit/i);
});
test('original CC0 provider redirect remains restricted to exact allowed provider + model path',()=>{
 const good='https://files.innerscene.com/library/female-base-mesh-3d-person-rigged-a-pose-dba97ed5/8da570410cb260e809c5/female-base-mesh-base_female.glb';
 assert.equal(isPinnedProviderUrl(good,'female'),true);
 assert.equal(isPinnedProviderUrl(good,'male'),false);
 assert.equal(isPinnedProviderUrl(good.replace('https:','http:'),'female'),false);
 assert.equal(isPinnedProviderUrl('https://malicious.example/assets/female-base-mesh-base_female.glb','female'),false);
});
test('no cloud, real customer, paid AI, external browser or production integrations',async()=>{
 for(const f of ['research/three-d-15/showroom.mjs','research/three-d-15/demo.mjs',
  'research/three-d-15/dress-shell.mjs','research/three-d-15/index.html']){
  const s=await readFile(f,'utf8');
  for(const re of [/supabase\.co/,/localStorage/,/indexedDB/,/getUserMedia/,/sendBeacon/,
   /openai\.com/,/cdn\.jsdelivr/,/unpkg\.com/,/XMLHttpRequest/])
   assert.doesNotMatch(s,re);
 }
});
