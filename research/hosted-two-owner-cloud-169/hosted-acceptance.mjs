/**
 * Closet Current P169 — opt-in *hosted* two-owner HTTP Auth/RLS/Storage acceptance.
 *
 * This is not a browser mock or a local signed JWT: if explicitly invoked with
 * an isolated Supabase project, it uses that project's actual Auth-issued tokens
 * and public REST/Storage gateways. It never receives service-role credentials.
 *
 * By default this module performs no HTTP request. Production and current
 * staging project refs cannot be opted in under any configuration.
 */
import {createHash,randomUUID} from 'node:crypto';

export const FORBIDDEN_PROJECTS_169=Object.freeze([
 'hlkgymugtfbirlpunsra', // actual Closet Current production
 'fbnplztkbsteuzrmbgib'  // actual Closet Current existing staging
]);
export const ISOLATED_CONSENT_169='I_OWN_THIS_DISPOSABLE_TEST_PROJECT';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const safeProject=/^[a-z]{20}$/;
const isRecord=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const check=(condition,reason)=>{if(!condition)throw Error('P169 hosted acceptance: '+reason);};
function sanitizedError(scope){
 // Never stringify bearer tokens, response bodies, email addresses, keys, or URLs.
 return Error('P169 hosted acceptance: '+scope);
}
export function validateHostedConfig169(config){
 check(isRecord(config),'configuration unavailable');
 check(config.enabled===ISOLATED_CONSENT_169,'explicit disposable-project owner consent required');
 check(typeof config.projectRef==='string'&&safeProject.test(config.projectRef),'exact 20-letter project ref required');
 check(!FORBIDDEN_PROJECTS_169.includes(config.projectRef),'production or existing staging is protected');
 check(typeof config.url==='string','Supabase URL required');
 let url;
 try{url=new URL(config.url);}catch{throw sanitizedError('Supabase URL invalid');}
 check(url.protocol==='https:'&&url.hostname===config.projectRef+'.supabase.co'&&
       url.pathname==='/'&&!url.search&&!url.hash&&!url.username&&!url.password&&url.port==='',
       'exact isolated HTTPS project URL required (no proxy or secret in URL)');
 check(typeof config.publishableKey==='string'&&/^sb_publishable_[A-Za-z0-9_-]{15,200}$/.test(config.publishableKey),
       'publishable client key required (no service role or secret key)');
 check(isRecord(config.a)&&isRecord(config.b),'two isolated test account credentials required');
 for(const owner of [config.a,config.b]){
  check(typeof owner.email==='string'&&owner.email.includes('@')&&owner.email.length<=180,'test account email required');
  check(typeof owner.password==='string'&&owner.password.length>=8,'test account password required');
 }
 check(config.a.email.toLowerCase()!==config.b.email.toLowerCase(),
       'two different Auth test accounts required');
 return Object.freeze({base:url.origin,ref:config.projectRef});
}
export function decodeUntrustedJWTClaims169(jwt){
 check(typeof jwt==='string'&&jwt.split('.').length===3,'invalid hosted access token');
 try{
  const fields=jwt.split('.');
  const claims=JSON.parse(Buffer.from(fields[1],'base64url').toString('utf8'));
  check(isRecord(claims)&&uuid.test(claims.sub)&&claims.role==='authenticated'&&
        claims.aud==='authenticated'&&uuid.test(claims.session_id)&&
        Number.isFinite(claims.exp)&&claims.exp>Math.floor(Date.now()/1000),
        'hosted token requires signed-in user, session id, role, audience and unexpired time');
  return {subject:claims.sub,session:claims.session_id,issuer:claims.iss};
 }catch{throw sanitizedError('unreadable hosted JWT claims');}
}
function isoAsset(){
 // Small valid JPEG fixture; any test original used must be fixed byte-exact.
 // Hex must round trip via actual Storage GET. No personal photo is used.
 return Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////////////////////////////wAARCAAQABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMQVBUQYGEzKBoQjB0fAHFCNSYnLhFSNygpLBE2JTY3ODg3MCYvEwQ0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dHV2d3h5ent8fX5+f4CBgoOEhYaHiImKi5KTlJWWl5iZmpucnZ6+vv6+//////8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQZxgRQicZHwBgjCByNCUmJy4fAVMkMzNygpLS4xNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dHV2d3h5ent8fX5+f4CBgoOEhYaHiImKi5KTlJWWl5iZmpucnZ6+vv6+//////8QAGQABAAMBAQAAAAAAAAAAAAAAAAECAwQF/8QAJhAAAQMDAwQDAQAAAAAAAAAAAQIDEQAEBRIhMUEGE1FhInGBsf/aAAwDAQACEQMRAD8A3xWthwq0qSE/v+XXoBRRRQBRRRQBRRRQBRRRQBRRRQB//2Q==','base64');
}
function request169({base,key,fetchImpl,token},path,options={}){
 const headers={apikey:key,...(token?{Authorization:'Bearer '+token}:{})};
 if(options.json!==undefined)headers['Content-Type']='application/json';
 if(options.mime)headers['Content-Type']=options.mime;
 return fetchImpl(base+path,{
  method:options.method||'GET',headers,cache:'no-store',
  ...(options.json!==undefined?{body:JSON.stringify(options.json)}:{}),
  ...(options.body!==undefined?{body:options.body}:{}),
  signal:options.signal
 });
}
function statusAllowed(response,scope,allowed){
 check(response&&allowed.includes(response.status),scope+' HTTP policy violation');
}
async function readJSON169(response,scope){
 try{return await response.json();}catch{throw sanitizedError(scope+' JSON unreadable');}
}
/**
 * One bounded scenario across real Auth, private PostgREST+RPC and Storage.
 * Requires an explicitly disposable isolated project preconfigured with the
 * committed supabase/cloud-backup.sql. If the project is not initialized it
 * FAILS: absence of policy is never counted as a passing private-data test.
 *
 * Request binding is to actual Auth JWT, never caller supplied owner claims.
 */
