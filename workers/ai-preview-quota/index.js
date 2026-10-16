// Private Durable Object, one instance per verified account.
// Reservation IDs are server generated; refunds are idempotent and only for
// pending reservations. Never expose this namespace to browsers.
const PENDING_TTL_MS=15*60*1000;
export class AIPreviewQuota {
 constructor(state){this.state=state;}
 async fetch(request){
  if(request.method!=='POST')return new Response('Method not allowed',{status:405});
  const url=new URL(request.url),action=url.pathname;
  if(!['/reserve','/commit','/refund'].includes(action))return new Response('Not found',{status:404});
  let payload;
  try{payload=await request.json();}catch{return new Response('Invalid JSON',{status:400});}
  const day=new Date().toISOString().slice(0,10),limit=2;
  if(action==='/reserve'){
   const reservationId=crypto.randomUUID(),expiresAt=Date.now()+PENDING_TTL_MS;
   const result=await this.state.storage.transaction(async txn=>{
    const key='day:'+day,count=(await txn.get(key))||0;
    if(count>=limit)return {allowed:false,remaining:0};
    await txn.put(key,count+1);
    await txn.put('reservation:'+reservationId,{day,status:'pending',expiresAt});
    return {allowed:true,remaining:limit-count-1,reservationId};
   });
   if(result.allowed)await this.state.storage.setAlarm(expiresAt);
   return Response.json(result,{headers:{'cache-control':'no-store'}});
  }
  if(typeof payload?.reservationId!=='string'||!/^[-0-9a-f]{36}$/.test(payload.reservationId))return new Response('Invalid reservation',{status:400});
  const result=await this.state.storage.transaction(async txn=>{
   const key='reservation:'+payload.reservationId,record=await txn.get(key);
   if(!record)return {ok:false,reason:'NOT_FOUND'};
   if(record.status!=='pending')return {ok:record.status===(action==='/commit'?'committed':'refunded'),status:record.status};
   if(record.expiresAt<=Date.now()&&action==='/commit')return {ok:false,reason:'EXPIRED'};
   if(action==='/refund'){
    const counterKey='day:'+record.day,count=(await txn.get(counterKey))||0;
    await txn.put(counterKey,Math.max(0,count-1));
   }
   await txn.put(key,{...record,status:action==='/commit'?'committed':'refunded'});
   return {ok:true,status:action==='/commit'?'committed':'refunded'};
  });
  return Response.json(result,{headers:{'cache-control':'no-store'}});
 }
 async alarm(){
  const now=Date.now(),records=await this.state.storage.list({prefix:'reservation:'});
  let next=Infinity;
  for(const [key,record] of records){
   if(record?.status!=='pending')continue;
   if(record.expiresAt>now){next=Math.min(next,record.expiresAt);continue;}
   await this.state.storage.transaction(async txn=>{
    const current=await txn.get(key);
    if(current?.status!=='pending'||current.expiresAt>now)return;
    const counter='day:'+current.day,count=(await txn.get(counter))||0;
    await txn.put(counter,Math.max(0,count-1));
    await txn.put(key,{...current,status:'refunded'});
   });
  }
  if(Number.isFinite(next))await this.state.storage.setAlarm(next);
 }
}
export default {fetch(){return new Response('Not found',{status:404});}};
