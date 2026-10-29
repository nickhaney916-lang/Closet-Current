import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createVerifiedPhotoFallback,LICENSED_FALLBACK}
 from '../research/three-d-11/verified-photo-fallback.mjs';
function fakeDOM(){
 const ids=['photoFallback','fallbackOriginal','avatar','fallbackReason','status','photoStatus',
  'front','side','back','turn','reset','spin','model','finish','mode','pose','review','dress','clear'];
 const els=Object.fromEntries(ids.map(id=>[id,{
  hidden:id==='photoFallback'||id==='fallbackOriginal',disabled:false,checked:id==='review',
  dataset:{},textContent:'',attributes:{},removeAttribute(k){delete this[k];},
  setAttribute(k,v){this.attributes[k]=v;}
 }]));
 return {doc:{getElementById:id=>els[id]},els};
}
const verified=()=>({id:'commons-0003',sourceSHA256:'f'.repeat(64),
 url:'../../benchmark/work47/assets/commons-0003.jpg'});
test('Verified original survives disabled WebGL without approving/creating an outfit',()=>{
 const {doc,els}=fakeDOM();let cleanup=0;
 const gate=createVerifiedPhotoFallback(doc,{onDeactivate:()=>cleanup++});
 assert.deepEqual(gate.getState(),{photoOnly:false,originalVerified:false,id:null,releaseAuthorized:false});
 assert.equal(gate.authorize(verified()),true);
 const result=gate.show('No WebGL');
 assert.equal(result.photoOnly,true);assert.equal(result.originalVerified,true);
 assert.equal(result.sourceSHA256,'f'.repeat(64));assert.equal(cleanup,1);
 assert.equal(els.photoFallback.hidden,false);assert.equal(els.avatar.hidden,true);
 assert.equal(els.fallbackOriginal.hidden,false);
 assert.equal(els.fallbackOriginal.src,LICENSED_FALLBACK.url);
 assert.equal(els.avatar.dataset.photoOnly,'true');
 assert.equal(els.avatar.dataset.shirt,'none');
 assert.equal(els.avatar.dataset.photoApproved,'false');
 assert.equal(els.avatar.dataset.releaseAuthorized,'false');
 assert.match(els.fallbackReason.textContent,/No outfit was fitted, applied, saved, or approved/);
 for(const id of ['review','dress','mode','pose','model','front','spin','clear'])
  assert.equal(els[id].disabled,true,id+' must not permit invalid 3D interactions');
 assert.equal(gate.show().photoOnly,true);
 assert.equal(cleanup,1,'Multiple WebGL failures must not trigger additional cleanup');
 assert.throws(()=>gate.authorize(verified()),/finalized/);
});
test('Photo original is fail closed when no verified source identity was supplied',()=>{
 const {doc,els}=fakeDOM();
 const gate=createVerifiedPhotoFallback(doc);
 const result=gate.show('No source or offline');
 assert.equal(result.originalVerified,false);
 assert.equal(els.fallbackOriginal.hidden,true);
 assert.equal(els.fallbackOriginal.src,undefined);
 assert.equal(els.avatar.dataset.shirt,'none');
 assert.match(els.fallbackReason.textContent,/could not be verified/);
});
test('A source can only be authorized by exact licensed local original ID URL and SHA',()=>{
 for(const invalid of [
  {id:'commons-0053'},{sourceSHA256:'not verified'},
  {url:'https://other.invalid/not-local.jpg'},
  {url:'../../benchmark/work47/assets/commons-0003.png'},
  {url:'../../benchmark/work47/assets/../danger.jpg'}
 ]){
  const {doc}=fakeDOM();const gate=createVerifiedPhotoFallback(doc);
  assert.throws(()=>gate.authorize({...verified(),...invalid}));
  assert.equal(gate.getState().originalVerified,false);
 }
});
test('Exact parent original/PNG source hash verification occurs before WebGL initialization',async()=>{
 const [demo,html,gate]=await Promise.all([
  readFile('research/three-d-08/demo.mjs','utf8'),
  readFile('research/three-d-08/index.html','utf8'),
  readFile('research/three-d-11/verified-photo-fallback.mjs','utf8')
 ]);
 const proof=demo.indexOf('readVerifiedAsset(');
 const authorized=demo.indexOf('photoFallback.authorize(');
 const render=demo.indexOf('app=mountAnatomicalShowroom(');
 assert.ok(proof>=0&&authorized>proof&&render>authorized,
  'License and byte identity must be checked before attempting WebGL renderer');
 assert.match(demo,/photoFallback\?\.show\('3D startup unavailable'\)/);
 assert.match(demo,/photoFallback\?\.show\('Verified local anatomical model cannot load'\)/);
 assert.match(demo,/webglcontextlost/);
 assert.match(demo,/event\.preventDefault\(\)/);
 assert.match(html,/id="photoFallback" hidden/);
 assert.match(html,/id="fallbackOriginal" hidden/);
 assert.match(html,/\[hidden\]\{display:none!important\}/);
 for(const src of [demo,html,gate])
  assert.doesNotMatch(src,/supabase\.co|localStorage|indexedDB|sendBeacon|openai\.com|unpkg\.com|jsdelivr\.net/);
});
