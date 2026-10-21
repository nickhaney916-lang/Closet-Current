import {chromium,webkit} from 'playwright';
import fs from 'node:fs';
const palette=fs.readFileSync('public/photo-color.js','utf8');
const editor=fs.readFileSync('public/photo-crop-editor.js','utf8');
const results=[];
for(const [name,type] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
 const browser=await type.launch({headless:true,args:name.includes('Chromium')?['--no-sandbox']:[]});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},
   isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const page=await context.newPage();
  await page.goto('about:blank');
  await page.addScriptTag({content:palette});
  await page.addScriptTag({content:editor});
  const row=await page.evaluate(()=>{
   const make=(fill,box=[25,25,55,55])=>{
    const w=80,h=80,a=new Uint8ClampedArray(w*h*4);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
     const i=(y*w+x)*4;a[i]=30;a[i+1]=70;a[i+2]=215;
     a[i+3]=fill||(x>=box[0]&&x<box[2]&&y>=box[1]&&y<box[3])?255:0;
    }
    return a;
   };
   const photo=cropMaskColorEvidence(make(false),80,80,PhotoColor);
   const opaque=cropMaskColorEvidence(make(true),80,80,PhotoColor);
   const faint=cropMaskColorEvidence(make(false,[36,36,42,42]),80,80,PhotoColor);
   return {photo,opaque,faint,editorAvailable:typeof openPhotoCrop==='function'};
  });
  if(row.photo?.color!=='Blue'||row.photo.method!=='garment-mask'||
     row.opaque!==null||row.faint!==null||!row.editorAvailable)
   throw Error(name+' failed original-foreground color review: '+JSON.stringify(row));
  results.push({engine:name,verifiedMaskBlue:true,opaqueBackgroundRejected:true,
   incompleteForegroundRejected:true,physicalDeviceTested:false});
  await context.close();
 }finally{await browser.close();}
}
console.log('MASKED_CROP_ORIGINAL_COLOR_BROWSER_QA '+JSON.stringify(results));
