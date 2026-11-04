import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {footwearShadowCandidates} from '../benchmark/footwear-shadow-candidates.mjs';
const output=process.argv[2]||'benchmark/footwear-shadow-before-after';
await mkdir(output,{recursive:true});
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 for(const id of ['commons-0035','commons-0049','commons-0053','commons-0065','commons-0079','commons-0094']){
  const isFootwear=['commons-0079','commons-0094'].includes(id);
  const item=manifest.cases.find(c=>c.id===id);
  const prediction=JSON.parse(await readFile('benchmark/modnet-predictions/'+id+'.modnet-prediction.json','utf8'));
  if(!item||prediction.sourceSha256!==item.sourceSha256)throw Error('Unverified source');
  const {rows,candidatePixels}=isFootwear?footwearShadowCandidates(prediction):{rows:[],candidatePixels:0};
  const photo='data:image/jpeg;base64,'+(await readFile(join('benchmark/photos',item.image))).toString('base64');
  if(isFootwear){
  const outputPng=await page.evaluate(async ({photo,prediction,rows,id})=>{
   const img=new Image();img.src=photo;await img.decode();
   const w=img.naturalWidth,h=img.naturalHeight;
   if(w!==prediction.width||h!==prediction.height)throw Error('Image dimensions differ');
   const mask=new Uint8Array(w*h);let at=0,fg=false;
   for(const count of prediction.runs){if(!Number.isInteger(count)||count<0||at+count>mask.length)throw Error('Invalid mask');if(fg)mask.fill(1,at,at+count);at+=count;fg=!fg;}
   if(at!==mask.length)throw Error('Incomplete mask');
   const strip=new Set(rows.map(x=>x.y));
   const src=document.createElement('canvas');src.width=w;src.height=h;
   const c=src.getContext('2d');c.drawImage(img,0,0);const original=c.getImageData(0,0,w,h);
   const pw=Math.min(650,w),ph=Math.round(pw*h/w),banner=94;
   const sheet=document.createElement('canvas');sheet.width=pw*2;sheet.height=ph+banner;const out=sheet.getContext('2d');
   out.fillStyle='#ffffff';out.fillRect(0,0,sheet.width,sheet.height);
   out.fillStyle='#111';out.font='bold 21px sans-serif';out.fillText(id+' · MODNet baseline',12,32);
   out.fillText('EXPERIMENT: sparse lower rows removed',pw+12,32);
   out.font='16px sans-serif';out.fillText('Left: original experimental mask',12,59);
   out.fillText('Right: MAY CUT SOLE — review only',pw+12,59);
   for(let variant=0;variant<2;variant++){
    const panel=document.createElement('canvas');panel.width=w;panel.height=h;const pc=panel.getContext('2d');
    pc.fillStyle='#eee9f3';pc.fillRect(0,0,w,h);
    const pixels=new ImageData(new Uint8ClampedArray(original.data),w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!mask[i]||(variant===1&&strip.has(y)))pixels.data[4*i+3]=0;}
    const cut=document.createElement('canvas');cut.width=w;cut.height=h;cut.getContext('2d').putImageData(pixels,0,0);
    pc.drawImage(cut,0,0);out.drawImage(panel,variant*pw,banner,pw,ph);
   }
   return sheet.toDataURL('image/png').split(',')[1];
  },{photo,prediction,rows,id});
  await writeFile(join(output,id+'-shadow-before-after.png'),Buffer.from(outputPng,'base64'));
  }
  const detail=await page.evaluate(async ({photo,prediction})=>{
   const image=new Image();image.src=photo;await image.decode();
   const w=prediction.width,h=prediction.height;
   if(image.naturalWidth!==w||image.naturalHeight!==h)throw Error('Native resolution mismatch');
   const source=document.createElement('canvas');source.width=w;source.height=h;
   const ctx=source.getContext('2d');ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,w,h);
   const bits=new Uint8Array(w*h);let at=0,on=false;
   for(const n of prediction.runs){if(!Number.isInteger(n)||n<0||at+n>bits.length)throw Error('Bad prediction');if(on)bits.fill(1,at,at+n);at+=n;on=!on;}
   if(at!==bits.length)throw Error('Bad prediction length');
   let minX=w,maxX=0,minY=h,maxY=0;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(bits[y*w+x]){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
   const left=Math.max(0,minX),top=Math.max(0,Math.floor(minY+(maxY-minY)*.65));
   const cw=Math.max(1,Math.min(w-left,maxX-left+1)),ch=Math.max(1,Math.min(h-top,maxY-top+1));
   const masked=new ImageData(new Uint8ClampedArray(data.data),w,h);
   for(let i=0;i<bits.length;i++)masked.data[4*i+3]=bits[i]?255:0;
   const cut=document.createElement('canvas');cut.width=w;cut.height=h;
   const cc=cut.getContext('2d');cc.fillStyle='#eee9f3';cc.fillRect(0,0,w,h);
   const transparent=document.createElement('canvas');transparent.width=w;transparent.height=h;transparent.getContext('2d').putImageData(masked,0,0);
   cc.drawImage(transparent,0,0);
   const scale=2,out=document.createElement('canvas');out.width=cw*scale*2;out.height=ch*scale;
   const oc=out.getContext('2d');oc.imageSmoothingEnabled=false;
   oc.drawImage(source,left,top,cw,ch,0,0,cw*scale,ch*scale);
   oc.drawImage(cut,left,top,cw,ch,cw*scale,0,cw*scale,ch*scale);
   return {png:out.toDataURL('image/png').split(',')[1],crop:{left,top,width:cw,height:ch,scale,sourceWidth:w,sourceHeight:h},binaryAlpha:true};
  },{photo,prediction});
  await writeFile(join(output,id+'-native-edges-2x.png'),Buffer.from(detail.png,'base64'));
  console.log('NATIVE_EDGE_REVIEW '+JSON.stringify({id,...detail.crop,binaryAlpha:detail.binaryAlpha,warning:'Pixelated edges may be intrinsic to binary alpha mask; this is not an accuracy score'}));
  if(isFootwear)console.log('SHADOW_EXPERIMENT '+JSON.stringify({id,candidatePixels,rows:rows.length,reviewOnly:true,productionUnchanged:true,warning:'May remove real sole pixels'}));
 }
}finally{await browser.close();}
