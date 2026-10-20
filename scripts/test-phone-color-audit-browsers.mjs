// Private phone-photo color-audit UI: *mock recognition* in two independent
// browser engines. A real licensed-photo FashionCLIP Chromium job separately
// runs scripts/run-phone-photo-check.mjs; this deterministic test proves
// label locking, original source photo JPEG import, privacy and error recovery.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
const root=resolve('dist'),mime={'.html':'text/html','.js':'text/javascript',
 '.mjs':'text/javascript','.json':'application/json','.css':'text/css'};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://127.0.0.1');
  const file=resolve(root,'.'+(u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname)));
  if(!file.startsWith(root+'/'))throw Error('Outside app');
  const bytes=await readFile(file);
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const results=[];
try{
 for(const [label,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await engine.launch({headless:true,...(label==='Chromium'?{args:['--no-sandbox']}: {})});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},
    isMobile:true,hasTouch:true,deviceScaleFactor:3,acceptDownloads:true,serviceWorkers:'block'});
   await context.addInitScript(()=>{
    class LocalWorkerMock{
     constructor(){this.count=0;this.terminated=false;}
     postMessage(request){
      if(this.terminated)return;
      const send=data=>setTimeout(()=>{if(!this.terminated)this.onmessage?.({data});},12);
      if(request.type==='load'){send({type:'ready',id:request.id});return;}
      if(request.type==='classify'){
       const n=++this.count;
       send({type:'result',id:request.id,strong:true,categoryConfirmed:false,
        choices:[n===1?{category:'Tops',itemType:'T-shirt'}:
         {category:'Dresses',itemType:'Casual dress'}],
        details:{color:n===1?'Blue':'White'}});
      }
     }
     terminate(){this.terminated=true;}
    }
    window.Worker=LocalWorkerMock;
   });
   const page=await context.newPage(),errors=[],remote=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:')&&!r.url().startsWith('blob:')&&!r.url().startsWith('data:'))remote.push(r.url());});
   await page.goto('http://127.0.0.1:'+server.address().port+'/phone-photo-check.html');
   const b64=await page.evaluate(()=>{
    const can=document.createElement('canvas');can.width=128;can.height=128;
    const cx=can.getContext('2d');cx.fillStyle='#ffffff';cx.fillRect(0,0,128,128);
    cx.fillStyle='#3057ad';cx.fillRect(35,16,60,105);
    return can.toDataURL('image/jpeg',.95).split(',')[1];
   });
   const jpg=Buffer.from(b64,'base64');
   await page.locator('#photos').setInputFiles([
    {name:'NEVER_EXPOSE_BLUE.jpg',mimeType:'image/jpeg',buffer:jpg},
    {name:'NEVER_EXPOSE_RED.jpg',mimeType:'image/jpeg',buffer:jpg}
   ]);
   await page.locator('#category-0').selectOption('Tops');
   await page.locator('#type-0').selectOption('T-shirt');
   await page.locator('#color-0').selectOption('Blue');
   await page.locator('#category-1').selectOption('Dresses');
   await page.locator('#type-1').selectOption('Casual dress');
   await page.locator('#color-1').selectOption('Red');
   assert.equal(await page.locator('#color-0').isEnabled(),true);
   await page.locator('#run').click();
   assert.equal(await page.locator('#color-0').isDisabled(),true);
   assert.equal(await page.locator('#color-1').isDisabled(),true);
   await page.locator('#download').waitFor({state:'visible',timeout:30000});
   assert.match(await page.locator('#summary').innerText(),/Model suggested 1 matching colors out of 2/);
   const downloadEvent=page.waitForEvent('download');
   await page.locator('#download').click();
   const dl=await downloadEvent;
   const target=resolve('artifacts/phone-color-audit/'+label.toLowerCase()+'.json');
   await mkdir(resolve('artifacts/phone-color-audit'),{recursive:true});
   await dl.saveAs(target);
   const raw=await readFile(target,'utf8'),report=JSON.parse(raw);
   assert.equal(report.version,1);
   assert.equal(report.summary.colorsLabeled,2);
   assert.equal(report.summary.modelColorMatches,1);
   assert.equal(report.summary.modelColorWrong,1);
   assert.equal(report.summary.modelColorMissing,0);
   assert.equal(report.photos[0].expectedColor,'Blue');
   assert.equal(report.photos[0].prediction.color,'Blue');
   assert.equal(report.photos[1].expectedColor,'Red');
   assert.equal(report.photos[1].prediction.color,'White');
   assert.equal(report.summary.strongCategoryColorMismatches,1);
   assert.ok(!raw.includes('NEVER_EXPOSE_'));
   assert.ok(!raw.includes('data:image'));
   assert.equal(report.productionSavedColorValidated,undefined);
   await page.locator('#restart').click();
   assert.equal(await page.locator('#download').isVisible(),false);
   assert.equal(await page.locator('.photo').count(),0);
   await page.locator('#photos').setInputFiles({
    name:'NEVER_EXPOSE_RECOVERY.jpg',mimeType:'image/jpeg',buffer:jpg
   });
   await page.locator('#category-0').selectOption('Uncategorized');
   assert.equal(await page.locator('#color-0').isDisabled(),true);
   assert.equal(await page.locator('#color-0').inputValue(),'');
   assert.deepEqual(remote,[]);assert.deepEqual(errors,[]);
   results.push({browser:label,viewport:'390x844',colorLabelLocked:true,
    modelColorDiagnosticMatches:1,modelColorDiagnosticWrong:1,
    originalJpegConvertedInBrowser:true,privateFilenameExported:false,
    restartRevokesPriorReport:true,negativeColorControlDisabled:true,
    pageErrors:0,remoteRequests:0,realModelInference:false,physicalPhoneTested:false});
   await context.close();
  }finally{await browser.close();}
 }
 console.log('PRIVATE_PHONE_COLOR_AUDIT '+JSON.stringify(results));
}finally{await new Promise(done=>server.close(done));}
