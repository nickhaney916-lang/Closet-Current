import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {RED_SHIRT,verifyRedSourceBytes,verifySavedRedShirt,
  requireRedShirtSource,deriveRedShirtCutout} from '../research/photo-fit-3d-02/source-shirt.mjs';
import {existingVettedSourceSHAs,assessWardrobePhoto01}
 from '../research/user-photo-3d-01/photo-readiness.mjs';
const bytes=readFileSync('benchmark/fixtures/commons-0002.jpg');
const sha=buf=>createHash('sha256').update(buf).digest('hex');
const owner='research-owner-A';
function item(){
 return {id:'owner-A-new-red',ownerId:owner,category:'Tops',itemType:'T-shirt',
  userAdjusted:true,sourceSHA256:RED_SHIRT.sha256,
  originalPhoto:{sha256:RED_SHIRT.sha256,image:'data:image/jpeg;base64,'+bytes.toString('base64')},
  futureMetadata:{retain:'yes'},outfit3dId:'record-marker'};
}
function saved(){return {id:'saved-22',ownerId:owner,outfit3dId:'persisted-3d-id',
  slots:{top:'owner-A-new-red',layer2:'missing-outerwear'},
  metadata:{newFutureFields:true}};}
test('the independently licensed new red JPEG is not the existing donor shirt',()=>{
 const locks=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
 const record=locks.find(x=>x.id===RED_SHIRT.id);
 assert.equal(sha(bytes),RED_SHIRT.sha256);
 assert.equal(record.sha256,RED_SHIRT.sha256);
 assert.equal(record.verified,true);assert.equal(record.attribution.license,'CC BY-SA 3.0');
 assert.notEqual(record.sha256,existingVettedSourceSHAs.shirt);
 assert.equal(RED_SHIRT.donorMeshReused,false);
 assert.equal(RED_SHIRT.productionAuthorized,false);
});
test('verify bytes is fail-closed, never reencodes the source',async()=>{
 const before=Buffer.from(bytes);
 const proof=await verifyRedSourceBytes(new Uint8Array(bytes),{subtle:webcrypto.subtle});
 assert.equal(proof.sha256,RED_SHIRT.sha256);
 assert.equal(proof.byteLength,bytes.length);
 assert.deepEqual(bytes,before);
 const bad=Uint8Array.from(bytes);bad[Math.floor(bad.length*.66)]^=1;
 await assert.rejects(verifyRedSourceBytes(bad,{subtle:webcrypto.subtle}),/unrecognized original source SHA/);
 await assert.rejects(verifyRedSourceBytes(Uint8Array.from([255,216,255,217]),{subtle:webcrypto.subtle}),/complete original JPEG/);
});
test('real saved owner shirt slot and identity stay unchanged, foreign owner fails closed',()=>{
 const i=item(),s=saved(),before=structuredClone({i,s});
 const receipt=verifySavedRedShirt({item:i,saved:s,ownerId:owner,generation:7});
 assert.equal(receipt.itemId,i.id);assert.equal(receipt.savedId,s.id);
 assert.equal(receipt.outfit3dId,'persisted-3d-id');
 assert.equal(receipt.readOnly,true);
 assert.deepEqual({i,s},before);
 assert.throws(()=>verifySavedRedShirt({item:i,saved:s,ownerId:'research-owner-B',generation:7}),/owner-saved/);
 assert.throws(()=>verifySavedRedShirt({item:{...i,sourceSHA256:'0'.repeat(64)},saved:s,ownerId:owner,generation:7}),/owner-saved/);
 assert.throws(()=>verifySavedRedShirt({item:i,saved:{...s,slots:{top:'someone-else'}},ownerId:owner,generation:7}),/owner-saved/);
 assert.throws(()=>verifySavedRedShirt({item:i,saved:s,ownerId:owner,generation:NaN}),/owner-saved/);
});
test('an unsigned fake geometry cannot mint a photo-bound source capability',()=>{
 assert.throws(()=>requireRedShirtSource({id:RED_SHIRT.id,sourceSHA256:RED_SHIRT.sha256}),/genuine SHA-locked/);
 assert.throws(()=>deriveRedShirtCutout({naturalWidth:12,naturalHeight:12},{documentRef:null}),/decoded original/);
});
test('actual photo readiness still honestly says Needs Review, never 3D Ready',async()=>{
 const verdict=await assessWardrobePhoto01(item(),{ownerId:owner,subtle:webcrypto.subtle});
 assert.equal(verdict.readiness,'Needs Review');
 assert.equal(verdict.originalPhotoVerified,true);
 assert.equal(verdict.rendered3D,false);
 assert.equal(verdict.sourceSHA256,RED_SHIRT.sha256);
 assert.equal(verdict.productionAuthorized,false);
});
