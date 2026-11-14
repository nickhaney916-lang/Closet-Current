'use strict';
// Source-execute the real research-only P146 consent+private DOM revoke().
// Synthetic services and owner panels: no production, hosted cloud or owner data.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs','utf8');
function extract(begin,end){const a=src.indexOf(begin),b=src.indexOf(end,a);
 assert.ok(a>=0&&b>a,'missing actual source '+begin);return src.slice(a,b);}
const actualSettle=extract(' function settle(answer){'," by('owner146Cancel').onclick");
const actualRevoke=extract(' function revoke(){',' const onLocked=()=>revoke();');
const code=actualSettle+actualRevoke+'\nconst onLocked=()=>revoke();';
function fixture(options={}){
 const events=[],buttons={};
 for(const id of ['owner146Preview','owner146Backup','owner146Restore']){
  buttons[id]={disabled:false,onclick(){}};
 }
 const hooks=[];
 const win={
  removeEventListener(name,fn){
   events.push('unlisten:'+name);
   if(options.listenerThrows===name)throw Error('PRIVATE stale listener');
   hooks.push({name,fn});
  }
 };
 const panel={
  remove(){events.push('panel.remove');panel.removed=true;
   if(options.panelThrows)throw Error('PRIVATE panel error')}
 };
 const dialog={
  open:true,closed:false,
  close(){events.push('dialog.close');if(options.dialogCloseThrows)throw Error('close failed');
   dialog.open=false;dialog.closed=true;},
  remove(){events.push('dialog.remove');dialog.removed=true;}
 };
 const style={remove(){events.push('style.remove');style.removed=true;}};
 let result=null,consents=0;
 const pending=v=>{events.push('settle:'+String(v));consents++;result=v;
  if(options.consentCallbackThrows)throw Error('PRIVATE user approval callback failure')};
 const ctx={window:win,panel,dialog,style,buttonIds:Object.keys(buttons),
  backupService:{revoke(){events.push('backup.revoke');if(options.backupThrows)throw Error('PRIVATE backup service')}},
  restoreService:{revoke(){events.push('restore.revoke');if(options.restoreThrows)throw Error('PRIVATE restore service')}},
  by(id){events.push('by:'+id);if(id===options.buttonThrows)throw Error('PRIVATE button');
   return buttons[id];},revoked:false,pending};
 vm.createContext(ctx);vm.runInContext(code+'\nglobalThis.testOnLocked=onLocked;',ctx);
 return {ctx,buttons,panel,dialog,style,events,hooks,options,getConsent:()=>result,getCount:()=>consents};
}
function verify(f){
 assert.equal(f.ctx.revoked,true,'must permanently revoke old owner interface');
 assert.equal(f.ctx.pending,null,'must settle pending review even when cleanup throws');
 assert.equal(f.getCount(),1,'exactly one cancel');
 assert.equal(f.getConsent(),false,'never authorize replacement during revoke');
 assert.equal(f.panel.removed,true,'old private panel removed');
 assert.equal(f.dialog.removed,true,'owner-review dialog removed');
 assert.equal(f.style.removed,true,'private style removed');
 assert.ok(f.events.includes('backup.revoke'),'backup service revocation attempted');
 assert.ok(f.events.includes('restore.revoke'),'restore service revocation attempted');
 for(const id of Object.keys(f.buttons)){
  if(!f.events.includes('by:'+id)||id===f.options.buttonThrows)continue;
  assert.equal(f.buttons[id].disabled,true);
  assert.equal(f.buttons[id].onclick,null);
 }
 assert.ok(f.events.includes('unlisten:closet:session-locked'));
 assert.ok(f.events.includes('unlisten:pagehide'));
}
test('P146 normal session revoke settles consent and cleans all buttons/services/DOM/listeners',()=>{
 const f=fixture();assert.doesNotThrow(()=>f.ctx.revoke());verify(f);
});
for(const [label,setting] of [
 ['backup revoke throws',{backupThrows:true}],
 ['restore revoke throws',{restoreThrows:true}],
 ['both service revocations throw',{backupThrows:true,restoreThrows:true}],
 ['dialog close throws',{dialogCloseThrows:true}],
 ['backup+restore+dialog throw',{backupThrows:true,restoreThrows:true,dialogCloseThrows:true}],
 ['consent callback throws',{consentCallbackThrows:true}],
 ['first button lookup throws',{buttonThrows:'owner146Preview'}],
 ['second button lookup throws',{buttonThrows:'owner146Backup'}],
 ['third button lookup throws',{buttonThrows:'owner146Restore'}],
 ['session-lock listener unsubscribe throws',{listenerThrows:'closet:session-locked'}],
 ['pagehide listener unsubscribe throws',{listenerThrows:'pagehide'}]
]){
 test('P146 failing '+label+' cannot strand former owner UI',()=>{
  const f=fixture(setting);
  assert.doesNotThrow(()=>f.ctx.revoke());
  if(setting.consentCallbackThrows){
   assert.equal(f.ctx.pending,null);assert.equal(f.panel.removed,true);
   assert.equal(f.dialog.removed,true);assert.equal(f.style.removed,true);
   assert.ok(f.events.includes('backup.revoke'));
   assert.ok(f.events.includes('restore.revoke'));
   return;
  }
  verify(f);
 });
}
test('P146 revoked state is idempotent even after prior service error',()=>{
 const f=fixture({backupThrows:true});f.ctx.revoke();const snapshot=[...f.events];
 assert.doesNotThrow(()=>f.ctx.revoke());assert.deepEqual(f.events,snapshot);
});
test('P146 session-locked and pagehide handlers delegate to same fail-safe revoke',()=>{
 const f=fixture({backupThrows:true,restoreThrows:true});
 f.ctx.testOnLocked();verify(f);assert.doesNotThrow(()=>f.ctx.testOnLocked());
});
test('P146 no pending confirmation still revokes remaining services and removes owner DOM',()=>{
 const f=fixture({restoreThrows:true});f.ctx.pending=null;
 assert.doesNotThrow(()=>f.ctx.revoke());assert.equal(f.panel.removed,true);
 assert.equal(f.dialog.removed,true);assert.equal(f.style.removed,true);
});
test('P146 source retains local-only gate and original cloud-transport protections',()=>{
 for(const needle of ['const SYNTHETIC_TOKEN_PREFIX', "ownerReview145')==='research'",
  "ownerReview146')==='research'",'redirect:\'error\',credentials:\'omit\'',
  'createLocalRemoteFence134','createCloudRestoreGuard137','function revoke(){',
  'safe(()=>backupService?.revoke())','safe(()=>restoreService?.revoke())',
  "safe(()=>globalThis.window?.removeEventListener?.('pagehide',onLocked))"])
  assert.ok(src.includes(needle),needle);
});
