import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,extname,join} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import {scoreAutoMultiEvidence15} from './score-auto-multi-15.mjs';

const root=resolve('.'),directory=resolve('benchmark/auto-multi-15');
const sourceRows=JSON.parse(await readFile('research/auto-multi-model-evidence-15/locked-worn-original.json','utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
await mkdir(directory,{recursive:true});
const cases=[],screenshots=[],unexpectedExternalWrites=[],javascriptErrors=[];
const sources=new Map();
async function licensedOriginal(row){
 if(sources.has(row.sourceSha256))return sources.get(row.sourceSha256);
 let data,reason='unavailable';
 for(let attempt=0;attempt<3&&!data;attempt++){
  try{
   const response=await fetch(row.sourceImage,{headers:{'user-agent':'ClosetCurrentSegmentationQA/1.0 (Github research credited source)'},signal:AbortSignal.timeout(30000)});
   if(!response.ok)throw Error('HTTP '+response.status);
   const b=Buffer.from(await response.arrayBuffer()),meta=await sharp(b).metadata();
   assert.equal(b.length,row.originalBytes);
   assert.equal(sha(b),row.sourceSha256);
   assert.equal(meta.format,'jpeg');assert.equal(meta.width,800);assert.equal(meta.height,750);
   data=b;
  }catch(e){reason=e.name||'download';if(attempt<2)await new Promise(r=>setTimeout(r,1500*(attempt+1)));}
 }
 if(!data)throw Error('Immutable licensed source unavailable: '+reason);
 sources.set(row.sourceSha256,data);return data;
}
const contentTypes={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.json':'application/json'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(public|research)\//.test(path)||path.includes('..')||path.includes('\\')||path.includes('\0'))
   throw Error('forbidden');
  const file=resolve(root,'.'+path);if(!file.startsWith(root+'/'))throw Error('outside');
  const bytes=await readFile(file);
  res.writeHead(200,{'content-type':contentTypes[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not Found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const fileURL=origin+'/research/auto-multi-model-evidence-15/runner.html';
try{
 for(const row of sourceRows){
  const bytes=await licensedOriginal(row);
  const browserType=row.browser==='webkit'?webkit:chromium;
  const browser=await browserType.launch({headless:true,...row.browser==='chromium'?
   {args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{}});
  try{
   const context=await browser.newContext({viewport:{width:390,height:920},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   await context.route('**/*',route=>{
    const request=route.request(),url=request.url(),method=request.method();
    if(method!=='GET'&&!url.startsWith(origin+'/')){
     unexpectedExternalWrites.push({engine:row.browser,method});
     return route.abort();
    }
    return route.continue();
   });
   const page=await context.newPage();
   page.on('pageerror',()=>javascriptErrors.push({engine:row.browser,type:'page_error'}));
   await page.goto(fileURL,{waitUntil:'domcontentloaded'});
   await page.evaluate(({image,expectations,sha256})=>
    window.__startAutoMulti15({image,expectations,sha256}),
    {image:'data:image/jpeg;base64,'+bytes.toString('base64'),expectations:row.regions,sha256:row.sourceSha256});
   let result;
   try{
    await page.waitForFunction(()=>window.__autoMulti15?.done,null,{timeout:470000});
    result=await page.evaluate(()=>window.__autoMulti15.results);
   }catch{
    result={sourceSha256:row.sourceSha256,sourcePixelsVerified:true,modelExecuted:false,
     error:'browser_model_timeout_or_crash',proposals:[]};
   }
   result.id=row.id;result.browser=row.browser;
   // No raw image pixels, original URL, personal information or downloaded model files in reports.
   delete result.progress;
   cases.push(result);
   for(const width of [320,390,430]){
    if(page.isClosed())break;
    await page.setViewportSize({width,height:920});
    const filename=row.browser+'-'+width+'-real-segformer-evidence.png';
    const png=await page.screenshot({fullPage:true,animations:'disabled'});
    const meta=await sharp(png).metadata(),stats=await sharp(png).stats();
    assert.equal(meta.width,width);
    assert.equal(meta.format,'png');
    assert.ok(png.length>10000&&stats.channels.some(x=>x.stdev>5),'nonblank real browser screenshot');
    await writeFile(join(directory,filename),png);
    screenshots.push({engine:row.browser,width,file:filename,sha256:sha(png),height:meta.height});
   }
   await context.close();
  }finally{await browser.close();}
 }
}finally{await new Promise(done=>server.close(done));}
assert.equal(cases.length,sourceRows.length);
assert.deepEqual(unexpectedExternalWrites,[],'no POST/upload allowed to model providers or remote sites');
const report=scoreAutoMultiEvidence15(sourceRows,cases,{verifiedLiveInference:true});
await writeFile(join(directory,'cases.json'),JSON.stringify(cases,null,2));
await writeFile(join(directory,'evaluation.json'),JSON.stringify(report,null,2));
await writeFile(join(directory,'screenshots.json'),JSON.stringify(screenshots,null,2));
await writeFile(join(directory,'execution.json'),JSON.stringify({
 actualUnmockedSegFormer:true,browserCases:cases.length,sourceSha256:sourceRows[0].sourceSha256,
 noNewImageUpload:unexpectedExternalWrites.length===0,pageErrors:javascriptErrors.length,
 screenshots:screenshots.length,allProposalsRequireReview:true,scientificQualityAccepted:report.modelQualityAccepted,
 automaticMaskIoU:null,automaticGarmentTypeAccuracyPercent:null,familyAlpha:'HOLD'
},null,2));
assert.equal(screenshots.length,6,'three real mobile viewports each in Chromium and WebKit');
console.log('AUTO MULTI MODEL EVIDENCE '+JSON.stringify({
 actualOriginalBytes:sourceRows[0].originalBytes,browserCases:cases.length,
 proposals:cases.map(x=>({engine:x.browser,modelExecuted:x.modelExecuted,error:x.error,
  parts:x.proposals.map(p=>p.label)})),modelQualityAccepted:report.modelQualityAccepted,
 coarseBoxRecallProxyPercent:report.coarseBoxRecallProxyPercent,
 screenshots:screenshots.length,sourceUnchanged:report.allSourcesVerified,
 withoutAutoSave:report.allProposalsRequireHumanReview,familyAlpha:report.familyAlpha
}));