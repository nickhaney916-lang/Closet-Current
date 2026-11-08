import test from 'node:test';
import assert from 'node:assert/strict';
import {SHIRT_SHA176,JEANS_SHA176,inspectSavedShirtDenim176} from '../research/native-owner-saved-shirt-denim-176/admission.mjs';
const owner='owner-A',shirt='owner-A-shirt',jeans='owner-A-jeans';
const valid=()=>({selection:{ownerId:owner,slots:{top:shirt,bottom:jeans}},
 sources:{ownerId:owner,sources:[{id:shirt,sha256:SHIRT_SHA176},{id:jeans,sha256:JEANS_SHA176}]},
 proofs:{p171:true,p173:true,p174:true},
 render:{privateVisible:true,viewerReady:true,bones:163,viewerMode:'shirt-pants',meshCount:2,
  fallbackCount:0,releaseAuthorized:false,productionDeployed:false}});
test('P176 admits the exact existing owner-saved original shirt and public-domain jeans pair',()=>{
 const v=inspectSavedShirtDenim176(valid());assert.equal(v.admitted,true);
 assert.deepEqual(v.sourceSHA256,[SHIRT_SHA176,JEANS_SHA176]);assert.equal(v.bones,163);
 assert.equal(v.sourcePhotosUnmodified,true);assert.equal(v.releaseAuthorized,false);
 assert.equal(v.familyAlpha,'HOLD');
});
test('P176 rejects changed owner, garment IDs, or source bytes',()=>{
 for(const change of [
  d=>d.selection.ownerId='owner-B',d=>d.sources.ownerId='owner-B',
  d=>d.selection.slots.bottom='unknown-jeans',d=>d.sources.sources[1].sha256='0'.repeat(64),
  d=>d.proofs.p171=false,d=>d.proofs.p173=false,d=>d.proofs.p174=false
 ]){const d=valid();change(d);assert.equal(inspectSavedShirtDenim176(d).admitted,false);}
});
test('P176 rejects fallback, incomplete meshes, wrong mode/rig and unauthorized render state',()=>{
 for(const change of [
  d=>d.render.privateVisible=false,d=>d.render.viewerReady=false,d=>d.render.bones=162,
  d=>d.render.viewerMode='shirt',d=>d.render.meshCount=1,d=>d.render.fallbackCount=1,
  d=>d.render.productionDeployed=true,d=>d.render.releaseAuthorized=true
 ]){const d=valid();change(d);assert.equal(inspectSavedShirtDenim176(d).admitted,false);}
});
