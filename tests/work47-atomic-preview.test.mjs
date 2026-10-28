import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {repaintReviewedPreviewAtomic} from '../research/work47/atomic-preview.mjs';

function setup(){
 const previous={width:720,height:1200,isConnected:true,
   style:{cssText:'position:absolute;pointer-events:none'},
   dataset:{work47:'top'},pixels:'ORIGINAL_REVIEWED_GARMENT',
   replaceWith(next){this.isConnected=false;next.isConnected=true;this.replacedBy=next;}};
 const record={canvas:previous,source:{original:'private-reviewed-garment'},
   profile:{slot:'top'},adjust:{dx:0,dy:0,scale:1,edgeCleanup:false}};
 const doc={createElement(tag){assert.equal(tag,'canvas');return {width:0,height:0,isConnected:false,
   style:{cssText:''},dataset:{},pixels:'PARTIALLY_DRAWN'};}};
 let active=true;
 return {record,previous,doc,active:()=>active,deactivate:()=>{active=false;}};
}
test('successful complete preview swaps DOM exactly once and retains source and pixel identity',()=>{
 const a=setup(),original=a.record.source;
 const result=repaintReviewedPreviewAtomic(a.record,{
  doc:a.doc,isCurrent:a.active,render(canvas,source,profile,adjust){
   assert.equal(canvas.isConnected,false);
   assert.equal(a.previous.isConnected,true);
   assert.equal(source,original);
   assert.equal(profile,a.record.profile);assert.equal(adjust,a.record.adjust);
   canvas.width=720;canvas.height=1200;canvas.pixels='FULL_NEW_GARMENT';
   return {fit:'complete'};
  }});
 assert.deepEqual(result,{fit:'complete'});
 assert.equal(a.record.source,original);
 assert.equal(a.record.canvas.pixels,'FULL_NEW_GARMENT');
 assert.notEqual(a.record.canvas,a.previous);
 assert.equal(a.previous.replacedBy,a.record.canvas);
 assert.equal(a.record.canvas.dataset.work47,'top');
 assert.equal(a.record.canvas.style.cssText,'position:absolute;pointer-events:none');
});
test('a renderer throwing AFTER painting cannot erase previously visible fitted garment',()=>{
 const a=setup();
 assert.throws(()=>repaintReviewedPreviewAtomic(a.record,{
  doc:a.doc,isCurrent:a.active,render(canvas){
   canvas.width=720;canvas.height=1200;canvas.pixels='DAMAGED_PARTIAL_DRAW';
   throw Error('SIMULATED_CANVAS_DRAW_FAILURE');
  }}),/SIMULATED_CANVAS_DRAW_FAILURE/);
 assert.equal(a.record.canvas,a.previous);
 assert.equal(a.previous.pixels,'ORIGINAL_REVIEWED_GARMENT');
 assert.equal(a.previous.isConnected,true);
 assert.equal(a.previous.replacedBy,undefined);
});
test('no empty/uncompleted frame is ever committed, even if render returns normally',()=>{
 const a=setup();
 assert.throws(()=>repaintReviewedPreviewAtomic(a.record,{
  doc:a.doc,isCurrent:a.active,render(canvas){canvas.width=720;return null;}
 }),/changed during redraw/);
 assert.equal(a.record.canvas,a.previous);
 assert.equal(a.previous.isConnected,true);
});
test('owner/session revocation DURING rendering aborts before committing pixels',()=>{
 const a=setup();
 assert.throws(()=>repaintReviewedPreviewAtomic(a.record,{
  doc:a.doc,isCurrent:a.active,render(canvas){canvas.width=720;canvas.height=1200;a.deactivate();}
 }),/changed during redraw/);
 assert.equal(a.record.canvas,a.previous);
});
test('preview source selection changing or original old preview removed aborts a commit',()=>{
 const a=setup();
 assert.throws(()=>repaintReviewedPreviewAtomic(a.record,{
  doc:a.doc,isCurrent:a.active,render(canvas){canvas.width=720;canvas.height=1200;a.record.canvas={};}
 }),/changed during redraw/);
 assert.equal(a.previous.replacedBy,undefined);
 const b=setup();b.previous.isConnected=false;
 assert.throws(()=>repaintReviewedPreviewAtomic(b.record,{
  doc:b.doc,isCurrent:b.active,render(){throw Error('MUST NOT RENDER');}
 }),/no longer current/);
});
test('atomic fit is only offline, stateless and retains default-off fringe/owner release HOLD',async()=>{
 const [atomic,editor,build,fit]=await Promise.all([
  readFile('research/work47/atomic-preview.mjs','utf8'),
  readFile('research/work47/editor.mjs','utf8'),
  readFile('scripts/build-work47-fit-hold.mjs','utf8'),
  readFile('research/work47/fit.mjs','utf8')
 ]);
 for(const src of [atomic,editor,fit])assert.doesNotMatch(src,/fetch\(|indexedDB|localStorage|XMLHttpRequest|service_role|hlkgymugtfbirlpunsra/);
 assert.match(editor,/repaintReviewedPreviewAtomic\(record,\{doc,render:paintGarmentFit,isCurrent:/);
 assert.match(editor,/edgeCleanup:false/);
 assert.match(editor,/records\.clear\(\);foreground\?\.remove\(\)/);
 assert.match(build,/\['editor\.mjs','fit\.mjs','edge-fringe\.mjs','atomic-preview\.mjs','cutout-integrity\.mjs'\]/);
 assert.match(build,/deploymentAuthorized:false/);
});
