/** Browser proof against exact compiled offline Family Alpha source.
 * Test only synthetic paintings; never use customer photos, no network.
 */
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist-family-alpha-41-original-jpeg-HOLD');
const output='benchmark/family-alpha-original-jpeg-import-HOLD';
await mkdir(output,{recursive:true});
const server=createServer(async (req,res)=>{
 const path=new URL(req.url,'http://127.0.0.1').pathname;
 if(path==='/'){
  res.writeHead(200,{'content-type':'text/html'});
  res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Original JPEG preservation — SYNTHETIC HOLD</title><h1>Original Photograph Integrity</h1><p>SYTHETIC ONLY · no account or user photos · no deployment</p><div id="results"></div><script src="/photo-import.js"></script>');
  return;
 }
 if(path!=='/photo-import.js'){res.writeHead(404);res.end('No external request');return;}
 try{res.writeHead(200,{'content-type':'text/javascript'});res.end(await readFile(join(root,'photo-import.js')));}
 catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port,results=[];
try{
 for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:800},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const external=[],errors=[];
    await context.route('**/*',route=>{
     const url=route.request().url();
     if(url.startsWith(origin+'/')||url.startsWith('blob:')||url.startsWith('data:'))return route.continue();
     external.push(url);return route.abort();
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    try{
     await page.goto(origin+'/');
     const report=await page.evaluate(async()=>{
      const canvas=document.createElement('canvas');canvas.width=2200;canvas.height=1600;
      const c=canvas.getContext('2d');c.fillStyle='#eceff4';c.fillRect(0,0,2200,1600);
      for(let x=0;x<2200;x+=80){c.fillStyle=x%160===0?'#b4d4ef':'#657d9c';c.fillRect(x,0,45,1600);}
      c.fillStyle='#3b273b';c.font='64px system-ui';c.fillText('SYNTHETIC SOURCE JPEG 2200px',25,760);
      const jpegData=canvas.toDataURL('image/jpeg',.92);
      const binary=atob(jpegData.split(',')[1]);
      const bytes=Uint8Array.from(binary,x=>x.charCodeAt(0));
      const file=new File([bytes],'synthetic-shirt.jpg',{type:'image/jpeg'});
      const output=await photoToJPEG(file);
      const preserved=output===jpegData;
      const safeSource=plainOriginalJPEG(bytes);
      if(safeSource&&!preserved)throw Error('Safe JPEG altered during import');
      const restored=new Image();restored.src=output;await restored.decode();
      if(restored.naturalWidth!==2200||restored.naturalHeight!==1600)
       throw Error('Source photograph was silently downscaled');
      // Build a structurally valid APP1 Exif marker; any possible GPS
      // metadata must force a redraw to remove original metadata bytes.
      const gps=new TextEncoder().encode('Exif\0\0GPS-TEST-ONLY');
      const app=new Uint8Array(gps.length+4);app.set([255,225,0,gps.length+2]);app.set(gps,4);
      const modified=new Uint8Array(bytes.length+app.length);
      modified.set(bytes.subarray(0,2));modified.set(app,2);modified.set(bytes.subarray(2),2+app.length);
      const gpsFile=new File([modified],'synthetic-gps-marker.jpg',{type:'image/jpeg'});
      const gpsOutput=await photoToJPEG(gpsFile);
      if(gpsOutput===('data:image/jpeg;base64,'+btoa(String.fromCharCode(...modified.subarray(0,32768)))))
       throw Error('Metadata-bearing JPEG must not bypass transcoding');
      const gpsBytes=Uint8Array.from(atob(gpsOutput.split(',')[1]),x=>x.charCodeAt(0));
      const haystack=new TextDecoder('latin1').decode(gpsBytes);
      if(haystack.includes('GPS-TEST-ONLY')||haystack.includes('Exif'))
       throw Error('Retained EXIF/GPS marker in saved image');
      const display=document.getElementById('results');
      display.innerHTML='';
      const h=document.createElement('p');
      h.textContent='SYNTHETIC: original JPG '+(preserved?'retained byte-for-byte':'privacy-safe re-encoded')+
        ' | resolution 2200 × 1600 | GPS marker stripped';
      const picture=document.createElement('img');
      picture.src=output;picture.style.cssText='width:100%;max-width:390px;height:auto';
      display.append(h,picture);
      return {safeJpeg: safeSource, preserved,originalBytes:bytes.length,
       outputBytes:gpsBytes.length,finalWidth:restored.naturalWidth,
       finalHeight:restored.naturalHeight,exifMarkerStripped:true};
     });
     assert.ok(report.exifMarkerStripped);
     assert.equal(report.finalWidth,2200);
     assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
     const filename=output+'/'+name+'-'+width+'-SOURCE-JPEG-PROVENANCE-SYNTHETIC-HOLD.png';
     await page.screenshot({path:filename,fullPage:true,animations:'disabled'});
     results.push({engine:name,width,status:'PASS',...report,physicalPhone:false,
      personalPhotosUsed:false});
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
}finally{server.close();}
await writeFile(output+'/results.json',JSON.stringify(results,null,2)+'\n');
console.log('FAMILY_ALPHA_SOURCE_JPEG_BROWSER_PASS',JSON.stringify(results));
