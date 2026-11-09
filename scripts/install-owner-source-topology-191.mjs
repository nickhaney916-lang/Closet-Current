/** P191: add read-only integrity receipts to detached P190 research donor only. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
const arg=process.argv[2];
if(!arg)throw Error('P191 requires explicit detached P541 research donor');
const donor=resolve(arg),root=resolve('.');
if(donor==='/'||donor===root||root.startsWith(donor+'/')||
 donor.startsWith(root+'/public/')||donor.startsWith(root+'/supabase/'))
 throw Error('P191 refuses to modify shipping app, existing staging, or production');
const target=join(donor,'research/outfit-3d-01/research-panel.mjs');
let s=await readFile(target,'utf8');
const anchor='ownerMaskBilateralCapJoins190:actualOutfit171[k].ownerMaskBilateralCapJoins190,';
assert.equal(s.split(anchor).length,2,'P191 requires exactly one verified P190 donor panel source');
s=s.replace(anchor,`${anchor}
        ownerMaskTopologyValidated191:actualOutfit171[k].ownerMaskTopologyValidated191===true,
        ownerMaskSourceOverlapIoU191:actualOutfit171[k].ownerMaskSourceOverlapIoU191||0,
        ownerMaskLargestConnected191:actualOutfit171[k].ownerMaskLargestConnected191||0,
        ownerMaskInsideSource191:actualOutfit171[k].ownerMaskInsideSource191||0,
        ownerMaskIndependentHumanReviewed191:false,`);
await writeFile(target,s);
execFileSync(process.execPath,['--check',target],{stdio:'inherit'});
console.log(JSON.stringify({priority:191,onlyDetachedResearchDonor:true,
 currentSourceMaskOverlapMeasured:true,true163BoneGarmentRequired:true,
 independentHumanAnnotation:false,releaseAuthorized:false,familyAlpha:'HOLD'}));
