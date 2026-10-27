/** Real licensed dress source-backed placement comparison; development HOLD.
 * Data from #35's verified frozen licensed original/cutout pixel audit.
 * Shows before/after rigid positioning over unchanged 2D body, never rewrites
 * photo, mask, source RGBA, stored data or garments. No customer data.
 */
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist-family-alpha-36-rigid-align-HOLD');
const evidence=resolve('benchmark/family-alpha-35-real-dress-HOLD');
const destination='benchmark/family-alpha-36-real-dress-HOLD';
await mkdir(destination,{recursive:true});
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/__qa__/view.html'){
   res.writeHead(200,{'content-type':'text/html'});
   res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1">'+
    '<title>2D Real Licensed Dress Position Only — NOT APPROVED</title><style>'+
    'body{font:14px/1.5 system-ui;background:#e5e7eb;color:#171717;margin:10px}'+
    '.warning{background:#751b1b;color:#fff;padding:10px}'+
    '.scene{max-width:360px;margin:20px auto}h2{font-size:16px;margin:8px 0}</style>'+
    '<div class="warning">ACTUAL LICENSED PHOTOGRAPH · VISUAL RESEARCH ONLY · '+ 
    'NOT REALISTIC FIT · NOT OWNER-APPROVED · NO FAMILY RELEASE</div>'+
    '<section class="scene"><h2>Human-cleaned mask / default 2D positioning</h2><div id="baseline"></div></section>'+
    '<section class="scene"><h2>Same exact PNG — reviewed rigid up/size positioning only</h2><div id="aligned"></div></section></html>');
   return;
  }
  let file;
  if(path==='/__qa__/cleaned.png')
   file=resolve(evidence,'commons-0053-manually-proposed-neck-cleanup.png');
  else{
   file=resolve(root,'.'+path);
   if(!file.startsWith(root+'/'))throw Error('Outside root');
  }
  const data=await readFile(file),ext=extname(file);
  res.writeHead(200,{'content-type':ext==='.png'?'image/png':ext==='.mjs'?'text/javascript':ext==='.js'?'text/javascript':'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('Unavailable');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port,results=[];
try{
 for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,args:engineName==='chromium'?['--no-sandbox']:[]});
  try{
   for(const width of [320,390]){
    const context=await browser.newContext({viewport:{width,height:760},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const bad=[],errors=[];
    await context.route('**/*',route=>{
     const url=route.request().url();
     if(url.startsWith(origin+'/')||/^(data:|blob:)/.test(url))return route.continue();
     bad.push(url);return route.abort();
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    try{
     await page.goto(origin+'/__qa__/view.html');
     const facts=await page.evaluate(async()=>{
      const {renderPhotoLayers}=await import('/family-alpha-2d-photo-renderer.mjs');
      const {mountManualGarmentAlignment}=await import('/__alpha_research/family-alpha-36/manual-fit.mjs');
      const response=await fetch('/__qa__/cleaned.png');
      if(!response.ok)throw Error('No frozen licensed PNG');
      const blob=await response.blob();
      const encoded=await new Promise((resolve,reject)=>{
       const reader=new FileReader();reader.onload=()=>resolve(reader.result);
       reader.onerror=reject;reader.readAsDataURL(blob);
      });
      const picture=new Image();picture.src=encoded;await picture.decode();
      if(picture.naturalWidth<100||!picture.src.startsWith('data:image/png;base64,'))
       throw Error('No decoded source colored PNG');
      const garment=[{slot:'dress',itemId:'licensed-proposed-dress',
       sourceIdentity:'licensed-unapproved-mask',sourceVersion:'visual-HOLD'}];
      for(const id of ['baseline','aligned']){
       const host=document.getElementById(id);
       if(renderPhotoLayers(host,garment,{'licensed-proposed-dress':picture})!==1)
        throw Error('Source-backed garment not displayed');
      }
      const stage=document.getElementById('aligned');
      const tool=mountManualGarmentAlignment(stage,{isActive:()=>true});
      if(!tool.mounted||!stage.querySelector('.alpha36-fit-controls'))
       throw Error('Human adjustment control unavailable on licensed photo');
      const original=stage.querySelector('img[data-slot="dress"]');
      const before=document.querySelector('#baseline img[data-slot="dress"]');
      if(original.src!==before.src)throw Error('Real source photo changed before alignment');
      return {originalSourceUnchanged:original.src===before.src,
       width:picture.naturalWidth,height:picture.naturalHeight};
     });
     const fit=page.locator('#aligned .alpha36-fit-controls');
     await fit.getByLabel('Garment to align').selectOption('dress');
     await fit.getByRole('button',{name:'↓ Down'}).click();
     await fit.getByRole('button',{name:'− Smaller'}).click();
     const summary=await page.evaluate(()=>{
      const a=document.querySelector('#baseline img[data-slot="dress"]'),b=document.querySelector('#aligned img[data-slot="dress"]');
      const f=el=>({x:el.style.left,y:el.style.top,w:el.getBoundingClientRect().width,
       h:el.getBoundingClientRect().height,src:el.src});
      return {base:f(a),aligned:f(b),noPhotoResampling:a.src===b.src,
       figureCount:document.querySelectorAll('[data-humanoid="articulated-2d-v1"]').length,
       fitPanelPresent:Boolean(document.querySelector('.alpha36-fit-controls'))};
     });
     assert.ok(summary.noPhotoResampling);
     assert.ok(summary.aligned.w<summary.base.w,'Real garment should be proportionally reduced by explicit adjustment');
     assert.notEqual(summary.base.y,summary.aligned.y);
     assert.ok(Math.abs(summary.base.w/summary.base.h-summary.aligned.w/summary.aligned.h)<.002);
     assert.equal(summary.figureCount,2);
     assert.equal(summary.fitPanelPresent,true);
     assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
     const file=destination+'/'+engineName+'-'+width+'-LICENSED-DRESS-RIGID-PREVIEW-HOLD.png';
     await page.screenshot({path:file,fullPage:true,animations:'disabled'});
     results.push({engine:engineName,width,cutoutSourceSame:true,
      nonDistortingManualScale:true,noRealHumanFitApproval:true,
      reviewedGarmentColorModified:false,ownerApproved:false,...facts});
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
}finally{server.close();}
console.log('FAMILY_ALPHA_36_LICENSED_RIGID_FIT_VISUAL_HOLD',JSON.stringify(results));
