/**
 * Closet Current MAIN #179 — isolated *hosted* two real Supabase Auth users,
 * private original + owner-reviewed cutout JPEG, RPC CAS and atomic-source
 * rehydration acceptance. NEVER run this on production or current staging.
 *
 * No requests until P169 validates disposable project ref, exact HTTPS origin,
 * public-only key, two test credentials and explicit consent. Runtime must
 * be manually invoked with a separately OWNER-APPROVED disposable project.
 *
 * Genuine hosted PASS only if actual HTTPS Supabase Auth /user verifies both
 * access tokens and real PostgREST/RPC and private Storage pass. CI's local
 * cryptographically signed RS256 HTTP double is NOT hosted acceptance.
 */
import {readFileSync} from 'node:fs';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import sharp from 'sharp';
import {validateHostedConfig169,decodeUntrustedJWTClaims169}
 from '../hosted-two-owner-cloud-169/hosted-acceptance.mjs';
import {validateRestore01} from '../restore-atomic-01/atomic-restore.mjs';
import {packageOwnerCloudCutouts128,reopenOwnerCloudCutouts128}
 from '../two-owner-cloud-rls-recovery-128/owner-cloud-cutout-proof.mjs';

export const ACCEPTANCE_179=Object.freeze({
 mode:'isolated-hosted-only-explicit-opt-in',
 testData:'licensed-public-original-and-reviewed-crop-only',
 forbiddenProjectRefs:Object.freeze(['hlkgymugtfbirlpunsra','fbnplztkbsteuzrmbgib']),
 requiresRealAuthIssuedTokens:true,requiresIssuerVerifiedAuthUser:true,
 requiresPrivateOriginalAndCutoutBytes:true,requiresRLSAndCAS:true,
 autoRunInCI:false,productionDeployed:false,familyAlpha:'HOLD'
});
const die=reason=>{throw Error('P179 hosted acceptance: '+reason);};
const SHA=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const data=b=>'data:image/jpeg;base64,'+Buffer.from(b).toString('base64');
// PostgreSQL JSONB normalizes object key order on real hosted HTTP responses.
const canonical=x=>Array.isArray(x)?x.map(canonical):
 x&&typeof x==='object'?Object.fromEntries(
  Object.keys(x).sort().map(key=>[key,canonical(x[key])])):x;
