import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
const root=process.argv[2]||'benchmark/boundary-defect-review';
await mkdir(root,{recursive:true});
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 for(const item of manifest.cases){
  const mask=JSON.parse(await readFile('benchmark/modnet-predictions/'+item.id+'.modnet-prediction.json','utf8'));
  if(mask.sourceSha256!==item.sourceSha256)throw Error('Source mismatch');
  const photo='data:image/jpeg;base64,'+(await readFile(join('benchmark/photos',item.image))).toString('base64');
  const result=await page.evaluate(async ({photo,mask})=>{
   const image=new Image();image.src=photo;await image.decode();
   const w=image.naturalWidth,h=image.naturalHeight;
   if(w!==mask.width||h!==mask.height)throw Error('Dimensions mismatch');
   const fg=new Uint8Array(w*h);let offset=0,on=false;
   for(const n of mask.runs){if(!Number.isInteger(n)||n<0||offset+n>fg.length)throw Error('Bad mask');if(on)fg.fill(1,offset,offset+n);offset+=n;on=!on;}
   if(offset!==fg.length)throw Error('Incomplete mask');
   const source=document.createElement('canvas');source.width=w;source.height=h;
   const ctx=source.getContext('2d');ctx.drawImage(image,0,0);
   const rgba=ctx.getImageData(0,0,w,h);
   const at=(x,y)=>((y*w+x)*4);
   // Assess every boundary location against immediately adjacent background.
   // This is a review hint, NEVER proof that a foreground pixel is unwanted.
   const cls=new Uint8Array(w*h);let similarity=0,dark=0,boundary=0;
   for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    const i=y*w+x;if(!fg[i])continue;
    let neighbors=0,rr=0,gg=0,bb=0;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
     const xx=x+dx,yy=y+dy;if(fg[yy*w+xx])continue;
     const k=at(xx,yy);rr+=rgba.data[k];gg+=rgba.data[k+1];bb+=rgba.data[k+2];neighbors++;
    }
    if(!neighbors)continue;boundary++;
    const k=4*i,r=rgba.data[k],g=rgba.data[k+1],b=rgba.data[k+2];
    const br=rr/neighbors,bg=gg/neighbors,bl=bb/neighbors;
    const delta=(Math.abs(r-br)+Math.abs(g-bg)+Math.abs(b-bl))/3;
    const brightness=(r+g+b)/3,adjacentBrightness=(br+bg+bl)/3;
    if(delta<16){cls[i]=1;similarity++;}
    else if(brightness+25<adjacentBrightness){cls[i]=2;dark++;}
   }
   const width=Math.min(650,w),height=Math.round(width*h/w),header=75;
   const sheet=document.createElement('canvas');sheet.width=width*2;sheet.height=height+header;
   const out=sheet.getContext('2d');out.fillStyle='#fff';out.fillRect(0,0,sheet.width,sheet.height);
   out.fillStyle='#222';out.font='bold 20px sans-serif';out.fillText('Original photograph',12,30);out.fillText('MODNet boundary risk overlay',width+12,30);
   out.font='14px sans-serif';out.fillText('Pink: background-like · Cyan: darker than surroundings',width+12,54);
   out.drawImage(source,0,header,width,height);
   const overlay=new ImageData(new Uint8ClampedArray(rgba.data),w,h);
   for(let i=0;i<cls.length;i++){
    if(cls[i]===1){overlay.data[4*i]=255;overlay.data[4*i+1]=15;overlay.data[4*i+2]=180;}
    if(cls[i]===2){overlay.data[4*i]=0;overlay.data[4*i+1]=210;overlay.data[4*i+2]=245;}
   }
   const review=document.createElement('canvas');review.width=w;review.height=h;review.getContext('2d').putImageData(overlay,0,0);
   out.drawImage(review,width,header,width,height);
   return {png:sheet.toDataURL('image/png').split(',')[1],boundary,backgroundSimilarHints:similarity,darkBoundaryHints:dark,warning:'Only one-pixel perimeter review hints. Neither label proves shadow or leakage.'};
  },{photo,mask});
  await writeFile(join(root,item.id+'-boundary-risks.png'),Buffer.from(result.png,'base64'));
  const {png,...summary}=result;
  console.log('BOUNDARY_REVIEW '+JSON.stringify({id:item.id,...summary,reviewOnly:true,productionUnchanged:true}));
 }
}finally{await browser.close();}
