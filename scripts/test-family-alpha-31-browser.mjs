// Actual compiled app + real JPEG decoding/review/save/UI/2D renderer/IndexedDB.
// Auth, cloud and classification are synthetic local mocks. No live service proof.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const refinedOnly=process.env.CLOSET_ALPHA_REFINED_31_VISUAL==='1';
const root=resolve(refinedOnly?'dist-family-alpha-31-refined-avatar-HOLD':'dist-family-alpha-31-hold');
const owner='a1111111-1111-4111-8111-111111111111';
const mime={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=resolve(root,'.'+(path==='/'?'/index.html':path));if(path==='/__qa__/synthetic.mjs')file=resolve('research/family-alpha-13/synthetic-garments.mjs');else if(!file.startsWith(root+'/'))throw Error('path');const data=await readFile(file);res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,results=[];
try{for(const [name,engine]of [['Chromium',chromium],['WebKit',webkit]]){
 const browser=await engine.launch({headless:true,args:name==='Chromium'?['--no-sandbox']:[]});
 try{for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),errors=[],external=[];
  await context.route('**/*',r=>{const url=r.request().url();if(url.startsWith(origin+'/')||/^(data:|blob:)/.test(url))return r.continue();external.push(url);return r.abort();});
  await context.route('**/auth.js*',r=>r.fulfill({contentType:'text/javascript',body:`window.closetAuth={user:{id:'${owner}'},ready:Promise.resolve(),getSessionGeneration:()=>1,getAccessToken:async()=> 'mock-not-a-jwt',getPublicKey:()=> 'synthetic-public-key'};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;`}));
  await context.route('**/local-worker.mjs*',r=>r.fulfill({contentType:'text/javascript',body:"self.onmessage=e=>self.postMessage({id:e.data.id,type:'error',stage:'synthetic',code:'model',text:'Recognition model intentionally disabled in synthetic workflow QA.'});"}));
  await context.route('**/cloud-backup.js*',r=>r.fulfill({contentType:'text/javascript',body:"window.closetCloud={beforeWrite:async d=>{if(d.name!=='closet-current-user-'+window.closetAuth.user.id)throw Error('Mock owner');},getOwnerId:d=>d?.name==='closet-current-user-'+window.closetAuth.user.id?window.closetAuth.user.id:null,changed(){},start:async()=>{},sync:async()=>{},invalidateSession(){}};"}));
  await context.addInitScript(({owner})=>{window.__CLOSET_ALPHA29_OFFLINE__=true;const original=window.fetch.bind(window);window.fetch=(input,init)=>String(input)==='https://fbnplztkbsteuzrmbgib.supabase.co/auth/v1/user'?Promise.resolve(new Response(JSON.stringify({id:owner}),{status:200,headers:{'content-type':'application/json'}})):original(input,init);},{owner});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(origin+'/');await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
   await page.locator('#alpha29NewClothes').waitFor({state:'attached'});
   const newId=await page.evaluate(async({owner})=>{
    const {syntheticGarment}=await import('/__qa__/synthetic.mjs');
    function shot(category,n){const raw=syntheticGarment(category),c=document.createElement('canvas');c.width=raw.frame.width;c.height=raw.frame.height;for(let i=0;i<raw.foreground.length;i++)if(raw.foreground[i])raw.frame.data[i*4]=(raw.frame.data[i*4]+n*11)%180;c.getContext('2d').putImageData(new ImageData(raw.frame.data,c.width,c.height),0,0);return c.toDataURL('image/jpeg',.97);}
    const rows=[['top2','Tops','T-shirt'],['top3','Tops','Polo'],['bottom1','Bottoms','Jeans'],['bottom2','Bottoms','Shorts'],['bottom3','Bottoms','Trousers'],['shoe1','Shoes','Sneakers'],['shoe2','Shoes','Sneakers'],['shoe3','Shoes','Sneakers'],['shoe4','Shoes','Sneakers']].map(([id,category,itemType],i)=>{const image=shot(category,i+1);return normalizeClothing({id,name:id,ownerId:owner,category,itemType,color:'Blue',pattern:'Solid',seasons:[],image,originalPhoto:{image},userAdjusted:true});});
    await writeAll(rows);items=rows;render();
    // Classifier intentionally mocked; actual import, original JPEG, Adjust and save remain real.
    queueAutomatic=item=>{item.localAnalyzed=true;item.recognitionReviewRequired=true;};scheduleMemoryReview=()=>{};
    const photo=shot('Tops',19),bytes=Uint8Array.from(atob(photo.split(',')[1]),x=>x.charCodeAt(0));await importClothingPhotos([new File([bytes],'synthetic-new-top.jpg',{type:'image/jpeg'})]);return batch.at(-1).id;
   },{owner});
   const card=page.locator('#reviewGrid article.photo-result').last();await card.getByRole('button',{name:'Adjust',exact:true}).click();
   const dialog=page.locator('dialog.photo-adjust');await dialog.getByLabel('Item name',{exact:true}).fill('New blue top');await dialog.getByLabel('Main category',{exact:true}).selectOption('Tops');await dialog.getByLabel('Item type',{exact:true}).selectOption('T-shirt');await dialog.getByLabel('Color',{exact:true}).fill('Blue');
   const check=dialog.getByLabel('I checked the original photo, category, item type and color',{exact:true});if(await check.isVisible())await check.check();await dialog.getByRole('button',{name:'Save changes',exact:true}).click();await dialog.waitFor({state:'detached'});
   await page.evaluate(()=>switchView('closet'));const panel=page.locator('#alpha29NewClothes');await panel.waitFor({state:'visible'});await panel.getByLabel('Your new piece',{exact:true}).selectOption(newId);await panel.getByRole('button',{name:'Style My New Clothes',exact:true}).click();await panel.locator('.alpha29-options article').nth(2).waitFor();
   assert.equal(await panel.locator('.alpha29-options article').count(),3);
   for(let i=0;i<3;i++){
    const article=panel.locator('.alpha29-options article').nth(i);await article.getByRole('button',{name:'Review 2D preview '+(i+1),exact:true}).click();
    for(let piece=0;piece<3;piece++){await article.getByRole('button',{name:'Use cutout',exact:true}).click();}
    await article.locator('.family-alpha-avatar').waitFor();assert.equal(await article.locator('.family-alpha-avatar img').count(),3);
    assert.equal(await article.locator('svg[data-humanoid="articulated-2d-v1"]').count(),1);
    if(refinedOnly){
     for(const name of ['head','neck','left-eye','right-eye','nose','mouth',
      'left-fingers','right-fingers','left-arm','right-arm','left-leg','right-leg']){
      assert.equal(await article.locator('svg[data-humanoid="articulated-2d-v1"] [data-part="'+name+'"]').count(),1,
       'Refined source-backed figure is missing '+name);
     }
     if(i===0&&width===390){
      // Synthetic-only evidence. Screenshot is directly from 31's actual
      // compiled local Style My New Clothes UI after user-confirmed cutouts.
      await page.evaluate(()=>{
       let heading=document.getElementById('alpha31-visual-synthetic-label');
       if(!heading){
        heading=document.createElement('p');heading.id='alpha31-visual-synthetic-label';
        heading.style.cssText='padding:12px;border:2px dashed #666;background:#fff;color:#222;font-size:13px;';
        document.querySelector('#alpha29NewClothes').prepend(heading);
       }
       heading.textContent='SYNTHETIC REVIEW ONLY — original garment photos and avatar rendered in a mocked local test. This is NOT real clothing fitting, account security or release approval.';
      });
      await mkdir('benchmark/family-alpha-refined-avatar-HOLD',{recursive:true});
      await article.screenshot({
       path:'benchmark/family-alpha-refined-avatar-HOLD/'+name.toLowerCase()+'-390px-first-outfit-SYNTHETIC.png',
       animations:'disabled'
      });
     }
    }
    const layers=await article.locator('.family-alpha-avatar img').evaluateAll(imgs=>imgs.map(img=>({src:img.src,w:img.naturalWidth,h:img.naturalHeight,box:img.getBoundingClientRect().toJSON()})));
    for(const img of layers){assert.ok(img.src.startsWith('data:image/png'));assert.ok(img.w>0&&img.h>0);assert.ok(Math.abs(img.box.width/img.box.height-img.w/img.h)<0.02);}

   }
   const first=panel.locator('.alpha29-options article').first();await first.getByRole('button',{name:'Swap shoes in outfit 1',exact:true}).click();await panel.getByRole('button',{name:'Save outfit 1',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#alpha29NewClothes [role="status"]').textContent.includes('Outfit saved'));
   const savedSources=await page.evaluate(()=>JSON.stringify(items.map(x=>({id:x.id,image:x.image,originalPhoto:x.originalPhoto,ownerId:x.ownerId})).sort((a,b)=>a.id.localeCompare(b.id))));
   const before=await page.evaluate(()=>({original:items.find(x=>x.name==='New blue top').originalPhoto?.image||items.find(x=>x.name==='New blue top').image,count:items.length}));assert.equal(before.count,10);
   await page.reload();await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));await page.evaluate(()=>switchView('closet'));await panel.getByRole('button',{name:'Restore favorite 1',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#alpha29NewClothes [role="status"]').textContent.includes('Favorite restored'));
   assert.equal(await page.evaluate(()=>JSON.stringify(items.map(x=>({id:x.id,image:x.image,originalPhoto:x.originalPhoto,ownerId:x.ownerId})).sort((a,b)=>a.id.localeCompare(b.id)))),savedSources);
   const restored=await page.evaluate(id=>({pin:currentBoard.slots.top===id,original:items.find(x=>x.id===id).originalPhoto?.image||items.find(x=>x.id===id).image}),newId);assert.ok(restored.pin);assert.equal(restored.original,before.original);
   const layout=await panel.evaluate(p=>({panelWidth:p.getBoundingClientRect().width,viewport:innerWidth,buttons:[...p.querySelectorAll('button')].filter(x=>x.getBoundingClientRect().height>0).every(x=>x.getBoundingClientRect().height>=44),overflow:document.documentElement.scrollWidth>innerWidth+2}));assert.ok(layout.buttons);assert.ok(!layout.overflow,JSON.stringify(layout));
   await page.evaluate(()=>{window.closetAuth.user=null;window.dispatchEvent(new Event('closet:alpha-session-changed'));});assert.ok(await panel.isHidden());
   assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push({engine:name,width,status:'PASS',threeOutfits:true,reviewedAvatars:3,pinSwapSaveReloadRestore:true,refinedFaceApprovedForFamily:false,refinedFaceVisible:refinedOnly,physicalPhone:false,mocked:['Auth','cloud','classifier']});
  }finally{await context.close();}
 }}finally{await browser.close();}
}}finally{server.close();}
await mkdir('benchmark/family-alpha-31',{recursive:true});await writeFile('benchmark/family-alpha-31/browser-results.json',JSON.stringify(results,null,2));console.log('ALPHA31_BROWSER_PASS',JSON.stringify(results));
