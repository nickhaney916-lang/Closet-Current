import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {footwearShadowCandidates} from '../benchmark/footwear-shadow-candidates.mjs';
const output=process.argv[2]||'benchmark/footwear-shadow-review';await mkdir(output,{recursive:true});
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 for(const id of ['commons-0079','commons-0094']){
  const entry=manifest.cases.find(c=>c.id===id);if(!entry)throw Error('Unknown case');
  const prediction=JSON.parse(await readFile('benchmark/modnet-predictions/'+id+'.modnet-prediction.json','utf8'));
  if(prediction.sourceSha256!==entry.sourceSha256)throw Error('Photo hash mismatch');
  const {rows,candidatePixels}=footwearShadowCandidates(prediction);
  const source=await readFile(join('benchmark/photos',entry.image));
  const png=await page.evaluate(async ({src,prediction,rows})=>{
   const image=new Image();image.src=src;await image.decode();
   if(image.naturalWidth!==prediction.width||image.naturalHeight!==prediction.height)throw Error('Dimensions changed');
   const width=prediction.width,height=prediction.height;
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   const context=canvas.getContext('2d');context.drawImage(image,0,0);
   const mask=new Uint8Array(width*height);let at=0,foreground=0;
   for(const count of prediction.runs){if(!Number.isInteger(count)||count<0||at+count>mask.length)throw Error('Invalid run');if(foreground)mask.fill(1,at,at+count);at+=count;foreground=1-foreground;}
   if(at!==mask.length)throw Error('Incomplete mask');
   const rowSet=new Set(rows.map(r=>r.y)),overlay=context.getImageData(0,0,width,height);
   for(let y=0;y<height;y++){if(!rowSet.has(y))continue;for(let x=0;x<width;x++){
    const pos=y*width+x;if(!mask[pos])continue;const k=pos*4;overlay.data[k]=255;overlay.data[k+1]=15;overlay.data[k+2]=190;overlay.data[k+3]=255;
   }}
   context.putImageData(overlay,0,0);return canvas.toDataURL('image/png').split(',')[1];
  },{src:'data:image/jpeg;base64,'+source.toString('base64'),prediction,rows});
  await writeFile(join(output,id+'-shadow-candidates.png'),Buffer.from(png,'base64'));
  console.log('FOOTWEAR_SHADOW_OVERLAY '+JSON.stringify({id,candidatePixels,rows:rows.length,reviewOnly:true}));
 }
}finally{await browser.close();}
