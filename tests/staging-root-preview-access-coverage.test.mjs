import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {probeAnonymousAccess} from '../scripts/check-staging-anonymous-access.mjs';
const root='https://closet-current-staging.pages.dev';
const preview='https://preview.closet-current-staging.pages.dev';
const redirect=()=>new Response(null,{status:302,headers:{location:'https://pilot.cloudflareaccess.com/cdn-cgi/access/login/app'}});
const publicAsset=()=>new Response('SYNTHETIC PUBLIC ASSET',{status:200});
test('root host public remains BLOCKED even with protected preview and protected preview scripts',async()=>{
 const result=await probeAnonymousAccess([root,preview],{paths:['/','/icons/icon-192.png'],
  request:async url=>url.startsWith(root+'/')?publicAsset():redirect()});
 assert.equal(result.anonymousProbePassed,false);
 assert.equal(result.results.filter(x=>x.origin===root&&x.outcome==='PUBLIC_RESPONSE').length,2);
 assert.equal(result.productionPromotion,'BLOCKED');
});
test('preview static asset public remains BLOCKED even when project root is protected',async()=>{
 const result=await probeAnonymousAccess([root,preview],{paths:['/','/icons/icon-192.png'],
  request:async url=>url===preview+'/icons/icon-192.png'?publicAsset():redirect()});
 assert.equal(result.anonymousProbePassed,false);
 assert.deepEqual(result.results.filter(x=>x.outcome==='PUBLIC_RESPONSE').map(x=>x.path),['/icons/icon-192.png']);
});
test('synthetic redirects on BOTH root and preview cannot certify actual Cloudflare Access',async()=>{
 const result=await probeAnonymousAccess([root,preview],{paths:['/','/app.js'],
  request:async()=>redirect()});
 assert.equal(result.anonymousProbePassed,true);
 assert.equal(result.privateCloudflareAccessPolicyVerified,false);
 assert.equal(result.previewInventoryComplete,false);
 assert.equal(result.authorizedTesterAccessVerified,false);
 assert.equal(result.restrictedStagingDeployed,false);
 assert.equal(result.productionPromotion,'BLOCKED');
});
test('runbook requires TWO distinct Access app host classes, custom domain checks and cost approval',()=>{
 const s=fs.readFileSync(new URL('../docs/RESTRICTED-STAGING-SETUP-20261021.md',import.meta.url),'utf8');
 for(const text of ['does not','initially protects','project root','preview','wildcard',
  'two','custom','free projects','Drive Duel','do not upload',
  'https://developers.cloudflare.com/pages/platform/known-issues',
  'https://supabase.com/docs/guides/platform/billing-on-supabase']){
  assert.ok(s.toLowerCase().includes(text.toLowerCase()),'Missing security requirement: '+text);
 }
 assert.match(s,/do not pause or alter Drive Duel/i);
 assert.match(s,/not permission or assurance of capacity/i);
 assert.match(s,/neither|not.*(?:verified|approval)/i);
});
