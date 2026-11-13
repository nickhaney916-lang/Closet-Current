/** Mission 1 P850 actual index.html queue UI + actual app.js controller.
 * Chromium/WebKit CSS widths 320/390/430. Generated SVG garments, synthetic
 * in-memory private account and fake Adjust; NOT photo recognition or phones.
 * Existing P844/P847/P849 tests verify actual protected Adjust transaction.
 */
import {chromium,webkit} from 'playwright';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const html=await readFile('public/index.html','utf8');
const app=await readFile('public/app.js','utf8');
const moduleSource=await readFile('public/review-queue-850.js','utf8');
const css=await readFile('public/app-theme.css','utf8');
const start=html.indexOf('<section id="review"'),end=html.indexOf('<section id="closet"',start);
assert.ok(start>=0&&end>start,'P850 actual review HTML missing');
const section=html.slice(start,end);
const s=app.indexOf('const reviewQueue850='),e=app.indexOf('function render(){',s);
assert.ok(s>=0&&e>s,'P850 source controller missing');
const source=app.slice(s,e);
const harness=[
 "const $=id=>document.getElementById(id);",
 "let batch=[],items=[],db={name:'closet-current-user-owner-A'},localPending=new Set();",
 "window.closetAuth={user:{id:'owner-A'}};",
 "window.reviewOpen850=[],window.crop850=[],window.navigation850=[],window.privateWrites850=0;",
 "function adjustPhoto(item){window.reviewOpen850.push(item.id);}",
 "function cropClothingPhoto(item){window.crop850.push(item.id);item.image=item.image+'#changed';render();}",
 "function switchView(name){window.navigation850.push(name);}",
 "function render(){window.panelRenderCount850=(window.panelRenderCount850||0)+1;renderReviewQueue850();}",
 "function make850(n,owner='owner-A'){const svg='<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"140\"><rect width=\"120\" height=\"140\" fill=\"hsl('+n*15+',45%,55%)\"/></svg>';return {id:'photo-'+n,image:'data:image/svg+xml,'+encodeURIComponent(svg),ownerId:owner,category:'Tops',itemType:'T-shirt',color:'Blue',localAnalyzed:true};}",
 "window.setup850=function(count=25){db={name:'closet-current-user-owner-A'};window.closetAuth.user={id:'owner-A'};batch=Array.from({length:count},(_,i)=>make850(i+1));reviewQueue850.clear();$('reviewQueue850').checked=false;window.reviewOpen850=[];window.crop850=[];window.privateWrites850=0;render();};",
 "window.state850=()=>({batchCount:batch.length,writeCount:window.privateWrites850,selected:reviewQueue850.reconcile(batch,window.closetAuth.user).current?.id,kept:reviewQueue850.reconcile(batch,window.closetAuth.user).deferredCount,open:[...window.reviewOpen850]});"
].join('\n');
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true,...(name==='chromium'?{args:['--no-sandbox']}:{})});
 try{
  for(const width of [320,390,430]){
   const page=await browser.newPage({viewport:{width,height:830},isMobile:true,hasTouch:true});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>'+section.replace('<section id="review" class="view" hidden','<section id="review" class="view"')+'</body></html>');
   await page.addStyleTag({content:css});
   for(const js of [moduleSource,harness,source])await page.addScriptTag({content:js});
   await page.evaluate(()=>window.setup850());
   assert.equal(await page.locator('#reviewQueue850').isChecked(),false);
   assert.equal(await page.locator('#reviewQueuePanel850').isHidden(),true);
   await page.locator('#reviewQueue850').check();
   assert.equal(await page.locator('#reviewQueuePanel850').isVisible(),true);
   assert.equal(await page.locator('#reviewGrid').isHidden(),true);
   assert.match(await page.locator('#reviewQueueStatus850').textContent(),/Photo 1 of 25 · 25 unfinished/);
   const before=await page.locator('#reviewQueueImage850').getAttribute('src');
   await page.getByRole('button',{name:'Next photo'}).click();
   const after=await page.locator('#reviewQueueImage850').getAttribute('src');
   assert.notEqual(before,after);
   assert.match(await page.locator('#reviewQueueStatus850').textContent(),/Photo 2 of 25/);
   await page.getByRole('button',{name:'Keep for later'}).click();
   assert.match(await page.locator('#reviewQueueStatus850').textContent(),/Photo 3 of 25 · 25 unfinished · 1 kept for later/);
   let state=await page.evaluate(()=>window.state850());
   assert.equal(state.batchCount,25);
   assert.equal(state.kept,1);
   assert.equal(state.writeCount,0);
   await page.getByRole('button',{name:'Review selected photo'}).click();
   state=await page.evaluate(()=>window.state850());
   assert.deepEqual(state.open,['photo-3']);
   assert.equal(state.writeCount,0);
   await page.getByRole('button',{name:'Crop photo'}).click();
   state=await page.evaluate(()=>window.state850());
   assert.equal(state.selected,'photo-3');
   assert.equal(state.writeCount,0);
   assert.equal(await page.evaluate(()=>window.crop850.length),1);
   await page.evaluate(()=>{batch=batch.filter(x=>x.id!=='photo-3');render();});
   assert.match(await page.locator('#reviewQueueStatus850').textContent(),/24 unfinished/);
   await page.getByRole('button',{name:'Previous'}).click();
   assert.equal(await page.evaluate(()=>window.state850().batchCount),24);
   await page.getByRole('button',{name:'Take another photo'}).click();
   assert.deepEqual(await page.evaluate(()=>window.navigation850),['scan']);
   const widths=await page.locator('.review-queue-panel-850').evaluate(el=>({
    panel:el.getBoundingClientRect().width,
    maxButton:Math.max(...[...el.querySelectorAll('button')].map(b=>b.getBoundingClientRect().width)),
    scroll:el.scrollWidth,
    box:el.getBoundingClientRect().width
   }));
   assert.ok(widths.panel<=width+1,'panel fits phone width');
   assert.ok(widths.maxButton<=width,'buttons fit phone width');
   await page.getByRole('button',{name:'Show all photos'}).click();
   assert.equal(await page.locator('#reviewQueue850').isChecked(),false);
   // The isolated harness deliberately does not draw photo cards; an empty
   // fallback grid can have zero height even when its hidden state is false.
   assert.equal(await page.locator('#reviewGrid').getAttribute('hidden'),null);
   // Owner switch: when a new account has a valid private DB, do not carry over
   // the prior account's selected original photo, skipped IDs or opt-in toggle.
   await page.locator('#reviewQueue850').check();
   await page.getByRole('button',{name:'Next photo'}).click();
   await page.evaluate(()=>{
    window.closetAuth.user={id:'owner-B'};
    db={name:'closet-current-user-owner-B'};
    batch=[make850(100,'owner-B'),make850(101,'owner-B')];render();
   });
   assert.equal(await page.locator('#reviewQueue850').isChecked(),false);
   assert.equal(await page.locator('#reviewQueuePanel850').isHidden(),true);
   assert.equal(await page.evaluate(()=>window.state850().selected),'photo-100');
   assert.deepEqual(errors,[]);
   console.log('M1_P850_BROWSER_REVIEW_QUEUE',JSON.stringify({
    engine:name,width,originalPanel:true,defaultOff:true,unfinishedAfterSkip:25,
    sourceChangingCropPreserved:true,clickReviewNeverSaves:true,
    safeOwnerSwitch:true,fullGridFallback:true,errors:0,
    actualPhone:false,realPhotoAccuracy:'UNKNOWN'
   }));
   await page.close();
  }
 }finally{await browser.close();}
}
