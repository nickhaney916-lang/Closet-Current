/**
 * Browser-generated synthetic JPEGs ONLY. Chromium/WebKit @ 320/390/430.
 * Decode source image via native image decoder and color a bounded region
 * without changing source bytes, preserving contrast under uneven lighting.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
const root=resolve('.');
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/shadow-color-qa'){
   res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none';script-src 'self';style-src 'unsafe-inline';img-src data:;connect-src 'self'"});
   res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Original color QA</title><main style="max-width:100%;overflow-wrap:anywhere"><h2>Offline original color test</h2><canvas width="192" height="256" style="max-width:100%;height:auto" id="source"></canvas><p id="state"></p></main><script src="/public/photo-color.js"></script>');
   return;
  }
  if(!['/public/photo-color.js','/research/original-color/shadow-corroborated-color.mjs'].includes(path))throw Error('Invalid test path');
  const file=resolve(root,'.'+decodeURIComponent(path));if(!file.startsWith(root+sep))throw Error('Outside test tree');
  res.writeHead(200,{'Content-Type':['.js','.mjs'].includes(extname(file))?'text/javascript':'text/plain','Cache-Control':'no-store'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port,records=[];
try{
 for(const [browserName,driver]of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await driver.launch({headless:true,...(browserName==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:768},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const page=await context.newPage(),outgoing=[],errors=[];
    page.on('pageerror',x=>errors.push(x.message));
    await context.route('**/*',route=>{
     if(!route.request().url().startsWith(base)){outgoing.push(route.request().url());return route.abort('blockedbyclient');}
     return route.continue();
    });
    await page.goto(base+'/shadow-color-qa');
    const result=await page.evaluate(async()=>{
     const {evaluateOriginalRegionColor,composeOfflineGarmentIndex}=await import('/research/original-color/shadow-corroborated-color.mjs');
     const canvas=document.querySelector('#source'),g=canvas.getContext('2d',{willReadFrequently:true});
     const W=192,H=256;
     g.fillStyle='#1d6fec';g.fillRect(0,0,W,H);
     // A red synthetic garment region framed by a blue background.
     g.fillStyle='#d51e29';g.fillRect(22,20,148,215);
     // Long dark red shadow creates an incorrect dark majority in the baseline.
     g.fillStyle='#2a070a';g.fillRect(68,20,102,215);
     // A few precise synthetic colored stripes intentionally remain visible.
     g.fillStyle='#de2028';for(let y=26;y<234;y+=38)g.fillRect(32,y,22,3);
     const src=canvas.toDataURL('image/jpeg',.95);
     const img=new Image();img.src=src;await img.decode();
     const dec=document.createElement('canvas');dec.width=img.naturalWidth;dec.height=img.naturalHeight;
     const c=dec.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0);
     const full=c.getImageData(0,0,W,H).data;
     const before=full.slice(),frame={width:W,height:H,channels:4,data:full};
     const mask=new Uint8Array(W*H);
     for(let y=22;y<233;y++)for(let x=26;x<166;x++)mask[y*W+x]=1;
     const modified=new Uint8ClampedArray(full);
     for(let i=0;i<mask.length;i++)if(!mask[i])modified[4*i+3]=0;
     const baseline=PhotoColor.maskedPalette(modified,W,H);
     const analyzed=evaluateOriginalRegionColor(frame,{mask,sourceRole:'original-instance',family:PhotoColor.family});
     if(analyzed.status!=='verified-color'||analyzed.color!=='Red')throw Error('Original photo color failed '+JSON.stringify(analyzed));
     if(!analyzed.shadowRecoveredPixels)throw Error('No shadow pixel recovered');
     const index=composeOfflineGarmentIndex({categoryConfirmed:true,choices:[{category:'Tops',itemType:'Unknown'}]},analyzed);
     if(index.category!=='Tops'||index.color!=='Red'||index.itemType!=='Unknown'||index.autoSave!==false)throw Error('Unverified subtype auto-saved');
     if(!full.every((n,i)=>n===before[i]))throw Error('Image source mutated');
     // A fully shadowed specimen cannot be assumed red from absent bright source evidence.
     const allDark=new Uint8ClampedArray(32*32*4);
     for(let i=0;i<allDark.length;i+=4)allDark.set([42,7,10,255],i);
     const uncertain=evaluateOriginalRegionColor({width:32,height:32,channels:4,data:allDark},{family:PhotoColor.family,sourceRole:'original-whole'});
     if(uncertain.status!=='review')throw Error('Unanchored shadows guessed a bright garment');
     document.querySelector('#state').textContent='Original photo, masked color, required identity pass';
     return {originalWidth:W,originalHeight:H,baseline:baseline.primary,corrected:analyzed.color,
      shadowRecovered:analyzed.shadowRecoveredPixels,originalBytesPreserved:true,
      requiredCategoryColorIndexed:true,exactTypeWithheld:true,unanchoredNeedsReview:true};
    });
    assert.deepEqual(errors,[]);assert.deepEqual(outgoing,[]);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    records.push({browser:browserName,width,...result,externalRequests:0,pageErrors:0});
    await context.close();
   }
  }finally{await browser.close();}
 }
 assert.equal(records.length,6);
 console.log('SHADOW_COLOR_BROWSER_PASS '+JSON.stringify(records));
}finally{await new Promise(ok=>server.close(ok));}
