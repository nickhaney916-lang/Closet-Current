import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {
 assertDisabledIntegratedCandidate,OUTPUT
} from './build-family-alpha-recognition-integrated-hold.mjs';

const root=resolve(OUTPUT);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.json':'application/json','.bin':'application/octet-stream',
 '.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const dest=resolve(root,'.'+pathname.replace(/\/$/,'/index.html'));
  if(dest!==root&&!dest.startsWith(root+sep))throw Error('Out of scope');
  const content=await readFile(dest);
  res.writeHead(200,{'content-type':mime[extname(dest)]||'application/octet-stream',
   'cache-control':'no-store','x-content-type-options':'nosniff'});res.end(content);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
try{
 const manifest=await assertDisabledIntegratedCandidate();
 const results=[];
 for(const [name,driver]of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await driver.launch({headless:true});
  try{
   for(const width of [320,390,430]){
    const page=await browser.newPage({viewport:{width,height:840}});
    const errors=[],external=[];
    page.on('pageerror',e=>errors.push(String(e.message||e)));
    page.on('request',request=>{
     const u=new URL(request.url());
     if(u.hostname!=='127.0.0.1')external.push(request.url());
    });
    await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
    await page.waitForTimeout(450);
    const state=await page.evaluate(()=>({
     held:window.__CLOSET_ALPHA_STAGE_AUTH__?.ready===false,
     host:location.hostname,
     authVisible:!document.getElementById('authGate')?.hidden,
     appHidden:document.getElementById('appShell')?.hidden===true,
     reviewPanelExists:!!document.getElementById('familyAlphaLocalPreview'),
     reviewPanelHidden:document.getElementById('familyAlphaLocalPreview')?.hidden===true,
     reviewLaunchDisabled:document.getElementById('familyAlphaPreviewStart')?.disabled===true,
     modernFigureExists:!!document.getElementById('reusableFigureStage'),
     loginUnavailable:window.closetAuth?.user===null,
     stageAuthBase:window.__CLOSET_ALPHA_STAGE_AUTH__?.base
    }));
    assert.equal(state.held,true,'staged secretless Auth must remain HOLD');
    assert.equal(state.authVisible,true);
    assert.equal(state.appHidden,true,'no unauthenticated photo/board app reveal');
    assert.equal(state.reviewPanelExists,true);
    assert.equal(state.reviewPanelHidden,true,'avatar boot is local-development off');
    assert.equal(state.reviewLaunchDisabled,true);
    assert.equal(state.modernFigureExists,true);
    assert.equal(state.loginUnavailable,true);
    assert.equal(state.stageAuthBase,'https://fbnplztkbsteuzrmbgib.supabase.co');
    assert.deepEqual(external,[],'disabled stage page cannot make external requests');
    assert.deepEqual(errors,[],'combined app static startup has no script errors');
    results.push({browser:name,width,authentication:'HOLD',
     modernFigureExists:true,stagePhotoAvatarRetained:true,appHidden:true,
     externalRequests:external.length,pageErrors:errors.length});
    await page.close();
   }
  }finally{await browser.close();}
 }
 if(results.length!==6||manifest.releaseGate!=='HOLD')
  throw Error('Did not complete all disabled browser checks');
 console.log('FAMILY_ALPHA_RECOGNITION_COMBINED_HOLD_BROWSER_PASS '+JSON.stringify(results));
}finally{
 await new Promise(resolve=>server.close(resolve));
}
