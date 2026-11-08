import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {researchMode180,createCloudToNative3D180,CLOUD_3D_180}
 from '../research/cloud-to-native-3d-180/owner-restore-3d-barrier.mjs';
const loc=(search='?ownerReview145=research&ownerReview146=research&ownerCutout178=research&nativeLossless04=research&native3D05=research&cloud3D180=research')=>
 ({protocol:'http:',hostname:'127.0.0.1',search});
function setup(){
 const owner=randomUUID();
 const saved=[{id:'owner-outfit',slots:{top:'owner-original-shirt'}}];
 let dirty=false,active=true,view=false,loaded=0,attested=0;
 const events=new Map();
 const win={addEventListener(name,fn){events.set(name,fn);},
  removeEventListener(name){events.delete(name);}};
 const board={
  status:()=>({active,dirty,savedCount:saved.length,selected:0}),
  readOnlySnapshot:()=>({saved:structuredClone(saved)}),
  readOnlyGarmentSources91:ids=>({ownerId:owner,sources:ids.map(id=>({id,sha256:'f'.repeat(64)}))}),
  async attestOriginalPhotoBytes92(ids){attested+=ids.length;return {ownerId:owner,sources:ids.map(id=>({id}))};},
  async load({discard}={}){
   assert.equal(discard,false,'P180 must never silently discard unsaved outfit edits');
   loaded++;return {loaded:true};
  }
 };
 const auth={user:{id:owner},assertCurrent(){if(this.user.id!==owner)throw Error('changed owner');},
  async getAccessToken(){return 'p146-synthetic-local-only-'+owner;}};
 const viewer={state:()=>({active:view,modelReady:view}),close(){view=false;}};
 const db={name:'closet-current-user-'+owner};
 const gate=createCloudToNative3D180({auth,db,board,viewer,loc:loc(),win});
 return {owner,saved,auth,db,board,viewer,gate,events,
  setDirty:v=>dirty=v,setActive:v=>active=v,setScene:v=>view=v,
  stats:()=>({loaded,attested})};
}
test('P180 research is strictly SIX opt-in local HTTP flags, not production or staging',()=>{
 for(const host of ['127.0.0.1','localhost','[::1]'])
  assert.equal(researchMode180({...loc(),hostname:host}),true);
 for(const value of ['ownerReview145','ownerReview146','ownerCutout178',
  'nativeLossless04','native3D05','cloud3D180']){
  const params=new URLSearchParams(loc().search);params.delete(value);
  assert.equal(researchMode180(loc('?'+params.toString())),false,value);
 }
 for(const changed of [{...loc(),hostname:'hlkgymugtfbirlpunsra.supabase.co'},
  {...loc(),hostname:'fbnplztkbsteuzrmbgib.supabase.co'},
  {...loc(),hostname:'attacker.com'},{...loc(),protocol:'https:'},null])
  assert.equal(researchMode180(changed),false);
 assert.equal(CLOUD_3D_180.hostedSignedJWTVerified,false);
 assert.equal(CLOUD_3D_180.familyAlpha,'HOLD');
});
test('P180 refuses missing genuine native board and original 3D viewer, wrong private owner DB and non-UUID accounts',()=>{
 const x=setup();x.gate.dispose();
 for(const field of [
  {board:null},{viewer:null},{auth:{user:{id:'foreign'}}},
  {db:{name:'closet-current-user-'+randomUUID()}},
  {loc:{...loc(),protocol:'https:'}}
 ]){
  const base={auth:x.auth,db:x.db,board:x.board,viewer:x.viewer,
   loc:loc(),win:{addEventListener(){},removeEventListener(){}}};
  assert.throws(()=>createCloudToNative3D180({...base,...field}),/P180/);
 }
});
test('P180 fails closed before destructive consent when unsaved outfit draft or WebGL preview is active',()=>{
 const x=setup();
 try{
  x.setDirty(true);assert.throws(()=>x.gate.begin(),/unsaved outfit/);
  x.setDirty(false);x.setScene(true);assert.throws(()=>x.gate.begin(),/active anatomical 3D/);
  x.setScene(false);const t=x.gate.begin();
  assert.equal(x.gate.pending(),true);
  assert.throws(()=>x.gate.begin(),/concurrent/);
  x.gate.finish(t);assert.equal(x.gate.pending(),false);
 }finally{x.gate.dispose();}
});
test('P180 explicit owner rejection causes no restore, no native 3D reload and no source mutation',async()=>{
 const x=setup();
 try{
  const l=x.gate.begin(),result=await x.gate.consent(l,async()=>false);
  assert.equal(result,false);
  assert.equal(x.stats().loaded,0);
  assert.equal(x.stats().attested,0);
  assert.equal(x.gate.state().restores,0);
  assert.equal(x.gate.finish(l),true);
 }finally{x.gate.dispose();}
});
test('P180 applies ACTUAL private native owner board reload after confirmed atomic restore, SHA checks original and does NOT create fake 3D',async()=>{
 const x=setup();
 try{
  const l=x.gate.begin();
  assert.equal(await x.gate.consent(l,async()=>true),true);
  const r=await x.gate.afterAtomicRestore(l);
  assert.equal(r.restored,true);
  assert.equal(r.savedOutfits,1);
  assert.equal(r.originalJPEGsAttested,1);
  assert.equal(r.privateSourceIntegrity,true);
  assert.equal(x.stats().loaded,1);
  assert.equal(x.stats().attested,1);
  assert.equal(x.gate.state().nativeOwnerBoardReloaded,1);
  assert.equal(x.gate.state().originalJPEGsAttested,1);
  assert.equal(x.gate.state().familyAlpha,'HOLD');
  assert.equal(x.gate.finish(l),true);
 }finally{x.gate.dispose();}
});
test('P180 prevents newly opened WebGL or new unsaved edits DURING asynchronous owner consent',async()=>{
 for(const cause of ['viewer','dirty','outfit']){
  const x=setup();
  try{
   const l=x.gate.begin();
   await assert.rejects(x.gate.consent(l,async()=>{
    if(cause==='viewer')x.setScene(true);
    if(cause==='dirty')x.setDirty(true);
    if(cause==='outfit')x.saved.push({id:'foreign-after-consent',slots:{top:'foreign'}});
    return true;
   }),/P180/);
   assert.equal(x.stats().loaded,0);
   assert.equal(x.stats().attested,0);
  }finally{x.gate.dispose();}
 }
});
test('P180 logout, owner switch, missing original source, stale lease and pagehide revoke without DB mutation',async()=>{
 const x=setup();
 try{
  const l=x.gate.begin();
  x.auth.user.id=randomUUID();
  await assert.rejects(x.gate.afterAtomicRestore(l),/P180|changed owner/);
  assert.equal(x.stats().loaded,0);
 }finally{x.gate.dispose();}
 const y=setup();
 const l=y.gate.begin();
 y.events.get('pagehide')();
 assert.equal(y.gate.pending(),false);
 await assert.rejects(y.gate.afterAtomicRestore(l),/P180/);
 assert.equal(y.stats().loaded,0);
 y.gate.dispose();
});
test('P180 native P146 owner-reviewed cloud consent callback and P550 actual board refresh stay connected to P126 restore',()=>{
 const script=readFileSync('research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs','utf8');
 for(const value of [
  "get('cloud3D180')==='research'",
  "createCloudToNative3D180",
  "board:globalThis.window?.nativeLossless04Bridge",
  "viewer:globalThis.window?.native3D05Bridge",
  "cloud3D180.consent(restoreLease180",
  "cloud3D180.afterAtomicRestore(restoreLease180)",
  "const lease=cloud3D180?.begin()||null",
  "cloud3D180?.finish(lease)",
  "nativeCloud3DRefresh180:!revoked&&!!cloud3D180",
  "cloud3D180?.dispose()"
 ])assert.ok(script.includes(value),value);
 assert.ok(script.includes('restoreService.restoreWithOwnerReview()'));
 assert.ok(script.includes('backupService.backupWithReviewedConsent()'));
 const real=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.ok(real.includes('win.cloudToNative3D180Bridge?.pending?.()'));
 assert.ok(real.includes('P180 private cloud replacement pending'));
});
test('P180 actual real-browser benchmark covers Chromium WebGL after atomic double JPEG, owner review and 2D fallback',()=>{
 const s=readFileSync('scripts/test-atomic-cloud-to-native-3d-180-browser.mjs','utf8');
 for(const value of [
  "fixtures/commons-0003.jpg",
  "ownerCutout178=research&nativeLossless04=research&native3D05=research&cloud3D180=research",
  "document.getElementById('authGate').hidden=true",
  "await page.reload({waitUntil:'domcontentloaded'})",
  "await page.waitForFunction(()=>window.native3D05Bridge?.state().modelReady",
  "window.native3D05Bridge.state().bones===163",
  "09-active-3d-cloud-replacement-refused",
  "assert.equal(refreshed180.nativeOwnerBoardReloaded,1)"
 ])assert.ok(s.includes(value),value);
});
test('P180 no merge/deployment and unchanged P179 cloud JWT, cloud schemas, actual original fixture',()=>{
 const workflow=readFileSync('.github/workflows/atomic-cloud-to-native-3d-180-no-deploy.yml','utf8');
 for(const value of [
  'BASE=1b362c0f9a07345cf112ed8745011a9d89695081',
  'git diff --exit-code "$BASE" HEAD -- public supabase',
  'node scripts/test-atomic-cloud-to-native-3d-180-browser.mjs',
  'node --test tests/*.cjs tests/*.mjs',
  'df6885d6011cb33fb22dceb81a08f35a0ac4dd61'
 ])assert.ok(workflow.includes(value),value);
});
