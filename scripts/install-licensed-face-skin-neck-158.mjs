/**
 * P158 modifies ONLY a disposable verified P541 research worktree.
 * It composes with P157 after actual local licensed source JPEG and head SHA
 * proof, and before the head acceptance result is exposed to the browser.
 * No production, staging, shared P157 branch, wardrobe or source GLB edits.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,dirname,sep} from 'node:path';

const arg=process.argv[2],repo=resolve('.'),donor=resolve(arg||'');
if(arg!=='.p150-donor-541'||!donor.startsWith(repo+sep))
 throw Error('P158 only exact disposable donor .p150-donor-541 allowed');
const sha=execFileSync('git',['-C',donor,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(sha!=='df6885d6011cb33fb22dceb81a08f35a0ac4dd61')
 throw Error('P158 source original 163-bone donor SHA changed');
const src='research/licensed-face-skin-neck-harmony-158/skin-neck-harmony.mjs',
 dest=resolve(donor,src);
await mkdir(dirname(dest),{recursive:true});
await copyFile(resolve(src),dest);
const f=resolve(donor,'research/real-face-original-photo-body-graft-157/attach-licensed-head.mjs');
let code=await readFile(f,'utf8');
function one(before,after){
 assert.equal(code.split(before).length,2,
  'P158 exact pinned P157 graft integration contract changed: '+before.slice(0,110));
 code=code.replace(before,after);
}
one("import {clone as skeletonClone} from 'three/addons/utils/SkeletonUtils.js';",
    "import {clone as skeletonClone} from 'three/addons/utils/SkeletonUtils.js';\n"+
    "import {applyLicensedFaceSkinNeck158,clearLicensedFaceSkinNeck158} from '../licensed-face-skin-neck-harmony-158/skin-neck-harmony.mjs';");
one(' cleanupMask(root);',' clearLicensedFaceSkinNeck158(root);\n cleanupMask(root);');
one(' const result=Object.freeze({\n  figure,\n  originalSourceRigBones:163,',
    ' let skinHarmony158;\n try{skinHarmony158=applyLicensedFaceSkinNeck158(root,figure,source,candidate);}\n catch(error){clearLicensedSourceHead157(root);throw error;}\n const result=Object.freeze({\n  figure,skinHarmony158,\n  originalSourceRigBones:163,');
if(!code.includes('skinHarmony158')||!code.includes("sourceOriginalMIT:'Microsoft Rocketbox;"))
 throw Error('P158 source license/integration research contract absent');
await writeFile(f,code);
execFileSync('node',['--check',f]);
execFileSync('node',['--check',dest]);
console.log('P158_EXACT_PINNED_LICENSED_ALBEDO_HARMONY_INSTALLED '+JSON.stringify({
 donorOriginalCommit:sha,parentP157:'1063f0f229b7b7b26e1eebb6c784706ebcc0661c',
 source163BoneBodyUnmodified:true,licensedP156FacePixelsRemainOriginal:true,
 preservesBothOwnerSourceJpegs:true,changesOnlyResearchDonor:true,
 colorHarmonyUsesActualLicensedSourceAlbedo:true,
 familyAlpha:'HOLD',releaseAuthorized:false
}));
