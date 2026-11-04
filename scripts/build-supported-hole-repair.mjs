import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {proposeSupportedHoleRepair} from '../benchmark/propose-supported-hole-repair.mjs';
const output=process.argv[2]||'benchmark/supported-hole-repair';
await mkdir(output,{recursive:true});
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const cases=[];
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 for(const item of manifest.cases){
  const baseline=JSON.parse(await readFile('benchmark/modnet-predictions/'+item.id+'.modnet-prediction.json','utf8'));
  const support=JSON.parse(await readFile('benchmark/segmentation-predictions/'+item.id+'.prediction.json','utf8'));
  const bytes=await readFile(join('benchmark/photos',item.image));
  if(baseline.sourceSha256!==item.sourceSha256||createHash('sha256').update(bytes).digest('hex')!==item.sourceSha256)throw Error('Unverified original');
  const result=proposeSupportedHoleRepair(baseline,support);
  const png=await page.evaluate(async ({photo,baseline,candidate})=>{
   const image=new Image();image.src=photo;await image.decode();
   const w=image.naturalWidth,h=image.naturalHeight;if(w!==baseline.width||h!==baseline.height)throw Error('Photo dimensions differ');
   const decode=p=>{const m=new Uint8Array(w*h);let i=0,on=false;for(const count of p.runs){if(on)m.fill(1,i,i+count);i+=count;on=!on;}return m;};
   const original=document.createElement('canvas');original.width=w;original.height=h;const oc=original.getContext('2d');oc.drawImage(image,0,0);const src=oc.getImageData(0,0,w,h);
   const a=decode(baseline),b=decode(candidate),pw=Math.min(520,w),ph=Math.round(pw*h/w),header=75;
   const sheet=document.createElement('canvas');sheet.width=pw*3;sheet.height=ph+header;const c=sheet.getContext('2d');c.fillStyle='white';c.fillRect(0,0,sheet.width,sheet.height);c.fillStyle='#222';c.font='bold 18px sans-serif';
   ['Original','Sharp MODNet 128','Supported interior repair'].forEach((t,i)=>c.fillText(t,i*pw+10,27));c.font='14px sans-serif';c.fillText('Experimental · no shadow removal · original RGB retained',10,54);c.drawImage(original,0,header,pw,ph);
   for(const [v,m] of [a,b].entries()){
    const pixels=new ImageData(new Uint8ClampedArray(src.data),w,h);for(let i=0;i<m.length;i++)pixels.data[4*i+3]=m[i]?255:0;
    const cutout=document.createElement('canvas');cutout.width=w;cutout.height=h;cutout.getContext('2d').putImageData(pixels,0,0);
    c.fillStyle='#eee9f3';c.fillRect((v+1)*pw,header,pw,ph);c.drawImage(cutout,(v+1)*pw,header,pw,ph);
   }
   return sheet.toDataURL('image/png').split(',')[1];
  },{photo:'data:image/jpeg;base64,'+bytes.toString('base64'),baseline,candidate:result.prediction});
  await writeFile(join(output,item.id+'-supported-repair.png'),Buffer.from(png,'base64'));
  await writeFile(join(output,item.id+'.candidate.json'),JSON.stringify(result.prediction));
  const {prediction,...metrics}=result;cases.push({id:item.id,...metrics});console.log('SUPPORTED_HOLE_REPAIR '+JSON.stringify(cases.at(-1)));
 }
}finally{await browser.close();}
await writeFile(join(output,'summary.json'),JSON.stringify({cases,baselineAlpha:'hard',foregroundThreshold:128,sourceRgbPreserved:true,reviewOnly:true,productionAuthorized:false},null,2));
