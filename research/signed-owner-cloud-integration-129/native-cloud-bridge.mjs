/**
 * P129 opt-in research adapter for the existing native owner cloud account.
 * Uses current auth, private Storage bucket, backup RPC, P128 photo verifier
 * and P126 atomic IndexedDB restore. No alternate wardrobe store or schema.
 */
import {packageOwnerCloudCutouts128,reopenOwnerCloudCutouts128} from '../two-owner-cloud-rls-recovery-128/owner-cloud-cutout-proof.mjs';
import {exportBackup01,readOwnerSnapshot01,restoreOwner01} from '../restore-atomic-01/atomic-restore.mjs';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA=/^[a-f0-9]{64}$/;
const fail=s=>{throw Error('P129 '+s);};
const clone=x=>structuredClone(x);
const photoURL=(path)=>'/storage/v1/object/closet-private/'+path.split('/').map(encodeURIComponent).join('/');
export function createSignedOwnerCloud129({auth,db,baseURL,anonKey,fetcher=globalThis.fetch,
 confirmRestore=async()=>false,onRestored=async()=>{},subtle=globalThis.crypto?.subtle}={}){
 if(!auth||!db||typeof fetcher!=='function'||typeof confirmRestore!=='function'||
  typeof onRestored!=='function'||typeof baseURL!=='string'||typeof anonKey!=='string'||!subtle?.digest)
  fail('existing native auth, database and cloud transport required');
 let busy=false,lifetime=null;
 function owner(){auth.assertCurrent?.();const id=auth.user?.id;if(!UUID.test(id||''))fail('active authenticated owner unavailable');return id;}
 async function begin(){const id=owner(),token=await auth.getAccessToken();if(typeof token!=='string'||token.length<20||owner()!==id)fail('owner session ended before cloud operation');const lease={id,token,active:true};lifetime=lease;return lease;}
 async function check(lease){if(!lease?.active||lifetime!==lease||owner()!==lease.id)fail('owner session revoked');const token=await auth.getAccessToken();if(!lease.active||lifetime!==lease||owner()!==lease.id||token!==lease.token)fail('owner token changed during cloud operation');}
 function checkSync(lease){if(!lease?.active||lifetime!==lease||owner()!==lease.id)fail('owner session revoked');}
 function lock(lease){if(busy)fail('another cloud recovery operation is active');busy=true;return()=>{busy=false;if(lifetime===lease)lease.active=false;};}
 async function request(lease,path,{method='GET',body,contentType='application/json'}={}){
  await check(lease);
  const response=await fetcher(baseURL+path,{method,cache:'no-store',headers:{apikey:anonKey,Authorization:'Bearer '+lease.token,...(body===undefined?{}:{'Content-Type':contentType})},
   ...(body===undefined?{}:{body:contentType==='application/json'?JSON.stringify(body):body})});
  await check(lease);if(!response.ok){const e=Error('P129 authenticated cloud request failed ('+response.status+')');e.status=response.status;throw e;}return response;
 }
 async function readRemote(lease){
  const r=await request(lease,'/rest/v1/closet_backups?owner_id=eq.'+encodeURIComponent(lease.id)+'&select=owner_id,revision,document'),rows=await r.json();await check(lease);
  if(!Array.isArray(rows)||rows.length>1)fail('invalid cloud revision response');if(!rows.length)return null;
  if(rows[0].owner_id!==lease.id||!Number.isSafeInteger(rows[0].revision)||rows[0].revision<1)fail('cloud backup owner or revision mismatch');return rows[0];
 }
 async function upload(lease,assets){
  for(const [path,bytes] of assets){
   await check(lease);const objectPath=path.startsWith('closet-photo:')?path.slice('closet-photo:'.length):'',parts=objectPath.split('/'),hash=parts[1]?.replace(/\.jpg$/,'');
   if(parts.length!==2||parts[0]!==lease.id||!SHA.test(hash||''))fail('foreign or malformed immutable photo path');
   const endpoint=photoURL(objectPath),response=await fetcher(baseURL+endpoint,{method:'POST',cache:'no-store',headers:{apikey:anonKey,Authorization:'Bearer '+lease.token,'Content-Type':'image/jpeg','x-upsert':'false'},body:bytes});
   await check(lease);if(response.ok)continue;if(response.status!==400&&response.status!==409)fail('private JPEG upload failed ('+response.status+')');
   const existing=await request(lease,endpoint),data=new Uint8Array(await existing.arrayBuffer());await check(lease);
   const actual=[...new Uint8Array(await subtle.digest('SHA-256',data))].map(x=>x.toString(16).padStart(2,'0')).join('');await check(lease);
   if(actual!==hash||data.length!==bytes.length)fail('existing private JPEG object failed integrity check');
  }
 }
 async function build(lease){
  checkSync(lease);const snapshot=await readOwnerSnapshot01(db,()=>checkSync(lease));await check(lease);
  const backup=exportBackup01({ownerId:lease.id,rows:snapshot.rows}),packed=await packageOwnerCloudCutouts128({backup,ownerId:lease.id,assertLease:()=>checkSync(lease),subtle});
  await check(lease);return {snapshot,packed};
 }
 async function backup({expectedRemoteRevision}={}){
  const lease=await begin(),unlock=lock(lease);
  try{
   const {packed}=await build(lease),remote=await readRemote(lease),current=remote?.revision||0;
   if(expectedRemoteRevision!==undefined&&expectedRemoteRevision!==current){const e=Error('P129 stale cloud revision; no overwrite performed');e.code='conflict';throw e;}
   await upload(lease,packed.assets);await check(lease);
   const r=await request(lease,'/rest/v1/rpc/save_closet_backup',{method:'POST',body:{p_expected_revision:current,p_document:packed.document}}),result=await r.json();await check(lease);
   const revision=Array.isArray(result)?result[0]:result;if(revision===null){const e=Error('P129 cloud revision compare-and-swap conflict');e.code='conflict';throw e;}
   if(!Number.isSafeInteger(revision)||revision<=current)fail('invalid saved cloud revision');
   return Object.freeze({saved:true,revision,photoObjects:packed.jpgObjectCount,ownerId:lease.id,originalAndCutoutSHA256:true,realSignedJWTClaimed:false,productionAuthorized:false,familyAlpha:'HOLD'});
  }finally{unlock();}
 }
 async function restore({expectedRemoteRevision}={}){
  const lease=await begin(),unlock=lock(lease);
  try{
   const remote=await readRemote(lease);if(!remote)fail('no owner cloud backup exists');
   if(expectedRemoteRevision!==undefined&&remote.revision!==expectedRemoteRevision){const e=Error('P129 stale cloud revision; refresh before restore');e.code='conflict';throw e;}
   const opened=await reopenOwnerCloudCutouts128({document:remote.document,ownerId:lease.id,assertLease:()=>checkSync(lease),subtle,
    fetchPrivateJPEG:async path=>{const objectPath=path.slice('closet-photo:'.length);if(!objectPath.startsWith(lease.id+'/'))fail('cross-owner private photo request denied');const r=await request(lease,photoURL(objectPath)),bytes=new Uint8Array(await r.arrayBuffer());await check(lease);return bytes;}});
   await check(lease);
   const approved=await confirmRestore(Object.freeze({ownerId:lease.id,revision:remote.revision,itemCount:opened.document.items.length,savedOutfitCount:opened.document.state['outfit-board']?.saved?.length||0,originalAndCutoutJPEGSHAValid:true}));
   await check(lease);if(approved!==true)return Object.freeze({restored:false,cancelled:true,ownerId:lease.id});
   const before=await readOwnerSnapshot01(db,()=>checkSync(lease));await check(lease);
   const backupDoc={format:'closet-current',version:4,ownerId:lease.id,items:clone(opened.document.items),state:clone(opened.document.state)};
   const result=await restoreOwner01({db,backup:backupDoc,ownerId:lease.id,expectedFingerprint:before.fingerprint,confirmed:true,assertLease:()=>checkSync(lease)});
   await check(lease);await onRestored();await check(lease);
   return Object.freeze({restored:true,atomic:result.atomic,revision:remote.revision,items:result.items,saved:result.saved,ownerId:lease.id,originalAndCutoutJPEGSHAValid:true,realSignedJWTClaimed:false,productionAuthorized:false,familyAlpha:'HOLD'});
  }finally{unlock();}
 }
 function revoke(){if(lifetime)lifetime.active=false;lifetime=null;}
 return Object.freeze({backup,restore,revoke,status:()=>Object.freeze({busy,ownerId:busy?lifetime?.id:null,researchOnly:true,realSignedJWTVerified:false,productionAuthorized:false,familyAlpha:'HOLD'})});
}
