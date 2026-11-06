#!/usr/bin/env node
/**
 * Research-only PRIVATE off-GitHub human polygon JSON receipt inspection.
 * Never upload a review; output contains only source IDs and unresolved
 * statuses, no reviewer ID, photo bytes, notes, labels, or polygons.
 *
 * Usage:
 *   node scripts/audit-source97-human-review-99.mjs --empty
 *   node scripts/audit-source97-human-review-99.mjs --a /private/A.json --b /private/B.json [--c /private/C.json]
 * Real reviewer evidence and independently verified identities are NOT
 * magically established by JSON input. Scientific acceptance stays blocked.
 */
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {auditProvisionalHumanReviews99} from '../research/source97-human-adjudication-99/review-intake-gate.mjs';

const error=msg=>{throw Error('SOURCE99 '+msg);};
const flags=new Map();
for(let i=2;i<process.argv.length;i++){
 const key=process.argv[i];
 if(!['--empty','--a','--b','--c'].includes(key)||flags.has(key))
  error('unrecognized or repeated argument');
 if(key==='--empty')flags.set(key,true);
 else{
  const next=process.argv[++i];
  if(!next||next.startsWith('--'))error('missing private reviewer export path');
  flags.set(key,resolve(next));
 }
}
if(flags.has('--empty')&&flags.size!==1)error('empty-audit forbids importing any reviewers');
if(!flags.has('--empty')&&!flags.has('--a')&&!flags.has('--b')&&!flags.has('--c'))
 error('choose --empty or at least one private review export');
const fetchJSON=async p=>{
 const data=await readFile(p);
 if(data.length<10||data.length>2*1024*1024)error('private JSON too large or empty; refuse');
 try{return JSON.parse(data.toString('utf8'));}
 catch{error('private review is not valid JSON');}
};
const [manifest,original59,prior]=await Promise.all([
 fetchJSON('research/new-real-commons-candidate-cohort-97/source-candidates.json'),
 fetchJSON('benchmark/locked-photo-sources.json'),
 fetchJSON('research/real-multigarment-candidate-intake-96/candidate-manifest.json')
]);
const exportsByRole={};
for(const role of ['A','B','C'])if(flags.has('--'+role.toLowerCase()))
 exportsByRole[role]=await fetchJSON(flags.get('--'+role.toLowerCase()));
const result=auditProvisionalHumanReviews99({
 manifest,original59,quarantined96:prior.candidates,exportsByRole
});
if(result.releaseAuthorized||result.actualHumanIdentityVerified||
 result.newCandidatesScientificallyAccepted!==0||result.realModelMaskIoU!==null)
 error('illegal scientific or Family Alpha promotion');
console.log(JSON.stringify(result,null,2));
