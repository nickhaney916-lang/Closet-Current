import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';

// Exercise the actual built PWA controller in a real browser DOM. The OS
// installation event is deliberately synthetic; no platform install is claimed.
const source=await readFile('dist/pwa.js');
const html='<!doctype html><meta name="viewport" content="width=device-width"><button id="installApp">Add to phone</button><section id="installHelp" hidden>Manual installation help</section><script src="/pwa.js"></script>';
const server=createServer((req,res)=>{
 if(req.url==='/'){res.writeHead(200,{'content-type':'text/html'}).end(html);return;}
 if(req.url==='/pwa.js'){res.writeHead(200,{'content-type':'text/javascript'}).end(source);return;}
 res.writeHead(404).end();
});
async function exercise(browser,engine,width,origin){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 try{
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  for(const scenario of ['prompt-reject','choice-reject','dismissed','pending-double-click','installed-before-rejection','accepted','manual']){
   await page.goto(origin,{waitUntil:'load'});
   const button=page.locator('#installApp'),help=page.locator('#installHelp');
   assert.equal(await button.isVisible(),true);
   assert.equal(await help.isHidden(),true);
   if(scenario==='manual'){
    await button.click();assert.equal(await help.isVisible(),true);
    await button.click();assert.equal(await help.isHidden(),true);
   }else{
    await page.evaluate(scenario=>{
     window.fixtureCalls=0;
     const event=new Event('beforeinstallprompt',{cancelable:true});
     event.prompt=()=>{
      window.fixtureCalls++;
      if(scenario==='prompt-reject')return Promise.reject(Error('expired'));
      if(scenario==='pending-double-click'||scenario==='installed-before-rejection')
       return new Promise((resolve,reject)=>{window.fixtureResolve=resolve;window.fixtureReject=reject;});
      return Promise.resolve();
     };
     Object.defineProperty(event,'userChoice',{get:()=>scenario==='choice-reject'?Promise.reject(Error('unavailable')):
      Promise.resolve({outcome:scenario==='accepted'?'accepted':'dismissed'})});
     if(window.dispatchEvent(event))throw Error('Install event default not prevented');
    },scenario);
    await button.click();
    if(scenario==='pending-double-click'){
     assert.equal(await button.isDisabled(),true);
     await page.evaluate(()=>document.getElementById('installApp').onclick());
     assert.equal(await help.isHidden(),true);
     await page.evaluate(()=>window.fixtureResolve());
    }
    if(scenario==='installed-before-rejection'){
     await page.evaluate(()=>{window.dispatchEvent(new Event('appinstalled'));window.fixtureReject(Error('expired'));});
    }
    await page.waitForFunction(()=>!document.getElementById('installApp').disabled);
    assert.equal(await page.evaluate(()=>window.fixtureCalls),1);
    assert.equal(await help.isHidden(),scenario==='accepted'||scenario==='installed-before-rejection');
    assert.equal(await button.isHidden(),scenario==='installed-before-rejection');
    if(scenario!=='installed-before-rejection')assert.equal(await button.textContent(),'Add to phone');
   }
   assert.deepEqual(errors,[]);
   console.log(engine,width,scenario,'PASS installation event recovery');
  }
 }finally{await context.close();}
}
try{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const origin='http://127.0.0.1:'+server.address().port;
 for(const [engine,type] of Object.entries({chromium,webkit})){
  if(process.env.CC_INSTALL_ENGINE&&process.env.CC_INSTALL_ENGINE!==engine)continue;
  const browser=await type.launch();
  try{for(const width of [320,390,430])await exercise(browser,engine,width,origin);}
  finally{await browser.close();}
 }
}finally{server.close();}
