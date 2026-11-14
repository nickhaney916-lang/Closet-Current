'use strict';
// Execute the complete actual P146 research mount factory in a synthetic DOM.
// Never sign in, open a real private wardrobe or call hosted Supabase.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs','utf8');
const marker='const UUID=';
assert.ok(src.includes(marker));
const code=src.slice(src.indexOf(marker)).replace(/^export /gm,'')+
 '\nglobalThis.__mount=mountOwnerReviewedCloud146;';
const owner='11111111-1111-4111-8111-111111111111';
const loc={protocol:'http:',hostname:'localhost',search:'?ownerReview145=research&ownerReview146=research',
 origin:'http://localhost'};
function fixture(failure='none'){
 const events=[],elements=new Map(),buttons=new Map();
 function element(tag){
  const node={tag,id:'',connected:false,open:false,disabled:false,onclick:null,
   textContent:'',innerHTML:'',hidden:false,
   setAttribute(){},
   addEventListener(name){events.push(tag+'.listen.'+name);
    if(failure==='modal-listener'&&tag==='dialog')throw Error('modal-handler-rejected');},
   showModal(){this.open=true},
   close(){this.open=false;events.push('dialog.closed')},
   remove(){this.connected=false;elements.delete(this.id);events.push(tag+'.removed') }
  };
  return node;
 }
 const menu={prepend(n){n.connected=true;elements.set(n.id,n);events.push('panel.added')}};
 const doc={
  querySelector(selector){return selector==='header .account-menu>div'?menu:null},
  createElement:element,
  getElementById(id){
   if(elements.get(id)?.connected)return elements.get(id);
   if(id==='ownerReview146Panel'||id==='ownerReview146Modal'||id==='owner146Style')return null;
   if(buttons.has(id))return buttons.get(id);
   const b=element('control');b.id=id;buttons.set(id,b);return b;
  },
  head:{append(n){n.connected=true;elements.set(n.id,n);events.push('style.added')}},
  body:{append(n){n.connected=true;elements.set(n.id,n);events.push('dialog.added')}}
 };
 const win={
  listeners:new Map(),
  addEventListener(name,fn){events.push('listener.add:'+name);
   if(failure==='first-global-listener'&&name==='closet:session-locked')
    throw Error('first-event-registration-failed');
   if(failure==='second-global-listener'&&name==='pagehide')
    throw Error('second-event-registration-failed');
   this.listeners.set(name,fn);
  },
  removeEventListener(name){events.push('listener.remove:'+name);this.listeners.delete(name)}
 };
 let backupRevoked=0,restoreRevoked=0;
 const ctx={URL,URLSearchParams,document:doc,location:loc,window:win,
  createLocalRemoteFence134(){
   events.push('factory.backup');
   if(failure==='backup-constructor')throw Error('backup-factory-rejected');
   return {revoke(){backupRevoked++;events.push('backup.revoked')}};
  },
  createCloudRestoreGuard137(){
   events.push('factory.restore');
   if(failure==='restore-constructor')throw Error('restore-factory-rejected');
   return {revoke(){restoreRevoked++;events.push('restore.revoked')}};
  }
 };
 vm.createContext(ctx);vm.runInContext(code,ctx);
 const auth={user:{id:owner},assertCurrent(){},getAccessToken:async()=>'p146-synthetic-local-only-1234567890'};
 const db={name:'closet-current-user-'+owner,transaction(){}};
 const legacy={ownerReviewHold145:()=>true};
 const args={auth,db,doc,loc,legacy,fetcher:async()=>{throw Error('unexpected HTTP')},
  subtle:{digest:async()=>new Uint8Array(32)},onRestored:async()=>{}};
 return {mount:()=>ctx.__mount(args),events,elements,buttons,win,
  get backupRevoked(){return backupRevoked},get restoreRevoked(){return restoreRevoked}};
}
function assertRemoved(f){
 for(const id of ['ownerReview146Panel','ownerReview146Modal','owner146Style'])
  assert.equal(f.elements.has(id),false,id+' leaked after failed mount');
 for(const id of ['owner146Preview','owner146Backup','owner146Restore']){
  const b=f.buttons.get(id);
  assert.ok(b,'button allocated '+id);
  assert.equal(b.disabled,true,id+' must disable');
  assert.equal(b.onclick,null,id+' must unbind');
 }
 assert.equal(f.win.listeners.size,0,'listener leaked from aborted mount');
}
for(const failure of ['backup-constructor','restore-constructor','modal-listener',
 'first-global-listener','second-global-listener']){
 test('P146 aborted '+failure+' fully revokes partially inserted private UI',async()=>{
  const f=fixture(failure);
  await assert.rejects(f.mount(),/rejected|failed/);
  assertRemoved(f);
  assert.equal(f.backupRevoked,
   ['restore-constructor','first-global-listener','second-global-listener'].includes(failure)?1:0);
  assert.equal(f.restoreRevoked,
   ['first-global-listener','second-global-listener'].includes(failure)?1:0);
 });
}
test('P146 successful synthetic mount remains available until explicit revoke',async()=>{
 const f=fixture();
 const mounted=await f.mount();
 assert.equal(mounted.state().mounted,true);
 assert.equal(f.elements.size,3);
 assert.equal(f.win.listeners.size,2);
 mounted.revoke();assertRemoved(f);
 assert.equal(f.backupRevoked,1);assert.equal(f.restoreRevoked,1);
 mounted.revoke();assert.equal(f.backupRevoked,1);
});
test('P146 mount rollback keeps original construction error and synthetic restrictions',()=>{
 for(const required of [
  "const onLocked=()=>revoke();",
  "catch(error){\n  revoke();\n  throw error;\n }",
  "auth.user!==ownerPrincipalAtMount",
  "SYNTHETIC_TOKEN_PREFIX",
  "redirect:'error',credentials:'omit'",
  "createLocalRemoteFence134","createCloudRestoreGuard137"
 ])assert.ok(src.includes(required),required);
});
