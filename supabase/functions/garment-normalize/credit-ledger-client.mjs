// PRIVATE server-side only, NOT imported into Closet Current browser.
// Calls 3 security-definer RPCs using a server-controlled service key.
// The verified Supabase user ID must come from server-side JWT validation,
// NEVER from the caller's JSON body. No actual external calls on import.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA=/^[0-9a-f]{64}$/;
const CATEGORY=new Set(['Tops','Bottoms','Dresses','Outerwear','Shoes']);
function validatedOwner(owner){
 if(!owner||owner.verifiedBySupabase!==true||!UUID.test(owner.id||''))
  throw Error('Independently authenticated Supabase user required');
 return owner.id;
}
function source(context){
 if(!UUID.test(context?.requestId||'')||!SHA.test(context?.sourceSha256||'')||
   !CATEGORY.has(context?.category))
  throw Error('Invalid source provenance for pilot reservation');
}
export function createGarmentNormalizeCreditLedger({supabaseUrl,serviceRoleKey,fetchImpl,enabled=false}={}){
 let url;
 try{url=new URL(supabaseUrl);}catch{throw Error('Invalid Supabase service URL');}
 if(url.protocol!=='https:'||!/^[-a-z0-9]+\.supabase\.co$/.test(url.hostname)||
   url.port||url.pathname!=='/'||url.search||url.hash||
   typeof serviceRoleKey!=='string'||serviceRoleKey.length<32||
   typeof fetchImpl!=='function')
  throw Error('Unsafe Supabase server credentials or URL');
 async function rpc(name,payload){
  if(enabled!==true)throw Error('AI pilot ledger disabled');
  const res=await fetchImpl(url.origin+'/rest/v1/rpc/'+name,{
   method:'POST',
   headers:{'Content-Type':'application/json',apikey:serviceRoleKey,
     Authorization:'Bearer '+serviceRoleKey},
   body:JSON.stringify(payload),
   signal:AbortSignal.timeout(10_000)
  });
  if(!res?.ok)throw Error('Supabase pilot ledger unavailable');
  const text=await res.text();
  if(text.length>4096)throw Error('Unexpected Supabase ledger response');
  try{return JSON.parse(text);}catch{throw Error('Unreadable Supabase ledger response');}
 }
 return Object.freeze({
  async reserve({owner,requestId,sourceSha256,category}){
   const ownerId=validatedOwner(owner);
   source({requestId,sourceSha256,category});
   const result=await rpc('reserve_garment_normalize_pilot',{
    p_request_id:requestId,p_owner_id:ownerId,p_source_sha256:sourceSha256,p_category:category
   });
   if(result?.approved!==true||result?.durableDbReservation!==true||
      result?.costCredits!==1||result?.maxOutputs!==1||
      result?.requestId!==requestId||result?.ownerId!==ownerId||
      result?.sourceSha256!==sourceSha256||result?.category!==category||
      result?.status!=='reserved')
    throw Error('No authorized one-credit pilot reservation');
   return Object.freeze({...result,ownerId,requestId,sourceSha256,category});
  },
  async claim({owner,requestId,sourceSha256}){
   const ownerId=validatedOwner(owner);
   source({requestId,sourceSha256,category:'Tops'});
   return (await rpc('claim_garment_normalize_pilot',{
     p_request_id:requestId,p_owner_id:ownerId,p_source_sha256:sourceSha256
    }))===true;
  },
  async bind({owner,requestId,jobId}){
   const ownerId=validatedOwner(owner);
   if(!UUID.test(requestId||'')||typeof jobId!=='string'||
      !/^[A-Za-z0-9-]{12,100}$/.test(jobId))
    throw Error('Unsafe provider identity');
   return (await rpc('bind_garment_normalize_pilot',{
     p_request_id:requestId,p_owner_id:ownerId,p_provider_job_id:jobId
   }))===true;
  }
 });
}
export const CREDIT_LEDGER_CLIENT_ENABLED=false;
