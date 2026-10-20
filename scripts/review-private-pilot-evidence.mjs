#!/usr/bin/env node
// Local-only redacted aggregate from privately downloaded phone checklists
// and human-prelabeled color reports. Never send personal photos to GitHub.
import {readFile,open,mkdir,stat,lstat} from 'node:fs/promises';
import {resolve,relative,dirname} from 'node:path';
import {reviewPrivatePilotEvidence} from '../benchmark/private-end-to-end-pilot-review.mjs';

const args=process.argv.slice(2);
const sep=args.indexOf('--color-reports'),outIndex=args.indexOf('--out');
if(args.length<8||args[0]!=='--android'||args[2]!=='--iphone'||
 sep!==4||outIndex<6||outIndex!==args.length-2||outIndex-sep<2)
 throw Error('Usage: node scripts/review-private-pilot-evidence.mjs --android android.json --iphone iphone.json --color-reports phone-colors-1.json [phone-colors-2.json ...] --out artifacts/private-phone-pilot/new-review.json');
const output=resolve(args[outIndex+1]);
const privateRoot=resolve('artifacts/private-phone-pilot');
if(!(output.startsWith(privateRoot+'/')&&output.endsWith('.json')))
 throw Error('Output must be a private local artifacts/private-phone-pilot/*.json file');
const inputs=[args[1],args[3],...args.slice(sep+1,outIndex)];
if(inputs.length>42||new Set(inputs.map(x=>resolve(x))).size!==inputs.length||
 inputs.some(x=>resolve(x)===output))
 throw Error('Duplicate/reused private report paths are not allowed');
const load=async file=>{
 const info=await lstat(file);
 if(!info.isFile()||info.isSymbolicLink()||info.size>2_000_000||info.size<=0)
  throw Error('Private pilot input is not a supported JSON file');
 try{return JSON.parse(await readFile(file,'utf8'));}
 catch{throw Error('Cannot parse private pilot report JSON');}
};
const [android,iphone,...photos]=await Promise.all(inputs.map(load));
let report;
try{report=reviewPrivatePilotEvidence(android,iphone,photos);}
catch{throw Error('Private pilot evidence is inconsistent, incomplete or contains extra fields. No output was written.');}
await mkdir(dirname(output),{recursive:true,mode:0o700});
const folder=await lstat(dirname(output));
if(folder.isSymbolicLink())throw Error('Private output folder cannot be a symlink');
let handle;
try{handle=await open(output,'wx',0o600);}
catch{throw Error('Output already exists; choose a new private JSON filename');}
try{await handle.writeFile(JSON.stringify(report,null,2)+'\n');}
finally{await handle.close();}
console.log('PRIVATE_CLOSET_PILOT_EVIDENCE '+JSON.stringify({
 status:report.status,
 sessions:report.modelSuggestionStudy.reportSessions,
 labeledGarmentEntries:report.modelSuggestionStudy.garmentPhotoEntries,
 syntheticOrRealUnverified:true,
 diagnosticThresholdsMet:report.proposedDiagnosticThresholdsMet,
 releaseBlockerCount:report.releaseBlockers.length,
 approvedForProduction:false,
 noPhotoFilesExported:true
}));
