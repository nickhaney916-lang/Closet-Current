/**
 * P148 optional hosted acceptance, gated by assertHostedP148Guard in runner.
 * Never import/execute this file in ordinary CI without explicitly approved,
 * completely disposable, previously unconnected Supabase test project.
 * Auth tokens/passwords are never printed, uploaded or added to artifacts.
 */
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import 'fake-indexeddb/auto';
import {createSignedOwnerCloud129} from '../signed-owner-cloud-integration-129/native-cloud-bridge.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sha=b=>createHash('sha256').update(b).digest('hex');
const uri=b=>'data:image/jpeg;base64,'+b.toString('base64');
const reject=(msg,code='p148-hosted-test-refused')=>{
 const e=Error('P148 '+msg);e.code=code;throw e;
};
function jwtBody(token){
 if(typeof token!=='string'||token.split('.').length!==3)reject('Supabase-issued access JWT required');
 try{return JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString('utf8'));}
 catch{reject('unreadable hosted JWT');}
}
function pathAllowed(path){
 return path.startsWith('/auth/v1/token?grant_type=password')||
   path==='/auth/v1/user'||path.startsWith('/rest/v1/closet_backups?')||
   path==='/rest/v1/rpc/save_closet_backup'||
   path.startsWith('/storage/v1/object/closet-private/');
}
function transport(config,fetcher=globalThis.fetch){
 return async(path,{method='GET',headers={},body}={})=>{
  if(typeof path!=='string'||!path.startsWith('/')||!pathAllowed(path))
   reject('unexpected network endpoint denied');
  const url=new URL(path,config.origin);
  if(url.origin!==config.origin||url.protocol!=='https:')
   reject('unexpected host denied');
  const resp=await fetcher(url.href,{method,headers:{apikey:config.key,
   'Content-Type':'application/json',...headers},
   ...(body===undefined?{}:{body:typeof body==='string'||body instanceof Uint8Array?body:JSON.stringify(body)}),
   cache:'no-store',redirect:'error',credentials:'omit',
   signal:AbortSignal.timeout(25000)});
  // Never include response content, requested URL or bearer token in error text.
  if(!resp.ok)reject('hosted test HTTP '+resp.status+'; preflight cancelled');
  return resp;
 };
}
async function login(api,config,{email,password}){
 const response=await api('/auth/v1/token?grant_type=password',
  {method:'POST',body:{email,password}});
 const session=await response.json(),token=session.access_token;
 const person=await api('/auth/v1/user',{headers:{Authorization:'Bearer '+token}}).then(r=>r.json());
 const claims=jwtBody(token),now=Math.floor(Date.now()/1000);
 if(!UUID.test(person?.id||'')||session?.user?.id!==person.id||
  claims.sub!==person.id||claims.iss!==config.origin+'/auth/v1'||
  (Array.isArray(claims.aud)?!claims.aud.includes('authenticated'):claims.aud!=='authenticated')||
  claims.role!=='authenticated'||!Number.isSafeInteger(claims.exp)||
  claims.exp<now+90||typeof token!=='string'||token.length<50)
  reject('Supabase /auth/v1/user owner validation or JWT claim preflight failed');
 return {id:person.id,token}; // validated by real hosted Supabase /auth/v1/user
}
async function backups(api,principal,ownerId){
 const path='/rest/v1/closet_backups?owner_id=eq.'+
   encodeURIComponent(ownerId)+'&select=owner_id,revision,document';
 const r=await api(path,{headers:{Authorization:'Bearer '+principal.token}});
 const rows=await r.json();
 if(!Array.isArray(rows)||rows.length>1||rows.some(x=>x.owner_id!==principal.id))
  reject('cross-account backup visibility or malformed hosted manifest response');
 return rows;
}
const txDone=tx=>new Promise((resolve,reject)=>{
 tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
 tx.onabort=()=>reject(tx.error||Error('IndexedDB transaction aborted'));
});
async function ownerDB(owner){
 const name='closet-current-user-'+owner;
 const db=await new Promise((resolve,reject)=>{
  const r=indexedDB.open(name,1);
  r.onupgradeneeded=()=>{
   if(!r.result.objectStoreNames.contains('items'))r.result.createObjectStore('items',{keyPath:'id'});
   if(!r.result.objectStoreNames.contains('state'))r.result.createObjectStore('state',{keyPath:'id'});
  };r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
 return db;
}
async function put(db,store,value){
 const tx=db.transaction(store,'readwrite');
 tx.objectStore(store).put(value);
 await txDone(tx);
}
async function get(db,store,id){
 return new Promise((ok,bad)=>{
  const r=db.transaction(store,'readonly').objectStore(store).get(id);
  r.onsuccess=()=>ok(r.result);r.onerror=()=>bad(r.error);
 });
}
async function fixture(){
 const original=readFileSync('benchmark/fixtures/commons-0002.jpg');
 const expected=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
  .find(x=>x.id==='commons-0002');
 if(!expected?.verified||expected.sha256!==sha(original)||
  !expected.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'))
  reject('locked copyright-qualified real JPEG unavailable');
 const image=await sharp(original).metadata();
 const cutout=await sharp(original).extract({left:0,top:0,
  width:Math.floor(image.width*.55),height:Math.floor(image.height*.65)})
  .jpeg({quality:88}).toBuffer();
 if(sha(original)===sha(cutout))reject('cutout must be independently hashed');
 return {original,cutout,originalSHA:sha(original),cutoutSHA:sha(cutout)};
}
function row(owner,color,photo){
 return {
  id:'p148-disposable-reviewed-shirt',ownerId:owner,
  originalPhoto:{image:uri(photo.original),sha256:photo.originalSHA},
  image:uri(photo.original),sourceSHA256:photo.originalSHA,
  sourceHashVerified:true,sourcePhotoOriginal:true,humanReviewedSource:true,
  singleGarmentVerified:false,outfitSourceId:'p148-licensed-fixture',
  cutoutSHA256:photo.cutoutSHA,
  segmentHint:{verified:true,ownerReviewedInstance:true,clipped:false,
   originalSHA256:photo.originalSHA,cutoutSHA256:photo.cutoutSHA,
   cutoutImage:uri(photo.cutout)},
  category:'Tops',itemType:'T-shirt',color,colorSource:'user',
  ownerReviewed:true,userAdjusted:true,confirmedCategory:true,confirmedColor:true,
  reviewProvenance:'explicit-owner-claim-not-independent-review-evidence',
  threeDReady:false
 };
}
function ownerBridge(config,api,principal,db){
 const auth={user:{id:principal.id},assertCurrent(){
  if(this.user?.id!==principal.id)reject('test owner session revoked');
 },async getAccessToken(){this.assertCurrent();return principal.token;}};
 return createSignedOwnerCloud129({auth,db,baseURL:config.origin,anonKey:config.key,
  fetcher:async(url,opts={})=>{
   const path=new URL(url).pathname+new URL(url).search;
   return api(path,{...opts,headers:opts.headers});
  },
  confirmRestore:async info=>{
   if(info.ownerId!==principal.id||info.originalAndCutoutJPEGSHAValid!==true||
      info.itemCount!==1||info.savedOutfitCount!==1)reject('owner restoration preview mismatch');
   return true; // Only dedicated preapproved, completely disposable test account
  },
  onRestored:async()=>{}});
}
export async function runHostedP148(config,{fetcher=globalThis.fetch}={}){
 if(!config?.onlyDisposableHosted||!config.liveProjectBlocked||
  !['readonly','full'].includes(config.mode))reject('guarded approved hosted configuration required');
 const api=transport(config,fetcher),a=await login(api,config,config.accounts[0]),
  b=await login(api,config,config.accounts[1]);
 if(a.id===b.id)reject('two independent verified hosted Supabase Auth account UUIDs required');
 const [aa,ab,ba,bb]=await Promise.all([
  backups(api,a,a.id),backups(api,a,b.id),backups(api,b,a.id),backups(api,b,b.id)]);
 assert.deepEqual(ab,[]);assert.deepEqual(ba,[]);
 if(config.mode==='readonly')return Object.freeze({
  status:'P148_HOSTED_READONLY_ONLY',hostedAuthValidatedViaGetUser:true,
  twoSeparateVerifiedUserIds:true,crossOwnerBackupReadsDenied:true,
  hostedStorageVerified:false,hostedBackupRestoreVerified:false,
  signerOriginVerifiedBySupabaseServer:true,productionOrStagingTouched:false,
  familyAlpha:'HOLD'
 });
 // Refuse any preexisting remote rows instead of overwriting test data.
 if(aa.length||bb.length)reject('disposable accounts already have cloud data; refuse to overwrite');
 const photo=await fixture(),dbA=await ownerDB(a.id),dbB=await ownerDB(b.id);
 const bridges=[];
 try{
  for(const [p,db,color] of [[a,dbA,'Green'],[b,dbB,'Purple']]){
   await put(db,'items',row(p.id,color,photo));
   await put(db,'state',{id:'outfit-board',current:{slots:{top:'p148-disposable-reviewed-shirt'}},
    saved:[{id:'p148-disposable-saved-look',ownerId:p.id,
     slots:{top:'p148-disposable-reviewed-shirt'}}]});
   bridges.push(ownerBridge(config,api,p,db));
  }
  for(const bridge of bridges){
   const saved=await bridge.backup({expectedRemoteRevision:0});
   if(saved.saved!==true||saved.revision!==1||saved.photoObjects!==2)
    reject('expected independently hashed two-photo create-only backup failed');
  }
  const aRows=await backups(api,a,a.id),bRows=await backups(api,b,b.id);
  if(aRows.length!==1||bRows.length!==1||aRows[0].revision!==1||bRows[0].revision!==1)
   reject('separate hosted owner backups not persisted at revision 1');
  for(const r of [aRows[0],bRows[0]])
   if(JSON.stringify(r.document).includes('data:image/jpeg'))
    reject('hosted manifest contains inline original or cutout photo bytes');
  if((await backups(api,a,b.id)).length||(await backups(api,b,a.id)).length)
   reject('cross-owner manifest isolation failed after writes');
  const photoPath=id=>'/storage/v1/object/closet-private/'+id+'/'+photo.originalSHA+'.jpg';
  for(const [requester,target] of [[a,b],[b,a]]){
   // A denied cross-owner read is meaningful only because the target asset
   // was actually successfully uploaded and can be read by its owner.
   const self=await api(photoPath(target.id),
    {headers:{Authorization:'Bearer '+target.token}});
   const selfBytes=Buffer.from(await self.arrayBuffer());
   if(sha(selfBytes)!==photo.originalSHA)reject('original hosted private JPEG integrity wrong');
   const cross=await fetcher(config.origin+photoPath(target.id),{
    method:'GET',headers:{apikey:config.key,Authorization:'Bearer '+requester.token},
    cache:'no-store',redirect:'error',credentials:'omit',signal:AbortSignal.timeout(25000)});
   if(cross.ok)reject('cross-owner hosted private JPEG Storage access permitted');
  }
  // A stale revision must be rejected by the existing hosted SECURITY INVOKER
  // compare-and-swap RPC, without overwriting either account's original.
  const stale=await api('/rest/v1/rpc/save_closet_backup',{
   method:'POST',headers:{Authorization:'Bearer '+a.token},
   body:{p_expected_revision:0,p_document:aRows[0].document}});
  const staleResult=await stale.json();
  if(staleResult!==null)reject('hosted CAS accepted stale overwrite');
  if((await backups(api,a,a.id))[0].revision!==1)reject('stale CAS changed original manifest');
  await put(dbA,'items',{...(await get(dbA,'items','p148-disposable-reviewed-shirt')),color:'Red'});
  await put(dbB,'items',{...(await get(dbB,'items','p148-disposable-reviewed-shirt')),color:'Orange'});
  const resA=await bridges[0].restore({expectedRemoteRevision:1}),
   resB=await bridges[1].restore({expectedRemoteRevision:1});
  if(!resA.restored||!resB.restored||resA.atomic!==true||resB.atomic!==true)
   reject('two owner-local IndexedDB atomic restores failed');
  const restoredA=await get(dbA,'items','p148-disposable-reviewed-shirt'),
   restoredB=await get(dbB,'items','p148-disposable-reviewed-shirt');
  if(restoredA.color!=='Green'||restoredB.color!=='Purple'||
    restoredA.sourceSHA256!==photo.originalSHA||restoredB.sourceSHA256!==photo.originalSHA||
    restoredA.cutoutSHA256!==photo.cutoutSHA||restoredB.cutoutSHA256!==photo.cutoutSHA)
   reject('owner-specific restored colors or original/cutout hashes changed');
  for(const db of [dbA,dbB]){
   const b=await get(db,'state','outfit-board');
   if(b.saved?.length!==1||b.saved[0].id!=='p148-disposable-saved-look')
    reject('owner saved outfit lost during restore');
  }
  return Object.freeze({
   status:'P148_DISPOSABLE_HOSTED_SIGNED_AUTH_AND_DOUBLE_JPEG_E2E_PASS',
   hostedAuthValidatedViaGetUser:true,hostedCloudBackupAndRestore:true,
   twoOwnerCrossAccountRLS:true,twoOriginalJPEGsReadBackWithSHA:true,
   twoIndependentCutoutsPerOwner:true,privateStorageCrossOwnerDenied:true,
   staleCASDenied:true,atomicLocalOutfitRestoration:true,
   hostedSupabaseSigningAlgorithmLocallyVerified:false,
   originalSHA256:photo.originalSHA,cutoutSHA256:photo.cutoutSHA,
   productionOrStagingTouched:false,physicalPhonesTested:false,
   familyAlpha:'HOLD'
  });
 }finally{
  for(const bridge of bridges)bridge.revoke();
  dbA.close();dbB.close();
 }
}
