// Exact baseline/candidate pixel comparison, no neural inference or external requests.
import {chromium,webkit} from 'playwright';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const baseline=execFileSync('git',['show','972a50c8065ac4e5478c1e7fefdf740b2a654001:public/recognition-photo.mjs'],{encoding:'utf8'});
const candidate=fs.readFileSync('public/recognition-photo.mjs','utf8');
const sources=JSON.parse(fs.readFileSync('benchmark/locked-photo-sources.json'));
for(const [name,engine]of [['Chromium',chromium],['WebKit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),external=[];
  await page.route('**/*',route=>{external.push(route.request().url());return route.abort();});
  await page.goto('about:blank');
  let comparisons=0;
  for(const row of sources){
   const bytes=fs.readFileSync('benchmark/fixtures/'+row.image);
   assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);
   const result=await page.evaluate(async({baseline,candidate,url})=>{
    const load=s=>import('data:text/javascript;base64,'+btoa(s));
    const a=await load(baseline),b=await load(candidate);
    class Raw{
     constructor(data,width,height,channels){Object.assign(this,{data,width,height,channels});}
     canvas(){const c=document.createElement('canvas');c.width=this.width;c.height=this.height;const ctx=c.getContext('2d');ctx.putImageData(new ImageData(new Uint8ClampedArray(this.data),this.width,this.height),0,0);return c;}
     async resize(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(this.canvas(),0,0,w,h);return new Raw(ctx.getImageData(0,0,w,h).data,w,h,4);}
     async crop([l,t,r,b]){const w=r-l+1,h=b-t+1;return new Raw(this.canvas().getContext('2d').getImageData(l,t,w,h).data,w,h,4);}
    }
    const img=new Image();img.src=url;await img.decode();
    const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);
    const data=ctx.getImageData(0,0,c.width,c.height).data,original=data.slice(),image=new Raw(data,c.width,c.height,4);
    let same=true;
    for(const confirmation of [false,true]){
     const old=await a.prepareRecognitionPhoto(image,Raw,{confirmation}),now=await b.prepareRecognitionPhoto(image,Raw,{confirmation});
     same&&=old.data.length===now.data.length&&old.data.every((v,i)=>v===now.data[i]);
    }
    return {same,sourceUnchanged:data.every((v,i)=>v===original[i]),width:c.width,height:c.height};
   },{baseline,candidate,url:'data:image/jpeg;base64,'+bytes.toString('base64')});
   assert.equal(result.same,true,row.id+' default/confirmation output changed');
   assert.equal(result.sourceUnchanged,true,row.id+' original pixels mutated');comparisons+=2;
  }
  assert.deepEqual(external,[]);
  console.log(JSON.stringify({engine:name,licensedSources:sources.length,exactDefaultPixelComparisons:comparisons,externalRequests:external.length,newInference:0,physicalDevice:false}));
 }finally{await browser.close();}
}
