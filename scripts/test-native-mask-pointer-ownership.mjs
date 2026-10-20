// Verify two-finger and interrupted-gesture safety in the OFFLINE human mask
// editor. Synthetic browser gestures only; no actual human reference or real
// mask quality metrics. Neither photo nor native binary reference grid changes.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,acceptDownloads:true});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('file://'+resolve('benchmark/annotate-garment-native.html'));
 const original=await page.evaluate(()=>{
  const c=document.createElement('canvas');c.width=640;c.height=480;
  const x=c.getContext('2d');x.fillStyle='#fafafa';x.fillRect(0,0,640,480);
  x.fillStyle='#a12746';x.fillRect(100,80,440,330);
  return c.toDataURL('image/png').split(',')[1];
 });
 await page.locator('#photo').setInputFiles({
  name:'validation-0001.jpg',mimeType:'image/png',buffer:Buffer.from(original,'base64')
 });
 await page.waitForFunction(()=>source?.fileName==='validation-0001.jpg'&&mask?.length===307200);
 const state=()=>page.evaluate(()=>({
  n:mask.reduce((a,v)=>a+v,0),undo:undoStack.length,
  detail:detailPoint&&{...detailPoint},painting,precisionPainting,
  brushPointerId,precisionPointerId,zoom:detailZoom.value
 }));
 const canvas=page.locator('#canvas');
 await canvas.scrollIntoViewIfNeeded();
 let rect=await canvas.boundingBox();assert.ok(rect);
 await page.mouse.move(rect.x+rect.width*.32,rect.y+rect.height*.38);
 await page.mouse.down();
 const beforeForeign=await state();
 assert.equal(beforeForeign.painting,true);
 assert.ok(beforeForeign.brushPointerId!==null);
 // Extra non-primary pointer cannot alter active stroke or magnifier focus.
 await page.evaluate(()=>{
  const el=document.querySelector('#canvas'),r=el.getBoundingClientRect();
  el.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerType:'touch',pointerId:333,
   isPrimary:false,buttons:1,clientX:r.right-12,clientY:r.bottom-12}));
  el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',pointerId:333,
   isPrimary:false,buttons:1,clientX:r.right-12,clientY:r.bottom-12}));
 });
 const afterForeign=await state();
 assert.equal(afterForeign.n,beforeForeign.n);
 assert.deepEqual(afterForeign.detail,beforeForeign.detail);
 assert.equal(afterForeign.brushPointerId,beforeForeign.brushPointerId);
 await page.mouse.move(rect.x+rect.width*.41,rect.y+rect.height*.43,{steps:4});
 const afterValid=await state();
 assert.ok(afterValid.n>beforeForeign.n);
 // A canceled gesture must stop immediately and leave its partial correction
 // undoable, never continuing because of a stray pointermove.
 await page.evaluate(()=>{
  const el=document.querySelector('#canvas');
  el.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerType:'mouse',
   isPrimary:true,pointerId:brushPointerId}));
 });
 assert.equal((await state()).brushPointerId,null);
 const interrupted=await state();
 await page.mouse.move(rect.x+rect.width*.75,rect.y+rect.height*.75);
 assert.equal((await state()).n,interrupted.n);
 await page.mouse.up();
 await page.locator('#undo').click();
 assert.equal((await state()).n,0);
 await page.locator('#redo').click();
 assert.equal((await state()).n,interrupted.n);
 // In magnifier mode main photo is navigation-only, not a brush. Users
 // may tap the source to choose a cuff without painting it by accident.
 await page.locator('#precisionEdit').check();
 await canvas.scrollIntoViewIfNeeded();
 rect=await canvas.boundingBox();assert.ok(rect);
 const prevCount=(await state()).n;
 await page.mouse.click(rect.x+rect.width*.62,rect.y+rect.height*.61);
 const navigated=await state();
 assert.equal(navigated.n,prevCount);
 assert.equal(navigated.painting,false);
 assert.ok(navigated.detail);
 // In magnifier editing, only the pointer that began painting may move it.
 const detail=page.locator('#detailMask');await detail.scrollIntoViewIfNeeded();
 let detailRect=await detail.boundingBox();assert.ok(detailRect);
 await page.mouse.move(detailRect.x+detailRect.width*.5,detailRect.y+detailRect.height*.5);
 await page.mouse.down();
 const startDetail=await state();
 assert.equal(startDetail.precisionPainting,true);
 assert.ok(startDetail.precisionPointerId!==null);
 await page.evaluate(()=>{
  const el=document.querySelector('#detailMask'),r=el.getBoundingClientRect();
  el.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerType:'touch',
   pointerId:444,isPrimary:false,buttons:1,clientX:r.left+20,clientY:r.top+20}));
  // Also cannot navigate main photo while painting in precision magnifier.
  const main=document.querySelector('#canvas'),mr=main.getBoundingClientRect();
  main.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerType:'touch',
   pointerId:444,isPrimary:false,buttons:1,clientX:mr.right-4,clientY:mr.bottom-4}));
 });
 const foreignDetail=await state();
 assert.equal(foreignDetail.n,startDetail.n);
 assert.deepEqual(foreignDetail.detail,startDetail.detail);
 await page.mouse.move(detailRect.x+detailRect.width*.57,detailRect.y+detailRect.height*.57,{steps:2});
 assert.ok((await state()).n>startDetail.n);
 // Zoom changes end the held pointer stroke. It must not continue painting
 // under a different display-to-native coordinate transform.
 await page.locator('#detailZoom').selectOption('8');
 const afterZoom=await state();
 assert.equal(afterZoom.precisionPointerId,null);
 assert.equal(afterZoom.precisionPainting,false);
 await page.mouse.move(detailRect.x+detailRect.width*.7,detailRect.y+detailRect.height*.7);
 assert.equal((await state()).n,afterZoom.n);
 await page.mouse.up();
 // Start a NEW precision stroke at 8x and interrupt it via lost capture.
 await detail.scrollIntoViewIfNeeded();
 detailRect=await detail.boundingBox();
 await page.mouse.move(detailRect.x+detailRect.width*.45,detailRect.y+detailRect.height*.4);
 await page.mouse.down();
 const held=await state();
 assert.ok(held.precisionPointerId!==null);
 await page.evaluate(()=>{
  const el=document.querySelector('#detailMask');
  el.dispatchEvent(new PointerEvent('lostpointercapture',{bubbles:true,pointerType:'mouse',
   isPrimary:true,pointerId:precisionPointerId}));
 });
 const lost=await state();
 assert.equal(lost.precisionPainting,false);
 assert.equal(lost.precisionPointerId,null);
 await page.mouse.move(detailRect.x+detailRect.width*.76,detailRect.y+detailRect.height*.76);
 assert.equal((await state()).n,lost.n);
 await page.mouse.up();
 // Selecting another original revokes any surviving pointer and all draft
 // bytes, even when the currently selected photo looks identical.
 await page.locator('#photo').setInputFiles({
  name:'validation-0002.jpg',mimeType:'image/png',buffer:Buffer.from(original,'base64')
 });
 await page.waitForFunction(()=>source?.fileName==='validation-0002.jpg'&&mask?.length===307200);
 assert.equal((await state()).n,0);
 assert.equal((await state()).brushPointerId,null);
 assert.equal((await state()).precisionPointerId,null);
 assert.equal(await page.locator('#download').isDisabled(),true);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({browser:'Chromium mobile width 390px',sourcePixels:307200,
  secondaryTouchIgnoredForPrimary:true,secondaryTouchIgnoredForMagnifier:true,
  canceledMainGestureStops:true,lostPrecisionCaptureStops:true,
  zoomInterruptDoesNotShiftBrush:true,mainPhotoNavigationPaintsNothing:true,
  undoAfterCancelExact:true,photoSwitchClearsBothPointers:true,
  humanMaskApprovals:0,realPhotoAccuracyMeasured:0,physicalPhones:0}));
}finally{await browser.close();}
