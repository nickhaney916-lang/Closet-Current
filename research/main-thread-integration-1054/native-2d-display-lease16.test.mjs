import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {mountOwnerOutfitPhotoPreview1054} from './native-2d-preview.mjs';
// Production-source native cleanOutfitBoard, not a guessed experimental board.
const ctx={URL,encodeURIComponent};
vm.createContext(ctx);
vm.runInContext(readFileSync('public/outfit-board-engine.js','utf8'),ctx);
const cleanBoard=(board,rows)=>ctx.cleanOutfitBoard(board,rows);
const owner='synthetic-owner-A';
function photo(seed){
 const b=Buffer.alloc(128);
 b[0]=255;b[1]=216;b[13]=seed;b[126]=255;b[127]=217;
 return {image:'data:image/jpeg;base64,'+b.toString('base64'),
  sha:createHash('sha256').update(b).digest('hex')};
}
function row(id,category,seed){
 const p=photo(seed);
 return {id,ownerId:owner,category,itemType:'Other',color:'Blue',
  ownerReviewed:true,userAdjusted:true,sourcePhotoOriginal:true,
  sourceHashVerified:true,singleGarmentVerified:true,
  sourceSHA256:p.sha,originalPhoto:{image:p.image,sha256:p.sha},
  image:p.image};
}
function el(tag='div'){
 return {
  tagName:tag.toLowerCase(),children:[],dataset:{},style:{},
  append(...children){this.children.push(...children);},
  replaceChildren(...children){this.children=[...children];},
  querySelectorAll(tagName){
   const out=[];
   function scan(n){
    if(n?.tagName===tagName)out.push(n);
    for(const c of n?.children||[])scan(c);
   }
   scan(this);return out;
  }
 };
}
class DocumentFixture extends EventTarget{
 constructor(){super();this.hidden=false;}
 createElement(tag){return el(tag);}
}
function fixture(){
 const items=[row('shirt','Tops',1),row('pants','Bottoms',2),
  row('shoes','Shoes',3)];
 const board={slots:{top:'shirt',bottom:'pants',shoes:'shoes'}};
 const target=el('section'),doc=new DocumentFixture(),events=new EventTarget();
 let authRef={user:{id:owner},assertCurrent(){}};
 let privateDbRef={name:'closet-current-user-'+owner};
 let operationEpoch=9,authenticated=true;
 let reads=0,readHook=null;
 const getSession=()=>({authenticated,ownerId:owner,
  epoch:'30eb2fb5-29f7-4ac3-827c-bc3af1df8b18',
  privateDbName:'closet-current-user-'+owner,
  authRef,privateDbRef,operationEpoch});
 const readOwnerItems=async()=>{
  reads++;
  const value=structuredClone(items);
  if(readHook)await readHook(reads);
  return value;
 };
 const preview=mountOwnerOutfitPhotoPreview1054({
  target,getSession,readOwnerItems,cleanBoard,
  getBoard:()=>structuredClone(board),events,doc
 });
 return {preview,events,doc,target,items,board,getSession,
  setReadHook:fn=>readHook=fn,
  replaceAuth:()=>authRef={user:{id:owner},assertCurrent(){}},
  replaceDb:()=>privateDbRef={name:'closet-current-user-'+owner},
  changeGeneration:()=>operationEpoch++,
  revokeAuth:()=>authRef.assertCurrent=()=>{throw Error('owner session revoked');},
  guest:()=>authenticated=false,
  get reads(){return reads;}
 };
}
const count=f=>f.target.querySelectorAll('img').length;
const assertProtected=f=>{
 assert.equal(count(f),0);
 assert.equal(f.preview.status.hasOwnerPhotos,false);
 assert.equal(f.preview.status.renderAuthorized3D,false);
 assert.equal(f.preview.status.releaseAuthorized,false);
};
test('M16 exact current signed native preview renders only three original SHA-confirmed 2D images',async()=>{
 const f=fixture();
 const result=await f.preview.refresh();
 assert.equal(count(f),3);
 assert.equal(result.slotCount,3);
 assert.equal(result.renderAuthorized3D,false);
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.threeDResearchStatus,'research-3d-blocked');
 assert.equal(f.preview.status.hasOwnerPhotos,true);
 f.preview.dispose();
 assertProtected(f);
});
test('M16 same-owner new auth ref on focus immediately revokes displayed JPEGs without lock event',async()=>{
 const f=fixture();await f.preview.refresh();
 f.replaceAuth();f.events.dispatchEvent(new Event('focus'));
 assertProtected(f);f.preview.dispose();
});
test('M16 same-name private DB replacement on focus immediately revokes displayed JPEGs',async()=>{
 const f=fixture();await f.preview.refresh();
 f.replaceDb();f.events.dispatchEvent(new Event('focus'));
 assertProtected(f);f.preview.dispose();
});
test('M16 capture operation generation mutation on focus revokes displayed old-session pixels',async()=>{
 const f=fixture();await f.preview.refresh();
 f.changeGeneration();f.events.dispatchEvent(new Event('focus'));
 assertProtected(f);f.preview.dispose();
});
test('M16 signed session revoked by auth.assertCurrent does not leak through focus event',async()=>{
 const f=fixture();await f.preview.refresh();
 f.revokeAuth();f.events.dispatchEvent(new Event('focus'));
 assertProtected(f);f.preview.dispose();
});
test('M16 changed exact auth without focus event is detected on status polling',async()=>{
 const f=fixture();await f.preview.refresh();
 f.replaceAuth();
 assert.equal(f.preview.status.hasOwnerPhotos,false);
 assertProtected(f);f.preview.dispose();
});
test('M16 changed DB identity without focus event is detected on status polling',async()=>{
 const f=fixture();await f.preview.refresh();
 f.replaceDb();
 assert.equal(f.preview.status.hasOwnerPhotos,false);
 assertProtected(f);f.preview.dispose();
});
test('M16 same-owner auth swap during async private read cannot display previous-session originals',async()=>{
 const f=fixture();
 f.setReadHook(async n=>{if(n===1)f.replaceAuth();});
 await assert.rejects(f.preview.refresh(),/signed owner or refresh changed/);
 assertProtected(f);f.preview.dispose();
});
test('M16 DB connection rotation during SHA path cancels old read-only photo preview',async()=>{
 const f=fixture();
 f.setReadHook(async n=>{if(n===2)f.replaceDb();});
 await assert.rejects(f.preview.refresh(),/signed owner or refresh changed|owner session changed/);
 assertProtected(f);f.preview.dispose();
});
test('M16 capture epoch change during final snapshot aborts publishing 2D and never authorizes 3D',async()=>{
 const f=fixture();
 f.setReadHook(async n=>{if(n>=3)f.changeGeneration();});
 await assert.rejects(f.preview.refresh(),/signed owner or refresh changed|owner session changed/);
 assertProtected(f);f.preview.dispose();
});
test('M16 absent signed session is rejected before owner photo reads',async()=>{
 const f=fixture();f.guest();
 await assert.rejects(f.preview.refresh(),/native signed session unavailable/);
 assertProtected(f);assert.equal(f.reads,0);f.preview.dispose();
});
test('M16 pagehide revokes original photo without relying on a server or owner login',async()=>{
 const f=fixture();await f.preview.refresh();
 f.events.dispatchEvent(new Event('pagehide'));
 assertProtected(f);f.preview.dispose();
});
test('M16 background/visibilitychange revokes original photo and refresh handle',async()=>{
 const f=fixture();await f.preview.refresh();
 f.doc.hidden=true;f.doc.dispatchEvent(new Event('visibilitychange'));
 assertProtected(f);f.preview.dispose();
});
test('M16 unchanged exact auth/DB/capture refs across fresh session wrappers permit safe recheck',async()=>{
 const f=fixture();
 await f.preview.refresh();
 assert.equal(count(f),3);
 f.events.dispatchEvent(new Event('focus'));
 assert.equal(count(f),3);
 f.preview.dispose();assertProtected(f);
});
test('M16 local output and status never publish private auth, DB handle, owner ID or original JPEG',async()=>{
 const f=fixture();
 const result=await f.preview.refresh();
 const text=JSON.stringify({result,status:f.preview.status});
 assert.equal(text.includes(owner),false);
 assert.equal(text.includes('data:image'),false);
 assert.equal(text.includes('authRef'),false);
 assert.equal(text.includes('privateDbRef'),false);
 assert.equal(result.presentationMode,'verified-original-photo-2d');
 f.preview.dispose();
});
