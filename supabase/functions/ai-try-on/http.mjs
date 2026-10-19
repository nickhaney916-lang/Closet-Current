// Testable request handler. Deployment approval gates are supplied ONLY by the
// server entrypoint, never by request fields or environment flags alone.
import {validateStart,validateContinuation,completedIntermediateImage,normalizeStatus} from './protocol.mjs';
import {submitReservedTryOn} from './submission.mjs';
const UUID=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
class HttpIssue extends Error{constructor(message,status=400){super(message);this.status=status;}}
function json(body,status=200,origin=''){
 return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff',...(origin?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{})}});
}
async function readBody(request){
 const reader=request.body?.getReader();if(!reader)throw new HttpIssue('Invalid JSON');
 let size=0;const parts=[];
 try{for(;;){const {value,done}=await reader.read();if(done)break;
  size+=value.byteLength;if(size>8_000_000){await reader.cancel();throw new HttpIssue('Image too large',413);}parts.push(value);
 }}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
 let body;try{body=JSON.parse(new TextDecoder().decode(bytes));}catch{throw new HttpIssue('Invalid JSON');}
 if(!body||typeof body!=='object'||Array.isArray(body))throw new HttpIssue('Invalid JSON');return body;
}
export function createRpcTransport({env,fetchImpl=fetch}){
 return {async rpc(name,args){
  if(!['reserve_closet_tryon','finish_closet_tryon','hold_closet_tryon'].includes(name))throw Error('Invalid ledger RPC');
  const url=env('SUPABASE_URL'),key=env('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!(/(^https:\/\/[^\s<>"']+$)|(^http:\/\/(?:127\.0\.0\.1|localhost):\d+$)/).test(url)||!key)throw Error('Durable submission ledger unavailable');
  const response=await fetchImpl(url+'/rest/v1/rpc/'+name,{method:'POST',
   headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},
   body:JSON.stringify(args),signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error('Durable submission ledger unavailable');
  return {data:await response.json(),error:null};
 }};
}
/** @type {(name: string) => string | undefined} */
const emptyEnv=()=>undefined;
/**
 * @param {{env?: (name: string) => string | undefined, fetchImpl?: typeof fetch,
 * ledger?: ReturnType<typeof import('./submission.mjs').createSubmissionLedger>,
 * signPrediction?: (id: string, uid: string, figure: string, category: string, step: 1|2) => Promise<string>,
 * readPrediction?: (token: string, uid: string) => Promise<{id: string, figure: string, category: string, step: number}>,
 * submissionApproved?: boolean, chainedApproved?: boolean}} options
 */
