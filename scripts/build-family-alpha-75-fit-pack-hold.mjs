/** Exact #74 protected app plus local reviewed multi-garment fit pack. NO DEPLOY. */
import assert from 'node:assert/strict';
import {readFile,writeFile,cp,rm,mkdir,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build as build74,verify as verify74,OUTPUT as PARENT}
 from './build-family-alpha-74-work54-phone-hold.mjs';
export const OUTPUT='dist-family-alpha-75-outfit-fit-pack-HOLD';
export const EDITOR='__alpha_research/work47/editor.mjs';
export const PACK='__alpha_research/family-alpha-75/outfit-fit-pack.mjs';
export const MARKER='family-alpha-75-HOLD.json';
export const PARENT_SHA='90ec4ac471c255ea096edadaf1d86463d7951e3a';
const importLine="import {createOutfitFitPack,restoreOutfitFitPack} from '../family-alpha-75/outfit-fit-pack.mjs';\n";
function installPackControls(){
 const packTransfer=make('div'),packDownload=make('button','Download all reviewed outfit fits');
 const packUploadLabel=make('label','Restore all reviewed outfit fits JSON'),packUpload=make('input');
 packTransfer.style.cssText='display:grid;gap:8px;margin:10px 0';
 packUpload.type='file';packUpload.accept='.json,application/json';
 packUpload.setAttribute('aria-label','Restore all reviewed outfit fits JSON');
 packUploadLabel.append(packUpload);packTransfer.append(packDownload,packUploadLabel);
 const packURLs=new Set();
}
function installPackHandlers(){
 const packEntries=()=>[...records.entries()].sort(([a],[b])=>a.localeCompare(b))
  .map(([slot,record])=>({slot,record,source:sourceBinding(record)}));
 const packIsSame=entries=>active()&&entries.length===records.size&&entries.every(e=>
  records.get(e.slot)===e.record&&e.record.source.isConnected&&
  sourceBinding(e.record).png===e.source.png&&
  sourceBinding(e.record).width===e.source.width&&sourceBinding(e.record).height===e.source.height);
 packDownload.onclick=async event=>{
  if(!event.isTrusted||!check())return;
  const entries=packEntries();
  try{
   const json=await createOutfitFitPack(entries);
   if(!packIsSame(entries))return;
   const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
   packURLs.add(url);
   const link=make('a');link.href=url;link.download='closet-current-all-outfit-fits.json';
   panel.append(link);link.click();link.remove();
   setTimeout(()=>{if(packURLs.delete(url))URL.revokeObjectURL(url);},1500);
   status.textContent='Local outfit fit pack downloaded. No garment photos, approval or cloud save.';
  }catch{if(active())status.textContent='No reviewed outfit fits to export, or source changed. Previous previews preserved.';}
 };
 packUpload.onchange=async()=>{
  if(!check())return;
  const file=packUpload.files?.[0];packUpload.value='';
  if(!file||file.size>42000||file.size<150){
   status.textContent='Choose a small local fit pack for the same reviewed outfit.';return;
  }
  const entries=packEntries();
  try{
   const json=await file.text();
   if(!packIsSame(entries))return;
   const restored=await restoreOutfitFitPack(entries,json);
   if(!packIsSame(entries))return;
   const before=restored.map(({record})=>({
    record,profile:record.profile,adjust:record.adjust,traces:record.traces,canvas:record.canvas
   }));
   try{
    for(const row of restored){
     if(!packIsSame(entries))throw Error('Source or account changed');
     row.record.profile=row.restored.profile;row.record.adjust=row.restored.adjust;
     row.record.traces=row.restored.traces;
     repaintReviewedPreviewAtomic(row.record,{
      doc,render:paintGarmentFit,isCurrent:()=>packIsSame(entries)
     });
    }
    if(foreground)protectCollarPixels(foreground,[...records.values()].map(r=>r.canvas));
    slides.sync();
    const chosen=records.get(select.value);
    edgeToggle.checked=chosen?.adjust.edgeCleanup===true;
    binaryToggle.checked=chosen?.adjust.binaryEdgeReview===true;
    status.textContent='All fit geometry restored for the same reviewed outfit. Inspect every garment; no approval granted.';
   }catch{
    for(const b of before){
     if(b.record.canvas!==b.canvas){
      if(b.record.canvas.isConnected)b.record.canvas.replaceWith(b.canvas);
      b.record.canvas=b.canvas;
     }
     b.record.profile=b.profile;b.record.adjust=b.adjust;b.record.traces=b.traces;
    }
    if(active())slides.sync();
    if(active())status.textContent='Outfit fit pack rejected; all prior previews preserved.';
   }
  }catch{if(active())status.textContent='Outfit fit pack invalid or belongs to different reviewed garments; no changes applied.';}
 };
}
const body=fn=>fn.toString().replace(/^function \w+\(\)\s*\{/,'').replace(/\}\s*$/,'');
export function patchEditor(original){
 assert.ok(typeof original==='string');
 assert.equal(original.split("import {mountRigidFitControls}").length,2);
 assert.equal(original.split(' const fitTransfer=make(').length,2);
 assert.equal(original.split('fitTransfer,buttons,status);container.append(panel);').length,2);
 assert.equal(original.split(' function redraw(record){').length,2);
 assert.equal(original.split("fitDownload.onclick=null;fitUpload.onchange=null;").length,2);
 assert.ok(original.includes('Suggest starting fit')&&!original.includes('packDownload'));
 return importLine+original
  .replace(' const fitTransfer=make(',body(installPackControls)+'\n const fitTransfer=make(')
  .replace('fitTransfer,buttons,status);container.append(panel);','fitTransfer,packTransfer,buttons,status);container.append(panel);')
  .replace(' function redraw(record){',body(installPackHandlers)+'\n function redraw(record){')
  .replace('fitDownload.onclick=null;fitUpload.onchange=null;',
   "fitDownload.onclick=null;fitUpload.onchange=null;packDownload.onclick=null;packUpload.onchange=null;for(const u of packURLs)URL.revokeObjectURL(u);packURLs.clear();");
}
async function files(dir,p=''){
 const output=[];
 for(const e of await readdir(join(dir,p),{withFileTypes:true})){
  assert.ok(!e.isSymbolicLink());const rel=p+e.name;
  if(e.isDirectory())output.push(...await files(dir,rel+'/'));
  else{assert.ok(e.isFile());output.push(rel);}
 }
 return output.sort();
}
export async function verify(){
 await verify74();
 const previous=await files(PARENT),actual=await files(OUTPUT);
 assert.deepEqual(actual,[...previous,PACK,MARKER].sort(),'Unexpected changed app assets');
 for(const f of previous){
  const a=await readFile(join(PARENT,f)),b=await readFile(join(OUTPUT,f));
  if(f===EDITOR)assert.equal(b.toString(),patchEditor(a.toString()));
  else assert.deepEqual(b,a,'Unauthorized Auth, original JPEG, mask, outfit, storage, backup, phone QA or garment change: '+f);
 }
 assert.deepEqual(await readFile(join(OUTPUT,PACK)),await readFile('research/family-alpha-75/outfit-fit-pack.mjs'));
 const m=JSON.parse(await readFile(join(OUTPUT,MARKER),'utf8'));
 assert.equal(m.base,PARENT_SHA);
 assert.deepEqual(m.changed,[EDITOR]);assert.deepEqual(m.added,[PACK]);
 assert.equal(m.decision,'HOLD');
 for(const flag of ['releaseAuthorized','deployAuthorized','productionModified','stagingModified','realDeviceVerified','humanVisualApproved'])assert.equal(m[flag],false);
 const pack=await readFile('research/family-alpha-75/outfit-fit-pack.mjs','utf8');
 for(const re of [/\bfetch\s*\(/,/indexedDB/,/localStorage/,/sendBeacon/,/ownerApproved:\s*true/])assert.doesNotMatch(pack,re);
 return {decision:'HOLD',fitPackLocalOnly:true,sourceBoundToExactReviewedPNG:true,unchangedOriginalAndOwnerAssets:true,releaseAuthorized:false};
}
export async function build(){
 await build74();
 await rm(OUTPUT,{recursive:true,force:true});await cp(PARENT,OUTPUT,{recursive:true});
 await mkdir(join(OUTPUT,'__alpha_research/family-alpha-75'),{recursive:true});
 await cp('research/family-alpha-75/outfit-fit-pack.mjs',join(OUTPUT,PACK));
 await writeFile(join(OUTPUT,EDITOR),patchEditor(await readFile(join(PARENT,EDITOR),'utf8')));
 await writeFile(join(OUTPUT,MARKER),JSON.stringify({
  base:PARENT_SHA,decision:'HOLD',releaseAuthorized:false,deployAuthorized:false,
  productionModified:false,stagingModified:false,realDeviceVerified:false,humanVisualApproved:false,
  changed:[EDITOR],added:[PACK]
 },null,2)+'\n');
 return verify();
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 console.log('FAMILY_ALPHA_75_LOCAL_FIT_PACK_HOLD',JSON.stringify(await build()));
