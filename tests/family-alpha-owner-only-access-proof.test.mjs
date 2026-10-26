import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyOwnerOnlyStageAccess} from '../scripts/verify-owner-only-stage-access.mjs';
const project='closet-current-staging.pages.dev';
const okApps=[
 {id:'stage-root-app-0000000000000001',type:'self_hosted',domain:project},
 {id:'stage-wildcard-app-0000000002',type:'self_hosted',domain:'*.'+project},
 {id:'unrelated-production-app-0000003',type:'self_hosted',domain:'closet-current.pages.dev'}
];
const policy=[{decision:'allow',include:[{email:{email:'synthetic-owner@example.invalid'}}]}];
function transport({apps=okApps,policies=policy,unauthorized=false,pagination=false}={}){
 const called=[];
 const fetchFn=async (url,opts)=>{
  called.push({url,method:opts.method,authorization:opts.headers.Authorization});
  assert.equal(opts.method,'GET');
  assert.ok(url.startsWith('https://api.cloudflare.com/client/v4/accounts/43ad9703708ddb191712306bebadcace/access/apps'));
  const result=url.includes('/policies?')?policies:apps;
  return {
   ok:!unauthorized,status:unauthorized?403:200,
   json:async()=>({success:true,result,result_info:{total_pages:pagination?2:1}})
  };
 };
 return {fetchFn,called};
}
test('two exact staging root and wildcard policy apps contain only one same explicit owner email',async()=>{
 const h=transport();
 const result=await verifyOwnerOnlyStageAccess({token:'SYNTHETIC_CF_TOKEN_NEVER_REAL',fetchFn:h.fetchFn});
 assert.equal(result.result,'OWNER_ONLY_ACCESS_READ_VERIFIED');
 assert.equal(result.project,'closet-current-staging');
 assert.equal(result.approvedIdentityCount,1);
 assert.equal(result.allowPolicies,2);
 assert.equal(result.unauthorizedAccessSessionTested,false);
 assert.equal(result.changesMade,false);
 assert.equal(h.called.length,3);
 assert.ok(h.called.every(x=>x.method==='GET'));
 assert.equal(JSON.stringify(result).includes('synthetic-owner@'),false);
 assert.equal(JSON.stringify(result).includes('SYNTHETIC_CF_TOKEN'),false);
});
test('public, everyone, whole-domain or bypass Access policies all fail owner-only preflight',async()=>{
 const badRules=[
  [{decision:'allow',include:[{everyone:{}}]}],
  [{decision:'allow',include:[{email_domain:{domain:'example.invalid'}}]}],
  [{decision:'allow',include:[{group:{id:'group-A'}}]}],
  [{decision:'bypass',include:[{email:{email:'synthetic-owner@example.invalid'}}]}],
  [{decision:'allow',include:[{email:{email:'synthetic-owner@example.invalid'}},{email:{email:'outsider@example.invalid'}}]}],
  [{decision:'allow',include:[{email:{email:'synthetic-owner@example.invalid'}}]},{decision:'bypass',include:[{everyone:{}}]}],
 ];
 for(const policies of badRules){
  const h=transport({policies});
  await assert.rejects(
   verifyOwnerOnlyStageAccess({token:'SYNTHETIC_CF_TOKEN_NEVER_REAL',fetchFn:h.fetchFn}),
   /exactly one allow policy|cannot bypass|not one explicitly enumerated email/
  );
 }
});
test('missing wildcard, mismatched apps, extra staging apps or inconsistent owner identities fail closed',async()=>{
 for(const apps of [
  okApps.slice(0,1),
  [okApps[0],okApps[0],okApps[1]],
  [okApps[0],{...okApps[1],domain:'another-preview.example.invalid'}],
  [okApps[0],{...okApps[1],type:'saas'}]
 ]){
  const h=transport({apps});
  await assert.rejects(
   verifyOwnerOnlyStageAccess({token:'SYNTHETIC_CF_TOKEN_NEVER_REAL',fetchFn:h.fetchFn}),
   /Expected two staging|Unexpected staging|incomplete/
  );
 }
 const h=transport();
 const fetchFn=async(url,opts)=>{
  const policy=url.includes('/stage-wildcard-app-0000000002/')?
   [{decision:'allow',include:[{email:{email:'other@example.invalid'}}]}]:[{decision:'allow',include:[{email:{email:'synthetic-owner@example.invalid'}}]}];
  const result=url.includes('/policies?')?policy:okApps;
  return {ok:true,status:200,json:async()=>({success:true,result})};
 };
 await assert.rejects(verifyOwnerOnlyStageAccess({
  token:'SYNTHETIC_CF_TOKEN_NEVER_REAL',fetchFn
 }),/identity differs/);
});
test('no permissions or partially paginated responses cannot authorize staging upload',async()=>{
 await assert.rejects(verifyOwnerOnlyStageAccess({}),/token missing/);
 for(const settings of [{unauthorized:true},{pagination:true}]){
  const h=transport(settings);
  await assert.rejects(verifyOwnerOnlyStageAccess({
   token:'SYNTHETIC_CF_TOKEN_NEVER_REAL',fetchFn:h.fetchFn
  }),/unavailable|Incomplete/);
 }
});
