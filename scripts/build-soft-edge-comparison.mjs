import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
const out=process.argv[2]||'benchmark/soft-edge-comparison';
await mkdir(out,{recursive:true});
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 for(const entry of manifest.cases){
  const pred=JSON.parse(await readFile('benchmark/modnet-predictions/'+entry.id+'.modnet-prediction.json','utf8'));
  if(pred.sourceSha256!==entry.sourceSha256)throw Error('Source hash mismatch');
  const photo='data:image/jpeg;base64,'+(await readFile(join('benchmark/photos',entry.image))).toString('base64');
  const result=await page.evaluate(async ({photo,pred})=>{
   const img=new Image();img.src=photo;await img.decode();
   const w=img.naturalWidth,h=img.naturalHeight;
   if(w!==pred.width||h!==pred.height)throw Error('Native resolution mismatch');
   const mask=new Uint8Array(w*h);let offset=0,on=false;
   for(const n of pred.runs){if(!Number.isInteger(n)||n<0||offset+n>mask.length)throw Error('Bad mask runs');if(on)mask.fill(1,offset,offset+n);offset+=n;on=!on;}
   if(offset!==mask.length)throw Error('Incomplete mask');
   const base=document.createElement('canvas');base.width=w;base.height=h;const bc=base.getContext('2d');bc.drawImage(img,0,0);
   const original=bc.getImageData(0,0,w,h);
   // Only feather original foreground boundary: never add background pixels.
   const soft=new Uint8Array(mask.length);let softened=0;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x;if(!mask[i])continue;
    let count=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
     const xx=x+dx,yy=y+dy;
     if(xx>=0&&yy>=0&&xx<w&&yy<h&&mask[yy*w+xx])count++;
    }
    soft[i]=count===9?255:Math.max(85,Math.round(255*count/9));
    if(soft[i]!==255)softened++;
   }
   const rowCounts=new Uint32Array(h);let first=h,last=-1;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[y*w+x]){rowCounts[y]++;first=Math.min(first,y);last=Math.max(last,y);}
   const candidateRows=new Set();
   if(last>=first){const start=Math.floor(first+(last-first)*.7);
    for(let y=start;y<=last;y++)if(rowCounts[y]>0&&rowCounts[y]/w<.12)candidateRows.add(y);
   }
   const panelWidth=Math.min(500,w),panelHeight=Math.round(panelWidth*h/w),header=78;
   const sheet=document.createElement('canvas');sheet.width=panelWidth*3;sheet.height=panelHeight+header;
   const sc=sheet.getContext('2d');sc.fillStyle='#fff';sc.fillRect(0,0,sheet.width,sheet.height);
   sc.fillStyle='#222';sc.font='bold 20px sans-serif';sc.fillText('MODNet · hard',10,37);sc.fillText('Soft edge',panelWidth+10,37);sc.fillText('Soft + shadow candidate',panelWidth*2+10,37);sc.font='14px sans-serif';sc.fillText('Candidate removal may cut actual garments — review only',10,65);
   for(let variant=0;variant<3;variant++){
    const cut=document.createElement('canvas');cut.width=w;cut.height=h;
    const data=new ImageData(new Uint8ClampedArray(original.data),w,h);
    for(let i=0;i<mask.length;i++)data.data[i*4+3]=variant===0?(mask[i]?255:0):variant===1?soft[i]:(candidateRows.has(Math.floor(i/w))?0:soft[i]);
    cut.getContext('2d').putImageData(data,0,0);
    const bg=document.createElement('canvas');bg.width=w;bg.height=h;
    const c=bg.getContext('2d');c.fillStyle='#eee9f3';c.fillRect(0,0,w,h);c.drawImage(cut,0,0);
    sc.drawImage(bg,variant*panelWidth,header,panelWidth,panelHeight);
   }
   return {image:sheet.toDataURL('image/png').split(',')[1],softened,candidatePixels:[...candidateRows].reduce((n,y)=>n+rowCounts[y],0),originalForeground:mask.reduce((a,b)=>a+b,0),method:'inside-only feather; experimental lower-row removal may cut real garment'};
  },{photo,pred});
  await writeFile(join(out,entry.id+'-hard-soft-shadow.png'),Buffer.from(result.image,'base64'));
  console.log('SOFT_EDGE_EXPERIMENT '+JSON.stringify({id:entry.id,softened:result.softened,candidatePixels:result.candidatePixels,originalForeground:result.originalForeground,method:result.method,reviewOnly:true}));
 }
}finally{await browser.close();}
