// Private Cloudflare Pages AI endpoint. Generation remains disabled pending
// verified user quotas, explicit consent UI, AI binding and provider tests.
const json=(body,status)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const MAX_REQUEST_BYTES=2*1024*1024;
export function validatePreviewRequest(body){
 if(!body||typeof body!=='object'||Array.isArray(body))return 'INVALID_REQUEST';
 if(body.consentToSharePhotos!==true)return 'CONSENT_REQUIRED';
 if(!Array.isArray(body.garments)||body.garments.length<1||body.garments.length>3)return 'INVALID_GARMENT_COUNT';
 for(const garment of body.garments){
  if(!garment||typeof garment!=='object'||typeof garment.slot!=='string'||
   typeof garment.image!=='string'||!/^data:image\\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(garment.image)||garment.image.length>500000)return 'INVALID_GARMENT_IMAGE';
 }
 return null;
}
export async function onRequestPost({request,env}){
 if(env?.AI_PREVIEW_ENABLED!=='true')return json({error:'AI_PREVIEW_NOT_ENABLED',message:'Realistic AI previews are not available yet.'},503);
 // Do not inspect image contents until identity and quotas are enforced.
 // Fail closed even if a deployment flag is accidentally enabled.
 return json({error:'AI_PREVIEW_SETUP_INCOMPLETE',message:'Authentication, consent verification and usage limits are required before generation.'},503);
}
export async function onRequestGet(){return json({error:'METHOD_NOT_ALLOWED'},405);}
