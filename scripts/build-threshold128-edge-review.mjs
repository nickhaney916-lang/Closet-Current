import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
const output=process.argv[2]||'benchmark/threshold128-edge-review';
await mkdir(output,{recursive:true});
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 for(const item of manifest.cases){
  const pred=JSON.parse(await readFile('benchmark/modnet-predictions/'+item.id+'.modnet-prediction.json','utf8'));
  if(pred.sourceSha256!==item.sourceSha256)throw Error('Source mismatch');
  const photo='data:image/jpeg;base64,'+(await readFile(join('benchmark/photos',item.image))).toString('base64');
  const result=await page.evaluate(async({photo,pred})=>{
   const image=new Image();image.src=photo;await image.decode();
   const w=image.naturalWidth,h=image.naturalHeight,n=w*h;if(w!==pred.width||h!==pred.height)throw Error('Dimensions mismatch');
   const mask=new Uint8Array(n);let k=0,on=false;for(const count of pred.runs){if(!Number.isInteger(count)||count<0||k+count>n)throw Error('Invalid mask');if(on)mask.fill(1,k,k+count);k+=count;on=!on;}if(k!==n)throw Error('Incomplete mask');
   const source=document.createElement('canvas');source.width=w;source.height=h;const ctx=source.getContext('2d');ctx.drawImage(image,0,0);const rgb=ctx.getImageData(0,0,w,h);
   const width=Math.min(w,480),height=Math.round(width*h/w),header=70;
   const sheet=document.createElement('canvas');sheet.width=width*3;sheet.height=height+header;const out=sheet.getContext('2d');
   out.fillStyle='#fff';out.fillRect(0,0,sheet.width,sheet.height);out.fillStyle='#222';out.font='bold 17px sans-serif';
   ['MODNet 128 hard','MODNet 128 + edge blend','Uncertain exterior boundary'].forEach((name,i)=>out.fillText(name,width*i+10,28));
   out.font='12px sans-serif';out.fillText('Orange indicates review candidates only; NOT confirmed shadow',width*2+10,50);
   let flagged=0;
   for(let variant=0;variant<3;variant++){
    const data=new ImageData(new Uint8ClampedArray(rgb.data),w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
     const i=y*w+x;if(!mask[i]){data.data[i*4+3]=0;continue;}
     let neighbors=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const yy=y+dy,xx=x+dx;if(yy>=0&&yy<h&&xx>=0&&xx<w&&mask[yy*w+xx])neighbors++;}
     data.data[i*4+3]=variant===0?255:neighbors===9?255:Math.max(85,Math.round(255*neighbors/9));
     if(variant===2&&neighbors<9){
      // Mark only boundary candidates; do not change transparency or delete pixels.
      let outside=-1;if(x>0&&!mask[i-1])outside=i-1;else if(x<w-1&&!mask[i+1])outside=i+1;else if(y>0&&!mask[i-w])outside=i-w;else if(y<h-1&&!mask[i+w])outside=i+w;
      if(outside>=0){const delta=(Math.abs(rgb.data[i*4]-rgb.data[outside*4])+Math.abs(rgb.data[i*4+1]-rgb.data[outside*4+1])+Math.abs(rgb.data[i*4+2]-rgb.data[outside*4+2]))/3;
       if(delta<16){flagged++;data.data[i*4]=255;data.data[i*4+1]=130;data.data[i*4+2]=0;data.data[i*4+3]=255;}
      }
     }
    }
    const cut=document.createElement('canvas');cut.width=w;cut.height=h;cut.getContext('2d').putImageData(data,0,0);
    const bg=document.createElement('canvas');bg.width=w;bg.height=h;const bc=bg.getContext('2d');bc.fillStyle='#eee9f3';bc.fillRect(0,0,w,h);bc.drawImage(cut,0,0);
    out.drawImage(bg,width*variant,header,width,height);
   }
   return {png:sheet.toDataURL('image/png').split(',')[1],flaggedReviewPixels:flagged,removedPixels:0,shadowVerified:false};
  },{photo,pred});
  await writeFile(join(output,item.id+'-threshold128-review.png'),Buffer.from(result.png,'base64'));
  const {png,...metrics}=result;console.log('THRESHOLD128_EDGE_REVIEW '+JSON.stringify({id:item.id,...metrics}));
 }
}finally{await browser.close();}
