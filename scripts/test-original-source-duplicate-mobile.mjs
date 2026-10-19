// Real app UI and storage queue on a phone-sized Chromium viewport.
// Synthetic original photograph; worker/classifier deliberately bypassed.
// A successful test is NOT physical-device or real-model segmentation proof.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname,
   file=resolve(root,'.'+(path==='/'?'/index.html':decodeURIComponent(path)));
  if(!file.startsWith(root+'/'))throw Error('Unsafe path');
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
  "window.closetAuth={user:{id:'source-identity-mobile-regression'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');
 await page.evaluate(()=>closetReady);
 const check=await page.evaluate(()=>{
  // Synthetic cloth pixels, not a licensed photo or model output.
  queueAutomatic=()=>{};
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=480;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#f1f1f1';ctx.fillRect(0,0,320,480);
  ctx.fillStyle='#478be0';ctx.fillRect(55,70,190,230);
  const original=canvas.toDataURL('image/jpeg',.94);
  const dupCanvas=document.createElement('canvas');dupCanvas.width=80;dupCanvas.height=100;
  const d=dupCanvas.getContext('2d');d.fillStyle='#478be0';d.fillRect(0,0,80,100);
  const display=dupCanvas.toDataURL('image/jpeg',.94);
  const base={outfitSourceId:'batch-one',originalPhoto:{image:original},recognitionPhoto:{image:original},
   cropBounds:{x:.1,y:.18,width:.36,height:.48},
   segmentHint:{categories:['Tops','Outerwear'],types:[],layerRole:'inner',sourceLabel:'Upper garment',clipped:false}};
  const jacket={...base,outfitSourceId:'batch-two',
   recognitionPhoto:{image:original},segmentHint:{...base.segmentHint,layerRole:'outer'},
   cropBounds:{x:.08,y:.14,width:.45,height:.54}};
  const exact={...base,outfitSourceId:'batch-three'};
  const unrelated={...base,outfitSourceId:'batch-four',
   cropBounds:{x:.61,y:.2,width:.3,height:.35},
   recognitionPhoto:{image:original}};
  const results=[
   candidate(display,base),
   candidate(display,jacket),
   candidate(display,unrelated),
   candidate(display,exact)
  ];
  switchView('review');render();
  return {results,selected:batch.filter(x=>x.outfitSourceId).map(x=>({
   group:x.outfitSourceId,sourceSame:x.originalPhoto?.image===original,
   sourceCropSame:x.recognitionPhoto?.image===original,
   displaySame:x.image===display,role:x.segmentHint?.layerRole,
   bounds:x.cropBounds})),
   persisted:items.filter(x=>x.outfitSourceId).length,
   resultCards:document.querySelectorAll('#review .photo-result').length};
 });
 assert.deepEqual(check.results,[true,true,true,false],
  'source group changes must not erase layers; identical same-region repeat must be suppressed');
 assert.equal(check.selected.length,3);
 assert.equal(check.persisted,0,'no unreviewed crop saved to wardrobe');
 assert.ok(check.selected.every(x=>x.sourceSame&&x.sourceCropSame&&x.displaySame));
 assert.equal(new Set(check.selected.map(x=>x.group)).size,3);
 assert.equal(new Set(check.selected.map(x=>x.role)).size,2);
 assert.ok(check.resultCards>=3,'all source-distinct candidates remain visible in review');
 assert.deepEqual(errors,[]);
 console.log('SOURCE_DUPLICATE_MOBILE '+JSON.stringify({
  result:'passed',viewport:'390x844 touch',syntheticScene:true,
  originalPreserved:true,separateGarmentsKept:3,verifiedRepeatSkipped:1,
  automaticSaves:0,pageErrors:0,actualModelTested:false,physicalPhoneTested:false
 }));
 await context.close();
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
