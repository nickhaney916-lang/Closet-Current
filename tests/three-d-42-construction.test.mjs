import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createHash} from 'node:crypto';
import {person,candidate} from '../research/three-d-24/test-fixtures.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';
import {denim,crossings} from '../scripts/audit-three-d-42-triangles.mjs';
import {PANTS_RESEARCH_SOURCE as A,PANTS_RESEARCH_SOURCE_SECOND as B} from '../research/three-d-30/reviewed-photo-pants.mjs';
for(const kind of ['female','male'])for(const src of [A,B])test(kind+' '+src.id+' connected independent pattern, rig, UV transfer and fallback',async()=>{
 const root=await person(kind),body=()=>{const a=[];root.traverse(m=>{if(m.isSkinnedMesh&&!m.userData.work56Garment)a.push(createHash('sha256').update(Buffer.from(m.geometry.attributes.position.array.buffer)).digest('hex'));});return a;},originalBody=body(),app=createOutfitController(root,{jeansPanelFall:true,independentGarments:true});
 try{const s=app.setOutfit('shirt-pants',candidate('shirt'),{reviewed:true,pantsCandidate:denim(src),pantsReviewed:true});assert.equal(s.pants.independentSewnPattern,true);assert.equal(s.pants.sourceSHA256,src.originalSHA256);assert.equal(s.pants.rearPhotoInvented,false);let mesh;root.traverse(m=>{if(m.userData.work60Pants)mesh=m;});const g=mesh.geometry,p=g.attributes.position;assert.ok(p.count<5000);assert.ok(s.pants.patternCrotchSharedVertices>10);
 const edges=new Map();for(let i=0;i<g.index.count;i+=3){const ids=[0,1,2].map(k=>g.index.getX(i+k));assert.equal(new Set(ids).size,3);for(let k=0;k<3;k++){const a=ids[k],b=ids[(k+1)%3],key=[a,b].sort((a,b)=>a-b).join(':');const e=edges.get(key)||{n:0,w:0};e.n++;e.w+=a<b?1:-1;edges.set(key,e);}}
 const boundary=[...edges].filter(([,e])=>e.n===1);assert.ok(boundary.length>0);assert.ok([...edges.values()].every(e=>e.n<=2&& (e.n===1||e.w===0)),'Manifold and consistent seam winding');
 // A pair-of-pants pattern has exactly three open loops: waist + two hems.
 assert.equal(boundary.length,160);const adj=new Map();for(const [edge] of boundary){const [a,b]=edge.split(':').map(Number);for(const [x,y] of [[a,b],[b,a]]){if(!adj.has(x))adj.set(x,new Set());adj.get(x).add(y);}}assert.ok([...adj.values()].every(n=>n.size===2));let loops=0;const seen=new Set();for(const id of adj.keys()){if(seen.has(id))continue;loops++;const q=[id];for(const x of q){if(seen.has(x))continue;seen.add(x);q.push(...adj.get(x));}}assert.equal(loops,3);assert.deepEqual(body(),originalBody);
 for(let i=0;i<p.count;i++){assert.ok(Number.isFinite(p.getX(i)));const sum=[0,1,2,3].reduce((a,k)=>a+g.attributes.skinWeight.array[i*4+k],0);assert.ok(Math.abs(sum-1)<1e-5);assert.ok(g.attributes.pantsSourceUV.getX(i)>=0&&g.attributes.pantsSourceUV.getX(i)<=1);}
 for(const pose of ['source','relaxed','source'])app.setPose(pose);
 const neutral=app.setOutfit('pants');assert.equal(neutral.pants.photoApplied,false);assert.equal(neutral.pants.independentSewnPattern,undefined);assert.equal(app.setOutfit('none').garmentMeshes,0);
 }finally{app.dispose();}
});
test('Triangle detector detects real crossing and rejects disjoint surfaces',()=>{const a=new T.BoxGeometry(1,1,1),b=new T.BoxGeometry(1,1,1).translate(.5,.3,.2);assert.ok(crossings(a,b).crossingTrianglePairs>0);b.translate(3,0,0);assert.equal(crossings(a,b).crossingTrianglePairs,0);});

test('Photographed front coordinate prefixes remain exact; rear pattern adds only neutral source fields',async()=>{
 const data=[];for(const independentGarments of [false,true]){const root=await person('female'),app=createOutfitController(root,{jeansPanelFall:true,independentGarments});try{const state=app.setOutfit('shirt-pants',candidate('shirt'),{reviewed:true,pantsCandidate:denim(B),pantsReviewed:true});const rows=[];root.traverse(m=>{if(m.isSkinnedMesh&&m.userData.work56Garment&&!m.userData.work60Pants&&m.geometry.attributes.panelPosition)rows.push(Object.fromEntries(['panelPosition','panelNormal','skinIndex','skinWeight'].map(n=>[n,m.geometry.attributes[n].array.slice()])));});data.push(rows);if(independentGarments){assert.equal(state.shirt.independentRearShirtPattern,true);assert.ok(state.shirt.newRearPatternVertices>80);assert.equal(state.shirt.newRearPhotograph,false);assert.equal(state.shirt.independentSleeveLoft,true);}}finally{app.dispose();}}assert.equal(data[0].length,data[1].length);for(let j=0;j<data[0].length;j++)for(const n of Object.keys(data[0][j]))assert.deepEqual(data[1][j][n].slice(0,data[0][j][n].length),data[0][j][n]);
});
test('Posed contact cache is deterministic, source fields remain immutable, and all owned geometries are disposed',async()=>{
 const root=await person('male'),app=createOutfitController(root,{jeansPanelFall:true,independentGarments:true});
 app.setOutfit('shirt-pants',candidate('shirt'),{reviewed:true,pantsCandidate:denim(A),pantsReviewed:true});
 const garments=[];root.traverse(m=>{if(m.isSkinnedMesh&&m.userData.work56Garment)garments.push(m);});const snapshots={};
 const hash=()=>garments.map(m=>createHash('sha256').update(Buffer.from(m.geometry.attributes.position.array.buffer)).digest('hex'));
 const times=[];for(const pose of ['source','relaxed','source','relaxed']){const t=performance.now(),s=app.setPose(pose);times.push(performance.now()-t);assert.equal(s.shirt.poseTriangleContact.after.count,0);if(snapshots[pose])assert.deepEqual(hash(),snapshots[pose]);else snapshots[pose]=hash();}
 let disposed=0;garments.forEach(m=>m.geometry.addEventListener('dispose',()=>disposed++));app.dispose();assert.equal(disposed,garments.length);assert.equal(app.getState().garmentMeshes,0);console.log('POSE_CACHE_TIMES_MS',JSON.stringify(times));
});
