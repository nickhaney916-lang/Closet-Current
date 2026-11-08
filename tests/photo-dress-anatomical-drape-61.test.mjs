import test from 'node:test';
import assert from 'node:assert/strict';
import {DRESS_DRAPE_61,skirtFold61,refinePhotographedDress61} from '../research/photo-dress-anatomical-drape-61/dress-drape.mjs';

test('P61 produces bounded, smooth, asymmetric physical skirt fall away from the protected center-front photo',()=>{
 const at=(theta,t)=>skirtFold61({theta,t});
 const front=at(0,.9),side=at(Math.PI/2,.9),rear=at(Math.PI,.9);
 assert.equal(front.outward,0);assert.equal(front.drop,0);
 assert.ok(side.outward>0&&side.drop>0);assert.ok(rear.outward>0&&rear.drop>0);
 assert.ok(side.outward<=DRESS_DRAPE_61.skirtOutwardMeters);
 assert.ok(side.drop<=DRESS_DRAPE_61.maxHemDropMeters);
 assert.notEqual(side.outward,rear.outward,'Pleat fall is not rotationally uniform');
 const a=at(1.2,.75),b=at(1.2001,.75);
 assert.ok(Math.abs(a.outward-b.outward)<.0001);
});

test('P61 is opt-out safe and refuses unsupported, stale, or owner-photo dresses before geometry writes',()=>{
 const untouched={mesh:{geometry:{attributes:{position:{array:new Float32Array([1,2,3])}}}},stats:{sourceId:'private-owner-photo'}};
 assert.equal(refinePhotographedDress61(untouched,{}, {enabled:false}),untouched);
 assert.throws(()=>refinePhotographedDress61(untouched,{}),/pinned unapproved anatomical Commons 0053/);
 assert.deepEqual([...untouched.mesh.geometry.attributes.position.array],[1,2,3]);
});

test('P61 does not authorize image fabrication, owner 3D, collision, or release claims',()=>{
 assert.equal(DRESS_DRAPE_61.releaseAuthorized,false);
 assert.equal(DRESS_DRAPE_61.humanVisualApproval,false);
 assert.equal(DRESS_DRAPE_61.collisionValidated,false);
 for(const t of [-.01,1.01,NaN])assert.throws(()=>skirtFold61({theta:0,t}));
});
