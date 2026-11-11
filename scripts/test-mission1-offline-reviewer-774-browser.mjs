/**
 * P774 browser-only workflow proof. All image pixels, reviewer clicks and
 * source authorizations here are synthetic CI fixtures. ZERO real humans,
 * real garment ground truth or photo rights are asserted.
 */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
import {authorManualSourceLabel774} from '../research/mission1-reviewer-774/offline-human-polygon-receipt.mjs';

const engines=process.env.M1_REVIEWER_BROWSER||'chromium,webkit';
const names=engines.split(',').map(x=>x.trim()).filter(Boolean);
assert.ok(names.length>=1&&names.every(x=>['chromium','webkit'].includes(x)));
const out='benchmark/m1-human-reviewer-ui-774';
await mkdir(out,{recursive:true});
const hashes=[];
const width=64,height=64;
const rgba=Buffer.alloc(width*height*3,255);
for(let y=0;y<height;y++)for(let x=0;x<width;x++){
 const i=(y*width+x)*3;
 if(x<26&&y<30){rgba[i]=40;rgba[i+1]=90;rgba[i+2]=220;}
 if(x>30&&y>24){rgba[i]=130;rgba[i+1]=65;rgba[i+2]=45;}
}
const photo=await sharp(rgba,{raw:{width,height,channels:3}}).jpeg({quality:95}).toBuffer();
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceSHA=sha(photo),photoId='hold-synthetic-browser-fixture';
const seal={schema:'closet-current-prospective-holdout/v1',sealSHA256:'a'.repeat(64),
 photos:[{id:photoId,image:'synthetic-fixture.jpg',sha256:sourceSHA,width,height}]};
