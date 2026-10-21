import test from 'node:test';
import assert from 'node:assert/strict';
import {PATHS, stagingOrigin, probeAnonymousAccess} from '../scripts/check-staging-anonymous-access.mjs';
const origins=['https://closet-current-staging.pages.dev','https://abc123.closet-current-staging.pages.dev'];
const login=()=>new Response(null,{status:302,headers:{location:'https://pilot.cloudflareaccess.com/cdn-cgi/access/login/closet-current-staging.pages.dev'}});
test('accepts only explicitly separate staging and preview origins',()=>{
  for(const u of ['http://closet-current-staging.pages.dev','https://closet-current.pages.dev','https://localhost','https://closet-current-staging.pages.dev.evil.test','https://x@y.closet-current-staging.pages.dev','https://closet-current-staging.pages.dev/path','https://closet-current-staging.pages.dev?x=1','https://closet-current-staging.pages.dev#x','https://closet-current-staging.pages.dev:8443'])assert.throws(()=>stagingOrigin(u));
});
test('checks all critical paths without credentials or following redirects; retains release blocks',async()=>{
  const calls=[];
  const r=await probeAnonymousAccess(origins,{request:async(url,options)=>{calls.push(url);assert.equal(options.redirect,'manual');assert.equal(options.credentials,'omit');assert.equal(options.headers.Cookie,undefined);return login();}});
  assert.equal(calls.length,origins.length*PATHS.length);
  assert.equal(r.anonymousProbePassed,true);
  for(const field of ['privateCloudflareAccessPolicyVerified','previewInventoryComplete','authorizedTesterAccessVerified','restrictedStagingDeployed'])assert.equal(r[field],false);
  assert.equal(r.productionPromotion,'BLOCKED');
});
test('a public script on a preview fails even when the home page is protected',async()=>{
  const r=await probeAnonymousAccess(origins,{request:async url=>url===origins[1]+'/app.js'?new Response('public script'):login()});
  assert.equal(r.anonymousProbePassed,false);assert.equal(r.results.filter(x=>x.outcome==='PUBLIC_RESPONSE').length,1);
});
test('errors, generic denials, missing routes and unrelated redirects are inconclusive',async()=>{
  for(const status of [401,403,404,429,500]){
    const r=await probeAnonymousAccess(origins,{request:async()=>new Response(null,{status})});assert.equal(r.anonymousProbePassed,false);
  }
  for(const location of ['https://evil.test/cdn-cgi/access/login/x','https://pilot.cloudflareaccess.com.evil.test/cdn-cgi/access/login/x','/login','https://pilot.cloudflareaccess.com/','http://pilot.cloudflareaccess.com/cdn-cgi/access/login/x']){
    const r=await probeAnonymousAccess(origins,{request:async()=>new Response(null,{status:302,headers:{location}})});assert.equal(r.anonymousProbePassed,false);
  }
  const r=await probeAnonymousAccess(origins,{request:async()=>{throw Error('timeout');}});assert.equal(r.anonymousProbePassed,false);
});
test('validates entire origin inventory before making any request',async()=>{
  let calls=0;const request=async()=>{calls++;return login();};
  for(const list of [[],[origins[0]],[origins[0],origins[0]],[origins[1],'https://evil.test'],[origins[1],'https://other.closet-current-staging.pages.dev']])await assert.rejects(probeAnonymousAccess(list,{request}));
  assert.equal(calls,0);
});
