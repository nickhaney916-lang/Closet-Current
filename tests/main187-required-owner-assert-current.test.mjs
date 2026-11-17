/**
 * MAIN187 research-only signed-session preflight contract.
 * Synthetic owner IDs and simulated private connection references only.
 * No auth tokens, photo pixels, remote services, storage writes or deployment.
 * The default original-photo 2D viewer requires a callable lease assertion;
 * this preflight must not be weaker than its own consumer.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {preflightOwnedOutfit1054} from '../public/native-outfit-source-plan-p99.mjs';

const OWNER='m187-synthetic-owner';
function scenario(assertCurrent){
 const authRef={user:{id:OWNER}};
 if(assertCurrent!==undefined)authRef.assertCurrent=assertCurrent;
 const session={
  authenticated:true,ownerId:OWNER,epoch:'m187-epoch-verified',
  operationEpoch:2,authRef,
  privateDbName:'closet-current-user-'+OWNER,
  privateDbRef:{name:'closet-current-user-'+OWNER}
 };
 let reads=0;
 const args={
  getSession:()=>session,
  readOwnerItems:async()=>{reads++;throw Error('M187_PRIVATE_READ_REACHED');},
  cleanBoard:()=>({slots:{top:'test-item'}}),
  board:{slots:{top:'test-item'}}
 };
 return {session,args,reads:()=>reads};
}
test('M187 missing lease assertion is rejected BEFORE ANY owner-private read',async()=>{
 const h=scenario(undefined);
 await assert.rejects(preflightOwnedOutfit1054(h.args),
  /MAIN1054 signed owner session and private database required/);
 assert.equal(h.reads(),0);
});
test('M187 non-callable lease assertions fail closed before private read',async()=>{
 for(const value of [null,false,0,'current',{}]){
  const h=scenario(value);
  await assert.rejects(preflightOwnedOutfit1054(h.args),
   /MAIN1054 signed owner session and private database required/);
  assert.equal(h.reads(),0);
 }
});
test('M187 throwing current-session assertion rejects before owner-private read',async()=>{
 const h=scenario(()=>{throw Error('synthetic private lease revoked');});
 await assert.rejects(preflightOwnedOutfit1054(h.args),
  /MAIN1054 signed owner session and private database required/);
 assert.equal(h.reads(),0);
});
test('M187 valid current-session assertion permits ONLY the existing owner-private boundary',async()=>{
 let assertions=0;
 const h=scenario(()=>{assertions++;});
 await assert.rejects(preflightOwnedOutfit1054(h.args),/M187_PRIVATE_READ_REACHED/);
 assert.equal(h.reads(),1);
 assert.equal(assertions,1);
});
test('M187 same-owner session lease revoked DURING async private read is rejected',async()=>{
 let current=true,assertions=0,reads=0;
 const h=scenario(()=>{assertions++;if(!current)throw Error('revoked');});
 h.args.readOwnerItems=async()=>{reads++;current=false;return [];};
 await assert.rejects(preflightOwnedOutfit1054(h.args),
  /MAIN1054 signed owner session and private database required/);
 assert.equal(reads,1);
 assert.ok(assertions>=2);
});
