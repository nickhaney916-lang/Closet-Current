import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
const source=process.argv[2]||'benchmark/multiscale-contamination';
const destination=process.argv[3]||'benchmark/lower-edge-zoom';
await mkdir(destination,{recursive:true});
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 for(const item of manifest.cases){
  const bytes=await readFile(join(source,item.id+'-multiscale.png'));
  const image=await page.evaluate(async (data)=>{
   const img=new Image();img.src='data:image/png;base64,'+data;await img.decode();
   const width=img.naturalWidth,header=72,photoHeight=img.naturalHeight-header;
   const cropStart=header+Math.floor(photoHeight*.55);
   const cropHeight=img.naturalHeight-cropStart;
   const out=document.createElement('canvas');out.width=width;out.height=cropHeight+48;
   const ctx=out.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,width,out.height);
   ctx.fillStyle='#222';ctx.font='bold 20px sans-serif';ctx.fillText('Lower-edge detail · original vs unverified risk overlay',14,30);
   ctx.drawImage(img,0,cropStart,width,cropHeight,0,48,width,cropHeight);
   return out.toDataURL('image/png').split(',')[1];
  },bytes.toString('base64'));
  await writeFile(join(destination,item.id+'-lower-edge-zoom.png'),Buffer.from(image,'base64'));
  console.log('LOWER_EDGE_ZOOM '+item.id);
 }
}finally{await browser.close();}
