// Chromium mobile-width, original-grid brush proof.
// Exercises actual PointerEvents while recording canvas dirty-rectangle costs.
// Synthetic input ONLY: visual equality with full recomputation is a software
// invariant, NOT proof of real-photo garment-mask accuracy or physical phones.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+resolve('benchmark/annotate-garment-native.html'));
 const base64=await page.evaluate(()=>{
  const c=document.createElement('canvas');c.width=1400;c.height=1000;
  const p=c.getContext('2d');
  p.fillStyle='#eeeeee';p.fillRect(0,0,1400,1000);
  p.fillStyle='#ac2b4c';p.fillRect(260,140,900,760);
  p.fillStyle='#171717';p.fillRect(480,325,390,180);
  return c.toDataURL('image/png').split(',')[1];
 });
 await page.locator('#photo').setInputFiles({
  name:'validation-0001.jpg',mimeType:'image/png',buffer:Buffer.from(base64,'base64')
 });
 await page.waitForFunction(()=>source?.fileName==='validation-0001.jpg'&&mask?.length===1400000);
 await page.locator('#reviewer').fill('Synthetic Reviewer 1');
 await page.locator('#inventoryMode').check();
 await page.locator('#inventoryId').fill('validation-0001-item-01');
 await page.locator('#inventoryCategory').selectOption('Tops');
 await page.locator('#targetGarment').fill('Synthetic garment, not human reviewed');
 await page.evaluate(()=>{
  window.__canvasReads=[];
  const original=ctx.getImageData.bind(ctx);
  ctx.getImageData=(...args)=>{window.__canvasReads.push({x:args[0],y:args[1],w:args[2],h:args[3]});return original(...args);};
 });
 await page.locator('#canvas').scrollIntoViewIfNeeded();
 const box=await page.locator('#canvas').boundingBox();assert.ok(box);
 // Deliberately draw a small long thin garment boundary on a 1.4 MP source.
 await page.mouse.move(box.x+box.width*.32,box.y+box.height*.24);
 await page.mouse.down();
 for(let i=1;i<=9;i++)
  await page.mouse.move(box.x+box.width*(.32+i*.018),box.y+box.height*(.24+i*.012),{steps:1});
 await page.mouse.up();
 const afterBrush=await page.evaluate(()=>{
  const reads=window.__canvasReads.slice();
  const pixels=mask.reduce((a,b)=>a+b,0);
  const proof=new Uint8Array(ctx.getImageData(0,0,canvas.width,canvas.height).data);
  const original=new Uint8Array(source.base.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data);
  window.__canvasReads=[];
  const maskCopy=new Uint8Array(mask);
  redraw(); // Full-source oracle: dirty-region result must be byte-identical.
  const baseline=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  let differences=0,sourceDiffs=0;
  for(let i=0;i<proof.length;i++)if(proof[i]!==baseline[i])differences++;
  const src=source.base.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
  for(let i=0;i<src.length;i++)if(src[i]!==original[i])sourceDiffs++;
  return {reads,pixels,differences,sourceDiffs,maskSame:mask.every((b,i)=>b===maskCopy[i]),
   originalWidth:source.photo.naturalWidth,originalHeight:source.photo.naturalHeight,
   draftEnabled:!download.disabled};
 });
 assert.equal(afterBrush.originalWidth,1400);
 assert.equal(afterBrush.originalHeight,1000);
 assert.ok(afterBrush.pixels>0);
 assert.equal(afterBrush.differences,0,'Dirty-patch rendering must match full original-grid repaint exactly');
 assert.equal(afterBrush.sourceDiffs,0,'Original photo pixels must never be changed');
 assert.equal(afterBrush.maskSame,true);
 assert.equal(afterBrush.draftEnabled,true);
 assert.ok(afterBrush.reads.length>=4,'Pointer moves must use small dirty-rectangle canvas reads');
 assert.ok(afterBrush.reads.every(x=>x.w>0&&x.h>0&&x.w*x.h<90000),
  'No brush event may synchronously reread the entire source image');
 // After switching to eraser, compare local source restoration with full-redraw.
 await page.locator('#mode').selectOption('0');
 await page.evaluate(()=>{window.__canvasReads=[];});
 const box2=await page.locator('#canvas').boundingBox();
 await page.mouse.move(box2.x+box2.width*.36,box2.y+box2.height*.27);
 await page.mouse.down();await page.mouse.move(box2.x+box2.width*.39,box2.y+box2.height*.29);
 await page.mouse.up();
 const erase=await page.evaluate(()=>{
  const reads=window.__canvasReads.slice();
  const canvasPixels=new Uint8Array(ctx.getImageData(0,0,canvas.width,canvas.height).data);
  const alpha=mask.reduce((a,b)=>a+b,0),maskCopy=new Uint8Array(mask);
  redraw();
  const whole=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  let wrong=0;for(let i=0;i<canvasPixels.length;i++)if(canvasPixels[i]!==whole[i])wrong++;
  return {reads,alpha,wrong,maskSame:mask.every((x,i)=>x===maskCopy[i])};
 });
 assert.equal(erase.wrong,0,'Erasing should restore correct original RGB in each dirty patch');
 assert.equal(erase.maskSame,true);
 assert.ok(erase.reads.every(x=>x.w*x.h<90000));
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({
  browser:'Chromium mobile 390 CSS pixels',
  imagePixels:1400000,brushDirtyReads:afterBrush.reads.length,
  largestBrushRead:Math.max(...afterBrush.reads.map(x=>x.w*x.h)),
  largestEraseRead:Math.max(...erase.reads.map(x=>x.w*x.h)),
  identicalToFullRedraw:true,originalSourcePixelsUnchanged:true,
  nativeHumanMaskAccuracyMeasured:false,physicalPhoneRuns:0
 }));
}finally{await browser.close();}
