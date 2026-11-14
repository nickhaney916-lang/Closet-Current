/** Synthetic structural tests ONLY. Genuine public skirt/photo, original rig
 * and real BVH triangle pair evidence is supplied separately by native CI.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {compareActualNeutralSkirtRear89} from '../research/parallel89/skirt-neutral-contact-trial89.mjs';
function shell(){
 const root=new THREE.Group(),g=new THREE.BufferGeometry(),
  verts=[],rest=[],uv=[],ids=[],weights=[],idx=[],segments=48;
 for(let r=0;r<7;r++)for(let j=0;j<=segments;j++){
  const a=j*2*Math.PI/segments,scale=1+r*.06;
  const v=[Math.sin(a)*.24*scale,1.3-r*.10,Math.cos(a)*.16*scale];
  verts.push(...v);rest.push(...v);uv.push(j/segments,r/6);
  ids.push(0,0,0,0);weights.push(1,0,0,0);
  if(r<6&&j<segments){
   const x=r*(segments+1)+j,y=x+segments+1;
   idx.push(x,x+1,y,x+1,y+1,y);
  }
 }
 g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 g.setAttribute('sourceSkirt89Rest',new THREE.Float32BufferAttribute(rest,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(ids,4));
 g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 g.setIndex(idx);
 const bones=Array.from({length:163},()=>new THREE.Bone());
 root.add(...bones);
 const mesh=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial());
 root.add(mesh);root.updateMatrixWorld(true);
 mesh.bind(new THREE.Skeleton(bones));
 return {mesh,root,original:new Float32Array(verts)};
}
function fakeContact(mesh,mode='reduce'){
 const actual=mesh.geometry.getAttribute('position').array;
 const rear=actual[48*3/2]??0;
 const rest=mesh.geometry.getAttribute('sourceSkirt89Rest');
 let changed=false;
 for(let j=13;j<=35;j++){
  const i=j*3;
  if(Math.abs(actual[i]-rest.array[i])>1e-6||
     Math.abs(actual[i+2]-rest.array[i+2])>1e-6)
   {changed=true;break;}
 }
 const keys=mode==='reduce'&&changed?['a','b']:
  mode==='worsen'&&changed?['a','b','c','x']:['a','b','c'];
 return {count:keys.length,pairs:new Set(keys),maxDepth:.001};
}
test('P89 rear-only research trial reduces synthetic structural pair IDs, always restores original photo and blocks 3D',()=>{
 const x=shell(),initial=x.mesh.geometry;
 const row=compareActualNeutralSkirtRear89({root:x.root,mesh:x.mesh,avatar:'female',
  applyPose:name=>assert.ok(['source','blend-50','relaxed'].includes(name)),
  sampleContact:()=>fakeContact(x.mesh)});
 assert.equal(row.schema,'P89-photographed-skirt-neutral-rear-only-trial/v1');
 assert.equal(row.status,'BOUNDED_NEUTRAL_REAR_CONTACT_REDUCTION_NOT_CLEARANCE');
 assert.equal(row.actualFullSourcePoseSamples,3);
 assert.equal(row.actualSourceCrossingPairsBefore,9);
 assert.ok(row.bestProvisional.trialSourcePoseCrossingSum<row.actualSourceCrossingPairsBefore);
 assert.equal(row.bestProvisional.newCrossingPairKeys,0);
 assert.equal(row.frontPhotoGeometryUntouched,true);
 assert.equal(row.allCandidateGeometryRestored,true);
 assert.equal(row.sourcePhoto2DFallbackRequired,true);
 assert.equal(row.consumer3DAdmitted,false);
 assert.equal(row.continuouslySweptContactCertified,false);
 assert.equal(row.releaseAuthorized,false);
 assert.equal(x.mesh.geometry,initial);
 assert.deepEqual(x.mesh.geometry.getAttribute('position').array,x.original);
});
test('a new transverse body/skirt pair vetoes synthetic neutral rear, even if total contact count falls',()=>{
 const x=shell(),row=compareActualNeutralSkirtRear89({root:x.root,mesh:x.mesh,avatar:'male',
  applyPose:()=>{},sampleContact:()=>fakeContact(x.mesh,'worsen')});
 assert.equal(row.status,'NO_REAR_ONLY_NONWORSENING_REDUCTION_SHOWN');
 assert.equal(row.bestProvisional,null);
 assert.equal(row.consumer3DAdmitted,false);
 assert.equal(x.mesh.geometry.getAttribute('position').count,343);
});
test('original photo UV, 163-bone rigidity and source geometry required, no invented research receipt',()=>{
 const x=shell();
 const args={root:x.root,mesh:x.mesh,avatar:'female',applyPose:()=>{},
  sampleContact:()=>fakeContact(x.mesh)};
 const cases=[
  {...args,avatar:'owner'},
  {...args,root:{}},
  {...args,applyPose:undefined},
  {...args,sampleContact:undefined},
 ];
 for(const t of cases){
  const r=compareActualNeutralSkirtRear89(t);
  assert.equal(r.status,'REAR_RESEARCH_REFUSED_OR_UNCHANGED');
  assert.equal(r.sourcePhoto2DFallbackRequired,true);
  assert.equal(r.releaseAuthorized,false);
 }
 x.mesh.geometry.deleteAttribute('uv');
 const r=compareActualNeutralSkirtRear89(args);
 assert.equal(r.status,'REAR_RESEARCH_REFUSED_OR_UNCHANGED');
});
