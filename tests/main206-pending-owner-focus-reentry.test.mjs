/**
 * M206: owner-photo verification must be revoked while async in-flight
 * if the signed session briefly changes during native focus/reentry.
 * Uses licensed real Commons JPEG and synthetic owner; no hosted credentials,
 * saved owner data, deployment, or 3D authorization.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {mountOwnerOutfitPhotoPreview1054} from '../public/native-2d-preview-p99.mjs';

const imageBytes=readFileSync('benchmark/fixtures/commons-0053.jpg');
const sha=createHash('sha256').update(imageBytes).digest('hex');
const original='data:image/jpeg;base64,'+imageBytes.toString('base64');
const owner='m206-synthetic-owner';
const board={name:'Reviewed original',occasion:'Casual',slots:{top:'dress'}};
const row=()=>({
 id:'dress',ownerId:owner,category:'Dresses',itemType:'Casual dress',
 color:'Black',colorSource:'user',ownerReviewed:true,userAdjusted:true,
 singleGarmentVerified:true,sourcePhotoOriginal:true,sourceHashVerified:true,
 sourceSHA256:sha,originalPhoto:{image:original,sha256:sha}
});
const runtime={URL,encodeURIComponent};
vm.createContext(runtime);
vm.runInContext(readFileSync('public/outfit-board-engine.js','utf8'),runtime);
const normalize=(v,items)=>runtime.cleanOutfitBoard(v,items);
function el(tag='div'){
 return {tagName:tag,style:{},dataset:{},children:[],
  append(...parts){this.children.push(...parts);},
  replaceChildren(...parts){this.children=[...parts];},
  querySelectorAll(name){
   const results=[];
   const walk=x=>{
    if(x?.tagName===name)results.push(x);
    for(const child of x?.children||[])walk(child);
   };
   walk(this);return results;
  }};
}
class Doc extends EventTarget{
 hidden=false;
 createElement(tag){return el(tag);}
}
function deferred(){
 let resolve,reject;
 const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
 return {promise,resolve,reject};
}
function subject({pauseBoard=false,pauseRows=false}={}){
 const realAuth={user:{id:owner},assertCurrent(){}};
 const db={name:'closet-current-user-'+owner};
 let active={authenticated:true,ownerId:owner,
  epoch:'m206-session-a',operationEpoch:5,authRef:realAuth,
  privateDbRef:db,privateDbName:db.name};
 const gate=deferred(),target=el('section'),events=new EventTarget(),doc=new Doc();
 let reads=0,boardReads=0;
 const viewer=mountOwnerOutfitPhotoPreview1054({
  target,events,doc,cleanBoard:normalize,getSession:()=>active,
  getBoard:()=>pauseBoard&&++boardReads===1?gate.promise:structuredClone(board),
  readOwnerItems:async()=>{reads++;return pauseRows&&reads===1?
   await gate.promise:[structuredClone(row())];}
 });
 return {viewer,events,doc,target,gate,
  swapAuth(){active={...active,
   authRef:{user:{id:owner},assertCurrent(){}}};},
  restoreAuth(){active={...active,authRef:realAuth};},
  swapDb(){active={...active,privateDbRef:{name:db.name}};},
  restoreDb(){active={...active,privateDbRef:db};},
  resolve(){gate.resolve(pauseBoard?structuredClone(board):[structuredClone(row())]);}
 };
}
test('M206 licensed JPEG SHA source is genuine',()=>{
 assert.equal(imageBytes[0],255);assert.equal(imageBytes[1],216);
 assert.match(sha,/^[0-9a-f]{64}$/);
});
for(const kind of ['auth','db']){
 for(const gateType of ['board','private-read']){
  test('M206 temporary '+kind+' reference swap during '+gateType+
    ' async focus revokes even if same owner ref returns before resolution',async()=>{
   const h=subject({pauseBoard:gateType==='board',
    pauseRows:gateType==='private-read'});
   try{
    const pending=h.viewer.refresh();
    if(kind==='auth')h.swapAuth();else h.swapDb();
    h.events.dispatchEvent(new Event('focus'));
    if(kind==='auth')h.restoreAuth();else h.restoreDb();
    h.resolve();
    await assert.rejects(pending,/MAIN1054_PREVIEW signed owner or refresh changed/);
    assert.equal(h.target.querySelectorAll('img').length,0);
    assert.equal(h.viewer.status.hasOwnerPhotos,false);
    assert.equal(h.viewer.status.renderAuthorized3D,false);
    assert.equal(h.viewer.status.familyAlpha,'HOLD');
   }finally{h.viewer.dispose();}
  });
 }
}
test('M206 unchanged focused in-flight owner source may still finish safely',async()=>{
 const h=subject({pauseBoard:true});
 try{
  const pending=h.viewer.refresh();
  h.events.dispatchEvent(new Event('focus'));
  h.resolve();
  const result=await pending;
  assert.equal(result.presentationMode,'verified-original-photo-2d');
  assert.equal(h.target.querySelectorAll('img').length,1);
  assert.equal(h.viewer.status.phase,'visible');
  assert.equal(h.viewer.status.renderAuthorized3D,false);
 }finally{h.viewer.dispose();}
});
test('M206 existing visible original still revoked on focus auth reference change',async()=>{
 const h=subject();
 try{
  await h.viewer.refresh();
  assert.equal(h.target.querySelectorAll('img').length,1);
  h.swapAuth();h.events.dispatchEvent(new Event('focus'));
  h.restoreAuth();
  assert.equal(h.target.querySelectorAll('img').length,0);
  assert.equal(h.viewer.status.hasOwnerPhotos,false);
 }finally{h.viewer.dispose();}
});


test('M206 cancelled focus owner lease permits a fresh explicit same-owner reentry',async()=>{
 const h=subject({pauseBoard:true});
 try{
  const pending=h.viewer.refresh();
  h.swapAuth();h.events.dispatchEvent(new Event('focus'));
  h.restoreAuth();h.resolve();
  await assert.rejects(pending,/MAIN1054_PREVIEW signed owner or refresh changed/);
  assert.equal(h.target.querySelectorAll('img').length,0);
  const result=await h.viewer.refresh();
  assert.equal(result.presentationMode,'verified-original-photo-2d');
  assert.equal(result.renderAuthorized3D,false);
  assert.equal(result.releaseAuthorized,false);
  assert.equal(h.target.querySelectorAll('img').length,1);
 }finally{h.viewer.dispose();}
});
