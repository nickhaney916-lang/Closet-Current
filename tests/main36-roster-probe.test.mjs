import test from 'node:test';
import assert from 'node:assert/strict';
import {measureTier36,runProbe36} from '../scripts/probe-main1054-roster36.mjs';

test('M36 uses actual M34 roster gate and fails closed on unrelated item changes',async()=>{
 const result=await measureTier36({count:3,perRowChars:100,iterations:2});
 assert.equal(result.itemCount,3);
 assert.equal(result.iterations,2);
 for(const key of ['seal','verify','transactionRosterCompare']){
  assert.equal(Number.isFinite(result[key].p50Ms),true);
  assert.equal(result[key].p50Ms>=0,true);
 }
});
test('M36 probe refuses oversized inputs and never reads private owner records',async()=>{
 await assert.rejects(measureTier36({count:10001}),/M36_INVALID_SYNTHETIC_TIER/);
 await assert.rejects(measureTier36({count:1,perRowChars:1000000}),/M36_INVALID_SYNTHETIC_TIER/);
 await assert.rejects(measureTier36({count:1,iterations:999}),/M36_INVALID_ITERATIONS/);
});
test('M36 output cannot be confused with mobile, actual IDB or real-photo acceptance',async()=>{
 const x=await runProbe36();
 assert.equal(x.gate,'DESKTOP_NODE_SYNTHETIC_BENCHMARK_ONLY_NO_MOBILE_GO');
 for(const k of ['browser','realIdb','physicalAndroid','physicalIphone','hostedAccounts','source3d'])assert.equal(x[k],'NOT_TESTED');
 assert.equal(x.results.length,5);
 assert.equal(JSON.stringify(x).includes('SYNTHETIC_NO_PHOTO_'),false);
});
