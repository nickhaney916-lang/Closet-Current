import {chromium,webkit} from 'playwright';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist-family-alpha-64-isolation-guidance-HOLD');
const type={'.mjs':'text/javascript','.html':'text/html'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://127.0.0.1').pathname;
  if(pathname==='/test'){res.writeHead(200,{'content-type':'text/html'});
   res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><main id="review"></main></html>');return;}
  const path=resolve(root,'.'+pathname);
  if(!path.startsWith(root+'/'))throw Error('outside root');
  res.writeHead(200,{'content-type':type[extname(path)]||'application/octet-stream'});
  res.end(await readFile(path));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const results=[];
try{
 for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   for(const width of [320,390,430]){
    const page=await browser.newPage({viewport:{width,height:820},hasTouch:true,isMobile:true});
    const external=[];
    page.on('request',req=>{if(!req.url().startsWith(origin+'/'))external.push(req.url());});
    try{
     await page.goto(origin+'/test');
     await page.evaluate(async()=>{
      const {confirmReviewedPhotoInContainer}=await import('/__alpha_research/family-alpha-reviewed-photo/preview-confirmation.mjs');
      const {buildIsolationReviewGuidance}=await import('/__alpha_research/work50/review-guidance.mjs');
      const root=document.querySelector('#review');
      const guidance=buildIsolationReviewGuidance({status:'prepared',confidence:{reasons:[
       'semantic-mannequin-hanger-and-fabric-review-required',
       'pale-fabric-or-background-ambiguity',
       'private-source-identity-must-not-be-shown']}});
      window.__begin=({risk=guidance}={})=>{
       const ctl=new AbortController();window.__abort=ctl;
       window.__approval=confirmReviewedPhotoInContainer(root,{
         originalImage:'data:image/jpeg;base64,/9j/2Q==',
         transparentImage:{src:'data:image/png;base64,iVBORw0KGgo='},
         isolationGuidance:risk,
         autoAccepted:true,ownerApproved:true,
         description:'UNTRUSTED_PRIVATE_DESCRIPTION'
       },{signal:ctl.signal,isActive:()=>true});
      };
      window.__begin();
     });
     const notice=page.locator('.alpha64-isolation-guidance');
     await notice.waitFor({state:'visible'});
     assert.match(await notice.textContent(),/Pale clothing may blend into the background/);
     assert.match(await notice.textContent(),/Inspect the collar, neckline and cuffs/);
     assert.doesNotMatch(await page.locator('#review').textContent(),
      /UNTRUSTED_PRIVATE_DESCRIPTION|private-source-identity-must-not-be-shown/);
     assert.equal(await page.locator('.family-alpha-photo-review').count(),1);
     assert.equal(await page.locator('#review').locator('button').count(),2);
     // A programmatic, untrusted synthetic click MUST NEVER approve.
     await page.evaluate(()=>document.querySelector('.family-alpha-photo-review button:last-child').click());
     assert.equal(await page.locator('.family-alpha-photo-review').count(),1);
     await page.getByRole('button',{name:'Retake photo',exact:true}).click();
     assert.equal(await page.evaluate(()=>window.__approval),false);
     assert.equal(await page.locator('#review').locator('img').count(),0);
     await page.evaluate(()=>window.__begin());
     await page.getByRole('button',{name:'Use cutout',exact:true}).click();
     assert.equal(await page.evaluate(()=>window.__approval),true);
     assert.equal(await page.locator('#review').locator('img').count(),0);
     await page.evaluate(()=>window.__begin({risk:{schema:'closet-isolation-review-v1',codes:['PRIVATE_TOKEN_AS_REASON']}}));
     assert.match(await page.locator('.alpha64-isolation-guidance').textContent(),/mannequins, hangers or person parts/);
     assert.doesNotMatch(await page.locator('#review').textContent(),/PRIVATE_TOKEN_AS_REASON/);
     await page.evaluate(()=>window.__abort.abort());
     assert.equal(await page.evaluate(()=>window.__approval),false);
     assert.equal(await page.locator('.family-alpha-photo-review').count(),0);
     assert.deepEqual(external,[]);
     results.push({engine:engineName,width,cutoutAutoApproved:false,
      maliciousLabelsEscaped:true,explicitClickRequired:true,abortCleansUp:true});
    }finally{await page.close();}
   }
  }finally{await browser.close();}
 }
 assert.equal(results.length,6);
 console.log('FAMILY_ALPHA_64_GUIDED_REVIEW_BROWSER_PASS',JSON.stringify(results));
}finally{await new Promise(r=>server.close(r));}
