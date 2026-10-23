import test from 'node:test';import assert from 'node:assert/strict';
import {indexPhotoMesh} from '../public/humanoid-3d-indexed-mesh.mjs';
import {createPhotoHumanoidGeometry} from '../public/humanoid-3d-photo-geometry.mjs';
const look=[{slot:'top',category:'Tops',sleeveLength:'Long sleeve'},{slot:'bottom',category:'Bottoms',itemType:'Jeans'},{slot:'shoes',category:'Shoes'}];
for(const [name,items] of [['separates',look],['six layers',[...look,{slot:'layer'},{slot:'layer2'},{slot:'layer3'}]],['dress',[{slot:'top',category:'Dresses'},{slot:'shoes'}]]])test(name+': indexed attributes reconstruct every original triangle bit for bit with lower buffer cost',()=>{
 let before=0,after=0;
 for(const part of createPhotoHumanoidGeometry(items)){
  const original=part.vertices.slice(),packed=indexPhotoMesh(part.vertices),source=new Uint32Array(original.buffer),bits=new Uint32Array(packed.vertices.buffer);
  for(let i=0;i<packed.indices.length;i++)for(let a=0;a<8;a++)assert.equal(bits[packed.indices[i]*8+a],source[i*8+a],part.id+' attribute mismatch');
  assert.deepEqual(part.vertices,original);before+=original.byteLength;after+=packed.vertices.byteLength+packed.indices.byteLength;
 }
 assert.ok(after<before*.5,{before,after});
});
test('normal discontinuities, UV seams and negative zero are never welded',()=>{
 const a=[0,0,0,0,0,1,0,0],b=[0,0,0,0,0,-1,0,0],c=[0,0,0,0,0,1,1,0],d=[-0,0,0,0,0,1,0,0];
 const packed=indexPhotoMesh(new Float32Array([...a,...b,...c,...d,...a,...b]));
 assert.equal(packed.vertices.length/8,4);assert.deepEqual([...packed.indices],[0,1,2,3,0,1]);assert.ok(Object.is(packed.vertices[24],-0));
});
test('malformed, nonfinite and WebGL1-overflow geometry fails closed',()=>{
 for(const value of [[],new Float32Array(),new Float32Array(8),new Float32Array(24).fill(NaN),new Float32Array(24).fill(Infinity)])assert.throws(()=>indexPhotoMesh(value),/finite triangle/);
 const n=65538,vertices=new Float32Array(n*8);for(let i=0;i<n;i++)vertices[i*8]=i;
 assert.throws(()=>indexPhotoMesh(vertices),/index budget/);
});
function coversXY(vertices,x,y){
 const side=(ax,ay,bx,by)=>((x-bx)*(ay-by)-(ax-bx)*(y-by));
 for(let i=0;i<vertices.length;i+=24){const a=side(vertices[i],vertices[i+1],vertices[i+8],vertices[i+9]),b=side(vertices[i+8],vertices[i+9],vertices[i+16],vertices[i+17]),c=side(vertices[i+16],vertices[i+17],vertices[i],vertices[i+1]);if((a>0&&b>0&&c>0)||(a<0&&b<0&&c<0))return true;}
 return false;
}
test('previous shoulder notch is covered by garment geometry on both sides and all sleeve layers',()=>{
 for(const slot of ['top','layer','layer2','layer3']){
  const parts=createPhotoHumanoidGeometry([{slot,category:'Tops',sleeveLength:'Long sleeve'}]).filter(p=>p.key===slot);
  for(const s of [-1,1])for(const [x,y] of [[.34,.845],[.37,.83]])assert.ok(parts.some(p=>coversXY(p.vertices,s*x,y)),slot+' uncovered shoulder');
  const caps=parts.filter(p=>p.id.endsWith('-shoulder'));assert.equal(caps.length,2);assert.ok(caps.every(p=>p.photo===false),'unseen shoulder remains estimated');
 }
});
