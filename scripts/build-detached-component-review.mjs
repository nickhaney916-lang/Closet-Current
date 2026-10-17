import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
const target=process.argv[2]||'benchmark/conservative-component-review';
await mkdir(target,{recursive:true});
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 for(const item of manifest.cases){
  const pred=JSON.parse(await readFile('benchmark/modnet-predictions/'+item.id+'.modnet-prediction.json','utf8'));
  if(pred.sourceSha256!==item.sourceSha256)throw Error('Prediction source mismatch');
  const photo='data:image/jpeg;base64,'+(await readFile(join('benchmark/photos',item.image))).toString('base64');
  const output=await page.evaluate(async ({photo,pred})=>{
   const footwear=pred.image==='commons-0079.jpg'||pred.image==='commons-0094.jpg';
   const image=new Image();image.src=photo;await image.decode();
   const w=image.naturalWidth,h=image.naturalHeight,n=w*h;
   if(w!==pred.width||h!==pred.height)throw Error('Dimensions mismatch');
   const fg=new Uint8Array(n);let pos=0,on=false;
   for(const count of pred.runs){if(!Number.isInteger(count)||count<0||pos+count>n)throw Error('Bad mask');if(on)fg.fill(1,pos,pos+count);pos+=count;on=!on;}
   if(pos!==n)throw Error('Invalid mask size');
   // Component isolation is conservative: never remove connected pixels from the main garment.
   const visited=new Uint8Array(n);const components=[];
   for(let i=0;i<n;i++){
    if(!fg[i]||visited[i])continue;
    const queue=[i];visited[i]=1;let minx=w,maxx=0,miny=h,maxy=0,top=0;
    for(let p=0;p<queue.length;p++){
     const at=queue[p],x=at%w,y=Math.floor(at/w);minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y);
     for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;
      if(xx<0||xx>=w||yy<0||yy>=h)continue;
      const next=yy*w+xx;
      if(fg[next]&&!visited[next]){visited[next]=1;queue.push(next);}
     }
    }
    components.push({pixels:queue,minx,maxx,miny,maxy});
   }
   components.sort((a,b)=>b.pixels.length-a.pixels.length);
   const minCandidate=Math.max(3,Math.floor(n*.000005));
   // Keep the main silhouette and large second pieces; this is an opt-in PREVIEW only.
   const lowerLimit=Math.floor(h*.65),smallLimit=Math.max(1,Math.floor(n*.015));
   const candidates=components.slice(1).filter(c=>footwear
    ?c.maxy>=lowerLimit&&c.pixels.length<=smallLimit
    :c.pixels.length>=minCandidate);
   const labels=new Uint8Array(n);
   for(const component of candidates)for(const i of component.pixels)labels[i]=1;
   const source=document.createElement('canvas');source.width=w;source.height=h;const ctx=source.getContext('2d');ctx.drawImage(image,0,0);
   const photoData=ctx.getImageData(0,0,w,h);
   const pv=Math.min(600,w),ph=Math.round(pv*h/w),header=62;
   const sheet=document.createElement('canvas');sheet.width=pv*(footwear?3:2);sheet.height=ph+header;
   const sc=sheet.getContext('2d');sc.fillStyle='white';sc.fillRect(0,0,sheet.width,sheet.height);
   sc.fillStyle='#222';sc.font='bold 18px sans-serif';sc.fillText('MODNet original photo',12,28);sc.fillText('Detached component candidates',pv+12,28);
   sc.font='13px sans-serif';sc.fillText('Orange: review only; no pixels removed',pv+12,49);
   if(footwear){sc.font='bold 15px sans-serif';sc.fillText('DETACHED-ONLY PREVIEW',pv*2+12,28);sc.font='12px sans-serif';sc.fillText('Not approved; connected shadows remain',pv*2+12,49);}
   sc.drawImage(source,0,header,pv,ph);
   for(let i=0;i<n;i++)if(labels[i]){const k=i*4;photoData.data[k]=255;photoData.data[k+1]=140;photoData.data[k+2]=0;}
   const marked=document.createElement('canvas');marked.width=w;marked.height=h;marked.getContext('2d').putImageData(photoData,0,0);
   sc.drawImage(marked,pv,header,pv,ph);
   // Render a possible result without changing the saved prediction or production code.
   // All connected mask pixels are retained; detached garment parts may still be at risk.
   if(footwear){
    const cutout=new ImageData(new Uint8ClampedArray(ctx.getImageData(0,0,w,h).data),w,h);
    for(let i=0;i<n;i++)cutout.data[i*4+3]=fg[i]&&!labels[i]?255:0;
    const transparent=document.createElement('canvas');transparent.width=w;transparent.height=h;
    transparent.getContext('2d').putImageData(cutout,0,0);
    sc.fillStyle='#ece9f2';sc.fillRect(pv*2,header,pv,ph);
    sc.drawImage(transparent,pv*2,header,pv,ph);
   }
   return {png:sheet.toDataURL('image/png').split(',')[1],componentCount:components.length,detachedCandidates:candidates.map(c=>({pixels:c.pixels.length,box:[c.minx,c.miny,c.maxx,c.maxy]})),candidatePreviewPixels:candidates.reduce((n,c)=>n+c.pixels.length,0),detachedOnlyPreview:footwear,largestComponentPixels:components[0]?.pixels.length||0,modifiedMaskPixels:0,limitation:'Connected shadows cannot be separated using connected components; detached real garment items can also be candidates.'};
  },{photo,pred});
  await writeFile(join(target,item.id+'-component-review.png'),Buffer.from(output.png,'base64'));
  const {png,...metrics}=output;console.log('COMPONENT_REVIEW '+JSON.stringify({id:item.id,...metrics}));
 }
}finally{await browser.close();}
