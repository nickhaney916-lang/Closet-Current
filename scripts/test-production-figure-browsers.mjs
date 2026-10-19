// Local asset rendering diagnostics, NOT photorealistic approval or real phones.
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs/promises';import assert from 'node:assert/strict';
import {sha,sampling} from '../benchmark/figure-readiness/production-figure-metrics.mjs';
const evidence=JSON.parse(await fs.readFile('benchmark/figure-readiness/production-evidence.json','utf8'));
const policy=JSON.parse(await fs.readFile('benchmark/figure-readiness/production-policy.json','utf8'));
const css=(await fs.readFile('public/style.css','utf8')).replace(/@import[^;]+;/g,'');
const files={};for(const a of evidence.figures){const b=await fs.readFile(a.previewPath);assert.equal(sha(b),a.previewSha256);files['/'+a.id+'.webp']=b;}
let writes=0;
const server=createServer((req,res)=>{
 if(req.method!=='GET'){writes++;res.writeHead(405);return res.end();}
 if(files[req.url]){res.writeHead(200,{'Content-Type':'image/webp'});return res.end(files[req.url]);}
 if(req.url==='/'){
  res.writeHead(200,{'Content-Type':'text/html'});return res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style><div id="fixture" style="width:270px"><div id="stage" class="reusable-figure-stage"><img id="reusableFigureBase" alt="Same reusable figure"></div></div>');
 }
 res.writeHead(404);res.end();
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port,rows=[];let external=0;
await fs.mkdir('artifacts/production-figure-browsers',{recursive:true});
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
      document.getElementById('fixture').style.zoom=String(zoom);image.src='/'+id+'.webp';await image.decode();
      const b=image.getBoundingClientRect(),s=stage.getBoundingClientRect(),canvas=document.createElement('canvas');
      canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const x=canvas.getContext('2d');x.drawImage(image,0,0);
      const data=x.getImageData(0,0,canvas.width,canvas.height).data;let opaque=0,nonWhite=0;
      for(let i=0;i<data.length;i+=4){opaque+=+(data[i+3]===255);nonWhite+=+(data[i]<240||data[i+1]<240||data[i+2]<240);}
      return {naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,width:b.width,height:b.height,stageWidth:s.width,stageHeight:s.height,objectFit:getComputedStyle(image).objectFit,opaquePixels:opaque,nonWhitePixels:nonWhite,dpr:devicePixelRatio};
     },{id:asset.id,zoom});
     assert.equal(actual.naturalWidth,160);assert.equal(actual.naturalHeight,297);assert.equal(actual.dpr,dpr);
     assert.ok(Math.abs(actual.width-270*zoom)<1);assert.ok(Math.abs(actual.width/actual.height-647/1199)<.002);
     assert.ok(Math.abs(actual.stageWidth-actual.width)<1&&Math.abs(actual.stageHeight-actual.height)<1);
     assert.ok(actual.nonWhitePixels>1000);assert.equal(actual.opaquePixels,160*297);assert.equal(actual.objectFit,'fill');
     const sample=sampling(160,297,{cssWidth:actual.width/zoom,dpr,cssZoom:zoom},policy.canonicalStage);
     assert.equal(sample.nativeSamplingSufficient,false,'Current preview is undersampled even at DPR1');
     rows.push({engine,id:asset.id,assetSha256:asset.previewSha256,cssZoom:zoom,...actual,sampling:sample,decodeAndGeometryPassed:true,nativeDetailPassed:false,anatomyOrPhotorealismApproved:false});
     await page.locator('#stage').screenshot({path:`artifacts/production-figure-browsers/${type===chromium?'android':'iphone'}-${asset.id}-dpr${dpr}-csszoom${zoom}.png`});
    }
    assert.deepEqual(errors,[]);await ctx.close();
   }
  }finally{await browser.close();}
 }
 assert.equal(writes,0);assert.equal(external,0);
 const report={schemaVersion:1,evidence:'controlled-two-asset-browser-fixture-using-app-stage-css-not-full-product-or-hardware',
  browserVersions:{chromium:chromium.executablePath().split('/').slice(-3,-1).join('/'),webkit:webkit.executablePath().split('/').slice(-3,-1).join('/')},
  summary:{cases:rows.length,decodeGeometryPasses:rows.length,nativeSamplingPasses:0,externalRequests:external,postRequests:writes,physicalPhones:0,visualQualityApprovals:0},rows};
 await fs.writeFile('artifacts/production-figure-browsers/results.json',JSON.stringify(report,null,2)+'\n');
 console.log('FIGURE_ASSET_EMULATION '+JSON.stringify(report.summary));
}finally{await new Promise(r=>server.close(r));}
