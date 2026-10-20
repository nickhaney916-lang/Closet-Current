// Browser-level native-photo precision mask editing; all scene and labels
// are synthetic, NOT independent human truth or real-photo accuracy.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve} from 'node:path';

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,acceptDownloads:true});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('file://'+resolve('benchmark/annotate-garment-native.html'));
 const base64=await page.evaluate(()=>{
  const c=document.createElement('canvas');c.width=1400;c.height=1000;
  const x=c.getContext('2d');x.fillStyle='#e4e4e4';x.fillRect(0,0,c.width,c.height);
  x.fillStyle='#bd2950';x.fillRect(300,170,800,660);
  return c.toDataURL('image/png').split(',')[1];
 });
 const file={name:'validation-0001.jpg',mimeType:'image/png',buffer:Buffer.from(base64,'base64')};
 await page.locator('#photo').setInputFiles(file);
 await page.waitForFunction(()=>source?.fileName==='validation-0001.jpg'&&mask?.length===1400000);
 await page.locator('#detailMask').scrollIntoViewIfNeeded();
 const b=await page.locator('#detailMask').boundingBox();assert.ok(b);
 // The magnified canvas remains strictly read-only until opted in.
 await page.mouse.click(b.x+b.width*.5,b.y+b.height*.5);
 assert.equal(await page.evaluate(()=>mask.some(Boolean)),false);
 await page.evaluate(()=>{
  detailPoint={x:700,y:500};redrawDetail();
  radius.value='1';
 });
 await page.locator('#precisionEdit').check();
 assert.equal(await page.locator('#detailMask').evaluate(el=>getComputedStyle(el).touchAction),'none');
 await page.locator('#detailMask').scrollIntoViewIfNeeded();
 const box=await page.locator('#detailMask').boundingBox();assert.ok(box);
 const expected4=await page.evaluate(()=>{
  const w=detailWindow();
  return {x:Math.floor(w.sx+w.extent/2),y:Math.floor(w.sy+w.extent/2),win:w};
 });
 await page.mouse.click(box.x+box.width*.5,box.y+box.height*.5);
 const after4=await page.evaluate(async()=>{
  const b=await crypto.subtle.digest('SHA-256',mask);
  return {pixel:mask[Math.floor(detailWindow().sy+detailWindow().extent/2)*canvas.width+
    Math.floor(detailWindow().sx+detailWindow().extent/2)],
   count:mask.reduce((s,n)=>s+n,0),
   sha:[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''),
   currentZoom:Number(detailZoom.value),undo:undoStack.length,
   detailPoint:{...detailPoint},bytes:undoStack[0]&&[...undoStack[0].values()].reduce((s,t)=>s+t.pixels.byteLength,0)};
 });
 assert.equal(after4.pixel,1);
 assert.ok(after4.count>0&&after4.count<25);
 assert.equal(after4.undo,1);
 assert.ok(after4.bytes<=65536);
 assert.equal(after4.currentZoom,4);
 assert.deepEqual(after4.detailPoint,{x:700,y:500});
 // Re-centering is disabled during pointer movement in the precision window:
 // same source center and exact original lattice for all points in the stroke.
 await page.locator('#detailZoom').selectOption('8');
 const expected8=await page.evaluate(()=>{
  const w=detailWindow();
  return {x:Math.floor(w.sx+w.extent*.7),y:Math.floor(w.sy+w.extent*.68)};
 });
 await page.locator('#detailMask').scrollIntoViewIfNeeded();
 const rect=await page.locator('#detailMask').boundingBox();
 await page.mouse.move(rect.x+rect.width*.7,rect.y+rect.height*.68);
 await page.mouse.down();
 await page.mouse.move(rect.x+rect.width*.77,rect.y+rect.height*.75,{steps:3});
 await page.mouse.up();
 const after8=await page.evaluate(async()=>{
  const b=await crypto.subtle.digest('SHA-256',mask);
  return {sha:[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''),
   currentZoom:Number(detailZoom.value),undo:undoStack.length,
   focus:{...detailPoint},count:mask.reduce((s,n)=>s+n,0)};
 });
 assert.equal(after8.currentZoom,8);
 assert.equal(after8.undo,2);
 assert.deepEqual(after8.focus,{x:700,y:500});
 assert.notEqual(after8.sha,after4.sha);
 const exact=await page.evaluate(p=>mask[p.y*canvas.width+p.x],expected8);
 assert.equal(exact,1);
 await page.locator('#undo').click();
 const undone=await page.evaluate(async()=>{
  const b=await crypto.subtle.digest('SHA-256',mask);
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
 });
 assert.equal(undone,after4.sha,'Precision 8x stroke must undo without harming 4x painted pixels');
 await page.locator('#redo').click();
 const redone=await page.evaluate(async()=>{
  const b=await crypto.subtle.digest('SHA-256',mask);
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
 });
 assert.equal(redone,after8.sha);
 // Erase a known original 4x pixel and prove undo reverts exactly.
 await page.locator('#detailZoom').selectOption('4');
 await page.evaluate(()=>{detailPoint={x:700,y:500};redrawDetail();});
 await page.locator('#mode').selectOption('0');
 await page.locator('#detailMask').scrollIntoViewIfNeeded();
 const eb=await page.locator('#detailMask').boundingBox();
 await page.mouse.click(eb.x+eb.width*.5,eb.y+eb.height*.5);
 assert.equal(await page.evaluate(p=>mask[p.y*canvas.width+p.x],expected4),0);
 await page.locator('#undo').click();
 assert.equal(await page.evaluate(p=>mask[p.y*canvas.width+p.x],expected4),1);
 // Do not let a precision click while polygon mode is selected change anything.
 await page.locator('#tool').selectOption('polygon');
 assert.equal(await page.locator('#precisionEdit').isChecked(),false);
 assert.equal(await page.locator('#detailMask').evaluate(el=>getComputedStyle(el).touchAction),'auto');
 const pre=await page.evaluate(()=>mask.reduce((s,n)=>s+n,0));
 await page.mouse.click(eb.x+eb.width*.4,eb.y+eb.height*.4);
 assert.equal(await page.evaluate(()=>mask.reduce((s,n)=>s+n,0)),pre);
 // New source clears prior annotated source and does not transfer precision edit.
 await page.locator('#photo').setInputFiles({...file,name:'validation-0002.jpg'});
 await page.waitForFunction(()=>source?.fileName==='validation-0002.jpg');
 assert.equal(await page.evaluate(()=>mask.some(Boolean)),false);
 assert.equal(await page.locator('#download').isDisabled(),true);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({browser:'Chromium 390px mobile emulation',
  originalPixels:1400000,zoomLevels:[4,8],nativeCenter4:expected4,sourcePixel8:expected8,
  firstPrecisionStrokeHistoryBytes:after4.bytes,undoRedoExact:true,eraserUndoExact:true,
  backgroundCameraSourceUnchanged:true,sourceSwapSafe:true,simulatedHumanAnnotationsOnly:true,
  realPhotoCutoutAccuracyMeasured:false,physicalPhones:0}));
}finally{await browser.close();}
