import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {join,extname} from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const root='dist-family-alpha-65-review-lifecycle-HOLD';
const routes=new Set([
 '/__alpha_research/family-alpha-reviewed-photo/preview-confirmation.mjs',
 '/__alpha_research/work50/isolation-review-guidance.mjs'
]);
const server=createServer(async(req,res)=>{
 try{
  const route=new URL(req.url,'http://localhost').pathname;
  if(route==='/'){res.writeHead(200,{'content-type':'text/html'});
   res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><main id="review"></main><main id="another"></main>');return;}
  if(!routes.has(route))throw Error('Unknown path');
  const file=join(root,route.slice(1));
  res.writeHead(200,{'content-type':extname(file)==='.mjs'?'text/javascript':'application/octet-stream'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not available');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
await mkdir('benchmark/family-alpha-65-review',{recursive:true});
try{
 for(const [engine,browserType] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await browserType.launch({headless:true});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:760}});
    const page=await context.newPage(),external=[];
    page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('data:'))external.push('external');});
    await page.goto(origin+'/');
    await page.evaluate(async()=>{
     const {confirmReviewedPhotoInContainer:confirm}=await import('/__alpha_research/family-alpha-reviewed-photo/preview-confirmation.mjs');
     const box=document.getElementById('review');
     const detail=name=>({
      originalImage:'data:image/jpeg;base64,'+name,
      transparentImage:{src:'data:image/png;base64,'+name},
      isolationReview:{quality:'REVIEW',automaticApproval:false,requiresHumanReview:true,codes:['all-edges']}
     });
     window.__test={results:[],box,confirm,detail};
     const t=window.__test;
     t.oldAbort=new AbortController();
     t.oldConfirm=confirm(box,detail('QUFB'),{signal:t.oldAbort.signal,isActive:()=>true})
      .then(v=>t.results.push('old:'+v));
     t.detachedButton=box.querySelector('button:last-child');
     t.newConfirm=confirm(box,detail('QkJC'),{isActive:()=>true})
      .then(v=>t.results.push('new:'+v));
    });
    await page.waitForFunction(()=>window.__test.results.includes('old:false'));
    assert.equal(await page.locator('#review .family-alpha-photo-review').count(),1);
    assert.equal(await page.getByRole('button',{name:'Use cutout'}).count(),1);
    await page.evaluate(()=>{
     // A previous detached confirm button or aborted previous session must
     // never clear, approve, or influence the active NEW photo.
     window.__test.detachedButton.click();
     window.__test.oldAbort.abort();
    });
    assert.equal(await page.locator('#review .family-alpha-photo-review').count(),1);
    assert.deepEqual(await page.evaluate(()=>window.__test.results),['old:false']);
    await page.locator('#review').screenshot({path:'benchmark/family-alpha-65-review/'+engine.toLowerCase()+'-'+width+'-new-review.png'});
    await page.getByRole('button',{name:'Use cutout',exact:true}).click();
    await page.waitForFunction(()=>window.__test.results.includes('new:true'));
    assert.equal(await page.locator('#review img').count(),0);

    await page.evaluate(()=>{
     const t=window.__test;
     t.abortC=new AbortController();
     t.confirm(t.box,t.detail('Q0ND'),{signal:t.abortC.signal}).then(v=>t.results.push('C:'+v));
     t.confirm(t.box,t.detail('RERE'),{}).then(v=>t.results.push('D:'+v));
     t.abortC.abort();
    });
    await page.waitForFunction(()=>window.__test.results.includes('C:false'));
    assert.equal(await page.locator('#review .family-alpha-photo-review').count(),1);
    await page.getByRole('button',{name:'Retake photo'}).click();
    await page.waitForFunction(()=>window.__test.results.includes('D:false'));
    assert.equal(await page.locator('#review img').count(),0);

    await page.evaluate(()=>{
     const t=window.__test;
     t.confirm(t.box,t.detail('RUVF'),{}).then(v=>t.results.push('E:'+v));
     t.confirm(document.getElementById('another'),t.detail('RkZG'),{})
      .then(v=>t.results.push('F:'+v));
    });
    assert.equal(await page.locator('.family-alpha-photo-review').count(),2,
      'Independent containers must not cancel each other');
    await page.locator('#another').getByRole('button',{name:'Retake photo'}).click();
    await page.waitForFunction(()=>window.__test.results.includes('F:false'));
    assert.equal(await page.locator('#review .family-alpha-photo-review').count(),1);
    await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
    await page.waitForFunction(()=>window.__test.results.includes('E:false'));
    assert.equal(await page.locator('img').count(),0);
    assert.equal(external.length,0);
    console.log('FAMILY_ALPHA_65_BROWSER',JSON.stringify({engine,width,
     previousResolvedFalse:true,oldAbortCannotEraseNew:true,
     trustedNewConfirm:true,independentPanels:true,
     retakeAndPagehideRelease:true,noExternalRequests:true}));
    await context.close();
   }
  }finally{await browser.close();}
 }
}finally{await new Promise(resolve=>server.close(resolve));}
