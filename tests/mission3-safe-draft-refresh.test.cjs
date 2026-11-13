'use strict';
// Execute the exact app.js refresh handler against simulated signed-owner state.
// No private data, browser network, database mutation or production deployment.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const app=readFileSync('public/app.js','utf8');
const start=app.indexOf('async function refreshOwnerDraftFromDevice(){');
const end=app.indexOf('async function captureProofVerifyBeforeSave(',start);
assert.ok(start>=0&&end>start,'Exact source private refresh missing');
const implementation=app.slice(start,end);
const jpg='data:image/jpeg;base64,/9j/AA==';
const jpgB='data:image/jpeg;base64,/9j/BB==';
const row=(id,extra={})=>({
 id,ownerId:'owner-a',image:jpg,sourceSHA256:'a'.repeat(64),
 originalPhoto:{image:jpg,sha256:'a'.repeat(64)},category:'Tops',
 color:'Blue',localAnalyzed:true,...extra
});
const first=row('photo-a'),second=row('photo-b',{
 image:jpgB,sourceSHA256:'b'.repeat(64),
 originalPhoto:{image:jpgB,sha256:'b'.repeat(64)}
});
function deferred(){let resolve,reject;const promise=new Promise((ok,fail)=>{resolve=ok;reject=fail});return {promise,resolve,reject};}
function fixture({local=[first],durable=[first],deferRead=false}={}){
 let saved=structuredClone(durable),reads=0,writes=0;
 const owner='owner-a',ownerDB={name:'closet-current-user-'+owner},
  auth={user:{id:owner},assertCurrent(){if(!this.user)throw Error('Signed auth revoked')}};
 const messages=[],rendered=[];
 const gate=deferred();
 const ctx={
  window:{closetAuth:auth},db:ownerDB,auth,captureOperationEpoch:7,
  batch:structuredClone(local),writes:Promise.resolve(),
  busy:false,saving:false,captureProofTaking:false,cameraOpening:false,
  photoImportActive:false,videoImportActive:false,automaticRunning:false,
  automaticQueue:[],localPending:new Set(),failedDraftCaptures:new Set(),
  document:{querySelector:()=>null},JSON,structuredClone,
  normalizeClothing:v=>({...v}),readDraftFrom:async(db)=>{
   assert.equal(db,ownerDB);reads++;
   if(deferRead)await gate.promise;
   return structuredClone(saved);
  },
  message:s=>messages.push(s),
  render:()=>rendered.push('render')
 };
 vm.createContext(ctx);vm.runInContext(implementation,ctx);
 return {ctx,messages,rendered,ownerDB,auth,gate,
  read:()=>{reads++;return structuredClone(saved)},get reads(){return reads},
  get writes(){return writes},setSaved:v=>{saved=structuredClone(v)},
  mutateWhileWaiting:v=>{ctx.batch.push(v)},switchOwner:()=>{
   ctx.captureOperationEpoch++;ctx.window.closetAuth.user={id:'owner-b'};
   ctx.db={name:'closet-current-user-owner-b'};
  }
 };
}
test('same-owner second tab new source is rehydrated without rewriting existing original',async()=>{
 const f=fixture({local:[first],durable:[first,second]});
 const result=await f.ctx.refreshOwnerDraftFromDevice();
 assert.equal(result.count,2);assert.equal(result.changed,true);
 assert.deepEqual(f.ctx.batch.map(x=>x.id),['photo-a','photo-b']);
 assert.equal(f.ctx.batch[0].originalPhoto.image,jpg);
 assert.equal(f.ctx.batch[1].originalPhoto.image,jpgB);
 assert.equal(f.ctx.batch[1].originalPhoto.sha256,'b'.repeat(64));
 assert.equal(f.rendered.length,1);assert.equal(f.writes,0);
});
test('other-tab changed color is displayed only after explicit safe refresh',async()=>{
 const f=fixture({local:[first],durable:[{...first,color:'confirmed green'}]});
 await f.ctx.refreshOwnerDraftFromDevice();
 assert.equal(f.ctx.batch[0].color,'confirmed green');
 assert.equal(f.ctx.batch[0].originalPhoto.image,jpg);
});
test('unchanged private drafts do not unnecessarily re-render or write cloud state',async()=>{
 const f=fixture();
 const result=await f.ctx.refreshOwnerDraftFromDevice();
 assert.equal(result.changed,false);
 assert.equal(f.rendered.length,0);assert.equal(f.writes,0);
 assert.match(f.messages[0],/up to date/);
});
test('missing local original is never hidden or lost during cross-tab delete',async()=>{
 const f=fixture({local:[first,second],durable:[second]});
 await assert.rejects(f.ctx.refreshOwnerDraftFromDevice(),/LOCAL_PHOTO_MISSING/);
 assert.deepEqual(f.ctx.batch.map(x=>x.id),['photo-a','photo-b']);
 assert.equal(f.ctx.batch[0].originalPhoto.image,jpg);
 assert.equal(f.rendered.length,0);
 assert.match(f.messages[0],/No photos were hidden/);
});
test('changed original JPEG and SHA cannot silently replace a local source',async()=>{
 for(const modified of [
  {...first,originalPhoto:{...first.originalPhoto,image:jpgB}},
  {...first,originalPhoto:{...first.originalPhoto,sha256:'f'.repeat(64)}},
  {...first,sourceSHA256:'f'.repeat(64)}
 ]){
  const f=fixture({durable:[modified]});
  await assert.rejects(f.ctx.refreshOwnerDraftFromDevice(),/ORIGINAL_CHANGED/);
  assert.equal(f.ctx.batch[0].originalPhoto.image,jpg);
  assert.equal(f.writes,0);
 }
});
test('a foreign-owner or duplicate-ID durable row blocks reconciliation',async()=>{
 for(const latest of [
  [first,{...second,ownerId:'owner-b'}],
  [first,{...first}]
 ]){
  const f=fixture({durable:latest});
  await assert.rejects(f.ctx.refreshOwnerDraftFromDevice(),/INVALID_STATE/);
  assert.deepEqual(f.ctx.batch.map(x=>x.id),['photo-a']);
  assert.equal(f.rendered.length,0);
 }
});
test('a failed required original save is preserved and refresh does not run',async()=>{
 const f=fixture({local:[first],durable:[]});
 f.ctx.failedDraftCaptures.add('photo-a');
 await assert.rejects(f.ctx.refreshOwnerDraftFromDevice(),/HAS_UNSAVED_WORK/);
 assert.equal(f.reads,0);
 assert.equal(f.ctx.batch[0].originalPhoto.image,jpg);
});
test('recognition, camera capture, dialogs or queued auto work block refresh',async()=>{
 for(const change of [
  c=>c.localPending.add('photo-a'),
  c=>c.automaticQueue.push(first),
  c=>{c.captureProofTaking=true},
  c=>{c.videoImportActive=true},
  c=>{c.busy=true},
  c=>{c.document.querySelector=()=>({open:true})}
 ]){
  const f=fixture();change(f.ctx);
  await assert.rejects(f.ctx.refreshOwnerDraftFromDevice(),/HAS_UNSAVED_WORK/);
  assert.equal(f.reads,0);assert.equal(f.writes,0);
 }
});
test('a same-tab newly captured row during delayed read cannot be discarded',async()=>{
 const f=fixture({durable:[first,second],deferRead:true});
 const pending=f.ctx.refreshOwnerDraftFromDevice();
 for(let i=0;i<20&&f.reads===0;i++)await Promise.resolve();
 f.mutateWhileWaiting(row('local-unsaved'));
 f.gate.resolve();
 await assert.rejects(pending,/HAS_UNSAVED_WORK/);
 assert.deepEqual(f.ctx.batch.map(x=>x.id),['photo-a','local-unsaved']);
 assert.equal(f.rendered.length,0);
});
test('owner/session switch during pending read never publishes old owner photos or warnings',async()=>{
 const f=fixture({durable:[first,second],deferRead:true});
 const pending=f.ctx.refreshOwnerDraftFromDevice();
 for(let i=0;i<20&&f.reads===0;i++)await Promise.resolve();
 f.switchOwner();
 f.ctx.batch=[row('owner-b-photo',{ownerId:'owner-b'})];
 f.gate.resolve();
 await assert.rejects(pending,/OWNER_CHANGED/);
 assert.deepEqual(f.ctx.batch.map(x=>x.id),['owner-b-photo']);
 assert.deepEqual(f.messages,[]);assert.equal(f.rendered.length,0);
});
test('new same-tab pending write while read is open invalidates reconciliation',async()=>{
 const f=fixture({durable:[first,second],deferRead:true});
 const pending=f.ctx.refreshOwnerDraftFromDevice();
 for(let i=0;i<20&&f.reads===0;i++)await Promise.resolve();
 f.ctx.writes=Promise.resolve();
 f.gate.resolve();
 await assert.rejects(pending,/HAS_UNSAVED_WORK/);
 assert.equal(f.ctx.batch.length,1);
});
test('refresh button is wired, visible and source-executed, not an inert control',()=>{
 const html=readFileSync('public/index.html','utf8');
 assert.match(html,/<button id="refreshReview" class="secondary" type="button">Refresh photo results<\/button>/);
 assert.match(app,/\$\('refreshReview'\)\.onclick=async\(\)=>\{/);
 assert.match(app,/await refreshOwnerDraftFromDevice\(\)/);
 assert.match(implementation,/readDraftFrom\(ownerDB\)/);
 assert.doesNotMatch(implementation,/\.put\(|\.delete\(|objectStore\(|\.transaction\(/);
 // In-memory Set.add() tracks duplicate IDs; it is not a database write.
 assert.match(implementation,/seen\.add\(row\.id\)/);
 assert.doesNotMatch(implementation,/window\.closetCloud\?\.changed/);
});
