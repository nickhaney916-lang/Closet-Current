import assert from 'node:assert/strict';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import {scorePacket} from './score-local-fitting-reviews.mjs';
const root='artifacts/real-photo-quality',report=root+'/results.json',reviews=root+'/review-template.json';
const temporaryReport=root+'/tamper-test-report.json',temporaryReviews=root+'/tamper-test-reviews.json',output=root+'/tamper-test-output.json';
const png=root+'/commons-0053/warp-diagnostic.png',originalPng=await readFile(png);
try{
 const a=JSON.parse(await readFile(reviews));
 a.push(a[0]);await writeFile(temporaryReviews,JSON.stringify(a));
 await assert.rejects(()=>scorePacket(report,temporaryReviews,output),/Duplicate/);
 const stale=JSON.parse(await readFile(report));
 stale.pipelineFiles['public/local-garment-warp.js']='0'.repeat(64);
 await writeFile(temporaryReport,JSON.stringify(stale));
 await assert.rejects(()=>scorePacket(temporaryReport,reviews,output),/Pipeline changed/);
 await writeFile(png,Buffer.from('fixture packet tamper probe'));
 await assert.rejects(()=>scorePacket(report,reviews,output),/Candidate changed/);
 console.log('Packet integrity checks passed: duplicate reviews, stale pipeline and changed candidate rejected.');
}finally{
 await writeFile(png,originalPng);
 for(const file of [temporaryReport,temporaryReviews,output])await unlink(file).catch(e=>{if(e.code!=='ENOENT')throw e;});
}
