import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export const gates=['access','adult-isolation','four-accounts','android','iphone','capture','correction','avatar','recommendations','swap','cloud-restore','feedback'];
export function assess(report){
 const errors=[];
 if(report.environment!=='staging')errors.push('staging required');
 for(const id of gates){
  const row=report.gates?.find(x=>x.id===id);
  if(!row||!['PASS','FAIL','NOT TESTED'].includes(row.status)) {errors.push(`${id}: missing/invalid status`);continue;}
  if(report.gates.filter(x=>x.id===id).length!==1)errors.push(`${id}: duplicate`);
  if(row.status==='PASS'&&(!row.evidence?.trim()||!row.build?.trim()||!row.testedAt?.trim()))errors.push(`${id}: PASS requires evidence, build and date`);
  if(row.status==='PASS'&&['android','iphone'].includes(id)&&row.method!=='physical-device')errors.push(`${id}: physical device required`);
  if(row.status==='PASS'&&['adult-isolation','four-accounts','cloud-restore','access'].includes(id)&&row.method!=='live-staging')errors.push(`${id}: live staging required`);
 }
 if(report.gates?.some(x=>!gates.includes(x.id)))errors.push('unknown gate');
 const ready=errors.length===0&&gates.every(id=>report.gates.find(x=>x.id===id)?.status==='PASS');
 return {decision:ready?'READY FOR MAIN-THREAD REVIEW':'HOLD',errors};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const result=assess(JSON.parse(await readFile(process.argv[2]||'docs/family-alpha-27/release-report.json','utf8')));
 console.log(JSON.stringify(result,null,2));
 if(result.errors.length)process.exitCode=1;
 // HOLD is an expected incomplete report, never permission to invite or deploy.
}
