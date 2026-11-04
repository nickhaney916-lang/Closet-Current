import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';

const out=resolve('benchmark/source-preserving-multi-resolution-27');
await mkdir(out,{recursive:true});
const app=await readFile('public/outfit-capture.js','utf8');
const begin=app.indexOf('async function boundedOutfitAnalysisJPEG27(');
const end=app.indexOf('function startOutfitSplit(',begin);
assert.ok(begin>=0&&end>begin,'actual app helper missing');
const helper=app.slice(begin,end);
const width=4032,height=3024;
const drawing=Buffer.from(
 '<svg width="4032" height="3024" xmlns="http://www.w3.org/2000/svg">'+
 '<rect width="4032" height="3024" fill="#c6c6c6"/>'+
 '<path d="M1000 450 L1500 200 L2300 200 L2850 450 L2700 1100 L2500 1000 L2500 1500 L1500 1500 L1500 1000 L1300 1100Z" fill="#ac2525" stroke="#222" stroke-width="30"/>'+
 '<path d="M1600 1530 L2400 1530 L2500 2700 L2150 2700 L2000 1910 L1850 2700 L1500 2700 Z" fill="#234e8c" stroke="#222" stroke-width="35"/>'+
 '</svg>'
);
const bytes=await sharp({create:{width,height,channels:3,background:'#c6c6c6'}})
 .composite([{input:drawing}]).jpeg({quality:93}).toBuffer();
const original='data:image/jpeg;base64,'+bytes.toString('base64');
const originalSHA=createHash('sha256').update(bytes).digest('hex');
const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+
 'body{font:14px system-ui;margin:12px;background:#fafafa;color:#222}main{max-width:540px;margin:auto}'+
 'img{display:block;max-width:100%;max-height:360px;object-fit:contain;background:#ddd;border:1px solid #aaa}'+
 '.row{display:flex;flex-direction:column;gap:12px}.status{padding:8px;border:1px solid #ddd}</style></head>'+
 '<body><main><h1>Original-photo preservation — research</h1>'+
 '<p class="status" id="status">Analysis input not generated yet.</p>'+
 '<div class="row"><section><h2>Unchanged original JPEG</h2><img id="original" alt="Synthetic red shirt and blue pants original"></section>'+
 '<section><h2>Derived model-only JPEG</h2><img id="model" alt="Bounded synthetic model input"></section></div>'+
 '<p>Local synthetic image only. No external uploads, account access, or 3D fitting.</p></main></body></html>';
const writes=[],runtimeErrors=[],sha256=x=>createHash('sha256').update(x).digest('hex');
const server=createServer((req,res)=>{
 if(req.method!=='GET'||req.url!=='/'){res.writeHead(404).end();return;}
 res.writeHead(200,{'content-type':'text/html'});res.end(html);
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const cases=[];
try{
 for(const [engine,launcher] of Object.entries({chromium,webkit})){
  const browser=await launcher.launch();
  try{
   for(const viewportWidth of [320,390,430]){
    const context=await browser.newContext({viewport:{width:viewportWidth,height:850},
     isMobile:true,hasTouch:true,serviceWorkers:'block'});
    await context.route('**/*',route=>{
     const req=route.request();
     if(!req.url().startsWith(origin)||!['GET','HEAD'].includes(req.method())){
      writes.push({engine,viewportWidth,method:req.method()});
      return route.abort();
     }
     return route.continue();
    });
    const page=await context.newPage();
    page.on('pageerror',error=>runtimeErrors.push({engine,viewportWidth,message:error.message.slice(0,180)}));
    await page.goto(origin,{waitUntil:'load'});
    await page.addScriptTag({content:helper});
    const measured=await page.evaluate(async ({original,expectedSHA})=>{
     const sha=async base64=>{
      const b=Uint8Array.from(atob(base64.slice(base64.indexOf(',')+1)),c=>c.charCodeAt(0));
      const digest=await crypto.subtle.digest('SHA-256',b);
      return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
     };
     const before=await sha(original);
     if(before!==expectedSHA)throw Error('Original data URL SHA mismatch before analysis');
     const derived=await boundedOutfitAnalysisJPEG27(original);
     const after=await sha(original);
     if(after!==expectedSHA)throw Error('Original data URL mutated by analysis');
     const image=new Image();image.src=derived;await image.decode();
     const originalImage=new Image();originalImage.src=original;await originalImage.decode();
     document.getElementById('original').src=original;
     document.getElementById('model').src=derived;
     document.getElementById('status').textContent=
      'Original '+originalImage.naturalWidth+'×'+originalImage.naturalHeight+
      ' SHA verified; analysis only '+image.naturalWidth+'×'+image.naturalHeight+
      '. Original retained.';
     return {originalHash:after,originalWidth:originalImage.naturalWidth,
      originalHeight:originalImage.naturalHeight,analysisWidth:image.naturalWidth,
      analysisHeight:image.naturalHeight,analysisWasDifferent:derived!==original,
      sourceKept:true,analysisBytes:Math.floor((derived.length-23)*3/4)};
    },{original,expectedSHA:originalSHA});
    assert.equal(measured.originalHash,originalSHA);
    assert.equal(measured.originalWidth,width);
    assert.equal(measured.originalHeight,height);
    assert.equal(measured.analysisWidth,3072);
    assert.equal(measured.analysisHeight,2304);
    assert.equal(measured.sourceKept,true);
    assert.equal(measured.analysisWasDifferent,true);
    assert.ok(measured.analysisBytes<11500000);
    const filename=engine+'-'+viewportWidth+'.png',file=out+'/'+filename;
    const screenshot=await page.screenshot({path:file,fullPage:true});
    const info=await sharp(screenshot).metadata();
    assert.equal(info.format,'png');assert.equal(info.width,viewportWidth);
    cases.push({engine,width:viewportWidth,filename,sha256:sha256(screenshot),...measured});
    await context.close();
   }
  }finally{await browser.close();}
 }
 assert.equal(writes.length,0,'synthetic original photograph must never upload');
 assert.equal(runtimeErrors.length,0,'no actual browser JS errors');
 assert.equal(cases.length,6);
 const report={priority:'SOURCE-PRESERVING-MULTI-RESOLUTION-27',
  evidence:'Actual derived photo preparation function from public/outfit-capture.js in Chromium and WebKit',
  originalSource:'Locally generated synthetic original JPEG; NOT independently licensed real-photo detection accuracy',
  originalWidth:width,originalHeight:height,originalSHA256:originalSHA,
  originalBytes:bytes.length,caseCount:cases.length,sourceNotReplaced:true,
  externalWrites:writes,scriptErrors:runtimeErrors,cases,
  segmentationQualityMeasured:false,realPhysicalHandset:false,signedCloud:false,
  familyAlpha:'HOLD',deployment:false};
 await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');
 console.log('SOURCE-MULTI-27 REAL CHROMIUM/WEBKIT '+JSON.stringify({
  cases:cases.length,originalSha:originalSHA.slice(0,12),
  originalDimension:width+'x'+height,analysisDimension:'3072x2304',
  writes:0,errors:0,screenshots:cases.length,segmentationQualityMeasured:false,
  FamilyAlpha:'HOLD'}));
}finally{await new Promise(done=>server.close(done));}
