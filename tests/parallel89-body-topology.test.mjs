import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {auditOriginalAnatomicalBodyIndexTopology89} from '../research/parallel89/body-topology89.mjs';
const make=()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',
 new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0,0,0,1],3));
 g.setIndex([0,2,1,0,1,3,0,3,2,1,2,3]);return g;};
test('closed correctly oriented tetra still NEVER becomes signed garment/body clearance',()=>{
 const g=make(),r=auditOriginalAnatomicalBodyIndexTopology89(g);g.dispose();
 assert.equal(r.status,'ORIGINAL_INDEX_EDGE_TOPOLOGY_CLOSED_BUT_INSIDE_OUTSIDE_NOT_PROVED');
 assert.equal(r.originalSourceTriangleFaces,4);
 assert.equal(r.uniqueIndexEdges,6);
 assert.equal(r.boundaryIndexEdges,0);
 assert.equal(r.nonManifoldIndexEdges,0);
 assert.equal(r.sameWindingAdjacentIndexEdges,0);
 assert.equal(r.staticUnsignedGapDoesNotProveOutsideBody,true);
 assert.equal(r.actual3DClothSignedClearanceUnknown,true);
 assert.equal(r.consumer3DAuthorized,false);
 assert.equal(r.signedOutsideBodyCertified,false);
 assert.equal(r.meshPhysicalVolumeCertified,false);
 assert.equal(r.familyAlpha,'HOLD');
});
test('source mesh with genuine indexed boundary is NOT declared closed',()=>{
 const g=make();g.setIndex([0,2,1,0,1,3,0,3,2]);
 const r=auditOriginalAnatomicalBodyIndexTopology89(g);g.dispose();
 assert.equal(r.status,'ORIGINAL_INDEX_TOPOLOGY_NOT_A_CERTIFIED_CLOSED_ORIENTED_VOLUME');
 assert.equal(r.boundaryIndexEdges,3);
 assert.equal(r.signedOutsideBodyCertified,false);
});
test('same-direction shared original body edge is an explicit signed-winding blocker',()=>{
 const g=make();g.setIndex([0,2,1,0,3,1,0,3,2,1,2,3]);
 const r=auditOriginalAnatomicalBodyIndexTopology89(g);g.dispose();
 assert.equal(r.sameWindingAdjacentIndexEdges,3);
 assert.equal(r.status,'ORIGINAL_INDEX_TOPOLOGY_NOT_A_CERTIFIED_CLOSED_ORIENTED_VOLUME');
});
test('duplicated triangles cause non-manifold source original edges, no garment clearance',()=>{
 const g=make();g.setIndex([0,2,1,0,1,3,0,3,2,1,2,3,0,2,1]);
 const r=auditOriginalAnatomicalBodyIndexTopology89(g);g.dispose();
 assert.ok(r.nonManifoldIndexEdges>=1);assert.equal(r.signedOutsideBodyCertified,false);
});
test('nonindexed triangles remain an honest open indexed topology',()=>{
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute([
  0,0,0,1,0,0,0,1,0,
  0,0,0,0,1,0,0,0,1,
  1,0,0,0,0,1,0,1,0,
  0,0,0,0,0,1,1,0,0
 ],3));
 const r=auditOriginalAnatomicalBodyIndexTopology89(g);g.dispose();
 assert.equal(r.sourceIsIndexed,false);
 assert.ok(r.boundaryIndexEdges>0);
 assert.equal(r.signedOutsideBodyCertified,false);
});
test('repeated original face vertices refuse closed-volume status',()=>{
 const g=make();g.setIndex([0,0,1,0,1,3,0,3,2,1,2,3]);
 const r=auditOriginalAnatomicalBodyIndexTopology89(g);g.dispose();
 assert.equal(r.repeatedVertexTriangleFaces,1);
 assert.equal(r.status,'ORIGINAL_INDEX_TOPOLOGY_NOT_A_CERTIFIED_CLOSED_ORIENTED_VOLUME');
});
test('forged out-of-range original source indices fail closed',()=>{
 const g=make();g.setIndex([0,2,1,0,1,3,0,3,2,1,2,99]);
 const r=auditOriginalAnatomicalBodyIndexTopology89(g);g.dispose();
 assert.equal(r.status,'BODY_INDEX_TOPOLOGY_UNVERIFIED');
 assert.equal(r.consumer3DAuthorized,false);
});
test('nonfinite original vertex data fails closed',()=>{
 const g=make();g.attributes.position.setX(0,NaN);
 const r=auditOriginalAnatomicalBodyIndexTopology89(g);g.dispose();
 assert.equal(r.status,'BODY_INDEX_TOPOLOGY_UNVERIFIED');
});
test('missing source positions fail closed',()=>{
 const r=auditOriginalAnatomicalBodyIndexTopology89({});
 assert.equal(r.status,'BODY_INDEX_TOPOLOGY_UNVERIFIED');
 assert.equal(r.sourcePhoto2DFallbackRequired,true);
});
