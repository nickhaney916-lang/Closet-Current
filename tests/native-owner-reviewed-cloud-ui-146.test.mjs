import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ownerReviewedMode146,mountOwnerReviewedCloud146} from '../research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs';

const loc=(hostname,search,protocol='http:')=>({hostname,search,protocol,origin:protocol+'//'+hostname});
test('P146 only enables exact two flags on loopback HTTP research hosts',()=>{
 for(const hostname of ['localhost','127.0.0.1','[::1]'])
  assert.equal(ownerReviewedMode146(loc(hostname,'?ownerReview145=research&ownerReview146=research')),true);
 for(const x of [
  loc('localhost',''),loc('localhost','?ownerReview146=research'),
  loc('localhost','?ownerReview145=research'),
  loc('localhost','?ownerReview145=research&ownerReview146=after'),
  loc('closet.example','?ownerReview145=research&ownerReview146=research'),
  loc('staging.closet.example','?ownerReview145=research&ownerReview146=research'),
  loc('sub.localhost','?ownerReview145=research&ownerReview146=research'),
  loc('127.0.0.2','?ownerReview145=research&ownerReview146=research'),
  loc('localhost','?ownerReview145=research&ownerReview146=research','https:')
 ])assert.equal(ownerReviewedMode146(x),false,JSON.stringify(x));
});
test('P146 refuses mounting without local review mode before touching any owner account or network',async()=>{
 const auth={user:{id:'11111111-1111-4111-8111-111111111111'},getAccessToken(){throw Error('not supposed to read token');}};
 await assert.rejects(mountOwnerReviewedCloud146({
  auth,db:{name:'closet-current-user-11111111-1111-4111-8111-111111111111'},
  loc:loc('production.example','?ownerReview145=research&ownerReview146=research'),
  fetcher(){throw Error('network must not occur');}
 }),/trusted loopback research mode/);
});
test('P146 real app bridge retains legacy path unless both flags and localhost are satisfied',()=>{
 const script=readFileSync('public/cloud-backup-bridge.js','utf8');
 const research=readFileSync('research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs','utf8');
 assert.match(script,/location\.protocol==='http:'/);
 assert.match(script,/get\('ownerReview145'\)==='research'/);
 assert.match(script,/get\('ownerReview146'\)==='research'/);
 assert.match(script,/if\(paused\?\.paused!==true\)/);
 assert.match(research,/createLocalRemoteFence134/);
 assert.match(research,/createCloudRestoreGuard137/);
 assert.match(research,/SYNTHETIC_TOKEN_PREFIX/);
 assert.match(research,/redirect:'error',credentials:'omit'/);
 assert.match(research,/globalThis\.window\?\.addEventListener\('closet:session-locked'/);
 assert.match(research,/no automatic merge/i);
});
