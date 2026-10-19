// Real SHA-locked original files from public licensed source metadata, but
// NO human reviewer attestations and NO AI inference. Original pixels remain
// unchanged in this proof-of-loading test.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
const packet=JSON.parse(await readFile(
 'benchmark/blind-original-review-packets/blind-first-reviewer.json','utf8'));
const html=await readFile('benchmark/blind-original-photo-review.html');
const sourceList=await Promise.all(packet.originals.map(async o=>({
 name:o.image,mimeType:'image/jpeg',buffer:await readFile(join('benchmark/blind-original-source-photos',o.image))
})));
if(packet.photoCount!==16||sourceList.length!==16)throw Error('Missing fixed original-photo cohort');
const server=createServer((req,res)=>{
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
 res.end(html);
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const url='http://127.0.0.1:'+server.address().port+'/';
const scores=[];
try{
 for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox']}: {})});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   await context.route('**/*',route=>{
    const target=route.request().url();
    // WebKit may route local blob: images through Playwright. They are local
    // already-hash-verified bytes, not a remote network request.
    return target.startsWith(url)||target.startsWith('blob:')||target.startsWith('data:')?
      route.continue():route.abort('internetdisconnected');
   });
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
   page.on('requestfailed',req=>console.log('ORIGINAL_IMAGE_REQUEST_FAILED '+JSON.stringify({
    browser:name,url:req.url().slice(0,100),error:req.failure()?.errorText
   })));
   await page.goto(url);
   await page.locator('#packet').setInputFiles({
    name:'blind-first-reviewer.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(packet))
   });
   await page.locator('#jpegFiles').setInputFiles(sourceList);
   await page.waitForFunction(()=>document.getElementById('status').textContent.includes('16 of 16 original JPEG hashes verified'),null,{timeout:60000});
   assert.equal(await page.locator('#source option').count(),16);
   assert.equal(await page.locator('#export').isDisabled(),true);
   // Every source can be selected and displayed without showing its model label.
   for(const original of packet.originals){
    await page.locator('#source').selectOption(original.sourceId);
    console.log('REAL_ORIGINAL_PREVIEW_START '+JSON.stringify({engine:name,sourceId:original.sourceId}));
    try{
     await page.waitForFunction(()=>document.getElementById('photo').complete&&
       document.getElementById('photo').naturalWidth>0,null,{timeout:15000});
    }catch(error){
     const diagnostic=await page.evaluate(()=>({
      status:document.getElementById('status').textContent,
      selected:document.getElementById('source').value,
      photoSrc:document.getElementById('photo').src.slice(0,80),
      completed:document.getElementById('photo').complete,
      naturalWidth:document.getElementById('photo').naturalWidth
     }));
     throw new Error('Verified original preview failed '+name+'/'+original.sourceId+' '+JSON.stringify(diagnostic)+' '+error.message);
    }
    const state=await page.evaluate(()=>({
     id:document.getElementById('source').value,
     text:document.body.innerText,
     originalSrc:document.getElementById('photo').src
    }));
    assert.ok(!state.text.includes('modelResult')&&!state.text.includes('manifestLabel'));
    assert.ok(state.originalSrc.startsWith('blob:'),'image only opens local verified JPEG');
    console.log('REAL_ORIGINAL_PREVIEW_OK '+JSON.stringify({engine:name,sourceId:original.sourceId}));
   }
   assert.deepEqual(errors,[]);
   scores.push({browser:name,realShaVerifiedOriginals:packet.photoCount,
    userReviewSubmissions:0,customerGarmentsSaved:0,paidInferenceCalls:0,
    physicalPhoneHardwareTested:false});
   await context.close();
  }finally{await browser.close();}
 }
 console.log('REAL_ORIGINAL_REVIEW_LOAD '+JSON.stringify(scores));
}finally{server.close();}
