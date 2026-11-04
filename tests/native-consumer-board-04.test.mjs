import test from 'node:test';
import assert from 'node:assert/strict';
import {createNativeConsumerBoard04,NATIVE_CONSUMER_BOARD_04} from '../research/native-consumer-board-04/consumer-board-controller.mjs';
test('BOARD04 never becomes consumer default or a release through source flags',()=>{
 assert.equal(NATIVE_CONSUMER_BOARD_04.featureGate,'nativeLossless04=research');
 assert.equal(NATIVE_CONSUMER_BOARD_04.nativeConsumerControls,true);
 assert.equal(NATIVE_CONSUMER_BOARD_04.fullBoardCAS,true);
 assert.equal(NATIVE_CONSUMER_BOARD_04.cloudSyncVersionChecked,true);
 assert.equal(NATIVE_CONSUMER_BOARD_04.defaultConsumerUnmodified,true);
 assert.equal(NATIVE_CONSUMER_BOARD_04.productionAuthorized,false);
 assert.equal(NATIVE_CONSUMER_BOARD_04.familyAlpha,'HOLD');
});
test('BOARD04 rejects non native application / missing explicit research opt-in before touching credentials or storage',async()=>{
 const nativeAuth={getAccessToken:async()=>'dummy-native-token'};
 const dom={getElementById:()=>({})};
 const win={location:{search:''},document:dom,closetAuth:nativeAuth};
 await assert.rejects(createNativeConsumerBoard04({win,doc:dom,nativeAuth}),/explicit research-only URL gate/);
 const other={...win,location:{search:'?nativeLossless04=research'}};
 await assert.rejects(createNativeConsumerBoard04({win:other,doc:{getElementById:()=>null},nativeAuth}),/explicit research-only URL gate/);
});
test('BOARD04 source refuses native lossy persistence and cloud restore on dirty edits',async()=>{
 const {readFileSync}=await import('node:fs');
 const native=readFileSync('public/outfit-board.js','utf8');
 const app=readFileSync('public/app.js','utf8');
 const cloud=readFileSync('public/cloud-backup-bridge.js','utf8');
 const state=readFileSync('research/native-consumer-board-04/consumer-board-controller.mjs','utf8');
 assert.ok(native.includes('Unsafe native outfit write blocked'));
 assert.ok(native.includes('nativeLossless04.persist({asNew:false})'));
 assert.ok(native.includes('nativeLossless04.persist({asNew:true})'));
 assert.ok(native.includes('nativeLossless04.selectSaved(index)'));
 assert.ok(native.includes('Missing saved clothing'));
 assert.ok(app.includes('Import blocked in lossless research mode BEFORE any wardrobe write'));
 assert.ok(cloud.includes('window.nativeLossless04Bridge.status().dirty'));
 assert.ok(state.includes('io.compareAndWrite('));
 assert.ok(state.includes('expectedFingerprint:expected,expectedCloud:cloud'));
 assert.ok(state.includes("fail('NATIVE_IMPORT_REQUIRES_VERIFIED_ATOMIC_MIGRATION')"));
 assert.ok(!state.includes('service_role'));
});
