import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
const output=process.argv[2]||'benchmark/selective-boundary-proposals';
await mkdir(output,{recursive:true});
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 for(const item of manifest.cases){
  const prediction=JSON.parse(await readFile('benchmark/modnet-predictions/'+item.id+'.modnet-prediction.json','utf8'));
  if(prediction.sourceSha256!==item.sourceSha256)throw Error('Unverified prediction');
  const photo='data:image/jpeg;base64,'+(await readFile(join('benchmark/photos',item.image))).toString('base64');
  const result=await page.evaluate(async ({photo,prediction})=>{
   const image=new Image();image.src=photo;await image.decode();
   const w=image.naturalWidth,h=image.naturalHeight;
   if(w!==prediction.width||h!==prediction.height)throw Error('Dimension mismatch');
   const fg=new Uint8Array(w*h);let off=0,on=false;
   for(const n of prediction.runs){if(!Number.isInteger(n)||n<0||off+n>fg.length)throw Error('Invalid mask');if(on)fg.fill(1,off,off+n);off+=n;on=!on;}
   if(off!==fg.length)throw Error('Incomplete mask');
   const base=document.createElement('canvas');base.width=w;base.height=h;
   const bc=base.getContext('2d');bc.drawImage(image,0,0);
   const source=bc.getImageData(0,0,w,h);
   const similar=new Uint8Array(w*h),protect=new Uint8Array(w*h);
   let pink=0,cyan=0;
   for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    const i=y*w+x;if(!fg[i])continue;
    let count=0,rr=0,gg=0,bb=0;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
     const j=(y+dy)*w+x+dx;if(fg[j])continue;
     const k=j*4;rr+=source.data[k];gg+=source.data[k+1];bb+=source.data[k+2];count++;
    }
    if(!count)continue;
    const k=i*4,r=source.data[k],g=source.data[k+1],b=source.data[k+2];
    const delta=(Math.abs(r-rr/count)+Math.abs(g-gg/count)+Math.abs(b-bb/count))/3;
    const brightness=(r+g+b)/3,adjacent=(rr+gg+bb)/(3*count);
    if(delta<16){similar[i]=1;pink++;}
    else if(brightness+25<adjacent){protect[i]=1;cyan++;}
   }
   // Conservative single-pixel candidate ONLY. There is no basis for deleting inward-connected garment pixels.
   const alpha=new Uint8Array(w*h);let removed=0;
   for(let i=0;i<fg.length;i++){
    if(!fg[i])continue;
    if(similar[i]){removed++;continue;}
    alpha[i]=255;
   }
   // Two alpha variants: existing softened baseline and optional pink-candidate removal with cyan unchanged.
   const soft=(m,i,x,y)=>{if(!m[i])return 0;let neighbors=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<w&&yy<h&&m[yy*w+xx])neighbors++;
   }return neighbors===9?255:Math.max(85,Math.round(255*neighbors/9));};
   const pw=Math.min(540,w),ph=Math.round(pw*h/w),header=83;
   const sheet=document.createElement('canvas');sheet.width=pw*3;sheet.height=header+ph;
   const out=sheet.getContext('2d');out.fillStyle='#fff';out.fillRect(0,0,sheet.width,sheet.height);out.fillStyle='#222';
   out.font='bold 19px sans-serif';out.fillText('Original',10,27);out.fillText('MODNet + soft edge',pw+10,27);out.fillText('Pink candidate removed',pw*2+10,27);
   out.font='14px sans-serif';out.fillText('Risk: removal may damage real fabric · visual review only',10,55);
   out.drawImage(base,0,header,pw,ph);
   for(let variant=1;variant<3;variant++){
    const m=variant===1?fg:alpha;
    const data=new ImageData(new Uint8ClampedArray(source.data),w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;data.data[i*4+3]=soft(m,i,x,y);}
    const transparent=document.createElement('canvas');transparent.width=w;transparent.height=h;
    transparent.getContext('2d').putImageData(data,0,0);
    const panel=document.createElement('canvas');panel.width=w;panel.height=h;
    const pc=panel.getContext('2d');pc.fillStyle='#eee9f3';pc.fillRect(0,0,w,h);pc.drawImage(transparent,0,0);
    out.drawImage(panel,pw*variant,header,pw,ph);
   }
   return {png:sheet.toDataURL('image/png').split(',')[1],pinkCandidates:pink,protectedDarkBoundary:cyan,removed,reviewOnly:true,notGroundTruth:true};
  },{photo,prediction});
  await writeFile(join(output,item.id+'-selective-candidate.png'),Buffer.from(result.png,'base64'));
  const {png,...metrics}=result;console.log('SELECTIVE_BOUNDARY_PROPOSAL '+JSON.stringify({id:item.id,...metrics}));
 }
}finally{await browser.close();}
