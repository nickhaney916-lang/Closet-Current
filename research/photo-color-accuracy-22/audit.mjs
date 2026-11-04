import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import {score} from './score.mjs';

const dir=process.env.COLOR22_OUTPUT||'benchmark/color-accuracy-22';
const registry=JSON.parse(await readFile(new URL('./sources.json',import.meta.url)));
const report=JSON.parse(await readFile(dir+'/report.json'));
const source=JSON.parse(await readFile(dir+'/sources.json'));
assert.equal(report.head,execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
assert.equal(report.baselineSha,'876b680272b6e2c40be24410a14b92802bdf991b');
assert.deepEqual(source.exclusions,[]);
assert.deepEqual(source.verified,registry.photos.map(p=>p.id));
assert.equal(new Set(registry.photos.map(p=>p.sha256)).size,registry.photos.length);
assert.deepEqual(Object.keys(report.engines).sort(),['chromium','webkit']);
assert.deepEqual(report.externalAttempts,[]);
assert.deepEqual(report.errors,[]);
for(const rows of Object.values(report.engines)){
 assert.deepEqual(rows.map(p=>p.id),source.verified);
 for(const row of rows){
  assert.equal(row.digest,registry.photos.find(p=>p.id===row.id).sha256);
  if(row.updated.accepted)assert.equal(row.updated.accepted,row.baseline.accepted,'No new automatic decisions');
 }
}
assert.deepEqual(report.measurements,score(registry.photos,report.engines));
for(const engine of ['chromium','webkit']){
 const screens=report.screenshots.filter(row=>row.engine===engine);
 assert.deepEqual(screens.map(row=>row.width),[320,390,430]);
 for(const row of screens){
  const bytes=await readFile(dir+'/'+row.filename);
  const meta=await sharp(bytes).metadata();
  assert.equal(meta.width,row.width);
  assert.equal(meta.format,'png');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);
  const source=registry.photos.find(x=>x.id===row.id);
  assert.deepEqual(row.state,{manual:source.color,cleared:'',sourceStillVisible:true});
 }
}
console.log('Audited exact HEAD, frozen cohort, paired scores, six screenshot SHA digests and manual authority');
