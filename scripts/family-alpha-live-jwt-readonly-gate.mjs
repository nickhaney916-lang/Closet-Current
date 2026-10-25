/**
 * Family Alpha #255 — future owner-approved, read-only staging JWT A/B checks.
 * Not a release decision. Import-only; CLI never connects to a network.
 *
 * Uses two disposable adult staging JWTs provided by an authorized runner,
 * without printing, caching or persisting credentials or downloading images.
 * NO POST / PUT / PATCH / DELETE. Backup queries request only owner_id,revision;
 * image access is HEAD only and may be INCONCLUSIVE where HEAD is unsupported.
 * Live use needs explicit owner approval and existing synthetic fixtures.
 */
export const PROJECT='fbnplztkbsteuzrmbgib';
export const BASE='https://'+PROJECT+'.supabase.co';
export const PROD='hlkgymugtfbirlpunsra';
export const STAGE_ORIGIN='https://closet-current-staging.pages.dev/';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const JPEG=/^[a-f0-9]{64}\.jpg$/;
const PUB=/^sb_publishable_[A-Za-z0-9_-]{8,}$/;

export function validateReadOnlyFixture(a,b){
 if(!a||!b||typeof a!=='object'||typeof b!=='object')throw Error('Two disposable staging test accounts required');
 if(!UUID.test(a.id||'')||!UUID.test(b.id||'')||a.id.toLowerCase()===b.id.toLowerCase())
  throw Error('Two distinct staging account UUIDs required');
 for(const person of [a,b]){
  if(typeof person.jwt!=='string'||person.jwt.length<12||/\s/.test(person.jwt))
   throw Error('A staging-issued disposable test JWT is required for each account');
  if(typeof person.photoKey!=='string'||!JPEG.test(person.photoKey))
   throw Error('Synthetic test JPEG digest filename required');
  if(person.id!==person.id.toLowerCase())
   throw Error('Canonical lowercase staging owner UUIDs required');
 }
 return true;
}
export function plannedPaths(a,b){
 validateReadOnlyFixture(a,b);
 return Object.freeze({
  stageBase:BASE,
  backupA:'/rest/v1/closet_backups?select=owner_id,revision&owner_id=eq.'+a.id,
  backupB:'/rest/v1/closet_backups?select=owner_id,revision&owner_id=eq.'+b.id,
  photoA:'/storage/v1/object/closet-private/'+a.id+'/'+a.photoKey,
  photoB:'/storage/v1/object/closet-private/'+b.id+'/'+b.photoKey
 });
}
function assessRowResponse(response,actor,owner){
 if(response.error)return 'INCONCLUSIVE';
 if(response.status===401||response.status===403){
  return actor===owner?'INCONCLUSIVE':'DENIED';
 }
 if(response.status!==200||!Array.isArray(response.json))return 'INCONCLUSIVE';
 if(response.json.some(x=>!x||typeof x!=='object'||
  typeof x.owner_id!=='string'||x.owner_id!==owner))return 'FAIL_LEAK';
 if(actor===owner){
  return response.json.length===1&&Number.isSafeInteger(response.json[0].revision)&&
   response.json[0].revision>=1?'ALLOWED':'INCONCLUSIVE';
 }
 return response.json.length===0?'DENIED':'FAIL_LEAK';
}
function assessObjectResponse(response,actor,owner){
 if(response.error)return 'INCONCLUSIVE';
 if(actor===owner)return response.status>=200&&response.status<300?'ALLOWED':'INCONCLUSIVE';
 if(response.status>=200&&response.status<300)return 'FAIL_LEAK';
 return [401,403,404].includes(response.status)?'DENIED':'INCONCLUSIVE';
}
/**
 * Fail closed on ambiguous or unauthorized responses. This is read-only
 * *preliminary* evidence and cannot prove INSERT/UPDATE/DELETE RLS.
 *
 * fetchFn must be supplied by a specifically approved live executor or
 * injected by synthetic tests; this module never invokes global fetch.
 */
