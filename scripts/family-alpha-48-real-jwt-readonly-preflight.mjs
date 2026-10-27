/**
 * Family Alpha #48: staging-only signed-in, READ-ONLY Auth/RLS preflight.
 *
 * This is intentionally NOT a user/account creator, wardrobe writer, photo
 * downloader, signup probe, deployment check or release approval.
 * With --live, accepts two pre-existing adult-authorized staging JWTs ONLY
 * via env, checks both with Supabase Auth /user, then reads ONLY backup owner
 * IDs and private bucket object listing metadata. Never prints IDs/tokens,
 * object names or HTTP bodies. Run locally, not in public GitHub Actions.
 */
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

export const STAGE_BASE='https://fbnplztkbsteuzrmbgib.supabase.co';
export const STAGE_REF='fbnplztkbsteuzrmbgib';
export const PRODUCTION_REF='hlkgymugtfbirlpunsra';
export const BUCKET='closet-private';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedKey=/^sb_publishable_[A-Za-z0-9_-]{15,}$/;
const TOKEN_MIN=60;

export const safeSummary=(checks,reason='')=>Object.freeze({
 decision:'HOLD',
 status:reason||checks?.status||'NOT_EXECUTED',
 signedInDistinctAdultSessions:checks?.signedInDistinctAdultSessions===true,
 crossOwnerBackupReadsDenied:checks?.crossOwnerBackupReadsDenied===true,
 crossOwnerPhotoListDenied:checks?.crossOwnerPhotoListDenied===true,
 twoOwnerBackupPositiveControls:checks?.twoOwnerBackupPositiveControls===true,
 twoOwnerPhotoPositiveControls:checks?.twoOwnerPhotoPositiveControls===true,
 signedInOwnerWritesTested:false, authenticatedPhotoDownloadTested:false,
 physicalDevicesTested:false, fourFamilyJwtSessionsTested:false,
 productionModified:false, stagingModified:false, deploymentAuthorized:false
});

export function assertLiveInputs({key,tokenA,tokenB}={}){
 if(!allowedKey.test(key||''))throw Error('Missing staging publishable key, or unsupported privileged key');
 if(typeof tokenA!=='string'||typeof tokenB!=='string'||
  tokenA.length<TOKEN_MIN||tokenB.length<TOKEN_MIN||tokenA===tokenB||
  /[\s]/.test(tokenA)||/[\s]/.test(tokenB))
  throw Error('Exactly two distinct, nonempty existing staging access tokens are required');
 return true;
}

export function makeStageReadOnlyClient({key,fetchImpl=fetch}){
 if(!allowedKey.test(key||''))throw Error('Staging publishable key required');
 if(typeof fetchImpl!=='function')throw Error('Explicit fetch implementation required');
 const origin=new URL(STAGE_BASE).origin;
 return async function request({path,token,method='GET',body}){
  if(typeof token!=='string'||token.length<TOKEN_MIN)throw Error('Missing pre-existing user access token');
  const url=new URL(path,STAGE_BASE);
  if(url.origin!==origin||url.hostname!==STAGE_REF+'.supabase.co'||
      url.username||url.password||url.hash)
   throw Error('Non-staging request refused');
  const ownUser=url.pathname==='/auth/v1/user' && url.search==='' && method==='GET' && body===undefined;
  const backup=url.pathname==='/rest/v1/closet_backups' && method==='GET' &&
   url.searchParams.get('select')==='owner_id' &&
   url.searchParams.get('limit')==='2' &&
   [...url.searchParams.keys()].every(x=>['select','limit','owner_id'].includes(x))&&
   (!url.searchParams.has('owner_id')||/^eq\.[0-9a-f-]{36}$/i.test(url.searchParams.get('owner_id'))) &&
   body===undefined;
  const list=url.pathname==='/storage/v1/object/list/'+BUCKET &&
   url.search===''&&method==='POST'&&
   body&&typeof body==='object'&&Object.keys(body).sort().join(',')==='limit,offset,prefix'&&
   body.limit===50&&body.offset===0&&
   typeof body.prefix==='string'&&uuid.test(body.prefix.slice(0,-1))&&
   body.prefix.endsWith('/');
  if(!ownUser&&!backup&&!list)throw Error('Only staging Auth identity, backup owner metadata, and photo object listings are permitted');
  let response;
  try{
   response=await fetchImpl(url.href,{
    method,redirect:'error',cache:'no-store',
    signal:AbortSignal.timeout(15000),
    headers:{
     apikey:key,Authorization:'Bearer '+token,
     ...(list?{'Content-Type':'application/json'}:{})
    },
    ...(list?{body:JSON.stringify(body)}:{})
   });
  }catch{throw Error('Staging-only read request failed (network/redirect/timeout)');}
  if(!response?.ok)throw Error('Staging read request rejected (HTTP '+(Number(response?.status)||0)+')');
  try{return await response.json();}
  catch{throw Error('Staging metadata response was not valid JSON');}
 };
}

