#!/usr/bin/env node
import {readFileSync} from 'node:fs';
const [reportPath,...requiredIds]=process.argv.slice(2);
if(!reportPath||!requiredIds.length)throw Error('Usage: node scripts/check-photo-collection.mjs REPORT REQUIRED_ID...');
let rows;
try{rows=JSON.parse(readFileSync(reportPath,'utf8'));}catch(e){console.error('Photo collection report missing or invalid:',e.message);process.exit(1);}
if(!Array.isArray(rows)){console.error('Photo collection report must be an array');process.exit(1);}
const byId=new Map(rows.map(x=>[x.id,x]));
let failures=0;
for(const id of requiredIds){
 const row=byId.get(id);
 const valid=row?.status==='downloaded-unreviewed'&&/^[a-f0-9]{64}$/.test(row.sha256||'')&&row.bytes>=1000;
 console.log(id+': '+(valid?'download verified for visual review':(row?.status||'missing'))+(row?.reason?' — '+row.reason:''));
 if(!valid)failures++;
}
if(failures){console.error(failures+' required rainwear photos were not collected; see uploaded collection artifact.');process.exitCode=1;}
