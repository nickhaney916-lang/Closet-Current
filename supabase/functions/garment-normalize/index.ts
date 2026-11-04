// DO NOT DEPLOY until the owner approves the exact pilot project, migration,
// private credentials and first paid edit. This function is intentionally OFF.
// Deployment with PILOT_ENABLED unset or false cannot call the edit provider.
import {createLicensedPilotHandler} from './licensed-pilot-handler.mjs';
import {createGarmentNormalizeCreditLedger} from './credit-ledger-client.mjs';
import {createPrivateEditTransport} from './private-edit-transport.mjs';

const env=(name:string)=>Deno.env.get(name)||'';
const enabled=env('GARMENT_NORMALIZE_PILOT_ENABLED')==='true';
const base=env('SUPABASE_URL');
const publicKey=env('SUPABASE_ANON_KEY')||env('SUPABASE_PUBLISHABLE_KEY');
const serviceKey=env('SUPABASE_SERVICE_ROLE_KEY');
const providerKey=env('FASHN_API_KEY');
const allowedOrigin=env('GARMENT_NORMALIZE_ALLOWED_ORIGIN');
const allowedUserId=env('GARMENT_NORMALIZE_ALLOWED_USER_ID');
function error(){return new Response(JSON.stringify({error:'Pilot disabled'}),{
 status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}
const ready=enabled&&base&&publicKey&&serviceKey&&providerKey&&allowedOrigin&&allowedUserId;
if(!ready){Deno.serve(()=>error());}
else{
 const lookup=async(jwt:string)=>{
  const r=await fetch(base+'/auth/v1/user',{headers:{
   apikey:publicKey,Authorization:'Bearer '+jwt
  },signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw Error('Invalid auth');
  const body=await r.json();
  return body?.id;
 };
 const ledger=createGarmentNormalizeCreditLedger({
  supabaseUrl:base,serviceRoleKey:serviceKey,fetchImpl:fetch,enabled:true
 });
 // The database ledger is owned by service-role-only calls. Never accept a
 // user ID supplied in the input body as authorization or scope.
 const transportFactory=(reservation:Record<string,unknown>)=>
  createPrivateEditTransport({
   enabled:true,reservation,apiKey:providerKey,fetchImpl:fetch
  });
 const app=createLicensedPilotHandler({
  enabled:true,allowedOrigin,allowedUserId,verifyJwt:lookup,
  ledger,transportFactory
 });
 Deno.serve(request=>app.handle(request));
}
