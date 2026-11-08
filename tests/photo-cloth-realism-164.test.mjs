import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { applyPhotoFabricPBR164, PHOTO_FABRIC_SOURCES_164 } from '../research/photo-cloth-realism-164/pbr-fabric.mjs';

const makeGarment = ({ sourceId='commons-0053', sourceSHA256=PHOTO_FABRIC_SOURCES_164['commons-0053'], photoApplied=false }={}) => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0, 1,0,0, 0,1,0], 3));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute([0,0,0,0, 0,0,0,0, 0,0,0,0], 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute([1,0,0,0, 1,0,0,0, 1,0,0,0], 4));
  const map = new THREE.DataTexture(new Uint8Array([120,40,55,255]), 1, 1);
  map.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshStandardMaterial({ map, color: 0xffffff, roughness: .94, side: THREE.DoubleSide });
  const shader = () => {};
  material.onBeforeCompile = shader;
  const mesh = new THREE.SkinnedMesh(geometry, material);
  let disposed = 0;
  return { garment: { meshes:[mesh], stats:{sourceId,sourceSHA256,photoApplied,frontOriginalPixels:sourceId==='commons-0053',releaseAuthorized:false}, dispose(){ disposed++; } }, mesh, material, map, geometry, disposed:()=>disposed };
};

test('164 applies cotton/denim/dress roughness and cloth sheen only to exact reviewed public source identities',()=>{
  const cases=[
    ['commons-0003',.86,'cotton-jersey',true],
    ['commons-0053',.90,'dress-woven',false],
    ['commons-public-domain-jeans-2005',.78,'denim',true],
    ['commons-cc-by-sa-denimjeans2-2008',.78,'denim',true]
  ];
  for(const [sourceId,roughness,fabric,photoApplied] of cases){
    const x=makeGarment({sourceId,sourceSHA256:PHOTO_FABRIC_SOURCES_164[sourceId],photoApplied});
    const result=applyPhotoFabricPBR164(x.garment);
    assert.equal(result.applied,true);
    assert.equal(result.garment.stats.photoFabricProfile164,fabric);
    const physical=x.mesh.material;
    assert.equal(physical.isMeshPhysicalMaterial,true);
    assert.equal(physical.roughness,roughness);
    assert.equal(physical.metalness,0);
    assert.equal(physical.clearcoat,0);
    assert.ok(physical.sheen>0&&physical.sheen<.25);
    assert.equal(Number.isFinite(physical.specularIntensity),true);
    assert.equal(physical.ior,1.5);
    assert.equal(physical.anisotropy,0);
    assert.equal(physical.map,x.map);
    assert.equal(physical.onBeforeCompile,x.material.onBeforeCompile);
    assert.equal(physical.color.getHex(),x.material.color.getHex());
    assert.equal(result.garment.stats.photoFabricOriginalPixelsAndUVUnchanged164,true);
    result.garment.dispose();
    assert.equal(x.disposed(),1);
    assert.equal(x.mesh.material,x.material);
  }
});

test('164 refuses arbitrary owner photos, source hash mismatch and missing source-photo application without mutation',()=>{
  for(const opts of [
    {sourceId:'owner-private-1',sourceSHA256:'a'.repeat(64),photoApplied:true},
    {sourceId:'commons-0053',sourceSHA256:'0'.repeat(64),photoApplied:false},
    {sourceId:'commons-public-domain-jeans-2005',sourceSHA256:PHOTO_FABRIC_SOURCES_164['commons-public-domain-jeans-2005'],photoApplied:false}
  ]){
    const x=makeGarment(opts),before=x.mesh.material;
    const result=applyPhotoFabricPBR164(x.garment);
    assert.equal(result.applied,false);
    assert.equal(x.mesh.material,before);
    assert.equal(x.garment.stats.releaseAuthorized,false);
  }
});

test('164 preserves the original mapped source texture, skin weights, source geometry and mapping shader on a disposable clone',()=>{
  const x=makeGarment({sourceId:'commons-0003',sourceSHA256:PHOTO_FABRIC_SOURCES_164['commons-0003'],photoApplied:true});
  const p=x.geometry.getAttribute('position').array.slice();
  const si=x.geometry.getAttribute('skinIndex').array.slice();
  const sw=x.geometry.getAttribute('skinWeight').array.slice();
  const result=applyPhotoFabricPBR164(x.garment);
  assert.equal(result.applied,true);
  assert.deepEqual([...x.geometry.getAttribute('position').array],[...p]);
  assert.deepEqual([...x.geometry.getAttribute('skinIndex').array],[...si]);
  assert.deepEqual([...x.geometry.getAttribute('skinWeight').array],[...sw]);
  assert.equal(x.mesh.material.map,x.map);
  assert.equal(x.mesh.material.onBeforeCompile,x.material.onBeforeCompile);
  result.garment.dispose();
});
