/** Independent rendered-pixel acceptance. Claims only visible change and distinct models,
 * not human photographic realism, physical collisions, fabric physics or phone hardware.
 * Filenames are composed exactly: "male" must never substring-match "female".
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';

const STEP=Object.freeze({
 female:Object.freeze({front:'01',side:'02',rear:'03'}),
 male:Object.freeze({front:'04',side:'05',rear:'06'})
});
export function exactVisualName(engine,width,figure,view){
 if(!['chromium','webkit'].includes(engine)||![320,390,430].includes(width)||
    !Object.hasOwn(STEP,figure)||!Object.hasOwn(STEP[figure],view))throw Error('M2 visual exact filename contract');
 const suffix=view==='rear'?'inferred-rear':view;
 return `${engine}-${width}-${STEP[figure][view]}-${figure}-${suffix}-provisional-blouse.png`;
}
export async function visiblePixelDelta(first,second,width){
 if(!Number.isInteger(width)||width<128)throw Error('M2 visible crop width');
 const left=Math.floor(width*.20),right=Math.floor(width*.80);
 const crop={left,top:85,width:right-left,height:210};
 const read=async buf=>sharp(buf).extract(crop).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
 const [a,b]=await Promise.all([read(first),read(second)]);
 assert.deepEqual([a.info.width,a.info.height,a.info.channels],[crop.width,crop.height,3]);
 assert.deepEqual([b.info.width,b.info.height,b.info.channels],[crop.width,crop.height,3]);
 let changed=0;
 for(let i=0;i<a.data.length;i+=3){
  if(Math.max(Math.abs(a.data[i]-b.data[i]),
     Math.abs(a.data[i+1]-b.data[i+1]),
     Math.abs(a.data[i+2]-b.data[i+2]))>12)changed++;
 }
 return changed/(crop.width*crop.height);
}
export async function verifyMission2VisualDelta(engine,root='benchmark/mission2-source-length'){
 if(!['chromium','webkit'].includes(engine))throw Error('M2 visual browser required');
 const stageData=new Map();
 for(const stage of ['before','after']){
  const dir=resolve(root,stage+'-'+engine);
  const results=JSON.parse(await readFile(join(dir,'results.json'),'utf8'));
  assert.deepEqual(results.errors,[],stage+' browser errors');
  assert.equal(results.crashes.length,0,stage+' browser crashes');
  assert.equal(results.screens.length,22,stage+' expected complete screenshot manifest');
  const receipts=new Map(results.screens.map(x=>[x.name,x]));
  assert.equal(receipts.size,22,'unique exact screenshot receipts');
  stageData.set(stage,{dir,receipts});
 }
 const read=async(stage,width,figure,view)=>{
  const {dir,receipts}=stageData.get(stage),name=exactVisualName(engine,width,figure,view);
  const receipt=receipts.get(name);
  assert.ok(receipt,'missing exact '+stage+'/'+name);
  assert.equal(receipt.width,width,'visual width manifest');
  const png=await readFile(join(dir,name));
  assert.equal(createHash('sha256').update(png).digest('hex'),receipt.sha256,'visual original PNG SHA');
  const meta=await sharp(png).metadata();
  assert.equal(meta.width,width,'visual PNG width');
  assert.ok(meta.height>=300,'visual screenshot height');
  return png;
 };
 const metrics=[];
 for(const width of [320,390,430]){
  for(const view of ['front','side','rear']){
   const pictures={};
   for(const stage of ['before','after']){
    pictures[stage]={};
    for(const figure of ['female','male'])
     pictures[stage][figure]=await read(stage,width,figure,view);
    const distinction=await visiblePixelDelta(pictures[stage].female,pictures[stage].male,width);
    assert.ok(distinction>=.04,
      `M2 ${engine} ${width} ${stage} ${view}: male/female render pixel identity or insufficient anatomy change (${distinction})`);
    metrics.push({width,view,stage,comparison:'male-v-female',changedFraction:distinction});
   }
   for(const figure of ['female','male']){
    const change=await visiblePixelDelta(pictures.before[figure],pictures.after[figure],width);
    assert.ok(change>=.04,
      `M2 ${engine} ${width} ${figure} ${view}: photographed geometry/texture not visibly changed (${change})`);
    metrics.push({width,view,figure,comparison:'source-length-before-v-after',changedFraction:change});
   }
  }
 }
 assert.equal(metrics.length,36);
 return {engine,comparisons:metrics.length,realScreensVerified:36,minChangedFraction:Math.min(...metrics.map(x=>x.changedFraction)),
  means:metrics,claim:'Visible source change and distinct rendered anatomical figures only; NO photorealism/collision certification'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 verifyMission2VisualDelta(process.argv[2]).then(x=>{
  console.log('M2_VISIBLE_DUAL_HUMANOID_'+x.engine+'_36_SHA_PIXEL_COMPARISONS_PASS');
  console.log(JSON.stringify({engine:x.engine,comparisons:x.comparisons,realScreensVerified:x.realScreensVerified,minChangedFraction:x.minChangedFraction,claim:x.claim}));
 }).catch(e=>{console.error(e);process.exitCode=1;});
}
