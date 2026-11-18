import test from 'node:test';
import assert from 'node:assert/strict';
import {smoothOriginalPhotoSkirtUVSeamNormals89 as smooth}
 from '../research/parallel89/skirt-photo-uv-seam-normals89.mjs';
const count=7*49;
function fixture(){
 const positions=new Float32Array(count*3),sourceRest=new Float32Array(count*3),
  uv=new Float32Array(count*2),skinIndex=new Uint16Array(count*4),
  skinWeight=new Float32Array(count*4),normals=new Float32Array(count*3);
 for(let r=0;r<7;r++)for(let j=0;j<=48;j++){
  const i=r*49+j,a=2*Math.PI*j/48,rx=.2+.01*r,rz=.16+.01*r;
  positions.set([rx*Math.sin(a),1.5-r*.1,rz*Math.cos(a)],i*3);
  sourceRest.set([rx*Math.sin(a),1.5-r*.1,rz*Math.cos(a)],i*3);
  uv.set([.5+Math.sin(a)*.2,1-r/7],i*2);
  skinIndex[i*4]=17;skinWeight[i*4]=1;
  normals.set([Math.sin(a),0,Math.cos(a)],i*3);
 }
 for(let r=0;r<7;r++){
  const a=r*49,b=a+48;
  normals.set([.06,0,.998198],a*3);
  normals.set([-.06,0,.998198],b*3);
 }
 return {positions,sourceRest,uv,skinIndex,skinWeight,normals};
}
function sourceSnapshot(v){return Object.fromEntries(
 ['positions','sourceRest','uv','skinIndex','skinWeight'].map(k=>[k,v[k].slice()]));}
test('source skirt seven duplicated UV seam points share smooth outward normal without changing source or consumer hold',()=>{
 const v=fixture(),before=sourceSnapshot(v),result=smooth(v);
 assert.equal(result.inspectedUVSeamVertexPairs,7);
 assert.equal(result.correctedUVSeamVertexPairs,7);
 assert.ok(result.maximumOriginalSeamNormalMismatch>.11);
 assert.equal(result.maximumPostSmoothingSeamNormalMismatch,0);
 for(let row=0;row<7;row++){
  const a=3*row*49,b=a+3*48;
  assert.deepEqual(Array.from(v.normals.slice(a,a+3)),
   Array.from(v.normals.slice(b,b+3)));
  assert.ok(v.normals[a+2]>.99,'source front normal must remain outward');
 }
 for(const [key,val] of Object.entries(before))assert.deepEqual(v[key],val,key);
 assert.equal(result.consumer3DAdmitted,false);
 assert.equal(result.originalPhoto2DFallbackRequired,true);
 assert.equal(result.releaseAuthorized,false);
});
test('already smooth seam is idempotent and original rest positions unchanged',()=>{
 const v=fixture();smooth(v);const original=v.normals.slice();
 const r=smooth(v);
 assert.equal(r.correctedUVSeamVertexPairs,0);
 assert.deepEqual(v.normals,original);
});
test('malformed source UV/skin/rest seam is rejected atomically without changing normals',()=>{
 for(const tweak of [
  v=>v.positions[3*48]+=.05,
  v=>v.sourceRest[3*48+2]+=.05,
  v=>v.uv[2*48]+=.1,
  v=>v.skinIndex[4*48]=18,
  v=>v.skinWeight[4*48]=.5,
  v=>v.uv[1]=NaN,
  v=>v.sourceRest[0]=Infinity
 ]){
  const v=fixture(),before=v.normals.slice();tweak(v);
  assert.throws(()=>smooth(v),/P89-photo-UV-seam-normal/);
  assert.deepEqual(v.normals,before,'failed source attestation must not partially mutate normals');
 }
});
test('inverted, missing, nonfinite, or opposing normals fail closed atomically',()=>{
 for(const tweak of [
  v=>v.normals.fill(0),
  v=>v.normals.set([0,0,-1],48*3),
  v=>v.normals[0]=Infinity,
  v=>v.normals[3*48]=NaN
 ]){
  const v=fixture();tweak(v);const before=v.normals.slice();
  assert.throws(()=>smooth(v),/P89-photo-UV-seam-normal/);
  for(let i=0;i<before.length;i++)
   assert.ok(Object.is(v.normals[i],before[i]),'atomic failure must preserve original normals including NaN');
 }
});
test('fake topology, wrong vertex types, unsupported rows and empty request fail closed',()=>{
 const source=fixture();
 for(const bad of [undefined,{}, {...source,uv:[]},
  {...source,normals:new Float32Array(8)}, {...source,segments:32},
  {...source,rows:8}, {...source,skinIndex:new Uint32Array(source.skinIndex)}
 ])assert.throws(()=>smooth(bad),/P89-photo-UV-seam-normal/);
});
