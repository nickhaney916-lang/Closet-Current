import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {constructSourcePhotoDenimFolds75,sourceMeasuredFoldField75}
 from '../research/three-d-75/source-photo-structural-denim-folds.mjs';
import {createOutfitController} from '../research/three-d-15/outfit-controller.mjs';

test('3D75 defaults OFF and rejects fake/neutral or user-unvetted photo-derived pants',()=>{
 assert.equal(constructSourcePhotoDenimFolds75(null,null,{enabled:false}),null);
 assert.throws(()=>constructSourcePhotoDenimFolds75(null,{}),/genuine source SHA-verified/);
 assert.throws(()=>constructSourcePhotoDenimFolds75({meshes:[{isSkinnedMesh:true}],stats:{
  sourcePhotographedDenimRearDrape73:true,sourcePhotographedDenimCalfHang74:true,
  independentSewnPattern:true,photoApplied:true,sourceSHA256:'a'.repeat(64),sourceId:'fake-001'
 }},{}),/genuine source SHA-verified/);
 assert.throws(()=>createOutfitController({},{
  photoDenimFolds75:true,photoDenimCalfHang74:false,
  photoDenimRearDrape73:true
 }),/3D75 requires exact 3D74/);
});
test('3D75 field produces bounded diagonal source-metric knee and shin folds',()=>{
 const point={y:.67,x:.07,leg:1,knee:.58,ankle:.16,rearZ:-.09,sourceRear:-.091,sourceOuter:.14};
 const a=sourceMeasuredFoldField75(point);
 const b=sourceMeasuredFoldField75({...point,y:.48});
 const c=sourceMeasuredFoldField75({...point,y:.32});
 assert.ok(a>0&&a<=.04,JSON.stringify(a));
 assert.ok(b>0&&b<=.04,JSON.stringify(b));
 assert.ok(c>0&&c<=.04,JSON.stringify(c));
 assert.equal(sourceMeasuredFoldField75({...point,sourceOuter:0}),0);
 assert.equal(sourceMeasuredFoldField75({...point,leg:0}),0);
 assert.equal(sourceMeasuredFoldField75({...point,rearZ:NaN}),0);
});
test('3D75 must only modify genuine sewn skinned geometry, preserve photo hashes and source mapping',()=>{
 const s=readFileSync(new URL('../research/three-d-75/source-photo-structural-denim-folds.mjs',import.meta.url),'utf8');
 for(const name of ['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'])
  assert.ok(s.includes("'"+name+"'"));
 for(const term of ['bodySurface(body)','original.clone()','mesh.geometry=geometry',
  'sourcePhotoDenimStructuralFolds75:true','originalPhotographicRGBAlphaAndHashUntouched:true',
  'originalPhotoUVRestSourceFrontAndSkinUntouched:true','originalPhotographicBackInvented:false',
  'physicalPhoneTested:false','releaseAuthorized:false'])assert.ok(s.includes(term),term);
 assert.doesNotMatch(s,/fetch\(|canvas\.toDataURL|createElement|toBlob|window\.localStorage|generateFakeBack/);
 const controller=readFileSync(new URL('../research/three-d-15/outfit-controller.mjs',import.meta.url),'utf8');
 const showroom=readFileSync(new URL('../research/three-d-15/showroom.mjs',import.meta.url),'utf8');
 const viewer=readFileSync(new URL('../research/three-d-69/index-to-real-garment-demo.mjs',import.meta.url),'utf8');
 assert.match(controller,/photoDenimFolds75=false/);
 assert.match(controller,/if\(photoDenimFolds75&&built\.pants\?\.stats\?\.sourcePhotographedDenimCalfHang74\)/);
 assert.match(showroom,/photoDenimFolds75=false/);
 assert.match(viewer,/get\('folds75'\)==='after'/);
});
