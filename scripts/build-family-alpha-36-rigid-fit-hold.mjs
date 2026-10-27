/** Strict independent offline overlay of user-driven rigid 2D image alignment.
 * Source branch is draft #332. No private wardrobe, Auth, original JPEG,
 * segmentation, app renderer, fit engine, staging or production mutation.
 */
import {assert35HOLD,OUTPUT as PARENT} from './build-family-alpha-35-visual-repair-hold.mjs';
import {readFile,writeFile,mkdir,cp,rm,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
export const OUTPUT='dist-family-alpha-36-rigid-align-HOLD';
const BOOT='__alpha_research/family-alpha-29/boot.js';
const ADDED='__alpha_research/family-alpha-36/manual-fit.mjs';
const MARKER='alpha36-rigid-align-HOLD-manifest.json';
const PARENT_PIN='2598f4872e216f470b8e9d8eec864912b258300a';
const sha=x=>createHash('sha256').update(x).digest('hex');
function replaceOnce(text,a,b){
 if(text.split(a).length!==2)throw Error('Unexpected Work35 styling boot integration drift');
 return text.replace(a,b);
}
export function overlayHumanAlignment(original){
 let s=replaceOnce(original,
  ',confirmation]=await Promise.all([',
  ',confirmation,manualFit]=await Promise.all([');
 s=replaceOnce(s,
  "import('../family-alpha-35/review-cutout.mjs')",
  "import('../family-alpha-35/review-cutout.mjs'),import('../family-alpha-36/manual-fit.mjs')");
 s=replaceOnce(s,
  'guard();return outcome;',
  "guard();manualFit.mountManualGarmentAlignment(container,{isActive:()=>{try{guard();return !abort.signal.aborted;}catch{return false;}}});return outcome;");
 if(!s.includes('renderSavedBoard2D')||!s.includes('confirmReviewedCutoutWithEraser'))
  throw Error('Source-backed human-confirmed review changed');
 return s;
}
async function tree(dir,prefix=''){
 const entries=await readdir(dir,{withFileTypes:true}),names=[];
 for(const entry of entries){
  if(entry.isSymbolicLink())throw Error('Symlink in private visual candidate');
  const path=prefix+entry.name;
  if(entry.isDirectory())names.push(...await tree(join(dir,entry.name),path+'/'));
  else if(entry.isFile())names.push(path);
  else throw Error('Invalid candidate asset');
 }
 return names.sort();
}
export async function assert36HOLD(){
 await assert35HOLD();
 const [base,newBoot,manual,manifest]=await Promise.all([
  readFile(join(PARENT,BOOT),'utf8'),readFile(join(OUTPUT,BOOT),'utf8'),
  readFile(join(OUTPUT,ADDED)),readFile(join(OUTPUT,MARKER),'utf8')
 ]);
 const m=JSON.parse(manifest);
 assert.equal(m.releaseGate,'HOLD');assert.equal(m.parentPin,PARENT_PIN);
 assert.equal(m.noSourcePixelEdits,true);
 assert.equal(m.rigidFitOnly,true);
 assert.equal(m.manualAdjustmentsPersisted,false);
 for(const key of ['ownerVisualApproved','phoneFitValidated','realFamilyAccountIsolationVerified','deployAuthorized'])
  assert.equal(m[key],false);
 assert.equal(newBoot,overlayHumanAlignment(base));
 assert.equal(m.changedBootSha256,sha(newBoot));
 const realManual=await readFile('research/family-alpha-36/manual-fit.mjs');
 assert.ok(realManual.equals(manual));
 assert.equal(m.manualFitSha256,sha(manual));
 const baseFiles=await tree(PARENT),candidate=await tree(OUTPUT);
 assert.deepEqual(candidate,[...baseFiles,ADDED,MARKER].sort());
 for(const path of baseFiles)if(path!==BOOT){
  assert.equal(sha(await readFile(join(PARENT,path))),
   sha(await readFile(join(OUTPUT,path))),'Changed upstream garment/photo/owner/store source '+path);
 }
 return m;
}
export async function build36HOLD(){
 await assert35HOLD();
 await rm(OUTPUT,{recursive:true,force:true});
 await cp(PARENT,OUTPUT,{recursive:true});
 const original=await readFile(join(PARENT,BOOT),'utf8');
 const changed=overlayHumanAlignment(original);
 await writeFile(join(OUTPUT,BOOT),changed);
 await mkdir(join(OUTPUT,'__alpha_research/family-alpha-36'),{recursive:true});
 const module=await readFile('research/family-alpha-36/manual-fit.mjs');
 await writeFile(join(OUTPUT,ADDED),module);
 const manifest={
  releaseGate:'HOLD',parentPin:PARENT_PIN,
  changedAssets:[BOOT],addedAssets:[ADDED],
  changedBootSha256:sha(changed),manualFitSha256:sha(module),
  noSourcePixelEdits:true,rigidFitOnly:true,
  footwearReferenceCannotBeAdjusted:true,
  manualAdjustmentsPersisted:false,
  ownerVisualApproved:false,phoneFitValidated:false,
  realFamilyAccountIsolationVerified:false,deployAuthorized:false
 };
 await writeFile(join(OUTPUT,MARKER),JSON.stringify(manifest,null,2)+'\n');
 return assert36HOLD();
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 console.log('FAMILY_ALPHA_36_MANUAL_FIT_HOLD',JSON.stringify(await build36HOLD()));
