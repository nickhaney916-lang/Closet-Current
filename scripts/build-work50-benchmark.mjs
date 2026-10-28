import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {isolateGarment} from '../research/work50/isolate.mjs';
import {prepareBorderConnectedGarment} from '../research/family-alpha-30/clipping.mjs';
const m=JSON.parse(await readFile('benchmark/work47/manifest.json'));await mkdir('benchmark/work50/assets',{recursive:true});const rows=[];
for(const row of m.rows){
 const jpeg=await readFile(`benchmark/work47/assets/${row.id}.jpg`);if(createHash('sha256').update(jpeg).digest('hex')!==row.sourceSHA256)throw Error('Source photograph mismatch');
 const {data,info}=await sharp(jpeg).rotate().ensureAlpha().raw().toBuffer({resolveWithObject:true});const frame={width:info.width,height:info.height,rgba:new Uint8ClampedArray(data)};
 const old=prepareBorderConnectedGarment({...frame,data:frame.rgba},{category:row.category,sourceIdentity:row.id,sourceVersion:row.sourceSHA256}),previous=old.proposedCutout||(old.status==='prepared'?old:null);
 if(previous)await sharp(Buffer.from(previous.rgba),{raw:{width:previous.width,height:previous.height,channels:4}}).png().toFile(`benchmark/work50/assets/${row.id}-previous-auto.png`);
 const initialAlpha=row.hasCutout?new Uint8Array(await sharp(`benchmark/work47/assets/${row.id}.png`).extractChannel(3).raw().toBuffer()):null;
 const r=isolateGarment(frame,{category:row.category,initialAlpha});
 for(let p=0;p<data.length;p+=4)for(let c=0;c<3;c++)if(data[p+c]!==r.rgba[p+c])throw Error('Source RGB altered');
 const delta=Buffer.alloc(data.length);for(let i=0;i<info.width*info.height;i++){const changed=initialAlpha&&r.rgba[i*4+3]!==initialAlpha[i];delta.set(changed?[240,45,45,255]:[data[i*4],data[i*4+1],data[i*4+2],55],i*4);}await sharp(delta,{raw:info}).resize({width:480,withoutEnlargement:true}).png().toFile(`benchmark/work50/assets/${row.id}-delta.png`);
 const hasCutout=row.hasCutout||r.applied;
 if(hasCutout)await sharp(Buffer.from(r.rgba),{raw:info}).png().toFile(`benchmark/work50/assets/${row.id}.png`);
 const baseline=initialAlpha?Buffer.from(data):null;if(baseline){for(let i=0;i<initialAlpha.length;i++)baseline[i*4+3]=initialAlpha[i];await sharp(baseline,{raw:info}).png().toFile(`benchmark/work50/assets/${row.id}-baseline.png`);}
 const changed=initialAlpha?r.rgba.reduce((sum,v,i)=>sum+Number(i%4===3&&v!==initialAlpha[(i-3)/4]),0):null;
 rows.push({...row,hadCutout:row.hasCutout,hasCutout,previousAutomaticAvailable:!!previous,previousAutomaticStatus:old.status,previousAutomaticReason:old.reason||null,automaticApplied:r.applied,automaticReasons:r.reasons,metrics:r.metrics,changedAlphaPixels:changed,assessment:hasCutout?'REVIEW':'FAIL',ownerApproved:false,refinement:null});
 console.log(row.id,JSON.stringify({applied:r.applied,changed,reasons:r.reasons,removed:r.metrics.removed,unstable:r.metrics.thresholdDisagreementPixels,low:r.metrics.lowContrastPixels}));
}
await writeFile('benchmark/work50/manifest.json',JSON.stringify({...m,rows,release:'HOLD',ownerApproved:false,independentLicensedReferenceMasks:0},null,2));
