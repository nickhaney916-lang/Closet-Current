/**
 * Source-locked research audit. Per-photo derived screenshot SHA256 validated;
 * absolutely no original customer/photo JPG or model training claim uploaded.
 */
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {scoreAutoMulti16} from './score-auto-multi-16.mjs';
const root=resolve('benchmark/auto-multi-16/collected'),
 out=resolve('benchmark/auto-multi-16/evaluation');
await mkdir(out,{recursive:true});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),
 read=async p=>JSON.parse(await readFile(p,'utf8'));
const folders=(await readdir(root)).filter(x=>/^AUTO-MULTI-16-SLICE-[0-4]-/.test(x)).sort();
if(folders.length!==5)throw Error('AUTO-MULTI-16 must have all five original batches');
const outputs=[],screenshots=[],perSlice=[],errors=[];
for(let i=0;i<5;i++){
 const dirs=folders.filter(x=>x.includes('SLICE-'+i+'-'));
 if(dirs.length!==1)throw Error('Missing or duplicated exact source slice '+i);
 const dir=join(root,dirs[0]),rows=await read(join(dir,'results.json')),
   shots=await read(join(dir,'screenshots.json')),report=await read(join(dir,'execution.json'));
 if(rows.length!==6||shots.length!==18||report.slice!==i||!report.sha256OriginalsVerified||
  report.originalsUploaded||report.unexpectedExternalWrites!==0)throw Error('Incomplete source integrity slice '+i);
 for(const item of shots){
  if(!item.licensedImage||!['chromium','webkit'].includes(item.browser)||
   ![320,390,430].includes(item.width)||!/^am16-\d\d-/.test(item.file))throw Error('Invalid screenshot');
  const buf=await readFile(join(dir,item.file)),meta=await sharp(buf).metadata();
  if(sha(buf)!==item.sha256||meta.format!=='png'||meta.width!==item.width)
   throw Error('Tampered original screenshot '+item.file);
  screenshots.push(item);
 }
 for(const record of rows){
  if(!record.originalBytesVerified||!record.originalJpegUnchanged||
   !record.modelExecuted||record.error)errors.push({id:record.id,kind:'model_error'});
  outputs.push(record);
 }
 perSlice.push({slice:i,originals:report.uniqueOriginals,modelRuns:report.modelRuns,
  failures:report.modelFailures,screenshots:shots.length,pageErrors:report.runtimePageErrors});
}
if(outputs.length!==30||screenshots.length!==90)throw Error('Missing actual 30 model outcomes or 90 screenshots');
const expected=await read('research/auto-multi-diversity-16/provisional-15-locked.json');
const result=scoreAutoMulti16(expected,outputs,{actualModelEvidence:true});
const ids=new Set(screenshots.map(x=>x.id+'-'+x.browser+'-'+x.width));
if(ids.size!==90)throw Error('Repeated or missing mobile screenshots');
const sum={priority:'AUTO-MULTI-DIVERSITY-16',actualWorkerInference:true,
 originalSourceSha256Verified:true,uniqueOriginals:15,originalPhotoBytesInArtifacts:false,
 screenshotCount:90,chromiumAndWebkitWidths:[320,390,430],
 modelErrors:errors,bySlice:perSlice,
 humanReviewerVerified:false,trueMaskIoU:null,
 signedOwnerRLSVerified:false,physicalPhonesVerified:false,
 qualityAccepted:false,familyAlpha:'HOLD',productionDeployed:false};
await writeFile(join(out,'evaluation.json'),JSON.stringify(result,null,2));
await writeFile(join(out,'acceptance.json'),JSON.stringify(sum,null,2));
await writeFile(join(out,'screenshot-index.json'),JSON.stringify(screenshots,null,2));
console.log('AUTO_MULTI16_INDEPENDENT_AUDIT '+JSON.stringify({results:result.results,
 uniqueOriginals:15,modelErrors:errors.length,screenshots:90,
  qualityAccepted:false,reason:result.qualityGateReason}));
if(errors.length)process.exitCode=1;
