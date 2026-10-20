#!/usr/bin/env node
// Local-only: no provider credentials, network calls, photo bytes or uploads.
import {readFile,lstat,mkdir,open} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {reviewSavedClosetReports} from '../benchmark/private-saved-closet-review.mjs';
const args=process.argv.slice(2),split=args.indexOf('--out');
if(args[0]!=='--reports'||split<3||split!==args.length-2||split>41)
 throw Error('Usage: node scripts/review-private-saved-closet.mjs --reports android.json iphone.json [...cohort.json] --out artifacts/private-phone-pilot/new-saved-summary.json');
const paths=args.slice(1,split).map(path=>resolve(path)),destination=resolve(args[split+1]);
const allowedRoot=resolve('artifacts/private-phone-pilot');
if(!destination.startsWith(allowedRoot+'/')||!destination.endsWith('.json')||
 new Set(paths).size!==paths.length||paths.includes(destination))
 throw Error('Use unique private phone input files and a new artifacts/private-phone-pilot/*.json output');
const load=async path=>{
 const info=await lstat(path);
 if(!info.isFile()||info.isSymbolicLink()||info.size===0||info.size>2000000)
  throw Error('Input is not a small private JSON report');
 try{return JSON.parse(await readFile(path,'utf8'));}
 catch{throw Error('Input does not contain valid private JSON');}
};
const inputs=await Promise.all(paths.map(load));let summary;
try{summary=reviewSavedClosetReports(inputs);}
catch{throw Error('Private saved-closet reports contain invalid, inconsistent or unauthorized data');}
await mkdir(dirname(destination),{recursive:true,mode:0o700});
const folder=await lstat(dirname(destination));
if(folder.isSymbolicLink()||!folder.isDirectory())
 throw Error('Private report output parent is unsafe');
let file;
try{file=await open(destination,'wx',0o600);}
catch{throw Error('Private report already exists; choose a new filename');}
try{await file.writeFile(JSON.stringify(summary,null,2)+'\n');}
finally{await file.close();}
console.log('PRIVATE_SAVED_CLOSET_AUDIT '+JSON.stringify({
 sameRelease:summary.appRelease,reportSessions:summary.sessionCount,
 observations:summary.observations,saved:summary.attemptsWithSavedClosetRecord,
 selfReportedSavedExactAccuracy:summary.selfReportedFinalSavedExactAccuracy,
 studyThresholdsMet:summary.proposedDiagnosticThresholdsMet,
 blockerCount:summary.releaseBlockers.length,hardwareIndependentProof:false,
 productionApproved:false,privateImagesExported:false
}));
