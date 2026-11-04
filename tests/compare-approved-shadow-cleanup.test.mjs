import test from 'node:test';
import assert from 'node:assert/strict';
import {rasterizeReviewedPolygons,compareApprovedShadowCleanup} from '../benchmark/compare-approved-shadow-cleanup.mjs';
const entry={id:'sample-footwear',image:'shoe.jpg',sourceSha256:'trusted-photo-checksum'};
const annotation={schemaVersion:1,imageId:entry.id,sourceSha256:entry.sourceSha256,reviewStatus:'approved',reviewer:'first-person',approvedBy:'different-person',regions:{
 garment:[[[0,0],[.5,0],[.5,.5],[0,.5]]],
 shadow:[[[.5,0],[1,0],[1,.5],[.5,.5]]]
}};
function encode(bits){const runs=[];let prev=0,count=0;for(const bit of bits){if(bit!==prev){runs.push(count);count=0;prev=bit}count++}runs.push(count);return runs;}
function prediction(bits){return {image:entry.image,sourceSha256:entry.sourceSha256,width:6,height:4,runs:encode(bits)};}
const baseline=prediction([...Array(12).fill(1),...Array(12).fill(0)]);
const ideal=prediction([...Array(3).fill(1),...Array(3).fill(0),...Array(3).fill(1),...Array(15).fill(0)]);
test('verified polygon masks are rasterized deterministically without changing source',()=>{
 const input=annotation.regions.garment,before=JSON.stringify(input);
 const mask=rasterizeReviewedPolygons(input,6,4);
 assert.equal(mask.reduce((a,b)=>a+b,0),6);
 assert.equal(mask[0],1);assert.equal(mask[3],0);assert.equal(mask[6],1);assert.equal(mask[12],0);
 assert.equal(JSON.stringify(input),before);
});
test('approved shadow removal counts as improvement only when all garment pixels are retained',()=>{
 const output=compareApprovedShadowCleanup({annotation,entry,baseline,candidate:ideal});
 assert.equal(output.shadowPixelsRemovedComparedToBaseline,6);
 assert.equal(output.garmentRetention,1);
 assert.equal(output.improvedWithoutGarmentLoss,true);
 assert.equal(output.productionAuthorized,false);
 const damaged=prediction([...Array(2).fill(1),...Array(4).fill(0),...Array(3).fill(1),...Array(15).fill(0)]);
 const failure=compareApprovedShadowCleanup({annotation,entry,baseline,candidate:damaged});
 assert.equal(failure.improvedWithoutGarmentLoss,false);
 assert.equal(failure.garmentFullyPreserved,false);
});
test('refuses pending, self-approved, mismatched photo, and unbounded region input',()=>{
 assert.throws(()=>compareApprovedShadowCleanup({annotation:{...annotation,reviewStatus:'pending'},entry,baseline,candidate:ideal}),/Unapproved/);
 assert.throws(()=>compareApprovedShadowCleanup({annotation:{...annotation,approvedBy:annotation.reviewer},entry,baseline,candidate:ideal}),/Unapproved/);
 assert.throws(()=>compareApprovedShadowCleanup({annotation,entry,baseline,candidate:{...ideal,sourceSha256:'other'}}),/mismatch/);
 assert.throws(()=>rasterizeReviewedPolygons(annotation.regions.garment,20000,20000),/Invalid/);
});
test('rejects overlapping reviewed garment/shadow pixels',()=>{
 const invalid={...annotation,regions:{garment:annotation.regions.garment,shadow:annotation.regions.garment}};
 assert.throws(()=>compareApprovedShadowCleanup({annotation:invalid,entry,baseline,candidate:ideal}),/overlap/);
});
