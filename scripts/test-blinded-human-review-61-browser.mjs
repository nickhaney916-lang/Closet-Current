#!/usr/bin/env node
/**
 * BLIND61 six actual Chromium/WebKit mobile-width browser acceptance cases.
 * A QA automation script intentionally SIMULATES user clicks; no independent
 * human review has occurred and no scientifically valid label is generated.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const root=resolve('.'),dir=resolve('benchmark/independent-annotation-61/browser-evidence');
await mkdir(dir,{recursive:true});
const a=JSON.parse(await readFile('benchmark/independent-annotation-61/packet-A.json','utf8'));
const b=JSON.parse(await readFile('benchmark/independent-annotation-61/packet-B.json','utf8'));
const inputA=resolve('benchmark/independent-annotation-61/packet-A.json');
const inputB=resolve('benchmark/independent-annotation-61/packet-B.json');
assert.equal(a.total,59);assert.equal(b.total,59);
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(pathname!=='/research/independent-annotation-61/review.html'&&
     !/^\/benchmark\/fixtures\/[A-Za-z0-9._-]+\.jpg$/i.test(pathname))
   throw Error('forbidden local path');
  const bytes=await readFile(resolve(root,'.'+pathname));
  res.writeHead(200,{'content-type':extname(pathname)==='.html'?'text/html':'image/jpeg',
   'cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const result={schema:'independent-annotation-61/browser-qa-v1',
 scientificHumanAnnotations:0,humanReviewPerformed:false,
 modelAccuracyEvidence:false,qaClickedControlsOnly:true,
 cases:[],screenshots:[],errors:[],unexpectedNetwork:[]};
async function screenshot(page,engine,width,name){
 const file=engine+'-'+width+'-'+name+'.png';
 const buf=await page.screenshot({fullPage:true,animations:'disabled'});
 const meta=await sharp(buf).metadata();
 assert.equal(meta.width,width);assert.ok(meta.height>650);assert.ok(buf.byteLength>7000);
 await writeFile(dir+'/'+file,buf);
 result.screenshots.push({file,width,height:meta.height,sha256:sha(buf),bytes:buf.byteLength});
}
try{
 for(const [engine,browserType] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await browserType.launch({headless:true});
  try{
   for(const width of [320,390,430]){
    const ctx=await browser.newContext({viewport:{width,height:860},acceptDownloads:true,
     deviceScaleFactor:1});
    try{
     const page=await ctx.newPage(),errors=[];
     page.on('pageerror',e=>errors.push(e.message));
     page.on('request',req=>{if(!req.url().startsWith(base+'/'))
      result.unexpectedNetwork.push(req.url());});
     await page.goto(base+'/research/independent-annotation-61/review.html',{waitUntil:'load'});
     assert.equal(await page.locator('#review').isVisible(),false);
     await page.locator('#packetFile').setInputFiles(inputA);
     await page.locator('#review').waitFor({state:'visible'});
     assert.match(await page.locator('#counter').innerText(),/Photograph 1 \/ 59 · Reviewer A/);
     await page.waitForFunction(()=>document.querySelector('#photo')?.naturalWidth>0);
     assert.ok((await page.locator('#photo').evaluate(img=>img.naturalWidth))>50);
     const current=a.items[0];
     assert.ok((await page.locator('#photo').getAttribute('src')).endsWith(current.image));
     assert.equal(await page.locator('#category').inputValue(),'');
     assert.equal(await page.locator('#itemType').inputValue(),'');
     assert.equal(await page.locator('#primaryColor').inputValue(),'');
     assert.equal((await page.locator('body').innerText()).includes('model prediction:'),false);
     await page.locator('#reviewerId').fill('qa-synthetic-A');
     await page.locator('#independence').check();
     await page.getByRole('button',{name:'Record my independent review'}).click();
     assert.match(await page.locator('#message').innerText(),/Please choose a supported category/);
     assert.match(await page.locator('#progress').innerText(),/^0 \/ 59/);
     await screenshot(page,engine,width,'01-original-blank-visual-review');
     await page.locator('#category').selectOption('Tops');
     await page.locator('#itemType').selectOption('T-shirt');
     await page.locator('#primaryColor').selectOption('Blue');
     await page.locator('#secondaryColor').selectOption('White');
     await page.locator('#notes').fill('QA simulated UI exercise; not an actual independent color judgment.');
     await page.getByRole('button',{name:'Record my independent review'}).click();
     assert.match(await page.locator('#progress').innerText(),/^1 \/ 59/);
     await screenshot(page,engine,width,'02-synthetic-click-only-annotated');
     const downloadPromise=page.waitForEvent('download');
     await page.getByRole('button',{name:'Export my reviews as JSON'}).click();
     const download=await downloadPromise,filename=await download.path();
     const saved=JSON.parse(await readFile(filename,'utf8'));
     assert.equal(saved.schema,'closet-current-human-review-61/v1');
     assert.equal(saved.identityVerification,'SELF_ATTESTED_NOT_INDEPENDENTLY_VERIFIED');
     assert.equal(saved.incomplete,true);assert.equal(saved.completed,1);
     assert.equal(saved.rows.length,1);assert.equal(saved.rows[0].id,current.id);
     assert.equal(saved.rows[0].sourceSHA256,current.sourceSHA256);
     assert.equal(saved.rows[0].primaryColor,'Blue');
     assert.equal(JSON.stringify(saved).includes('data:image'),false);
     assert.equal(JSON.stringify(saved).includes('expectedCategory'),false);
     await page.getByRole('button',{name:'Next photograph'}).click();
     assert.equal(await page.locator('#category').inputValue(),'');
     assert.equal(await page.locator('#primaryColor').inputValue(),'');
     await page.locator('#uncertain').check();
     await page.locator('#notes').fill('Visually ambiguous garment type; insufficient certainty.');
     await page.waitForFunction(()=>document.querySelector('#photo')?.naturalWidth>0);
     await page.getByRole('button',{name:'Record my independent review'}).click();
     assert.match(await page.locator('#progress').innerText(),/^2 \/ 59/);
     await page.locator('#packetFile').setInputFiles(inputB);
     await page.waitForFunction(()=>document.querySelector('#photo')?.naturalWidth>0);
     assert.match(await page.locator('#counter').innerText(),/Reviewer B/);
     assert.equal(await page.locator('#category').inputValue(),'');
     assert.equal(await page.locator('#primaryColor').inputValue(),'');
     assert.match(await page.locator('#progress').innerText(),/^0 \/ 59/);
     assert.ok((await page.locator('#photo').getAttribute('src')).endsWith(b.items[0].image));
     assert.notEqual(b.items[0].id,a.items[0].id,'Separate shuffled blinded reviewer ordering');
     await screenshot(page,engine,width,'03-other-reviewer-isolated-no-peer-label');
     assert.deepEqual(errors,[]);
     result.cases.push({engine,width,sourceImagesPreviewed:3,
      oneSimulatedRowExportedAndSourceSHAMatched:true,
      secondSyntheticUncertainMarkNotAdjudicated:true,
      packetBNoPeerAnswers:true,noOriginalPhotosUploaded:true});
    }finally{await ctx.close();}
   }
  }finally{await browser.close();}
 }
 assert.equal(result.cases.length,6);
 assert.equal(result.screenshots.length,18);
 assert.deepEqual(result.unexpectedNetwork,[]);
 assert.deepEqual(result.errors,[]);
 console.log('BLIND61 ACTUAL OFFLINE SOURCE-JPEG HUMAN-REVIEW UI BROWSER EVIDENCE: '+
  JSON.stringify({cases:result.cases.length,screenshots:result.screenshots.length,
   humanReviewsPerformed:0,modelAccuracyMeasured:false,unexpectedNetwork:result.unexpectedNetwork.length}));
}catch(error){
 result.failure=String(error.stack||error);
 console.error('BLIND61 BROWSER EVIDENCE FAILED',result.failure);
 process.exitCode=1;
}finally{
 await writeFile(dir+'/acceptance.json',JSON.stringify(result,null,2)+'\n');
 await new Promise(done=>server.close(done));
}
