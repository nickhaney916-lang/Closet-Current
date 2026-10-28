/**
 * Family Alpha #63 — source-pin Work50 automatic isolation onto the already
 * verified combined Work49 portable-recipe + binary-edge UI from PR #372.
 * Offline-only compiled overlay; original camera/wardrobe/recognition untouched.
 */
import {readFile,writeFile,cp,mkdir,readdir,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
export const PARENT='dist-work49-cutout-HOLD';
export const OUTPUT='dist-family-alpha-63-auto-portable-HOLD';
export const WORK50_PIN='3c4034ca3b173f8886b374dd968594f8345edb84';
export const WORK49_PLUS_EDGE_PIN='76022b5ea9343f30cd11da686a327bf33a7272d9';
export const PROVIDER='__alpha_research/family-alpha-reviewed-photo/real-jpeg-review-provider.mjs';
export const MODULE='__alpha_research/work50/isolate.mjs';
const FROM="import {prepareSyntheticGarmentOriginal} from '../family-alpha-13/garment-photo-preparation.mjs';";
const TO="import {prepareAutomaticGarment as prepareSyntheticGarmentOriginal} from '../work50/isolate.mjs';";
export function patchProvider(s){
 assert.equal(typeof s,'string');
 assert.equal(s.split(FROM).length,2,'Audited original-photo extraction hook moved');
 assert.ok(!s.includes(TO),'Automatic source hook already applied');
 const out=s.replace(FROM,TO);
 // The only provider change is one import; all authorization, reviewing,
 // source checks, audit, and fresh session validations must be untouched.
 assert.equal(out.replace(TO,FROM),s);
 assert.ok(out.includes("await auditMask("));
 assert.ok(out.includes("if(approved!==true)return reviewOnly("));
 assert.ok(out.includes("validateLiveRecord(item,getItem,initial)"));
 assert.ok(out.includes("validScope(getScope,ownerId,epoch,isCurrent)"));
 assert.ok(out.includes("reviewContextVersion"));
 return out;
}
async function files(d,p=''){
 const out=[];
 for(const entry of await readdir(join(d,p),{withFileTypes:true})){
  assert.equal(entry.isSymbolicLink(),false,'Symlink in source-pinned build');
  const relative=p+entry.name;
  if(entry.isDirectory())out.push(...await files(d,relative+'/'));
  else{assert.equal(entry.isFile(),true,'Unsupported filesystem entry');out.push(relative);}
 }
 return out.sort();
}
export async function verify(){
 const sourceFiles=await files(PARENT);
 const builtFiles=await files(OUTPUT);
 assert.deepEqual(builtFiles,[...sourceFiles,MODULE,'family-alpha-63-HOLD.json'].sort(),
  'Only Work50 isolation module and HOLD marker may be added to combined Work49 build');
 for(const path of sourceFiles){
  const source=await readFile(join(PARENT,path));
  const actual=await readFile(join(OUTPUT,path));
  if(path===PROVIDER)assert.equal(actual.toString('utf8'),patchProvider(source.toString('utf8')));
  else assert.deepEqual(actual,source,'Unexpected Auth/backup/cutout recipe/visual/edit or original garment asset modification: '+path);
 }
 const exact=await readFile('research/work50/isolate.mjs');
 assert.deepEqual(await readFile(join(OUTPUT,MODULE)),exact,'Work50 source mismatch');
 const hold=JSON.parse(await readFile(join(OUTPUT,'family-alpha-63-HOLD.json'),'utf8'));
 assert.equal(hold.release,'HOLD');assert.equal(hold.deploymentAuthorized,false);
 assert.equal(hold.automaticApproved,false);assert.equal(hold.visualOwnerApproved,false);
 assert.equal(hold.portableRecipeApprovalValid,false);
 assert.equal(hold.work50Source,WORK50_PIN);
 assert.equal(hold.work49PlusEdgeSource,WORK49_PLUS_EDGE_PIN);
 return {decision:'HOLD',candidate:'family-alpha-63',originalsUnchanged:true,
  portableEditRecoveryUnchanged:true,manualCutoutEditorUnchanged:true,
  onlyProviderChange:'source-pinned-automatic-extraction-import',
  automaticApproved:false,deploymentAuthorized:false};
}
export async function build(){
 await rm(OUTPUT,{recursive:true,force:true});
 await cp(PARENT,OUTPUT,{recursive:true});
 await mkdir(join(OUTPUT,'__alpha_research/work50'),{recursive:true});
 await cp('research/work50/isolate.mjs',join(OUTPUT,MODULE));
 await writeFile(join(OUTPUT,PROVIDER),
  patchProvider(await readFile(join(PARENT,PROVIDER),'utf8')));
 await writeFile(join(OUTPUT,'family-alpha-63-HOLD.json'),JSON.stringify({
  release:'HOLD',deploymentAuthorized:false,productionModified:false,stagingModified:false,
  originalJPEGModified:false,automaticApproved:false,visualOwnerApproved:false,
  portableRecipeApprovalValid:false,sourceBoundRecipeRecheckRequired:true,
  realTwoOwnerJwtVerified:false,physicalPhoneVerified:false,
  work50Source:WORK50_PIN,work49PlusEdgeSource:WORK49_PLUS_EDGE_PIN
 },null,2)+'\n');
 return verify();
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 console.log('FAMILY_ALPHA_63_AUTOMATIC_PORTABLE_HOLD',JSON.stringify(await build()));
