// Synthetic sensor blobs through real browser decoders; not physical camera proof.
import {chromium,webkit} from 'playwright';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const app=await readFile('public/app.js','utf8');
const code=app.slice(app.indexOf('function snap('),app.indexOf('function beep('));
for(const [label,engine] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('about:blank');
  await page.addScriptTag({content:'const canvas=document.createElement("canvas");\n'+code});
  const result=await page.evaluate(async()=>{
   const source=document.createElement('canvas');source.width=4000;source.height=3000;
   const ctx=source.getContext('2d');ctx.fillStyle='#174a9c';ctx.fillRect(0,0,4000,3000);
   ctx.fillStyle='#eeeeee';for(let x=0;x<4000;x+=100)ctx.fillRect(x,0,8,3000);
   const blob=await new Promise(resolve=>source.toBlob(resolve,'image/jpeg',.98));
   const capture=blob=>captureCameraStill({},class{async takePhoto(){return blob;}});
   const jpeg=await capture(blob);
   const decoded=await createImageBitmap(await (await fetch(jpeg)).blob());
   const dimensions=[decoded.width,decoded.height];decoded.close();
   // EXIF APP1 orientation 6: source 400x300 rotates clockwise to 300x400.
   source.width=400;source.height=300;
   ctx.fillStyle='#fff';ctx.fillRect(0,0,400,300);
   ctx.fillStyle='#e02020';ctx.fillRect(0,0,200,150);
   ctx.fillStyle='#2040e0';ctx.fillRect(200,150,200,150);
   const plain=await new Promise(resolve=>source.toBlob(resolve,'image/jpeg',.98));
   const bytes=new Uint8Array(await plain.arrayBuffer());
   const exif=new Uint8Array([255,225,0,34,69,120,105,102,0,0,73,73,42,0,8,0,0,0,1,0,18,1,3,0,1,0,0,0,6,0,0,0,0,0,0,0]);
   const rotated=await capture(new Blob([bytes.slice(0,2),exif,bytes.slice(2)],{type:'image/jpeg'}));
   const oriented=await createImageBitmap(await (await fetch(rotated)).blob());
   const orientation=[oriented.width,oriented.height];
   const check=document.createElement('canvas');check.width=oriented.width;check.height=oriented.height;
   const pixels=check.getContext('2d');pixels.drawImage(oriented,0,0);oriented.close();
   const red=Array.from(pixels.getImageData(225,100,1,1).data).slice(0,3);
   const blue=Array.from(pixels.getImageData(75,300,1,1).data).slice(0,3);
   let rejected=false;
   try{await captureCameraStill({},class{async takePhoto(){return blob;}},()=>false);}catch{rejected=true;}
   return {dimensions,encodedLength:jpeg.length,orientation,red,blue,rejected};
  });
  assert.deepEqual(result.dimensions,[3072,2304]);
  assert.ok(result.encodedLength<=2850000);
  assert.deepEqual(result.orientation,[300,400]);
  for(const [actual,expected] of [[result.red,[224,32,32]],[result.blue,[32,64,224]]])
   actual.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<=15,JSON.stringify({actual,expected})));
  assert.equal(result.rejected,true);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({browser:label,...result,physicalPhoneTested:false}));
  await context.close();
 }finally{await browser.close();}
}
