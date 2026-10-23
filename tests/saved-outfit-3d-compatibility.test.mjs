import assert from 'node:assert/strict';
import {test} from 'node:test';
import {classifySavedOutfitFor3D,createVerifiedOutfitEnvelope} from '../public/saved-outfit-3d-compatibility.mjs';
const board={slots:{top:'shirt',shoes:'shoes'}};
const snapshot={accountId:'account-1',selected:[{slot:'top',itemId:'shirt',sourceIdentity:'photo-1',sourceVersion:'sha256-1'}]};
test('legacy saved boards stay 2D rather than silently gaining 3D verification',()=>{
 const result=classifySavedOutfitFor3D(board);
 assert.equal(result.mode,'legacy-2d');
 assert.equal(result.board,board);
});
test('versioned verified envelopes require re-verification at restore',()=>{
 const envelope=createVerifiedOutfitEnvelope(board,snapshot);
 assert.equal(classifySavedOutfitFor3D(envelope).mode,'verify-3d');
 assert.notEqual(envelope.board,board);
 assert.notEqual(envelope.verifiedSnapshot,snapshot);
});
test('rejects unversioned impostors, unknown versions and missing verification',()=>{
 assert.equal(classifySavedOutfitFor3D({slots:null}).mode,'invalid');
 assert.equal(classifySavedOutfitFor3D({schemaVersion:99,board,verifiedSnapshot:snapshot}).mode,'unsupported');
 assert.equal(classifySavedOutfitFor3D({schemaVersion:1,board}).mode,'invalid');
 assert.throws(()=>createVerifiedOutfitEnvelope(board,{selected:[]}),/snapshot/);
});
