import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {chromium,webkit} from 'playwright';

const root=resolve('.'),cases=[];
const server=createServer(async(req,res)=>{
 try{
  const name=decodeURIComponent(new URL(req.url,'http://local').pathname);
  if(name==='/'){
   res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
   res.end('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{font:16px system-ui;margin:0;padding:12px}#review,#avatar{width:100%;max-width:390px;margin:16px auto}</style></head><body><div id="review"></div><div id="avatar"></div></body></html>');return;
  }
  if(!name.endsWith('.mjs')||!(name.startsWith('/public/family-alpha-2d-')||
   name.startsWith('/research/family-alpha-reviewed-photo/')||
   name.startsWith('/research/family-alpha-13/')||
   name.startsWith('/research/family-alpha-16/')))
   throw Error('Module not whitelisted');
  const filename=resolve(root,'.'+name);if(!filename.startsWith(root+sep))throw Error('Path outside source');
  res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});
  res.end(await readFile(filename));
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
try{
 for(const [browserName,driver] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await driver.launch({headless:true,...(browserName==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:840},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const page=await context.newPage(),errors=[],external=[];
    page.on('pageerror',e=>errors.push(e.message));
    await context.route('**/*',route=>{
     if(!route.request().url().startsWith(origin+'/')){
      external.push(route.request().url());return route.abort('blockedbyclient');
     }
     return route.continue();
    });
    try{
     await page.goto(origin+'/');
     await page.evaluate(async()=>{
      const {syntheticGarment}=await import('/research/family-alpha-13/synthetic-garments.mjs');
      const {prepareReviewedPhotoPresentation}=await import('/research/family-alpha-reviewed-photo/real-jpeg-review-provider.mjs');
      const {confirmReviewedPhotoInContainer}=await import('/research/family-alpha-reviewed-photo/preview-confirmation.mjs');
      const {renderAlphaAuthenticatedBoard}=await import('/public/family-alpha-2d-auth-preflight.mjs');
      const A='a1111111-1111-4111-8111-111111111111',B='b2222222-2222-4222-8222-222222222222';
      function asJpeg(scene){
       const c=document.createElement('canvas');c.width=scene.frame.width;c.height=scene.frame.height;
       c.getContext('2d').putImageData(new ImageData(scene.frame.data,scene.frame.width,scene.frame.height),0,0);
       return c.toDataURL('image/jpeg',.97);
      }
      const source=asJpeg(syntheticGarment('Tops'));
      const item={id:'shirt-a',category:'Tops',image:source,originalPhoto:{image:source},outfitSourceId:'verified-test-capture'};
      const state={ownerId:A,epoch:1,current:item},review=document.getElementById('review'),avatar=document.getElementById('avatar');
      const getScope=()=>({ownerId:state.ownerId,epoch:state.epoch});
      const getItem=()=>state.current;
      const reviewPreview=detail=>confirmReviewedPhotoInContainer(review,detail,{
       isActive:()=>state.ownerId===A
      });
      const settings={item,ownerId:A,getScope,getItem,reviewPreview};
      window.fixture={state,item,A,B,source,settings,review,avatar,
       start:()=>prepareReviewedPhotoPresentation(settings),
       asJpeg,syntheticGarment,prepareReviewedPhotoPresentation,renderAlphaAuthenticatedBoard,
       render:async presentation=>{
        return renderAlphaAuthenticatedBoard(avatar,{
         auth:{user:{id:A},getAccessToken:async()=> 'mock-test-token'},
         database:{name:'closet-current-user-'+A},
         getCloudOwnerId:()=>state.ownerId,
         getSessionGeneration:()=>state.epoch,
         publicKey:'synthetic-pubkey',
         fetchFn:async()=>({status:200,ok:true,json:async()=>({id:A})}),
         loadScopedWardrobe:async()=>({ownerId:A,indexedDbName:'closet-current-user-'+A,
          board:{slots:{top:'shirt-a'}},items:[item]}),
         preparePresentations:async()=>({'shirt-a':presentation})
        });
       }
      };
      window.fixture.pending=window.fixture.start();
     });
     await page.getByRole('heading',{name:'Does this look like your clothing?'}).waitFor();
     const before=await page.evaluate(()=>{
      const buttons=[...document.querySelectorAll('#review button')];
      const img=[...document.querySelectorAll('#review img')];
      return {buttons:buttons.map(x=>({text:x.textContent,height:x.getBoundingClientRect().height})),
       imageAlt:img.map(x=>x.alt),horizontalOverflow:document.documentElement.scrollWidth>innerWidth,
       source:img[0]?.src.startsWith('data:image/jpeg;base64,'),
       cutout:img[1]?.src.startsWith('data:image/png;base64,')};
     });
     assert.deepEqual(before.buttons.map(x=>x.text),['Retake photo','Use cutout']);
     assert.ok(before.buttons.every(x=>x.height>=44));
     assert.deepEqual(before.imageAlt,['Original photo','Transparent cutout']);
     assert.equal(before.horizontalOverflow,false);
     assert.equal(before.source,true);assert.equal(before.cutout,true);
     await page.getByRole('button',{name:'Use cutout'}).click();
     const first=await page.evaluate(async()=>{
      const status=await window.fixture.pending;
      if(status.status!=='approved-for-staging-preview')throw Error('Reviewed JPEG was not approved');
      if(!status.presentation.sourcePixelAuditPassed||!status.presentation.humanPreviewConfirmed)
       throw Error('Original source check or direct approval missing');
      const result=await window.fixture.render(status.presentation);
      return {status:status.status,rendered:result.renderedLayers,
       imageCount:document.querySelectorAll('#avatar img').length,
       reviewerCleared:!document.querySelector('#review img')};
     });
     assert.equal(first.rendered,1);assert.equal(first.imageCount,1);assert.equal(first.reviewerCleared,true);
     // An individual retake/cancel MUST NOT produce an avatar presentation.
     await page.evaluate(()=>{
      window.fixture.pending=window.fixture.start();
     });
     await page.getByRole('button',{name:'Retake photo'}).click();
     const declined=await page.evaluate(async()=>{
      const result=await window.fixture.pending;
      return {status:result.status,reason:result.reason,approved:!!result.presentation,
       reviewCleared:document.querySelector('#review img')===null};
     });
     assert.equal(declined.status,'review');assert.equal(declined.approved,false);assert.equal(declined.reviewCleared,true);
     // Mid-review account switching invalidates the candidate.
     await page.evaluate(()=>{
      window.fixture.pending=window.fixture.start();
     });
     await page.getByRole('button',{name:'Use cutout'}).waitFor();
     await page.evaluate(()=>{window.fixture.state.ownerId=window.fixture.B;window.fixture.state.epoch++;});
     await page.getByRole('button',{name:'Use cutout'}).click();
     const switched=await page.evaluate(async()=>{
      const result=await window.fixture.pending;
      // The wrapper must independently refuse stale auth on re-entry.
      let refused=false;try{await window.fixture.render({});}catch{refused=true;}
      return {status:result.status,approved:!!result.presentation,
       authRefused:refused,avatarCleared:document.querySelectorAll('#avatar img').length===0};
     });
     assert.equal(switched.status,'reject');assert.equal(switched.approved,false);
     assert.equal(switched.authRefused,true);assert.equal(switched.avatarCleared,true);
     // Ambiguous busy background may not reach review or avatar presentation.
     const busy=await page.evaluate(async()=>{
      window.fixture.state.ownerId=window.fixture.A;window.fixture.state.epoch++;
      const image=window.fixture.asJpeg(window.fixture.syntheticGarment('Tops',{background:'busy'}));
      const item={...window.fixture.item,image,originalPhoto:{image}};
      window.fixture.state.current=item;
      const result=await window.fixture.prepareReviewedPhotoPresentation({
       ...window.fixture.settings,item
      });
      return {status:result.status,presentation:result.presentation,reason:result.reason,
       reviewEmpty:document.querySelector('#review img')===null};
     });
     assert.equal(busy.status,'review');assert.equal(busy.presentation,null);
     assert.equal(busy.reviewEmpty,true);
     assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
     cases.push({browser:browserName,width,realJpegDecoded:true,reviewConfirmed:true,
      avatarLayerRendered:true,retakeSafe:true,accountSwitchSafe:true,
      busyBackgroundRefused:true,externalRequests:external.length});
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
 assert.equal(cases.length,6);
 console.log('FAMILY_ALPHA_REVIEW_REAL_JPEG_BROWSER_PASS '+JSON.stringify(cases));
}finally{await new Promise(resolve=>server.close(resolve));}
