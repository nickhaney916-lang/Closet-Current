import test from 'node:test';
import assert from 'node:assert/strict';
import {
 validateProposedStagingUrl,inspectProtectedStagingCandidate,
 probeUnauthenticatedAccess,preflightSummary
} from '../scripts/check-family-alpha-protected-staging-preflight.mjs';
const stage='https://closet-current-protected.pages.dev/';
const fakeFetch=(status,location)=>async(url,options)=>({
 status,headers:{get:name=>name==='location'?location:null}
});
test('the isolated candidate remains HOLD with stage routing but no callback, key or verified Cloudflare Access',async()=>{
 const report=await inspectProtectedStagingCandidate();
 assert.equal(report.releaseGate,'HOLD');
 assert.equal(report.routeIsolatedFromProduction,true);
 assert.equal(report.projectRef,'fbnplztkbsteuzrmbgib');
 assert.equal(report.liveAccessTested,false);
 assert.equal(report.realBackendAuthorizationTested,false);
 assert.equal(report.protectedAccessVerified,false);
 assert.equal(report.readyToDeploy,false);
 assert.equal(report.readyForFamily,false);
 assert.equal(report.blockers.length,6);
 assert.ok(report.blockers.some(x=>x.id==='staging.auth-activation'&&x.status==='BLOCKED'));
});
test('a static report MUST distinguish source checks from real authorization',async()=>{
 const summary=JSON.parse(preflightSummary(await inspectProtectedStagingCandidate()));
 assert.equal(summary.readyToDeploy,false);
 assert.equal(summary.protectedAccessVerified,false);
 assert.equal(summary.realBackendAuthorizationTested,false);
 assert.equal(summary.releaseGate,'HOLD');
 assert.ok(summary.blockers.some(x=>x.id==='staging.live-rls'&&x.status==='NOT VERIFIED'));
 assert.throws(()=>preflightSummary({releaseGate:'PASS'}),/Unsafe/);
});
test('exact HTTPS origin validation rejects production, host spoofing, local paths and query/fragment',()=>{
 for(const bad of [
  '', 'http://closet-current.pages.dev/',
  'https://nickhaney916-lang.github.io/Closet-Current/',
  'https://fbnplztkbsteuzrmbgib.supabase.co/',
  'https://example.cloudflareaccess.com/cdn-cgi/access/login/',
  'https://localhost/', 'https://127.0.0.1/',
  'https://stage.example.invalid/','https://stage.example.test/',
  'https://user:pass@closet.pages.dev/',
  'https://closet.pages.dev:444/',
  'https://closet.pages.dev/?access=1','https://closet.pages.dev/#token',
  'https://closet.pages.dev/path/more',
  'https://192.168.1.4/',
  'javascript:alert(1)'
 ])assert.equal(validateProposedStagingUrl(bad),null,bad);
 assert.equal(validateProposedStagingUrl(stage),stage);
 assert.equal(validateProposedStagingUrl('https://closet.example.org/Closet-Current/'),
  'https://closet.example.org/Closet-Current/');
});
test('cannot probe any host without explicit owner approval; fetch is never called',async()=>{
 let count=0;const fetchFn=async()=>{count++;throw Error('Unexpected');};
 await assert.rejects(probeUnauthenticatedAccess({approvedOrigin:stage,fetchFn}),/Explicit approved/);
 await assert.rejects(probeUnauthenticatedAccess({approvedOrigin:'https://localhost/',ownerApproved:true,fetchFn}),/Explicit approved/);
 await assert.rejects(probeUnauthenticatedAccess({approvedOrigin:stage,ownerApproved:true}),/Explicit approved/);
 assert.equal(count,0);
});
test('the only allowed anonymous request is no-token HEAD to exact approved origin with redirects disabled',async()=>{
 let url,opts;
 const answer=await probeUnauthenticatedAccess({
  approvedOrigin:stage,ownerApproved:true,
  fetchFn:async(u,o)=>{url=u;opts=o;return {status:302,headers:{
   get:k=>k==='location'?'https://closet-team.cloudflareaccess.com/cdn-cgi/access/login/fake':null
  }};}
 });
 assert.equal(url,stage);
 assert.equal(opts.method,'HEAD');
 assert.equal(opts.credentials,'omit');
 assert.equal(opts.redirect,'manual');
 assert.equal(opts.cache,'no-store');
 assert.equal(opts.referrerPolicy,'no-referrer');
 assert.equal('headers' in opts,false);
 assert.equal(answer.status,'ACCESS_CHALLENGE_OBSERVED');
 assert.equal(answer.challengeObserved,true);
 assert.equal(answer.releaseGate,'HOLD');
});
test('an unauthenticated HTTP 200 must be FAIL_PUBLIC (including 204)',async()=>{
 for(const status of [200,204]){
  const result=await probeUnauthenticatedAccess({
   approvedOrigin:stage,ownerApproved:true,fetchFn:fakeFetch(status)
  });
  assert.equal(result.status,'FAIL_PUBLIC');
  assert.equal(result.challengeObserved,false);
  assert.equal(result.releaseGate,'HOLD');
 }
});
test('a generic 302, http redirect, or spoofed login host is NOT proof of Cloudflare protection',async()=>{
 for(const target of [
  'https://evil.example.com/','http://team.cloudflareaccess.com/cdn-cgi/access/login',
  'https://team.cloudflareaccess.com.evil.example/cdn-cgi/access/login',
  'https://team.cloudflareaccess.com/not-access',
  'https://closet-current-protected.pages.dev/',
  null
 ]){
  const result=await probeUnauthenticatedAccess({
   approvedOrigin:stage,ownerApproved:true,fetchFn:fakeFetch(302,target)
  });
  assert.equal(result.status,'INCONCLUSIVE',String(target));
  assert.equal(result.challengeObserved,false);
 }
});
test('plain 401/403 and network failures can NEVER be represented as verified Cloudflare Access',async()=>{
 for(const status of [401,403]){
  const r=await probeUnauthenticatedAccess({approvedOrigin:stage,ownerApproved:true,fetchFn:fakeFetch(status)});
  assert.equal(r.status,'DENIED_SOURCE_UNVERIFIED');
  assert.equal(r.releaseGate,'HOLD');
 }
 const failure=await probeUnauthenticatedAccess({approvedOrigin:stage,ownerApproved:true,
  fetchFn:async()=>{throw Error('Synthetic connection unavailable');}});
 assert.equal(failure.status,'INCONCLUSIVE');
 assert.equal(failure.releaseGate,'HOLD');
});
test('a successful Access login challenge is STILL not a signed-in owner A/B Storage/RLS test',async()=>{
 const r=await probeUnauthenticatedAccess({
  approvedOrigin:stage,ownerApproved:true,
  fetchFn:fakeFetch(302,'https://real-team.cloudflareaccess.com/cdn-cgi/access/login/fixture')
 });
 assert.equal(r.status,'ACCESS_CHALLENGE_OBSERVED');
 assert.notEqual(r.status,'VERIFIED_ACCESS');
 assert.equal(r.releaseGate,'HOLD');
});