const jsonEqual=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const safe=(r,name,allowed)=>{if(!r||!allowed.includes(r.status))die(name+' response denied or wrong status');};
const readJSON=async(r,name)=>{try{return await r.json();}catch{die(name+' response invalid');}};
function readLockedSource(){
 const original=readFileSync('benchmark/fixtures/commons-0002.jpg');
 const locked=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
 const info=locked.find(x=>x.id==='commons-0002');
 if(!info?.verified||!info.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:')||
    hash(original)!==info.sha256)die('original independently locked Commons JPEG identity changed');
 return original;
}
async function sourcePair179(){
 const original=readLockedSource();
 const md=await sharp(original).metadata();
 if(md.format!=='jpeg'||!md.width||!md.height)die('locked original not JPEG');
 const cutout=await sharp(original).extract({left:0,top:0,
  width:Math.floor(md.width*.55),height:Math.floor(md.height*.65)})
  .jpeg({quality:88}).toBuffer();
 const originalHash=hash(original),cutoutHash=hash(cutout);
 if(!SHA.test(originalHash)||!SHA.test(cutoutHash)||originalHash===cutoutHash)
  die('original and independently reviewed crop must be different');
 return {original,cutout,originalHash,cutoutHash};
}
function reviewedBackup(owner,pair,nonce){
 const itemId='p179-source-'+nonce;
 const originalData=data(pair.original),cutoutData=data(pair.cutout);
 const record={
  id:itemId,ownerId:owner,
  image:originalData,originalPhoto:{image:originalData,sha256:pair.originalHash},
  sourceSHA256:pair.originalHash,sourceHashVerified:true,
  sourcePhotoOriginal:true,humanReviewedSource:true,singleGarmentVerified:false,
  outfitSourceId:'p179-isolated-licensed-public-fixture',
  cutoutSHA256:pair.cutoutHash,
  segmentHint:{verified:true,ownerReviewedInstance:true,clipped:false,
   originalSHA256:pair.originalHash,cutoutSHA256:pair.cutoutHash,
   cutoutImage:cutoutData},
  category:'Tops',itemType:'T-shirt',color:'Green',colorSource:'user',
  ownerReviewed:true,userAdjusted:true,confirmedCategory:true,confirmedColor:true,
  reviewProvenance:'explicit-owner-claim-not-independent-review-evidence',
  threeDReady:false
 };
 return {format:'closet-current',version:4,ownerId:owner,
  items:[record],state:{'outfit-board':{
    id:'outfit-board',current:{slots:{top:itemId}},
    saved:[{id:'p179-look-'+nonce,ownerId:owner,slots:{top:itemId}}]
  }}};
}
export async function prepareSource179(owner,nonce,pair){
 if(!pair)pair=await sourcePair179();
 if(!UUID.test(owner)||!UUID.test(nonce))die('owner and scenario identifiers must be UUIDs');
 const backup=reviewedBackup(owner,pair,nonce);
 const proof=await validateRestore01(backup,{ownerId:owner,mode:'file'});
 if(proof.reviewedCutoutJPEGsVerified!==1||proof.photoFieldsVerified<2)
  die('original and human-reviewed JPEG proof missing');
 const packed=await packageOwnerCloudCutouts128({
  backup,ownerId:owner,subtle:webcrypto.subtle,assertLease:()=>{}
 });
 if(packed.jpgObjectCount!==2||
    [...packed.assets.keys()].some(x=>!x.startsWith('closet-photo:'+owner+'/'))||
    JSON.stringify(packed.document).includes('data:image/jpeg;base64,'))
  die('two independent owner SHA JPEG assets are required');
 const item=packed.document.items[0];
 if(item?.image!=='closet-photo:'+owner+'/'+pair.originalHash+'.jpg'||
    item?.segmentHint?.cutoutImage!=='closet-photo:'+owner+'/'+pair.cutoutHash+'.jpg')
  die('original/cutout source paths do not match actual SHA');
 return Object.freeze({backup,packed,pair});
}
/** Signed users must come from the real Auth server; no locally supplied sub. */
export async function runHostedOriginalCutout179(config,{
 fetchImpl=globalThis.fetch,nonce=randomUUID(),onStep=()=>{}
}={}){
 const approved=validateHostedConfig169(config);
 if(typeof fetchImpl!=='function'||!UUID.test(nonce)||typeof onStep!=='function')
  die('valid explicitly approved hosted transport required');
 const base=approved.base,ref=approved.ref,key=config.publishableKey;
 const progress=[];
 const mark=step=>{progress.push(step);onStep(step);};
 const request=(token,path,{method='GET',payload,bytes,mime}={})=>{
  if(typeof path!=='string'||!path.startsWith('/')||path.startsWith('//')||
    !(/^\/auth\/v1\/(?:token\?grant_type=(?:password|refresh_token)|user|logout)$/.test(path)||
     /^\/rest\/v1\/(?:closet_backups\?|rpc\/save_closet_backup$)/.test(path)||
     /^\/storage\/v1\/object\/closet-private\/[a-f0-9-]{36}\/[a-f0-9]{64}\.jpg$/.test(path)))
   die('non-allowlisted hosted endpoint blocked');
  const headers={apikey:key,...(token?{Authorization:'Bearer '+token}:{}),
   ...(payload!==undefined?{'Content-Type':'application/json'}:{}),
   ...(mime?{'Content-Type':mime}:{})};
  return fetchImpl(base+path,{method,headers,redirect:'error',credentials:'omit',
   cache:'no-store',...(payload!==undefined?{body:JSON.stringify(payload)}:{}),
   ...(bytes!==undefined?{body:bytes}:{})});
 };
 const signIn=async credentials=>{
  const r=await request(null,'/auth/v1/token?grant_type=password',{
   method:'POST',payload:{email:credentials.email,password:credentials.password}
  });
  safe(r,'two-owner Supabase Auth login',[200]);
  const x=await readJSON(r,'Auth login');
  if(typeof x?.access_token!=='string'||typeof x.refresh_token!=='string'||!UUID.test(x.user?.id))
   die('signed-in Supabase account response invalid');
  const claims=decodeUntrustedJWTClaims169(x.access_token);
  if(claims.subject!==x.user.id||claims.issuer!==base+'/auth/v1')
   die('Auth-issued JWT subject/issuer mismatch');
  // Unlike merely decoding untrusted JWT claims, the Auth server must accept
  // the bearer token and return its own independently bound user identity.
  const verified=await request(x.access_token,'/auth/v1/user');
  safe(verified,'actual Supabase Auth bearer identity',[200]);
  const y=await readJSON(verified,'Auth user');
  if(y?.id!==x.user.id||y.id!==claims.subject)
   die('Auth server validated different owner than JWT claims');
  return {id:y.id,token:x.access_token,refresh:x.refresh_token};
 };
 let a=null,b=null;
 const call=(who,path,option)=>request(who?.token,path,option);
 const docPath=owner=>'/rest/v1/closet_backups?select=owner_id,revision,document&owner_id=eq.'+owner;
 const getRows=async(who,owner)=>{
  const r=await call(who,docPath(owner));
  if([401,403].includes(r.status))return [];
  safe(r,'owner-private PostgREST SELECT',[200]);
  const rows=await readJSON(r,'owner backup query');
  if(!Array.isArray(rows)||rows.length>1)die('invalid private backup response');
  return rows;
 };
 const objectURL=(owner,digest)=>'/storage/v1/object/closet-private/'+owner+'/'+digest+'.jpg';
 const logout=async who=>{if(!who?.token)return;try{await call(who,'/auth/v1/logout',{method:'POST'});}catch{}};
 try{
  a=await signIn(config.a);b=await signIn(config.b);
  if(a.id===b.id)die('two independent authenticated owners required');
  mark('two-auth-server-verified-distinct-jwt-owners');
  const [beforeA,beforeB]=await Promise.all([getRows(a,a.id),getRows(b,b.id)]);
  if(beforeA.length||beforeB.length)
   die('throwaway owners already hold cloud backups; no overwrite permitted');
  mark('both-disposable-owner-backups-empty-before-test');
  const pair=await sourcePair179();
  const [sourceA,sourceB]=await Promise.all([
   prepareSource179(a.id,nonce,pair),prepareSource179(b.id,nonce,pair)
  ]);
  mark('P126-P128-original-plus-cutout-independent-sha-provenance');
  const assetsOf=[{who:a,source:sourceA},{who:b,source:sourceB}];
  // Do not upload ANYTHING if local provenance or either owner failed first.
  for(const {who,source} of assetsOf){
   for(const [path,bytes] of source.packed.assets){
    const m=/^closet-photo:([a-f0-9-]{36})\/([a-f0-9]{64})\.jpg$/.exec(path);
    if(!m||m[1]!==who.id||hash(bytes)!==m[2])die('owner-private JPEG invalid');
    const r=await call(who,objectURL(who.id,m[2]),{
     method:'POST',mime:'image/jpeg',bytes
    });
    safe(r,'private original and cutout JPEG create-only upload',[200,201]);
   }
  }
  mark('four-owner-private-original-and-cutout-objects-uploaded');
  for(const {who,source} of assetsOf){
   const r=await call(who,'/rest/v1/rpc/save_closet_backup',{
    method:'POST',payload:{p_expected_revision:0,p_document:source.packed.document}
   });
   safe(r,'source-bound revision-one backup RPC',[200]);
   const rev=await readJSON(r,'backup revision');
   if(rev!==1)die('owner-private backup revision-one create failed');
  }
  mark('two-independent-owner-backups-authenticated-cas');
  const [ownA,ownB,wrongA,wrongB]=await Promise.all([
   getRows(a,a.id),getRows(b,b.id),getRows(a,b.id),getRows(b,a.id)
  ]);
  if(ownA.length!==1||ownB.length!==1||wrongA.length||wrongB.length||
     ownA[0].owner_id!==a.id||ownB[0].owner_id!==b.id||
     ownA[0].revision!==1||ownB[0].revision!==1||
     !jsonEqual(ownA[0].document,sourceA.packed.document)||
     !jsonEqual(ownB[0].document,sourceB.packed.document))
   die('private document owner, JPEG, revision or RLS mismatch');
  mark('two-owner-private-metadata-visible-only-to-own-JWT');
  for(const {who,source} of assetsOf){
   const opened=await reopenOwnerCloudCutouts128({
    ownerId:who.id,document:source.packed.document,
    assertLease:()=>{},subtle:webcrypto.subtle,
    fetchPrivateJPEG:async path=>{
     const m=/^closet-photo:([a-f0-9-]{36})\/([a-f0-9]{64})\.jpg$/.exec(path);
     if(!m||m[1]!==who.id)die('foreign source path before any private fetch');
     const r=await call(who,objectURL(who.id,m[2]));
     safe(r,'private original and cutout JPEG GET',[200]);
     return new Uint8Array(await r.arrayBuffer());
    }
   });
   if(opened.verifiedObjectCount!==2||!opened.originalAndCutoutJPEGSHAValid||
      !jsonEqual(opened.document.items,source.backup.items)||
      !jsonEqual(opened.document.state,source.backup.state))
    die('verified source JPEG, reviewed cutout or saved outfit roundtrip failed');
  }
  mark('four-private-JPEG-source-and-saved-outfit-atomic-readback-verified');
  for(const [who,other] of [[a,b],[b,a]]){
   for(const digest of [pair.originalHash,pair.cutoutHash]){
    const r=await call(who,objectURL(other.id,digest));
    if(![401,403,404].includes(r.status))
     die('foreign-owner original or cutout JPEG exposed');
   }
   const attempt=await call(who,objectURL(other.id,pair.originalHash),{
    method:'POST',mime:'image/jpeg',bytes:pair.original
   });
   if(![401,403,404].includes(attempt.status))
    die('cross-owner Storage original/cutout upload permitted');
  }
  mark('cross-owner-original-and-cutout-read-write-denied');
  const stale=await call(a,'/rest/v1/rpc/save_closet_backup',{
   method:'POST',payload:{p_expected_revision:0,p_document:sourceA.packed.document}
  });
  safe(stale,'stale owner A cloud CAS',[200]);
  if(await readJSON(stale,'stale conflict')!==null)
   die('stale cloud write overwrite permitted');
  const ownStill=await getRows(b,b.id);
  if(!jsonEqual(ownStill[0]?.document,sourceB.packed.document))
   die('stale owner A write modified owner B');
  mark('stale-revision-denied-both-owner-data-preserved');
  const anon=await request(null,docPath(a.id));
  if(anon.status===200){
   const rows=await readJSON(anon,'anonymous backup');
   if(!Array.isArray(rows)||rows.length)die('anonymous private metadata leaked');
  }else if(![401,403].includes(anon.status))die('anonymous backup response unexpected');
  mark('anonymous-private-backup-not-exposed');
  const signout=await call(a,'/auth/v1/logout',{method:'POST'});
  safe(signout,'real Auth signout',[200,204]);
  const refreshed=await request(null,'/auth/v1/token?grant_type=refresh_token',{
   method:'POST',payload:{refresh_token:a.refresh}
  });
  if(![400,401,403].includes(refreshed.status))
   die('revoked refresh token unexpectedly still works');
  mark('auth-refresh-token-revoked-access-JWT-may-live-to-exp');
  return Object.freeze({priority:179,verdict:'HOSTED_PASS',
   actualHostedAuthIssuerVerified:true,hostedSignedOwnerJWT:true,
   realPostgrestAndPrivateStorageVerified:true,
   ownerSourceAndCropJPEGs:4,distinctOwners:2,
   checks:Object.freeze(progress),originalSHA256:pair.originalHash,
   reviewedCutoutSHA256:pair.cutoutHash,isolatedProjectRef:ref,
   personalPhotosUsed:false,realPhysicalPhoneTested:false,
   productionAndExistingStagingUntouched:true,releaseAuthorized:false,
   familyAlpha:'HOLD'});
 }finally{await logout(a);await logout(b);}
}
