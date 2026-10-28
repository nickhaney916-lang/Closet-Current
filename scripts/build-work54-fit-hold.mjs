import {readFile,writeFile,cp,rm,mkdir,readdir} from 'node:fs/promises';import assert from 'node:assert/strict';
export const PARENT='dist-family-alpha-68-review-fit-pale-HOLD',OUTPUT='dist-work54-natural-fit-HOLD',UI='__alpha_research/work47/editor.mjs';
export function patchEditor(s){const once=(a,b)=>{assert.equal(s.split(a).length,2,'Pinned Work382 editor hook changed');s=s.replace(a,b);};
 s="import {suggestStartingFit} from '../work54/starting-fit.mjs';\n"+s;
 once(' let points=[],disposed=false', ' let startingAdjust=null;let points=[],disposed=false');
 once(' const sourceBinding=r=>',` const starting=make('button','Suggest starting fit');starting.type='button';starting.style.cssText='min-height:48px;font:inherit';panel.insertBefore(starting,select);
 starting.onclick=event=>{
  if(!event.isTrusted||!check())return;
  if(records.has(select.value)){status.textContent='Existing manual or restored fit kept. Reset only if you want a new starting suggestion.';return;}
  try{const source=current(),probe=make('canvas');probe.width=source.naturalWidth;probe.height=source.naturalHeight;const ctx=probe.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);const rgba=ctx.getImageData(0,0,probe.width,probe.height).data;
   const suggested=suggestStartingFit({width:probe.width,height:probe.height,rgba},{slot:source.dataset.slot.startsWith('layer')?'layer':source.dataset.slot});
   if(suggested.status!=='suggested'){status.textContent='No reliable starting landmarks. Keep the photo fallback or mark shoulders / waistband manually.';return;}
   points=suggested.profile.anchors;startingAdjust=suggested.adjust;apply.onclick();if(records.has(select.value))status.textContent='Starting fit proposed from the reviewed cutout. Inspect shoulders, waist and sleeves; adjust manually. No approval granted.';
  }catch{status.textContent='Starting fit unavailable. Existing photo and manual controls kept.';}finally{startingAdjust=null;}
 };
 const sourceBinding=r=>`);
 once('adjust:{dx:0,dy:0,scale:1,edgeCleanup:false,binaryEdgeReview:false}};try{const fitting=paintGarmentFit(output,source,record.profile);', 'adjust:startingAdjust||{dx:0,dy:0,scale:1,edgeCleanup:false,binaryEdgeReview:false}};try{const fitting=paintGarmentFit(output,source,record.profile,record.adjust);');
 once('slides.dispose();traceLeft.onclick=null;', 'slides.dispose();starting.onclick=null;traceLeft.onclick=null;');return s;
}
await rm(OUTPUT,{recursive:true,force:true});await cp(PARENT,OUTPUT,{recursive:true});await mkdir(OUTPUT+'/__alpha_research/work54',{recursive:true});await cp('research/work54/starting-fit.mjs',OUTPUT+'/__alpha_research/work54/starting-fit.mjs');await writeFile(OUTPUT+'/'+UI,patchEditor(await readFile(PARENT+'/'+UI,'utf8')));
// All relative Work47 imports, not just the first one, must use the inherited source.
let gallery=patchEditor(await readFile('research/work47/editor.mjs','utf8'));gallery=gallery.replaceAll("from './","from '../work47/");await writeFile('research/work54/editor.generated.mjs',gallery);
async function verify(p=''){for(const e of await readdir(PARENT+'/'+p,{withFileTypes:true})){assert.ok(!e.isSymbolicLink());const f=p+e.name;if(e.isDirectory())await verify(f+'/');else if(f!==UI)assert.deepEqual(await readFile(PARENT+'/'+f),await readFile(OUTPUT+'/'+f),'Unexpected source/recipe/fit/Auth/storage modification '+f);}}await verify();console.log('WORK54_HOLD: existing fit engine, recipes, source RGB/JPEG/masks, isolation and private app unchanged; review-only starting-fit action');
