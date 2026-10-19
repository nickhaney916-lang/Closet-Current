#!/usr/bin/env node
// LOCAL ONLY. Two privately downloaded v2 phone checklists stay on the
// operator's computer. Never upload photos, identities or full reports to CI.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {comparePrivatePhonePilotReports} from '../benchmark/review-phone-pilot-reports.mjs';
const [androidPath,iosPath,outPath]=process.argv.slice(2);
if(!androidPath||!iosPath||!outPath||process.argv.slice(2).length!==3)
 throw Error('Usage: node scripts/compare-private-phone-pilot-reports.mjs android-check.json iphone-check.json local-summary.json');
const load=async file=>{
 try{return JSON.parse(await readFile(file,'utf8'));}
 catch{throw Error('Could not read the private device-check file');}
};
const [android,ios]=await Promise.all([load(androidPath),load(iosPath)]);
const report=comparePrivatePhonePilotReports(android,ios);
await mkdir(dirname(outPath),{recursive:true});
await writeFile(outPath,JSON.stringify(report,null,2)+'\n');
console.log('PRIVATE_TWO_PHONE_PILOT_REVIEW '+JSON.stringify({
 status:report.status,androidChecks:report.android.checksCompleted,
 iosChecks:report.iphone.checksCompleted,sameAppBuild:Boolean(report.bothReportsSameBuild),
 blockers:report.blockers,realHardwareIndependentlyVerified:false,
 productionReleaseApproved:false
}));
