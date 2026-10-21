#!/usr/bin/env node
// Local-only, strict, non-overwriting redacted summary of THREE independent
// report families. Keep private raw reports and wardrobe images off GitHub.
import {lstat,readFile,mkdir,realpath,open} from 'node:fs/promises';
import {resolve,dirname,basename} from 'node:path';
import {reviewPrivatePilotCohort} from '../benchmark/private-pilot-cohort-consistency.mjs';

const argv=process.argv.slice(2);
const model=argv.indexOf('--model-reports'),saved=argv.indexOf('--saved-reports'),
 out=argv.indexOf('--out');
if(argv[0]!=='--android'||argv[2]!=='--iphone'||model!==4||
 saved<6||out<saved+3||out!==argv.length-2||
 argv.slice(5).filter(x=>x==='--model-reports'||x==='--saved-reports'||x==='--out').length!==2)
 throw Error('Usage: node scripts/review-private-pilot-cohort.mjs --android android-device.json --iphone iphone-device.json --model-reports model-1.json [model-2.json ...] --saved-reports android-saved.json iphone-saved.json [...] --out artifacts/private-phone-pilot/new-cohort.json');
const modelPaths=argv.slice(model+1,saved),savedPaths=argv.slice(saved+1,out);
if(modelPaths.length<1||modelPaths.length>40||savedPaths.length<2||savedPaths.length>40)
 throw Error('Use one to forty model reports and two to forty saved-closet reports');
const paths=[argv[1],argv[3],...modelPaths,...savedPaths].map(x=>resolve(x));
const output=resolve(argv[out+1]),root=resolve('artifacts/private-phone-pilot');
if(dirname(output)!==root||!/^[a-z0-9][a-z0-9-]{0,60}\.json$/.test(basename(output))||
 new Set(paths).size!==paths.length||paths.includes(output))
 throw Error('Choose unique inputs and a new direct artifacts/private-phone-pilot/*.json output');
async function main(){
 let bytes=0;const values=[];
 for(const p of paths){
  const stat=await lstat(p);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size<10||stat.size>512000)
   throw Error('Invalid private JSON input size or type');
  bytes+=stat.size;
  if(bytes>12000000)throw Error('Private cohort reports exceed total safe size budget');
  const raw=await readFile(p,'utf8');
  try{values.push(JSON.parse(raw));}
  catch{throw Error('Invalid private cohort JSON report');}
 }
 let aggregate;
 try{aggregate=reviewPrivatePilotCohort(values[0],values[1],
  values.slice(2,2+modelPaths.length),values.slice(2+modelPaths.length));}
 catch{throw Error('Private cohort rejected: inconsistent versions, tampered records or unexpected private data');}
 await mkdir(root,{recursive:true,mode:0o700});
 if(await realpath(root)!==root)throw Error('Private output root is not a trusted local directory');
 const dir=await lstat(root);
 if(!dir.isDirectory()||dir.isSymbolicLink())throw Error('Unsafe output directory');
 let file;
 try{file=await open(output,'wx',0o600);}
 catch{throw Error('Output already exists; choose a new private filename');}
 try{await file.writeFile(JSON.stringify(aggregate,null,2)+'\n');}
 finally{await file.close();}
 console.log('PRIVATE_PILOT_COHORT '+JSON.stringify({
  reportBuild:aggregate.appRelease,
  modelEntries:aggregate.modelProposalDiagnostics.labeledGarments,
  savedAttempts:aggregate.savedClosetDiagnostics.labeledGarmentAttempts,
  crossReportOriginalsLinked:false,
  productionRecognitionAccuracy:null,
  realPhonesVerified:false,
  productionReleaseApproved:false,
  privatePhotosExported:false
 }));
}
await main();
