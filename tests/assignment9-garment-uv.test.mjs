import test from 'node:test';import assert from 'node:assert/strict';
import {createPhotoHumanoidGeometry,projectFrontUV} from '../public/humanoid-3d-photo-geometry.mjs';
function extent(part,offset){const a=[];for(let i=offset;i<part.vertices.length;i+=8)a.push(part.vertices[i]);return [Math.min(...a),Math.max(...a)];}
test('shoe fronts use vertically complete original with disjoint left/right UV regions',()=>{
 const shoes=createPhotoHumanoidGeometry([{slot:'shoes',category:'Shoes'}]).filter(p=>p.photo);
 const left=shoes.find(p=>p.id==='left-shoe'),right=shoes.find(p=>p.id==='right-shoe');
 for(const p of shoes){const v=extent(p,7);assert.ok(v[0]<.001&&v[1]>.999);}
 assert.ok(extent(left,6)[1]<.5);assert.ok(extent(right,6)[0]>.5);
});
test('shorts waist and legs share a full-height projection instead of truncating the lower original',()=>{
 const parts=createPhotoHumanoidGeometry([{slot:'bottom',category:'Bottoms',itemType:'Shorts'}]).filter(p=>p.photo);
 const waist=parts.find(p=>p.id==='trouser-waist'),leg=parts.find(p=>p.id==='left-trouser');
 assert.ok(Math.abs(extent(waist,7)[0])<1e-6);assert.ok(Math.abs(extent(leg,7)[1]-1)<1e-6);
 for(const p of parts)for(let i=0;i<p.vertices.length;i+=8)assert.ok(Math.abs(p.vertices[i+7]-(.05-p.vertices[i+1])/.61)<1e-6);
});
test('pants retain their full-length mapping and dress/separates rejection is unchanged',()=>{
 const p=createPhotoHumanoidGeometry([{slot:'bottom',category:'Bottoms',itemType:'Jeans'}]).find(p=>p.id==='left-trouser');assert.ok(Math.abs(extent(p,7)[1]-1)<1e-6);
 assert.throws(()=>createPhotoHumanoidGeometry([{slot:'top',category:'Dresses'},{slot:'bottom'}]),/conflict/);
});
test('UV reprojection copies geometry without altering positions, normals or original array',()=>{
 const a=new Float32Array([0,1,2,0,0,1,.1,.2,1,0,2,0,0,1,.3,.4,-1,0,2,0,0,1,.5,.6]),before=a.slice(),b=projectFrontUV(a,{left:-1,right:1,top:1,bottom:0});
 assert.deepEqual(a,before);for(let i=0;i<a.length;i+=8)assert.deepEqual(b.subarray(i,i+6),a.subarray(i,i+6));assert.deepEqual([...b.filter((_,i)=>i%8===6)],[.5,1,0]);
});
test('invalid source projection envelopes and nonfinite attributes fail closed',()=>{
 for(const bounds of [{left:1,right:0,top:1,bottom:0},{left:0,right:1,top:0,bottom:0},{left:NaN,right:1,top:1,bottom:0}])assert.throws(()=>projectFrontUV(new Float32Array(24),bounds),/Invalid/);
 assert.throws(()=>projectFrontUV(new Float32Array(24).fill(Infinity),{left:0,right:1,top:1,bottom:0}),/Invalid/);
});
