// Private Cloudflare Pages AI endpoint. Generation remains disabled pending
// verified user quotas, explicit consent UI, AI binding and provider tests.
const json=(body,status)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export function validatePreviewRequest(body){
 if(!body||typeof body!=='object'||Array.isArray(body))return 'INVALID_REQUEST';
 if(body.consentToSharePhotos!==true)return 'CONSENT_REQUIRED';
 if(!Array.isArray(body.garments)||body.garments.length<1||body.garments.length>3)return 'INVALID_GARMENT_COUNT';
 for(const garment of body.garments){
  if(!garment||typeof garment!=='object'||typeof garment.slot!=='string'||
   typeof garment.image!=='string'||!/^data:image[/]jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(garment.image)||garment.image.length>500000)return 'INVALID_GARMENT_IMAGE';
 }
 return null;
}
const SUPABASE_URL='https://hlkgymugtfbirlpunsra.supabase.co';
export async function verifyClosetSession(request,{fetcher=fetch}={}){
 const authorization=request.headers.get('authorization')||'';
 if(!/^Bearer [A-Za-z0-9._~-]+$/.test(authorization))return null;
 const token=authorization.slice(7);
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),7000);
 try{
  const response=await fetcher(SUPABASE_URL+'/auth/v1/user',{
   method:'GET',headers:{authorization:'Bearer '+token,apikey:'sb_publishable_5bw6Gkrw3Qx73dZYGNzmIw_x_OoauDO'},
   signal:controller.signal
  });
  if(!response.ok)return null;
  const user=await response.json();
  return typeof user?.id==='string'&&user.id.length>0?{id:user.id}:null;
 }catch{return null;}finally{clearTimeout(timer);}
}
export async function onRequestPost({request,env}){
 if(env?.AI_PREVIEW_ENABLED!=='true')return json({error:'AI_PREVIEW_NOT_ENABLED',message:'Realistic AI previews are not available yet.'},503);
 const user=await verifyClosetSession(request);
 if(!user)return json({error:'AUTH_REQUIRED',message:'Sign in again to request an AI preview.'},401);
 // Still fail closed: authentication alone cannot bypass per-user quotas or
 // authorization to transmit user-provided photographs to an AI provider.
 return json({error:'AI_PREVIEW_SETUP_INCOMPLETE',message:'Per-user limits and explicit consent flow must be completed before generation.'},503);
}
export async function onRequestGet(){return json({error:'METHOD_NOT_ALLOWED'},405);}
