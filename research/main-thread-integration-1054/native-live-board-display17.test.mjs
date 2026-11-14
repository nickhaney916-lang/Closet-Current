import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {mountOwnerOutfitPhotoPreview1054} from './native-2d-preview.mjs';

// Exact native cleanOutfitBoard from real public source, not invented schemas.
const context={URL,encodeURIComponent};vm.createContext(context);
vm.runInContext(readFileSync('public/outfit-board-engine.js','utf8'),context);
const cleanBoard=(board,rows)=>context.cleanOutfitBoard(board,rows);
const owner='synthetic-owner-A';
function makeItem(id,category,seed){
 const b=Buffer.alloc(128);b[0]=255;b[1]=216;b[15]=seed;b[126]=255;b[127]=217;
 const image='data:image/jpeg;base64,'+b.toString('base64');
 const sha=createHash('sha256').update(b).digest('hex');
 return {id,ownerId:owner,category,itemType:'Other',color:'Blue',
  ownerReviewed:true,userAdjusted:true,sourcePhotoOriginal:true,
  sourceHashVerified:true,singleGarmentVerified:true,sourceSHA256:sha,
  originalPhoto:{image,sha256:sha},image};
}
function element(tag='div'){
 return {
  tagName:tag,children:[],dataset:{},style:{},
  append(...children){this.children.push(...children);},
  replaceChildren(...children){this.children=[...children];},
  querySelectorAll(type){
   const found=[];
   const walk=n=>{if(n.tagName===type)found.push(n);
    for(const child of n.children||[])walk(child);};
   walk(this);return found;
  }
 };
}
class Doc extends EventTarget{
 constructor(){super();this.hidden=false;}
 createElement(tag){return element(tag);}
}
function harness({customBoard=null}={}){
 const items=[makeItem('shirt','Tops',1),makeItem('pants','Bottoms',2),
  makeItem('shoes','Shoes',3),makeItem('alternate','Tops',4)];
 const board=customBoard??{name:'Original',occasion:'Casual',
  slots:{top:'shirt',bottom:'pants',shoes:'shoes'}};
 let authRef={user:{id:owner},assertCurrent(){}};
 const privateDbRef={name:'closet-current-user-'+owner};
 let asyncBoard=false,boardBroken=false,readHook=null;
 let calls=0;
 const getSession=()=>({authenticated:true,ownerId:owner,
  epoch:'fixture-epoch-M17',privateDbName:'closet-current-user-'+owner,
  authRef,privateDbRef,operationEpoch:17});
 const getBoard=()=>{
  if(boardBroken)throw Error('failed native board provider');
  if(asyncBoard)return Promise.resolve(structuredClone(board));
  return structuredClone(board);
 };
 const readOwnerItems=async()=>{
  calls++;
  const data=structuredClone(items);
  if(readHook)await readHook(calls);
  return data;
 };
 const target=element('section'),doc=new Doc(),events=new EventTarget();
 const preview=mountOwnerOutfitPhotoPreview1054({
  target,doc,events,getSession,getBoard,readOwnerItems,cleanBoard
 });
 return {items,board,target,doc,events,preview,getBoard,
  get calls(){return calls;},
  changeAuth:()=>authRef={user:{id:owner},assertCurrent(){}},
  changeReadHook:callback=>readHook=callback,
  asyncBoard:()=>{asyncBoard=true;},
  breakBoard:()=>{boardBroken=true;}
 };
}
const photos=h=>h.target.querySelectorAll('img').length;
function denied(h){
 assert.equal(photos(h),0);
 assert.equal(h.preview.status.hasOwnerPhotos,false);
 assert.equal(h.preview.status.renderAuthorized3D,false);
 assert.equal(h.preview.status.releaseAuthorized,false);
}
test('M17 genuine signed source JPEGs render original selected three slots; stable board remains visible',async()=>{
 const h=harness();
 const result=await h.preview.refresh();
 assert.equal(result.slotCount,3);
 assert.equal(result.renderAuthorized3D,false);
 assert.equal(result.threeDResearchStatus,'research-3d-blocked');
 assert.equal(photos(h),3);
 h.events.dispatchEvent(new Event('focus'));
 assert.equal(h.preview.status.phase,'visible');
 assert.equal(photos(h),3);
 h.preview.dispose();denied(h);
});
test('M17 direct same-owner selected shirt change without renderOutfitBoard event revokes display on status',async()=>{
 const h=harness();await h.preview.refresh();
 h.board.slots.top='alternate';
 assert.equal(h.preview.status.hasOwnerPhotos,false);
 denied(h);h.preview.dispose();
});
test('M17 direct garment slot removal revokes prior source photo on focus',async()=>{
 const h=harness();await h.preview.refresh();
 delete h.board.slots.bottom;
 h.events.dispatchEvent(new Event('focus'));
 denied(h);h.preview.dispose();
});
test('M17 direct garment slot insertion revokes old original-photo display',async()=>{
 const h=harness();await h.preview.refresh();
 h.board.slots.layer='alternate';
 h.events.dispatchEvent(new Event('focus'));
 denied(h);h.preview.dispose();
});
test('M17 changing only outfit occasion cancels the original style proof',async()=>{
 const h=harness();await h.preview.refresh();
 h.board.occasion='Dinner';
 assert.equal(h.preview.status.phase,'revoked');
 denied(h);h.preview.dispose();
});
test('M17 changed shopping ideas cannot keep displaying the prior outfit context',async()=>{
 const h=harness();await h.preview.refresh();
 h.board.ideas={layer:{type:'Jacket',color:'Olive'}};
 h.events.dispatchEvent(new Event('focus'));
 denied(h);h.preview.dispose();
});
test('M17 source inventory commit immediately clears visible photos even with same session and slots',async()=>{
 const h=harness();await h.preview.refresh();
 h.events.dispatchEvent(new Event('closet:style-owned-inventory-committed'));
 denied(h);h.preview.dispose();
});
test('M17 genuine native outfit event after revocation cannot resurrect previous images',async()=>{
 const h=harness();await h.preview.refresh();
 h.events.dispatchEvent(new Event('closet:style-owned-inventory-committed'));
 assert.equal(h.preview.status.phase,'revoked');
 h.events.dispatchEvent(new Event('focus'));
 denied(h);h.preview.dispose();
});
test('M17 reordering slot-key insertion is conservatively revocable, never an incorrect old-photo pass',async()=>{
 const h=harness();await h.preview.refresh();
 h.board.slots=Object.fromEntries(Object.entries(h.board.slots).reverse());
 h.preview.status;
 denied(h);h.preview.dispose();
});
test('M17 unresponsive native board provider revokes visible private JPEG instead of silently retaining',async()=>{
 const h=harness();await h.preview.refresh();
 h.breakBoard();h.events.dispatchEvent(new Event('focus'));
 denied(h);h.preview.dispose();
});
test('M17 asynchronous native board provider after initial success fails closed during status',async()=>{
 const h=harness();await h.preview.refresh();
 h.asyncBoard();
 assert.equal(h.preview.status.hasOwnerPhotos,false);
 denied(h);h.preview.dispose();
});
test('M17 malformed/cyclic native board on status cannot expose private photo',async()=>{
 const h=harness();await h.preview.refresh();
 h.board.ideas={cyclic:h.board};
 assert.equal(h.preview.status.hasOwnerPhotos,false);
 denied(h);h.preview.dispose();
});
test('M17 board changed during final private read rejects the pending original JPEG publish',async()=>{
 const h=harness();
 h.changeReadHook(n=>{if(n===4)h.board.slots.top='alternate';});
 await assert.rejects(h.preview.refresh(),/outfit selection changed/);
 denied(h);h.preview.dispose();
});
test('M17 render-phase owner swap still refuses even when outfit board unchanged',async()=>{
 const h=harness();
 h.changeReadHook(n=>{if(n===2)h.changeAuth();});
 await assert.rejects(h.preview.refresh(),/owner session changed|signed owner or refresh changed/);
 denied(h);h.preview.dispose();
});
test('M17 private auth, item IDs, original JPEG bytes and internal board stamps excluded from status/results',async()=>{
 const h=harness();const r=await h.preview.refresh();
 const returned=JSON.stringify({r,status:h.preview.status});
 for(const privateValue of [owner,'shirt','pants','shoes','data:image','authRef','privateDbRef','renderedBoardStamp']){
  assert.ok(!returned.includes(privateValue),privateValue);
 }
 h.preview.dispose();
});
test('M17 original research-only nature retained: native display cannot claim photograph-derived fitted 3D',async()=>{
 const h=harness();const r=await h.preview.refresh();
 assert.equal(r.presentationMode,'verified-original-photo-2d');
 assert.equal(r.renderAuthorized3D,false);
 assert.equal(r.releaseAuthorized,false);
 assert.equal(h.preview.status.familyAlpha,'HOLD');
 h.preview.dispose();
});