export async function runApprovedReadOnlyProbe({
 ownerApproved=false, a, b, publicKey, fetchFn
}={}){
 if(ownerApproved!==true)throw Error('Explicit owner approval for live STAGING read-only JWT requests required');
 validateReadOnlyFixture(a,b);
 if(typeof publicKey!=='string'||!PUB.test(publicKey))
  throw Error('Use the separate staging publishable key, never a secret/service key');
 if(typeof fetchFn!=='function')throw Error('Explicit network executor required: default is OFF');
 const plan=plannedPaths(a,b);
 const pair=[a,b];
 const marks=[];
 let failed=false,inconclusive=false;
 const request=async(person,path,method)=>{
  if(!['GET','HEAD'].includes(method)||!path.startsWith('/')||path.startsWith('//')||
    path.includes('..')||path.includes('\\')||path.includes('#'))
   throw Error('Unsafe stage-only read request');
  const url=BASE+path;
  if(!url.startsWith(BASE+'/')||url.includes(PROD))throw Error('Production or unapproved endpoint');
  try{
   const res=await fetchFn(url,{
    method,redirect:'error',credentials:'omit',cache:'no-store',
    headers:{apikey:publicKey,Authorization:'Bearer '+person.jwt,Accept:'application/json'}
   });
   const status=res?.status;
   if(!Number.isInteger(status)||status<100||status>599)return {error:true};
   if(method==='HEAD')return {status};
   if(status!==200)return {status};
   let json;
   try{json=await res.json()}catch{return {error:true}}
   return {status,json};
  }catch{return {error:true};}
 };
 // Validate each bearer against the staging Auth user endpoint FIRST.
 for(const [index,person]of pair.entries()){
  const auth=await request(person,'/auth/v1/user','GET');
  const verified=auth.status===200&&auth.json?.id===person.id;
  marks.push({case:index===0?'auth-A':'auth-B',result:verified?'ALLOWED':'INCONCLUSIVE'});
  if(!verified)inconclusive=true;
 }
 if(inconclusive)return Object.freeze({
  status:'INCONCLUSIVE',releaseGate:'HOLD',remoteWrites:0,
  checks:marks,remaining:['Account JWTs not confirmed against the staging Auth service']
 });
 for(const [actorIndex,actor] of pair.entries()){
  for(const [ownerIndex,owner] of pair.entries()){
   const response=await request(actor,ownerIndex===0?plan.backupA:plan.backupB,'GET');
   const result=assessRowResponse(response,actor.id,owner.id);
   marks.push({case:'backup-'+(actorIndex?'B':'A')+'-to-'+(ownerIndex?'B':'A'),result});
   if(result.startsWith('FAIL'))failed=true;
   else if(result==='INCONCLUSIVE')inconclusive=true;
  }
 }
 for(const [actorIndex,actor]of pair.entries()){
  for(const [ownerIndex,owner]of pair.entries()){
   // HEAD only — no user-photo response body is intentionally read.
   const response=await request(actor,ownerIndex===0?plan.photoA:plan.photoB,'HEAD');
   const result=assessObjectResponse(response,actor.id,owner.id);
   marks.push({case:'photo-'+(actorIndex?'B':'A')+'-to-'+(ownerIndex?'B':'A'),result});
   if(result.startsWith('FAIL'))failed=true;
   else if(result==='INCONCLUSIVE')inconclusive=true;
  }
 }
 const status=failed?'FAIL_PRIVACY':inconclusive?'INCONCLUSIVE':'PRELIMINARY_READ_ONLY_PASS';
 return Object.freeze({
  status,releaseGate:'HOLD',remoteWrites:0,checks:marks,
  remaining:[
   'No live row INSERT / UPDATE / DELETE or RPC writer tests performed',
   'No live storage upload/upsert/delete test performed',
   'HEAD object checks may not equal GET/download enforcement',
   'No previously issued signed URL lifetime checks performed',
   'No login redirect or physical phone verification performed',
   'Four-account Family Alpha approval not granted'
  ]
 });
}
