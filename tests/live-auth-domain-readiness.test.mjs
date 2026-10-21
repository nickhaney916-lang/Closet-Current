import test from 'node:test';
import assert from 'node:assert/strict';
import {auditLiveEmailDomains,DEPLOYMENTS} from '../scripts/audit-live-auth-email-domains.mjs';

const supabase='https://hlkgymugtfbirlpunsra.supabase.co';
const cloudflare='https://closet-current.pages.dev/';
const github='https://nickhaney916-lang.github.io/Closet-Current/';
const source=String.raw`const URL='https://hlkgymugtfbirlpunsra.supabase.co';
const KEY='synthetic-publishable-key-must-not-print';
const APP_URL='https://nickhaney916-lang.github.io/Closet-Current/';`;
const landing='<!doctype html><title>Closet Current</title><div id="authGate"></div>';
const script=String.raw`const URL='https://hlkgymugtfbirlpunsra.supabase.co';
const APP_URL='https://nickhaney916-lang.github.io/Closet-Current/';
window.closetAuth={};`;
const response=(status,text)=>({status,text:async()=>text});
function mockRequests({broken=[],settings={external:{email:true},disable_signup:false,mailer_autoconfirm:false}}={}){
 const calls=[];
 const fetchImpl=async(url,options)=>{
  calls.push({url,options});
  assert.equal(options.method,'GET','audit must never submit Auth, email, uploads or writes');
  assert.equal(options.redirect,'manual','must not follow unexpected third-party redirects');
  if(broken.includes(url))throw Error('Synthetic timeout containing private-token');
  if(url===supabase+'/auth/v1/settings')return response(200,JSON.stringify(settings));
  if(url===cloudflare||url===github)return response(200,landing);
  if(url===cloudflare+'auth.js'||url===github+'auth.js')return response(200,script);
  throw Error('Unexpected external audit address');
 };
 return {fetchImpl,calls};
}
test('two public hosts and public Auth flags are probed with GET only, never interpreted as release approval',async()=>{
 const {fetchImpl,calls}=mockRequests();
 const result=await auditLiveEmailDomains({fetchImpl,source});
 assert.equal(calls.length,5);
 assert.equal(result.publicAuth.reachable,true);
 assert.equal(result.publicAuth.emailProviderEnabled,true);
 assert.equal(result.publicAuth.signupEnabled,true);
 assert.equal(result.publicAuth.autoConfirmEmail,false);
 assert.equal(result.liveHttpEvidenceComplete,true);
 assert.equal(result.redirectMatchesSharedApp,false);
 assert.equal(result.deployments.githubPages.redirectsToSameDeployment,true);
 assert.equal(result.deployments.cloudflare.redirectsToSameDeployment,false);
 assert.equal(result.releaseDecision,'BLOCKED');
 assert.equal(result.adminRedirectAllowlistVerified,false);
 assert.equal(result.customSmtpVerified,false);
 assert.equal(result.externalInboxDeliveryVerified,false);
 assert.ok(result.releaseBlockers.includes('source-redirect-differs-from-shared-app'));
 assert.equal(calls.filter(c=>c.options.headers?.apikey).length,1,'only settings GET receives public key');
 assert.ok(!JSON.stringify(result).includes('synthetic-publishable-key-must-not-print'));
});
test('unreachable deployments and settings fail closed with clean diagnostics, never fabricate delivery',async()=>{
 const {fetchImpl}=mockRequests({broken:[cloudflare,github+'auth.js',supabase+'/auth/v1/settings']});
 const result=await auditLiveEmailDomains({fetchImpl,source});
 assert.equal(result.deployments.cloudflare.landingIsClosetCurrent,false);
 assert.equal(result.deployments.githubPages.authClientPresent,false);
 assert.equal(result.publicAuth.reachable,false);
 assert.equal(result.publicAuth.emailProviderEnabled,null);
 assert.equal(result.liveHttpEvidenceComplete,false);
 assert.equal(result.releaseDecision,'BLOCKED');
 assert.ok(result.releaseBlockers.includes('external-http-proof-incomplete'));
 assert.ok(!JSON.stringify(result).includes('private-token'));
});
test('unrecognized or changed Auth project halts rather than probing an unrelated customer',async()=>{
 const {fetchImpl,calls}=mockRequests();
 await assert.rejects(auditLiveEmailDomains({
  fetchImpl,source:source.replace(supabase,'https://different-project.supabase.co')
 }),/unexpected Auth project/);
 assert.equal(calls.length,0);
});
test('public Auth settings filter unknown fields and never publish secrets or test credentials',async()=>{
 const {fetchImpl}=mockRequests({settings:{
  external:{email:'yes'},disable_signup:'no',mailer_autoconfirm:'false',
  smtp_pass:'synthetic-private-password',site_url:'secret.example.invalid',
  user:{email:'private@example.invalid'},access_token:'hidden-test-token'
 }});
 const result=await auditLiveEmailDomains({fetchImpl,source});
 assert.equal(result.publicAuth.reachable,true,'endpoint existence is distinct from recognized config');
 assert.equal(result.publicAuth.emailProviderEnabled,null);
 assert.equal(result.publicAuth.signupEnabled,null);
 assert.equal(result.publicAuth.autoConfirmEmail,null);
 for(const forbidden of ['synthetic-private-password','secret.example.invalid',
  'private@example.invalid','hidden-test-token'])
  assert.ok(!JSON.stringify(result).includes(forbidden));
});
test('HTTP redirects are not treated as an application or as proof of an Auth callback',async()=>{
 const calls=[];
 const result=await auditLiveEmailDomains({source,fetchImpl:async(url,options)=>{
  calls.push([url,options.method,options.redirect]);
  return response(302,'https://unrelated.example.invalid/?token=secret');
 }});
 assert.equal(calls.length,5);
 assert.equal(result.liveHttpEvidenceComplete,false);
 assert.equal(result.releaseDecision,'BLOCKED');
 assert.ok(!JSON.stringify(result).includes('secret'));
});
test('source redirect on Cloudflare still cannot prove SMTP, dashboard allowlist or inbox acceptance',async()=>{
 const target=source.replace('https://nickhaney916-lang.github.io/Closet-Current/',
  'https://closet-current.pages.dev/');
 const {fetchImpl}=mockRequests();
 const result=await auditLiveEmailDomains({fetchImpl,source:target,deployments:DEPLOYMENTS});
 assert.equal(result.redirectMatchesSharedApp,true);
 assert.equal(result.releaseDecision,'BLOCKED');
 assert.equal(result.externalInboxDeliveryVerified,false);
 assert.ok(result.releaseBlockers.includes('smtp-and-external-inbox-not-verified'));
});
