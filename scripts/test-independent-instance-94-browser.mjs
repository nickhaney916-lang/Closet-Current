#!/usr/bin/env node
/**
 * Actual blinded original-JPEG Chromium/WebKit mobile polygon UI proof.
 * Automated pointer clicks are QA fixtures, NOT human annotations or science.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import {validateInstanceReview94}
 from '../research/independent-instance-ground-truth-94/instance-evidence.mjs';
const root=resolve('.'),out=resolve('benchmark/independent-instance-ground-truth-94/browser-evidence');
await mkdir(out,{recursive:true});
const packetA=JSON.parse(await readFile('benchmark/independent-instance-ground-truth-94/packet-A.json','utf8'));
const packetB=JSON.parse(await readFile('benchmark/independent-instance-ground-truth-94/packet-B.json','utf8'));
assert.equal(packetA.total,59);assert.equal(packetB.total,59);
const packetFileA=resolve('benchmark/independent-instance-ground-truth-94/packet-A.json');
const packetFileB=resolve('benchmark/independent-instance-ground-truth-94/packet-B.json');
const sha=b=>createHash('sha256').update(b).digest('hex');
const result={schema:'independent-instance-ground-truth-94/browser-qa-v1',
 humanAnnotationsPerformed:0,actualIndependentHumanReviewers:0,
 modelInstanceAccuracyMeasured:false,qaSimulatedPointerClicksOnly:true,
 sourceJPEGChecks:0,caseCount:0,caseReports:[],screenshots:[],
 javascriptErrors:[],unexpectedNetwork:[],releaseAuthorized:false,
 familyAlpha:'HOLD'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path!=='/research/independent-instance-ground-truth-94/annotate.html'&&
     !/^\/benchmark\/fixtures\/[A-Za-z0-9._-]+\.jpg$/i.test(path))
   throw Error('forbidden local source');
  const buf=await readFile(resolve(root,'.'+path));
  res.writeHead(200,{'content-type':extname(path)==='.html'?'text/html':'image/jpeg',
   'cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(buf);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
async function take(page,engine,width,name){
 const png=await page.screenshot({fullPage:true,animations:'disabled'});
 const meta=await sharp(png).metadata(),stats=await sharp(png).stats();
 assert.equal(meta.width,width);assert.ok(meta.height>800);
 assert.ok(png.length>7000&&stats.channels.some(c=>c.stdev>7));
 const filename=engine+'-'+width+'-'+name+'.png';
 await writeFile(out+'/'+filename,png);
 result.screenshots.push({filename,width,height:meta.height,sha256:sha(png),bytes:png.length});
}
async function polygon(page,points){
 const canvas=page.locator('#photoCanvas');
 // Selecting labels scrolls the mobile viewport below the source canvas.
 // Move the real original JPEG surface back onscreen before pointer clicks.
 await canvas.scrollIntoViewIfNeeded();
 const box=await canvas.boundingBox();
 assert.ok(box?.width>0&&box?.height>0);
 for(const [x,y] of points)await page.mouse.click(
  box.x+box.width*x,box.y+box.height*y);
}
async function imageReady(page){
 await page.waitForFunction(()=>
  document.getElementById('sourceStatus')?.textContent.includes('Verified actual original JPEG bytes')&&
  document.getElementById('photoCanvas')?.width>0,{timeout:30000});
}
try{
 for(const [engine,launcher] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await launcher.launch({headless:true});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:860},
     acceptDownloads:true,deviceScaleFactor:1});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',req=>{
     // Decoded, source-hashed JPEG is displayed only from a same-origin
     // browser-local blob URL. This is not a network upload or external host.
     if(!req.url().startsWith(base+'/')&&
        !req.url().startsWith('blob:'+base+'/'))
      result.unexpectedNetwork.push(req.url());
    });
    await page.goto(base+'/research/independent-instance-ground-truth-94/annotate.html',
     {waitUntil:'load'});
    assert.equal(await page.locator('#review').isVisible(),false);
    await page.locator('#packetFile').setInputFiles(packetFileA);
    await page.locator('#review').waitFor({state:'visible'});
    await imageReady(page);result.sourceJPEGChecks++;
    const first=packetA.items[0];
    assert.match(await page.locator('#identity').innerText(),new RegExp(first.sourceSHA256.slice(0,20)));
    assert.equal((await page.locator('#category').inputValue()),'');
    assert.ok(!(await page.locator('body').innerText()).includes('model prediction:'));
    await page.locator('#reviewerId').fill('qa-simulated-polygon-94-A');
    await page.locator('#independent').check();
    await page.locator('#record').click();
    assert.match(await page.locator('#status').innerText(),/At least one completed garment mask/);
    await take(page,engine,width,'01-verified-blank-real-jpeg');
    await page.locator('#category').selectOption('Tops');
    await page.locator('#itemType').selectOption('T-shirt');
    await page.locator('#primaryColor').selectOption('Blue');
    await page.locator('#secondaryColor').selectOption('White');
    await polygon(page,[[.1,.1],[.43,.1],[.43,.43],[.1,.43]]);
    assert.match(await page.locator('#vertexStatus').innerText(),/4 current vertices/);
    await page.locator('#closeMask').click();
    assert.match(await page.locator('#savedMasks').innerText(),/1 individual garment/);
    await page.locator('#category').selectOption('Bottoms');
    await page.locator('#itemType').selectOption('Jeans');
    await page.locator('#primaryColor').selectOption('Brown');
    await page.locator('#secondaryColor').selectOption('Beige');
    await polygon(page,[[.57,.2],[.88,.2],[.88,.68],[.57,.68]]);
    await page.locator('#closeMask').click();
    assert.match(await page.locator('#savedMasks').innerText(),/2 individual garment/);
    await page.locator('#note').fill('QA interaction only: two synthetically traced polygons, not genuine human truth.');
    await page.locator('#record').click();
    assert.match(await page.locator('#progress').innerText(),/^1 \/ 59/);
    await take(page,engine,width,'02-two-qa-polygon-masks');
    const downloadPromise=page.waitForEvent('download');
    await page.locator('#export').click();
    const download=await downloadPromise;
    const exported=JSON.parse(await readFile(await download.path(),'utf8'));
    const validated=validateInstanceReview94(packetA,exported);
    assert.equal(validated.rows.length,1);assert.equal(validated.complete,false);
    assert.equal(validated.rows[0].instances.length,2);
    assert.equal(exported.identityVerification,'SELF_ATTESTED_NOT_VERIFIED');
    assert.equal(JSON.stringify(exported).includes('data:image'),false);
    assert.equal(JSON.stringify(exported).includes(first.image),false);
    assert.equal(exported.rows[0].sourceSHA256,first.sourceSHA256);
    if(width===390){
     // Another signed source image can be presented but a substituted
     // downloaded original JPEG may NEVER authorize manual annotations.
     const firstUrl='**/benchmark/fixtures/'+first.image;
     await page.route(firstUrl,route=>route.fulfill({status:200,
      contentType:'image/jpeg',body:Buffer.from('NOT the licensed JPEG')}));
     await page.locator('#next').click();
     await imageReady(page);
     await page.locator('#previous').click();
     await page.waitForFunction(()=>document.querySelector('#sourceStatus')
      ?.textContent.includes('SOURCE INTEGRITY FAILURE'));
     await page.locator('#record').click();
     assert.match(await page.locator('#status').innerText(),/Verified original JPEG required/);
     await take(page,engine,width,'03-corrupt-original-rejected');
     await page.unroute(firstUrl);
     await page.locator('#next').click();await imageReady(page);
     await page.locator('#previous').click();await imageReady(page);
    }
    await page.locator('#packetFile').setInputFiles(packetFileB);
    // Packet imports are async, and #review was already visible for role A.
    // Never accept old A progress or previously verified A image as B proof.
    await page.waitForFunction(()=>document.querySelector('#counter')?.textContent.includes('role B')&&
     document.querySelector('#progress')?.textContent.startsWith('0 / 59'),null,{timeout:30000});
    await imageReady(page);result.sourceJPEGChecks++;
    assert.match(await page.locator('#counter').innerText(),/role B/);
    assert.match(await page.locator('#progress').innerText(),/^0 \/ 59/);
    assert.equal(await page.locator('#reviewerId').inputValue(),'');
    assert.equal(await page.locator('#independent').isChecked(),false);
    await take(page,engine,width,'04-independent-role-B-no-peer-labels');
    assert.deepEqual(errors,[]);
    result.caseReports.push({engine,width,verifiedRealJPEGBeforeReview:true,
     twoQAOnlyPolygons:true,sourceBoundNoImageExport:true,roleIsolation:true,
     corruptedJPEGBlocked:width===390?'verified':'not-run-in-this-viewport',
     independentHumanLabelsRecorded:0,modelMaskAccuracyMeasured:false,
     physicalPhone:false});
    await page.close();await context.close();result.caseCount++;
   }
  }finally{await browser.close();}
 }
 assert.equal(result.caseCount,6);
 assert.equal(result.sourceJPEGChecks,12);
 assert.equal(result.screenshots.length,20);
 assert.deepEqual(result.javascriptErrors,[]);
 assert.deepEqual(result.unexpectedNetwork,[]);
 await writeFile(out+'/results.json',JSON.stringify(result,null,2)+'\n');
 console.log('INSTANCE94 browser QA: 6/6 actual Chromium/WebKit mobile original-JPEG source-bound annotation workflows, 20/20 saved screenshots, zero actual human reviews, ZERO model instance accuracy claims. HOLD.');
}finally{server.close();}
