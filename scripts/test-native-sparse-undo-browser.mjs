// Mobile Chromium original-grid undo/redo regression. SYNTHETIC photo only;
// this cannot establish real-human review or measured real-photo clipping.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve} from 'node:path';

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+resolve('benchmark/annotate-garment-native.html'));
 const raw=await page.evaluate(()=>{
  const c=document.createElement('canvas');c.width=1400;c.height=1000;
  const ctx=c.getContext('2d');ctx.fillStyle='#dadada';ctx.fillRect(0,0,c.width,c.height);
  ctx.fillStyle='#ba2640';ctx.fillRect(250,140,900,720);
  return c.toDataURL('image/png').split(',')[1];
 });
 await page.locator('#photo').setInputFiles({
  name:'validation-0001.jpg',mimeType:'image/png',buffer:Buffer.from(raw,'base64')
 });
 await page.waitForFunction(()=>source?.fileName==='validation-0001.jpg'&&mask?.length===1400000);
 const describe=()=>page.evaluate(async()=>{
  const bytes=await crypto.subtle.digest('SHA-256',mask);
  const hash=[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
  const historyBytes=stack=>stack.reduce((total,edit)=>
   total+[...edit.values()].reduce((sum,tile)=>sum+tile.pixels.byteLength,0),0);
  return {sha256:hash,foreground:mask.reduce((a,b)=>a+b,0),
   undoBytes:historyBytes(undoStack),redoBytes:historyBytes(redoStack),
   undo:undoStack.length,redo:redoStack.length,originalSha:source.sourceSha256,
   sourceImage:source.fileName};
 });
 const before=await describe();
 assert.equal(before.foreground,0);
 await page.locator('#canvas').scrollIntoViewIfNeeded();
 const draw=async(x,y)=>{
  const bound=await page.locator('#canvas').boundingBox();
  assert.ok(bound);
  await page.mouse.click(bound.x+bound.width*x,bound.y+bound.height*y);
 };
 await draw(.35,.32);
 const first=await describe();
 assert.ok(first.foreground>0);
 assert.equal(first.undo,1);assert.ok(first.undoBytes>0);
 assert.ok(first.undoBytes<=65536,'Single brush tap must not allocate a full 1.4 MB mask history');
 await draw(.68,.58);
 const second=await describe();
 assert.ok(second.foreground>first.foreground);
 assert.equal(second.undo,2);assert.ok(second.undoBytes<=131072);
 assert.equal(second.originalSha,before.originalSha);
 await page.locator('#undo').click();
 const undoneOnce=await describe();
 assert.equal(undoneOnce.sha256,first.sha256);
 assert.equal(undoneOnce.redo,1);
 await page.locator('#undo').click();
 const undoneTwice=await describe();
 assert.equal(undoneTwice.sha256,before.sha256);
 await page.locator('#redo').click();
 assert.equal((await describe()).sha256,first.sha256);
 await page.locator('#redo').click();
 assert.equal((await describe()).sha256,second.sha256);
 await page.locator('#undo').click();
 // A new edit invalidates obsolete redo; no unexpected previous outfit mask.
 await draw(.76,.24);
 const newEdit=await describe();
 assert.equal(newEdit.redo,0);
 assert.notEqual(newEdit.sha256,second.sha256);
 // Start a polygon after a brush edit and verify inversion of ALL touched tiles.
 await page.locator('#tool').selectOption('polygon');
 await draw(.40,.40);await draw(.54,.41);await draw(.48,.66);
 const prePolygon=await describe();
 await page.locator('#applyPolygon').click();
 const filled=await describe();
 assert.notEqual(filled.sha256,prePolygon.sha256);
 assert.equal(filled.undo,2);
 await page.locator('#undo').click();
 assert.equal((await describe()).sha256,prePolygon.sha256);
 await page.locator('#redo').click();
 assert.equal((await describe()).sha256,filled.sha256);
 // Erasing restores exact old mask through the same sparse undo pathway.
 await page.locator('#tool').selectOption('brush');
 await page.locator('#mode').selectOption('0');
 await draw(.47,.50);
 const erased=await describe();
 assert.notEqual(erased.sha256,filled.sha256);
 await page.locator('#undo').click();
 assert.equal((await describe()).sha256,filled.sha256);
 await page.locator('#redo').click();
 assert.equal((await describe()).sha256,erased.sha256);
 const final=await describe();
 assert.equal(final.originalSha,before.originalSha);
 assert.equal(final.sourceImage,'validation-0001.jpg');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({
  browser:'Chromium emulation at 390px',nativePixels:1400000,
  singleTapUndoBytes:first.undoBytes,twoTapUndoBytes:second.undoBytes,
  originalFullMaskCopyBytes:2*1400000,
  undoRedoAndPolygonExact:true,erasingExact:true,
  nativeOriginalPhotoUnchanged:true,humanLabelsAuthenticated:0,
  realPhotoClippingQualityMeasured:false,physicalPhones:0
 }));
}finally{await browser.close();}
