'use strict';
// Source-executed actual Mission 3 pending photo CAS writer. Synthetic owners/photos.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const app=fs.readFileSync('public/app.js','utf8');
const a=app.indexOf('function commitReviewedDraftCAS(');
const b=app.indexOf('function persistDraft(',a);
assert.ok(a>=0&&b>a,'Missing exact private draft CAS writer');
const implementation=app.slice(a,b);
const jpeg='data:image/jpeg;base64,/9j/AA==',otherJpeg='data:image/jpeg;base64,/9j/BA==';
const original={id:'photo-A',ownerId:'A',image:jpeg,color:'Blue',category:'Uncategorized',
 sourceSHA256:'a'.repeat(64),originalPhoto:{image:jpeg,sha256:'a'.repeat(64)}};
const second={id:'photo-B',ownerId:'A',image:otherJpeg,color:'Red',category:'Uncategorized',
 sourceSHA256:'b'.repeat(64),originalPhoto:{image:otherJpeg,sha256:'b'.repeat(64)}};
function fixture({rows=[original,second],held=false}={}){
 let actual=structuredClone(rows),owner='A',epoch=0,opens=0,commits=0,aborts=0;
 let release;
 const gate=new Promise(resolve=>release=resolve);
 const db={name:'closet-current-user-A',transaction(name,mode){
  assert.equal(name,'state');assert.equal(mode,'readwrite');opens++;
  let aborted=false,pending=null;
  const tx={oncomplete:null,onerror:null,onabort:null,error:null,
   abort(){if(aborted)return;aborted=true;aborts++;queueMicrotask(()=>tx.onabort?.());},
   objectStore(store){
    assert.equal(store,'state');
    return {
     get(key){assert.equal(key,'draft');const req={result:null,onsuccess:null,onerror:null};
      queueMicrotask(()=>{if(aborted)return;req.result={id:'draft',batch:structuredClone(actual)};req.onsuccess?.();});
      return req;
     },
     put(value){
      pending=structuredClone(value);
      queueMicrotask(async()=>{if(held)await gate;if(aborted)return;actual=pending.batch;commits++;tx.oncomplete?.();});
     }
    };
   }
  };return tx;
 }};
 const ctx={structuredClone,JSON,Map,Set,Error,Promise,
  normalizeClothing:x=>x,queued:fn=>Promise.resolve().then(fn),
  ownerWardrobeMutationLease:()=>({ownerDB:db,assertLease(){
   if(owner!=='A'||epoch!==0)throw Error('Owner lease revoked');
  }})
 };
 vm.createContext(ctx);vm.runInContext(implementation,ctx);
 return {
  ctx,release,read:()=>structuredClone(actual),
  get commits(){return commits;},get aborts(){return aborts;},get opens(){return opens;},
  mutate:changes=>ctx.commitReviewedDraftCAS(changes),
  mutateWithCheck:(changes,check)=>ctx.commitReviewedDraftCAS(changes,check),
  replace:(rows)=>{actual=structuredClone(rows);},
  revoke:()=>{epoch++;},otherOwner:()=>{owner='B';}
 };
}
test('cropping one draft preserves every other-tab original and SHA',async()=>{
 const f=fixture(),cropped={...original,image:'data:image/jpeg;base64,/9j/CA==',color:'Green',
  cropBounds:{x:.1,y:.2,width:.7,height:.6}};
 assert.equal(await f.mutate([{before:original,after:cropped}]),1);
 assert.equal(f.commits,1);
 assert.equal(f.read()[0].image,cropped.image);
 assert.equal(f.read()[0].originalPhoto.image,jpeg);
 assert.deepEqual(f.read()[1],second);
});
test('discard removes only reviewed rows, never an unseen other-tab capture',async()=>{
 const third={...second,id:'photo-C',image:jpeg};
 const f=fixture({rows:[original,second,third]});
 await f.mutate([{before:original,after:null},{before:second,after:null}]);
 assert.deepEqual(f.read(),[third]);
});
test('batch category updates only exact reviewed original rows',async()=>{
 const f=fixture();
 const updated={...original,category:'Tops'};
 await f.mutate([{before:original,after:updated}]);
 assert.equal(f.read()[0].category,'Tops');
 assert.deepEqual(f.read()[1],second);
});
test('a newer same-owner edited row wins, with no batch mutation',async()=>{
 const changed={...original,color:'Gold'};
 const f=fixture({rows:[changed,second]});
 await assert.rejects(f.mutate([{before:original,after:{...original,color:'Green'}}]),
  /CLOSET_STALE_DRAFT_RELOAD_PHOTO_RESULTS/);
 assert.equal(f.read()[0].color,'Gold');assert.equal(f.commits,0);assert.equal(f.aborts,1);
});
test('a second tab replacing an original JPEG is never overwritten',async()=>{
 const replaced={...original,originalPhoto:{image:otherJpeg,sha256:'b'.repeat(64)}};
 const f=fixture({rows:[replaced,second]});
 await assert.rejects(f.mutate([{before:original,after:{...original,color:'Green'}}]),
  /CLOSET_STALE_DRAFT_RELOAD_PHOTO_RESULTS/);
 assert.deepEqual(f.read()[0],replaced);assert.equal(f.commits,0);
});
test('deleted or duplicated reviewed ID fails closed',async()=>{
 for(const rows of [[second],[original,original,second]]){
  const f=fixture({rows});
  await assert.rejects(f.mutate([{before:original,after:null}]),
   /CLOSET_STALE_DRAFT_RELOAD_PHOTO_RESULTS/);
  assert.deepEqual(f.read(),rows);assert.equal(f.commits,0);
 }
});
test('unsafe source swap is rejected before any private IndexedDB transaction',async()=>{
 for(const after of [
  {...original,sourceSHA256:'f'.repeat(64)},
  {...original,originalPhoto:{...original.originalPhoto,image:otherJpeg}},
  {...original,ownerId:'B'},
  {...original,id:'photo-Z'}
 ]){
  const f=fixture();
  await assert.rejects(f.mutate([{before:original,after}]),
   /CLOSET_STALE_DRAFT_RELOAD_PHOTO_RESULTS/);
  assert.equal(f.opens,0);assert.deepEqual(f.read(),[original,second]);
 }
});
test('duplicate change target is rejected before opening a transaction',async()=>{
 const f=fixture();
 await assert.rejects(f.mutate([{before:original,after:null},{before:original,after:null}]),
  /CLOSET_STALE_DRAFT_RELOAD_PHOTO_RESULTS/);
 assert.equal(f.opens,0);
});
test('explicit owner lease cancels queued draft edits on session revocation',async()=>{
 const f=fixture();
 const change=f.mutate([{before:original,after:{...original,color:'Green'}}]);
 f.revoke();
 await assert.rejects(change,/Owner lease revoked/);
 assert.equal(f.opens,0);
});
test('an already queued transaction cannot publish a success after owner switch',async()=>{
 const f=fixture({held:true});
 const p=f.mutate([{before:original,after:{...original,color:'Green'}}]);
 for(let i=0;i<20&&f.opens===0;i++)await Promise.resolve();
 for(let i=0;i<20&&f.commits===0;i++)await Promise.resolve();
 f.otherOwner();f.release();
 await assert.rejects(p,/Owner lease revoked/);
 assert.deepEqual(f.read()[1],second);
});
test('in-memory review changing while queued prevents persistent mutation',async()=>{
 const f=fixture(),flag={current:false};
 await assert.rejects(f.mutateWithCheck([{before:original,after:null}],()=>{
  if(!flag.current)throw Error('CLOSET_STALE_DRAFT_RELOAD_PHOTO_RESULTS');
 }),/CLOSET_STALE_DRAFT_RELOAD_PHOTO_RESULTS/);
 assert.equal(f.commits,0);
});
test('actual crop, discard and batch category handlers use source row CAS, not blind draft rewrite',()=>{
 const crop=app.slice(app.indexOf('function cropClothingPhoto(item){'),app.indexOf('function cropButton(item){'));
 const discard=app.slice(app.indexOf("$('discard').onclick="),app.indexOf("$('export').onclick=",app.indexOf("$('discard').onclick=")));
 const category=app.slice(app.indexOf("$('applyCategory').onclick="),app.indexOf("for(const season of clothingSchema",app.indexOf("$('applyCategory').onclick=")));
 assert.match(crop,/expectedDraftCropRow/);
 assert.match(crop,/commitReviewedDraftCAS/);
 assert.doesNotMatch(crop,/store\('state'\)\.put|transaction\('state','readwrite'\)/);
 assert.match(discard,/commitReviewedDraftCAS/);
 assert.match(category,/commitReviewedDraftCAS/);
 assert.doesNotMatch(discard,/persistDraft\(/);
 assert.doesNotMatch(category,/persistDraft\(/);
});
