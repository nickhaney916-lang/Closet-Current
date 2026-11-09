import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createOwnerMaskGeometryProfile65,fitOwnerMaskGeometry65,requireCurrentOwnerMaskGeometry65} from '../research/real-owner-garment-to-3d-65/owner-mask-geometry.mjs';
const SOURCE='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const hash='a'.repeat(64);
function mask({width=80,height=96,half=.22,clipped=false}={}){
 const data=new Uint8ClampedArray(width*height*4);
 for(let y=clipped?0:4;y<(clipped?height:height-4);y++){
  const h=half*(.72+.28*Math.sin(Math.PI*y/height));
  for(let x=0;x<width;x++)if(clipped&&(y<4||y>=height-4)||Math.abs((x+.5)/width-.5)<h){const i=(y*width+x)*4;data[i+3]=255;}
 }
 return data;
}
function fixture(profile,xScale=1){
 const bone={};const skeleton={bones:Array.from({length:163},()=>({}))};
 const attr=(values)=>({array:Float32Array.from(values),count:values.length/3,getX:i=>values[i*3],getY:i=>values[i*3+1],getZ:i=>values[i*3+2],needsUpdate:false});
 const positions=[],panels=[];
 for(let i=0;i<180;i++){const x=(i%18-9)*.012*xScale,y=1.12+Math.floor(i/18)*.035;positions.push(x,y,.1);panels.push(x,y,.1);}
 const geo={attrs:{position:attr(positions),panelPosition:attr(panels)},getAttribute(n){return this.attrs[n];},computeVertexNormals(){},computeBoundingBox(){},computeBoundingSphere(){}};
 const mesh={name:'Work56-independent-shirt-shell',isSkinnedMesh:true,skeleton,geometry:geo,position:new THREE.Vector3(),matrixWorld:new THREE.Matrix4(),userData:{},updateWorldMatrix(){}};
 const body={isSkinnedMesh:true,skeleton,userData:{}};
 const root={traverse(fn){fn(body);fn(mesh);}};
 return {shirt:{meshes:[mesh],stats:{sourceSHA256:SOURCE,photoSpan:{height:.53}}},root,mesh};
}
test('P65 derives distinct registered row contours from a verified owner mask',()=>{
 const baseline=mask({half:.20}),owner=mask({half:.27});
 const p=createOwnerMaskGeometryProfile65({ownerId:'owner-a',garmentId:'item-a',sourceSHA256:SOURCE,
  ownerMaskSHA256:hash,ownerMaskData:owner,baselineMaskData:baseline,width:80,height:96});
 assert.equal(p.rowFactors.length,32);assert.ok(p.rowFactors.every(x=>x>1.2&&x<=1.3));
 assert.equal(p.geometrySource,'reviewed-owner-alpha-row-contour');
 assert.equal(p.ownerReviewAssertionOnly,true);assert.equal(p.independentlyHumanReviewed,false);
 assert.equal(p.reconstructedTopology,false);assert.equal(p.releaseAuthorized,false);
});
test('P65 changes the actual 163-bone garment vertices and keeps an auditable source receipt',()=>{
 const p=createOwnerMaskGeometryProfile65({ownerId:'owner-a',garmentId:'item-a',sourceSHA256:SOURCE,
  ownerMaskSHA256:hash,ownerMaskData:mask({half:.27}),baselineMaskData:mask({half:.20}),width:80,height:96});
 const {shirt,root,mesh}=fixture(p),before=mesh.geometry.getAttribute('position').array.slice();
 const out=fitOwnerMaskGeometry65(shirt,root,p);
 assert.ok(out.stats.ownerMaskGeometry65MovedVertices>20);
 assert.ok(out.stats.ownerMaskGeometry65MaxDisplacementMeters>0);
 assert.equal(out.stats.ownerMaskGeometry65SHA256,hash);
 assert.equal(out.stats.ownerMaskReviewAssertionOnly65,true);
 assert.equal(out.stats.ownerMaskHumanReviewIndependentlyVerified65,false);
 assert.equal(out.stats.uniqueTopologyReconstructed65,false);
 assert.notDeepEqual(mesh.geometry.getAttribute('position').array,before);
});
test('P65 rejects wrong source, empty or clipped masks and unbounded geometry',()=>{
 assert.throws(()=>createOwnerMaskGeometryProfile65({ownerId:'a',garmentId:'b',sourceSHA256:'f'.repeat(64),ownerMaskSHA256:hash,
  ownerMaskData:mask(),baselineMaskData:mask({half:.2}),width:80,height:96}),/identity required/);
 assert.throws(()=>createOwnerMaskGeometryProfile65({ownerId:'a',garmentId:'b',sourceSHA256:SOURCE,ownerMaskSHA256:hash,
  ownerMaskData:new Uint8ClampedArray(80*96*4),baselineMaskData:mask(),width:80,height:96}),/empty, clipped/);
 assert.throws(()=>createOwnerMaskGeometryProfile65({ownerId:'a',garmentId:'b',sourceSHA256:SOURCE,ownerMaskSHA256:hash,
  ownerMaskData:mask({clipped:true}),baselineMaskData:mask(),width:80,height:96}),/empty, clipped/);
 const p=createOwnerMaskGeometryProfile65({ownerId:'a',garmentId:'b',sourceSHA256:SOURCE,ownerMaskSHA256:hash,
  ownerMaskData:mask({half:.45}),baselineMaskData:mask({half:.12}),width:80,height:96});
 const {shirt,root}=fixture(p,2),out=fitOwnerMaskGeometry65(shirt,root,p);
 assert.ok(out.stats.ownerMaskGeometry65BoundedVertices>0);
 assert.ok(out.stats.ownerMaskGeometry65MaxDisplacementMeters<=.035);
});
test('P65 rejects cross-owner and incomplete skinned shells',()=>{
 const p=createOwnerMaskGeometryProfile65({ownerId:'owner-a',garmentId:'item-a',sourceSHA256:SOURCE,
  ownerMaskSHA256:hash,ownerMaskData:mask({half:.27}),baselineMaskData:mask({half:.2}),width:80,height:96});
 const {shirt,root}=fixture(p);assert.throws(()=>fitOwnerMaskGeometry65(shirt,root,{...p,sourceSHA256:'f'.repeat(64)}),/verified source-bound/);
 assert.equal(requireCurrentOwnerMaskGeometry65(p,{ownerId:'owner-a',garmentId:'item-a',sourceSHA256:SOURCE}),true);
 for(const wrong of [{ownerId:'owner-b',garmentId:'item-a',sourceSHA256:SOURCE},
  {ownerId:'owner-a',garmentId:'item-b',sourceSHA256:SOURCE},
  {ownerId:'owner-a',garmentId:'item-a',sourceSHA256:'f'.repeat(64)}])
  assert.throws(()=>requireCurrentOwnerMaskGeometry65(p,wrong),/does not match/);
 const broken={...shirt,meshes:[]};assert.throws(()=>fitOwnerMaskGeometry65(broken,root,p),/163-bone/);
});
