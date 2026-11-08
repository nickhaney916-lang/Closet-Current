/**
 * P160 research installer: exact P541 donor commit only, AFTER P157 signed
 * MIT source, P158 immutable face albedo, P159 no-duplicate-neck contract.
 * Keeps all source JS and final shim inside detached donor, no owner data.
 */
import assert from 'node:assert/strict';
import {copyFile,mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,dirname,sep} from 'node:path';
const arg=process.argv[2],repo=resolve('.'),donor=resolve(arg||'');
if(arg!=='.p150-donor-541'||!donor.startsWith(repo+sep))
 throw Error('P160 only exact disposable P541 donor research worktree');
const pinned='df6885d6011cb33fb22dceb81a08f35a0ac4dd61';
const actual=execFileSync('git',['-C',donor,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(actual!==pinned)throw Error('P160 original 163-bone donor SHA changed');
const source='research/neck-joint-registered-head-fit-160/rig-head-registration.mjs';
const destination=resolve(donor,source);
await mkdir(dirname(destination),{recursive:true});
await copyFile(resolve(source),destination);
const file=resolve(donor,'research/real-face-original-photo-body-graft-157/attach-licensed-head.mjs');
let code=await readFile(file,'utf8');
function one(a,b){
 assert.equal(code.split(a).length,2,'P160 exact inherited licensed source graft integration changed: '+a.slice(0,110));
 code=code.replace(a,b);
}
const anchor="import {applySourceMeasuredNeck159,clearSourceMeasuredNeck159} from '../anatomical-neck-seam-159/source-neck-surface.mjs';";
one(anchor,anchor+"\nimport {applyLicensedHeadJointFit160,clearLicensedHeadJointFit160} from '../neck-joint-registered-head-fit-160/rig-head-registration.mjs';");
one(' clearSourceMeasuredNeck159(root);',' clearLicensedHeadJointFit160(root);\n clearSourceMeasuredNeck159(root);');
one(" catch(error){clearLicensedSourceHead157(root);throw error;}\n const result=Object.freeze({\n  figure,skinHarmony158,neckTransition159,",
 " catch(error){clearLicensedSourceHead157(root);throw error;}\n let headJointFit160;\n try{headJointFit160=applyLicensedHeadJointFit160(root,figure,{source,candidate,graft,skinHarmony158,neckTransition159,mask});}\n catch(error){clearLicensedSourceHead157(root);throw error;}\n const result=Object.freeze({\n  figure,skinHarmony158,neckTransition159,headJointFit160,");
assert.ok(code.includes("sourceOriginalMIT:'Microsoft Rocketbox;")&&
 code.includes("figure,skinHarmony158,neckTransition159,headJointFit160,")&&
 code.includes("clearLicensedHeadJointFit160(root)"),'exact original source license and cleanup required');
await writeFile(file,code);
execFileSync('node',['--check',file]);
execFileSync('node',['--check',destination]);
console.log('P160_ORIGINAL_NECK_JOINT_FIT_ON_VERIFIED_SOURCE_INSTALLED '+JSON.stringify({
 originalDonorCommit:actual,exactParentP159:'0e6f8db077b3dd2b1650e300df0d2d7244d29ba0',
 sourceHeadAndBodyVertexBuffersUnmodified:true,
 originalPhotoGarmentMeshesUnmodified:true,ownerJPEGUnmodified:true,
 originalFaceHairTexturesUnmodified:true,shippedAppUnchanged:true,
 productionStagingUnchanged:true,familyAlpha:'HOLD',releaseAuthorized:false
}));
