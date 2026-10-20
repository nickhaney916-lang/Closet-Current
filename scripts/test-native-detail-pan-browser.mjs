// Mobile Chromium source-grid inspection navigation. All photos/masks synthetic,
// no independent human evidence or real-world clipping quality measured.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+resolve('benchmark/annotate-garment-native.html'));
 for(const name of ['detailPanLeft','detailPanUp','detailPanRight','detailPanDown'])
  assert.equal(await page.locator('#'+name).isDisabled(),true,'No source must have disabled pan');
 const imageBase64=await page.evaluate(()=>{
  const c=document.createElement('canvas');c.width=640;c.height=480;
  const cx=c.getContext('2d');cx.fillStyle='#f0f0f0';cx.fillRect(0,0,640,480);
  cx.fillStyle='#a62a4e';cx.fillRect(120,50,400,370);
  return c.toDataURL('image/png').split(',')[1];
 });
 const file={name:'validation-0001.jpg',mimeType:'image/png',buffer:Buffer.from(imageBase64,'base64')};
 await page.locator('#photo').setInputFiles(file);
 await page.waitForFunction(()=>source?.fileName==='validation-0001.jpg'&&mask?.length===307200);
 for(const name of ['detailPanLeft','detailPanUp','detailPanRight','detailPanDown'])
  assert.equal(await page.locator('#'+name).isEnabled(),true);
 const widths=await page.evaluate(()=>[detailPanLeft,detailPanUp,detailPanRight,detailPanDown]
  .map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));
 assert.ok(widths.every(s=>s.w>=48&&s.h>=48),'Accessible finger-sized pan buttons');
 const shape=()=>page.evaluate(()=>({point:{...detailPoint},window:{...detailWindow()},
  foreground:mask.reduce((sum,x)=>sum+x,0),strokes,editRevision:editingRevision,
  undo:undoStack.length,redo:redoStack.length,originalHash:source.sourceSha256,
  downloadDisabled:download.disabled}));
 const before=await shape();
 await page.locator('#detailPanRight').click();
 const afterRight=await shape();
 assert.ok(afterRight.point.x>before.point.x);
 assert.equal(afterRight.point.y,before.point.y);
 assert.equal(afterRight.foreground,0);
 assert.equal(afterRight.undo,0);
 assert.equal(afterRight.strokes,0);
 assert.equal(afterRight.editRevision,before.editRevision);
 assert.equal(afterRight.originalHash,before.originalHash);
 await page.locator('#detailPanLeft').click();
 assert.deepEqual((await shape()).point,before.point);
 await page.locator('#detailPanDown').click();
 assert.ok((await shape()).point.y>before.point.y);
 await page.locator('#detailPanUp').click();
 assert.deepEqual((await shape()).point,before.point);
 // At 8x, a pan should move at least one native grid pixel but less than the
 // size of the magnified viewport (not jump across resized model pixels).
 await page.locator('#detailZoom').selectOption('8');
 const before8=await shape();
 await page.locator('#detailPanRight').click();
 const after8=await shape();
 assert.ok(after8.point.x-before8.point.x>=1&&after8.point.x-before8.point.x<before8.window.extent);
 assert.equal(after8.foreground,before8.foreground);
 // Pan clamps safely at photo edges; never invent pixels outside source.
 await page.evaluate(()=>{detailPoint={x:0,y:0};redrawDetail();});
 for(let i=0;i<4;i++){await page.locator('#detailPanLeft').click();await page.locator('#detailPanUp').click();}
 const topLeft=await shape();
 assert.equal(topLeft.point.x,0);assert.equal(topLeft.point.y,0);
 await page.evaluate(()=>{detailPoint={x:canvas.width-1,y:canvas.height-1};redrawDetail();});
 for(let i=0;i<4;i++){await page.locator('#detailPanRight').click();await page.locator('#detailPanDown').click();}
 const edge=await shape();
 assert.ok(edge.point.x<=639&&edge.point.y<=479);
 assert.equal(edge.foreground,0);
 // Active precision brush must end BEFORE panning to avoid carrying a held
 // pointer into a new source-to-screen transform.
 await page.evaluate(()=>{detailPoint={x:320,y:240};redrawDetail();radius.value='1';});
 await page.locator('#precisionEdit').check();
 await page.locator('#detailMask').scrollIntoViewIfNeeded();
 let box=await page.locator('#detailMask').boundingBox();assert.ok(box);
 await page.mouse.move(box.x+box.width*.45,box.y+box.height*.5);
 await page.mouse.down();
 const drawing=await page.evaluate(()=>({painting:precisionPainting,owner:precisionPointerId,
  foreground:mask.reduce((sum,x)=>sum+x,0)}));
 assert.equal(drawing.painting,true);assert.ok(drawing.owner!==null);
 assert.ok(drawing.foreground>0);
 await page.evaluate(()=>detailPanRight.click());
 const moved=await page.evaluate(()=>({painting:precisionPainting,owner:precisionPointerId,
  foreground:mask.reduce((sum,x)=>sum+x,0)}));
 assert.equal(moved.painting,false);assert.equal(moved.owner,null);
 await page.mouse.move(box.x+box.width*.8,box.y+box.height*.83,{steps:3});
 const noGhost=await page.evaluate(()=>mask.reduce((sum,x)=>sum+x,0));
 assert.equal(noGhost,moved.foreground);
 await page.mouse.up();
 await page.locator('#undo').click();
 assert.equal((await shape()).foreground,0,'Pan must not insert undo history; one undo removes the brush');
 await page.locator('#redo').click();
 assert.equal((await shape()).foreground,moved.foreground);
 // Changing photos revokes both export and navigation immediately.
 await page.locator('#photo').setInputFiles({...file,name:'commons-0001.original.jpg'});
 assert.equal(await page.locator('#detailPanLeft').isDisabled(),true);
 assert.equal(await page.locator('#detailPanRight').isDisabled(),true);
 assert.equal(await page.locator('#download').isDisabled(),true);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({browser:'Mobile Chromium, 390 CSS pixels',sourceGrid:[640,480],
  zoomLevels:[4,8],navButtonDimensions:widths,
  sourcePixelPanning:true,sourceEdgeClamping:true,maskUnaffectedByNavigation:true,
  undoUnmodifiedByNavigation:true,panningTerminatesActiveStroke:true,
  ghostStrokePrevented:true,sourceChangeRevokesControls:true,
  independentHumanMasksApproved:0,realPhotoClippingMeasured:false,physicalPhones:0}));
}finally{await browser.close();}
