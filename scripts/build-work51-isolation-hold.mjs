import {readFile,writeFile,cp,mkdir,readdir,rm} from 'node:fs/promises';import assert from 'node:assert/strict';
export const PARENT='dist-family-alpha-63-auto-portable-HOLD',OUTPUT='dist-work51-isolation-HOLD';
const UI='__alpha_research/family-alpha-35/review-cutout.mjs';
export function patchReview(s){
 const once=(a,b)=>{assert.equal(s.split(a).length,2,'Pinned automatic-review hook changed');s=s.replace(a,b);};
 s="import {proposeIsolationCleanup} from '../work51/propose.mjs';\n"+s;
 once("  const undo=button('Undo eraser')", "  const auto=button('Find automatic cleanup');controls.append(auto);\n  const undo=button('Undo eraser')");
 once('  function paint(){',`  auto.onclick=(event)=>{
   if(!event.isTrusted||finished||signal?.aborted||!isActive()||edits.length)return;
   try{const proposal=proposeIsolationCleanup(base,{category:detail.category,existingEdits:edits});
    if(!proposal.edits.length){recipeNotice.textContent='No safe automatic proposal. Previous cutout and recovery base kept; review manually.';return;}
    edits.push(...proposal.edits);redoStack.length=0;ack.checked=false;shoes.checked=false;paint();
    recipeNotice.textContent='Automatic cleanup proposal applied for review. Check every fabric edge; Undo or Reset restores the source. No approval granted.';
   }catch{recipeNotice.textContent='Automatic cleanup unavailable; previous cutout kept.';}
  };
  function paint(){`);
 once('    undo.disabled=!edits.length', '    auto.disabled=edits.length>0||outlineMode;undo.disabled=!edits.length');
 once('   outline.onclick=null;', '   auto.onclick=null;outline.onclick=null;');
 return s;
}
await rm(OUTPUT,{recursive:true,force:true});await cp(PARENT,OUTPUT,{recursive:true});await mkdir(OUTPUT+'/__alpha_research/work51',{recursive:true});await cp('research/work51/propose.mjs',OUTPUT+'/__alpha_research/work51/propose.mjs');
await writeFile(OUTPUT+'/'+UI,patchReview(await readFile(PARENT+'/'+UI,'utf8')));
let view=patchReview(await readFile('research/work49/review-cutout.mjs','utf8'));view=view.replace("from './mask-controls.mjs'","from '../work49/mask-controls.mjs'").replace("from './portable-edits.mjs'","from '../work49/portable-edits.mjs'");await writeFile('research/work51/review-cutout.generated.mjs',view);
async function verify(p=''){for(const e of await readdir(PARENT+'/'+p,{withFileTypes:true})){assert.ok(!e.isSymbolicLink());const f=p+e.name;if(e.isDirectory())await verify(f+'/');else if(f!==UI)assert.deepEqual(await readFile(PARENT+'/'+f),await readFile(OUTPUT+'/'+f),'Unexpected source/recipe/fit/Auth/storage change '+f);}}await verify();console.log('WORK51_BUILD_HOLD: canonical source, recipes, provider, fit, Auth, backup unchanged; review-only planner added');
