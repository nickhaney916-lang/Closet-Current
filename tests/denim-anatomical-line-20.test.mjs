import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceNeutralThighLine20,sourceNeutralCalfLine20} from '../research/denim-fit-06/source-neutral-anatomical-line-20.mjs';
test('P20 authentic anatomical hip/knee thigh line reduces modeled rear bulge only between protected endpoints',()=>{
 const off=sourceNeutralThighLine20(0),end=sourceNeutralThighLine20(1),mid=sourceNeutralThighLine20(.48);
 assert.deepEqual(off,{rearMeters:0,sideMeters:0});
 assert.deepEqual(end,{rearMeters:0,sideMeters:0});
 assert.ok(mid.rearMeters>.004&&mid.rearMeters<=.0045);
 assert.ok(mid.sideMeters>.0015&&mid.sideMeters<=.0018);
 for(const phase of [-.1,1.01,NaN,Infinity])
  assert.throws(()=>sourceNeutralThighLine20(phase),/P20 requires/);
});
test('P20 source-measured tapered jeans clean calf more than original flared denim',()=>{
 const tapered=sourceNeutralCalfLine20(.45,.93);
 const wide=sourceNeutralCalfLine20(.45,1.19);
 assert.ok(tapered>.0029&&tapered<=.003);
 assert.ok(wide>0&&wide<tapered);
 assert.equal(sourceNeutralCalfLine20(0,.93),0);
 assert.equal(sourceNeutralCalfLine20(1,1.19),0);
 for(const [phase,ratio] of [[-.1,1],[1.1,1],[.5,NaN],[.5,0],[.5,3]])
  assert.throws(()=>sourceNeutralCalfLine20(phase,ratio),/P20 requires/);
});
test('P20 default OFF, no mutable original front/skin/UV or synthetic rear photo; only P19 ancestry',()=>{
 const src=readFileSync('research/denim-fit-06/static-source-denim-fit.mjs','utf8');
 for(const word of ['sourceAnatomicalLine20=false','sourceAnatomicalLine20&&!sourcePhotoSigned19',
  'sourceNeutralThighLine20','sourceNeutralCalfLine20','photoAnatomicalThighMovedVertices20',
  'photoAnatomicalCalfMovedVertices20','originalJPEGUVRestSkinProtected20:true',
  'noInventedPhotographicRear20:true','sourceUVRestAndSkinByteIdentical:true'])
   assert.ok(src.includes(word),word);
 const app=readFileSync('research/fabric-sweep-04/wardrobe-demo.mjs','utf8');
 assert.ok(app.includes("get('denimLine20')==='after'"));
 assert.ok(app.includes('sourceDenimLine20Enabled'));
});
