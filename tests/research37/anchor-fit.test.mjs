import {test} from 'node:test';
import assert from 'node:assert/strict';
import {proposeFit} from '../../research/family-alpha-37/anchor-fit.mjs';
const source={left:{x:.35,y:.25},right:{x:.65,y:.25},check:{x:.5,y:.55}};
const body={left:{x:.34,y:.24},right:{x:.66,y:.24},check:{x:.5,y:.56}};
const bounds={left:.25,right:.75,top:.2,bottom:.65};
const input={source,body,bounds,reviewed:true};
test('reviewed anchors yield bounded rigid preview, preserving inputs',()=>{
 const before=structuredClone(input), r=proposeFit(input);
 assert.equal(r.mode,'rigid-proposal');assert.equal(r.sourcePixelsChanged,false);
 assert.ok(r.checkError<.08);assert.deepEqual(input,before);
});
test('missing review or mismatched anatomy returns honest original-cutout fallback',()=>{
 assert.equal(proposeFit({...input,reviewed:false}).mode,'original-cutout');
 assert.equal(proposeFit({...input,body:{...body,check:{x:.5,y:.9}}}).mode,'original-cutout');
 assert.equal(proposeFit({...input,source:{...source,right:source.left}}).mode,'original-cutout');
});
test('excessive scale, rotation and frame clipping reject',()=>{
 assert.equal(proposeFit({...input,body:{...body,left:{x:.1,y:.24},right:{x:.9,y:.24}}}).mode,'original-cutout');
 assert.equal(proposeFit({...input,body:{...body,left:{x:.34,y:.1},right:{x:.66,y:.3}}}).mode,'original-cutout');
 assert.equal(proposeFit({...input,bounds:{...bounds,left:-.5}}).mode,'original-cutout');
});
