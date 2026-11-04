// Browser-backed genuine SegFormer inference. Never mock, upload, or store
// originals in artifacts; only licensed public screenshot previews + box JSON.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname,join} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
const sources=JSON.parse(await readFile('research/auto-multi-diversity-16/provisional-15-locked.json','utf8'));
const slice=Number(process.env.AUTO_MULTI_16_SLICE);
if(!Number.isInteger(slice)||slice<0||slice>4||sources.length!==15)throw Error('invalid original source slice');
const selected=sources.slice(slice*3,slice*3+3),out=resolve('benchmark/auto-multi-16/slice-'+slice);
await mkdir(out,{recursive:true});
const sha=(bytes,algorithm='sha256')=>createHash(algorithm).update(bytes).digest('hex');
const delay=ms=>new Promise(done=>setTimeout(done,ms));
const originals=new Map(),errors=[],writes=[];
for(const row of selected){
 const file=row.file.replaceAll(' ','_').normalize('NFC'),md5=sha(Buffer.from(file),'md5');
 const uri='https://upload.wikimedia.org/wikipedia/commons/'+md5[0]+'/'+md5.slice(0,2)+'/'+encodeURIComponent(file);
 let bytes,lastError='source_unavailable';
 for(let attempt=0;attempt<5&&!bytes;attempt++){
  try{
   const response=await fetch(uri,{headers:{'user-agent':'ClosetCurrentOriginalSegFormerResearch/1.0 (Wikimedia Commons credited images)'},signal:AbortSignal.timeout(45000)});
   if(!response.ok)throw Error('HTTP '+response.status);
   const source=Buffer.from(await response.arrayBuffer()),m=await sharp(source).metadata();
   assert.equal(sha(source),row.sourceSha256,'tampered original photograph');
   assert.equal(source.length,row.originalBytes);
   assert.equal(m.format,'jpeg');assert.equal(m.width,row.width);assert.equal(m.height,row.height);
   bytes=source;
  }catch(error){lastError=String(error.message||error).slice(0,110);if(attempt<4)await delay((attempt+1)*6000);}
 }
 if(!bytes)throw Error('Cannot verify immutable source '+row.id+' '+lastError);
 originals.set(row.id,bytes);await delay(1700);
}
const root=resolve('.');
const contentType={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.bin':'application/octet-stream'};
const server=createServer(async(req,res)=>{try{
 const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(!/^\/(public|research)\//.test(path)||path.includes('..')||path.includes('\\')||path.includes('\0'))throw Error('Denied path');
 const location=resolve(root,'.'+path);if(!location.startsWith(root+'/'))throw Error('Denied root');
 res.writeHead(200,{'content-type':contentType[extname(location)]||'application/octet-stream','cache-control':'no-store'});
 res.end(await readFile(location));
}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const records=[],screenshots=[];
try{
 for(const [browserName,browserType] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await browserType.launch({headless:true,...browserName==='chromium'?
   {args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{}});try{
   const context=await browser.newContext({viewport:{width:390,height:860},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   await context.route('**/*',route=>{
    const req=route.request();if(req.method()!=='GET'&&!req.url().startsWith(origin+'/')){
     writes.push({browser:browserName,method:req.method()});return route.abort();
    }
    return route.continue();
   });
   const page=await context.newPage();
   page.on('pageerror',()=>errors.push({browser:browserName,type:'page-error'}));
   await page.goto(origin+'/research/auto-multi-diversity-16/runner-16.html',{waitUntil:'domcontentloaded'});
   for(const [i,row] of selected.entries()){
    const original=originals.get(row.id),originalImage='data:image/jpeg;base64,'+original.toString('base64');
    const meta=await sharp(original).metadata();
    // The unchanged original is shown and retained. Large original JPEGs
    // are decoded only into a model-input copy within worker size limits.
    const derivedInput=meta.width>3072||meta.height>3072||original.length>10000000;
    const modelBytes=derivedInput?await sharp(original).rotate().resize({width:2048,height:2048,fit:'inside'}).jpeg({quality:92}).toBuffer():original;
    assert.ok(modelBytes.length<6000000,'model input must remain within worker cap');
    const inference=await page.evaluate(input=>window.__runPhoto16(input),{
     id:row.id,sequence:slice*10+i+1,sourcePage:row.sourcePage,regions:row.regions,
     originalImage,modelInputImage:'data:image/jpeg;base64,'+modelBytes.toString('base64'),
     attribution:row.author,license:row.license});
    const originalDisplayed=await page.locator('#original').evaluate(el=>el.src.startsWith('data:image/jpeg;base64,'));
    assert.equal(originalDisplayed,true,'must display original before crop');
    records.push({id:row.id+'-'+browserName,originalId:row.id,browser:browserName,
     sourceSha256:row.sourceSha256,originalBytesVerified:true,originalJpegUnchanged:true,
     modelInputDerivedFromOriginal:derivedInput,modelExecuted:inference.modelExecuted,
     error:inference.error||null,baseline:inference.baseline||[],updated:inference.updated||[],
     piecesSentToReview:inference.pieces,maskGroundTruthPresent:false,
     segmentationWidth:inference.segmentationWidth||null,
     segmentationHeight:inference.segmentationHeight||null,personDetected:inference.personDetected||false});
    for(const width of [320,390,430]){
     await page.setViewportSize({width,height:860});
     const png=await page.screenshot({fullPage:true,animations:'disabled'}),
      image=await sharp(png).metadata(),stats=await sharp(png).stats();
     assert.equal(image.width,width);
     assert.ok(png.length>9000&&stats.channels.some(x=>x.stdev>5),'empty or blank mobile screenshot');
     const file=row.id+'-'+browserName+'-'+width+'-real-model.png';
     await writeFile(join(out,file),png);
     screenshots.push({id:row.id,browser:browserName,width,height:image.height,
      file,sha256:sha(png),licensedImage:true});
    }
    console.log('REAL_MULTI16 '+JSON.stringify({id:row.id,browser:browserName,
     originalHash:row.sourceSha256,modelExecuted:inference.modelExecuted,
     baseline:inference.baseline.length,updated:inference.updated.length,
     modelInputDerivedFromOriginal:derivedInput,error:inference.error}));
   }
   await context.close();
  }finally{await browser.close();}
 }
}finally{await new Promise(done=>server.close(done));}
assert.equal(records.length,6);assert.equal(screenshots.length,18);assert.deepEqual(writes,[]);
await writeFile(join(out,'results.json'),JSON.stringify(records,null,2));
await writeFile(join(out,'screenshots.json'),JSON.stringify(screenshots,null,2));
await writeFile(join(out,'execution.json'),JSON.stringify({
 priority:'AUTO-MULTI-DIVERSITY-16',slice,uniqueOriginals:selected.length,
 sha256OriginalsVerified:true,originalsUploaded:false,
 actualSegFormerWithoutMocks:true,modelRuns:records.filter(x=>x.modelExecuted).length,
 modelFailures:records.filter(x=>!x.modelExecuted).length,
 runtimePageErrors:errors.length,unexpectedExternalWrites:writes.length,
 browserScreenshotCount:screenshots.length,sourceReviewMandatory:true,
 humanReviewerVerified:false,trueMaskIoU:null,
 familyAlpha:'HOLD',productionDeployed:false},null,2));
if(records.some(x=>!x.modelExecuted)||errors.length)process.exitCode=1;
