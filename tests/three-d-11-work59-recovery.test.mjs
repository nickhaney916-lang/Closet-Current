import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createVerifiedPhotoFallback,LICENSED_FALLBACK}
 from '../research/three-d-11/work59-verified-photo-fallback.mjs';

function documentStub(){
 const ids=['photoFallback','fallbackOriginal','avatar','fallbackReason','status',
  'photoStatus','front','threequarter','side','back','reset','spin','model','finish',
  'pose','review','dress','garment','closeReview','zoomIn','zoomOut','reviewDialog'];
 const elements=Object.fromEntries(ids.map(id=>[id,{
  hidden:id==='photoFallback'||id==='fallbackOriginal',disabled:false,checked:false,
  dataset:{},textContent:'',attributes:{},
  removeAttribute(k){delete this[k];},setAttribute(k,v){this.attributes[k]=v;},
  open:id==='reviewDialog',close(){this.open=false;}
 }]));
 return {doc:{location:{origin:'http://127.0.0.1:4444'},getElementById:id=>elements[id]},els:elements};
}
const original=()=>({id:'commons-0003',sourceSHA256:'f'.repeat(64),
 url:'../../benchmark/work47/assets/commons-0003.jpg',
 verifiedPreviewURL:'blob:http://127.0.0.1:4444/hashed-source-original'});

test('Verified original replaces unavailable GPU without claiming clothing fit or approval',()=>{
 const {doc,els}=documentStub();let cleanup=0;
 const recovery=createVerifiedPhotoFallback(doc,{onDeactivate:()=>cleanup++});
 assert.equal(recovery.authorize(original()),true);
 const result=recovery.show('No WebGL or body');
 assert.equal(result.originalVerified,true);
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.sourceSHA256,'f'.repeat(64));
 assert.equal(cleanup,1);
 assert.equal(els.reviewDialog.open,false,'Open source review must close on failure');
 assert.equal(els.photoFallback.hidden,false);
 assert.equal(els.fallbackOriginal.src,original().verifiedPreviewURL);
 assert.notEqual(els.fallbackOriginal.src,LICENSED_FALLBACK.url,'Never refetch bytes after hash check');
 assert.equal(els.fallbackOriginal.hidden,false);
 assert.equal(els.avatar.hidden,true);
 for(const [k,v] of Object.entries({photoOnly:'true',shirt:'none',photoSource:'',
  photoApproved:'false',releaseAuthorized:'false',ready:'false'}))
  assert.equal(els.avatar.dataset[k],v,k);
 for(const id of ['front','threequarter','side','back','reset','spin','model',
  'pose','review','dress','garment','closeReview','zoomIn','zoomOut'])
  assert.equal(els[id].disabled,true,'Disabled: '+id);
 assert.match(els.fallbackReason.textContent,/No outfit was fitted, applied, saved, or approved/);
 assert.equal(recovery.show().photoOnly,true);
 assert.equal(cleanup,1,'Repeated context-loss callbacks never repeat disposal');
 assert.throws(()=>recovery.authorize(original()),/finalized/);
});
test('Unverified, corrupted or absent original cannot appear even in fallback',()=>{
 const {doc,els}=documentStub();
 const recovery=createVerifiedPhotoFallback(doc);
 const result=recovery.show('Source hash mismatch');
 assert.equal(result.originalVerified,false);
 assert.equal(els.fallbackOriginal.hidden,true);
 assert.equal(els.fallbackOriginal.src,undefined);
 assert.match(els.fallbackReason.textContent,/could not be verified/);
});
test('Exact existing licensed ID, local original URL and SHA are mandatory',()=>{
 for(const invalid of [{id:'commons-0053'},{sourceSHA256:'no hash'},
  {url:'https://example.invalid/garment.jpg'},
  {url:'../../benchmark/work47/assets/commons-0003.png'},
  {url:'../../benchmark/work47/assets/../untrusted.jpg'},
  {verifiedPreviewURL:'https://example.invalid/garment.jpg'},
  {verifiedPreviewURL:'blob:https://example.invalid/replaced'}]){
  const {doc}=documentStub(),gate=createVerifiedPhotoFallback(doc);
  assert.throws(()=>gate.authorize({...original(),...invalid}));
  assert.equal(gate.getState().originalVerified,false);
 }
});
test('Work59 drape viewer hashes BOTH original and cutout before initializing WebGL',async()=>{
 const [demo,html,gate]=await Promise.all([
  readFile('research/three-d-11/demo.mjs','utf8'),
  readFile('research/three-d-11/index.html','utf8'),
  readFile('research/three-d-11/work59-verified-photo-fallback.mjs','utf8')
 ]);
 const originalHash=demo.indexOf("readVerifiedAsset('/benchmark/work47/assets/'+LICENSED_SHIRT+'.jpg'");
 const pngHash=demo.indexOf("readVerifiedAsset('/benchmark/work47/assets/'+LICENSED_SHIRT+'.png'");
 const authorize=demo.indexOf('fallback.authorize(');
 const mount=demo.indexOf('app=mountAnatomicalShowroom(');
 assert.ok(originalHash>=0&&pngHash>originalHash&&authorize>pngHash&&mount>authorize,
  'Do not mount a WebGL body before source integrity and fallback authorization');
 assert.match(demo,/failover\(e\)/);
 assert.match(demo,/webglcontextlost/);
 assert.match(demo,/if\(t===epoch&&!degraded\)/);
 assert.match(demo,/app\?\.stop\(\)/);
 assert.match(html,/id="photoFallback" hidden/);
 assert.match(html,/id="fallbackOriginal" hidden/);
 assert.match(html,/\[hidden\]\{display:none!important\}/);
 assert.match(gate,/garment','threequarter'/);
 assert.match(gate,/image\.src=original\.displayURL/);
 assert.match(demo,/verifiedPreviewURL:previews\[0\]/);
 for(const src of [demo,html,gate])
  assert.doesNotMatch(src,/supabase\.co|localStorage|indexedDB|sendBeacon|openai\.com|unpkg\.com|jsdelivr\.net/);
});
