import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {verifyOriginalTap798,sourceRectFromVerifiedPoints800}
 from '../public/owner-original-photo-point-798.mjs';

const genuine=readFileSync('benchmark/fixtures/commons-0053.jpg');
const expected=createHash('sha256').update(genuine).digest('hex');
const originalRecord=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'))
 .find(x=>x.id==='commons-0053');
assert.equal(expected,originalRecord.sha256,'P800 original garment bytes must match pinned genuine CC BY photo');
const originalPhoto={image:'data:image/jpeg;base64,'+genuine.toString('base64'),
 sha256:expected,width:320,height:480};
const lease={owner:'owner-fixture-A',live:true};
const info=(clientX,clientY,changes={})=>({
 originalPhoto,sourceSHA256:expected,sourceHashVerified:true,
 ownerId:'owner-fixture-A',sourceId:'sourceA',
 currentOwner:()=>lease.owner,sourceStillCurrent:()=>lease.live,
 rect:{left:40,top:20,width:160,height:240},clientX,clientY,
 imageNaturalWidth:320,imageNaturalHeight:480,cryptoProvider:webcrypto,...changes
});
const point=(x,y)=>verifyOriginalTap798(info(x,y));
test('P800 two independently source-SHA verified input corners produce minimal correct original-pixel owner box but NO mask or save',async()=>{
 lease.owner='owner-fixture-A';lease.live=true;
 const a=await point(72,68),b=await point(152,212);
 const rect=sourceRectFromVerifiedPoints800(a,b);
 assert.deepEqual([rect.x0,rect.y0,rect.x1,rect.y1],[64,96,225,385]);
 assert.equal(rect.sourceSHA256,expected);
 assert.equal(rect.ownerId,'owner-fixture-A');
 assert.equal(rect.twoVerifiedOriginalJPEGCornerTaps,true);
 for(const field of ['independentHumanIdentityVerified','actualGarmentMaskGenerated',
  'sam2ModelRun','maskVerified','ownerApprovedGarment','categoryConfirmed',
  'subtypeConfirmed','colorConfirmed','autoSaveAllowed','privatePersisted'])
  assert.equal(rect[field],false,field);
 assert.equal(Object.isFrozen(rect),true);
 assert.equal(rect.sourceBoundingBoxOnly,true);
 assert.equal(rect.normalizedX0,64/320);
});
test('P800 reversed drag direction normalizes identical source rectangle and visible boundaries',async()=>{
 lease.owner='owner-fixture-A';lease.live=true;
 const a=await point(72,68),b=await point(152,212);
 const rectA=sourceRectFromVerifiedPoints800(a,b);
 const rectB=sourceRectFromVerifiedPoints800(b,a);
 assert.deepEqual([rectA.x0,rectA.y0,rectA.x1,rectA.y1],
  [rectB.x0,rectB.y0,rectB.x1,rectB.y1]);
 assert.ok(rectA.x1<=320&&rectA.y1<=480);
 assert.ok(rectA.normalizedX1<=1&&rectA.normalizedY1<=1);
});
test('P800 tiny, zero, or one-dimensional rectangle is NEVER treated as a garment',async()=>{
 lease.owner='owner-fixture-A';lease.live=true;
 const a=await point(72,68);
 await assert.rejects(Promise.resolve().then(()=>sourceRectFromVerifiedPoints800(a,a)),/rectangle too small/);
 const b=await point(72,190);
 assert.throws(()=>sourceRectFromVerifiedPoints800(a,b),/rectangle too small/);
});
test('P800 cannot combine two verified points belonging to different original SHA, owner or source',async()=>{
 lease.owner='owner-fixture-A';lease.live=true;
 const a=await point(72,68),b=await point(152,212);
 for(const modified of [{sourceSHA256:'f'.repeat(64)},{ownerId:'owner-fixture-B'},
    {sourceId:'other-source'},{sourceWidth:321},{sourceHeight:481},
    {sourceBytesSHA256Verified:false},{capturedFromOriginalJPEG:false},
    {schema:'fake'},{pointX:-1},{pointY:5000}]){
  assert.throws(()=>sourceRectFromVerifiedPoints800(a,{...b,...modified}),/M1_OWNER_SOURCE_POINT_798/);
 }
});
test('P800 invalid polygon-like rectangles, bogus precision and missing original point evidence fail closed',async()=>{
 lease.owner='owner-fixture-A';lease.live=true;
 const a=await point(72,68),b=await point(152,212);
 assert.throws(()=>sourceRectFromVerifiedPoints800({},b),/two verified/);
 assert.throws(()=>sourceRectFromVerifiedPoints800(a,b,{minimumFraction:NaN}),/two verified/);
 assert.throws(()=>sourceRectFromVerifiedPoints800(a,b,{minimumFraction:.001}),/two verified/);
 assert.throws(()=>sourceRectFromVerifiedPoints800(a,b,{minimumFraction:.5}),/two verified/);
 assert.throws(()=>sourceRectFromVerifiedPoints800(a,{...b,pointX:2.3}),/corner outside/);
});
test('P800 origin-byte tampering and signed owner switching refuse point before a bounding rectangle can exist',async()=>{
 lease.owner='owner-fixture-A';lease.live=true;
 const a=await point(72,68);
 lease.owner='owner-fixture-B';
 await assert.rejects(point(152,212),/owner session/);
 lease.owner='owner-fixture-A';lease.live=false;
 await assert.rejects(point(152,212),/owner session/);
 lease.live=true;
 const changed=Buffer.from(genuine);changed[Math.floor(changed.length/2)]^=1;
 await assert.rejects(verifyOriginalTap798(info(152,212,{
  originalPhoto:{...originalPhoto,image:'data:image/jpeg;base64,'+changed.toString('base64')}
 })),/no longer match/);
 assert.ok(a.sourceBytesSHA256Verified);
});
