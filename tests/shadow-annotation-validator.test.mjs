import test from 'node:test';
import assert from 'node:assert/strict';
import {validateShadowAnnotation} from '../benchmark/shadow-annotation-validator.mjs';
const entry={id:'photo',sourceSha256:'verified-sha'};
const approved={schemaVersion:1,imageId:'photo',sourceSha256:'verified-sha',reviewStatus:'approved',regions:{garment:[[[0,0],[1,0],[1,1]]],shadow:[[[0,0],[0,1],[1,1]]]}};
test('rejects unapproved annotations',()=>{assert.equal(validateShadowAnnotation({...approved,reviewStatus:'pending'},entry).valid,false);});
test('rejects mismatched photos and unsafe coordinates',()=>{assert.equal(validateShadowAnnotation({...approved,sourceSha256:'other'},entry).valid,false);assert.equal(validateShadowAnnotation({...approved,regions:{...approved.regions,shadow:[[[0,0],[2,0],[1,1]]]}},entry).valid,false);});
test('valid annotation is a reviewed reference, never automatic production authorization',()=>{assert.equal(validateShadowAnnotation(approved,entry).valid,true);});