export function createTryOnHandler({env=emptyEnv,fetchImpl=fetch,ledger,signPrediction,readPrediction,
 submissionApproved=false,chainedApproved=false}={}){
 async function userFromToken(jwt){
  const url=env('SUPABASE_URL');let key=env('SUPABASE_ANON_KEY')||env('SUPABASE_PUBLISHABLE_KEY')||'';
  if(!key){try{key=Object.values(JSON.parse(env('SUPABASE_PUBLISHABLE_KEYS')||'{}')).find(v=>typeof v==='string'&&v.startsWith('sb_publishable_'))||'';}catch{}}
  if(!url||!key)throw Error();
  const response=await fetchImpl(url+'/auth/v1/user',{headers:{Authorization:'Bearer '+jwt,apikey:key},signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error();const data=await response.json();if(!UUID.test(data?.id||''))throw Error();return data.id;
 }
 async function provider(path,method,payload){
  const response=await fetchImpl('https://api.fashn.ai'+path,{method,
   headers:{Authorization:'Bearer '+env('FASHN_API_KEY'),'Content-Type':'application/json'},
   ...(method==='POST'?{body:JSON.stringify(payload)}:{}),signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('Try-on provider temporarily unavailable');return await response.json();
 }
 return async request=>{
  const allowed=env('TRYON_ALLOWED_ORIGIN')||'https://nickhaney916-lang.github.io';
  if((request.headers.get('origin')||'')!==allowed)return json({error:'Origin not allowed'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':allowed,
   'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'authorization,apikey,content-type',
   'Access-Control-Max-Age':'600','Vary':'Origin'}});
  if(request.method!=='POST')return json({error:'Method not allowed'},405,allowed);
  const jwt=(request.headers.get('authorization')||'').match(/^Bearer ([-_.A-Za-z0-9]+)$/)?.[1];
  if(!jwt)return json({error:'Sign in required'},401,allowed);
  let user;try{user=await userFromToken(jwt);}catch{return json({error:'Authentication required'},401,allowed);}
  try{
   const body=await readBody(request);
   const allowedAccount=new Set((env('TRYON_PILOT_USER_IDS')||'').split(',').map(x=>x.trim()).filter(Boolean)).has(user);
   const enabled=submissionApproved===true&&env('TRYON_ENABLED')==='true'&&env('TRYON_LEDGER_ENABLED')==='true'&&!!ledger&&
    !!env('FASHN_API_KEY')&&(env('TRYON_JOB_SIGNING_KEY')||'').length>=32&&!!env('SUPABASE_SERVICE_ROLE_KEY')&&
    !!env('TRYON_FEMALE_MODEL_IMAGE_URL')&&!!env('TRYON_MALE_MODEL_IMAGE_URL');
   const multiReady=enabled&&allowedAccount&&chainedApproved===true&&env('TRYON_MULTI_ENABLED')==='true';
   if(body.action==='availability')return json({status:enabled&&allowedAccount?'ready':'unavailable',multiGarmentReady:multiReady},200,allowed);
   if(!enabled||!allowedAccount)return json({error:'AI try-on is not enabled for this account'},403,allowed);
   if(body.action==='status'){
    let job;try{job=await readPrediction(body.token,user);}catch{throw new HttpIssue('Prediction no longer available');}
    return json(normalizeStatus(await provider('/v1/status/'+job.id,'GET')),200,allowed);
   }
   if(!['start','continue'].includes(body.action))throw new HttpIssue('Invalid action');
   if(!UUID.test(body.requestId||'')||Object.hasOwn(body,'modelImage'))throw new HttpIssue('Invalid try-on input');
   let input,modelImage,prior=null,passes=1,next=null;
   if(body.action==='start'){
    try{input=validateStart(body);}catch{throw new HttpIssue('Invalid try-on input');}
    passes=body.plannedPasses??1;next=body.nextGarmentDigest??null;
    if(![1,2].includes(passes)||(passes===2&&(input.category==='one-pieces'||!/^([a-f0-9]{64})$/.test(next||'')))||
     (passes===1&&next!==null))throw new HttpIssue('Invalid outfit budget plan');
    if(passes===2&&!multiReady)throw new HttpIssue('Multi-garment rendering is not approved',403);
    modelImage=env(input.figure==='female'?'TRYON_FEMALE_MODEL_IMAGE_URL':'TRYON_MALE_MODEL_IMAGE_URL')||'';
   }else{
    if(!multiReady)throw new HttpIssue('Multi-garment rendering is not approved',403);
    try{prior=await readPrediction(body.previousToken,user);input=validateContinuation(body,prior);}catch{throw new HttpIssue('Invalid multi-garment continuation');}
    if((body.plannedPasses??1)!==1||(body.nextGarmentDigest??null)!==null)throw new HttpIssue('Invalid outfit budget plan');
    modelImage=completedIntermediateImage(await provider('/v1/status/'+prior.id,'GET'));
   }
   const response=await submitReservedTryOn({...input,owner:user,requestId:body.requestId,modelImage,
    stage:prior?2:1,parentJobId:prior?.id||null,plannedPasses:passes,nextGarmentDigest:next},
    {enabled:true,ledger,run:payload=>provider('/v1/run','POST',payload)});
   return json({status:'processing',token:await signPrediction(response.providerJobId,user,input.figure,input.category,prior?2:1)},200,allowed);
  }catch(error){return json({error:error instanceof HttpIssue?error.message:'AI try-on is currently unavailable'},error instanceof HttpIssue?error.status:503,allowed);}
 };
}
