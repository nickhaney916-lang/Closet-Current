// Stacked Family Alpha source-integrated manual correction QA, adapted from verified
// Chat Assignment #23; account and backend deliberately mocked in local browser.
// Actual mobile browser interaction with the built Closet Current app.
// Synthetic canvas JPEGs, disposable IndexedDB owner, no external network.
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {assertDisabledIntegratedCandidate} from './build-family-alpha-recognition-integrated-hold.mjs';
const root=resolve('dist-family-alpha-recognition-integration-hold');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
// Only the compiled stage HOLD candidate is served; Auth is replaced by a browser-local fake.
const held=await assertDisabledIntegratedCandidate();
assert.equal(held.releaseGate,'HOLD');
assert.equal(held.sourcePinnedManualReview,true);
assert.equal(held.stageAuthBlocked,true);
const server=createServer(async(req,res)=>{
 try{
  const name=new URL(req.url,'http://localhost').pathname;
  const file=resolve(root,'.'+decodeURIComponent(name==='/'?'/index.html':name));
  if(!file.startsWith(root+'/'))throw Error('Unsafe path');
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
async function installFixture(page,{category='Uncategorized',type='Unknown',color='',outfit=false}={}){
 await page.evaluate(({category,type,color,outfit})=>{
  const shot=(fill)=>{
   const canvas=document.createElement('canvas');canvas.width=220;canvas.height=220;
   const context=canvas.getContext('2d');context.fillStyle=fill;context.fillRect(0,0,220,220);
   return canvas.toDataURL('image/jpeg',.9);
  };
  const source=shot('#1430b5'),presentation=outfit?shot('#b55a20'):source,scene=shot('#d6b314');
  // No worker, model or customer-photo use: these are already-reviewable drafts.
  const draft=normalizeClothing({
   id:'synthetic-review-'+category+'-'+(outfit?'layered':'single'),
   image:presentation,name:'',category,itemType:type,color,
   localAnalyzed:true,recognitionReviewRequired:true,userAdjusted:false,
   seasons:[],pattern:'Unknown'
  });
  if(outfit){
   draft.outfitSourceId='synthetic-scene';
   draft.originalPhoto={image:scene};
   draft.recognitionPhoto={image:source};
   draft.segmentHint={categories:['Bottoms','Dresses','Outerwear'],types:[],
    clipped:true,displayFallback:'original-crop'};
  }
  batch=[draft];items=[];localPending.clear();sessionCapturedIds.clear();
  switchView('review');render();
 },{category,type,color,outfit});
 const card=page.locator('#reviewGrid article.photo-result').first();
 await card.getByRole('button',{name:'Adjust',exact:true}).click();
 const dialog=page.locator('dialog.photo-adjust');
 await dialog.waitFor({state:'visible'});
 return dialog;
}
const report=[];
try{
 for(const [browserName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true,args:browserName==='Chromium'?['--no-sandbox']:[]});
  try{
   for(const width of [320,390]){
    const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,
     serviceWorkers:'block'});
    const unexpected=[],errors=[];
    await context.route('**/*',route=>{
     if(route.request().url().startsWith(base+'/')||/^(data:|blob:)/.test(route.request().url()))return route.continue();
     unexpected.push(route.request().url());return route.abort();
    });
    // Playwright routes are evaluated newest-first. Install the Auth stub
    // last so a real login service cannot accidentally be contacted.
    await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
     "window.closetAuth={user:{id:'review-23-"+browserName.toLowerCase()+"-"+width+"'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
    // Cloud remains unavailable in the *real* staging HOLD bundle.
    // Only this synthetic localhost browser fixture replaces the remote
    // adapter with an owner-checked, no-network local mock. This does NOT
    // unlock stage Auth or relax the application's queued-save owner checks.
    await context.route('**/cloud-backup.js*',route=>route.fulfill({
     contentType:'text/javascript',
     body:"window.closetCloud={beforeWrite:async(db)=>{const id=window.closetAuth?.user?.id;if(!id||db?.name!=='closet-current-user-'+id)throw Error('Synthetic owner mismatch');},changed(){},getOwnerId:db=>db?.name==='closet-current-user-'+window.closetAuth?.user?.id?window.closetAuth.user.id:null,start:async()=>{},invalidateSession(){},sync:async()=>{}};"
    }));
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    try{
     await page.goto(base+'/');
     await page.evaluate(()=>closetReady);
     // Unknown item: Save cannot approve an unconfirmed category/color.
     let dialog=await installFixture(page);
     await dialog.getByRole('button',{name:'Save changes'}).click();
     assert.match(await dialog.locator('.photo-review-feedback').innerText(),/Choose a clothing category and color/);
     assert.equal(await page.evaluate(()=>items.length),0);
     await dialog.locator('select[aria-label="Main category"]').selectOption('Bottoms');
     await dialog.locator('select[aria-label="Item type"]').selectOption('Shorts');
     await dialog.locator('input[aria-label="Color"]').fill('Blue');
     const confirm=dialog.locator('input[aria-label="I checked the original photo, category, item type and color"]');
     assert.equal(await confirm.isVisible(),true,'Ambiguous Bottoms require original-photo confirmation');
     await dialog.getByRole('button',{name:'Save changes'}).click();
     assert.match(await dialog.locator('.photo-review-feedback').innerText(),/check the confirmation box/);
     await confirm.check();
     await dialog.locator('select[aria-label="Item type"]').selectOption('Skirt');
     assert.equal(await confirm.isChecked(),false,'Changing the type requires fresh confirmation');
     await confirm.check();
     await dialog.getByRole('button',{name:'Save changes'}).click();
     await dialog.waitFor({state:'detached'});
     assert.equal(await page.evaluate(()=>items.length),1);
     assert.deepEqual(await page.evaluate(()=>({category:items[0].category,type:items[0].itemType,
      color:items[0].color,original:items[0].recognitionPhoto?.image||items[0].image,
      userAdjusted:items[0].userAdjusted})),
      {category:'Bottoms',type:'Skirt',color:'Blue',
       original:await page.evaluate(()=>items[0].image),userAdjusted:true});
     assert.match(await page.locator('#message').innerText(),/Clothing saved to My closet/);

     // Layered image: display cutout is visibly distinct from original RGB
     // and full source outfit expands. A checkmark alone is never automatic.
     dialog=await installFixture(page,{category:'Dresses',type:'Unknown',color:'Blue',outfit:true});
     assert.equal(await dialog.locator('img[alt="Original unmasked garment photo used for recognition"]').count(),1);
     assert.equal(await dialog.locator('.original-outfit-context').evaluate(el=>el.open),true);
     assert.match(await dialog.innerText(),/may contain more than one garment or background/);
     assert.equal(await dialog.locator('.photo-review-acknowledgement').isVisible(),true);
     await dialog.getByRole('button',{name:'Save changes'}).click();
     assert.match(await dialog.locator('.photo-review-feedback').innerText(),/check the confirmation box/);
     await dialog.getByRole('button',{name:'Cancel'}).click();
     await dialog.waitFor({state:'detached'});
     assert.equal(await page.evaluate(()=>items.length),0,'Cancelled layered photo must not save');

     // A revised source while dialog is open invalidates manual approval.
     dialog=await installFixture(page,{category:'Shoes',type:'Unknown',color:'Blue'});
     await dialog.locator('.photo-review-acknowledgement input').check();
     await page.evaluate(()=>{batch[0].image='data:image/jpeg;base64,NEW_SYNTHETIC_SOURCE';});
     await dialog.getByRole('button',{name:'Save changes'}).click();
     assert.equal(await page.evaluate(()=>items.length),0);
     assert.match(await page.locator('#message').innerText(),/photo or account changed/i);
     await dialog.getByRole('button',{name:'Cancel'}).click();
     await dialog.waitFor({state:'detached'});
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,
      'No horizontal mobile overflow');
     // The existing app may attempt Google Fonts and its public trends feed;
     // our route ABORTS these before any external network request can complete.
     // Fail for any unrecognized outbound target rather than permitting it.
     assert.ok(unexpected.every(url=>
      url.startsWith('https://fonts.googleapis.com/css2?')||
      url.startsWith('https://raw.githubusercontent.com/nickhaney916-lang/Closet-Current/main/public/trend-data.json?')),
      'Unexpected outbound URL: '+JSON.stringify(unexpected));
     assert.deepEqual(errors,[],'No browser runtime errors');
     report.push({engine:browserName,width,scenarios:3,result:'PASS',externalRequestsAllowed:0,
      backgroundRequestsBlocked:unexpected.length,syntheticOnly:true});
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
 assert.equal(report.length,4);
 console.log('FAMILY_ALPHA_COMPILED_MOBILE_MANUAL_REVIEW_HOLD_PASS '+JSON.stringify(report));
}finally{await new Promise(ok=>server.close(ok));}
