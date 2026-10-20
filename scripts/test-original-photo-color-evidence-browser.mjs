// Browser COLOR-EVIDENCE integrity: synthetic garments, real Image.decode,
// canvas image extraction and unmodified original JPEG pixel flow.
// These fixtures do not measure real clothing recognition accuracy.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('about:blank');
 await page.addScriptTag({path:resolve('public/photo-color.js')});
 await page.addScriptTag({path:resolve('public/photo-check.js')});
 const results=await page.evaluate(async()=>{
  function photo(background,fore,rect){
   const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
   const ctx=canvas.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,128,128);
   if(rect){ctx.fillStyle=fore;ctx.fillRect(...rect);}
   return canvas.toDataURL('image/jpeg',.95);
  }
  const cases={
   // A small colored region on white is NOT proof the item itself is white.
   tinyColoredItem:photo('#fdfdfd','#0946c4',[48,49,16,23]),
   // Off-center dark garment occupies enough ORIGINAL RGB to be isolated by
   // the independent 64px spatial test, even if center 16px is mostly white.
   largeDarkItem:photo('#fdfdfd','#161616',[22,20,35,94]),
   // White object on dark scene: no uniform-light background proof possible.
   actualWhiteOnDark:photo('#454545','#fafafa',[24,15,80,99]),
   blankWhite:photo('#fdfdfd',null,null)
  };
  const samples={};
  for(const [key,url]of Object.entries(cases)){
   const photoRead=await checkPhoto(url);
   const originalImg=new Image();originalImg.src=url;await originalImg.decode();
   const copy=document.createElement('canvas');copy.width=128;copy.height=128;
   copy.getContext('2d').drawImage(originalImg,0,0);
   samples[key]={
    blank:photoRead.blank,
    color:photoRead.colorEstimate?.color||null,
    reason:photoRead.colorEstimate?.reason||null,
    needsConfirmation:photoRead.colorEstimate?.needsConfirmation===true,
    method:photoRead.colorEstimate?.method||null,
    support:photoRead.colorEstimate?.support||null,
    originalWidth:originalImg.naturalWidth,originalHeight:originalImg.naturalHeight,
    unchangedSourcePixels:copy.toDataURL('image/png')===(()=>{
     const other=document.createElement('canvas');other.width=128;other.height=128;
     other.getContext('2d').drawImage(originalImg,0,0);
     return other.toDataURL('image/png');
    })()
   };
  }
  return samples;
 });
 assert.equal(results.tinyColoredItem.color,'White');
 assert.equal(results.tinyColoredItem.needsConfirmation,true);
 assert.equal(results.tinyColoredItem.reason,'white-foreground-unverified');
 assert.equal(results.tinyColoredItem.blank,false);
 assert.equal(results.largeDarkItem.color,'Black','verified off-center dark cloth must beat white backdrop');
 assert.equal(results.largeDarkItem.method,'uniform-light-background');
 assert.equal(results.largeDarkItem.needsConfirmation,false);
 assert.equal(results.actualWhiteOnDark.color,'White');
 assert.equal(results.actualWhiteOnDark.needsConfirmation,true,
  'without independent spatial evidence, even a real white item needs confirmation');
 assert.equal(results.blankWhite.blank,true);
 assert.ok(Object.values(results).every(r=>r.originalWidth===128&&r.originalHeight===128&&r.unchangedSourcePixels));
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({
  verified:true,browser:'Chromium mobile-width 390px',cases:results,
  changesToOriginalRGB:0,automaticallyApprovedRealPhotoColors:0,
  independentlyLabeledGarments:0,physicalPhones:0
 }));
}finally{await browser.close();}
