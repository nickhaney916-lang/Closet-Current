/** Chromium/WebKit on-device checklist exercise, loopback only; no real users or cloud. */
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {OUTPUT,MODULE} from './build-family-alpha-72-guided-phone-hold.mjs';
const original=await readFile(join(OUTPUT,'index.html'),'utf8');
const start=original.indexOf('<section id="alphaPhoneWalkthrough"');
const end=original.indexOf('</section>',start);
assert.ok(start>0&&end>start,'Checklist panel not compiled');
const panel=original.slice(start,end+10);
const server=createServer(async(req,res)=>{
 const name=new URL(req.url,'http://localhost').pathname;
 if(name==='/'){
  res.writeHead(200,{'content-type':'text/html; charset=utf-8'});
  res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1">'+
   '<div id="appShell"><section id="devicecheck">'+panel+'</section></div>'+
   '<script type="module" src="/'+MODULE+'"></script>');
 }else if(name==='/'+MODULE){
  res.writeHead(200,{'content-type':'text/javascript'});
  res.end(await readFile(join(OUTPUT,MODULE),'utf8'));
 }else{res.writeHead(404);res.end('Not available');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
try{
 for(const [engine,type] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await type.launch({headless:true});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:790},acceptDownloads:true});
    const page=await context.newPage(),foreign=[];
    page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('blob:'))foreign.push('foreign');});
    await page.goto(origin+'/');
    const button=page.getByRole('button',{name:'Download my phone checklist',exact:true});
    await button.waitFor();
    assert.equal(await page.locator('select[id^="alphaWalkthrough-P"]').count(),9);
    await page.locator('#alphaWalkthrough-P01').selectOption('worked');
    await page.locator('#alphaWalkthrough-P02').selectOption('needs-help');
    await page.locator('#alphaWalkthrough-P09').selectOption('blocked');
    assert.match(await page.locator('#alphaWalkthroughSummary').innerText(),/3 of 9 steps reviewed; 2 need attention/);
    await page.evaluate(()=>document.getElementById('alphaWalkthroughDownload').click());
    assert.match(await page.locator('#alphaWalkthroughSummary').innerText(),/Open Device help/);
    const downloadPromise=page.waitForEvent('download',{timeout:10000});
    await button.click();const downloaded=await downloadPromise;
    assert.equal(downloaded.suggestedFilename(),'closet-current-phone-checklist.json');
    const raw=await readFile(await downloaded.path(),'utf8'),parsed=JSON.parse(raw);
    assert.deepEqual(Object.keys(parsed),['format','checks','counts','source','transmitted','releaseAuthorization','familyAlpha']);
    assert.deepEqual(parsed.counts,{notTried:6,worked:1,needsHelp:1,blocked:1});
    assert.equal(parsed.releaseAuthorization,false);assert.equal(parsed.familyAlpha,'HOLD');
    assert.ok(!/@|https?:|data:image|accountId|token/i.test(raw));
    assert.match(await page.locator('#alphaWalkthroughSummary').innerText(),/No information was sent/);
    await page.getByRole('button',{name:'Start again'}).click();
    assert.equal(await page.locator('#alphaWalkthrough-P01').inputValue(),'not-tried');
    await page.locator('#alphaWalkthrough-P04').selectOption('worked');
    await page.evaluate(()=>window.dispatchEvent(new Event('closet:alpha-session-changed')));
    assert.equal(await page.locator('#alphaWalkthrough-P04').inputValue(),'not-tried');
    await page.evaluate(()=>document.getElementById('devicecheck').hidden=true);
    await page.evaluate(()=>document.getElementById('alphaWalkthroughDownload').click());
    assert.match(await page.locator('#alphaWalkthroughSummary').innerText(),/Open Device help/);
    assert.deepEqual(foreign,[]);
    await page.evaluate(()=>document.getElementById('devicecheck').hidden=false);
    await mkdir('benchmark/family-alpha-72-phone',{recursive:true});
    await page.screenshot({path:'benchmark/family-alpha-72-phone/'+engine.toLowerCase()+'-'+width+'.png'});
    await context.close();
    console.log('FAMILY_ALPHA_72_BROWSER',JSON.stringify({engine,width,download:'PASS',session:'PASS',noExternalCalls:true,release:'HOLD'}));
   }
  }finally{await browser.close();}
 }
}finally{server.close();}
