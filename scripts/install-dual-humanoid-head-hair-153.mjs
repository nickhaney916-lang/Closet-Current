/**
 * P153 only applies to the disposable exact PR541/P150 donor AFTER P152
 * restored original 163-bone shaders. Never modifies production, staging,
 * private photos, or Parallel #57's own research PR.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,dirname,sep} from 'node:path';
const input=process.argv[2];
if(input!=='.p150-donor-541')throw Error('P153 only exact disposable .p150-donor-541 research donor allowed');
const root=resolve('.'),donor=resolve(input);
if(!donor.startsWith(root+sep))throw Error('P153 donor root refuses unapproved path');
const donorHead=execFileSync('git',['-C',donor,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(donorHead!=='df6885d6011cb33fb22dceb81a08f35a0ac4dd61')
 throw Error('P153 pinned source PR541 head mismatch');
const source=resolve('research/dual-humanoid-head-hair-153/source-head-hair.mjs');
const dest=resolve(donor,'research/dual-humanoid-head-hair-153/source-head-hair.mjs');
await mkdir(dirname(dest),{recursive:true});
await copyFile(source,dest);
const file=resolve(donor,'research/dual-humanoid-photorealistic-integration-150/apply-humanoid.mjs');
let s=await readFile(file,'utf8');
function one(a,b){
 assert.equal(s.split(a).length,2,'P153 exact parallel P150 donor anchor mismatch: '+a.slice(0,110));
 s=s.replace(a,b);
}
const importAnchor="import {applyDualHumanoidFace131} from '../dual-humanoid-face-definition-131/face-definition.mjs';";
one(importAnchor,importAnchor+"\nimport {applySourceHeadHair153,clearSourceHeadHair153} from '../dual-humanoid-head-hair-153/source-head-hair.mjs';");
one("export function clearDualHumanoid150(root){\n if(!root?.traverse)return false;\n",
"export function clearDualHumanoid150(root){\n if(!root?.traverse)return false;\n clearSourceHeadHair153(root);\n");
one(" const face=applyDualHumanoidFace131(root,figure);",
" const face=applyDualHumanoidFace131(root,figure);\n const headHair153=applySourceHeadHair153(root,figure);");
one("  figure,sourceRigBones:163,skinHair,face,",
"  figure,sourceRigBones:163,skinHair,face,headHair153,");
await writeFile(file,s);
console.log('P153_PINNED_DONOR_APPEARANCE '+JSON.stringify({
 donorHead,originalSkinnedBoneCount:163,
 realSourceHeadBoneAttachment:true,
 onlySourceModulesAdded:['source-head-hair.mjs'],
 parallelP150BranchEdited:false,sourceGarmentOrPhotoEdited:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
}));
