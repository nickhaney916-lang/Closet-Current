/**
 * Closet Current P161: exact P160 detached source donor only; join after
 * P157 real MIT source P158 source-tone P159 original-neck no-new-collar
 * and P160 genuine Neck-bone registered translation.
 * Cannot modify shared parallel #716, shipping app, staging, production.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,dirname,sep} from 'node:path';
const arg=process.argv[2],repo=resolve('.'),donor=resolve(arg||'');
if(arg!=='.p150-donor-541'||!donor.startsWith(repo+sep))
 throw Error('P161 exactly the isolated P541 research donor required');
const SHA='df6885d6011cb33fb22dceb81a08f35a0ac4dd61';
const real=execFileSync('git',['-C',donor,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(real!==SHA)throw Error('P161 refuses changed original 163-bone owner outfit donor');
const src='research/licensed-neck-axis-contact-161/anatomical-head-axis.mjs',
 destination=resolve(donor,src);
await mkdir(dirname(destination),{recursive:true});
await copyFile(resolve(src),destination);
const file=resolve(donor,'research/real-face-original-photo-body-graft-157/attach-licensed-head.mjs');
let code=await readFile(file,'utf8');
function one(old,n){
 assert.equal(code.split(old).length,2,'P161 exact verified P160 graft integration changed: '+old.slice(0,100));
 code=code.replace(old,n);
}
const a="import {applyLicensedHeadJointFit160,clearLicensedHeadJointFit160} from '../neck-joint-registered-head-fit-160/rig-head-registration.mjs';";
one(a,a+"\nimport {applyOriginalHeadAxisFit161,clearOriginalHeadAxisFit161} from '../licensed-neck-axis-contact-161/anatomical-head-axis.mjs';");
one(' clearLicensedHeadJointFit160(root);',
 ' clearOriginalHeadAxisFit161(root);\n clearLicensedHeadJointFit160(root);');
one(" catch(error){clearLicensedSourceHead157(root);throw error;}\n const result=Object.freeze({\n  figure,skinHarmony158,neckTransition159,headJointFit160,",
 " catch(error){clearLicensedSourceHead157(root);throw error;}\n let headAxis161;\n try{headAxis161=applyOriginalHeadAxisFit161(root,figure,{source,candidate,graft,headJointFit160,neckTransition159,skinHarmony158,mask});}\n catch(error){clearLicensedSourceHead157(root);throw error;}\n const result=Object.freeze({\n  figure,skinHarmony158,neckTransition159,headJointFit160,headAxis161,");
assert.ok(code.includes("sourceOriginalMIT:'Microsoft Rocketbox;")&&
 code.includes("figure,skinHarmony158,neckTransition159,headJointFit160,headAxis161,")&&
 code.includes('clearOriginalHeadAxisFit161(root)')&&
 code.includes('clearLicensedHeadJointFit160(root)'),
 'exact original P156 MIT provenance and reversible P160 cleanup required');
await writeFile(file,code);
execFileSync('node',['--check',file]);
execFileSync('node',['--check',destination]);
console.log('P161_SOURCE_RIG_NECK_AXIS_ORIENTATION_VERIFIED_INSTALL '+JSON.stringify({
 exactP541OriginalSource:real,
 exactP160Parent:'76e4a3ca174564f7ca074bc568cdaa806fe11fdb',
 noOwnedGarmentEdits:true,noOwnerJPEGWrites:true,noMITGeometryTextureEdits:true,
 noSharedParallelWork716Writes:true,noShippingAppWrites:true,
 familyAlpha:'HOLD',releaseAuthorized:false
}));
