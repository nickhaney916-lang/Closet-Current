import sharp from 'sharp';import {mkdir,writeFile} from 'node:fs/promises';
import {fixture} from '../research/work52/fixtures.mjs';import {proposeIsolationCleanup} from '../research/work52/propose.mjs';import {applyMaskRefinement} from '../research/work49/refine-engine.mjs';
const out='benchmark/work52/synthetic';await mkdir(out,{recursive:true});const rows=[];
const edge=(mask,w,h)=>{const a=[];for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;if(mask[i]&&[i-1,i+1,i-w,i+w].some(j=>!mask[j]))a.push([x,y]);}return a;};
for(const [id,opt]of [['white-beige',{gap:12}],['cream-wall',{gap:14}],['light-cuffs',{gap:24}],['pale-straps',{gap:40}],['translucent',{gap:14,soft:true}],['identical',{gap:0}],['near-identical',{gap:5}],['busy-wall',{busy:true}]]){
 const f=fixture(opt),p=proposeIsolationCleanup(f),r=applyMaskRefinement(f,p.edits),w=f.width,h=f.height;
 const alpha=a=>Uint8Array.from({length:w*h},(_,i)=>+(a[i*4+3]>0)),old=alpha(f.rgba),next=alpha(r.rgba);
 const metrics=mask=>{let tp=0,fp=0,fn=0;for(let i=0;i<mask.length;i++){tp+=mask[i]&&f.truth[i]?1:0;fp+=mask[i]&&!f.truth[i]?1:0;fn+=!mask[i]&&f.truth[i]?1:0;}const e=edge(mask,w,h),t=edge(f.truth,w,h),hit=(a,b)=>a.filter(([x,y])=>b.some(([u,v])=>Math.hypot(x-u,y-v)<=2)).length/a.length,precision=hit(e,t),recall=hit(t,e);return {fabricRecall:tp/(tp+fn),backgroundPixels:fp,iou:tp/(tp+fp+fn),boundaryF1At2px:2*precision*recall/(precision+recall)||0};};
 const raw={width:w,height:h,channels:4};const original=new Uint8ClampedArray(f.rgba);for(let i=3;i<original.length;i+=4)original[i]=255;
 for(const [suffix,data]of [['original',original],['before',f.rgba],['after',r.rgba]])await sharp(Buffer.from(data),{raw}).png().toFile(`${out}/${id}-${suffix}.png`);
 rows.push({id,options:opt,before:metrics(old),after:metrics(next),removedPixels:r.removedPixels,edits:p.edits.length,reason:p.reason,grade:p.edits.length?'REVIEW':'FAIL',requiresHumanReview:true,truth:'synthetic authored mask; binary support includes translucent fabric'});
}
await writeFile(out+'/metrics.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));
