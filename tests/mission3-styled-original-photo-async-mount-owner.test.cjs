'use strict';
// Execute the exact production P167 photo-preview mount function from
// public/closet-stylist.js. Only the dynamic module loader is swapped for a
// deferred synthetic donor, to force owner switches during import.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const code=readFileSync('public/closet-stylist.js','utf8');
function fragment(a,b){const i=code.indexOf(a),j=code.indexOf(b,i);
 assert.ok(i>=0&&j>i,'Missing source: '+a);return code.slice(i,j);}
const sessionSource=fragment('function currentPhotoOwnerSession167(){','async function signedOwnerSavedRows167(){');
const mountSource=fragment('async function mountOriginalPhotoPreview167(){','// Generated outfit cards');
const dynamicImport="await import('./style-photo-preview-gate-165.mjs')";
assert.ok(mountSource.includes(dynamicImport));
const executable=mountSource.replace(dynamicImport,'await importFake()');
function deferred(){let resolve,reject;const promise=new Promise((ok,no)=>{resolve=ok;reject=no;});promise.catch(()=>{});return {promise,resolve,reject};}
function fixture(){
 const events=[],auth={user:{id:'owner-A'},assertCurrent(){}};
 const nodes={authGate:{hidden:true},appShell:{hidden:false},
  styledCollectionResults:{},stylistStatus:{textContent:'owner A view'}};
 let epoch='old-same-token';
 const ctx={window:{closetAuth:auth},db:{name:'closet-current-user-owner-A'},
  captureOperationEpoch:8,styledCollectionResults:[{focusItemId:'owned-synthetic-A'}],
  styledCollectionRequestSerial:4,originalPhotoMountSerial167:0,originalPhotoPreview167:null,
  localStorage:{getItem(){return JSON.stringify({epoch})}},
  $(id){return nodes[id]},
  signedOwnerSavedRows167:async()=>[],importFake:()=>{},
 };
 vm.createContext(ctx);vm.runInContext(sessionSource+executable,ctx);
 const gate=deferred(),started=deferred();
 ctx.importFake=()=>{events.push('import');started.resolve();return gate.promise};
 const makeViewer=()=>({mount(){events.push('mount')},dispose(){events.push('dispose')}});
 function complete(factory=()=>makeViewer()){gate.resolve({createStyledOwnerPhotoPreview165:()=>{
  events.push('create');return factory()}})}
 return {ctx,events,nodes,started:started.promise,complete,fail:e=>gate.reject(e),
  start:()=>ctx.mountOriginalPhotoPreview167(),
  swap(){ctx.window.closetAuth={user:{id:'owner-B'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-B'};ctx.captureOperationEpoch++},
  relogin(){ctx.window.closetAuth={user:{id:'owner-A'},assertCurrent(){}};
   ctx.db={name:'closet-current-user-owner-A'};ctx.captureOperationEpoch++},
  changeAuth(){ctx.window.closetAuth={user:{id:'owner-A'},assertCurrent(){}}},
  changeDB(){ctx.db={name:'closet-current-user-owner-A'}},
  rotate(){ctx.captureOperationEpoch++},token(){epoch='new-token'},
  gateOff(){nodes.authGate.hidden=false},shellOff(){nodes.appShell.hidden=true},
  changeRequest(){ctx.styledCollectionRequestSerial++},
  changeResults(){ctx.styledCollectionResults=[{focusItemId:'owned-synthetic-B'}]},
  changeTicket(){ctx.originalPhotoMountSerial167++},
  revoked(){auth.assertCurrent=()=>{throw Error('revoked')}},
  afterCreateSwitch(){return {mount(){events.push('mount')},dispose(){events.push('dispose')}}},
  throwOnMount(){return {mount(){throw Error('Synthetic private old error')},dispose(){events.push('dispose')}}}
 };
}
test('valid signed original user mounts preview once after dynamic import',async()=>{
 const f=fixture(),job=f.start();await f.started;f.complete();await job;
 assert.deepEqual(f.events,['import','create','mount']);
 assert.ok(f.ctx.originalPhotoPreview167);
});
for(const [label,change] of [
 ['different account',f=>f.swap()],
 ['same-ID new login',f=>f.relogin()],
 ['exact auth object rotation with unchanged owner token',f=>f.changeAuth()],
 ['same-named private database rotation',f=>f.changeDB()],
 ['new capture epoch',f=>f.rotate()],
 ['persisted token change',f=>f.token()],
 ['signed-out visible gate',f=>f.gateOff()],
 ['hidden application shell',f=>f.shellOff()],
 ['new styled outfit request generation',f=>f.changeRequest()],
 ['replaced generated outfit results',f=>f.changeResults()],
 ['newer photo preview render ticket',f=>f.changeTicket()],
 ['revoked auth assertion',f=>f.revoked()]
]){
 test('late original-photo import refuses '+label,async()=>{
  const f=fixture(),run=f.start();await f.started;change(f);f.complete();await run;
  assert.deepEqual(f.events,['import'],label);
  assert.equal(f.ctx.originalPhotoPreview167,null);
  assert.equal(f.nodes.stylistStatus.textContent,'owner A view');
 });
}
test('original owner import error gets generic user guidance',async()=>{
 const f=fixture(),run=f.start();await f.started;
 f.fail(Error('PRIVATE synthetic A original photo'));await run;
 assert.match(f.nodes.stylistStatus.textContent,/Original clothing photo preview is unavailable/);
 assert.doesNotMatch(f.nodes.stylistStatus.textContent,/PRIVATE/);
});
test('old owner import rejection after re-login cannot show status to new login',async()=>{
 const f=fixture(),run=f.start();await f.started;f.relogin();
 f.nodes.stylistStatus.textContent='new session view';
 f.fail(Error('PRIVATE A'));await run;
 assert.equal(f.nodes.stylistStatus.textContent,'new session view');
});
test('viewer created for original user but session changed during factory is disposed',async()=>{
 const f=fixture(),run=f.start();await f.started;
 f.complete(()=>{f.swap();return f.afterCreateSwitch()});await run;
 assert.deepEqual(f.events,['import','create','dispose']);
 assert.equal(f.ctx.originalPhotoPreview167,null);
});
test('viewer mount causing same-account session generation change is disposed',async()=>{
 const f=fixture(),run=f.start();await f.started;
 f.complete(()=>({mount(){f.events.push('mount');f.rotate()},dispose(){f.events.push('dispose')}}));
 await run;assert.deepEqual(f.events,['import','create','mount','dispose']);
 assert.equal(f.ctx.originalPhotoPreview167,null);
});
test('viewer mount throwing for original owner emits generic warning only',async()=>{
 const f=fixture(),run=f.start();await f.started;f.complete(()=>f.throwOnMount());
 await run;assert.match(f.nodes.stylistStatus.textContent,/Original clothing photo preview is unavailable/);
 assert.doesNotMatch(f.nodes.stylistStatus.textContent,/Synthetic private/);
});
test('new owner after viewer mount throws never receives prior account error status',async()=>{
 const f=fixture(),run=f.start();await f.started;
 f.complete(()=>({mount(){f.swap();throw Error('PRIVATE old account JPEG')},dispose(){f.events.push('dispose')}}));
 await run;assert.equal(f.nodes.stylistStatus.textContent,'owner A view');
});
test('old previously mounted viewer disposed before a new preview begins',async()=>{
 const f=fixture();
 f.ctx.originalPhotoPreview167={dispose(){f.events.push('previous-dispose')}};
 const run=f.start();await f.started;f.complete();await run;
 assert.deepEqual(f.events,['previous-dispose','import','create','mount']);
});
test('no focus garment avoids import or private preview creation',async()=>{
 const f=fixture();f.ctx.styledCollectionResults=[{focusItemId:null}];
 await f.start();assert.deepEqual(f.events,[]);
});
test('source preserves actual dynamic import and exact owner/results fencing',()=>{
 assert.ok(mountSource.includes(dynamicImport));
 for(const marker of [
  'const originalResults=styledCollectionResults,request=styledCollectionRequestSerial',
  'start.authRef===now.authRef','start.privateDbRef===now.privateDbRef',
  'start.operationEpoch===now.operationEpoch',
  'request===styledCollectionRequestSerial',
  'originalResults===styledCollectionResults',
  'if(!stillCurrent()){viewer.dispose();return;}',
  'if(stillCurrent()&&styledCollectionResults.length'
 ])assert.ok(mountSource.includes(marker),'missing source lease clause: '+marker);
});
