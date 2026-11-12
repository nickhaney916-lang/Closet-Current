/** Synthetic control pixels ONLY: tests actual checkPhoto and render code in
 * Chromium/WebKit at CSS mobile sizes, not real garment/model/physical phone QA. */
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const check=await readFile('public/photo-check.js','utf8');
const quality=await readFile('public/photo-quality-research.js','utf8');
const app=await readFile('public/app.js','utf8');
const start=app.indexOf('function renderPhotoResults('),end=app.indexOf('function render(){',start);
assert.ok(start>=0&&end>start);
const harness=[
 "const photoQualityHints73=new WeakMap(),items=[],batch=[],localPending=new Set();",
 "const recognitionState={activeId:null},reviewFirst836=true;",
 "const $=id=>document.getElementById(id);",
 "const node=(tag,text,cl)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(cl)el.className=cl;return el;};",
 "const cropButton=()=>document.createElement('button'),adjustPhoto=()=>{};",
 "let renders=0,view='';",
 "const render=()=>{renders++;},switchView=name=>{view=name;};",
 "window.closetAuth={user:{id:'owner-A'}};",
 "window.init73=(photo,advice)=>{const item={id:'a',image:photo,category:'Tops',itemType:'T-shirt',color:'Blue',name:'Test photo',seasons:[],localAnalyzed:true,requiresOwnershipConfirmation:true};batch.splice(0,batch.length,item);photoQualityHints73.set(item,{source:item.image,owner:'owner-A',advice});renderPhotoResults($('grid'),batch);};",
 "window.refresh73=()=>{renderPhotoResults($('grid'),batch);return {visible:!!document.querySelector('.photo-extra'),view,photo:batch[0].image,adviceCount:Number(photoQualityHints73.has(batch[0]))};};",
 "window.changeSource73=photo=>{batch[0].image=photo;return window.refresh73();};",
 "window.replaceSameId73=()=>{batch[0]={...batch[0]};return window.refresh73();};",
 "window.changeOwner73=owner=>{window.closetAuth.user.id=owner;return window.refresh73();};",
 "window.count73=()=>({kept:batch.length,view,adviceCount:Number(photoQualityHints73.has(batch[0]))});"
].join('\n');
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true,...(name==='chromium'?{args:['--no-sandbox']}: {})});
 try{for(const width of [320,390,430]){
   const page=await browser.newPage({viewport:{width,height:820},isMobile:true,hasTouch:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.setContent('<!doctype html><html><body><label><input type="checkbox" id="photoQualityResearch73">Research photo tips</label><button id="start">Camera</button><div id="grid"></div></body></html>');
   await page.addScriptTag({content:quality});await page.addScriptTag({content:check});
   await page.evaluate(()=>{
    window.__p73Decodes=0;
    const decode=Image.prototype.decode;
    Image.prototype.decode=function(...args){window.__p73Decodes++;return decode.apply(this,args);};
   });
   const baseline=await page.evaluate(async()=>{
     const c=document.createElement('canvas');c.width=960;c.height=720;
     const ctx=c.getContext('2d');ctx.fillStyle='#111';ctx.fillRect(0,0,960,720);
     const image=c.toDataURL('image/jpeg',.94),before=window.__p73Decodes;
     const start=performance.now(),q=await checkPhoto(image);
     return {image,hasTips:!!q.captureGuidance,decodeCalls:window.__p73Decodes-before,
      elapsedMs:Math.round((performance.now()-start)*100)/100};
   });
   assert.equal(baseline.hasTips,false,'off by default');
   assert.equal(baseline.decodeCalls,1,'one decode only when research OFF');
   assert.equal(await page.locator('#photoQualityResearch73').isChecked(),false);
   await page.locator('#photoQualityResearch73').check();
   const result=await page.evaluate(async image=>{
      const before=window.__p73Decodes,start=performance.now();
      const q=await checkPhoto(image);
      return {advice:q.captureGuidance?.advice,metrics:q.captureGuidance?.metrics,
       decodeCalls:window.__p73Decodes-before,elapsedMs:Math.round((performance.now()-start)*100)/100};
   },baseline.image);
   assert.ok(result.metrics?.sampledWidth<=256);
   assert.ok(result.metrics?.sampledWidth*result.metrics?.sampledHeight*4<=256*256*4,
    'opt-in preview never exceeds 256 KiB of RGBA pixel data');
   assert.equal(result.decodeCalls,1,'opt-in analysis must reuse the existing Image decode');
   assert.ok(result.advice?.some(a=>a.code==='low-light'));
   await page.addScriptTag({content:harness+'\n'+app.slice(start,end)});
   await page.evaluate(({photo,advice})=>window.init73(photo,advice),{photo:baseline.image,advice:result.advice});
   await page.locator('summary').click();
   assert.equal(await page.getByRole('button',{name:'Keep this photo'}).count(),1);
   assert.equal(await page.getByRole('button',{name:'Take another photo'}).count(),1);
   await page.getByRole('button',{name:'Take another photo'}).click();
   assert.deepEqual(await page.evaluate(()=>window.count73()),{kept:1,view:'scan',adviceCount:1});
   await page.getByRole('button',{name:'Keep this photo'}).click();
   assert.equal((await page.evaluate(()=>window.count73())).adviceCount,0);
   await page.evaluate(({photo,advice})=>window.init73(photo,advice),{photo:baseline.image,advice:result.advice});
   assert.equal((await page.evaluate(()=>window.changeSource73('replacement-photo'))).visible,false);
   await page.evaluate(({photo,advice})=>window.init73(photo,advice),{photo:baseline.image,advice:result.advice});
   assert.equal((await page.evaluate(()=>window.replaceSameId73())).visible,false,'same ID must not inherit another object’s hints');
   await page.evaluate(({photo,advice})=>window.init73(photo,advice),{photo:baseline.image,advice:result.advice});
   assert.equal((await page.evaluate(()=>window.changeOwner73('owner-B'))).visible,false);
   await page.locator('#photoQualityResearch73').uncheck();
   assert.equal(errors.length,0,errors.join('; '));
   console.log('P73_BROWSER_NO_DEPLOY '+JSON.stringify({browser:name,width,offByDefault:true,retakeKeepsOriginal:true,sourceFence:true,ownerFence:true,itemIdentityFence:true,sourceDecodeOff:baseline.decodeCalls,sourceDecodeOn:result.decodeCalls,offMs:baseline.elapsedMs,onMs:result.elapsedMs,pageErrors:0}));
   await page.close();
 }}finally{await browser.close();}
}
