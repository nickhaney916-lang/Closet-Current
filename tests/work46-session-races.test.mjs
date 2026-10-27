import {test} from 'node:test';
import assert from 'node:assert/strict';
import {harness,A,B} from './fixtures/family-alpha-29.mjs';

function deferred(){let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve};}
test('wardrobe mutation while session verification is pending prevents generated results',async()=>{
 const h=harness(),wait=deferred();h.verify=()=>wait.promise;
 const pending=h.client.generate('pin');h.clothes[0].color='Red';wait.resolve({ownerId:A,sessionGeneration:1});
 await assert.rejects(pending,/Clothes or account changed/);assert.throws(()=>h.client.getResult());assert.equal(h.writes,0);
});
test('session generation change during verification fails closed even with the same owner',async()=>{
 const h=harness(),wait=deferred();h.verify=()=>wait.promise;
 const pending=h.client.generate('pin');h.ctx={...h.ctx,sessionGeneration:2};wait.resolve({ownerId:A,sessionGeneration:1});
 await assert.rejects(pending);assert.throws(()=>h.client.getResult());assert.equal(h.writes,0);
});
test('cross-account replacement during verification rejects old owner results',async()=>{
 const h=harness(),wait=deferred();h.verify=()=>wait.promise;
 const pending=h.client.generate('pin');h.ctx={authenticatedUserId:B,currentUserId:B,cloudOwnerId:B,indexedDbName:'closet-current-user-'+B,sessionGeneration:2};wait.resolve({ownerId:A,sessionGeneration:1});
 await assert.rejects(pending);assert.throws(()=>h.client.getResult());assert.equal(h.writes,0);
});
test('transient verification error may be retried without altering the wardrobe',async()=>{
 const h=harness(),before=JSON.stringify(h.clothes);h.verify=async()=>{throw Error('offline synthetic verification failure');};
 await assert.rejects(h.client.generate('pin'));assert.equal(JSON.stringify(h.clothes),before);assert.equal(h.writes,0);
 h.verify=async()=>({ownerId:A,sessionGeneration:1});assert.equal((await h.client.generate('pin')).options.length,3);
});
