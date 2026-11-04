// INTERNAL LICENSED-PHOTO PILOT ONLY. Do not import from the static app.
// This entry handler is disabled by default and must not auto-save any preview.
import {submitGuardedGarmentPreview} from './guarded-preview-submission.mjs';
import {validateNormalizeCandidate} from './protocol.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA=/^[a-f0-9]{64}$/;
const SAMPLES=Object.freeze({
 'commons-0035':{category:'Bottoms',sourceSha256:'9fd067b0919d519eb7924ebd5c4ddf0bc0f3956cfd229fe1ab12c16cccb085ca'},
 'commons-0065':{category:'Outerwear',sourceSha256:'0d094b023d86942acbc89fc5a4bc02968c1b5d0b2c78639cdeb985f522a78494'},
 'validation-0017':{category:'Bottoms',sourceSha256:'6f83b0769215cf7e19475a0b946b9be4d5d00747c50df18136aafe18a08dbb58'},
 'validation-0019':{category:'Shoes',sourceSha256:'16c806adf3d3e39d0cfa260901da9de6c87f2eab7eafa6e0e56593d7782a5140'}
});
function response(status,body,origin=''){
 return new Response(JSON.stringify(body),{status,headers:{
  'Content-Type':'application/json','Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff','Vary':'Origin',
  ...(origin?{'Access-Control-Allow-Origin':origin}:{})
 }});
}
export const PILOT_ENABLED_BY_DEFAULT=false;
export const APPROVED_LICENSED_SOURCE_SET=SAMPLES;
export function createLicensedPilotHandler({
 enabled=false,allowedOrigin,allowedUserId,verifyJwt,ledger,transportFactory,clock=Date.now
}={}){
 if(typeof allowedOrigin!=='string'||!/^https:\/\/[-a-z0-9.]+(?::443)?$/.test(allowedOrigin)||
    !UUID.test(allowedUserId||'')||typeof verifyJwt!=='function'||
    !ledger||typeof ledger.reserve!=='function'||typeof ledger.status!=='function'||
    typeof transportFactory!=='function'||typeof clock!=='function')
  throw Error('Missing safe server-only pilot configuration');
 async function handle(request){
  const origin=request.headers.get('origin')||'';
  if(origin!==allowedOrigin)return response(403,{error:'Origin not allowed'});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{
   'Access-Control-Allow-Origin':allowedOrigin,
   'Access-Control-Allow-Methods':'POST, OPTIONS',
   'Access-Control-Allow-Headers':'authorization,content-type,apikey',
   'Access-Control-Max-Age':'600','Cache-Control':'no-store','Vary':'Origin'
  }});
  if(request.method!=='POST')return response(405,{error:'Method not allowed'},allowedOrigin);
  if(enabled!==true)return response(503,{error:'Pilot not enabled'},allowedOrigin);
  const token=request.headers.get('authorization')||'';
  if(!/^Bearer [A-Za-z0-9._-]{20,8192}$/.test(token))
   return response(401,{error:'Authentication required'},allowedOrigin);
  let ownerId;
  try{ownerId=await verifyJwt(token.slice(7));}catch{return response(401,{error:'Authentication required'},allowedOrigin);}
  if(!UUID.test(ownerId||'')||ownerId!==allowedUserId)
   return response(403,{error:'Pilot not available for account'},allowedOrigin);
  const contentLength=Number(request.headers.get('content-length')||'0');
  if(!Number.isFinite(contentLength)||contentLength>7_600_000)
   return response(413,{error:'Request too large'},allowedOrigin);
  let body;
  try{
   const text=await request.text();
   if(text.length>7_600_000)return response(413,{error:'Request too large'},allowedOrigin);
   body=JSON.parse(text);
  }catch{return response(400,{error:'Invalid request'},allowedOrigin);}
  if(!body||typeof body!=='object'||!UUID.test(body.requestId||''))
   return response(400,{error:'Invalid request identifier'},allowedOrigin);
  const owner={id:ownerId,verifiedBySupabase:true};
  if(body.action==='start'){
   let candidate;
   try{candidate=validateNormalizeCandidate(body.candidate);}catch{
    return response(400,{error:'Invalid garment image'},allowedOrigin);
   }
   const sample=SAMPLES[candidate.itemId];
   if(!sample||sample.category!==candidate.category||
      sample.sourceSha256!==candidate.photoSha256)
    return response(403,{error:'Only licensed benchmark photos allowed'},allowedOrigin);
   if(body.consentToProvider!==true||body.consentVersion!=='pilot-licensed-v1')
    return response(400,{error:'Specific external image consent required'},allowedOrigin);
   const consent={verifiedByServer:true,granted:true,
    purpose:'external-ai-garment-preview',ownerId,itemId:candidate.itemId,
    sourceSha256:candidate.photoSha256,expiresAt:clock()+60_000};
   try{
    const result=await submitGuardedGarmentPreview({
     candidate:{...body.candidate,category:candidate.category,itemId:candidate.itemId},
     owner,requestId:body.requestId,consent,ledger,transportFactory,
     enabled:true
    });
    return response(202,{
     status:'pending',requestId:body.requestId,canAutoSave:false,
     originalPhotoPreserved:true,
     sourceSha256:result.sourceSha256,requiresVisualReview:true
    },allowedOrigin);
   }catch{
    // Includes exhausted credit, missing ledger, provider outage or hash mismatch.
    // Avoid revealing an API key, provider error body or detailed image metadata.
    return response(409,{error:'Pilot edit could not start safely'},allowedOrigin);
   }
  }
  if(body.action==='status'){
   let record;
   try{record=await ledger.status({owner,requestId:body.requestId});}catch{
    return response(404,{error:'Pilot request not available'},allowedOrigin);
   }
   if(record?.status!=='submitted'||typeof record.jobId!=='string')
    return response(409,{error:'Pilot result not ready'},allowedOrigin);
   try{
    const transport=transportFactory({approved:true,costCredits:1,
     maxOutputs:1,durableDbReservation:true});
    const result=await transport.poll(record.jobId);
    if(result.status==='pending'||result.status==='failed')
     return response(200,{status:result.status,requestId:body.requestId,
      canAutoSave:false},allowedOrigin);
    if(result.status!=='preview-ready'||typeof result.image!=='string'||
       result.canAutoSave!==false)
     throw Error('Unreviewed provider result');
    return response(200,{status:'preview-ready',image:result.image,
     requestId:body.requestId,canAutoSave:false,requiresVisualReview:true,
     sourceSha256:record.sourceSha256,category:record.category},allowedOrigin);
   }catch{return response(502,{error:'Private preview unavailable'},allowedOrigin);}
  }
  return response(400,{error:'Unsupported pilot action'},allowedOrigin);
 }
 return {handle};
}
