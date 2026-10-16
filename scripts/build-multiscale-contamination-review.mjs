import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
const output=process.argv[2]||'benchmark/multiscale-contamination';
await mkdir(output,{recursive:true});
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 for(const item of manifest.cases){
  const pred=JSON.parse(await readFile('benchmark/modnet-predictions/'+item.id+'.modnet-prediction.json','utf8'));
  if(pred.sourceSha256!==item.sourceSha256)throw Error('Unverified photograph');
  const photo='data:image/jpeg;base64,'+(await readFile(join('benchmark/photos',item.image))).toString('base64');
  const result=await page.evaluate(async ({photo,pred})=>{
   const image=new Image();image.src=photo;await image.decode();
   const w=image.naturalWidth,h=image.naturalHeight,n=w*h;
   if(w!==pred.width||h!==pred.height)throw Error('Dimensions mismatch');
   const mask=new Uint8Array(n);let at=0,on=false;
   for(const count of pred.runs){if(!Number.isInteger(count)||count<0||at+count>n)throw Error('Invalid mask');if(on)mask.fill(1,at,at+count);at+=count;on=!on;}
   if(at!==n)throw Error('Incomplete mask');
   const src=document.createElement('canvas');src.width=w;src.height=h;const c=src.getContext('2d');c.drawImage(image,0,0);
   const data=c.getImageData(0,0,w,h).data;
   const lum=i=>(data[i*4]*.2126+data[i*4+1]*.7152+data[i*4+2]*.0722);
   const risk=new Uint8Array(n);let shadowLike=0,backgroundLike=0,examined=0;
   // Compare inward pixels against outside samples at multiple distances,
   // not merely the single-pixel boundary. Remains a diagnostic, not an automatic deletion.
   for(let y=8;y<h-8;y++)for(let x=8;x<w-8;x++){
    const i=y*w+x;if(!mask[i])continue;
    let outside=null;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
     if(!mask[i+dy*w+dx]){outside=[dx,dy];break;}
    }
    if(!outside)continue;examined++;
    const [dx,dy]=outside,inside=Math.max(0,i-dy*w-dx),outer=i+dy*w*5+dx*5;
    if(outer<0||outer>=n||mask[outer])continue;
    const diff=Math.abs(lum(i)-lum(outer)),local=Math.abs(lum(i)-lum(inside));
    if(diff<14&&local<22){risk[i]=1;backgroundLike++;}
    else if(lum(i)+24<lum(outer)&&local<35){risk[i]=2;shadowLike++;}
   }
   const pw=Math.min(w,650),ph=Math.round(pw*h/w),header=72;
   const out=document.createElement('canvas');out.width=pw*2;out.height=ph+header;const oc=out.getContext('2d');
   oc.fillStyle='white';oc.fillRect(0,0,out.width,out.height);oc.fillStyle='#222';oc.font='bold 20px sans-serif';
   oc.fillText('Original',12,30);oc.fillText('Multiscale boundary hints',pw+12,30);
   oc.font='14px sans-serif';oc.fillText('Pink: background-like | Cyan: shadow-like (unverified)',pw+12,55);
   oc.drawImage(src,0,header,pw,ph);
   const overlay=c.getImageData(0,0,w,h);
   for(let i=0;i<n;i++){const v=risk[i];if(!v)continue;overlay.data[i*4]=v===1?255:0;overlay.data[i*4+1]=v===1?15:215;overlay.data[i*4+2]=v===1?175:245;}
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d').putImageData(overlay,0,0);
   oc.drawImage(canvas,pw,header,pw,ph);
   return {image:out.toDataURL('image/png').split(',')[1],examined,backgroundLike,shadowLike,changedMaskPixels:0,verifiedShadowPixels:0};
  },{photo,pred});
  await writeFile(join(output,item.id+'-multiscale.png'),Buffer.from(result.image,'base64'));
  const {image,...metrics}=result;console.log('MULTISCALE_CONTAMINATION '+JSON.stringify({id:item.id,...metrics,reviewOnly:true}));
 }
}finally{await browser.close();}
