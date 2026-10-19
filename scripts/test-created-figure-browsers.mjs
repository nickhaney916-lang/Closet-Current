// Locally rendered candidate browser diagnostics, never real-phone or art approval.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs/promises';import assert from 'node:assert/strict';
import {sha,sampling} from '../benchmark/figure-readiness/production-figure-metrics.mjs';
import {selectFigureAssetTier} from '../benchmark/figure-creation/responsive-asset-policy.mjs';
const packet=JSON.parse(await fs.readFile('artifacts/figure-creation/results.json','utf8'));
const evidence={figures:packet.figures.map(f=>({id:f.id,previewPath:'artifacts/figure-creation/delivery/'+f.id+'-master.png',previewSha256:f.variants.master.sha256,variants:f.variants}))};
const policy=JSON.parse(await fs.readFile('benchmark/figure-readiness/production-policy.json','utf8'));
const css=(await fs.readFile('public/style.css','utf8')).replace(/@import[^;]+;/g,'');
const files={};for(const a of evidence.figures){
 const b=await fs.readFile(a.previewPath);assert.equal(sha(b),a.previewSha256);
 files['/'+a.id+'.png']=b;
 for(const [tier,filename] of [
  ['phone1x','-phone-647.webp'],['mobile','-mobile.webp'],
  ['tablet2x','-tablet-1294.webp']]){
  const body=await fs.readFile('artifacts/figure-creation/delivery/'+a.id+filename);
  assert.equal(sha(body),a.variants[tier].sha256);
  files['/'+a.id+filename]=body;
 }
}
let writes=0;
const server=createServer((req,res)=>{
 if(req.method!=='GET'){writes++;res.writeHead(405);return res.end();}
 if(files[req.url]){res.writeHead(200,{'Content-Type':req.url.endsWith('.webp')?'image/webp':'image/png','Cache-Control':'public,max-age=86400,immutable'});return res.end(files[req.url]);}
 if(req.url==='/'){
  res.writeHead(200,{'Content-Type':'text/html'});return res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style><div id="fixture" style="width:270px"><div id="stage" class="reusable-figure-stage"><img id="reusableFigureBase" alt="Same reusable figure"></div></div>');
 }
 res.writeHead(404);res.end();
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port,rows=[];let external=0;
await fs.mkdir('artifacts/figure-creation/browser',{recursive:true});
try{
 for(const [engine,type,isMobile]of [['Android Chromium emulation',chromium,true],['iPhone WebKit emulation',webkit,true]]){
  const browser=await type.launch({headless:true,...(type===chromium?{args:['--no-sandbox']}: {})});
  try{
   for(const dpr of [1,2,3]){
    const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:dpr,isMobile,hasTouch:true,serviceWorkers:'block'});
    await ctx.route('**/*',r=>{if(!r.request().url().startsWith(origin+'/')){external++;return r.abort();}return r.continue();});
    const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin);
    for(const asset of evidence.figures)for(const zoom of [1,2]){
     const actual=await page.evaluate(async({id,zoom})=>{
      const image=document.getElementById('reusableFigureBase'),stage=document.getElementById('stage');
      document.getElementById('fixture').style.zoom=String(zoom);image.src='/'+id+'.png';await image.decode();
      const b=image.getBoundingClientRect(),s=stage.getBoundingClientRect(),canvas=document.createElement('canvas');
      canvas.width=64;canvas.height=128;const x=canvas.getContext('2d');x.drawImage(image,0,0,64,128);
      const data=x.getImageData(0,0,canvas.width,canvas.height).data;let opaque=0,nonWhite=0;
      for(let i=0;i<data.length;i+=4){opaque+=+(data[i+3]===255);nonWhite+=+(data[i]<240||data[i+1]<240||data[i+2]<240);}
      return {naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,width:b.width,height:b.height,stageWidth:s.width,stageHeight:s.height,objectFit:getComputedStyle(image).objectFit,opaquePixels:opaque,nonWhitePixels:nonWhite,dpr:devicePixelRatio};
     },{id:asset.id,zoom});
     assert.equal(actual.naturalWidth,1941);assert.equal(actual.naturalHeight,3597);assert.equal(actual.dpr,dpr);
     assert.ok(Math.abs(actual.width-270*zoom)<1);assert.ok(Math.abs(actual.width/actual.height-647/1199)<.002);
     assert.ok(Math.abs(actual.stageWidth-actual.width)<1&&Math.abs(actual.stageHeight-actual.height)<1);
     assert.ok(actual.nonWhitePixels>500);assert.ok(actual.opaquePixels>1000&&actual.opaquePixels<64*128);assert.equal(actual.objectFit,'fill');
     const sample=sampling(1941,3597,{cssWidth:actual.width/zoom,dpr,cssZoom:zoom},policy.canonicalStage);
     assert.equal(sample.nativeSamplingSufficient,true,'Preferred native render covers all tested sampling cases');
     // Preserve a known native-master baseline. Then switch this same
     // calibrated figure to the smallest lossless candidate that covers the
     // device's actual display pixels with no canvas RGB/alpha reconstruction.
     const chosen=selectFigureAssetTier(actual.width/zoom,dpr,zoom);
     const source=chosen.name==='master'?'/'+asset.id+'.png':
      '/'+asset.id+chosen.suffix;
     const shown=await page.evaluate(async({src})=>{
       const img=document.getElementById('reusableFigureBase');
       img.src=src;await img.decode();
       const b=img.getBoundingClientRect();
       return {naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,
         cssWidth:b.width,cssHeight:b.height};
     },{src:source});
     assert.equal(shown.naturalWidth,chosen.width);
     assert.equal(shown.naturalHeight,chosen.width===1941?3597:chosen.width===1294?2398:
      chosen.width===970?1798:1199);
     assert.ok(Math.abs(shown.cssWidth-actual.width)<.6);
     assert.ok(Math.abs(shown.cssHeight-actual.height)<.6);
     assert.equal(chosen.nativeSamplingSufficient,true);
     const bytes=chosen.name==='master'?asset.variants.master.bytes:asset.variants[chosen.name].bytes;
     assert.ok(bytes<=asset.variants.master.bytes,'responsive image must never exceed original master bytes');
     rows.push({engine,id:asset.id,assetSha256:asset.previewSha256,cssZoom:zoom,...actual,sampling:sample,
       selectedTier:chosen.name,selectedBytes:bytes,masterBytes:asset.variants.master.bytes,
       nativeSamplingSelectedPassed:true,decodeAndGeometryPassed:true,nativeSamplingPassed:true,
       anatomyOrPhotorealismApproved:false});
     await page.locator('#stage').screenshot({path:`artifacts/figure-creation/browser/${type===chromium?'android':'iphone'}-${asset.id}-dpr${dpr}-csszoom${zoom}.png`});
    }
    assert.deepEqual(errors,[]);await ctx.close();
   }
  }finally{await browser.close();}
 }
 assert.equal(writes,0);assert.equal(external,0);
 const totalResponsiveBytes=rows.reduce((n,r)=>n+r.selectedBytes,0);
 const totalBaselineBytes=rows.reduce((n,r)=>n+r.masterBytes,0);
 assert.ok(totalResponsiveBytes<totalBaselineBytes);
 const report={schemaVersion:1,evidence:'newly-rendered-two-asset-browser-fixture-using-app-stage-css-not-full-product-or-hardware',
  browserVersions:{chromium:chromium.executablePath().split('/').slice(-3,-1).join('/'),webkit:webkit.executablePath().split('/').slice(-3,-1).join('/')},
  summary:{cases:rows.length,decodeGeometryPasses:rows.length,nativeSamplingPasses:rows.length,responsiveTierPasses:rows.length,selectedTierBytes:totalResponsiveBytes,masterOnlyBytes:totalBaselineBytes,byteSavingsFraction:1-totalResponsiveBytes/totalBaselineBytes,externalRequests:external,postRequests:writes,physicalPhones:0,visualQualityApprovals:0},rows};
 await fs.writeFile('artifacts/figure-creation/browser/results.json',JSON.stringify(report,null,2)+'\n');
 console.log('CREATED_FIGURE_EMULATION '+JSON.stringify(report.summary));
}finally{await new Promise(r=>server.close(r));}
