import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto,randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import 'fake-indexeddb/auto';
import {createSignedOwnerCloud129} from '../research/signed-owner-cloud-integration-129/native-cloud-bridge.mjs';
const ownerA=randomUUID(),jpeg=readFileSync('benchmark/fixtures/commons-0002.jpg');
const sha=async b=>[...new Uint8Array(await webcrypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');
const data=b=>'data:image/jpeg;base64,'+b.toString('base64');
function response(status,body,bytes){return{ok:status>=200&&status<300,status,json:async()=>body,arrayBuffer:async()=>bytes?.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}
async function fixture({confirm=async()=>true,onUpload=async()=>{},onRemoteRead=async()=>{}}={}){
 const dbreq=indexedDB.open('closet-current-user-'+ownerA,2);
 const db=await new Promise((resolve,reject)=>{dbreq.onupgradeneeded=()=>{dbreq.result.createObjectStore('items',{keyPath:'id'});dbreq.result.createObjectStore('state',{keyPath:'id'});};dbreq.onsuccess=()=>resolve(dbreq.result);dbreq.onerror=()=>reject(dbreq.error);});
 const put=(store,row)=>new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(row);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
 const originalSHA=await sha(jpeg),meta=await sharp(jpeg).metadata(),cutout=await sharp(jpeg).extract({left:0,top:0,width:Math.floor(meta.width*.55),height:Math.floor(meta.height*.65)}).jpeg({quality:88}).toBuffer(),cutoutSHA=await sha(cutout),record={id:'p129-owner-top',ownerId:ownerA,image:data(jpeg),originalPhoto:{image:data(jpeg),sha256:originalSHA},sourceSHA256:originalSHA,sourceHashVerified:true,sourcePhotoOriginal:true,humanReviewedSource:true,singleGarmentVerified:false,outfitSourceId:'reviewed-group-photo',cutoutSHA256:cutoutSHA,segmentHint:{verified:true,ownerReviewedInstance:true,clipped:false,originalSHA256:originalSHA,cutoutSHA256:cutoutSHA,cutoutImage:data(cutout)},category:'Tops',itemType:'T-shirt',color:'Green',colorSource:'user',ownerReviewed:true,userAdjusted:true,confirmedCategory:true,confirmedColor:true,reviewProvenance:'explicit-owner-claim-not-independent-review-evidence',threeDReady:false};
 await put('items',record);await put('state',{id:'outfit-board',current:{slots:{top:record.id}},saved:[{id:'saved-look-129',ownerId:ownerA,name:'Saved',slots:{top:record.id}}]});
 const session={user:{id:ownerA},token:'deterministic-test-token-owner-A',active:true};
 const auth={user:session.user,assertCurrent(){if(!session.active)throw Error('session revoked');},async getAccessToken(){if(!session.active)throw Error('session revoked');return session.token;}};
 const objects=new Map();let remote=null;
 const fetcher=async(url,opts={})=>{
  assert.equal(opts.headers.Authorization,'Bearer '+session.token);
  assert.equal(opts.headers.apikey,'research-anon-key');
  if(url.includes('/storage/v1/object/closet-private/')){
   const path=decodeURIComponent(url.split('/closet-private/')[1]);
   if(opts.method==='POST'){if(!path.startsWith(ownerA+'/'))return response(403,{});if(objects.has(path))return response(409,{});objects.set(path,new Uint8Array(opts.body));await onUpload();return response(200,{});}
   if(!path.startsWith(ownerA+'/'))return response(403,{});if(!objects.has(path))return response(404,{});return response(200,{},objects.get(path));
  }
  if(url.includes('/rest/v1/closet_backups?')){await onRemoteRead();return response(200,remote?[remote]:[]);}
  if(url.endsWith('/rest/v1/rpc/save_closet_backup')){
   const rpc=typeof opts.body==='string'?JSON.parse(opts.body):opts.body,expected=remote?.revision||0;if(rpc.p_expected_revision!==expected)return response(200,null);
   if(rpc.p_document.ownerId!==ownerA)return response(403,{});
   remote={owner_id:ownerA,revision:expected+1,document:rpc.p_document};return response(200,remote.revision);
  }
  return response(404,{});
 };
 const bridge=createSignedOwnerCloud129({auth,db,baseURL:'https://research.invalid',anonKey:'research-anon-key',fetcher,confirmRestore:confirm,subtle:webcrypto.subtle});
 return{bridge,db,session,objects,get remote(){return remote;},set remote(x){remote=x;}};
}
test('P129 backs up private owner JPEG assets and manifest through authenticated RPC revision CAS',async()=>{
 const f=await fixture(),result=await f.bridge.backup({expectedRemoteRevision:0});
 assert.equal(result.saved,true);assert.equal(result.revision,1);assert.equal(result.photoObjects,2);
 assert.equal(f.remote.owner_id,ownerA);assert([...f.objects.keys()][0].startsWith(ownerA+'/'));
 assert.equal(JSON.stringify(f.remote.document).includes('data:image/jpeg;base64,'),false);
 assert.equal(f.bridge.status().realSignedJWTVerified,false);f.db.close();
});
test('P129 local wardrobe edits during photo upload abort before cloud manifest save',async()=>{
 let f;
 f=await fixture({onUpload:async()=>{await new Promise((resolve,reject)=>{const tx=f.db.transaction('items','readwrite'),r=tx.objectStore('items').get('p129-owner-top');r.onsuccess=()=>tx.objectStore('items').put({...r.result,color:'Blue'});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}});
 await assert.rejects(f.bridge.backup({expectedRemoteRevision:0}),e=>e.code==='conflict');
 assert.equal(f.remote,null);f.db.close();
});
test('P129 stale cloud revisions never overwrite newer remote wardrobe',async()=>{
 const f=await fixture();await f.bridge.backup({expectedRemoteRevision:0});f.remote={...f.remote,revision:2,document:{...f.remote.document,newer:true}};
 await assert.rejects(f.bridge.backup({expectedRemoteRevision:1}),e=>e.code==='conflict');assert.equal(f.remote.revision,2);f.db.close();
});
test('P129 restore verifies photos, requires literal consent and preserves outfit IDs atomically',async()=>{
 const f=await fixture();await f.bridge.backup({expectedRemoteRevision:0});
 await new Promise((resolve,reject)=>{const tx=f.db.transaction(['items','state'],'readwrite');tx.objectStore('items').clear();tx.objectStore('state').delete('outfit-board');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
 const result=await f.bridge.restore({expectedRemoteRevision:1});assert.equal(result.restored,true);
 const board=await new Promise((resolve,reject)=>{const r=f.db.transaction('state','readonly').objectStore('state').get('outfit-board');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 assert.equal(board.saved[0].id,'saved-look-129');f.db.close();
});
test('P129 user cancellation leaves the local wardrobe untouched',async()=>{
 const f=await fixture({confirm:async()=>({approved:true})}),before=await new Promise((resolve,reject)=>{const r=f.db.transaction('items','readonly').objectStore('items').getAll();r.onsuccess=()=>resolve(r.result);});
 await f.bridge.backup({expectedRemoteRevision:0});const result=await f.bridge.restore({expectedRemoteRevision:1});assert.equal(result.cancelled,true);
 const after=await new Promise((resolve,reject)=>{const r=f.db.transaction('items','readonly').objectStore('items').getAll();r.onsuccess=()=>resolve(r.result);});
 assert.equal(after.length,before.length);f.db.close();
});
test('P129 logout/account switch and token replacement revoke a late authenticated cloud response',async()=>{
 let entered,resume;const started=new Promise(r=>entered=r),waiting=new Promise(r=>resume=r);
 const f=await fixture({onRemoteRead:async()=>{entered();await waiting;}});
 const operation=f.bridge.backup({expectedRemoteRevision:0});await started;
 f.session.token='rotated-token-B';f.session.user.id=randomUUID();resume();
 await assert.rejects(operation,/owner|token|session|account/i);assert.equal(f.remote,null);f.db.close();
});
test('P129 implementation fails closed and explicitly disclaims signed-JWT verification',()=>{
 const src=readFileSync('research/signed-owner-cloud-integration-129/native-cloud-bridge.mjs','utf8');
 assert.match(src,/Authorization:\s*'Bearer '\+lease\.token/);assert.match(src,/approved!==true/);
 assert.match(src,/realSignedJWTVerified:false/);assert.match(src,/productionAuthorized:false/);
});