function strictRows(rows,label,max){
 if(!Array.isArray(rows)||rows.length>max||rows.some(x=>!x||typeof x!=='object'||Array.isArray(x)))
  throw Error('Invalid '+label+' response structure');
 return rows;
}
export async function runStageTwoOwnerReadOnly({key,tokenA,tokenB,fetchImpl=fetch}={}){
 assertLiveInputs({key,tokenA,tokenB});
 const api=makeStageReadOnlyClient({key,fetchImpl});
 // User identities come from server-authenticated /auth/v1/user, never JWT payload guesses.
 const [a,b]=await Promise.all([
  api({path:'/auth/v1/user',token:tokenA}),
  api({path:'/auth/v1/user',token:tokenB})
 ]);
 if(!uuid.test(a?.id||'')||!uuid.test(b?.id||'')||a.id===b.id)
  throw Error('Auth did not verify two different existing staging user identities');
 const actors=[{id:a.id,token:tokenA},{id:b.id,token:tokenB}];
 const positiveBackups=[],positivePhotos=[],crossBackup=[],crossPhotos=[];
 for(let i=0;i<2;i++){
  const me=actors[i],other=actors[1-i];
  // Select owner_id only: no garment records or backup documents.
  const meRows=strictRows(await api({
   path:'/rest/v1/closet_backups?select=owner_id&limit=2&owner_id=eq.'+me.id,token:me.token
  }),'own backup',2);
  if(meRows.some(x=>x.owner_id!==me.id)||meRows.length>1)
   throw Error('Unexpected own-backup ownership metadata');
  positiveBackups.push(meRows.length===1);
  const otherRows=strictRows(await api({
   path:'/rest/v1/closet_backups?select=owner_id&limit=2&owner_id=eq.'+other.id,token:me.token
  }),'cross-owner backup',2);
  crossBackup.push(otherRows.length===0);
  // This Storage endpoint lists object names only; it NEVER downloads photographs.
  // Paths are kept in process memory and are NEVER logged.
  const mine=strictRows(await api({path:'/storage/v1/object/list/'+BUCKET,token:me.token,method:'POST',
   body:{prefix:me.id+'/',limit:50,offset:0}}),'own photo listing',50);
  const foreign=strictRows(await api({path:'/storage/v1/object/list/'+BUCKET,token:me.token,method:'POST',
   body:{prefix:other.id+'/',limit:50,offset:0}}),'cross-owner photo listing',50);
  // A full page cannot prove all photos were observed.
  if(mine.length>=50||foreign.length>=50)throw Error('Photo listing pagination required; aborting non-exhaustive check');
  positivePhotos.push(mine.length>0);
  crossPhotos.push(foreign.length===0);
 }
 const checks={
  signedInDistinctAdultSessions:true,
  crossOwnerBackupReadsDenied:crossBackup.every(Boolean),
  crossOwnerPhotoListDenied:crossPhotos.every(Boolean),
  twoOwnerBackupPositiveControls:positiveBackups.every(Boolean),
  twoOwnerPhotoPositiveControls:positivePhotos.every(Boolean)
 };
 checks.status=checks.crossOwnerBackupReadsDenied&&checks.crossOwnerPhotoListDenied&&
  checks.twoOwnerBackupPositiveControls&&checks.twoOwnerPhotoPositiveControls?
  'PASS_LIVE_READONLY_TWO_OWNER_ACCESS':
  checks.crossOwnerBackupReadsDenied&&checks.crossOwnerPhotoListDenied?
  'INCOMPLETE_POSITIVE_CONTROLS':'FAIL_CROSS_OWNER_VISIBILITY';
 // Release remains HOLD even if two live adult positive and negative controls pass.
 return safeSummary(checks);
}
const invoked=process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href;
if(invoked){
 if(process.argv.length!==3||process.argv[2]!=='--live'||
    process.env.CC_STAGE_APPROVED_READONLY!=='YES'){
  console.log(JSON.stringify(safeSummary(null,'NOT_EXECUTED_NEEDS_EXPLICIT_LOCAL_LIVE_OPTIN')));
 }else{
  try{
   const result=await runStageTwoOwnerReadOnly({
    key:process.env.CC_STAGE_PUBLISHABLE_KEY,
    tokenA:process.env.CC_STAGE_JWT_A,
    tokenB:process.env.CC_STAGE_JWT_B
   });
   console.log(JSON.stringify(result,null,2));
   if(result.status!=='PASS_LIVE_READONLY_TWO_OWNER_ACCESS')process.exitCode=1;
  }catch{
   // No thrown raw Auth/HTTP data, response bodies, tokens or private identifiers.
   console.error(JSON.stringify(safeSummary(null,'INCONCLUSIVE_SAFE_ABORT')));
   process.exitCode=1;
  }
 }
}
