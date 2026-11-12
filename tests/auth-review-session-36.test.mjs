import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');
const auth=read('public/auth.js'),app=read('public/app.js');
const review=read('research/multi-garment-capture-01/review-ui.mjs');
const outfit=read('public/outfit-capture.js');
const browser=read('scripts/verify-auth-review-session-36.mjs');
const signed=read('research/auth-review-session-36/signed-local.mjs');

test('AUTH36 login epoch and cross-tab invalidation must predate owner-private DB authority',()=>{
 assert.match(auth,/window\.closetAuth\.assertCurrent=/);
 assert.match(auth,/window\.addEventListener\('storage'/);
 assert.match(auth,/window\.addEventListener\('pageshow'/);
 assert.match(auth,/window\.dispatchEvent\(new Event\('closet:session-locked'\)\)/);
 assert.match(auth,/if\(session&&stillCurrent\(\)\)localStorage\.removeItem\(STORE\)/);
 assert.match(auth,/lockAccount\(false\)/);
 assert.match(auth,/const original=localStorage\.getItem\(STORE\)/);
 assert.match(auth,/if\(localStorage\.getItem\(STORE\)!==snapshot\)/);
});

test('AUTH36 app checks owner epoch around asynchronous preflight and closes owner-private IDB',()=>{
 // AUTH36 now verifies the stricter enqueue-time signed owner/DB/epoch lease,
 // not the original mutable-global `beforeWrite(db)` around two auth checks.
 assert.match(app,/const auth=window\.closetAuth,owner=auth\?\.user\?\.id,ownerDB=db,epoch=captureOperationEpoch/);
 assert.match(app,/const result=writes\.then\(async\(\)=>\{[\s\S]*?assertQueueLease\(\);[\s\S]*?await window\.closetCloud\?\.beforeWrite\(ownerDB\);[\s\S]*?assertQueueLease\(\)/);
 assert.match(app,/writes=Promise\.resolve\(\)/);
 assert.match(app,/window\.addEventListener\('closet:session-locked'/);
 assert.match(app,/try\{db\?\.close\(\);\}catch\{\}/);
 assert.match(app,/db=null;items=\[\];batch=\[\];/);
 assert.match(app,/connection\.close\(\);return;/);
 // Both owner-private stores must finish on the exact initiating DB before
 // either roster is published; a revoked account cannot render old clothing.
 assert.match(app,/const loadedItems=await readAllFrom\(connection\)/);
 assert.match(app,/const loadedDraft=await readDraftFrom\(connection\)/);
 assert.match(app,/if\(!current\(\)\)\{connection\.close\(\);return;\}/);
 assert.match(app,/db=connection;items=nextItems;batch=nextBatch/);
});

test('AUTH36 removes cached original photos and blocks both old workers and crop review',()=>{
 assert.match(app,/localWorker\?\.terminate\(\)/);
 assert.match(app,/image\.removeAttribute\('src'\)/);
 assert.match(outfit,/window\.addEventListener\('closet:session-locked'/);
 assert.match(outfit,/lastOutfitPhoto='';lastOutfitSourceProof=null;outfitActiveId=null/);
 assert.match(review,/window\.addEventListener\('closet:session-locked'/);
 assert.match(review,/snapshotConfirmations34\(state\.pieces,schema,proof\)/);
 assert.match(review,/currentOwner:\(\)=>currentReview\(view,epoch\)\?getOwner\(\):null/);
});

test('AUTH36 browser distinguishes synthetic Auth from signed disposable backend',()=>{
 assert.match(browser,/realSignedBrowserToCloud:false/);
 assert.match(browser,/authTransport:'synthetic HTTP fixture, NOT signed browser'/);
 assert.match(browser,/segFormerActuallyRun:false/);
 assert.match(browser,/realNativeIndexedDB:true/);
 assert.match(browser,/staleTabLocked:true/);
 assert.match(browser,/previousAccountReopens:true/);
 assert.match(browser,/sourceSHA256/);
 assert.match(browser,/originalPhoto\.image/);
 assert.match(browser,/humanConfirmed:true/);
 assert.doesNotMatch(browser,/process\.env\.(SUPABASE|SERVICE_ROLE|ANON_KEY)/);
});

test('AUTH36 signed backend only allows disposable loopback and real signed two-user denial',()=>{
 assert.match(signed,/127\.0\.0\.1/);
 assert.match(signed,/Disposable loopback only/);
 assert.match(signed,/distinctAuthenticatedOwners:true/);
 assert.match(signed,/against/);
 assert.match(signed,/Anonymous/);
 assert.match(signed,/wrong backup revision/);
 assert.match(signed,/Naturally expired signed credential denied/);
});
