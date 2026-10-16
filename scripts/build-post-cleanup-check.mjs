import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
const out=process.argv[2]||'benchmark/post-cleanup-check';
await mkdir(out,{recursive:true});
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 for(const item of manifest.cases){
  const p=JSON.parse(await readFile('benchmark/modnet-predictions/'+item.id+'.modnet-prediction.json','utf8'));
  if(p.sourceSha256!==item.sourceSha256)throw Error('Source mismatch');
  const photo='data:image/jpeg;base64,'+(await readFile(join('benchmark/photos',item.image))).toString('base64');
  const result=await page.evaluate(async ({p,photo})=>{
   const img=new Image();img.src=photo;await img.decode();const w=img.naturalWidth,h=img.naturalHeight,n=w*h;
   if(w!==p.width||h!==p.height)throw Error('Dimension mismatch');
   const fg=new Uint8Array(n);let offset=0,on=false;for(const count of p.runs){if(!Number.isInteger(count)||count<0||offset+count>n)throw Error('Bad mask');if(on)fg.fill(1,offset,offset+count);offset+=count;on=!on;}if(offset!==n)throw Error('Mask length mismatch');
   const base=document.createElement('canvas');base.width=w;base.height=h;const c=base.getContext('2d');c.drawImage(img,0,0);const src=c.getImageData(0,0,w,h);
   const keep=new Uint8Array(fg);let removed=0,residualSimilar=0,residualDark=0,protectedDark=0;
   const measure=(mask,remove)=>{let similar=0,dark=0;
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;if(!mask[i])continue;let z=0,r=0,g=0,b=0;
     for(const j of [i-1,i+1,i-w,i+w])if(!mask[j]){r+=src.data[j*4];g+=src.data[j*4+1];b+=src.data[j*4+2];z++;}
     if(!z)continue;const k=i*4,R=src.data[k],G=src.data[k+1],B=src.data[k+2];
     const delta=(Math.abs(R-r/z)+Math.abs(G-g/z)+Math.abs(B-b/z))/3;
     if(delta<16){similar++;if(remove){keep[i]=0;removed++;}}
     else if((R+G+B)/3+25<(r+g+b)/(3*z)){dark++;if(remove)protectedDark++;}
    }return {similar,dark};
   };
   const before=measure(fg,true);const after=measure(keep,false);residualSimilar=after.similar;residualDark=after.dark;
   const alpha=(mask,x,y)=>{const i=y*w+x;if(!mask[i])return 0;let q=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<w&&yy<h&&mask[yy*w+xx])q++;}return q===9?255:Math.max(85,Math.round(255*q/9));};
   const pw=Math.min(w,520),ph=Math.round(pw*h/w),header=66,sheet=document.createElement('canvas');sheet.width=pw*3;sheet.height=ph+header;
   const sc=sheet.getContext('2d');sc.fillStyle='#fff';sc.fillRect(0,0,sheet.width,sheet.height);sc.fillStyle='#222';sc.font='bold 17px sans-serif';
   ['MODNet soft baseline','Selective cleanup','Cleanup + matte blend'].forEach((t,i)=>sc.fillText(t,i*pw+8,30));
   for(let v=0;v<3;v++){const mask=v===0?fg:keep;
    const pixels=new ImageData(new Uint8ClampedArray(src.data),w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;let a=alpha(mask,x,y);
     if(v===2&&a>0&&a<255)a=Math.round(a*.8+255*.2); // conservative transparency harmonization; RGB preserved
     pixels.data[4*i+3]=a;
    }
    const transparent=document.createElement('canvas');transparent.width=w;transparent.height=h;transparent.getContext('2d').putImageData(pixels,0,0);
    const panel=document.createElement('canvas');panel.width=w;panel.height=h;const pc=panel.getContext('2d');pc.fillStyle='#eee9f3';pc.fillRect(0,0,w,h);pc.drawImage(transparent,0,0);sc.drawImage(panel,v*pw,header,pw,ph);
   }
   return {png:sheet.toDataURL('image/png').split(',')[1],before,after,removed,protectedDark,retainedForeground:fg.reduce((n,v)=>n+v,0)-removed,warning:'Heuristic residuals are NOT verified shadows; garment-loss risk not measured against ground truth',verifiedClean:false};
  },{photo,p});
  await writeFile(join(out,item.id+'-postcheck.png'),Buffer.from(result.png,'base64'));
  const {png,...metrics}=result;console.log('POST_CLEANUP_CHECK '+JSON.stringify({id:item.id,...metrics}));
 }
}finally{await browser.close();}
