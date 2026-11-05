#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const dir='benchmark/review-alternatives-54/native-ui';
const a=JSON.parse(await readFile(dir+'/acceptance.json','utf8'));
assert.equal(a.cases.length,6);
assert.equal(a.screenshots.length,12);
assert.deepEqual(new Set(a.cases.map(x=>x.engine+':'+x.width)),
 new Set(['chromium:320','chromium:390','chromium:430','webkit:320','webkit:390','webkit:430']));
assert.ok(a.cases.every(x=>x.originalPredictionsUnaffected&&x.alternativeExplicitlySelected&&
 x.selectedAITypeNotAssumedCorrect&&x.blockedUntilHumanConfirmation&&x.verifiedUIState));
const screenshots=[];
for(const item of a.screenshots){
 assert.match(item.file,/^(chromium|webkit)-(320|390|430)-(uncertain-before-click|human-corrected-and-confirmed)\.png$/);
 const bytes=await readFile(dir+'/'+item.file);
 const digest=createHash('sha256').update(bytes).digest('hex');
 assert.equal(digest,item.sha256);
 const m=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
 assert.equal(m.format,'png');assert.equal(m.width,item.width);
 assert.equal(m.height,item.height);
 assert.ok(stats.channels.some(x=>x.stdev>6));
 screenshots.push({file:item.file,sha256:digest,width:m.width,height:m.height,nonblank:true});
}
assert.equal(new Set(screenshots.map(x=>x.file)).size,12);
const result={schema:'review-alternatives-54/independent-ui-audit-v1',
 cases:a.cases.length,realOriginalSHA256:a.sourceSHA256,actualModelEvidence:a.actualModelEvidence,
 screenshots,allSHA256Valid:true,allNonblank:true,allDimensionsValid:true,
 scientificCaveat:'UI browser test replays archived genuine FashionCLIP uncertain diagnostics. The independent MODEL52 native app test executes the real worker. This is not a measured classifier accuracy improvement or a physically tested mobile phone.'};
await writeFile(dir+'/independent-audit.json',JSON.stringify(result,null,2)+'\n');
console.log('REVIEW54 independent real browser UI screenshot audit PASS: '+JSON.stringify({
 cases:result.cases,screenshots:screenshots.length,allSHA256Valid:true,allNonblank:true
}));
