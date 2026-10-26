/**
 * Family Alpha #255 — read-only Cloudflare Access verification.
 * Requires token with Access:Apps and Policies Read; never modifies policies.
 * Fails closed on unknown API shape, bypass rules, multi-email, extra scopes,
 * missing root and wildcard app or inconsistent allowed emails.
 */
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const ACCOUNT='43ad9703708ddb191712306bebadcace';
const API='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+'/access/apps';
const ROOT='closet-current-staging.pages.dev';
const WILD='*.'+ROOT;
const hex=s=>createHash('sha256').update(s).digest('hex').slice(0,12);
function normalizeDestination(value){
 if(typeof value!=='string')return null;
 // Cloudflare's new public destinations supersede deprecated domains.
 const input=value.replace(/^https:\/\//i,'');
 if(!/^(?:\*\.)?closet-current-staging\.pages\.dev(?:\/|\/\*)?$/.test(input))
  return null;
 return input.replace(/\/(?:\*)?$/,'');
}
function domains(app){
 const set=new Set();
 for(const legacy of [app.domain,...(Array.isArray(app.domains)?app.domains:[]),
   ...(Array.isArray(app.self_hosted_domains)?app.self_hosted_domains:[])]){
  const name=typeof legacy==='string'?legacy:legacy?.domain;
  const safe=normalizeDestination(name);
  if(safe)set.add(safe);
 }
 if(Array.isArray(app.destinations)){
  for(const entry of app.destinations){
   if(entry?.type!=='public'&&entry?.type!==undefined)continue;
   const value=normalizeDestination(entry.uri);
   if(value){
    if(Array.isArray(entry.overrides)&&entry.overrides.length>0)
      throw Error('Public Access destination overrides would bypass owner');
    set.add(value);
   }
  }
 }
 return [...set];
}
function ownerEmail(policies){
 if(!Array.isArray(policies)||policies.length!==1)throw Error('Staging Access requires exactly one allow policy');
 const [policy]=policies;
 if(policy.decision!=='allow'||!Array.isArray(policy.include)||
    policy.include.length!==1||
    (policy.exclude&& !Array.isArray(policy.exclude))||
    (policy.require&& !Array.isArray(policy.require)))
  throw Error('Access staging policy cannot bypass or broaden owner rule');
 const rule=policy.include[0];
 if(!rule||Object.keys(rule).length!==1||!rule.email||
    typeof rule.email.email!=='string'||!/^.+@[^@]+\.[^@]+$/.test(rule.email.email))
  throw Error('Staging policy is not one explicitly enumerated email');
 return rule.email.email.toLowerCase();
}
async function json(endpoint,fetchFn,token){
 const r=await fetchFn(endpoint,{
  method:'GET',redirect:'error',
  headers:{Authorization:'Bearer '+token,Accept:'application/json'}
 });
 if(!r.ok)throw Error('Cloudflare Access read-only metadata unavailable: HTTP '+r.status);
 const body=await r.json();
 if(body.success!==true||!Array.isArray(body.result)||
    (body.result_info?.total_pages??1)>1)
  throw Error('Incomplete Cloudflare Access metadata');
 return body.result;
}
export async function verifyOwnerOnlyStageAccess({token,fetchFn=fetch}={}){
 if(typeof token!=='string'||token.length<16)throw Error('Cloudflare Access read token missing');
 const apps=await json(API+'?per_page=100',fetchFn,token);
 const selected=apps.filter(app=>domains(app).some(d=>d===ROOT||d===WILD));
 if(selected.length!==2)throw Error('Expected two staging root and wildcard Access apps, got '+selected.length+
   '; apps='+apps.length+'; destinationBased='+apps.filter(a=>Array.isArray(a.destinations)).length);
 const keys=new Set();
 for(const app of selected){
  for(const d of domains(app))if(d===ROOT||d===WILD)keys.add(d);
  if(app.type!=='self_hosted'||typeof app.id!=='string'||app.id.length<10||
     app.auto_redirect_to_identity===true||app.bypass_access_app===true)
   throw Error('Unexpected staging Access application type/configuration');
 }
 if(keys.size!==2||!keys.has(ROOT)||!keys.has(WILD))
  throw Error('Cloudflare staging root/wildcard policy coverage is incomplete');
 let email=null;
 for(const app of selected){
  const policies=await json(API+'/'+app.id+'/policies?per_page=100',fetchFn,token);
  const person=ownerEmail(policies);
  if(email&&email!==person)throw Error('Owner identity differs between protected app and preview');
  email=person;
 }
 if(!email)throw Error('Owner Access policy unverified');
 return Object.freeze({
  result:'OWNER_ONLY_ACCESS_READ_VERIFIED',
  project:'closet-current-staging',rootDomain:ROOT,previewDomain:WILD,
  approvedIdentityCount:1,allowPolicies:2,ownerEmailFingerprint:hex(email),
  unauthorizedAccessSessionTested:false,
  changesMade:false
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==2)throw Error('No Access policy change parameters');
 const result=await verifyOwnerOnlyStageAccess({token:process.env.CLOUDFLARE_API_TOKEN});
 console.log('OWNER_ONLY_STAGING_ACCESS '+JSON.stringify(result));
}
