// This Cloudflare Pages endpoint is intentionally disabled until identity,
// per-user rate limits, provider credentials and explicit consent are tested.
// Never expose provider keys in public JavaScript.
const json=(body,status)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
export async function onRequestPost({request,env}){
 if(env?.AI_PREVIEW_ENABLED!=='true')return json({error:'AI_PREVIEW_NOT_ENABLED',message:'Realistic AI previews are not available yet.'},503);
 // Fail closed even if a flag is accidentally enabled; a verified authenticated
 // user and quota service must be implemented before contacting an AI provider.
 return json({error:'AI_PREVIEW_SETUP_INCOMPLETE',message:'Authentication, consent verification and usage limits are required before generation.'},503);
}
export async function onRequestGet(){return json({error:'METHOD_NOT_ALLOWED'},405);}
