// Staged server-only coordinator. NOT connected to the HTTP entrypoint.
// Authentication, consent and signed predecessor completion must be verified by
// the server BEFORE calling this module. No provider is initialized here.
import {providerRequest,safeJobId} from './protocol.mjs';
const UUID=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
export async function submitReservedTryOn(input,{enabled=false,ledger,run}={}){
 if(enabled!==true)throw Error('Reserved try-on submission is disabled');
 if(!UUID.test(input?.owner||'')||!UUID.test(input?.requestId||'')||
  !['female','male'].includes(input.figure)||![1,2].includes(input.stage)||
  !['tops','bottoms','one-pieces'].includes(input.category)||
  (input.stage===1?input.parentJobId!=null:!safeJobId(input.parentJobId))||
  (input.stage===2&&input.category==='one-pieces')||
  typeof input.garmentImage!=='string'||input.garmentImage.length<128||input.garmentImage.length>7_500_000)
  throw Error('Invalid reserved submission');
 if(!ledger||typeof ledger.reserve!=='function'||typeof ledger.accept!=='function'||
  typeof ledger.unknown!=='function'||typeof run!=='function')throw Error('Durable submission ledger unavailable');
 const payload=providerRequest(input);
 // Bind idempotency to the entire provider payload, including model input,
 // options and garment bytes. Neither source images nor the JSON are stored.
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payload)));
 const fingerprint=Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
 const key={owner:input.owner,requestId:input.requestId};
 const reservation=await ledger.reserve({...key,fingerprint,stage:input.stage,
  figure:input.figure,category:input.category,parentJobId:input.parentJobId||null});
 if(reservation?.disposition==='accepted'&&safeJobId(reservation.providerJobId))
  return {status:'processing',providerJobId:reservation.providerJobId,reused:true};
 if(reservation?.disposition!=='submit'){
  const reasons={hold:'Earlier submission is unresolved; automatic retry is blocked',
   conflict:'Request identity conflicts with an earlier submission',quota:'Try-on quota unavailable',
   disabled:'Durable try-on quota is disabled',invalid:'Invalid predecessor reservation'};
  throw Error(reasons[reservation?.disposition]||'Invalid durable reservation');
 }
 // Once reserved, any ambiguous failure consumes the quota and keeps the key.
 // No refund, reservation expiry, second POST or automatic retry is safe.
 try{
  const response=await run(payload);
  if(!safeJobId(response?.id))throw Error('Provider acceptance was not verified');
  const recorded=await ledger.accept({...key,providerJobId:response.id});
  if(recorded?.accepted!==true)throw Error('Provider acceptance was not durably recorded');
  return {status:'processing',providerJobId:response.id,reused:false};
 }catch{
  try{await ledger.unknown(key);}catch{/* Reserved row already blocks resubmission. */}
  throw Error('Submission outcome is unresolved; do not resubmit automatically');
 }
}

// Inject a server-only Supabase client; never initialize one in the browser.
export function createSubmissionLedger(client){
 async function rpc(name,args){
  const result=await client.rpc(name,args);
  if(result?.error||!result?.data||typeof result.data!=='object')throw Error('Durable submission ledger unavailable');
  return result.data;
 }
 return {
  reserve: x=>rpc('reserve_closet_tryon',{p_owner:x.owner,p_request:x.requestId,
   p_fingerprint:x.fingerprint,p_stage:x.stage,p_figure:x.figure,p_category:x.category,p_parent:x.parentJobId}),
  accept: x=>rpc('finish_closet_tryon',{p_owner:x.owner,p_request:x.requestId,p_provider:x.providerJobId}),
  unknown: x=>rpc('hold_closet_tryon',{p_owner:x.owner,p_request:x.requestId})
 };
}
