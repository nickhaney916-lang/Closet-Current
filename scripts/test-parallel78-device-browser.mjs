/**
 * Parallel #78: desktop Chromium/WebKit mobile-viewport simulation ONLY.
 * Runs the actual research diagnostics script referenced by actual index.html.
 * All screenshots are generated from empty diagnostics and retained in RAM.
 * No physical phones, photos, signed accounts, or model inference are tested.
 */
import {chromium,webkit} from 'playwright';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const html=await readFile('public/index.html','utf8');
const code=await readFile('public/device-acceptance-78.js','utf8');
assert.match(html,/<script src="device-acceptance-78.js"><\/script>/);
const isolated=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,
 source=>source.includes('device-acceptance-78.js')?source:'')
 .replace(/<link\b[^>]*>/gi,'');
const sha=b=>createHash('sha256').update(b).digest('hex');
async function readDownload(download){
 const chunks=[];
 const stream=await download.createReadStream();
 for await(const chunk of stream)chunks.push(chunk);
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
let executed=0;
for(const [browserName,browserType] of Object.entries({chromium,webkit})){
 const browser=await browserType.launch({headless:true,...(browserName==='chromium'?{args:['--no-sandbox']}:{})});
 try{
  for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:850},isMobile:true,hasTouch:true,acceptDownloads:true});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('http://127.0.0.1:28778/**',route=>{
    const pathname=new URL(route.request().url()).pathname;
    if(pathname==='/device-acceptance-78.js')
     return route.fulfill({status:200,contentType:'text/javascript',body:code});
    if(pathname==='/'||pathname==='/index.html')
     return route.fulfill({status:200,contentType:'text/html',body:isolated});
    return route.fulfill({status:404,body:'not found'});
   });
   await page.goto('http://127.0.0.1:28778/');
   assert.equal(await page.locator('#deviceLab78Launcher').count(),0,'default OFF');
   assert.equal(await page.locator('#deviceLab78Panel').count(),0);
   await page.goto('http://127.0.0.1:28778/?deviceLab78=1');
   const launch=page.getByRole('button',{name:/Enable local device QA/});
   await launch.waitFor({state:'visible'});
   assert.equal(await page.locator('#deviceLab78Panel').count(),0,'explicit second click needed');
   await launch.click();
   const panel=page.locator('#deviceLab78Panel');
   await panel.waitFor({state:'visible'});
   assert.match(await panel.innerText(),/acceptance BLOCKED/i);
   const bounds=await panel.evaluate(el=>({width:el.getBoundingClientRect().width,
    left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,
    contentScroll:el.scrollWidth,available:el.clientWidth}));
   assert.ok(bounds.left>=0&&bounds.right<=width+1,'panel fits CSS mobile width');
   assert.ok(bounds.contentScroll<=bounds.available+2,'panel has no horizontal overflow');
   // P852: a physical tester must explicitly identify exact running build,
   // not inherit a stale P850 default by accident.
   await page.getByRole('button',{name:'Start memory-only session'}).click();
   assert.match(await page.locator('#p78message').innerText(),/P78_COMMIT_REQUIRED/);
   await page.locator('#p78commit').fill('9b582710e1b406e0d8ee256940627b5297646500');
   await page.getByRole('button',{name:'Start memory-only session'}).click();
   await page.locator('#p78case').selectOption('owner_review_843');
   await page.locator('#p78status').selectOption('PASS');
   await page.getByRole('button',{name:'Record manual observation'}).click();
   assert.match(await page.locator('#p78message').innerText(),/UNVERIFIED_DEVICE_EVIDENCE/);
   await page.locator('#p78status').selectOption('BLOCKED');
   await page.getByRole('button',{name:'Record manual observation'}).click();
   assert.match(await page.locator('#p78message').innerText(),/Release remains BLOCKED/);
   await page.getByRole('button',{name:'Start timing'}).click();
   await page.getByRole('button',{name:'End timing'}).click();
   const [download]=await Promise.all([
    page.waitForEvent('download'),page.getByRole('button',{name:'Export shareable BLOCKED summary'}).click()
   ]);
   const share=await readDownload(download);
   assert.equal(share.releaseStatus,'BLOCKED');
   assert.equal(share.familyAlpha,'HOLD');
   assert.equal(share.independentlyVerifiedPhysicalRuns,0);
   assert.equal(share.counts.BLOCKED,1);
   assert.equal(share.counts.PASS,0);
   assert.equal(share.counts.NOT_RUN,22);
   assert.equal(JSON.stringify(share).includes('image/jpeg'),false);
   const screenshot=await page.screenshot({type:'png'});
   assert.ok(screenshot.length>1500);
   assert.match(sha(screenshot),/^[a-f0-9]{64}$/);
   await page.getByRole('button',{name:'Close and discard'}).click();
   assert.equal(await page.locator('#deviceLab78Panel').count(),0);
   assert.deepEqual(errors,[]);
   console.log('P78_DESKTOP_ONLY_SIMULATION',JSON.stringify({
    browserEngine:browserName,cssWidth:width,realPhysicalPhone:false,
    authorizedTester:false,actualCamera:false,actualRecognition:false,
    sourceExecuted:true,defaultOff:true,manualOptIn:true,privateBytesExported:false,
    noHorizontalOverflow:true,noAutoPass:true,release:'BLOCKED',
    inMemoryScreenshotSha256:sha(screenshot),pageErrors:errors.length
   }));
   executed++;
   await context.close();
  }
 }finally{await browser.close();}
}
assert.equal(executed,6);
console.log('P78_SIMULATED_BROWSER_CASES_6_OF_6_PASS_PHYSICAL_DEVICE_CASES_0_RELEASE_BLOCKED');