export async function runHostedTwoOwner169(config,{fetchImpl=fetch,nonce=randomUUID(),onStep}={}){
 const {base,ref}=validateHostedConfig169(config);
 check(typeof fetchImpl==='function','HTTP client unavailable');
 check(typeof nonce==='string'&&uuid.test(nonce),'safe scenario nonce required');
 const key=config.publishableKey;
 const emitted=[];
 const record=(name)=>{emitted.push(name);onStep?.(name);};
 const anon={base,key,fetchImpl};
 const fixture=isoAsset();
 const fingerprint=sha(fixture);
 let A,B;
 const auth=async credential=>{
  const res=await request169(anon,'/auth/v1/token?grant_type=password',{
   method:'POST',json:{email:credential.email,password:credential.password}});
  statusAllowed(res,'auth login',[200]);
  const body=await readJSON169(res,'login');
  check(typeof body.access_token==='string'&&typeof body.refresh_token==='string'&&uuid.test(body.user?.id),
        'hosted token or verified user unavailable');
  const claims=decodeUntrustedJWTClaims169(body.access_token);
  check(claims.subject===body.user.id,'JWT subject differs from verified Auth user');
  check(claims.issuer===base+'/auth/v1','JWT issuer differs from isolated project');
  return {id:body.user.id,token:body.access_token,refresh:body.refresh_token,session:claims.session};
 };
 const call=(who,path,options)=>request169({...anon,token:who?.token},path,options);
 const docsPath=id=>'/rest/v1/closet_backups?select=owner_id,revision,document&owner_id=eq.'+id;
 const scopedRows=async(who,id)=>{
  const r=await call(who,docsPath(id));
  if(r.status===401||r.status===403)return [];
  statusAllowed(r,'private backup SELECT',[200]);
  const rows=await readJSON169(r,'private backup SELECT');
  check(Array.isArray(rows)&&rows.length<=1,'invalid backup SELECT shape');
  return rows;
 };
 const save=async(who,revision,document)=>{
  const r=await call(who,'/rest/v1/rpc/save_closet_backup',{
   method:'POST',json:{p_expected_revision:revision,p_document:document}});
  statusAllowed(r,'private compare-and-swap RPC',[200]);
  return readJSON169(r,'backup revision');
 };
 const objectPath=(owner)=>'/storage/v1/object/closet-private/'+owner+'/'+fingerprint+'.jpg';
 let logoutAttempted=false;
 try{
  A=await auth(config.a);B=await auth(config.b);
  check(A.id!==B.id,'hosted test accounts unexpectedly share identity');
  record('hosted-real-auth-two-distinct-jwt-subjects');
  const [initialA,initialB]=await Promise.all([scopedRows(A,A.id),scopedRows(B,B.id)]);
  check(initialA.length===0&&initialB.length===0,
    'disposable test accounts already contain private records: refuse overwrite');
  record('both-private-backup-records-initially-empty');
  const jdoc=who=>({schemaVersion:1,items:[{
    id:'p169-'+nonce,name:'Synthetic source only',category:'Tops',
    image:'closet-photo:'+who.id+'/'+fingerprint+'.jpg'
   }],state:{}});
  // Both owners must be unable to see a private record owned by the other.
  // Negative reads before data exists prove nothing, so test after writes.
  const rA=await save(A,0,jdoc(A)),rB=await save(B,0,jdoc(B));
  check(rA===1&&rB===1,'both owners must create independent revision 1');
  record('two-auth-issued-jwt-rls-cas-writes');
  const [ownA,ownB,wrongA,wrongB]=await Promise.all([
   scopedRows(A,A.id),scopedRows(B,B.id),scopedRows(A,B.id),scopedRows(B,A.id)]);
  check(ownA.length===1&&ownB.length===1&&
    ownA[0].owner_id===A.id&&ownB[0].owner_id===B.id&&
    ownA[0].revision===1&&ownB[0].revision===1,'own private backups not independently restored');
  check(wrongA.length===0&&wrongB.length===0,'cross-owner backup SELECT exposed');
  record('two-owner-postgrest-cross-owner-read-denied');
  const repeat=await save(A,0,jdoc(A));
  check(repeat===null,'stale revision must fail compare-and-swap');
  record('stale-revision-refused');
  const put=async who=>{
   const r=await call(who,objectPath(who.id),{method:'POST',body:fixture,mime:'image/jpeg'});
   statusAllowed(r,'private photo upload',[200,201]);
  };
  await put(A);await put(B);
  record('two-independent-private-original-jpegs-uploaded');
  const file=async(who,owner)=>{
   const r=await call(who,objectPath(owner));
   if(r.status===401||r.status===403||r.status===404)return null;
   statusAllowed(r,'private original JPEG GET',[200]);
   return Buffer.from(await r.arrayBuffer());
  };
  const [srcA,srcB,foreignA,foreignB]=await Promise.all([
   file(A,A.id),file(B,B.id),file(A,B.id),file(B,A.id)]);
  check(srcA&&srcB&&sha(srcA)===fingerprint&&sha(srcB)===fingerprint,
    'stored original JPEG bytes do not match fixture source');
  check(foreignA===null&&foreignB===null,'cross-owner private JPEG leaked');
  record('original-jpeg-sha-preserved-and-cross-owner-storage-read-denied');
  const attack=await call(B,objectPath(A.id),{method:'POST',body:fixture,mime:'image/jpeg'});
  check([401,403,404].includes(attack.status),'cross-owner Storage INSERT unexpectedly succeeded');
  record('cross-owner-storage-write-denied');
  const anonymous=await request169(anon,docsPath(A.id));
  check(anonymous.status===401||anonymous.status===403||
      (anonymous.status===200&&Array.isArray(await anonymous.json())&&(await scopedRows(B,A.id)).length===0),
    'anonymous private backup SELECT exposed');
  record('anonymous-backup-read-denied');
  // The Auth server revokes refresh tokens at signout; already-issued JWTs may
  // still work until their exp. Never claim instant access-token revocation.
  const out=await call(A,'/auth/v1/logout',{method:'POST'});
  statusAllowed(out,'hosted sign out',[200,204]);
  logoutAttempted=true;
  const refresh=await request169(anon,'/auth/v1/token?grant_type=refresh_token',{
   method:'POST',json:{refresh_token:A.refresh}});
  check([400,401,403].includes(refresh.status),
    'signed-out test user refresh token unexpectedly remained usable');
  record('real-auth-refresh-token-revocation');
  return Object.freeze({priority:169,verdict:'PASS',projectRef:ref,
   genuineHostedAuthIssuer:true,realPostgrestStorage:true,originalSourceSHA256:fingerprint,
   steps:Object.freeze(emitted),privateOwners:2,realDeviceCamera:false,
   physicalPhoneAcceptance:false,fullHostedAlphaRelease:false,
   authorizationNote:'JWT access tokens can remain valid until exp after logout',
   familyAlpha:'HOLD',productionAndExistingStagingUntouched:true});
 }finally{
  // Never print credentials/tokens; attempt logout of temporary test accounts.
  const clean=async user=>{if(!user?.token)return;try{await call(user,'/auth/v1/logout',{method:'POST'});}catch{}};
  if(!logoutAttempted)await clean(A);
  await clean(B);
 }
}
export function configFromEnvironment169(env=process.env){
 return {enabled:env.CLOSET169_ISOLATED_WRITE_APPROVAL,
  url:env.CLOSET169_URL,projectRef:env.CLOSET169_PROJECT_REF,
  publishableKey:env.CLOSET169_PUBLISHABLE_KEY,
  a:{email:env.CLOSET169_OWNER_A_EMAIL,password:env.CLOSET169_OWNER_A_PASSWORD},
  b:{email:env.CLOSET169_OWNER_B_EMAIL,password:env.CLOSET169_OWNER_B_PASSWORD}};
}
