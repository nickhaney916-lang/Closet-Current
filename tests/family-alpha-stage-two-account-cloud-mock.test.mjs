/**
 * Family Alpha #255 — source-executed staged cloud client, synthetic accounts.
 * This is NOT evidence of server-side RLS or live Supabase JWT authorization.
 * No real accounts, provider calls, cookies, uploads, photos, or production.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {stageCloudSource,STAGE_BASE,PROD_BASE} from '../scripts/build-family-alpha-staging-auth-hold.mjs';

const A='a1111111-1111-4111-8111-111111111111';
const B='b2222222-2222-4222-8222-222222222222';
const KEY='sb_publishable_SYNTHETIC_STAGE_ONLY';
const source=stageCloudSource(await readFile('public/cloud-backup.js','utf8'));
const emptyDoc=()=>({schemaVersion:1,items:[],state:{}});
const dbFor=owner=>{
 const transactions=[];
 return {
  owner,transactions,
  transaction(stores,mode){
   const pending=[];
   const tx={
    mode,error:null,
    abort(){this.error=Error('Transaction rejected');this.onabort?.();},
    objectStore(name){
     return {
      getAll(){
       const req={result:[]};pending.push(req);return req;
      },
      get(){
       const req={result:undefined};pending.push(req);return req;
      },
      put(){},delete(){},clear(){}
     };
    }
   };
   transactions.push({stores,mode});
   queueMicrotask(()=>{
    for(const request of pending)request.onsuccess?.();
    if(!tx.error)tx.oncomplete?.();
   });
   return tx;
  }
 };
};
function fixture({owner=A,rows=[],delay=null,doc=emptyDoc()}={}){
 const requests=[],events=new Map(),elements=new Map(),restored=[];
 const ids=['cloudStatus','cloudBanner','resolveCloudConflict','syncCloset'];
 for(const id of ids)elements.set(id,{hidden:true,textContent:'',disabled:false});
 let sessionOwner=owner,epoch=4,token='SYNTHETIC_'+owner;
 const auth={
  user:{id:sessionOwner},
  getSessionGeneration:()=>epoch,
  getAccessToken:async()=>token
 };
 const window={
  __CLOSET_ALPHA_STAGE_AUTH__:{
   ready:true,releaseGate:'HOLD',
   base:STAGE_BASE,key:KEY,projectRef:'fbnplztkbsteuzrmbgib',
   redirect:'https://closet-current-staging.pages.dev/'
  },
  closetAuth:auth,
  ClosetBackupEngine:{
   stateIds:['draft','looks'],
   validateDocument(value){
    if(!value||value.schemaVersion!==1)throw Error('Untrusted synthetic document');
    return value;
   },
   async mapImages(value,mapper){
    return value.photo?{...value,photo:await mapper(value.photo)}:value;
   },
   equal:()=>true
  },
  addEventListener:(type,callback)=>events.set(type,callback)
 };
 const rowsReturned=rows.map(row=>({...row,document:row.document??doc}));
 const fetch=async(url,options)=>{
  const record={url,method:options.method,authorization:options.headers.Authorization,
   apikey:options.headers.apikey};
  requests.push(record);
  if(!url.startsWith(STAGE_BASE+'/rest/v1/closet_backups?'))
   throw Error('Unexpected API path or production contact: '+url);
  if(delay)await delay();
  return {ok:true,status:200,json:async()=>rowsReturned};
 };
 const context={
  window,document:{getElementById:id=>elements.get(id)},navigator:{storage:{persist:()=>Promise.resolve()}},
  fetch,AbortController,
  setTimeout:()=>1,clearTimeout:()=>{},setInterval:()=>1,
  crypto:{subtle:{digest(){throw Error('Do not hash real photos in synthetic fixture');}}},
  atob(){throw Error('Do not decode real photos in synthetic fixture');},
  btoa(){throw Error('Do not encode real photos in synthetic fixture');},
  Uint8Array,Map,Promise,Error,RegExp
 };
 vm.runInNewContext(source,context);
 return {
  window,elements,requests,restored,events,
  get owner(){return sessionOwner;},
  async start(){
   const db=dbFor(sessionOwner);
   await window.closetCloud.start(db,{
    capture:work=>work(),canRestore:()=>true,
    restored:()=>restored.push(sessionOwner)
   });
   return db;
  },
  changeUser(next){
   sessionOwner=next;epoch++;token='SYNTHETIC_'+next;auth.user={id:next};
  }
 };
}
test('staged cloud source has no production endpoint and remains disabled without approved stage Auth',async()=>{
 assert.ok(source.includes('BASE=stage.base,KEY=stage.key'));
 assert.ok(!source.includes(PROD_BASE));
 const denied=source.replace('const stage=window.__CLOSET_ALPHA_STAGE_AUTH__;',
  'const stage=window.__CLOSET_ALPHA_STAGE_AUTH__;');
 assert.equal(denied,source);
 const f=fixture({owner:A,rows:[]});
 assert.equal(f.window.closetCloud.getOwnerId(),null);
});
test('two synthetic accounts use distinct scoped backup queries and credentials, never production',async()=>{
 for(const owner of [A,B]){
  const f=fixture({owner});
  const db=await f.start();
  assert.equal(db.owner,owner);
  assert.equal(f.window.closetCloud.getOwnerId(db),owner);
  assert.equal(f.requests.length,1);
  assert.equal(f.requests[0].url,STAGE_BASE+'/rest/v1/closet_backups?select=owner_id,revision,document&owner_id=eq.'+owner);
  assert.equal(f.requests[0].authorization,'Bearer SYNTHETIC_'+owner);
  assert.equal(f.requests[0].apikey,KEY);
  assert.ok(f.requests.every(x=>!x.url.includes(PROD_BASE)));
  assert.deepEqual(f.restored,[]);
  f.window.closetCloud.invalidateSession();
  assert.equal(f.window.closetCloud.getOwnerId(db),null);
 }
});
test('a foreign backup returned by misrouted synthetic API is never restored',async()=>{
 const f=fixture({owner:A,rows:[{owner_id:B,revision:1,document:emptyDoc()}]});
 const db=await f.start();
 assert.equal(f.requests.length,1);
 assert.equal(f.requests[0].url.includes('owner_id=eq.'+A),true);
 assert.equal(f.restored.length,0);
 assert.equal(f.elements.get('cloudStatus').textContent.includes('Cloud connection unavailable'),true);
 assert.equal(db.transactions.some(x=>x.mode==='readwrite'),false,'foreign backup must never reach local database writes');
});
test('foreign owner JPEG pointer is refused before private Storage fetch or local restore',async()=>{
 const photo='closet-photo:'+B+'/'+'a'.repeat(64)+'.jpg';
 const f=fixture({owner:A,rows:[{
  owner_id:A,revision:1,document:{...emptyDoc(),photo}
 }]});
 const db=await f.start();
 assert.equal(f.requests.length,1,'foreign photo cannot trigger storage request');
 assert.equal(f.restored.length,0);
 assert.equal(db.transactions.some(x=>x.mode==='readwrite'),false);
 assert.match(f.elements.get('cloudStatus').textContent,/Cloud connection unavailable/);
});
test('switching from synthetic A to B during a pending cloud response prevents A restore into B',async()=>{
 let release;let requested;
 const signal=new Promise(resolve=>{release=resolve;});
 const f=fixture({
  owner:A,rows:[{owner_id:A,revision:1,document:emptyDoc()}],
  delay:()=>{requested?.();return signal;}
 });
 const started=new Promise(resolve=>{requested=resolve;});
 const pending=f.start();
 await started;
 f.changeUser(B);
 release();
 const db=await pending;
 assert.equal(f.window.closetCloud.getOwnerId(db),null);
 assert.equal(f.requests.length,1);
 assert.equal(f.requests[0].authorization,'Bearer SYNTHETIC_'+A);
 assert.equal(f.restored.length,0);
 assert.equal(db.transactions.some(x=>x.mode==='readwrite'),false);
});
test('actual wardrobe source still keys local IndexedDB to authenticated owner UUID',async()=>{
 const app=await readFile('public/app.js','utf8');
 assert.match(app,/indexedDB\.open\('closet-current-user-'\+window\.closetAuth\.user\.id,2\)/);
 assert.match(app,/await window\.closetAuth\.ready/);
 assert.match(source,/const current=gate=>enabled&&db===gate\.db&&user===gate\.user&&generation===gate\.generation/);
 assert.match(source,/if\(!current\(gate\)\)\{tx\.abort\(\);return;\}/);
});
