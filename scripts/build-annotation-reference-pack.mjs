import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
const dir=process.argv[2]||'benchmark/annotation-reference-pack';
await mkdir(dir,{recursive:true});
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();
 for(const item of manifest.cases){
  const src='data:image/jpeg;base64,'+(await readFile(join('benchmark/photos',item.image))).toString('base64');
  const result=await page.evaluate(async ({src,id})=>{
   const img=new Image();img.src=src;await img.decode();
   const w=img.naturalWidth,h=img.naturalHeight;
   const scale=Math.min(1,1400/w,1400/h),pw=Math.round(w*scale),ph=Math.round(h*scale);
   const canvas=document.createElement('canvas');canvas.width=pw;canvas.height=ph+70;
   const c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,canvas.width,canvas.height);
   c.fillStyle='#222';c.font='bold 17px sans-serif';c.fillText(id+' · Original photo, annotation reference',12,26);
   c.font='12px sans-serif';c.fillText('Review: garment outline vs cast shadow vs background; do not infer from model overlay',12,48);
   c.drawImage(img,0,70,pw,ph);
   return {png:canvas.toDataURL('image/png').split(',')[1],width:w,height:h};
  },{src,id:item.id});
  await writeFile(join(dir,item.id+'-annotation-source.png'),Buffer.from(result.png,'base64'));
  console.log('ANNOTATION_REFERENCE '+JSON.stringify({id:item.id,width:result.width,height:result.height,approved:false}));
 }
}finally{await browser.close();}
