/**
 * Family Alpha #74: exact verified Work54 starting-fit overlay atop green #72
 * private feedback + phone testing candidate. No deploy, storage, auth writes.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,cp,rm,mkdir,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build as build72,verify as verify72,OUTPUT as PARENT}
 from './build-family-alpha-72-guided-phone-hold.mjs';
export const OUTPUT='dist-family-alpha-74-work54-phone-HOLD';
export const WORK54_OUTPUT='dist-work54-natural-fit-HOLD';
export const EDITOR='__alpha_research/work47/editor.mjs';
export const PLANNER='__alpha_research/work54/starting-fit.mjs';
export const MARKER='family-alpha-74-HOLD.json';
export const PINS=Object.freeze({
 mainline72:'195d230539a58d1cf23a33367b9d13d395955565',
 work54:'4ae94144e1348efe7bd27427fee41dbedf0e030f',
 work54VisualUnblock:'1bbb5c4075f63387ac9ce761de69e7c552d20dab',
 startingFitBlob:'8d60ba16e8dc5bb723f58b6a77773c85785ab8aa',
 exactEditorBuilderBlob:'677166404964412de222c164f9f8ae77ad1a332f'
});
const gitBlob=buf=>createHash('sha1').update('blob '+buf.byteLength+'\0').update(buf).digest('hex');
async function verifiedWork54Source(){
 for(const [name,pin] of [
  ['research/work54/starting-fit.mjs',PINS.startingFitBlob],
  ['scripts/build-work54-fit-hold.mjs',PINS.exactEditorBuilderBlob]
 ])assert.equal(gitBlob(await readFile(name)),pin,'Unexpected Work54 source modification: '+name);
}
async function list(dir,p=''){
 const out=[];
 for(const e of await readdir(join(dir,p),{withFileTypes:true})){
  assert.ok(!e.isSymbolicLink(),'Unexpected compiled symlink');
  const f=p+e.name;
  if(e.isDirectory())out.push(...await list(dir,f+'/'));
  else {assert.ok(e.isFile());out.push(f);}
 }
 return out.sort();
}
export async function verify(){
 await verifiedWork54Source();
 await verify72();
 const base=await list(PARENT),actual=await list(OUTPUT);
 assert.deepEqual(actual,[...base,PLANNER,MARKER].sort(),'New app files outside review-only allowlist');
 const benchmark=await readFile(join(WORK54_OUTPUT,EDITOR));
 for(const name of base){
  const prior=await readFile(join(PARENT,name)),newer=await readFile(join(OUTPUT,name));
  if(name===EDITOR)assert.deepEqual(newer,benchmark,'Compiled Work54 editor must match the exact verified separate Work54 candidate');
  else assert.deepEqual(newer,prior,'Unexpected Auth, original JPEG, mask, wardrobe, backup, phone, feedback, styling or manual fit change: '+name);
 }
 assert.deepEqual(await readFile(join(OUTPUT,PLANNER)),await readFile('research/work54/starting-fit.mjs'));
 assert.notDeepEqual(await readFile(join(OUTPUT,EDITOR)),await readFile(join(PARENT,EDITOR)),'Work54 feature missing');
 const fitted=(await readFile(join(OUTPUT,EDITOR),'utf8'));
 assert.match(fitted,/Suggest starting fit/);
 assert.match(fitted,/!event\.isTrusted\|\|!check\(\)/);
 assert.match(fitted,/Existing manual or restored fit kept/);
 assert.match(fitted,/startingAdjust=null/);
 assert.match(fitted,/requiresHumanReview|No approval granted/i);
 const original=(await readFile(join(OUTPUT,'index.html'),'utf8'));
 assert.match(original,/alphaPhoneWalkthrough/);
 assert.match(original,/alphaPrivateFeedback/);
 assert.match(original,/id="appShell" hidden/);
 const m=JSON.parse(await readFile(join(OUTPUT,MARKER),'utf8'));
 assert.deepEqual(m.pins,PINS);
 for(const flag of ['releaseAuthorized','deploymentAuthorized','productionModified','stagingModified',
  'actualPhysicalPhoneVerified','realTwoOwnerJwtVerified','cloudBackupWriteRestoreVerified','humanVisualApproved'])
  assert.equal(m[flag],false,'No approval may be inferred from successful synthetic or browser tests');
 assert.deepEqual(m.onlyModifiedCompiledAssets,[EDITOR]);
 assert.deepEqual(m.onlyAddedCompiledAssets,[PLANNER]);
 assert.equal(m.decision,'HOLD');
 return {decision:'HOLD',work54StartingFit:true,sourcePinned:true,existingManualFitPreserved:true,
  protectedDeviceHelpAndPrivateFeedbackPreserved:true,photoAndOwnerAssetsUnchanged:true,
  deploymentAuthorized:false,realPhotoOwnerVisualPass:0};
}
export async function build(){
 await verifiedWork54Source();
 await build72();
 // Import a source-pinned builder after the #72 parent is available.
 // The Work54 module intentionally builds a separate scratch candidate
 // and exposes its audited patchEditor; it never edits the #72 branch.
 const {patchEditor}=await import('./build-work54-fit-hold.mjs');
 assert.equal(patchEditor(await readFile(join(PARENT,EDITOR),'utf8')),
  await readFile(join(WORK54_OUTPUT,EDITOR),'utf8'),'Work54 editor patch differs from its isolated candidate');
 await rm(OUTPUT,{recursive:true,force:true});
 await cp(PARENT,OUTPUT,{recursive:true});
 await mkdir(join(OUTPUT,'__alpha_research/work54'),{recursive:true});
 await cp('research/work54/starting-fit.mjs',join(OUTPUT,PLANNER));
 await writeFile(join(OUTPUT,EDITOR),patchEditor(await readFile(join(PARENT,EDITOR),'utf8')));
 await writeFile(join(OUTPUT,MARKER),JSON.stringify({
  pins:PINS,decision:'HOLD',releaseAuthorized:false,deploymentAuthorized:false,
  stagingModified:false,productionModified:false,actualPhysicalPhoneVerified:false,
  realTwoOwnerJwtVerified:false,cloudBackupWriteRestoreVerified:false,humanVisualApproved:false,
  onlyModifiedCompiledAssets:[EDITOR],onlyAddedCompiledAssets:[PLANNER],
  note:'Verified Work54 natural starting-fit action atop existing #72 private feedback and on-phone QA. Every other compiled asset remains byte identical.'
 },null,2)+'\n');
 return verify();
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 console.log('FAMILY_ALPHA_74_WORK54_PHONE_HOLD',JSON.stringify(await build()));