for(const engine of names){
 const browser=await ({chromium,webkit})[engine].launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
 try{
  for(const screenWidth of [320,390]){
   const context=await browser.newContext({
    viewport:{width:screenWidth,height:844},isMobile:true,hasTouch:true,
    serviceWorkers:'block',acceptDownloads:true
   });
   try{
    const page=await context.newPage(),external=[];
    page.on('request',request=>{
     if(/^https?:/i.test(request.url()))external.push(request.url());
    });
    await page.goto(pathToFileURL(resolve('research/mission1-reviewer-774/offline-photo-polygon-review.html')).href);
    await page.locator('#cohort').setInputFiles({
     name:'sealed-fixture-only.json',mimeType:'application/json',
     buffer:Buffer.from(JSON.stringify(seal))
    });
    await page.locator('#original').setInputFiles({
     name:'synthetic-fixture.jpg',mimeType:'image/jpeg',buffer:photo
    });
    await page.locator('#verify').click();
    await page.getByText(/Exact original JPEG SHA-256 and dimensions VERIFIED/).waitFor();
    assert.equal(await page.locator('#export').isDisabled(),true);
    const draw=async pts=>{
     const canvas=page.locator('#drawing');
     await canvas.scrollIntoViewIfNeeded();
     for(const [i,point] of pts.entries()){
      const [x,y]=point,rect=await canvas.boundingBox();
      assert.ok(rect);
      // Locator click scrolls to the canvas even when a 320px phone has the
      // entire fieldset below the viewport; raw page.mouse.click does not.
      await canvas.click({position:{x:rect.width*x/64,y:rect.height*y/64}});
      assert.match(await page.locator('#points').textContent(),
       new RegExp('^'+(i+1)+' unfinished points'));
     }
     await page.locator('#finish').click();
    };
    await draw([[3,3],[22,3],[22,25],[3,25]]);
    assert.equal(await page.locator('#holeMode').isEnabled(),true);
    await page.locator('#holeMode').click();
    assert.equal(await page.locator('#holeMode').getAttribute('aria-pressed'),'true');
    await draw([[9,9],[15,9],[15,16],[9,16]]);
    assert.match(await page.locator('#points').textContent(),/1 inner holes/);
    await page.locator('#outerMode').click();
    assert.equal(await page.locator('#outerMode').getAttribute('aria-pressed'),'true');
    await page.locator('#category').selectOption('Tops');
    await page.locator('#subtype').selectOption('Blouse');
    await page.locator('#color').selectOption('Blue');
    await page.locator('#add').click();
    await draw([[33,31],[59,31],[59,58],[33,58]]);
    await page.locator('#category').selectOption('Bottoms');
    await page.locator('#subtype').selectOption('Jeans');
    await page.locator('#color').selectOption('Brown');
    await page.locator('#add').click();
    assert.equal(await page.locator('#regions li').count(),2);
    assert.equal(await page.locator('#export').isEnabled(),true);
    const screenshot=out+'/'+engine+'-'+screenWidth+'-synthetic-human-annotation-ui.png';
    await page.screenshot({path:screenshot,fullPage:true});
    const rendered=await readFile(screenshot);
    hashes.push({engine,width:screenWidth,sha256:sha(rendered),syntheticOnly:true});
    const wait=page.waitForEvent('download');
    await page.locator('#export').click();
    const download=await wait;
    const stream=await download.createReadStream();
    const chunks=[];for await(const chunk of stream)chunks.push(chunk);
    const result=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    assert.equal(result.sourceId,photoId);
    assert.equal(result.sourceSHA256,sourceSHA);
    assert.deepEqual(result.regions.map(r=>[r.category,r.subtype,r.primaryColor]),
     [['Tops','Blouse','Blue'],['Bottoms','Jeans','Brown']]);
    assert.equal(result.regions.length,2);
    assert.ok(result.regions.every(r=>r.polygons.length===1&&r.polygons[0].length===4));
    assert.equal(result.regions[0].holes.length,1);
    assert.equal(result.regions[0].holes[0].length,4);
    assert.deepEqual(result.regions[1].holes,[]);
    const truthful=authorManualSourceLabel774({photo:{width,height,sha256:sourceSHA},regions:[result.regions[0]]});
    const rle=truthful.instances[0].rle;
    const selectedAt=(x,y)=>{const pixel=y*width+x;let cursor=0,mask=0;
     for(const run of rle){if(pixel<cursor+run)return mask;cursor+=run;mask=1-mask;}throw Error('invalid RLE');};
    assert.equal(selectedAt(6,6),1,'retained human outer polygon fabric');
    assert.equal(selectedAt(12,12),0,'human hole pixels excluded from signed original-source RLE');
    assert.equal(result.explicitNoGarments,false);
    assert.deepEqual(external,[]);
    await page.locator('#original').setInputFiles({
     name:'tampered-source.jpg',mimeType:'image/jpeg',
     buffer:Buffer.concat([photo.subarray(0,20),Buffer.from([9]),photo.subarray(21)])
    });
    await page.locator('#verify').click();
    // SHA-256 uses asynchronous WebCrypto; wait for the actual computed
    // refusal rather than reading the preceding successful export status.
    await page.waitForFunction(()=>
     document.getElementById('status')?.textContent?.includes('differs from the immutable registered source SHA'));
    assert.equal(await page.locator('#export').isDisabled(),true);
    console.log('P809_HUMAN_OUTER_MINUS_HOLE_SYNTHETIC_BROWSER_RECEIPT_NO_EXTERNAL_REQUEST',engine,screenWidth,
     screenshot,sha(rendered));
   }finally{await context.close();}
  }
 }finally{await browser.close();}
}
await writeFile(out+'/synthetic-only-screenshot-receipts.json',
 JSON.stringify({testedBrowserEngines:names,widths:[320,390],sourceSHA256:sourceSHA,
  screenshotReceipts:hashes,actualIndependentHumanReviewers:0,
  realPhotoOwnerPermissionVerified:false,releaseAuthorized:false,familyAlpha:'HOLD'},null,2)+'\n');
