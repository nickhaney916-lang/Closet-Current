import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
const out=process.argv[2]||'benchmark/footwear-edge-contrast';
await mkdir(out,{recursive:true});
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage(),reports=[];
 for(const id of ['commons-0079','commons-0094']){
  const entry=manifest.cases.find(c=>c.id===id);
  const [photo,seg,mod]=await Promise.all([
   readFile(join('benchmark/photos',entry.image)),
   readFile('benchmark/segmentation-predictions/'+id+'.prediction.json','utf8').then(JSON.parse),
   readFile('benchmark/modnet-predictions/'+id+'.modnet-prediction.json','utf8').then(JSON.parse)
  ]);
  if(seg.sourceSha256!==entry.sourceSha256||mod.sourceSha256!==entry.sourceSha256||seg.width!==mod.width||seg.height!==mod.height)throw Error('Source mismatch');
  const report=await page.evaluate(async({src,seg,mod})=>{
   const image=new Image();image.src=src;await image.decode();const w=mod.width,h=mod.height;
   if(image.naturalWidth!==w||image.naturalHeight!==h)throw Error('Source dimensions mismatch');
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
   const pixels=ctx.getImageData(0,0,w,h).data;
   function unpack(p){let i=0,bit=0;const v=new Uint8Array(w*h);for(const run of p.runs){if(!Number.isInteger(run)||run<0||i+run>v.length)throw Error('Invalid mask');if(bit)v.fill(1,i,i+run);i+=run;bit=1-bit;}if(i!==v.length)throw Error('Incomplete mask');return v;}
   const a=unpack(seg),b=unpack(mod);let first=h,last=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(b[y*w+x]){first=Math.min(first,y);last=Math.max(last,y);}
   const start=Math.floor(first+(last-first)*.65);
   const luminosity=i=>.2126*pixels[i*4]+.7152*pixels[i*4+1]+.0722*pixels[i*4+2];
   const groups={modnetOnly:{count:0,gradientSum:0,strongEdges:0},both:{count:0,gradientSum:0,strongEdges:0}};
   for(let y=Math.max(1,start);y<Math.min(h-1,last+1);y++)for(let x=1;x<w-1;x++){
    const i=y*w+x;if(!b[i])continue;
    const group=a[i]?'both':'modnetOnly',g=groups[group];
    const gradient=Math.max(Math.abs(luminosity(i-1)-luminosity(i+1)),Math.abs(luminosity(i-w)-luminosity(i+w)));
    g.count++;g.gradientSum+=gradient;if(gradient>=35)g.strongEdges++;
   }
   return Object.fromEntries(Object.entries(groups).map(([key,value])=>[key,{pixels:value.count,meanLocalContrast:value.count?value.gradientSum/value.count:0,strongEdgeFraction:value.count?value.strongEdges/value.count:0}]));
  },{src:'data:image/jpeg;base64,'+photo.toString('base64'),seg,mod});
  reports.push({id,contrast:report,status:'exploratory-not-ground-truth'});
  console.log('FOOTWEAR_EDGE_CONTRAST '+JSON.stringify(reports.at(-1)));
 }
 await writeFile(join(out,'summary.json'),JSON.stringify({reviewOnly:true,results:reports},null,2));
}finally{await browser.close();}
