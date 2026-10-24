import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {chromium,webkit} from 'playwright';
const root=resolve('.'),cases=[];
const template=await readFile('public/index.html','utf8');
const panel=template.match(/<section id="familyAlphaLocalPreview"[\s\S]*?<\/section>/)?.[0];
if(!panel)throw Error('Cannot find real Outfit Builder Family Alpha preview section');
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://fixture').pathname);
  if(path==='/'){
   res.writeHead(200,{'Content-Type':'text/html'});
   res.end('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{font:16px system-ui;margin:0;padding:12px}#familyAlphaLocalPreview{width:100%;max-width:390px;margin:auto}</style></head><body><button id="logout" type="button">Log out</button>'+panel+'</body></html>');
   return;
  }
  if(!path.endsWith('.mjs')&&path!=='/public/family-alpha-preview-boot.js')throw Error('Denied');
  if(!(path.startsWith('/public/family-alpha-2d-')||
   path.startsWith('/public/family-alpha-preview-')||
   path.startsWith('/research/family-alpha-13/')||
   path.startsWith('/research/family-alpha-16/')||
   path.startsWith('/research/family-alpha-reviewed-photo/')))throw Error('Denied');
  const file=resolve(root,'.'+path);if(!file.startsWith(root+sep))throw Error('Traversal');
  res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
