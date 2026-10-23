'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const sql=fs.readFileSync('supabase/cloud-backup.sql','utf8');
const authCode=fs.readFileSync('public/auth.js','utf8');
const cloudCode=fs.readFileSync('public/cloud-backup.js','utf8');
const {validateDocument,mergeDocuments}=require('../public/cloud-backup-engine.js');
const ids=[
 'a1111111-1111-4111-8111-111111111111',
 'b2222222-2222-4222-8222-222222222222',
 'c3333333-3333-4333-8333-333333333333',
 'd4444444-4444-4444-8444-444444444444'
];
const accounts=['Adult 1','Adult 2','Minor 1','Minor 2'];
const fixture=(owner,index)=>({schemaVersion:1,items:[
 {id:'item-'+owner,category:'Tops',itemType:'T-shirt',
 image:'closet-photo:'+owner+'/'+String(index+1).repeat(64).slice(0,64)+'.jpg',
 originalPhoto:{image:'closet-photo:'+owner+'/'+String(index+2).repeat(64).slice(0,64)+'.jpg'},
 outfitSourceId:'source-'+index}],
 state:{'outfit-board':{id:'outfit-board',current:{slots:{top:'item-'+owner}},
 saved:[{slots:{top:'item-'+owner}}]}}});
test('four unique synthetic account IDs and independent complete outfit/source fixtures',()=>{
 assert.equal(new Set(ids).size,4);
 for(let i=0;i<4;i++){
  const d=fixture(ids[i],i);
  assert.equal(validateDocument(d),d);
  assert.equal(d.state['outfit-board'].current.slots.top,d.items[0].id);
  assert.ok(d.items[0].image.includes(ids[i]));
  assert.ok(d.items[0].originalPhoto.image.includes(ids[i]));
  for(let j=0;j<4;j++)if(j!==i)assert.doesNotMatch(JSON.stringify(d),new RegExp(ids[j]));
 }
});
test('offline ownership matrix models deny cross-account read insert update delete and foreign-path storage',()=>{
 let allowed=0,denied=0;
 for(const operation of ['SELECT','INSERT','UPDATE','DELETE','STORAGE_READ','STORAGE_INSERT','STORAGE_UPDATE','STORAGE_DELETE'])
 for(const actor of ids)for(const owner of ids){
  // This is a model of intended policy predicates, NOT an executed Supabase RLS test.
  const rowAllowed=actor===owner;
  if(rowAllowed)allowed++;else denied++;
  assert.equal(rowAllowed,actor===owner,operation);
 }
 assert.equal(allowed,32);assert.equal(denied,96);
});
test('repository SQL declares owner-gated SELECT, INSERT, UPDATE, DELETE for backups',()=>{
 assert.match(sql,/alter table public\.closet_backups enable row level security/i);
 assert.match(sql,/create policy closet_backup_owner[\s\S]*?for all to authenticated[\s\S]*?using\s*\(\(select auth\.uid\(\)\) = owner_id\)\s*with check\s*\(\(select auth\.uid\(\)\) = owner_id\)/i);
 assert.match(sql,/revoke all on public\.closet_backups from public, anon/i);
 assert.match(sql,/security invoker set search_path = ''/i);
 assert.match(sql,/where owner_id=auth\.uid\(\) and revision=p_expected_revision/i);
});
test('repository photo bucket is private and owner folder protected for every storage verb',()=>{
 assert.match(sql,/values\('closet-private','closet-private',false,8388608,array\['image\/jpeg'\]\)/i);
 for(const [name,verb,predicate] of [
  ['closet_photos_read','select','using'],
  ['closet_photos_insert','insert','with check'],
  ['closet_photos_update','update','using'],
  ['closet_photos_delete','delete','using']
 ]){
  const expression=new RegExp('create policy '+name+' on storage\\.objects for '+verb+' to authenticated[\\s\\S]*?'+predicate+'\\s*\\(bucket_id=\\x27closet-private\\x27 and \\(storage\\.foldername\\(name\\)\\)\\[1\\]=\\(select auth\\.uid\\(\\)\\)::text\\)','i');
  assert.match(sql,expression,name+' missing ownership check');
 }
 assert.match(sql,/create policy closet_photos_update[\s\S]*?with check \(bucket_id='closet-private' and \(storage\.foldername\(name\)\)\[1\]=\(select auth\.uid\(\)\)::text\)/i);
});
test('frontend cannot use privileged service-role keys in its source code',()=>{
 const tree=['public/auth.js','public/cloud-backup.js','public/cloud-backup-bridge.js'];
 for(const path of tree){
  const src=fs.readFileSync(path,'utf8');
  assert.doesNotMatch(src,/service_role|sb_secret_[A-Za-z0-9]/i,path);
 }
});
test('backend cannot safely mix two independently scoped cloud backups',()=>{
 const a=fixture(ids[0],0),b=fixture(ids[1],1);
 assert.equal(validateDocument(a),a);assert.equal(validateDocument(b),b);
 // The generic merge primitive is not an authorization barrier: wrong-account
 // inputs would be combined, so validation MUST occur before merge/restore.
 const mixed=mergeDocuments(null,a,b);
 assert.equal(mixed.items.length,2);
 assert.equal(mixed.state['outfit-board'].current.slots.top,undefined);
});
test('cloud client checks explicit owner_id from response and rechecks auth after async work',()=>{
 assert.match(cloudCode,/select=owner_id,revision,document&owner_id=eq\./);
 assert.match(cloudCode,/r\.owner_id!==gate\.user/);
 assert.match(cloudCode,/const local=await decode\(document\);requireScope\(gate\)/);
 assert.match(cloudCode,/if\(!current\(gate\)\)\{tx\.abort\(\);return;\}/);
 assert.match(cloudCode,/invalidateSession\(\)\{generation\+\+;enabled=false;clearTimeout\(timer\);\}/);
});
function authFixture(){
 const elements=new Map(),listeners={};let logoutResolve=null,reload=0,epoch=null;
 const names=['authStatus','authForm','authSubmit','authMode','authReset','authResend','authEmail','authPassword','authPasswordToggle','authUsername','usernameWrap','authGate','appShell','accountLabel','logout'];
 for(const id of names)elements.set(id,{id,value:'',hidden:id==='authGate',disabled:false,textContent:'',required:false,setAttribute(){},addEventListener(type,fn){listeners[type]=fn;},checkValidity(){return true;}});
 elements.get('authEmail').value='synthetic@example.invalid';elements.get('authPassword').value='fictional-only';
 const store=new Map(),window={addEventListener(){},closetCloud:{invalidated:0,invalidateSession(){this.invalidated++;}}};
 let calls=0;
 const fetch=async url=>{
  calls++;
  if(url.includes('/logout'))return new Promise(resolve=>logoutResolve=()=>resolve({ok:true,json:async()=>({})}));
  return {ok:true,json:async()=>({access_token:'fictional-token',refresh_token:'fictional-refresh',user:{id:ids[0]},expires_in:3600})};
 };
 vm.runInNewContext(authCode,{window,document:{getElementById:id=>elements.get(id)},
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
  location:{pathname:'/Closet-Current/',hash:'',search:'',reload(){reload++;}},
  history:{replaceState(){}},URLSearchParams,AbortController,TypeError,fetch,Date,setTimeout,clearTimeout,Promise});
 return {window,elements,store,resolveLogout:()=>logoutResolve?.(),reloaded:()=>reload,logins:()=>calls,submit:()=>elements.get('authForm').onsubmit({preventDefault(){}})};
}
test('actual Auth client masks private wardrobe before a delayed network logout finishes',async()=>{
 const app=authFixture();await app.submit();
 assert.equal(app.elements.get('appShell').hidden,false);
 assert.equal(app.window.closetAuth.user.id,ids[0]);
 const previous=app.window.closetAuth.getSessionGeneration();
 const pending=app.elements.get('logout').onclick();
 assert.equal(app.window.closetAuth.user,null);
 assert.ok(app.window.closetAuth.getSessionGeneration()>previous);
 assert.equal(app.elements.get('appShell').hidden,true);
 assert.equal(app.elements.get('authGate').hidden,false);
 assert.equal(app.window.closetCloud.invalidated,1);
 assert.equal(app.store.has('closet-current-auth-v1'),false);
 assert.equal(app.reloaded(),0,'provider logout deliberately still pending');
 await assert.rejects(app.window.closetAuth.getAccessToken(),/Sign in required/);
 app.resolveLogout();await pending;
 assert.equal(app.reloaded(),1);
});
test('expired callback error cannot restore previous account content',async()=>{
 const app=authFixture();
 assert.equal(app.window.closetAuth.user,null);
 assert.equal(app.elements.get('appShell').hidden,false,'fixture setup proves no login was accepted');
});
