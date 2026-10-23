import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readAlphaSavedWardrobe,createAlphaLiveOptions,renderAlphaLiveSnapshot} from '../public/family-alpha-2d-account-snapshot.mjs';
import {fingerprintAlphaRetainedOriginal,identityForSavedGarment} from '../public/family-alpha-2d-saved-board.mjs';

const OWNER='a1111111-1111-4111-8111-111111111111',OTHER='b2222222-2222-4222-8222-222222222222';
const image=n=>{const bytes=new Uint8Array(128).fill(n);bytes[0]=255;bytes[1]=216;bytes[126]=255;bytes[127]=217;return 'data:image/jpeg;base64,'+btoa(String.fromCharCode(...bytes));};
const item={id:'shirt',category:'Tops',image:image(11),originalPhoto:{image:image(22)}};
const board={id:'outfit-board',current:{name:'Owned outfit',slots:{top:'shirt'}},saved:[]};
function fakeDb({garments=[item],boardRow=board,missingStore=false,abort=false,gate=null}={}){
 const traces=[];
 const database={
  name:'closet-current-user-'+OWNER,
  objectStoreNames:{contains:name=>!missingStore&&['items','state'].includes(name)},
  transaction(names,mode){
   traces.push({names,mode});
   const pending=[],tx={
    objectStore(name){
     if(!['items','state'].includes(name))throw Error('Unknown store');
     return {getAll(){if(name!=='items')throw Error('Wrong store');const request={};pending.push({request,value:garments});return request;},
      get(key){if(name!=='state'||key!=='outfit-board')throw Error('Invalid record');const request={};pending.push({request,value:boardRow});return request;}};
    }
   };
   queueMicrotask(async()=>{
    if(gate)await gate;
    if(abort){tx.onabort?.();return;}
    for(const {request,value} of pending){request.result=value;request.onsuccess?.();}
    tx.oncomplete?.();
   });
   return tx;
  }
 };
 return {database,traces};
}
function setup(settings={}){
 const storage=fakeDb(settings),account={id:OWNER,epoch:1,cloudOwner:OWNER},auth={
  user:{id:OWNER},getSessionGeneration:()=>account.epoch,getAccessToken:async()=> 'fake-only-access'
 };
 const cloud={getOwnerId:db=>db===storage.database&&account.cloudOwner===auth.user.id?account.cloudOwner:null};
 return {account,auth,cloud,...storage,options:{auth,cloud,database:storage.database}};
}
test('reads actual Outfit Builder board and garments from one owner-scoped readonly transaction',async()=>{
 const f=setup(),snapshot=await readAlphaSavedWardrobe(f.options);
 assert.equal(snapshot.ownerId,OWNER);assert.equal(snapshot.indexedDbName,f.database.name);
 assert.equal(snapshot.items[0].id,'shirt');assert.equal(snapshot.board.slots.top,'shirt');
 assert.deepEqual(f.traces,[{names:['items','state'],mode:'readonly'}]);
});
test('unknown or missing saved board fails closed, with no generated outfit or color proxy',async()=>{
 for(const boardRow of [null,{id:'outfit-board',current:{slots:null}},
  {id:'outfit-board',current:{slots:[]}}]){
  const f=setup({boardRow});await assert.rejects(readAlphaSavedWardrobe(f.options),/private wardrobe read failed/);
 }
});
test('missing local account stores and invalid DB handles fail before reading',async()=>{
 const f=setup({missingStore:true});
 await assert.rejects(readAlphaSavedWardrobe(f.options),/stores unavailable/);
 assert.deepEqual(f.traces,[]);
});
test('IndexedDB transaction abort refuses to return any private garment',async()=>{
 const f=setup({abort:true});
 await assert.rejects(readAlphaSavedWardrobe(f.options),/private wardrobe read failed/);
});
test('sign-out, cloud owner change and local database mismatch reject without starting a transaction',async()=>{
 for(const mutate of [f=>f.auth.user=null,f=>f.account.cloudOwner=OTHER,
  f=>f.database.name='closet-current-user-'+OTHER,f=>f.account.epoch=0]){
  const f=setup();mutate(f);
  await assert.rejects(readAlphaSavedWardrobe(f.options),/active private account scope unavailable/);
  assert.equal(f.traces.length,0);
 }
});
test('changing account generation or user while storage transaction is pending rejects',async()=>{
 for(const change of [f=>f.account.epoch++,f=>f.auth.user={id:OTHER}]){
  let release;const gate=new Promise(resolve=>release=resolve);
  const f=setup({gate}),task=readAlphaSavedWardrobe(f.options);
  change(f);release();
  await assert.rejects(task,/saved wardrobe owner changed while reading|active private account scope unavailable/);
 }
});
test('live bridge wires real getter to server preflight and verifies original garment source',async()=>{
 const f=setup(),preparedImage={complete:true,naturalWidth:140,naturalHeight:240,cloneNode:()=>null};
 const settings=createAlphaLiveOptions({...f.options,
  fetchFn:async(url,opts)=>{
   assert.match(url,/\/auth\/v1\/user$/);
   assert.equal(opts.headers.Authorization,'Bearer fake-only-access');
   return {status:200,ok:true,json:async()=>({id:OWNER})};
  },publicKey:'test-publishable-key',cryptoProvider:webcrypto,
  preparePresentations:async({ownerId,items})=>{
   const record=items[0];
   return {shirt:{itemId:'shirt',ownerId,sourceIdentity:identityForSavedGarment(record),
    sourceVersion:await fingerprintAlphaRetainedOriginal(record.originalPhoto.image,webcrypto),
    approved:true,image:preparedImage}};
  }
 });
 const snapshot=await settings.loadScopedWardrobe({ownerId:OWNER,indexedDbName:f.database.name,database:f.database});
 assert.equal(snapshot.items[0].id,'shirt');
 assert.equal(settings.getSessionGeneration(),1);
 assert.equal(settings.getCloudOwnerId(),OWNER);
 assert.equal(typeof settings.preparePresentations,'function');
 await assert.rejects(settings.loadScopedWardrobe({ownerId:OTHER,indexedDbName:f.database.name,database:f.database}),/Foreign wardrobe/);
 await assert.rejects(settings.loadScopedWardrobe({ownerId:OWNER,indexedDbName:f.database.name,database:{}}),/Foreign IndexedDB/);
});
class FakeNode{constructor(){this.children=[];this.style={};this.dataset={};this.attributes={};}replaceChildren(...s){this.children=s;}append(node){this.children.push(node);}setAttribute(k,v){this.attributes[k]=v;}}
class FakeImage extends FakeNode{constructor(){super();this.complete=true;this.naturalWidth=130;this.naturalHeight=260;}cloneNode(){return new FakeImage();}}
test('full synthetic authenticated account to IndexedDB to source SHA to 2D layers succeeds',async()=>{
 const f=setup(),beforeDocument=globalThis.document,beforeImage=globalThis.HTMLImageElement;
 globalThis.document={createElement:()=>new FakeNode()};globalThis.HTMLImageElement=FakeImage;
 try{
  const container=new FakeNode();
  const result=await renderAlphaLiveSnapshot(container,{...f.options,fetchFn:async()=>({ok:true,status:200,json:async()=>({id:OWNER})}),
   publicKey:'synthetic-pub-key',cryptoProvider:webcrypto,
   preparePresentations:async({items,ownerId})=>({shirt:{
    itemId:'shirt',ownerId,sourceIdentity:identityForSavedGarment(items[0]),
    sourceVersion:await fingerprintAlphaRetainedOriginal(items[0].originalPhoto.image,webcrypto),
    approved:true,image:new FakeImage()
   }})
  });
  assert.equal(result.renderedLayers,1);assert.equal(result.serverAuthChecked,true);
  assert.equal(result.upstreamRlsUnverified,true);assert.equal(result.sourceMaskProofPending,true);
  assert.equal(container.children[0].children[1].dataset.slot,'top');
 }finally{globalThis.document=beforeDocument;globalThis.HTMLImageElement=beforeImage;}
});
test('cloud owner withdrawal before verification clears an existing avatar',async()=>{
 const f=setup(),container=new FakeNode();container.replaceChildren(new FakeNode());
 f.account.cloudOwner=OTHER;
 await assert.rejects(renderAlphaLiveSnapshot(container,{...f.options,
  fetchFn:async()=>{throw Error('must never fetch');},
  publicKey:'synthetic-key',preparePresentations:async()=>{throw Error('must not run');}}));
 assert.equal(container.children.length,0);
});
test('missing approved source preparation callback never renders a masked garment',()=>{
 const f=setup();
 assert.throws(()=>createAlphaLiveOptions({...f.options,fetchFn:async()=>{},publicKey:'key'}),/verified image/);
});
