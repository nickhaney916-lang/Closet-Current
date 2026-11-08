/**
 * Closet Current P178 — opt-in integration of P177's actual native
 * ClosetBackupEngine.mapImages into P146's REAL account-menu owner-reviewed
 * backup / restore decisions (which in turn call P134/P137/P129/P128/P126).
 *
 * No production cloud mutation: only explicit P145/P146/P178 flags on HTTP
 * loopback, synthetic owner token and already paused automatic legacy writer.
 * The production and current staging origins are never addressable.
 *
 * P177 preflight is independent of the P128 photo packager:
 *  pre-backup dry-run proves ORIGINAL and CUTOUT source SHA before uploads;
 *  post-backup independently checks the P129-written private cloud manifest,
 *  two JPEG objects, exact source and owner metadata;
 *  pre-restore validates every remote private owner path BEFORE a GET and
 *  rehashes both originals/cutouts BEFORE showing destructive consent.
 */
import {readOwnerSnapshot01,exportBackup01,validateRestore01}
 from '../restore-atomic-01/atomic-restore.mjs';
import {installNativeCloudCutout177}
 from '../native-private-cloud-cutout-177/cloud-transport.mjs';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[0-9a-f]{12}$/i;
const SHA=/^[a-f0-9]{64}$/;
const MARK=/^closet-photo:([a-f0-9-]{36})\/([a-f0-9]{64})\.jpg$/;
const BASE64=/^data:image\/jpeg;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const reject=x=>{throw Error('P178 '+x);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const host=new Set(['127.0.0.1','localhost','[::1]']);
const bytesOf=data=>{
 if(typeof data!=='string'||!BASE64.test(data))reject('original JPEG source invalid');
 const raw=atob(data.slice('data:image/jpeg;base64,'.length));
 const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
 if(bytes.length<4||bytes.length>8_388_608||bytes[0]!==255||bytes[1]!==216||
    bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)
  reject('original JPEG marker or size invalid');
 return bytes;
};
const encoded=raw=>{
 let value='';
 for(let i=0;i<raw.length;i+=16_384)value+=String.fromCharCode(...raw.subarray(i,i+16_384));
 return 'data:image/jpeg;base64,'+btoa(value);
};
const hex=raw=>[...raw].map(v=>v.toString(16).padStart(2,'0')).join('');
async function hash(raw,subtle){return hex(new Uint8Array(await subtle.digest('SHA-256',raw)));}
export function researchMode178(loc=globalThis.location){
 if(!loc||loc.protocol!=='http:'||!host.has(loc.hostname))return false;
 const p=new URLSearchParams(loc.search);
 return p.get('ownerReview145')==='research'&&
  p.get('ownerReview146')==='research'&&p.get('ownerCutout178')==='research';
}
export function createOwnerReviewedCloudTransport178({
 auth,db,engine,loc=globalThis.location,fetcher=globalThis.fetch,
 subtle=globalThis.crypto?.subtle,legacy
}={}){
 if(!researchMode178(loc))reject('isolated three-flag loopback owner UI required');
 if(legacy?.ownerReviewHold145?.()!==true)
  reject('legacy default auto cloud must be paused');
 if(!engine?.mapImages||!engine?.validateDocument||!subtle?.digest||
    !auth?.assertCurrent||typeof auth.getAccessToken!=='function'||
    !UUID.test(auth.user?.id||'')||
    db?.name!=='closet-current-user-'+auth.user.id||
    typeof fetcher!=='function')
  reject('real native cloud engine, private owner and review session required');
 const owner=auth.user.id;
 let closed=false,operations=0,localVerified=0,remoteVerified=0;
 function guard(){
  if(closed)reject('transport revoked');
  auth.assertCurrent();
  if(auth.user?.id!==owner||db?.name!=='closet-current-user-'+owner)
   reject('private owner session changed');
 }
 async function begin(){
  guard();
  const token=await auth.getAccessToken();guard();
  if(typeof token!=='string'||!token.startsWith('p146-synthetic-local-only-')||
     token.length<35)reject('real hosted or unrecognized token refused');
  return Object.freeze({token,owner});
 }
 async function check(lease){
  guard();
  const next=await auth.getAccessToken();guard();
  if(next!==lease.token)reject('owner access token rotated during source verification');
 }
 const source=installNativeCloudCutout177({
  engine,ownerId:owner,currentOwner:()=>auth.user.id,
  assertLease:guard,cryptoProvider:{subtle}
 });
 const network=async(lease,path)=>{
  await check(lease);
  if(typeof path!=='string'||path.startsWith('//')||
     !(/^\/rest\/v1\/closet_backups\?/.test(path)||
       /^\/storage\/v1\/object\/closet-private\/[a-f0-9-]{36}\/[a-f0-9]{64}\.jpg$/.test(path)))
   reject('invalid local private cloud endpoint');
  const response=await fetcher(loc.origin+path,{
   method:'GET',redirect:'error',cache:'no-store',credentials:'omit',
   headers:{apikey:'p146-synthetic-local-only',Authorization:'Bearer '+lease.token}
  });
  await check(lease);
  if(!response?.ok)reject('owner-private cloud read denied');
  return response;
 };
 async function local(){
  const lease=await begin();
  const snap=await readOwnerSnapshot01(db,guard);
  await check(lease);
  const v4=exportBackup01({ownerId:owner,rows:snap.rows});
  await validateRestore01(v4,{ownerId:owner,mode:'file'});
  await check(lease);
  const input={schemaVersion:1,ownerId:owner,items:v4.items,state:v4.state};
  const originals=new Map();
  const doc=await engine.mapImages(input,async image=>{
   guard();
   const raw=bytesOf(image),digest=await hash(raw,subtle);
   guard();
   const path='closet-photo:'+owner+'/'+digest+'.jpg';
   if(originals.has(path)&&!same([...raw],[...originals.get(path)]))
    reject('SHA duplicate source collision');
   originals.set(path,new Uint8Array(raw));
   return path;
  });
  await check(lease);
  if(originals.size<2)reject('independent original and owner-reviewed cutout missing');
  if(JSON.stringify(doc).includes('data:image/jpeg;base64,'))
   reject('inline original or cutout cloud photo');
  localVerified++;
  return Object.freeze({owner,lease,document:doc,originalDocument:input,assets:originals,
   fingerprint:snap.fingerprint,objectCount:originals.size,
   verified:true,shippingReleaseAuthorized:false,familyAlpha:'HOLD'});
 }
 async function remote(expected=null){
  const lease=await begin();
  const response=await network(lease,'/rest/v1/closet_backups?owner_id=eq.'+owner+
   '&select=owner_id,revision,document');
  const rows=await response.json();await check(lease);
  if(!Array.isArray(rows)||rows.length!==1||
     rows[0]?.owner_id!==owner||!Number.isSafeInteger(rows[0].revision)||
     rows[0].revision<1||!rows[0].document)
   reject('remote owner cloud backup invalid');
  const row=rows[0];
  if(expected?.revision!==undefined&&row.revision!==expected.revision)
   reject('changed private cloud revision');
  // P177 synchronously preflights ALL owner-photo paths before first GET.
  const sources=new Map();
  const doc=await engine.mapImages(row.document,async path=>{
   const found=MARK.exec(path);
   if(!found||found[1]!==owner||!SHA.test(found[2]))
    reject('foreign owner photo or cutout path');
   const response=await network(lease,'/storage/v1/object/closet-private/'+
    owner+'/'+found[2]+'.jpg');
   const bytes=new Uint8Array(await response.arrayBuffer());
   await check(lease);
   if(await hash(bytes,subtle)!==found[2])reject('original or cutout JPEG SHA changed');
   await check(lease);
   sources.set(path,bytes);
   return encoded(bytes);
  });
  await check(lease);
  const proof=await validateRestore01(doc,{ownerId:owner,mode:'cloud'});
  await check(lease);
  if(proof.reviewedCutoutJPEGsVerified<1||sources.size<2)
   reject('private reviewed cutout not independently restored');
  if(expected?.document&&!same(doc,expected.document))
   reject('owner source or clothing metadata differs after backup');
  remoteVerified++;
  return Object.freeze({owner,revision:row.revision,originalJPEGShaAndCutoutVerified:true,
   reviewedCutouts:proof.reviewedCutoutJPEGsVerified,
   independentJPEGObjects:sources.size,sourceRestored:true,
   realSignedJwtVerified:false,shippingReleaseAuthorized:false,familyAlpha:'HOLD'});
 }
 return Object.freeze({
  local,remote,revoke(){closed=true;source.revoke();},
  status(){guard();return Object.freeze({
   owner,localVerified,remoteVerified,
   actualNativeEngineGuard:source.state().active,
   originalAndCutoutPreserved:true,isolatedOwnerUI:true,
   realSignedJwtVerified:false,shippingReleaseAuthorized:false,familyAlpha:'HOLD'
  });}
 });
}
