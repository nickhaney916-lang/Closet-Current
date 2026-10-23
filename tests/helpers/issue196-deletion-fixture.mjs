// TEST ONLY: no SDK/network clients, credentials, environment or external files.
// This is a service CONTRACT MODEL, not proof of SQL locks or physical Storage.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createSupabaseDeletionAdapters} from '../../supabase/functions/account-delete/supabase-adapters.mjs';
import {createAccountDeletionCoordinator,ACCOUNT_DELETION_CONFIRMATION} from '../../supabase/functions/account-delete/deletion-coordinator.mjs';
import {createDeletionRecoveryAssessor} from '../../supabase/functions/account-delete/recovery-assessor.mjs';
export const A='a1111111-1111-4111-8111-111111111111',B='b2222222-2222-4222-8222-222222222222';
export const INCIDENT='CC-INC-SYNTHETIC196';
const baseJPEG=Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAACAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDlKKKK+vPDP//Z','base64');
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export function jpeg(label){
 const comment=Buffer.from('synthetic196:'+label),header=Buffer.alloc(4);
 header.writeUInt16BE(0xfffe);header.writeUInt16BE(comment.length+2,2);
 return Buffer.concat([baseJPEG.subarray(0,-2),header,comment,baseJPEG.subarray(-2)]);
}
export const dataURL=bytes=>'data:image/jpeg;base64,'+bytes.toString('base64');
export function fixture({count=237}={}){
 const objects=new Map(),backups=new Map(),users=new Set([A,B]),locks=new Set(),claims=new Set();
 const calls=[],receipts=[],local=new Map(),exports=new Map(),pending=new Map();
 const fault={stage:null,when:'before',occurrence:1},counts=new Map();
 let hook=null;
 const token=uid=>'synthetic-bearer-for-'+uid,password='synthetic-password-only';
 const ownerForToken=t=>[A,B].find(uid=>token(uid)===t);
 const ok=data=>({data,error:null});
 const identity=uid=>({id:uid,email:(uid===A?'synthetic-a':'synthetic-b')+'@example.invalid'});
 const scoped=uid=>{assert.ok([A,B].includes(uid),'invented owners only');return uid;};
 const names=uid=>[...objects.keys()].filter(p=>p.startsWith(scoped(uid)+'/')).map(p=>p.slice(uid.length+1)).sort();
 const put=(uid,bytes)=>{const path=scoped(uid)+'/'+digest(bytes)+'.jpg';objects.set(path,Buffer.from(bytes));return 'closet-photo:'+path;};
 const refs={};
 for(const uid of [A,B]){
  // Both owners have identical bytes, but independent owner-prefixed objects.
  const original=put(uid,jpeg('shared-full-scene')),display=put(uid,jpeg('display')),raw=put(uid,jpeg('unmasked-recognition'));
  const draft=put(uid,jpeg('unfinished-draft')),inspiration=put(uid,jpeg('inspiration-preview'));
  const item=id=>({id,name:id,category:id==='shoe'?'Shoes':'Tops',itemType:id==='shoe'?'Sneakers':'T-shirt',color:'Blue',image:display,originalPhoto:{image:original},recognitionPhoto:{image:raw}});
  const document={schemaVersion:1,items:[item('top'),item('shoe')],state:{
   draft:{id:'draft',batch:[{id:'unfinished',image:draft,originalPhoto:{image:original}}]},
   looks:{id:'looks',looks:[{id:'look',image:inspiration,pieces:[]}]},
   'outfit-board':{id:'outfit-board',current:{slots:{top:'top'}},saved:[{id:'board',slots:{shoes:'shoe'}}]}
  }};
  backups.set(uid,document);refs[uid]={original,display,raw,draft,inspiration};
  local.set(uid,structuredClone(document));
  const expand=value=>{
   if(Array.isArray(value))return value.map(expand);
   if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,k==='image'&&typeof v==='string'?dataURL(objects.get(v.slice(13))):expand(v)]));
   return value;
  };
  exports.set(uid,JSON.stringify(expand({format:'closet-current',version:4,ownerId:uid,
   items:document.items,looks:document.state.looks.looks,
   outfitBoard:{current:document.state['outfit-board'].current,saved:document.state['outfit-board'].saved}})));
 }
 // The remaining objects have no metadata references: abandoned/superseded uploads.
 for(let i=5;i<count;i++)put(A,jpeg('unreferenced-'+i));
 function fingerprint(uid){return JSON.stringify({objects:names(uid).map(n=>[n,digest(objects.get(uid+'/'+n))]),backup:backups.get(uid),auth:users.has(uid),locked:locks.has(uid),claimed:claims.has(uid)});}
 async function step(stage,uid,work){
  scoped(uid);calls.push({stage,uid});const n=(counts.get(stage)||0)+1;counts.set(stage,n);
  await hook?.(stage,uid,n);
  if(fault.stage===stage&&fault.when==='before'&&n===fault.occurrence)throw Error('synthetic interruption '+stage+' before');
  const result=await work();
  if(fault.stage===stage&&fault.when==='after'&&n===fault.occurrence)throw Error('synthetic interruption '+stage+' after');
  return result;
 }
 const adminClient={
  auth:{getUser:async bearer=>{const uid=ownerForToken(bearer);return uid&&users.has(uid)?ok({user:identity(uid)}):{error:{status:401}};},admin:{
   getUserById:async uid=>users.has(scoped(uid))?ok({user:identity(uid)}):{error:{status:404}},
   deleteUser:async uid=>{users.delete(scoped(uid));return ok({user:identity(uid)});}
  }},
  rpc:async(name,{p_owner:uid})=>{
   scoped(uid);
   if(name==='begin_closet_account_deletion'){
    // MODEL assumption: real DB must serialize locks with in-flight transactions.
    await Promise.all(pending.get(uid)||[]);locks.add(uid);return ok(true);
   }
   assert.equal(name,'claim_closet_account_cleanup');assert.ok(locks.has(uid));
   if(claims.has(uid))return ok(false);claims.add(uid);return ok(true);
  },
  storage:{from(bucket){assert.equal(bucket,'closet-private');return {
   list:async(uid,{limit,offset,sortBy})=>{assert.equal(offset,0);assert.deepEqual(sortBy,{column:'name',order:'asc'});return ok(names(uid).slice(0,limit).map(name=>({name})));},
   remove:async paths=>{for(const p of paths){assert.ok(p.startsWith(A+'/')||p.startsWith(B+'/'));objects.delete(p);}return ok(paths);}
  };}},
  from(table){assert.equal(table,'closet_backups');return {
   delete:()=>({eq:async(col,uid)=>{assert.equal(col,'owner_id');backups.delete(scoped(uid));return ok(null);}}),
   select:col=>{assert.equal(col,'owner_id');return {eq:(column,uid)=>{
    assert.equal(column,'owner_id');return {limit:async n=>{
     assert.equal(n,1);return ok(backups.has(scoped(uid))?[{owner_id:uid}]:[]);
    }};
   }};}
  };}
 };
 const passwordClient={auth:{signInWithPassword:async({email,password:p})=>{
  const uid=[A,B].find(u=>identity(u).email===email);
  return uid&&p===password&&users.has(uid)?ok({user:identity(uid),session:{access_token:'fresh-synthetic-proof'}}):{error:{status:401}};
 }}};
 const raw=createSupabaseDeletionAdapters({adminClient,passwordClient});
 const deps=Object.fromEntries(Object.entries(raw).map(([stage,fn])=>[stage,async(...args)=>{
  const uid=stage==='verifySession'?ownerForToken(args[0]):args[0];
  return step(stage,uid||A,()=>fn(...args));
 }]));
 const request=(uid=A)=>({bearer:token(uid),password,confirmation:ACCOUNT_DELETION_CONFIRMATION});
 async function run(uid=A,enabled=true){
  const receipt=await createAccountDeletionCoordinator({enabled,...deps}).deleteAccount(request(uid));
  receipts.push(receipt);return receipt;
 }
 const assessor=createDeletionRecoveryAssessor({enabled:true,
  authorizeOperator:async({uid,operatorContext})=>uid===A&&operatorContext?.syntheticReviewer===true,
  readWriteLock:async uid=>locks.has(uid),readCleanupClaim:async uid=>claims.has(uid),
  listPhotos:async(uid,n)=>names(uid).slice(0,n),hasBackup:async uid=>backups.has(uid),
  readAuthState:async uid=>users.has(uid)?'present':'absent'
 });
 // Old JWT deliberately still maps to its subject after Auth deletion. Only
 // the modeled persistent write barrier prevents resurrection. Not JWT proof.
 const write=(bearer,kind,bytes=jpeg('late'))=>{
  const uid=ownerForToken(bearer);scoped(uid);
  if(locks.has(uid))throw Error('synthetic durable write barrier');
  if(kind==='photo')return put(uid,bytes);
  assert.equal(kind,'backup');backups.set(uid,structuredClone(local.get(uid)));return true;
 };
 function beginUpload(uid,bytes){
  assert.ok(!locks.has(uid));let release;
  const committed=new Promise(resolve=>{release=()=>{const p=put(uid,bytes);calls.push({stage:'inFlightUploadCommitted',uid});resolve(p);};});
  pending.set(uid,[...(pending.get(uid)||[]),committed]);return {release,committed};
 }
 return {objects,backups,users,locks,claims,calls,receipts,local,exports,refs,names,put,token,write,beginUpload,
  raw,deps,request,run,fault,fingerprint,setHook:fn=>{hook=fn;},
  assess:()=>assessor.assess({uid:A,incidentTicket:INCIDENT,operatorContext:{syntheticReviewer:true}})};
}
