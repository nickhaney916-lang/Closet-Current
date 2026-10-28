import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const root='dist-family-alpha-64-guidance-HOLD';
const serve=createServer(async(req,res)=>{
 try{
  const route=req.url.split('?')[0];
  if(route==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><main id="review"></main>');return;}
  if(![
    '/__alpha_research/family-alpha-reviewed-photo/preview-confirmation.mjs',
    '/__alpha_research/work50/isolation-review-guidance.mjs'
  ].includes(route)){res.writeHead(404);res.end();return;}
  const bytes=await readFile(join(root,route.slice(1)));
  res.setHeader('Content-Type','text/javascript');res.end(bytes);
 }catch{res.writeHead(500);res.end('Fixture error');}
});
await new Promise(resolve=>serve.listen(0,'127.0.0.1',resolve));
const address='http://127.0.0.1:'+serve.address().port;
await mkdir('benchmark/family-alpha-64-review',{recursive:true});
try{
 for(const [engine,browserType]of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await browserType.launch({headless:true});
  try{
   for(const width of [320,390,430]){
    const ctx=await browser.newContext({viewport:{width,height:780}});
    const page=await ctx.newPage(),external=[];
    page.on('request',r=>{if(!r.url().startsWith(address)&&!r.url().startsWith('data:'))external.push(r.url());});
    await page.goto(address+'/');
    await page.evaluate(async()=>{
     const [{confirmReviewedPhotoInContainer},{summarizeIsolationReview}]=await Promise.all([
       import('/__alpha_research/family-alpha-reviewed-photo/preview-confirmation.mjs'),
       import('/__alpha_research/work50/isolation-review-guidance.mjs')
     ]);
     const detail={
      originalImage:'data:image/jpeg;base64,AAA',
      transparentImage:{src:'data:image/png;base64,AAA'},
      isolationReview:summarizeIsolationReview({confidence:{reasons:[
       'pale-fabric-or-background-ambiguity',
       'source-clipped-or-border-contamination',
       'semantic-mannequin-hanger-and-fabric-review-required'
      ]}})
     };
     window.__acceptResult='PENDING';
     confirmReviewedPhotoInContainer(document.querySelector('#review'),detail,{
       isActive:()=>true
     }).then(v=>window.__acceptResult=v);
    });
    const advice=page.getByRole('region',{name:'Automatic isolation: what to inspect'});
    await advice.waitFor();
    const tips=await advice.locator('li').allTextContents();
    assert.ok(tips.some(t=>t.includes('light garments')),{engine,width,tips});
    assert.ok(tips.some(t=>t.includes('clipped')||t.includes('crowded')),{engine,width,tips});
    assert.ok(tips.every(t=>t.length<180));
    assert.equal(await page.getByRole('img',{name:'Original photo'}).count(),1);
    await advice.screenshot({path:'benchmark/family-alpha-64-review/'+engine.toLowerCase()+'-'+width+'.png'});
    await page.getByRole('button',{name:'Retake photo',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__acceptResult),false,'Retake never accepts unverified cutout');
    await page.evaluate(async()=>{
     const [{confirmReviewedPhotoInContainer},{summarizeIsolationReview}]=await Promise.all([
       import('/__alpha_research/family-alpha-reviewed-photo/preview-confirmation.mjs'),
       import('/__alpha_research/work50/isolation-review-guidance.mjs')
     ]);
     window.__acceptResult='PENDING';
     confirmReviewedPhotoInContainer(document.querySelector('#review'),{
       originalImage:'data:image/jpeg;base64,AAA',transparentImage:{src:'data:image/png;base64,AAA'},
       isolationReview:summarizeIsolationReview({confidence:{reasons:['unknown-PRIVATE_ID_<script>']}})
     },{isActive:()=>true}).then(v=>window.__acceptResult=v);
    });
    const safe=await advice.locator('li').allTextContents();
    assert.ok(safe.every(t=>!t.includes('PRIVATE_ID')&&!t.includes('<script>')));
    assert.equal(await page.locator('script').count(),0);
    await page.getByRole('button',{name:'Use cutout',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__acceptResult),true,'Only real user click confirms');
    assert.equal(external.length,0,'No private images or external requests');
    console.log('FAMILY_ALPHA_64_BROWSER',JSON.stringify({engine,width,sourceBoundAdvice:true,retakeDenied:true,clickedConfirmation:true,external:0}));
    await ctx.close();
   }
  }finally{await browser.close();}
 }
}finally{await new Promise(resolve=>serve.close(resolve));}
