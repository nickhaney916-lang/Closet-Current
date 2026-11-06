import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {verifyPacket94} from '../research/independent-instance-ground-truth-94/instance-evidence.mjs';
const dir='benchmark/independent-instance-ground-truth-94',screens=dir+'/browser-evidence';
const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const base=new Map(sources.map(x=>[x.id,x]));
const reports=await Promise.all(['A','B','C'].map(async role=>{
 const packet=JSON.parse(await readFile(dir+'/packet-'+role+'.json','utf8'));
 assert.equal(verifyPacket94(packet),true);
 assert.equal(packet.total,59);
 for(const x of packet.items){
  assert.equal(base.get(x.id)?.sha256,x.sourceSHA256);
  assert.equal(base.get(x.id)?.image,x.image);
  assert.equal(base.get(x.id)?.verified,true);
 }
 return packet;
}));
assert.ok(reports[0].items.some((p,i)=>p.id!==reports[1].items[i].id));
const build=JSON.parse(await readFile(dir+'/build-audit.json','utf8'));
assert.equal(build.verifiedLicensedRealJPEGs,59);
assert.equal(build.uniqueByteSHAs,59);
assert.equal(build.independentHumanMaskReviews,0);
assert.equal(build.independentlyAcceptedInstanceMasks,0);
assert.equal(build.actualModelInstanceIoUMeasured,false);
assert.equal(build.scientificVerdict,'NEEDS_REAL_INDEPENDENT_MASK_ANNOTATION');
const result=JSON.parse(await readFile(screens+'/results.json','utf8'));
assert.equal(result.schema,'independent-instance-ground-truth-94/browser-qa-v1');
assert.equal(result.caseCount,6);assert.equal(result.sourceJPEGChecks,12);
assert.equal(result.screenshots.length,20);
assert.equal(result.humanAnnotationsPerformed,0);
assert.equal(result.actualIndependentHumanReviewers,0);
assert.equal(result.modelInstanceAccuracyMeasured,false);
assert.equal(result.qaSimulatedPointerClicksOnly,true);
assert.equal(result.familyAlpha,'HOLD');
assert.equal(result.releaseAuthorized,false);
assert.deepEqual(result.unexpectedNetwork,[]);
assert.deepEqual(result.javascriptErrors,[]);
const set=new Set();
for(const r of result.screenshots){
 assert.match(r.filename,/^(chromium|webkit)-(320|390|430)-0[1-4]-[A-Za-z0-9-]+\.png$/);
 assert.ok(!set.has(r.filename));set.add(r.filename);
 const png=await readFile(screens+'/'+r.filename);
 const meta=await sharp(png).metadata(),stats=await sharp(png).stats();
 assert.equal(createHash('sha256').update(png).digest('hex'),r.sha256);
 assert.equal(meta.width,r.width);assert.equal(meta.height,r.height);
 assert.equal(meta.format,'png');
 assert.ok(r.bytes===png.length&&meta.height>800&&png.length>7000);
 assert.ok(stats.channels.some(x=>x.stdev>7));
}
assert.equal(result.caseReports.length,6);
for(const x of result.caseReports){
 assert.ok([320,390,430].includes(x.width));
 assert.ok(['chromium','webkit'].includes(x.engine));
 assert.equal(x.verifiedRealJPEGBeforeReview,true);
 assert.equal(x.twoQAOnlyPolygons,true);
 assert.equal(x.sourceBoundNoImageExport,true);
 assert.equal(x.roleIsolation,true);
 assert.equal(x.independentHumanLabelsRecorded,0);
 assert.equal(x.modelMaskAccuracyMeasured,false);
 assert.equal(x.physicalPhone,false);
}
assert.equal(result.caseReports.filter(x=>x.corruptedJPEGBlocked==='verified').length,2);
console.log('INSTANCE94 independent screenshot audit: 20/20 genuine mobile Chromium/WebKit screenshot SHAs/dimensions/nonblank PASS, 59/59 original source hashes/rights locked. Actual independently verified human instance masks: ZERO. Scientific verdict NEEDS REWORK; Family Alpha HOLD.');
