/**
 * P159 composes strictly AFTER exact P157 head graft and P158 independently
 * SHA-pinned source-skin color, ONLY in disposable original P541 research
 * donor .p150-donor-541. Never writes shipping app, staged source, other PRs.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,dirname,sep} from 'node:path';
const arg=process.argv[2],root=resolve('.'),donor=resolve(arg||'');
if(arg!=='.p150-donor-541'||!donor.startsWith(root+sep))
 throw Error('P159 requires exact disposable P541 research worktree only');
const exact=execFileSync('git',['-C',donor,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(exact!=='df6885d6011cb33fb22dceb81a08f35a0ac4dd61')
 throw Error('P159 refuses changed original 163-bone owner outfit donor');
const src='research/anatomical-neck-seam-159/source-neck-surface.mjs',
 destination=resolve(donor,src);
await mkdir(dirname(destination),{recursive:true});
await copyFile(resolve(src),destination);
const file=resolve(donor,'research/real-face-original-photo-body-graft-157/attach-licensed-head.mjs');
let code=await readFile(file,'utf8');
function exactOne(a,b){
 assert.equal(code.split(a).length,2,'P159 exact P158 source graft integration anchor drift: '+a.slice(0,120));
 code=code.replace(a,b);
}
const anchor="import {applyLicensedFaceSkinNeck158,clearLicensedFaceSkinNeck158} from '../licensed-face-skin-neck-harmony-158/skin-neck-harmony.mjs';";
exactOne(anchor,anchor+"\nimport {applySourceMeasuredNeck159,clearSourceMeasuredNeck159} from '../anatomical-neck-seam-159/source-neck-surface.mjs';");
exactOne(' clearLicensedFaceSkinNeck158(root);',
 ' clearSourceMeasuredNeck159(root);\n clearLicensedFaceSkinNeck158(root);');
exactOne(" catch(error){clearLicensedSourceHead157(root);throw error;}\n const result=Object.freeze({\n  figure,skinHarmony158,",
 " catch(error){clearLicensedSourceHead157(root);throw error;}\n let neckTransition159;\n try{neckTransition159=applySourceMeasuredNeck159(root,figure,{source,mask,afterBox,candidate,skinHarmony158,graft});}\n catch(error){clearLicensedSourceHead157(root);throw error;}\n const result=Object.freeze({\n  figure,skinHarmony158,neckTransition159,");
assert.ok(code.includes("sourceOriginalMIT:'Microsoft Rocketbox;")&&
 code.includes('skinHarmony158,neckTransition159')&&
 code.includes('clearSourceMeasuredNeck159(root)'),
 'P159 verified original MIT source provenance and cleanup required');
await writeFile(file,code);
execFileSync('node',['--check',destination]);
execFileSync('node',['--check',file]);
console.log('P159_ORIGINAL_SOURCE_NECK_SURFACE_INSTALLED '+JSON.stringify({
 sourceDonorHead:exact,
 pinnedP158Parent:'4b7815760104ca4201b59210466cf43d2fd9f8be',
 noOriginalSkinnedBodyOrOwnedGarmentEdits:true,
 noOriginalJPEGOrPublicSourceFaceEdits:true,
 noStagingOrProductionChanges:true,
 researchOnly:true,familyAlpha:'HOLD',releaseAuthorized:false
}));
