import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DRESS_ID,dressRings,requireDress,fitDressEnvelope} from '../research/three-d-14/dress-shell.mjs';
import {isPinnedProviderUrl} from '../research/three-d-14/cc0-pinned-download.mjs';
const sample=()=>({id:DRESS_ID,type:'dress',
 sourceSHA256:'a'.repeat(64),ownerApproved:false,humanVisualApproval:false,
 releaseAuthorized:false,realFabricTexture:true,
 cutout:{naturalWidth:300,naturalHeight:450},cropRect:[.1,.13,.8,.8],baseColor:[.38,.30,.33]});
test('Only original-source-reviewed licensed dress candidate can enter real humanoid',()=>{
 assert.equal(DRESS_ID,'commons-0053');
 assert.throws(()=>requireDress(sample(),false));
 assert.equal(requireDress(sample(),true).id,DRESS_ID);
 for(const v of [{id:'commons-0003'},{type:'pants'},{sourceSHA256:'not verified'},
  {ownerApproved:true},{humanVisualApproval:true},{releaseAuthorized:true},{realFabricTexture:false},
  {cropRect:[.5,.5,.9,.9]},{baseColor:[-1,0,0]},{cutout:null}])
  assert.throws(()=>requireDress({...sample(),...v},true));
});
test('Anatomical A-line dress is single continuous skirt without two pant legs',()=>{
 const p=dressRings(1.10,1.60,.245);
 assert.equal(p.length,9);assert.ok(p[0][0]<.7&&p.at(-1)[0]>1.55);
 assert.ok(p[0][1]>p[3][1]+.1,'A-line hem must flare beyond waist');
 assert.ok(p[0][2]>p[3][2],'Skirt back should flare too');
 assert.ok(p.every(([y,x,z])=>[y,x,z].every(Number.isFinite)));
 assert.ok(p.every(([y],i)=>i===0||y>p[i-1][0]));
 for(const args of [[.5,1.7,.23],[1.12,1.15,.23],[1.05,1.67,.51],[NaN,1.5,.3]])
  assert.throws(()=>dressRings(...args));
});
test('Separate dress keeps shared skeleton, source cutout and front-only original RGB',async()=>{
 const s=await readFile('research/three-d-14/dress-shell.mjs','utf8');
 assert.match(s,/new T\.SkinnedMesh/);
 assert.match(s,/triangles\.push\(a,a\+1,b,a\+1,b\+1,b\)/,'Outward-facing original photo normals required');
 assert.match(s,/mesh\.bind\(base\.skeleton,base\.bindMatrix\)/);
 assert.match(s,/skinWeight/);
 assert.match(s,/uDressImage/);
 assert.match(s,/samplePixel\.rgb/);
 assert.match(s,/smoothstep\(\.15,\.54,vDressNormal\.z\)/);
 assert.match(s,/vDressNormal=normalize\(mat3\(modelMatrix\)\*normal\)/);
 assert.match(s,/realSeparate3DMesh:true/);
 assert.match(s,/collisionValidated:false/);
 assert.match(s,/releaseAuthorized:false/);
});
test('No paid inference, personal photos, storage, remote runtime dependencies or production edit',async()=>{
 const paths=['research/three-d-14/dress-shell.mjs','research/three-d-14/showroom.mjs',
  'research/three-d-14/demo.mjs','research/three-d-14/index.html'];
 for(const p of paths){
  const s=await readFile(p,'utf8');
  for(const prohibited of [/supabase\.co/,/localStorage/,/indexedDB/,/getUserMedia/,
   /openai\.com/,/unpkg\.com/,/cdn\.jsdelivr\.net/,/sendBeacon/,/XMLHttpRequest/])
   assert.doesNotMatch(s,prohibited,p);
 }
 const demo=await readFile('research/three-d-14/demo.mjs','utf8');
 assert.match(demo,/loadLicensedCutout\(DRESS_ID/);
 assert.match(demo,/readVerifiedAsset/);
 assert.match(demo,/event\.isTrusted/);
 assert.match(demo,/manifest\.release!=='HOLD'/);
 const html=await readFile('research/three-d-14/index.html','utf8');
 assert.match(html,/Family Alpha HOLD/);
 assert.match(html,/Provisional source-RGB cutout/);
});

test('CC0 redirect allowlist permits provider-owned files only with exact model path',()=>{
 const good='https://files.innerscene.com/library/female-base-mesh-3d-person-rigged-a-pose-dba97ed5/8da570410cb260e809c5/female-base-mesh-base_female.glb';
 assert.equal(isPinnedProviderUrl(good,'female'),true);
 assert.equal(isPinnedProviderUrl('https://evil.example/library/female-base-mesh-3d-person-rigged-a-pose-dba97ed5/1/file.glb','female'),false);
 assert.equal(isPinnedProviderUrl('http://files.innerscene.com/library/female-base-mesh-3d-person-rigged-a-pose-dba97ed5/1/file.glb','female'),false);
 assert.equal(isPinnedProviderUrl(good,'male'),false);
 assert.equal(isPinnedProviderUrl('https://files.innerscene.com/library/female-base-mesh-3d-person-rigged-a-pose-dba97ed5/1/../../secrets.glb','female'),false);
});

test('Studio loader is declared in module scope and startup stays diagnostic',async()=>{
 const viewer=await readFile('research/three-d-14/showroom.mjs','utf8');
 const browser=await readFile('scripts/test-three-d-14-browser.mjs','utf8');
 assert.match(viewer,/const loader=new GLTFLoader\(\)/);
 assert.doesNotMatch(viewer,/scene\.add\(display\),loader=/);
 assert.match(browser,/DRESS_3D14_STARTUP_DIAGNOSTIC/);
});

test('Actual chest depth drives front dress clearance without inflating inferred back',()=>{
 const rings=dressRings(1.10,1.60,.245),pts=[];
 for(const [y] of rings)for(const dx of [-.16,-.10,-.04,.04,.10,.16]){
  pts.push({x:dx,y:y+.018,z:.31},{x:dx,y:y-.018,z:-.17});
 }
 const fitted=fitDressEnvelope(rings,pts);
 assert.equal(fitted.length,9);
 for(const row of fitted.slice(2,-1)){
  assert.ok(row.front>=.345,'Real breasts and abdomen must not pass through dress bodice');
  assert.ok(row.back<=.65,'Rear material is a separate bounded envelope');
  assert.ok(row.measuredSourcePose);
 }
 assert.equal(fitted.at(-1).neckOpening,true,'Anatomical neck remains intentionally open');
 assert.throws(()=>fitDressEnvelope(rings,[]));
});
