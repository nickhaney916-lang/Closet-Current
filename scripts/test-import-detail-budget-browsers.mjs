// Real mobile Chromium/WebKit JPEG pixels with forced budget pressure.
// The quality selection is tested; these generated photo pixels are NOT human recognition evidence.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const source=fs.readFileSync('public/photo-import.js','utf8'),checks=[];
for(const [label,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(!r.url().startsWith('blob:'))requests.push(r.url());});
  await page.goto('about:blank');await page.addScriptTag({content:source});
  const result=await page.evaluate(async()=>{
   const originalCanvas=document.createElement('canvas');
   originalCanvas.width=3600;originalCanvas.height=2700;
   const origCtx=originalCanvas.getContext('2d');origCtx.fillStyle='#eee';origCtx.fillRect(0,0,3600,2700);
   origCtx.fillStyle='#234a79';origCtx.fillRect(150,130,3300,2400);
   for(let i=0;i<250;i++){origCtx.fillStyle=i%2?'#f7b433':'#151d2e';origCtx.fillRect(150+i*12,150,5,2350);}
   const blob=await new Promise(resolve=>originalCanvas.toBlob(resolve,'image/jpeg',.94));
   const original=new File([blob],'synthetic-high-detail.JPG',{type:''});
   const attempts=[];
   const native=HTMLCanvasElement.prototype.toDataURL;
   HTMLCanvasElement.prototype.toDataURL=function(format,q){
    if(format==='image/jpeg'&&this.width===3072){
     attempts.push({width:this.width,height:this.height,quality:q});
     if(q>.88)return 'X'.repeat(2850001);
    }
    return native.call(this,format,q);
   };
   try{
    const processed=await photoToJPEG(original),converted=new Image();
    converted.src=processed;await converted.decode();
    return {attempts,width:converted.naturalWidth,height:converted.naturalHeight,length:processed.length,
     jpeg:processed.startsWith('data:image/jpeg;base64,'),sourceBytes:original.size};
   }finally{HTMLCanvasElement.prototype.toDataURL=native;}
  });
  assert.deepEqual(result.attempts,[{width:3072,height:2304,quality:.94},{width:3072,height:2304,quality:.88}],
   'Quality ladder must preserve 3072px before falling back to smaller pixels');
  assert.deepEqual([result.width,result.height],[3072,2304]);
  assert.ok(result.length<=2850000);
  assert.equal(result.jpeg,true);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  checks.push({engine:label,sourceFormat:'synthetic-original-jpeg',fullFrame:true,sameSizeQualityFallback:true,
   outputDimensions:[result.width,result.height],boundedExport:true,remoteRequests:0,realPhoneTested:false});
  console.log(label+': quality .94 exceeded budget, .88 retained native-limit 3072px JPEG; no network, no garment labels.');
 }finally{await browser.close();}
}
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify({state:'TECHNICAL_ONLY',humanAccuracy:null,
 productionPromotion:'BLOCKED',browsers:checks},null,2)+'\n');
