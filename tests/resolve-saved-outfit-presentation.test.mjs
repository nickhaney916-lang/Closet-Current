import assert from 'node:assert/strict';
import {test} from 'node:test';
import {webcrypto} from 'node:crypto';
import {verifyCapturedOutfitBoard} from '../public/verified-captured-outfit-board.mjs';
import {createVerifiedOutfitEnvelope} from '../public/saved-outfit-3d-compatibility.mjs';
import {resolveSavedOutfitPresentation} from '../public/resolve-saved-outfit-presentation.mjs';
const jpeg=n=>'data:image/jpeg;base64,'+Buffer.from([255,216,n,255,217]).toString('base64');
const item=n=>({id:'shirt',category:'Tops',colorHex:'#abcdef',image:jpeg(8),originalPhoto:{image:jpeg(n)},outfitSourceId:'capture-1'});
const board={slots:{top:'shirt'}};
const owns=()=>true;
test('legacy saved board uses 2D without claiming source verification',async()=>{
 const result=await resolveSavedOutfitPresentation(board,[item(1)],'owner',owns,webcrypto);
 assert.equal(result.mode,'2d');
 assert.equal(result.verificationFailed,undefined);
});
test('verified saved board restores placeholder 3D only with unchanged source',async()=>{
 const saved=await verifyCapturedOutfitBoard(board,[item(1)],'owner',owns,webcrypto);
 const envelope=createVerifiedOutfitEnvelope(board,saved);
 const result=await resolveSavedOutfitPresentation(envelope,[item(1)],'owner',owns,webcrypto);
 assert.equal(result.mode,'3d-placeholder');
 assert.equal(result.verified.selected[0].itemId,'shirt');
});
test('changed original falls back to 2D while deleted garment becomes unavailable',async()=>{
 const saved=await verifyCapturedOutfitBoard(board,[item(1)],'owner',owns,webcrypto);
 const envelope=createVerifiedOutfitEnvelope(board,saved);
 for(const [items,scope] of [[[item(2)],'owner']]){
  const result=await resolveSavedOutfitPresentation(envelope,items,scope,owns,webcrypto);
  assert.equal(result.mode,'2d');
  assert.equal(result.verificationFailed,true);
 }
});
test('unsupported and malformed verified records never masquerade as legacy',async()=>{
 const result=await resolveSavedOutfitPresentation({schemaVersion:99,board},[item(1)],'owner',owns,webcrypto);
 assert.equal(result.mode,'unavailable');
});

test('cross-account verified saved outfit is unavailable, not downgraded to 2D',async()=>{
 const saved=await verifyCapturedOutfitBoard(board,[item(1)],'owner',owns,webcrypto);
 const envelope=createVerifiedOutfitEnvelope(board,saved);
 const result=await resolveSavedOutfitPresentation(envelope,[item(1)],'other',owns,webcrypto);
 assert.equal(result.mode,'unavailable');
 assert.equal(result.board,undefined);
});

test('missing account context and failed item ownership never expose saved board',async()=>{
 const saved=await verifyCapturedOutfitBoard(board,[item(1)],'owner',owns,webcrypto);
 const envelope=createVerifiedOutfitEnvelope(board,saved);
 for(const [scope,verifier] of [['',owns],['owner',undefined],['owner',()=>false]]){
  const result=await resolveSavedOutfitPresentation(envelope,[item(1)],scope,verifier,webcrypto);
  assert.equal(result.mode,'unavailable');
  assert.equal(result.board,undefined);
 }
});

test('legacy 2D board rejects foreign, missing and ambiguous garment records',async()=>{
 for(const [items,verifier] of [[[item(1)],()=>false],[[],owns],[[item(1),item(1)],owns]]){
  const result=await resolveSavedOutfitPresentation(board,items,'owner',verifier,webcrypto);
  assert.equal(result.mode,'unavailable');
  assert.equal(result.board,undefined);
 }
});

test('missing garment cannot be exposed through failed 3D verification fallback',async()=>{
 const saved=await verifyCapturedOutfitBoard(board,[item(1)],'owner',owns,webcrypto);
 const result=await resolveSavedOutfitPresentation(createVerifiedOutfitEnvelope(board,saved),[],'owner',owns,webcrypto);
 assert.equal(result.mode,'unavailable');
 assert.equal(result.board,undefined);
});
