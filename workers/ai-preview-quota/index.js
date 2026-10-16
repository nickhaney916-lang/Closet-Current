// Cloudflare Durable Object: one authoritative serialized quota counter per user.
// Bind using AI_PREVIEW_QUOTAS; never use process-local maps for a distributed quota.
export class AIPreviewQuota {
 constructor(state){this.state=state;}
 async fetch(request){
  if(request.method!=='POST')return new Response('Method not allowed',{status:405});
  const {day,limit}=await request.json();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isInteger(limit)||limit<1||limit>10)return new Response('Invalid quota',{status:400});
  const result=await this.state.storage.transaction(async txn=>{
   const key='day:'+day;
   const count=(await txn.get(key))||0;
   if(count>=limit)return {allowed:false,remaining:0};
   await txn.put(key,count+1);
   return {allowed:true,remaining:limit-count-1};
  });
  return Response.json(result,{headers:{'cache-control':'no-store'}});
 }
}

// Public requests to this Worker never reserve quota; only authenticated Pages
// Functions may access the Durable Object namespace via an account binding.
export default {fetch(){return new Response('Not found',{status:404});}};
