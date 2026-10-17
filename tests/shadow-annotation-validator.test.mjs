import test from 'node:test';
import assert from 'node:assert/strict';
import {validateShadowAnnotation} from '../benchmark/shadow-annotation-validator.mjs';
const entry={id:'photo',sourceSha256:'verified-sha'};
const approved={schemaVersion:1,imageId:'photo',sourceSha256:'verified-sha',reviewStatus:'approved',regions:{garment:[[[0,0],[1,0],[1,1]]],shadow:[[[0,0],[0,1],[1,1]]]}};
test('rejects unapproved annotations',()=>{assert.equal(validateShadowAnnotation({...approved,reviewStatus:'pending'},entry).valid,false);});
test('rejects mismatched photos and unsafe coordinates',()=>{assert.equal(validateShadowAnnotation({...approved,sourceSha256:'other'},entry).valid,false);assert.equal(validateShadowAnnotation({...approved,regions:{...approved.regions,shadow:[[[0,0],[2,0],[1,1]]]}},entry).valid,false);});
test('valid annotation is a reviewed reference, never automatic production authorization',()=>{assert.equal(validateShadowAnnotation(approved,entry).valid,true);});

test('rejects collapsed or zero-area reference polygons',()=>{
 const duplicate=[[[0,0],[0,0],[1,1]]];
 const collinear=[[[0,0],[0.5,0.5],[1,1]]];
 for(const invalid of [duplicate,collinear]){
  const result=validateShadowAnnotation({...approved,regions:{...approved.regions,shadow:invalid}},entry);
  assert.equal(result.valid,false);
  assert.equal(result.usableAsGroundTruth,false);
 }
});
test('accepts a genuine polygon with more than three vertices',()=>{
 const shape=[[[0,0],[1,0],[1,1],[0,1]]];
 assert.equal(validateShadowAnnotation({...approved,regions:{...approved.regions,garment:shape}},entry).valid,true);
});

test('rejects a self-crossing garment or shadow outline',()=>{
 const crossed=[[[0,0],[1,1],[0,1],[1,0]]];
 const result=validateShadowAnnotation({...approved,regions:{...approved.regions,shadow:crossed}},entry);
 assert.equal(result.valid,false);
 assert.ok(result.issues.some(issue=>issue.includes('edges must not cross')));
});
test('rejects crossed polygon even if its signed area is not zero',()=>{
 const crossed=[[[0,0],[1,0],[0.25,1],[0.75,-0.1]]];
 // Coordinates outside 0–1 must also fail.
 assert.equal(validateShadowAnnotation({...approved,regions:{...approved.regions,shadow:crossed}},entry).valid,false);
});
