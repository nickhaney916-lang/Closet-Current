#!/usr/bin/env node
/**
 * SOURCE100 — private, local, redacted human garment disagreement review.
 * No raw JSON annotation, reviewer identifiers, photos, colors or polygons
 * are ever printed, persisted, committed, uploaded, or sent over a network.
 * No self-attested review can convert quarantined sources into locked science.
 *
 * node scripts/audit-source97-triage-100.mjs --empty
 * node scripts/audit-source97-triage-100.mjs --a /private/A.json --b /private/B.json [--c /private/C.json]
 */
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {triageSource97Instances100}
 from '../research/source97-instance-conflict-triage-100/triage-gate.mjs';

const fail=msg=>{throw Error('SOURCE100 '+msg);};
const paths=new Map();
for(let i=2;i<process.argv.length;i++){
 const flag=process.argv[i];
 if(!['--empty','--a','--b','--c'].includes(flag)||paths.has(flag))
  fail('expected unique --empty or private --a --b [--c] input options');
 if(flag==='--empty')paths.set(flag,true);
 else{
  const file=process.argv[++i];
  if(!file||file.startsWith('--'))fail('missing private export file');
  paths.set(flag,resolve(file));
 }
}
if(paths.has('--empty')&&paths.size!==1)fail('empty audit cannot use human exports');
if(!paths.has('--empty')&&!paths.size)fail('provide --empty or private human exports');
async function loadJSON(filename,{review=false}={}){
 const b=await readFile(filename);
 if(b.length<5||b.length>(review?2*1024*1024:128*1024))
  fail('invalid or oversized research metadata/review export');
 try{return JSON.parse(b.toString('utf8'));}
 catch{fail('invalid JSON');}
}
const [manifest,original59,prior]=await Promise.all([
 loadJSON('research/new-real-commons-candidate-cohort-97/source-candidates.json'),
 loadJSON('benchmark/locked-photo-sources.json'),
 loadJSON('research/real-multigarment-candidate-intake-96/candidate-manifest.json')
]);
const exportsByRole={};
for(const role of ['A','B','C'])if(paths.has('--'+role.toLowerCase()))
 exportsByRole[role]=await loadJSON(paths.get('--'+role.toLowerCase()),{review:true});
const out=triageSource97Instances100({
 manifest,original59,quarantined96:prior.candidates,exportsByRole
});
if(out.scientificAcceptedNewSources!==0||out.releaseAuthorized||
 out.perInstanceMaskIoU!==null||out.independentlyVerifiedHumanReviewers!==0)
 fail('scientific and release HOLD invariant violated');
console.log(JSON.stringify(out,null,2));
