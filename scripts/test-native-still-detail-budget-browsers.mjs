// Native ImageCapture still-frame emulator with genuine JPEG bytes and forced size-pressure.
 // Browser emulation is NOT physical Android or iPhone camera/human garment evidence.
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=fs.readFileSync('public/app.js','utf8');
const still=app.slice(app.indexOf('function snap('),app.indexOf('function beep('));
const results=[];
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(!r.url().startsWith('blob:'))requests.push(r.url());});
  await page.goto('about:blank');
  await page.addScriptTag({content:'const canvas=document.createElement("canvas");\n'+still});
  const r=await page.evaluate(async()=>{
   const sensor=document.createElement('canvas');sensor.width=4000;sensor.height=3000;
   const ctx=sensor.getContext('2d');ctx.fillStyle='#eee';ctx.fillRect(0,0,4000,3000);
   ctx.fillStyle='#227abe';ctx.fillRect(180,160,3600,2700);
   for(let x=200;x<3800;x+=24){ctx.fillStyle='#ffe9d7';ctx.fillRect(x,200,5,2400);}
   const blob=await new Promise(resolve=>sensor.toBlob(resolve,'image/jpeg',.98));
   const original=canvas.toDataURL.bind(canvas);
   const attempts=[];
   canvas.toDataURL=function(mime,quality){
    attempts.push([this.width,this.height,quality]);
    if(this.width===3072&&quality===.94)return 'x'.repeat(2850001);
    return original(mime,quality);
   };
   const jpeg=await captureCameraStill({},class{async takePhoto(){return blob;}});
   const out=await createImageBitmap(await (await fetch(jpeg)).blob());
   const sameSize={width:out.width,height:out.height,length:jpeg.length,attempts:attempts.slice()};
   out.close();attempts.length=0;
   canvas.toDataURL=function(mime,quality){
    attempts.push([this.width,this.height,quality]);
    if(this.width>=3072)return 'x'.repeat(2850001);
    return original(mime,quality);
   };
   const second=await captureCameraStill({},class{async takePhoto(){return blob;}});
   const drop=await createImageBitmap(await (await fetch(second)).blob());
   const fallback={width:drop.width,height:drop.height,length:second.length,attempts:attempts.slice()};
   drop.close();canvas.toDataURL=original;
   return {sameSize,fallback};
  });
  assert.deepEqual(r.sameSize.attempts,[[3072,2304,.94],[3072,2304,.88]]);
  assert.deepEqual([r.sameSize.width,r.sameSize.height],[3072,2304]);
  assert.ok(r.sameSize.length<=2850000);
  assert.deepEqual(r.fallback.attempts.slice(0,4),[[3072,2304,.94],[3072,2304,.88],[3072,2304,.82],[2560,1920,.94]]);
  assert.deepEqual([r.fallback.width,r.fallback.height],[2560,1920]);
  assert.ok(r.fallback.length<=2850000);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  results.push({browser:name,syntheticOriginal:true,preservedFullFrame:true,
   sameSizeCompressed:[r.sameSize.width,r.sameSize.height],downscaleAfterQualityExhaustion:[r.fallback.width,r.fallback.height],
   jpegBounded:true,phoneHardwareTested:false,networkUploads:0});
  await context.close();
 }finally{await browser.close();}
}
console.log(JSON.stringify({status:'TECHNICAL_QA_ONLY',humanReviewCount:0,humanAccuracy:null,
 productionPromotion:'BLOCKED',browsers:results}));
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify({status:'TECHNICAL_QA_ONLY',browsers:results,
 realHumanReviews:0,physicalPhones:0,accuracy:null,productionPromotion:'BLOCKED'},null,2)+'\n');
