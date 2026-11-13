'use strict';
// Mission 3: execute ACTUAL failed photo Retry source with disposable signed
// sessions and synthetic JPEG identities; never contact hosted data.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const app=readFileSync('public/app.js','utf8');
const start=app.indexOf('function ownerFailedPhotoRetryLease(item){');
const end=app.indexOf('function renderPhotoResults(grid,results){',start);
assert.ok(start>=0&&end>start,'Live failed photo retry implementation required');
const actual=app.slice(start,end);
function deferred(){
 let resolve,reject;
 const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
 promise.catch(()=>{});return {promise,resolve,reject};
}
function fixture(){
 const photo={id:'retry-jpeg-1',ownerId:'owner-a',image:'synthetic-original-JPEG-A',
  sourceSHA256:'a'.repeat(64),sourceHashVerified:true,
  originalPhoto:{image:'synthetic-original-JPEG-A',sha256:'a'.repeat(64)}};
 let revoked=false;
 const authA={user:{id:'owner-a'},assertCurrent(){if(revoked)throw Error('revoked');}};
 const events=[],nodes={authGate:{hidden:true},appShell:{hidden:false}};
 const ctx={
  window:{closetAuth:authA},db:{name:'closet-current-user-owner-a'},
  captureOperationEpoch:7,batch:[photo],items:[],failedDraftCaptures:new Set([photo.id]),
  localPending:new Set(),
  $(id){return nodes[id];},
  captureProofOwner(){
   const owner=ctx.window.closetAuth?.user?.id;
   return typeof owner==='string'&&ctx.db?.name==='closet-current-user-'+owner?owner:null;
  },
  captureProof01Module:async()=>({verifyStoredCanonical:async()=>true}),
  candidate:async()=>{events.push('candidate');ctx.failedDraftCaptures.delete(photo.id);return true;},
  render(){events.push('render:'+ctx.window.closetAuth?.user?.id);},
  message(value){events.push('message:'+ctx.window.closetAuth?.user?.id+':'+value);}
 };
 const button={isConnected:true,disabled:false};
 vm.createContext(ctx);vm.runInContext(actual,ctx);
 return {ctx,photo,button,events,
  swap(){
   ctx.captureOperationEpoch++;
   ctx.window.closetAuth={user:{id:'owner-b'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-b'};
   ctx.batch=[{...photo,id:'next-owner-retry',ownerId:'owner-b',image:'private-b'}];
  },
  relogin(){
   ctx.captureOperationEpoch++;
   ctx.window.closetAuth={user:{id:'owner-a'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-a'};
   ctx.batch=[{...photo,name:'fresh-login',originalPhoto:{image:'fresh-JPEG'}}];
  },
  revoke(){revoked=true;},
  rehydrate(){ctx.batch=[{...photo,name:'new same-ID source'}];}
 };
}
test('current owner retry re-hashes original then marks private photo saved',async()=>{
 const f=fixture();let verified=false;
 f.ctx.captureProof01Module=async()=>({verifyStoredCanonical:async proof=>{
  verified=true;assert.equal(proof.image,f.photo.image);assert.equal(proof.sourceSHA256,f.photo.sourceSHA256);return true;
 }});
 await f.ctx.retryFailedPhotoFromCard(f.photo,f.button);
 assert.equal(verified,true);
 assert.deepEqual(f.events,['candidate','render:owner-a',
  'message:owner-a:Original photograph saved privately on this device. Review the garment details before adding it to your closet.']);
 assert.equal(f.button.disabled,false);
});
test('current private save failure keeps photo unsaved and gives generic retry notice',async()=>{
 const f=fixture();
 f.ctx.candidate=async()=>{throw Error('private original-JPEG-A filename leak');};
 await f.ctx.retryFailedPhotoFromCard(f.photo,f.button);
 assert.deepEqual(f.events,[
  'message:owner-a:Photo is still not saved. Check device storage, then retry from Photo results. Keep this page open to retain the photo.',
  'render:owner-a'
 ]);
 assert.equal(f.ctx.failedDraftCaptures.has(f.photo.id),true);
 assert.equal(f.button.disabled,false);
});
test('account switch before slow model module resolves cannot invoke candidate or change UI',async()=>{
 const f=fixture(),p=deferred();
 f.ctx.captureProof01Module=()=>p.promise;
 const running=f.ctx.retryFailedPhotoFromCard(f.photo,f.button);
 f.swap();p.resolve({verifyStoredCanonical:async()=>true});await running;
 assert.deepEqual(f.events,[]);
 assert.equal(f.button.disabled,true);
 assert.equal(f.ctx.batch[0].ownerId,'owner-b');
});
test('same-ID new login before module resolves revokes old retry',async()=>{
 const f=fixture(),p=deferred();
 f.ctx.captureProof01Module=()=>p.promise;
 const running=f.ctx.retryFailedPhotoFromCard(f.photo,f.button);
 f.relogin();p.resolve({verifyStoredCanonical:async()=>true});await running;
 assert.deepEqual(f.events,[]);
 assert.equal(f.button.disabled,true);
});
test('owner switch during candidate commit await cannot render a saved status',async()=>{
 const f=fixture(),p=deferred();let entered;
 const started=new Promise(resolve=>entered=resolve);
 f.ctx.candidate=()=>{f.events.push('candidate');entered();return p.promise;};
 const running=f.ctx.retryFailedPhotoFromCard(f.photo,f.button);
 await started;f.swap();p.resolve(true);await running;
 assert.deepEqual(f.events,['candidate']);
 assert.equal(f.button.disabled,true);
});
test('same-ID re-login during candidate commit cannot report previous photo saved',async()=>{
 const f=fixture(),p=deferred();let entered;
 const started=new Promise(resolve=>entered=resolve);
 f.ctx.candidate=()=>{f.events.push('candidate');entered();return p.promise;};
 const running=f.ctx.retryFailedPhotoFromCard(f.photo,f.button);
 await started;f.relogin();p.resolve(true);await running;
 assert.deepEqual(f.events,['candidate']);
 assert.equal(f.button.disabled,true);
});
test('revoked signed auth cannot finalize successful candidate with same owner ID',async()=>{
 const f=fixture(),p=deferred();let entered;
 const started=new Promise(resolve=>entered=resolve);
 f.ctx.candidate=()=>{entered();return p.promise;};
 const running=f.ctx.retryFailedPhotoFromCard(f.photo,f.button);
 await started;f.revoke();p.resolve(true);await running;
 assert.deepEqual(f.events,[]);
 assert.equal(f.button.disabled,true);
});
test('same-owner fresh hydration with matching source ID does not report old error',async()=>{
 const f=fixture(),p=deferred();let entered;
 const started=new Promise(resolve=>entered=resolve);
 f.ctx.candidate=()=>{entered();return p.promise;};
 const running=f.ctx.retryFailedPhotoFromCard(f.photo,f.button);
 await started;f.rehydrate();p.reject(Error('old JPEG info'));await running;
 assert.deepEqual(f.events,[]);
 assert.equal(f.button.disabled,true);
});
test('wrong private database refuses retry without touching the original',async()=>{
 const f=fixture();f.ctx.db={name:'closet-current-user-other'};
 await f.ctx.retryFailedPhotoFromCard(f.photo,f.button);
 assert.deepEqual(f.events,[]);assert.equal(f.button.disabled,false);
 assert.equal(f.ctx.failedDraftCaptures.has(f.photo.id),true);
});
test('incorrect original SHA or image fails closed, never saving a replacement photo',async()=>{
 const f=fixture();f.photo.originalPhoto.sha256='b'.repeat(64);
 await f.ctx.retryFailedPhotoFromCard(f.photo,f.button);
 assert.equal(f.events.filter(e=>e==='candidate').length,0);
 assert.match(f.events[0],/Photo is still not saved/);
 assert.equal(f.ctx.failedDraftCaptures.has(f.photo.id),true);
});
test('detached button refuses start, no changes to owner private draft',async()=>{
 const f=fixture();f.button.isConnected=false;
 await f.ctx.retryFailedPhotoFromCard(f.photo,f.button);
 assert.deepEqual(f.events,[]);assert.equal(f.button.disabled,false);
});
test('detached button during failure may not write messages or flip state',async()=>{
 const f=fixture(),p=deferred();
 f.ctx.captureProof01Module=()=>p.promise;
 const running=f.ctx.retryFailedPhotoFromCard(f.photo,f.button);
 f.button.isConnected=false;p.reject(Error('old private filename'));await running;
 assert.deepEqual(f.events,[]);assert.equal(f.button.disabled,true);
});
test('current owner refused source proof cannot falsely announce saving',async()=>{
 const f=fixture();
 f.ctx.captureProof01Module=async()=>({verifyStoredCanonical:async()=>false});
 await f.ctx.retryFailedPhotoFromCard(f.photo,f.button);
 assert.equal(f.events.filter(e=>e==='candidate').length,0);
 assert.match(f.events[0],/Photo is still not saved/);
 assert.equal(f.ctx.failedDraftCaptures.has(f.photo.id),true);
});
test('saved-photo button and retry operation both verify auth identity and epoch',()=>{
 assert.match(app,/retry\.onclick=\(\)=>retryFailedPhotoFromCard\(item,retry\)/);
 assert.match(actual,/async function retryUncommittedCapture\(item\)/);
 assert.match(actual,/window\.closetAuth!==auth/);
 assert.match(actual,/captureOperationEpoch!==epoch/);
 assert.match(actual,/auth\.assertCurrent\?\.\(\)/);
 assert.match(actual,/await candidate\(item\.image,\{sourceProof:proof,requireDraftCommit:true\}\)/);
 assert.doesNotMatch(actual,/String\(error\.message\|\|error\)/);
 assert.match(actual,/failedDraftCaptures\.has\(item\.id\)/);
});
