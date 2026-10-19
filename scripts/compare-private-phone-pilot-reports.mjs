#!/usr/bin/env node
// LOCAL ONLY. Two privately downloaded v2 phone checklists stay on the
// operator's computer. Never upload photos, identities or full reports to CI.
import {readFile,mkdir,open} from 'node:fs/promises';
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
// The raw input exports are the only available device evidence. Never overwrite
// one of them (including via an existing symlink or hard link), and do not
// silently replace an earlier comparison. New files are owner-only on POSIX.
let output;
try { output=await open(outPath,'wx',0o600); }
catch { throw Error('Private summary output already exists or cannot be created; choose a new file path. Original reports are unchanged.'); }
try { await output.writeFile(JSON.stringify(report,null,2)+'\n'); }
finally { await output.close(); }
console.log('PRIVATE_TWO_PHONE_PILOT_REVIEW '+JSON.stringify({
 status:report.status,androidChecks:report.android.checksCompleted,
 iosChecks:report.iphone.checksCompleted,sameAppBuild:Boolean(report.bothReportsSameBuild),
 blockers:report.blockers,realHardwareIndependentlyVerified:false,
 productionReleaseApproved:false
}));
