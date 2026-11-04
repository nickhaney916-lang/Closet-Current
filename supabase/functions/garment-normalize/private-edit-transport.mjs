// Experimental PRIVATE adapter for FASHN Edit. No invocation by static app.
// The pilot stays OFF unless a future authenticated Edge Function provides an
// approved credit reservation, secret and explicitly enabled provider config.
// This module performs NO external fetch merely by being imported.
import {validateOutput} from './protocol.mjs';

const PATH='https://api.fashn.ai/v1/';
const JOB=/^[a-zA-Z0-9-]{12,100}$/;
const SRC=/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
function authorize(ctx){
 if(ctx?.enabled!==true||ctx?.reservation?.approved!==true||
   ctx?.reservation?.costCredits!==1||ctx?.reservation?.maxOutputs!==1||
   ctx?.reservation?.durableDbReservation!==true||
   typeof ctx?.apiKey!=='string'||ctx.apiKey.length<20||
   typeof ctx?.fetchImpl!=='function')
  throw Error('Private edit transport disabled or lacks spending authorization');
}
function payloadValid(plan){
 const i=plan?.inputs;
 return plan?.model_name==='edit'&&i&&typeof i.prompt==='string'&&
   i.prompt.length>=20&&i.prompt.length<=4000&&
   i.resolution==='1k'&&i.generation_mode==='fast'&&
   i.num_images===1&&i.return_base64===true&&i.output_format==='png'&&
   typeof i.image==='string'&&i.image.length<=7_500_000&&SRC.test(i.image);
}
async function call(ctx,path,options){
 const response=await ctx.fetchImpl(PATH+path,{
  ...options,
  headers:{'Authorization':'Bearer '+ctx.apiKey,
   'Content-Type':'application/json'},
  signal:AbortSignal.timeout(20000)
 });
 if(!response||!response.ok)throw Error('Private image editor unavailable');
 const size=Number(response.headers?.get?.('content-length')||'0');
 if(size>10_000_000)throw Error('Invalid image editor response size');
 const data=await response.json();
 if(!data||typeof data!=='object')throw Error('Invalid image editor response');
 return data;
}
export function createPrivateEditTransport(ctx){
 function ready(){authorize(ctx);}
 return Object.freeze({
  async submit(plan){
   ready();
   if(!payloadValid(plan))throw Error('Unsafe one-image edit payload');
   const res=await call(ctx,'run',{method:'POST',body:JSON.stringify(plan)});
   if(!JOB.test(res?.id||''))throw Error('Invalid private edit job identifier');
   return {jobId:res.id,status:'queued',previewOnly:true,
    sourceIdentityVerifiedByTransport:false,canAutoSave:false};
  },
  async poll(jobId){
   ready();
   if(typeof jobId!=='string'||!JOB.test(jobId))throw Error('Invalid private edit job identifier');
   const result=await call(ctx,'status/'+jobId,{method:'GET'});
   if(result.id!==jobId)throw Error('Unbound private edit status');
   if(['starting','in_queue','processing'].includes(result.status))
    return {status:'pending',jobId,canAutoSave:false};
   if(result.status==='failed')return {status:'failed',jobId,canAutoSave:false};
   if(result.status!=='completed'||!Array.isArray(result.output)||result.output.length!==1)
    throw Error('Unexpected image editor output');
   // Return base64 only. Forbid loading provider CDN URLs, which would bypass
   // our 60-minute retention preference and local result verification.
   const validated=validateOutput(result.output[0]);
   return {status:'preview-ready',jobId,image:validated.image,
    sourceIdentityVerifiedByTransport:false,garmentFidelityVerified:false,
    canAutoSave:false,requiresOwnerReview:true};
  }
 });
}
export const PRIVATE_EDIT_DEFAULT_ENABLED=false;
