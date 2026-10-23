/** Synthetic 2D avatar aspect-ratio checks in real Chromium and WebKit layout engines. NO DEPLOY. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {chromium,webkit} from 'playwright';

const root=resolve('.');
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/alpha2d'){
   res.writeHead(200,{'Content-Type':'text/html','Content-Security-Policy':"default-src 'none'; script-src 'self'; img-src data:; style-src 'unsafe-inline'; connect-src 'self'",'Cache-Control':'no-store'});
   res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;padding:10px;font:16px system-ui}#stage{width:100%;max-width:360px;margin:auto}</style></head><body><div id="stage"></div></body></html>');
   return;
  }
  if(!pathname.startsWith('/public/family-alpha-2d-')||!pathname.endsWith('.mjs'))throw Error('Forbidden path');
  const filename=resolve(root,'.'+pathname);
  if(!filename.startsWith(root+sep))throw Error('Bad path');
  res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});
  res.end(await readFile(filename));
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port;
const results=[];
try{
 for(const [browserName,driver] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await driver.launch({headless:true,...(browserName==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:840},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const page=await context.newPage(),errors=[],external=[];
    page.on('pageerror',error=>errors.push(error.message));
    await context.route('**/*',route=>{
     if(!route.request().url().startsWith(host)){external.push(route.request().url());return route.abort('blockedbyclient');}
     return route.continue();
    });
    await page.goto(host+'/alpha2d');
    const data=await page.evaluate(async()=>{
     const {renderPhotoLayers}=await import('/public/family-alpha-2d-photo-renderer.mjs');
     const {planPhotoLayers}=await import('/public/family-alpha-2d-layer-plan.mjs');
     const sizes={shirt:[150,260],pants:[180,320],shoes:[360,120],jacket:[290,145],dress:[220,420]};
     const images={},sourceURLs={};
     for(const [id,[w,h]] of Object.entries(sizes)){
      const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'"><rect x="5" y="5" width="'+(w-10)+'" height="'+(h-10)+'" fill="#548cba"/></svg>';
      const image=new Image();
      image.src='data:image/svg+xml,'+encodeURIComponent(svg);
      await image.decode();
      images[id]=image;sourceURLs[id]=image.src;
     }
     const garment=(slot,itemId)=>({slot,itemId,sourceIdentity:'synthetic-original-'+itemId,sourceVersion:'sha256-test'});
     const stage=document.querySelector('#stage');
     const selections=[garment('layer','jacket'),garment('top','shirt'),garment('bottom','pants'),garment('shoes','shoes')];
     if(renderPhotoLayers(stage,selections,images)!==4)throw Error('Four layers failed');
     const frame=stage.firstElementChild,frameBox=frame.getBoundingClientRect();
     const drawn=[...frame.querySelectorAll('img')],planned=planPhotoLayers(selections);
     if(drawn.map(x=>x.dataset.slot).join(',')!=='shoes,bottom,top,layer')throw Error('Layer order changed');
     for(let i=0;i<drawn.length;i++){
      const img=drawn[i],rect=img.getBoundingClientRect(),slot=planned[i];
      if(getComputedStyle(img).objectFit!=='contain')throw Error('Aspect containment disabled');
      if(Math.abs(rect.width/rect.height-img.naturalWidth/img.naturalHeight)>.008)throw Error('Stretched '+slot.slot);
      if(rect.width>slot.width*frameBox.width+.2||rect.height>slot.height*frameBox.height+.2)throw Error('Slot overflow '+slot.slot);
      if(img.src!==sourceURLs[slot.itemId])throw Error('Synthetic original image reference changed');
     }
     const before=stage.firstElementChild;
     let refused=false;
     try{renderPhotoLayers(stage,[garment('top','shirt'),garment('bottom','pants')],{shirt:images.shirt});}catch{refused=true;}
     if(!refused||stage.firstElementChild!==before)throw Error('Missing image incorrectly changed frame');
     if(renderPhotoLayers(stage,[garment('dress','dress'),garment('shoes','shoes')],images)!==2)throw Error('Dress render failed');
     for(const img of stage.querySelectorAll('img')){
      const rect=img.getBoundingClientRect();
      if(Math.abs(rect.width/rect.height-img.naturalWidth/img.naturalHeight)>.008)throw Error('Dress outfit stretched '+img.dataset.slot);
     }
     let conflict=false;
     try{planPhotoLayers([garment('dress','dress'),garment('top','shirt')]);}catch{conflict=true;}
     if(!conflict)throw Error('Dress conflict not blocked');
     return {fourLayers:true,dressLayers:true,missingImageRefused:true,aspectPreserved:true};
    });
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true);
    results.push({browser:browserName,width,...data});
    await context.close();
   }
  }finally{await browser.close();}
 }
 assert.equal(results.length,6);
 console.log('FAMILY_ALPHA_2D_ASPECT_BROWSER_PASS '+JSON.stringify(results));
}finally{await new Promise(ok=>server.close(ok));}
