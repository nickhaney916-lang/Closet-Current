/**
 * Family Alpha #71 — trusted-click private report, real Chromium and WebKit.
 * Serves ONLY the isolated compiled feedback module + exact compiled index
 * markup on loopback. No network destinations, auth tokens or family photos.
 */
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {OUTPUT,MODULE} from './build-family-alpha-71-private-feedback-hold.mjs';
const html=await readFile(join(OUTPUT,'index.html'),'utf8');
const from=html.indexOf('<section id="alphaPrivateFeedback"');
const to=html.indexOf('</section>',from);
assert.ok(from>0&&to>from,'Production-like Device help panel absent');
const panel=html.slice(from,to+'</section>'.length);
const server=createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 if(path==='/'){
  res.writeHead(200,{'content-type':'text/html; charset=utf-8'});
  res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><body>'+
   '<div id="appShell"><section id="devicecheck">'+panel+'</section></div>'+
   '<script type="module" src="/'+MODULE+'"></script></body></html>');
 }else if(path==='/'+MODULE){
  res.writeHead(200,{'content-type':'text/javascript'});
  res.end(await readFile(join(OUTPUT,MODULE),'utf8'));
 }else{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
try{
 for(const [engine,browserType] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await browserType.launch({headless:true});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:790},acceptDownloads:true});
    const page=await context.newPage(),external=[];
    page.on('request',req=>{if(!req.url().startsWith(origin)&&!req.url().startsWith('blob:'))external.push('external')});
    await page.goto(origin+'/');
    const button=page.getByRole('button',{name:'Download private test note',exact:true});
    await button.waitFor();
    await page.locator('#alphaFeedback-area').selectOption('avatar-fit');
    await page.locator('#alphaFeedback-symptom').selectOption('looked-wrong');
    await page.locator('#alphaFeedback-device').selectOption(engine==='WebKit'?'iphone-safari':'android-browser');
    await page.locator('#alphaFeedback-severity').selectOption('blocks-testing');
    // Synthetic click must not produce a file or a success announcement.
    await page.evaluate(()=>document.getElementById('alphaFeedbackDownload').click());
    assert.match(await page.locator('#alphaFeedbackStatus').innerText(),/Open Device help/);
    const dl=page.waitForEvent('download',{timeout:10000});
    await button.click();const download=await dl;
    assert.equal(download.suggestedFilename(),'closet-current-alpha-feedback.json');
    const fs=await import('node:fs/promises');
    const bytes=await fs.readFile(await download.path(),'utf8');
    const safe=JSON.parse(bytes);
    assert.deepEqual(Object.keys(safe),['format','area','symptom','device','severity','sentAutomatically','photoAttached','requiresHumanReview','familyAlphaRelease']);
    assert.equal(safe.sentAutomatically,false);
    assert.equal(safe.photoAttached,false);
    assert.equal(safe.familyAlphaRelease,'HOLD');
    assert.equal(safe.area,'avatar-fit');
    assert.equal(safe.severity,'blocks-testing');
    assert.ok(bytes.length<480);
    assert.ok(!/@|http:|https:|jwt|token|accountId|familyName|data:image/i.test(bytes));
    assert.match(await page.locator('#alphaFeedbackStatus').innerText(),/Nothing was sent/);
    // Session change must discard stale selections and never reuse prior context.
    await page.evaluate(()=>window.dispatchEvent(new Event('closet:alpha-session-changed')));
    assert.equal(await page.locator('#alphaFeedback-area').inputValue(),'camera');
    assert.equal(await page.locator('#alphaFeedbackStatus').innerText(),'');
    await page.evaluate(()=>document.getElementById('appShell').hidden=true);
    await page.evaluate(()=>document.getElementById('alphaFeedbackDownload').click());
    assert.match(await page.locator('#alphaFeedbackStatus').innerText(),/Open Device help/);
    assert.deepEqual(external,[],'Unexpected non-loopback network request');
    await mkdir('benchmark/family-alpha-71-feedback',{recursive:true});
    await page.evaluate(()=>document.getElementById('appShell').hidden=false);
    await page.screenshot({path:'benchmark/family-alpha-71-feedback/'+engine.toLowerCase()+'-'+width+'.png'});
    await context.close();
    console.log('FAMILY_ALPHA_71_BROWSER',JSON.stringify({engine,width,privateReport:'PASS',sessionReset:'PASS',network:'NONE',decision:'HOLD'}));
   }
  }finally{await browser.close();}
 }
}finally{server.close();}
