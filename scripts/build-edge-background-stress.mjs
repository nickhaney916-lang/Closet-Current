import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
const outDir=process.argv[2]||'benchmark/edge-background-stress';
await mkdir(outDir,{recursive:true});
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 for(const item of manifest.cases){
  const p=JSON.parse(await readFile('benchmark/modnet-predictions/'+item.id+'.modnet-prediction.json','utf8'));
  if(p.sourceSha256!==item.sourceSha256)throw Error('Source mismatch');
  const photo='data:image/jpeg;base64,'+(await readFile(join('benchmark/photos',item.image))).toString('base64');
  const result=await page.evaluate(async ({p,photo})=>{
   const image=new Image();image.src=photo;await image.decode();const w=image.naturalWidth,h=image.naturalHeight,n=w*h;
   if(w!==p.width||h!==p.height)throw Error('Resolution mismatch');
   const mask=new Uint8Array(n);let offset=0,on=false;
   for(const count of p.runs){if(!Number.isInteger(count)||count<0||offset+count>n)throw Error('Invalid RLE');if(on)mask.fill(1,offset,offset+count);offset+=count;on=!on;}
   if(offset!==n)throw Error('Incomplete RLE');
   const source=document.createElement('canvas');source.width=w;source.height=h;const sc=source.getContext('2d');sc.drawImage(image,0,0);const original=sc.getImageData(0,0,w,h);
   const alphas=[new Uint8Array(n),new Uint8Array(n)];let blendedBoundary=0,interiorChanged=0,addedForeground=0;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x;if(!mask[i])continue;
    alphas[0][i]=255;let neighbors=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h&&mask[yy*w+xx])neighbors++;}
    alphas[1][i]=neighbors===9?255:Math.max(85,Math.round(255*neighbors/9));
    if(alphas[1][i]!==255)blendedBoundary++;if(neighbors===9&&alphas[1][i]!==255)interiorChanged++;
   }
   for(let i=0;i<n;i++)if(!mask[i]&&(alphas[0][i]||alphas[1][i]))addedForeground++;
   if(addedForeground||interiorChanged)throw Error('Edge-only invariant failed');
   const pw=Math.min(500,w),ph=Math.round(pw*h/w),header=80,sh=document.createElement('canvas');sh.width=pw*2;sh.height=header+ph*3;
   const cc=sh.getContext('2d');cc.fillStyle='#fff';cc.fillRect(0,0,sh.width,sh.height);cc.fillStyle='#222';cc.font='bold 19px sans-serif';
   cc.fillText('MODNet 128 sharp',10,30);cc.fillText('Inside-edge blend',pw+10,30);
   const backgrounds=['#ffffff','#222222','#c9a5d5'];
   for(let row=0;row<3;row++){
    cc.fillStyle='#333';cc.font='13px sans-serif';cc.fillText(['White background','Dark background','Lavender background'][row],10,56);
    for(let variant=0;variant<2;variant++){
     const data=new ImageData(new Uint8ClampedArray(original.data),w,h);
     for(let i=0;i<n;i++)data.data[i*4+3]=alphas[variant][i];
     const cut=document.createElement('canvas');cut.width=w;cut.height=h;cut.getContext('2d').putImageData(data,0,0);
     const panel=document.createElement('canvas');panel.width=w;panel.height=h;const ctx=panel.getContext('2d');ctx.fillStyle=backgrounds[row];ctx.fillRect(0,0,w,h);ctx.drawImage(cut,0,0);
     cc.drawImage(panel,pw*variant,header+row*ph,pw,ph);
    }
   }
   return {png:sh.toDataURL('image/png').split(',')[1],blendedBoundary,addedForeground,interiorChanged,shadowRemoved:false};
  },{p,photo});
  await writeFile(join(outDir,item.id+'-edge-background-stress.png'),Buffer.from(result.png,'base64'));
  const {png,...report}=result;console.log('EDGE_BACKGROUND_STRESS '+JSON.stringify({id:item.id,...report}));
 }
}finally{await browser.close();}
