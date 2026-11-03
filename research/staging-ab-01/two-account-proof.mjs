/**
 * STAGING-AB-01: real Supabase REST + Storage RLS black-box test, READ ONLY.
 *
 * This code never uses service_role, elevated SQL, owner impersonation, RPC
 * writes, auth.admin, DELETE, PATCH, PUT or storage uploads. It requires two
 * independently server-verified staging login sessions and one preexisting
 * account-owned backup + one preexisting JPEG fixture for EACH account.
 *
 * A role/owner-only policy catalog and zero-row synthetic SQL role probe are
 * NOT accepted as substitutes for these genuine signed-token conditions.
 * Do not import or ship this script in the production application.
 */
export const STAGING_AB_01=Object.freeze({
 origin:'https://fbnplztkbsteuzrmbgib.supabase.co',
 environment:'Closet Current Staging ONLY',accountFixturesRequired:2,
 realSignedUsersRequired:2,readOnly:true,neverLogSecrets:true,
 realUserRowsExposed:false,sourcePhotosNeverReadIntoMemory:true,
 excludesProduction:true,liveProofWithoutCredentials:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const safe=(s,n)=>typeof s==='string'&&s.length>0&&s.length<=n&&
 !/[\u0000-\u001f]/.test(s);
export class StagingProofBlocked extends Error{
 constructor(code){super('STAGING-AB-01 blocked: '+code);this.name='StagingProofBlocked';this.code=code;}
}
export class StagingProofFailed extends Error{
 constructor(code){super('STAGING-AB-01 security acceptance failed: '+code);this.name='StagingProofFailed';this.code=code;}
}
function verifiedPublicKey(key){
 if(!safe(key,5000)||/service.role|sb_secret_/i.test(key))return false;
 if(key.startsWith('sb_publishable_'))return true;
 // A legacy JWT anon key may be supplied to staging, but an admin JWT,
 // including a service_role key passed under a misleading env name, cannot.
 const parts=key.split('.');
 if(parts.length!==3||parts.some(x=>!x))return false;
 try{return JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8')).role==='anon';}
 catch{return false;}
}
function requireConfig(config){
 if(!config||config.origin!==STAGING_AB_01.origin)
  throw new StagingProofBlocked('STAGING_ORIGIN_PIN_REQUIRED');
 if(!verifiedPublicKey(config.publicKey))
  throw new StagingProofBlocked('STAGING_PUBLIC_KEY_REQUIRED');
 const accounts=[config.a,config.b];
 for(const [i,account] of accounts.entries()){
  if(!account||!safe(account.email,300)||!safe(account.password,300)||
   !safe(account.photoPath,600))
   throw new StagingProofBlocked(i===0?'A_FIXTURES_OR_CREDENTIALS_MISSING':'B_FIXTURES_OR_CREDENTIALS_MISSING');
  if(!/\.jpe?g$/i.test(account.photoPath)||account.photoPath.includes('..')||
    account.photoPath.includes('?')||account.photoPath.includes('#')||
    account.photoPath.includes('\\')||account.photoPath.startsWith('/')||
    account.photoPath.includes('//'))
   throw new StagingProofBlocked('UNSAFE_STAGING_TEST_PHOTO_PATH');
 }
 if(accounts[0].email.toLowerCase()===accounts[1].email.toLowerCase()||
  accounts[0].photoPath===accounts[1].photoPath)
  throw new StagingProofBlocked('INDEPENDENT_ACCOUNTS_AND_PHOTOS_REQUIRED');
}
function endpoint(path){
 if(typeof path!=='string'||!path.startsWith('/'))throw new StagingProofBlocked('INVALID_TEST_ROUTE');
 const u=new URL(path,STAGING_AB_01.origin);
 if(u.origin!==STAGING_AB_01.origin||!u.pathname.startsWith('/'))
  throw new StagingProofBlocked('OFF_STAGING_ROUTE_REFUSED');
 return u.href;
}
function apiHeaders(config,token=null,extra={}){
 return {'apikey':config.publicKey,
  ...(token?{Authorization:'Bearer '+token}:{}),...extra};
}
async function doFetch(config,fetchImpl,path,{method='GET',token=null,body=null,headers={}}={}){
 if(!['GET','POST'].includes(method))throw new StagingProofBlocked('READ_ONLY_METHODS_ONLY');
 const u=endpoint(path);
 const opts={method,headers:apiHeaders(config,token,headers),
  redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000)};
 if(body!==null){opts.body=JSON.stringify(body);opts.headers['content-type']='application/json';}
 let res;
 try{res=await fetchImpl(u,opts);}
 catch{throw new StagingProofBlocked('STAGING_NETWORK_OR_TLS_UNAVAILABLE');}
 if(!res||!Number.isInteger(res.status)||typeof res.json!=='function')
  throw new StagingProofBlocked('INVALID_STAGING_HTTP_RESPONSE');
 return res;
}
async function jsonLimited(res,code){
 // No customer document, payload or image bytes may be logged. Backup select
 // explicitly allows only owner_id and revision and limits returned rows.
 const contentLength=Number(res.headers?.get?.('content-length')||0);
 if(contentLength>64000)throw new StagingProofBlocked(code+'_RESPONSE_TOO_LARGE');
 let value;
 try{value=await res.json();}catch{throw new StagingProofBlocked(code+'_NON_JSON');}
 if(JSON.stringify(value).length>64000)throw new StagingProofBlocked(code+'_RESPONSE_TOO_LARGE');
 return value;
}
async function signIn(config,fetchImpl,account){
 const res=await doFetch(config,fetchImpl,'/auth/v1/token?grant_type=password',
  {method:'POST',body:{email:account.email,password:account.password}});
 if(res.status!==200)throw new StagingProofBlocked('APPROVED_STAGING_TEST_LOGIN_UNAVAILABLE');
 const login=await jsonLimited(res,'AUTH');
 if(!safe(login.access_token,20000))
  throw new StagingProofBlocked('MISSING_SIGNED_STAGING_SESSION');
 const userRes=await doFetch(config,fetchImpl,'/auth/v1/user',{token:login.access_token});
 if(userRes.status!==200)throw new StagingProofBlocked('SERVER_CANNOT_VERIFY_SESSION');
 const user=await jsonLimited(userRes,'VERIFIED_USER');
 if(!uuid.test(user.id||'')||!safe(user.email,300)||
  user.email.toLowerCase()!==account.email.toLowerCase())
  throw new StagingProofBlocked('STAGING_SESSION_OWNER_UNVERIFIED');
 // IDs and session material never leave the closures in returned evidence.
 return {id:user.id,token:login.access_token};
}
async function selectBackup(config,fetchImpl,owner,filter=null){
 const query='/rest/v1/closet_backups?select=owner_id,revision&limit=10'+
  (filter?'&owner_id=eq.'+encodeURIComponent(filter):'');
 const res=await doFetch(config,fetchImpl,query,{token:owner?.token||null,
  headers:{Accept:'application/json'}});
 if(!owner&&[401,403].includes(res.status))return {denied:true,rows:[]};
 if(res.status!==200)throw new StagingProofBlocked('BACKUP_DATA_API_UNAVAILABLE');
 const rows=await jsonLimited(res,'BACKUP');
 if(!Array.isArray(rows))throw new StagingProofFailed('BACKUP_NOT_AN_ARRAY');
 for(const row of rows){
  if(!row||!uuid.test(row.owner_id||'')||!Number.isSafeInteger(row.revision))
   throw new StagingProofFailed('BACKUP_RESPONSE_UNEXPECTED_SHAPE');
 }
 return {denied:false,rows};
}
const encodeObjectPath=path=>path.split('/').map(encodeURIComponent).join('/');
async function storageGet(config,fetchImpl,auth,path){
 const u='/storage/v1/object/authenticated/closet-private/'+encodeObjectPath(path);
 const res=await doFetch(config,fetchImpl,u,{token:auth?.token||null});
 // The HTTP body is NEVER read or persisted. Even an unexpected cross-owner
 // HTTP 200 is treated as a failure before any image bytes are consumed.
 try{res.body?.cancel?.();}catch{}
 return res.status;
}
async function listStorage(config,fetchImpl,auth,prefix){
 const res=await doFetch(config,fetchImpl,'/storage/v1/object/list/closet-private',
  {token:auth?.token||null,method:'POST',body:{prefix,limit:100}});
 if(!auth&&[401,403].includes(res.status))return {denied:true,rows:[]};
 if(res.status!==200)throw new StagingProofBlocked('STORAGE_LIST_API_UNAVAILABLE');
 const rows=await jsonLimited(res,'STORAGE_LIST');
 if(!Array.isArray(rows))throw new StagingProofFailed('STORAGE_LIST_NOT_AN_ARRAY');
 return {denied:false,rows};
}
function must(x,code){if(!x)throw new StagingProofFailed(code);}
function ownOnly(rows,id,code){
 must(rows.every(row=>row.owner_id===id),code);
 return rows.length>0;
}
const deny=[400,401,403,404];
export async function runStagingAB01({config,fetchImpl=globalThis.fetch}={}){
 requireConfig(config);
 if(typeof fetchImpl!=='function')
  throw new StagingProofBlocked('NO_HTTP_CLIENT');
 const first=await signIn(config,fetchImpl,config.a);
 const second=await signIn(config,fetchImpl,config.b);
 if(first.id===second.id)
  throw new StagingProofFailed('SAME_SIGNED_USER_FOR_BOTH_CREDENTIALS');
 const [a,b]=[first,second];
 if(!config.a.photoPath.startsWith(a.id+'/')||
    !config.b.photoPath.startsWith(b.id+'/'))
  throw new StagingProofBlocked('PRESEEDED_STAGING_PHOTO_PATH_OWNER_MISMATCH');
 const details=[];
 const pass=(name)=>details.push(name);
 const aOwn=await selectBackup(config,fetchImpl,a);
 const bOwn=await selectBackup(config,fetchImpl,b);
 if(!ownOnly(aOwn.rows,a.id,'OWNER_A_BACKUP_LEAK'))
  throw new StagingProofBlocked('OWNER_A_BACKUP_FIXTURE_NOT_FOUND');
 if(!ownOnly(bOwn.rows,b.id,'OWNER_B_BACKUP_LEAK'))
  throw new StagingProofBlocked('OWNER_B_BACKUP_FIXTURE_NOT_FOUND');
 pass('A_AND_B_OWN_BACKUP_VISIBLE');
 const aCross=await selectBackup(config,fetchImpl,a,b.id);
 const bCross=await selectBackup(config,fetchImpl,b,a.id);
 must(aCross.rows.length===0,'A_READS_B_BACKUP');
 must(bCross.rows.length===0,'B_READS_A_BACKUP');
 pass('A_AND_B_CROSS_BACKUP_DENIED');
 const anon=await selectBackup(config,fetchImpl,null);
 must(anon.denied||anon.rows.length===0,'ANON_READS_BACKUP');
 pass('ANON_BACKUP_DENIED');
 const aOwnImage=await storageGet(config,fetchImpl,a,config.a.photoPath);
 const bOwnImage=await storageGet(config,fetchImpl,b,config.b.photoPath);
 if(![200,206].includes(aOwnImage)||![200,206].includes(bOwnImage))
  throw new StagingProofBlocked('APPROVED_PRIVATE_PHOTO_FIXTURE_UNAVAILABLE');
 pass('A_AND_B_OWN_EXISTING_PRIVATE_JPEG_VISIBLE');
 const aCrossImage=await storageGet(config,fetchImpl,a,config.b.photoPath);
 const bCrossImage=await storageGet(config,fetchImpl,b,config.a.photoPath);
 must(deny.includes(aCrossImage),'A_READS_B_PRIVATE_PHOTO');
 must(deny.includes(bCrossImage),'B_READS_A_PRIVATE_PHOTO');
 pass('A_AND_B_CROSS_PRIVATE_JPEG_DENIED');
 const anonA=await storageGet(config,fetchImpl,null,config.a.photoPath);
 const anonB=await storageGet(config,fetchImpl,null,config.b.photoPath);
 must(deny.includes(anonA)&&deny.includes(anonB),'ANON_READS_PRIVATE_JPEG');
 pass('ANON_PRIVATE_JPEG_DENIED');
 const aCrossList=await listStorage(config,fetchImpl,a,b.id+'/');
 const bCrossList=await listStorage(config,fetchImpl,b,a.id+'/');
 must(aCrossList.rows.length===0,'A_LISTS_B_PRIVATE_PHOTOS');
 must(bCrossList.rows.length===0,'B_LISTS_A_PRIVATE_PHOTOS');
 pass('CROSS_OWNER_PRIVATE_PHOTO_LIST_DENIED');
 const anonList=await listStorage(config,fetchImpl,null,a.id+'/');
 must(anonList.denied||anonList.rows.length===0,'ANON_LISTS_PRIVATE_PHOTOS');
 pass('ANON_PRIVATE_PHOTO_LIST_DENIED');
 return Object.freeze({
  priority:'STAGING-AB-01',result:'PASS_LIVE_READ_ONLY',
  authentication:'TWO_REAL_SERVER_VERIFIED_STAGING_SESSIONS',
  verifiedOwnerAccounts:2,verifiedOwnBackupFixtures:2,
  verifiedOwnPrivateJPEGFixtures:2,checks:details,
  realSignedInReadIsolationVerified:true,
  writesOrRpcCallsTested:false,liveUpdateDeleteTested:false,
  loginLifecycleTested:false,customerPhotoBytesRead:false,
  secretsOrAccountIdsEmitted:false,backendProductionAccessed:false,
  nativeAppIntegrated:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
