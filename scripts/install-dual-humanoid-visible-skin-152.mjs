/**
 * P152: patch only the disposable detached P541 donor used by P150 UI tests.
 * Source is the exact P118 code copied from the pinned P150 PR; the default
 * app, the P150 PR branch, and existing 3D models remain unchanged.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {repairPinnedP118Shader152,VISIBLE_SKIN_152}
 from '../research/dual-humanoid-visible-skin-152/pinned-p118-shader-repair.mjs';
const target=process.argv[2];
if(target!=='.p150-donor-541')throw Error('P152 only exact detached .p150-donor-541 research donor allowed');
const root=resolve('.'),donor=resolve(target);
if(!donor.startsWith(root+sep))throw Error('P152 donor cannot target repository root or outside path');
const head=execFileSync('git',['-C',donor,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(head!==VISIBLE_SKIN_152.donorPR541)
 throw Error('P152 CC0 163-bone source donor exact SHA mismatch');
const file=resolve(donor,'research/dual-humanoid-photorealism-118/realism.mjs');
const source=await readFile(file,'utf8');
const patched=repairPinnedP118Shader152(source);
await writeFile(file,patched.content);
const sha=s=>createHash('sha256').update(s).digest('hex');
console.log('P152_PINNED_SKIN_REPAIR '+JSON.stringify({
 priority:152,donorHead:head,
 oldP118ContentSHA256:sha(source),newP118ContentSHA256:sha(patched.content),
 patchedOnlyResearchDonor:true,
 preservedGarmentAndSourcePhoto:true,
 preserved163BoneAnatomy:true,releaseAuthorized:false,familyAlpha:'HOLD'
}));
