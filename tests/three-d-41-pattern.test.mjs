import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {denim,crossings} from '../scripts/audit-three-d-41-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
for(const kind of ['female','male'])for(const src of [A,B])test(kind+' '+src.id+' connected independent pattern, rig, UV transfer and fallback',async()=>{
 const root=await person(kind),app=createOutfitController(root,{sewnPattern:true});
 try{const s=app.setOutfit('shirt-pants',candidate('shirt'),{reviewed:true,pantsCandidate:denim(src),pantsReviewed:true});assert.equal(s.pants.independentSewnPattern,true);assert.equal(s.pants.sourceSHA256,src.originalSHA256);assert.equal(s.pants.rearPhotoInvented,false);let mesh;root.traverse(m=>{if(m.userData.work60Pants)mesh=m;});const g=mesh.geometry,p=g.attributes.position;assert.ok(p.count<5000);assert.ok(s.pants.patternCrotchSharedVertices>10);
 const edges=new Map();for(let i=0;i<g.index.count;i+=3){const ids=[0,1,2].map(k=>g.index.getX(i+k));assert.equal(new Set(ids).size,3);for(let k=0;k<3;k++){const a=ids[k],b=ids[(k+1)%3],key=[a,b].sort((a,b)=>a-b).join(':');const e=edges.get(key)||{n:0,w:0};e.n++;e.w+=a<b?1:-1;edges.set(key,e);}}
 const boundary=[...edges].filter(([,e])=>e.n===1);assert.ok(boundary.length>0);assert.ok([...edges.values()].every(e=>e.n<=2&& (e.n===1||e.w===0)),'Manifold and consistent seam winding');
 // Only open waist and two hems; all saddle edges must have two incidents.
 for(const [edge] of boundary){for(const id of edge.split(':').map(Number)){const q=new T.Vector3().fromBufferAttribute(p,id).applyMatrix4(mesh.matrixWorld);assert.ok(Math.abs(q.y-s.pants.waistY)<1e-5||Math.abs(q.y-s.pants.hemY)<1e-5,'Unexpected open crotch or side seam');}}
 for(let i=0;i<p.count;i++){assert.ok(Number.isFinite(p.getX(i)));const sum=[0,1,2,3].reduce((a,k)=>a+g.attributes.skinWeight.array[i*4+k],0);assert.ok(Math.abs(sum-1)<1e-5);assert.ok(g.attributes.pantsSourceUV.getX(i)>=0&&g.attributes.pantsSourceUV.getX(i)<=1);}
 for(const pose of ['source','relaxed','source'])app.setPose(pose);
 const neutral=app.setOutfit('pants');assert.equal(neutral.pants.photoApplied,false);assert.equal(neutral.pants.independentSewnPattern,undefined);assert.equal(app.setOutfit('none').garmentMeshes,0);
 }finally{app.dispose();}
});
test('Triangle detector detects real crossing and rejects disjoint surfaces',()=>{const a=new T.BoxGeometry(1,1,1),b=new T.BoxGeometry(1,1,1).translate(.5,.3,.2);assert.ok(crossings(a,b).crossingTrianglePairs>0);b.translate(3,0,0);assert.equal(crossings(a,b).crossingTrianglePairs,0);});