try{
 for(const [name,driver] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await driver.launch({headless:true,...(name==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const [width,height] of [[320,850],[390,850],[430,850],[850,390]]){
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
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
     assert.equal(await page.locator('#familyAlphaLocalPreview').isHidden(),true);
     assert.equal(await page.locator('#familyAlphaPreviewStart').isDisabled(),true);
     // Off-by-default actual boot on the production-style page cannot mount.
     await page.addScriptTag({url:'/public/family-alpha-preview-boot.js'});
     assert.equal(await page.locator('#familyAlphaLocalPreview').isHidden(),true);
     await page.evaluate(async()=>{
      const {mountAlphaBuilderPreview,alphaLocalEnabled}=
       await import('/public/family-alpha-preview-controller.mjs');
      if(alphaLocalEnabled({hostname:location.hostname,flag:false}))throw Error('Accidental default-on');
      const {syntheticGarment}=await import('/research/family-alpha-13/synthetic-garments.mjs');
      const a='a1111111-1111-4111-8111-111111111111';
      const capture=(category)=>{
       const scene=syntheticGarment(category);
       const c=document.createElement('canvas');c.width=scene.frame.width;c.height=scene.frame.height;
       c.getContext('2d').putImageData(new ImageData(scene.frame.data,c.width,c.height),0,0);
       return c.toDataURL('image/jpeg',.96);
      };
      const specs=[['shirt-a','Tops'],['pants-a','Bottoms'],['shoes-a','Shoes']];
      const items=specs.map(([id,category])=>{
       const image=capture(category);return{id,category,image,originalPhoto:{image}};
      });
      const byId=new Map(items.map(item=>[item.id,item]));
      const state={epoch:1,ownerId:a,items,board:{slots:{top:'shirt-a',bottom:'pants-a',shoes:'shoes-a'}}};
      const auth={user:{id:a},getSessionGeneration:()=>state.epoch,getAccessToken:async()=> 'mock-not-a-token'};
      const db={name:'closet-current-user-'+a,objectStoreNames:{contains:x=>['items','state'].includes(x)},
       transaction(names,mode){
        if(mode!=='readonly')throw Error('Unexpected DB write');
        const tx={objectStore(store){
         return{
          getAll(){const r={};queueMicrotask(()=>{r.result=state.items;r.onsuccess?.();});return r;},
          get(id){const r={};queueMicrotask(()=>{r.result=id==='outfit-board'?{id,current:state.board}:null;r.onsuccess?.();});return r;}
         };
        }};
        setTimeout(()=>tx.oncomplete?.(),0);return tx;
       }};
      const cloud={getOwnerId:database=>database===db&&auth.user.id===state.ownerId?state.ownerId:null};
      const box=document.getElementById('familyAlphaLocalPreview');
      const c=mountAlphaBuilderPreview({
       panel:box,launch:document.getElementById('familyAlphaPreviewStart'),
       review:document.getElementById('familyAlphaPreviewReview'),
       avatar:document.getElementById('familyAlphaPreviewAvatar'),
       status:document.getElementById('familyAlphaPreviewStatus'),
       auth,cloud,getDatabase:()=>db,
       getLatestItem:id=>byId.get(id),
       fetchFn:async(url,options)=>{
        if(url!=='https://hlkgymugtfbirlpunsra.supabase.co/auth/v1/user'||
           options.headers.Authorization!=='Bearer mock-not-a-token')throw Error('Unexpected simulated Auth');
        return {status:200,ok:true,json:async()=>({id:state.ownerId})};
       },
       publicKey:'synthetic-publishable',cryptoProvider:crypto,localApproved:true
      });
      window.__alphaFixture={state,auth,db,cloud,items,c};
     });
     assert.equal(await page.locator('#familyAlphaLocalPreview').isVisible(),true);
     // Regression: interruption during review used to strand launch.disabled=true.
     await page.locator('#familyAlphaPreviewStart').click();
     await page.getByRole('button',{name:'Use cutout'}).waitFor();
     for(const name of ['Use cutout','Retake photo']){
      const box=await page.getByRole('button',{name}).boundingBox();
      assert.ok(box.width>=44&&box.height>=44,'Comfortable review tap target');
     }
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
     await page.evaluate(()=>window.dispatchEvent(new Event('closet:alpha-board-changed')));
     assert.equal(await page.locator('#familyAlphaPreviewReview img').count(),0);
     assert.equal(await page.locator('#familyAlphaPreviewStart').isEnabled(),true,'Interrupted review must allow retry');

     await page.locator('#familyAlphaPreviewStart').click();
     for(let i=0;i<3;i++){
      await page.getByRole('button',{name:'Use cutout'}).waitFor();
      await page.getByRole('button',{name:'Use cutout'}).click();
     }
     await page.waitForFunction(()=>document.querySelectorAll('#familyAlphaPreviewAvatar img').length===3);
     const rendered=await page.evaluate(()=>{
      const frame=document.querySelector('#familyAlphaPreviewAvatar');
      return {
       count:frame.querySelectorAll('img').length,
       slots:[...frame.querySelectorAll('img')].map(img=>img.dataset.slot),
       altText:document.getElementById('familyAlphaPreviewStatus').textContent,
       hasReviewImages:document.querySelectorAll('#familyAlphaPreviewReview img').length!==0,
       overflow:document.documentElement.scrollWidth>innerWidth
      };
     });
     assert.equal(rendered.count,3);
     assert.deepEqual(rendered.slots,['shoes','bottom','top']);
     assert.match(rendered.altText,/not show realistic fit/);
     assert.equal(rendered.hasReviewImages,false);
     assert.equal(rendered.overflow,false);
     // Existing Outfit Builder editing event immediately clears stale layers.
     await page.evaluate(()=>window.dispatchEvent(new Event('closet:alpha-board-changed')));
     assert.equal(await page.locator('#familyAlphaPreviewAvatar img').count(),0);
     await page.locator('#familyAlphaPreviewStart').click();
     await page.getByRole('button',{name:'Retake photo'}).waitFor();
     await page.getByRole('button',{name:'Retake photo'}).click();
     await page.waitForFunction(()=>document.querySelector('#familyAlphaPreviewStatus').textContent.includes('unavailable'));
     assert.equal(await page.locator('#familyAlphaPreviewAvatar img').count(),0);
     // Delayed, still-open preview must fail when account scope changes.
     await page.locator('#familyAlphaPreviewStart').click();
     await page.getByRole('button',{name:'Use cutout'}).waitFor();
     await page.evaluate(()=>{window.__alphaFixture.state.epoch++;window.__alphaFixture.state.ownerId='b2222222-2222-4222-8222-222222222222';});
     await page.getByRole('button',{name:'Use cutout'}).click();
     await page.waitForFunction(()=>document.getElementById('familyAlphaPreviewStatus').textContent.includes('unavailable'));
     assert.equal(await page.locator('#familyAlphaPreviewAvatar img').count(),0);
     assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
     cases.push({browser:name,width,height,reviewInterruptionRetry:true,tapTargets:true,defaultOff:true,threeReviewedLayers:true,
      boardInvalidates:true,retakeSafe:true,accountSwitchSafe:true,outsideRequests:external.length});
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
 assert.equal(cases.length,8);
 console.log('FAMILY_ALPHA_18_MOBILE_PASS '+JSON.stringify(cases));
}finally{await new Promise(resolve=>server.close(resolve));}
