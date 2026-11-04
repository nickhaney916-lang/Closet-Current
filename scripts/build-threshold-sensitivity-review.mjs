import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
const out=process.argv[2]||'benchmark/threshold-sensitivity-review';
await mkdir(out,{recursive:true});
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 for(const item of manifest.cases){
  const photograph='data:image/jpeg;base64,'+(await readFile(join('benchmark/photos',item.image))).toString('base64');
  const alpha='data:image/png;base64,'+(await readFile(join('benchmark/modnet-predictions',item.id+'.modnet-alpha.png'))).toString('base64');
  const result=await page.evaluate(async ({photograph,alpha})=>{
   const load=async url=>{const image=new Image();image.src=url;await image.decode();return image;};
   const [photo,matte]=await Promise.all([load(photograph),load(alpha)]);
   const w=photo.naturalWidth,h=photo.naturalHeight,n=w*h;
   if(matte.naturalWidth!==w||matte.naturalHeight!==h)throw Error('Alpha dimensions mismatch');
   const original=document.createElement('canvas');original.width=w;original.height=h;const c=original.getContext('2d');c.drawImage(photo,0,0);const pixels=c.getImageData(0,0,w,h);
   const a=document.createElement('canvas');a.width=w;a.height=h;const ac=a.getContext('2d');ac.drawImage(matte,0,0);
   const values=ac.getImageData(0,0,w,h).data;
   const levels=[128,160,192],counts=[0,0,0];
   const width=Math.min(w,480),height=Math.round(width*h/w),header=68,output=document.createElement('canvas');
   output.width=width*3;output.height=height+header;const ctx=output.getContext('2d');
   ctx.fillStyle='white';ctx.fillRect(0,0,output.width,output.height);
   ctx.fillStyle='#222';ctx.font='bold 19px sans-serif';
   levels.forEach((level,k)=>ctx.fillText(level===128?'Approved sharp baseline · 128':'Candidate only · '+level,k*width+10,30));
   ctx.font='12px sans-serif';ctx.fillText('Tighter threshold may remove genuine clothing — visual review required',10,52);
   for(let v=0;v<levels.length;v++){
    const data=new ImageData(new Uint8ClampedArray(pixels.data),w,h);
    for(let i=0;i<n;i++){const selected=values[i*4]>=levels[v];if(selected)counts[v]++;data.data[i*4+3]=selected?255:0;}
    const cut=document.createElement('canvas');cut.width=w;cut.height=h;cut.getContext('2d').putImageData(data,0,0);
    const panel=document.createElement('canvas');panel.width=w;panel.height=h;const pc=panel.getContext('2d');pc.fillStyle='#eee9f3';pc.fillRect(0,0,w,h);pc.drawImage(cut,0,0);
    ctx.drawImage(panel,v*width,header,width,height);
   }
   if(!(counts[0]>=counts[1]&&counts[1]>=counts[2]))throw Error('Threshold monotonicity violated');
   return {png:output.toDataURL('image/png').split(',')[1],baselineForeground:counts[0],removedAt160:counts[0]-counts[1],removedAt192:counts[0]-counts[2],verifiedShadowRemoval:false,referenceMaskAvailable:false};
  },{photograph,alpha});
  await writeFile(join(out,item.id+'-threshold-sensitivity.png'),Buffer.from(result.png,'base64'));
  const {png,...report}=result;console.log('THRESHOLD_SENSITIVITY '+JSON.stringify({id:item.id,...report}));
 }
}finally{await browser.close();}
