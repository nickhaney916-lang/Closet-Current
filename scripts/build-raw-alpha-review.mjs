import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
const destination=process.argv[2]||'benchmark/raw-alpha-review';
await mkdir(destination,{recursive:true});
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();
 for(const item of manifest.cases){
  const photo='data:image/jpeg;base64,'+(await readFile(join('benchmark/photos',item.image))).toString('base64');
  const alpha='data:image/png;base64,'+(await readFile(join('benchmark/modnet-predictions',item.id+'.modnet-alpha.png'))).toString('base64');
  const result=await page.evaluate(async ({photo,alpha})=>{
   const load=async uri=>{const img=new Image();img.src=uri;await img.decode();return img;};
   const [img,matte]=await Promise.all([load(photo),load(alpha)]);
   const w=img.naturalWidth,h=img.naturalHeight;
   if(w!==matte.naturalWidth||h!==matte.naturalHeight)throw Error('Native alpha dimensions mismatch');
   const src=document.createElement('canvas');src.width=w;src.height=h;const sc=src.getContext('2d');sc.drawImage(img,0,0);
   const m=document.createElement('canvas');m.width=w;m.height=h;const mc=m.getContext('2d');mc.drawImage(matte,0,0);
   const pixels=mc.getImageData(0,0,w,h).data;const imageData=sc.getImageData(0,0,w,h);
   let uncertain=0,strict=0,transparent=0;const hist=[0,0,0,0];
   const panels=[];
   for(let type=0;type<3;type++){
    const panel=document.createElement('canvas');panel.width=w;panel.height=h;const c=panel.getContext('2d');
    if(type===0)c.drawImage(src,0,0);
    else{
     const data=new ImageData(new Uint8ClampedArray(imageData.data),w,h);
     for(let i=0;i<w*h;i++){
      const alpha=pixels[4*i],k=i*4;
      if(type===1)data.data[k+3]=alpha;
      else {data.data[k+3]=alpha>=128?255:0;}
      if(type===1&&alpha>0&&alpha<255){
       // No image recoloring; native alpha is the sole blending input.
      }
     }
     const masked=document.createElement('canvas');masked.width=w;masked.height=h;masked.getContext('2d').putImageData(data,0,0);
     c.fillStyle='#ece9f2';c.fillRect(0,0,w,h);c.drawImage(masked,0,0);
    }
    panels.push(panel);
   }
   for(let i=0;i<w*h;i++){
    const a=pixels[i*4];if(a===0)transparent++;if(a>=192)strict++;if(a>0&&a<192)uncertain++;
    hist[a<64?0:a<128?1:a<192?2:3]++;
   }
   // Native-resolution diagnostic only: label ambiguous alpha, never presume shadow.
   const edgeRegions={left:{pixels:0,uncertain:0},right:{pixels:0,uncertain:0},bottom:{pixels:0,uncertain:0},interior:{pixels:0,uncertain:0}};
   const sidePx=Math.max(1,Math.ceil(w*.18)),bottomY=Math.floor(h*.78);
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const region=y>=bottomY?'bottom':x<sidePx?'left':x>=w-sidePx?'right':'interior';
    const a=pixels[(y*w+x)*4],stats=edgeRegions[region];stats.pixels++;
    if(a>=16&&a<224)stats.uncertain++;
   }
   for(const stats of Object.values(edgeRegions))stats.uncertainFraction=stats.pixels?stats.uncertain/stats.pixels:0;
   const pw=Math.min(520,w),ph=Math.round(pw*h/w),header=63;
   const sheet=document.createElement('canvas');sheet.width=pw*3;sheet.height=ph+header;const out=sheet.getContext('2d');
   out.fillStyle='#fff';out.fillRect(0,0,sheet.width,sheet.height);out.fillStyle='#222';out.font='bold 19px sans-serif';
   ['Original','Native MODNet alpha','Threshold at 128'].forEach((name,i)=>{out.fillText(name,i*pw+12,30);out.drawImage(panels[i],i*pw,header,pw,ph);});
   return {png:sheet.toDataURL('image/png').split(',')[1],hist,uncertain,strict,transparent,sourcePixels:w*h,edgeRegions,edgeReviewOnly:true,verifiedShadowPixels:0,shadowRemovalVerified:false};
  },{photo,alpha});
  await writeFile(join(destination,item.id+'-raw-alpha-review.png'),Buffer.from(result.png,'base64'));
  const {png,...stats}=result;console.log('RAW_ALPHA_REVIEW '+JSON.stringify({id:item.id,...stats}));
 }
}finally{await browser.close();}
