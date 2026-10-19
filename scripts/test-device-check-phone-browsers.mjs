// UI automation exercises a LOCAL fake account on desktop Chromium/WebKit
// phone-sized emulators. Button clicks are SCRIPTED, not human/physical proof.
import {chromium,webkit,devices} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),types={'.html':'text/html','.js':'text/javascript',
 '.mjs':'text/javascript','.css':'text/css','.json':'application/json',
 '.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const file=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(root+'/'))throw Error('Bad path');
  const body=await readFile(file);
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(body);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base='http://127.0.0.1:'+server.address().port+'/';
const summaries=[];
try{
 for(const [name,engine,platform] of [
  ['Chromium Android emulation',chromium,'Android'],
  ['WebKit iPhone emulation',webkit,'iPhone/iPad']
 ]){
  const browser=await engine.launch({headless:true,
   ...(engine===chromium?{args:['--no-sandbox']}: {})});
  try{
   const context=await browser.newContext({
    ...(engine===webkit?devices['iPhone 13']:
      {viewport:{width:390,height:844},isMobile:true,hasTouch:true,
       userAgent:'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Mobile Safari/537.36'}),
    acceptDownloads:true,serviceWorkers:'block'
   });
   const externalWrites=[];
   await context.route('**/auth.js*',route=>route.fulfill({
    contentType:'text/javascript',
    body:"window.closetAuth={user:{id:'synthetic-device-check-'+Math.random()},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"
   }));
   await context.route('**/*',route=>{
    const u=route.request().url(),method=route.request().method();
    if(!u.startsWith('http://127.0.0.1:')&&!u.startsWith('blob:')&&!u.startsWith('data:')&&
       method!=='GET'&&method!=='HEAD'){
      externalWrites.push(method);return route.abort('blockedbyclient');
    }
    return route.fallback();
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(base);
   await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
   await page.evaluate(()=>switchView('devicecheck'));
   await page.locator('#startDeviceCheck:not([disabled])').waitFor();
   const steps=page.locator('#deviceCheckSteps .device-step');
   assert.equal(await steps.count(),17);
   assert.match(await page.locator('#deviceCheckSummary').innerText(),/17 still untested/);
   await page.locator('#startDeviceCheck').click();
   await steps.nth(0).getByRole('button',{name:'Works'}).click();
   await steps.nth(1).getByRole('button',{name:'Needs help'}).click();
   let downloadPromise=page.waitForEvent('download');
   await page.locator('#downloadDeviceCheck').click();
   let download=await downloadPromise;
   let raw=await readFile(await download.path(),'utf8'),report=JSON.parse(raw);
   assert.equal(report.version,2);
   assert.equal(report.platform,platform);
   assert.equal(report.summary.checked,2);
   assert.equal(report.summary.missing.length,15);
   assert.deepEqual(report.summary.needsHelp,['capture']);
   assert.equal(report.summary.locallyComplete,false);
   assert.equal(report.hardwareVerified,false);
   assert.equal(report.sendAutomatically,false);
   for(const forbidden of ['synthetic-device-check','data:image','access_token','refresh_token',
      'private-clothing.jpg','email@example.test'])
    assert.ok(!raw.includes(forbidden),'Private content leaked into report');
   // Simulate 17 touches, but never claim humans truly used cameras.
   for(let n=0;n<17;n++)await steps.nth(n).getByRole('button',{name:'Works'}).click();
   await page.locator('#deviceCheckSummary').getByText(/17 of 17/).waitFor();
   await page.waitForFunction(()=>document.querySelector('#deviceCheckSummary').textContent.includes('0 still untested')===false);
   downloadPromise=page.waitForEvent('download');
   await page.locator('#downloadDeviceCheck').click();
   download=await downloadPromise;
   raw=await readFile(await download.path(),'utf8');report=JSON.parse(raw);
   assert.equal(report.summary.checked,17);
   assert.equal(report.summary.locallyComplete,true);
   assert.equal(report.hardwareVerified,false);
   await page.reload();
   await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
   await page.evaluate(()=>switchView('devicecheck'));
   await page.waitForFunction(()=>document.querySelector('#deviceCheckSummary')?.textContent.includes('17 of 17'));
   assert.deepEqual(errors,[]);
   assert.deepEqual(externalWrites,[]);
   summaries.push({engine:name,scriptsClicked:17,exportedSteps:report.summary.checked,
    exportedPrivatePhotoData:false,realDeviceHumanTested:false,
    hardwareVerifiedBySoftware:false,liveAITested:false});
   await context.close();
  }finally{await browser.close();}
 }
 console.log('PILOT_DEVICE_CHECK_EMULATED_UI '+JSON.stringify(summaries));
}finally{await new Promise(done=>server.close(done));}
