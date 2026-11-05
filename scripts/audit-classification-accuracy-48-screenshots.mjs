#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';

const dir='benchmark/classification-accuracy-48/native-acceptance';
const acceptance=JSON.parse(await readFile(`${dir}/acceptance.json`,'utf8'));
const expected=new Set(['chromium:320','chromium:390','chromium:430','webkit:320','webkit:390','webkit:430']);
assert.equal(acceptance.cases.length,6,'Expected both browser engines at all three widths');
assert.deepEqual(new Set(acceptance.cases.map(c=>`${c.engine}:${c.width}`)),expected);
for(const c of acceptance.cases){
  assert.equal(c.ownerPrivate,true); assert.equal(c.outfitSaved,true);
  assert.equal(c.v4Backup,true); assert.equal(c.v4Restore,true);
  assert.equal(c.reimportDuplicateBlocked,true);
}
const audited=[];
for(const shot of acceptance.screenshots){
  assert.match(shot.file,/^(chromium|webkit)-(320|390|430)-[a-z0-9-]+\.png$/i);
  const bytes=await readFile(`${dir}/${shot.file}`);
  const hash=createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash,shot.sha256,`Screenshot SHA mismatch: ${shot.file}`);
  const {width,height}=await sharp(bytes).metadata();
  const stats=await sharp(bytes).stats();
  assert.equal(width,shot.width,`Screenshot width mismatch: ${shot.file}`);
  if(shot.height!==undefined) assert.equal(height,shot.height,`Screenshot height mismatch: ${shot.file}`);
  const channelStddev=stats.channels.map(c=>Number(c.stdev.toFixed(3)));
  assert.ok(channelStddev.some(v=>v>6),`Blank screenshot: ${shot.file}`);
  audited.push({file:shot.file,engine:shot.engine,width,height,bytes:bytes.length,sha256:hash,channelStddev,nonblank:true});
}
assert.equal(audited.length,84,'Expected the complete 84-image UI evidence set');
const modelRequestFailures=acceptance.modelRequestFailures||[];
const result={schema:'classification-accuracy-48/screenshot-audit-v1',count:audited.length,uniqueFiles:new Set(audited.map(x=>x.file)).size,allSHA256Match:true,allDimensionsMatch:true,allImagesNonblank:true,browserWidths:[320,390,430],browserEngines:['chromium','webkit'],ownerPrivatePersistenceCases:acceptance.cases.length,unexpectedNonGetRequests:acceptance.unexpectedUploads?.length??null,applicationErrors:acceptance.errors?.length??null,modelRequestFailures:modelRequestFailures.length,actualModelInferenceVerifiedInAllContexts:modelRequestFailures.length===0&&acceptance.cases.every(c=>c.recognitionEvidence?.category&&c.recognitionEvidence?.itemType),screenshots:audited};
await writeFile(`${dir}/screenshot-audit.json`,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({count:result.count,allSHA256Match:result.allSHA256Match,allDimensionsMatch:result.allDimensionsMatch,allImagesNonblank:result.allImagesNonblank,ownerPrivatePersistenceCases:result.ownerPrivatePersistenceCases,modelRequestFailures:result.modelRequestFailures,actualModelInferenceVerifiedInAllContexts:result.actualModelInferenceVerifiedInAllContexts}));
