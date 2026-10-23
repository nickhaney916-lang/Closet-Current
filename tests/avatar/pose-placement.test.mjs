import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planPosePlacement} from '../../research/avatar/pose-placement.mjs';
const pose={leftShoulder:{x:30,y:20},rightShoulder:{x:70,y:20},leftHip:{x:35,y:60},rightHip:{x:65,y:60},leftAnkle:{x:37,y:120},rightAnkle:{x:63,y:120}};
const base={pose,canvasWidth:100,canvasHeight:140};
test('all six garment slots produce finite positive preview geometry',()=>{
 for(const slot of ['top','bottom','dress','jacket','coat','shoes']){
  const p=planPosePlacement({...base,slot});
  assert.ok(p.targetBox.width>0&&p.targetBox.height>0);
  assert.equal(p.fitSimulation,false);
 }
});
test('outerwear layers have increasing width',()=>{
 const top=planPosePlacement({...base,slot:'top'}).targetBox;
 const jacket=planPosePlacement({...base,slot:'jacket'}).targetBox;
 const coat=planPosePlacement({...base,slot:'coat'}).targetBox;
 assert.ok(top.width<jacket.width&&jacket.width<coat.width);
});
test('pose rejection prevents misleading preview',()=>{
 assert.throws(()=>planPosePlacement({...base,slot:'dress',pose:{...pose,rightHip:{x:65,y:10}}}));
 assert.throws(()=>planPosePlacement({...base,slot:'top',pose:{...pose,leftAnkle:{x:999,y:120}}}));
 assert.throws(()=>planPosePlacement({...base,slot:'hat'}));
});

test('reject oversized canvases before allocating image buffers',()=>{
 assert.throws(()=>planPosePlacement({...base,slot:'top',canvasWidth:10000,canvasHeight:10000}),/Invalid canvas/);
});
test('reject individually inverted limb landmarks even if averages remain ordered',()=>{
 const wrong={...pose,leftHip:{x:35,y:10},rightHip:{x:65,y:100}};
 assert.throws(()=>planPosePlacement({...base,slot:'top',pose:wrong}),/Unusable individual body landmarks/);
});
