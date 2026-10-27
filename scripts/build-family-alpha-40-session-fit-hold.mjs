/** Session-bound fit previews on #337's verified staging-fenced outfit candidate.
 * Overlay only two exact compiled research files + one safe scope module.
 * No staging/production/Auth/cloud changes, new DB stores, photo persistence.
 */
import {assertFullStagingRoutingHOLD,OUTPUT as PARENT}
 from './build-family-alpha-full-stage-routing-hold.mjs';
import {readFile,writeFile,rm,cp,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
export const OUTPUT='dist-family-alpha-40-session-fit-HOLD';
const BOOT='__alpha_research/family-alpha-29/boot.js';
const FIT='__alpha_research/family-alpha-36/manual-fit.mjs';
const MODULE='__alpha_research/family-alpha-40/session-fit.mjs';
const MARKER='alpha40-session-fit-HOLD-manifest.json';
const PARENT_SHA='cb83a7ead69ec642c626648723c0cdbe2eb270e2';
const sha=b=>createHash('sha256').update(b).digest('hex');
const once=(source,old,newString)=>{
 if(source.split(old).length!==2)throw Error('Source-pinned session alignment patch anchor changed: '+old.slice(0,110));
 return source.replace(old,newString);
};
export function overlayBoot(original){
 let s=once(original,',confirmation,manualFit]=await Promise.all([',
  ',confirmation,sessionFit]=await Promise.all([');
 s=once(s,"import('../family-alpha-36/manual-fit.mjs')",
  "import('../family-alpha-40/session-fit.mjs')");
 s=once(s,'  const aborts=new Set();',
  '  const aborts=new Set();\n  const align=sessionFit.createSessionScopedFit({readContext,cryptoProvider:crypto});');
 s=once(s,
  'guard();manualFit.mountManualGarmentAlignment(container,{isActive:()=>{try{guard();return !abort.signal.aborted;}catch{return false;}}});return outcome;',
  "guard();await align.mount({container,board:look.board,guard:()=>{guard();if(abort.signal.aborted)throw Error('Preview stopped');}});guard();return outcome;");
 s=once(s,'const stop=()=>{observer.disconnect();ui.stop();};',
  'const stop=()=>{observer.disconnect();align.stop();ui.stop();};');
 if(!s.includes('confirmReviewedCutoutWithEraser')||!s.includes('renderSavedBoard2D'))
  throw Error('Reviewed mask and source linked avatar must remain intact');
 return s;
}
export function overlayManualFit(original){
 let s=once(original,
  'export function mountManualGarmentAlignment(container,{isActive=()=>true,sessionTarget=globalThis.window}={}){',
  'export function mountManualGarmentAlignment(container,{isActive=()=>true,sessionTarget=globalThis.window,initialAdjustments=null,onAdjustment=()=>{}}={}){');
 s=once(s,
  '  baselines.set(id,placement(img));\n  edits.set(id,{dx:0,dy:0,scale:1});',
  `  const base=placement(img);
  baselines.set(id,base);
  let chosen={dx:0,dy:0,scale:1};
  const proposed=initialAdjustments?.[id];
  if(proposed){
   try{
    const geometry=adjustReviewedGarmentGeometry(base,proposed);
    chosen={dx:proposed.dx,dy:proposed.dy,scale:proposed.scale};
    Object.assign(img.style,{left:(geometry.x*100)+'%',top:(geometry.y*100)+'%',
     width:(geometry.width*100)+'%',height:(geometry.height*100)+'%'});
   }catch{ /* invalid/stale original layout: retain default nonstretch fit */ }
  }
  edits.set(id,chosen);`);
 s=once(s,'  edits.set(id,next);redraw();',
  '  edits.set(id,next);redraw();\n  if(active())onAdjustment({slot:id,edit:{...next}});');
 s=once(s,'  edits.set(picker.value,{dx:0,dy:0,scale:1});redraw();',
  "  edits.set(picker.value,{dx:0,dy:0,scale:1});redraw();\n  if(active())onAdjustment({slot:picker.value,edit:{dx:0,dy:0,scale:1}});");
 return s;
}
async function allFiles(d,prefix=''){
 let files=[];
 for(const e of await readdir(d,{withFileTypes:true})){
  if(e.isSymbolicLink())throw Error('Unexpected symlink in family scope build');
  const path=prefix+e.name;
  if(e.isDirectory())files.push(...await allFiles(join(d,e.name),path+'/'));
  else if(e.isFile())files.push(path);
  else throw Error('Unsupported output asset');
 }
 return files.sort();
}
export async function assert40HOLD(){
 await assertFullStagingRoutingHOLD();
 const [boot,fit,module,manifest]=await Promise.all([
  readFile(join(OUTPUT,BOOT),'utf8'),readFile(join(OUTPUT,FIT),'utf8'),
  readFile(join(OUTPUT,MODULE)),readFile(join(OUTPUT,MARKER),'utf8')
 ]);
 const expectedBoot=overlayBoot(await readFile(join(PARENT,BOOT),'utf8'));
 const expectedFit=overlayManualFit(await readFile(join(PARENT,FIT),'utf8'));
 const expectedModule=await readFile('research/family-alpha-40/session-fit.mjs');
 assert.equal(boot,expectedBoot);
 assert.equal(fit,expectedFit);
 assert.ok(expectedModule.equals(module));
 const m=JSON.parse(manifest);
 assert.equal(m.releaseGate,'HOLD');assert.equal(m.parentPin,PARENT_SHA);
 assert.equal(m.memoryOnly,true);assert.equal(m.crossOwnerFitReuseForbidden,true);
 assert.equal(m.maskSourceHashRequired,true);assert.equal(m.perSessionOnly,true);
 for(const field of ['fitPreferencesCloudSaved','fitPreferencesIndexedDbSaved',
  'fitPreferencesLocalStorageSaved','ownerVisualApproved','productionDeployed','stagingDeployed',
  'fourRealAccountsVerified'])
  assert.equal(m[field],false);
 assert.equal(m.files[BOOT],sha(boot));
 assert.equal(m.files[FIT],sha(fit));
 assert.equal(m.files[MODULE],sha(module));
 const expectedFiles=await allFiles(PARENT),actualFiles=await allFiles(OUTPUT);
 assert.deepEqual(actualFiles,[...expectedFiles,MODULE,MARKER].sort());
 for(const path of expectedFiles){
  if(path===BOOT||path===FIT)continue;
  assert.equal(sha(await readFile(join(PARENT,path))),sha(await readFile(join(OUTPUT,path))),
   'Unapproved change in original photo, cloud, authorization or styling '+path);
 }
 return m;
}
export async function build40HOLD(){
 await assertFullStagingRoutingHOLD();
 await rm(OUTPUT,{recursive:true,force:true});
 await cp(PARENT,OUTPUT,{recursive:true});
 const boot=overlayBoot(await readFile(join(PARENT,BOOT),'utf8'));
 const fit=overlayManualFit(await readFile(join(PARENT,FIT),'utf8'));
 await writeFile(join(OUTPUT,BOOT),boot);
 await writeFile(join(OUTPUT,FIT),fit);
 await mkdir(join(OUTPUT,'__alpha_research/family-alpha-40'),{recursive:true});
 const module=await readFile('research/family-alpha-40/session-fit.mjs');
 await writeFile(join(OUTPUT,MODULE),module);
 const manifest={
  releaseGate:'HOLD',parentPin:PARENT_SHA,
  files:{[BOOT]:sha(boot),[FIT]:sha(fit),[MODULE]:sha(module)},
  scope:'one owner/session/garment/slot/approved PNG-SHA only',
  memoryOnly:true,crossOwnerFitReuseForbidden:true,maskSourceHashRequired:true,perSessionOnly:true,
  fitPreferencesCloudSaved:false,fitPreferencesIndexedDbSaved:false,
  fitPreferencesLocalStorageSaved:false,ownerVisualApproved:false,
  fourRealAccountsVerified:false,productionDeployed:false,stagingDeployed:false,
  actualPhotoDrapingValidated:false
 };
 await writeFile(join(OUTPUT,MARKER),JSON.stringify(manifest,null,2)+'\n');
 return assert40HOLD();
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 console.log('FAMILY_ALPHA_40_SESSION_FIT_HOLD',JSON.stringify(await build40HOLD()));
