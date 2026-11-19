/**
 * MAIN1054 M254: the publicly exported 2D source-plan preflight must never
 * call a private wardrobe provider until the current signed session supplies
 * and executes an explicit live assertion. Synthetic owner-only data here.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {preflightOwnedOutfit1054} from '../public/native-outfit-source-plan-p99.mjs';

const OWNER='synthetic-m254-owner';
const expected='MAIN1054 signed owner session and private database required';
function makeSession(assertion=()=>{}){
 const authRef={user:{id:OWNER},assertCurrent:assertion};
 return {authenticated:true,ownerId:OWNER,epoch:5,
  privateDbName:'closet-current-user-'+OWNER,authRef,
  privateDbRef:{name:'closet-current-user-'+OWNER},operationEpoch:14};
}
function attempt(getSession,readOwnerItems){
 return preflightOwnedOutfit1054({
  getSession,
  readOwnerItems,
  cleanBoard:()=>({slots:{top:'m254-garment'}}),
  board:{slots:{top:'m254-garment'}}
 });
}
test('M254 missing native current-session assertion denies before any wardrobe read',async()=>{
 for(const invalid of [undefined,null,false,'signed',3,{}]){
  const session=makeSession();
  session.authRef.assertCurrent=invalid;
  let reads=0;
  await assert.rejects(attempt(()=>session,async()=>{
   reads++;throw Error('UNSAFE_READ_WAS_REACHED');
  }),{message:expected});
  assert.equal(reads,0,'unverified signed session read private wardrobe');
 }
});

test('M254 accessor rejection is sanitized without reaching private wardrobe',async()=>{
 const session=makeSession();
 Object.defineProperty(session.authRef,'assertCurrent',{
  get(){throw Error('SYNTHETIC_SECRET_DO_NOT_EXPOSE');}
 });
 let reads=0;
 await assert.rejects(attempt(()=>session,async()=>{reads++;return [];}),{message:expected});
 assert.equal(reads,0);
});

test('M254 revoked native assertion denies before any private wardrobe read',async()=>{
 let assertions=0,reads=0;
 const session=makeSession(()=>{assertions++;throw Error('SYNTHETIC_REVOKED_TOKEN');});
 await assert.rejects(attempt(()=>session,async()=>{reads++;return [];}),{message:expected});
 assert.equal(assertions,1);
 assert.equal(reads,0);
});

test('M254 callable current-session verifier runs before entering the private reader',async()=>{
 let calls=0,reads=0;
 const session=makeSession(()=>{calls++;});
 await assert.rejects(attempt(()=>session,async()=>{
  assert.equal(calls,1,'private read started without active assertCurrent');
  reads++;throw Error('M254_READ_BOUNDARY_REACHED');
 }),/M254_READ_BOUNDARY_REACHED/);
 assert.equal(calls,1);
 assert.equal(reads,1);
});

test('M254 same-owner re-login invalidates exact auth-reference after awaited private read',async()=>{
 let session=makeSession(()=>{});
 let reads=0;
 await assert.rejects(attempt(()=>session,async()=>{
  reads++;
  // Same owner, same epoch, same private database: a replacement auth object
  // is nevertheless a distinct live session and must cancel the operation.
  session={...session,authRef:{user:{id:OWNER},assertCurrent(){}}};
  return [];
 }),/MAIN1054 owner session changed/);
 assert.equal(reads,1);
});

test('M254 expired session during awaited reader is refused even with identical references',async()=>{
 let revoked=false,reads=0;
 const session=makeSession(()=>{if(revoked)throw Error('session expired');});
 await assert.rejects(attempt(()=>session,async()=>{
  reads++;revoked=true;return [];
 }),{message:expected});
 assert.equal(reads,1);
});
