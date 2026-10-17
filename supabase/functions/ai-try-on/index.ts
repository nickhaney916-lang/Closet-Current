// INTERNAL PILOT ONLY. Never publish FASHN_API_KEY to the static app.
// Production must add durable per-user rate limits and a provider spending cap
// before admitting the general public. This function defaults to disabled.
import {validateStart,providerRequest,safeJobId,normalizeStatus} from './protocol.mjs';

const text=(value:string)=>new TextEncoder().encode(value);
const b64url=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const fromB64url=(value:string)=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4)),c=>c.charCodeAt(0));
function json(body:unknown,status=200,origin=''){
 return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff',...(origin?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{})}});
}
async function signer(){
 const raw=Deno.env.get('TRYON_JOB_SIGNING_KEY')||'';
 if(raw.length<32)throw Error('Pilot signing secret missing');
 return await crypto.subtle.importKey('raw',text(raw),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
async function signPrediction(id:string,uid:string){
 const payload=b64url(text(JSON.stringify({id,uid,time:Date.now()})));
 const signature=await crypto.subtle.sign('HMAC',await signer(),text(payload));
 return payload+'.'+b64url(new Uint8Array(signature));
}
async function readPrediction(token:string,uid:string){
 if(typeof token!=='string'||token.length>1024||!/^[-_A-Za-z0-9]+\.[-_A-Za-z0-9]+$/.test(token))throw Error('Invalid prediction token');
 const [payload,signature]=token.split('.');
 if(!await crypto.subtle.verify('HMAC',await signer(),fromB64url(signature),text(payload)))throw Error('Invalid prediction token');
 const value=JSON.parse(new TextDecoder().decode(fromB64url(payload)));
 if(value.uid!==uid||!safeJobId(value.id)||!Number.isFinite(value.time)||Date.now()-value.time<0||Date.now()-value.time>10*60000)throw Error('Prediction no longer available');
 return value.id as string;
}
const allowedOrigin=()=>Deno.env.get('TRYON_ALLOWED_ORIGIN')||'https://nickhaney916-lang.github.io';
async function userFromToken(jwt:string){
 const url=Deno.env.get('SUPABASE_URL');
 let key=Deno.env.get('SUPABASE_ANON_KEY')||Deno.env.get('SUPABASE_PUBLISHABLE_KEY')||'';
 if(!key){
  try{
   const names=JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}');
   key=Object.values(names).find(v=>typeof v==='string'&&v.startsWith('sb_publishable_')) as string||'';
  }catch{/* no publishable key configured */}
 }
 if(!url||!key)throw Error('Authentication configuration unavailable');
 const response=await fetch(url+'/auth/v1/user',{headers:{Authorization:'Bearer '+jwt,apikey:key},signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw Error('Authentication required');
 const data=await response.json();
 if(typeof data?.id!=='string'||!data.id)throw Error('Authentication required');
 return data.id as string;
}
async function provider(path:string,method:'GET'|'POST',payload:unknown,key:string){
 const response=await fetch('https://api.fashn.ai'+path,{
  method,headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
  ...(method==='POST'?{body:JSON.stringify(payload)}:{}),signal:AbortSignal.timeout(20000)
 });
 if(!response.ok)throw Error('Try-on provider temporarily unavailable');
 return await response.json();
}
Deno.serve(async request=>{
 const origin=request.headers.get('origin')||'',allowed=allowedOrigin();
 if(origin!==allowed)return json({error:'Origin not allowed'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{
  'Access-Control-Allow-Origin':allowed,'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Max-Age':'600','Vary':'Origin'
 }});
 if(request.method!=='POST')return json({error:'Method not allowed'},405,allowed);
 if(Deno.env.get('TRYON_ENABLED')!=='true')return json({error:'AI try-on pilot is not enabled'},503,allowed);
 const secret=Deno.env.get('FASHN_API_KEY');
 if(!secret)return json({error:'AI try-on provider is not configured'},503,allowed);
 const jwt=(request.headers.get('authorization')||'').match(/^Bearer ([-_.A-Za-z0-9]+)$/)?.[1];
 if(!jwt)return json({error:'Sign in required'},401,allowed);
 let user;
 try{user=await userFromToken(jwt);}catch{return json({error:'Authentication required'},401,allowed);}
 const allowedUsers=new Set((Deno.env.get('TRYON_PILOT_USER_IDS')||'').split(',').map(s=>s.trim()).filter(Boolean));
 if(!allowedUsers.has(user))return json({error:'AI try-on is limited to pilot accounts'},403,allowed);
 if(Number(request.headers.get('content-length')||'0')>8_000_000)return json({error:'Image too large'},413,allowed);
 let body;
 try{body=await request.json();}catch{return json({error:'Invalid JSON'},400,allowed);}
 try{
  if(body.action==='start'){
   const input=validateStart(body);
   const modelImage=Deno.env.get(input.figure==='female'?'TRYON_FEMALE_MODEL_IMAGE_URL':'TRYON_MALE_MODEL_IMAGE_URL')||'';
   const response=await provider('/v1/run','POST',providerRequest({...input,modelImage}),secret);
   if(!safeJobId(response?.id))throw Error('Provider rejected try-on');
   return json({status:'processing',token:await signPrediction(response.id,user)},200,allowed);
  }
  if(body.action==='status'){
   const id=await readPrediction(body.token,user);
   const status=normalizeStatus(await provider('/v1/status/'+id,'GET',null,secret));
   return json(status,200,allowed);
  }
  return json({error:'Invalid action'},400,allowed);
 }catch(error){
  // Provider/user payloads and URLs must not appear in customer-facing errors.
  const message=error instanceof Error?error.message:'Try-on unavailable';
  const inputIssue=/^(Invalid |Prediction no longer|Standard figure)/.test(message);
  return json({error:inputIssue?message:'AI try-on is currently unavailable'},inputIssue?400:503,allowed);
 }
});
