/**
 * MAIN188 — original-photo 2D must not approve or render a deleted or
 * explicitly source-revoked private garment, including mutations during
 * asynchronous SHA verification. This is a public licensed photo and
 * synthetic owner/session; no actual user photos, hosting or writes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {preflightOwnedOutfit1054} from '../public/native-outfit-source-plan-p99.mjs';
import {mountOwnerOutfitPhotoPreview1054} from '../public/native-2d-preview-p99.mjs';

const bytes=readFileSync('benchmark/fixtures/commons-0053.jpg');
const hash=createHash('sha256').update(bytes).digest('hex');
const image='data:image/jpeg;base64,'+bytes.toString('base64');
const OWNER='m188-synthetic-owner';
const board={slots:{top:'m188-reviewed-dress'}};
const boardRuntime={URL,encodeURIComponent};
vm.createContext(boardRuntime);
vm.runInContext(readFileSync('public/outfit-board-engine.js','utf8'),boardRuntime);
const cleanBoard=(value,rows)=>boardRuntime.cleanOutfitBoard(value,rows);
const original=()=>({
 id:'m188-reviewed-dress',ownerId:OWNER,
 category:'Dresses',itemType:'Casual dress',color:'Black',
 ownerReviewed:true,userAdjusted:true,singleGarmentVerified:true,
 sourcePhotoOriginal:true,sourceHashVerified:true,
 sourceSHA256:hash,originalPhoto:{image,sha256:hash}
});
const snapshot=record=>[structuredClone(record)];
function session(){
 const dbRef={name:'closet-current-user-'+OWNER};
 const authRef={user:{id:OWNER},assertCurrent(){}};
 return ()=>({
  authenticated:true,ownerId:OWNER,epoch:'m188-owner-session',
  operationEpoch:11,authRef,privateDbRef:dbRef,
  privateDbName:dbRef.name
 });
}
const preflight=(getSession,readOwnerItems)=>preflightOwnedOutfit1054({
 getSession,readOwnerItems,cleanBoard,board:structuredClone(board)
});
const node=(tag='div')=>({
 tagName:tag,dataset:{},style:{},children:[],
 append(...children){this.children.push(...children);},
 replaceChildren(...children){this.children=[...children];},
 querySelectorAll(type){
  const result=[];
  const walk=part=>{
   if(part?.tagName===type)result.push(part);
   for(const child of part?.children||[])walk(child);
  };
  walk(this);
  return result;
 }
});
class TestDoc extends EventTarget{
 constructor(){super();this.hidden=false;}
 createElement(tag){return node(tag);}
}
test('M188 baseline licensed public JPEG is authentic, not a synthetic mask',()=>{
 assert.equal(bytes[0],255);assert.equal(bytes[1],216);
 assert.match(hash,/^[0-9a-f]{64}$/);
 assert.equal(original().originalPhoto.sha256,hash);
});
for(const flag of ['deleted','sourceRevoked']){
 test('M188 '+flag+' private garment is refused by source preflight',async()=>{
  const stale={...original(),[flag]:true};
  const getSession=session();
  let reads=0;
  await assert.rejects(
   preflight(getSession,async()=>{reads++;return snapshot(stale);}),
   /MAIN1054 (?:selected garment|saved garment|missing or incompatible owned garment)/);
  // M190 intentionally drops retired rows from live slot eligibility before
  // confirmed() is reached; this is still a fail-closed source refusal.
  assert.equal(reads,1,'retired source is rejected on the first authenticated snapshot');
 });
 test('M188 '+flag+' changed after owner photo SHA is detected before 2D proof',async()=>{
  const getSession=session();
  let reads=0;
  await assert.rejects(preflight(getSession,async()=>{
   reads++;
   return snapshot(reads===1?original():{...original(),[flag]:true});
  }),/MAIN1054 (selected garment|saved garment)/);
  assert.equal(reads,2,'second signed private snapshot witnesses the mutation');
 });
}
test('M188 original photo preview never publishes a source revoked only at final private read',async()=>{
 const getSession=session();
 const target=node('section'),events=new EventTarget(),doc=new TestDoc();
 let reads=0;
 const readOwnerItems=async()=>{
  reads++;
  return snapshot(reads===4?{...original(),sourceRevoked:true}:original());
 };
 const preview=mountOwnerOutfitPhotoPreview1054({
  target,getSession,readOwnerItems,getBoard:()=>structuredClone(board),
  cleanBoard,events,doc
 });
 try{
  await assert.rejects(preview.refresh(),/MAIN1054_PREVIEW selected owner item changed before showing photos/);
  assert.equal(reads,4,'source was revoked after the two preflights, in final signed read');
  assert.equal(target.querySelectorAll('img').length,0,'never publish stale JPEG pixels');
  assert.equal(preview.status.hasOwnerPhotos,false);
  assert.equal(preview.status.renderAuthorized3D,false);
  assert.equal(preview.status.familyAlpha,'HOLD');
 }finally{preview.dispose();}
});
test('M188 unchanged explicitly reviewed owned original still permits original-only 2D',async()=>{
 const getSession=session(),readOwnerItems=async()=>snapshot(original());
 const result=await preflight(getSession,readOwnerItems);
 assert.equal(result.status,'source-verified-2d-only');
 assert.equal(result.slots[0].sourceSHA256,hash);
 assert.equal(result.renderAuthorized3D,false);
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.familyAlpha,'HOLD');
});
