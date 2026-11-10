/**
 * Mission 1 P781, two real browser engines / actual 6MP portrait JPEG,
 * synthetic geometric image fixture and simulated clicks only.
 *
 * Prevent CSS "object-fit:contain" max-height letterbox margins from
 * corrupting exact original-pixel human review annotations.
 *
 * This does NOT verify a physical phone, a real human or photo rights.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const width=1000,height=6000;
const original=await sharp({create:{width,height,channels:3,background:{r:40,g:110,b:160}}})
 .jpeg({quality:80}).toBuffer();
assert.ok(original.length<8*1024*1024);
const photoId='hold-synthetic-letterbox-original';
const sourceSHA256=hash(original);
const seal={schema:'closet-current-prospective-holdout/v1',sealSHA256:'a'.repeat(64),
 photos:[{id:photoId,image:'synthetic-portrait-original.jpg',sha256:sourceSHA256,width,height}]};
const out='benchmark/m1-human-reviewer-ui-774',receipts=[];
await mkdir(out,{recursive:true});
for(const [engineName,launcher,viewportWidth] of [
 ['chromium',chromium,320],['chromium',chromium,390],['webkit',webkit,390]
]){
 const browser=await launcher.launch({headless:true,
  args:engineName==='chromium'?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({
   viewport:{width:viewportWidth,height:844},deviceScaleFactor:1,
   isMobile:true,hasTouch:true,acceptDownloads:true,serviceWorkers:'block'
  });
  try{
   const page=await context.newPage(),external=[],errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(/^https?:/i.test(r.url()))external.push(r.url());});
   await page.goto(pathToFileURL(resolve('research/mission1-reviewer-774/offline-photo-polygon-review.html')).href);
   await page.locator('#cohort').setInputFiles({
    name:'sealed-synthetic-portrait.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(seal))
   });
   await page.locator('#original').setInputFiles({
    name:'unaltered-source-original.jpg',mimeType:'image/jpeg',buffer:original
   });
   await page.locator('#verify').click();
   await page.getByText(/Exact original JPEG SHA-256 and dimensions VERIFIED/).waitFor();
   const canvas=page.locator('#drawing');
   assert.deepEqual(await canvas.evaluate(c=>[c.width,c.height]),[width,height]);
   const g=await canvas.evaluate(c=>{
    const r=c.getBoundingClientRect(),s=getComputedStyle(c);
    const left=parseFloat(s.borderLeftWidth)||0,top=parseFloat(s.borderTopWidth)||0;
    const right=parseFloat(s.borderRightWidth)||0,bottom=parseFloat(s.borderBottomWidth)||0;
    const cw=r.width-left-right,ch=r.height-top-bottom;
    const scale=Math.min(cw/c.width,ch/c.height);
    return {rectW:r.width,rectH:r.height,
     left:left+(cw-c.width*scale)/2,top:top+(ch-c.height*scale)/2,
     paintedW:c.width*scale,paintedH:c.height*scale,scale};
   });
   assert.ok(g.rectH<=551,'CSS portrait max-height must activate');
   assert.ok(g.paintedW<g.rectW*.6,'portrait should be letterboxed horizontally');
   // Synthetic click in the large visible blank region must NOT add a point.
   await canvas.click({position:{x:20,y:g.rectH/2}});
   assert.match(await page.locator('#status').textContent(),/visible photo, not its blank outer border/);
   assert.match(await page.locator('#points').textContent(),/^0 unfinished points/);
   assert.equal(await page.locator('#finish').isDisabled(),true);

   const points=[[140,600],[840,600],[840,4800],[140,4800]];
   for(let i=0;i<points.length;i++){
    const [x,y]=points[i];
    await canvas.click({position:{x:g.left+x*g.scale,y:g.top+y*g.scale}});
    assert.match(await page.locator('#points').textContent(),
     new RegExp('^'+(i+1)+' unfinished points'));
   }
   await page.locator('#finish').click();
   await page.locator('#category').selectOption('Tops');
   await page.locator('#subtype').selectOption('Blouse');
   await page.locator('#color').selectOption('Blue');
   await page.locator('#add').click();
   assert.equal(await page.locator('#export').isEnabled(),true);
   const downloadable=page.waitForEvent('download');
   await page.locator('#export').click();
   const received=await downloadable;
   const stream=await received.createReadStream(),parts=[];
   for await(const ch of stream)parts.push(ch);
   const result=JSON.parse(Buffer.concat(parts).toString('utf8'));
   assert.equal(result.sourceId,photoId);
   assert.equal(result.sourceSHA256,sourceSHA256);
   assert.equal(result.regions.length,1);
   assert.equal(result.regions[0].polygons[0].length,4);
   for(let i=0;i<points.length;i++){
    const [x,y]=points[i],got=result.regions[0].polygons[0][i];
    assert.ok(Math.abs(got[0]-x)<23 && Math.abs(got[1]-y)<23,
     'P781 exports source pixel geometry rather than the distorted CSS canvas box: '+JSON.stringify({want:points[i],got,engineName,viewportWidth}));
   }
   assert.deepEqual(errors,[]);
   assert.deepEqual(external,[]);
   const screen=out+'/p781-synthetic-portrait-'+engineName+'-'+viewportWidth+'.png';
   await page.screenshot({path:screen,fullPage:true});
   const screenBytes=await readFile(screen);
   receipts.push({engine:engineName,viewportWidth,originalJPEGPixelDimensions:[width,height],
    originalSHA256:sourceSHA256,screenshotSHA256:hash(screenBytes),
    letterboxPresent:true,invalidGutterRejected:true,sourceCoordinatesPreserved:true,
    untouchedOriginalSource:true,notHumanGroundTruth:true,notPhysicalPhone:true,
    releaseAuthorized:false});
   console.log('M1_P781_TALL_PORTRAIT_ORIGINAL_PIXEL_COORDINATES_PASS',
    JSON.stringify(receipts.at(-1)));
  }finally{await context.close();}
 }finally{await browser.close();}
}
assert.equal(receipts.length,3);
await writeFile(out+'/p781-synthetic-portrait-exact-original-coordinate-receipts.json',
 JSON.stringify({receipts,zeroRealHumanReceipts:true,zeroRealPhoneAcceptance:true,
  familyAlpha:'HOLD'},null,2)+'\n');
