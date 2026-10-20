import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {jpegDimensions} from '../scripts/prepare-reviewed-mask-evidence.mjs';
const digest=b=>createHash('sha256').update(b).digest('hex');

test('twelve actual original JPG frame grids match both SHA-locked manifests without masking them',()=>{
 const manifest=JSON.parse(fs.readFileSync('benchmark/local-fitting-real-photo-manifest.json'));
 const locked=JSON.parse(fs.readFileSync('benchmark/locked-photo-sources.json'));
 const registry=JSON.parse(fs.readFileSync('benchmark/reference-mask-evidence/registry.json'));
 assert.equal(manifest.cases.length,12);
 assert.equal(new Set(manifest.cases.map(x=>x.id)).size,12);
 assert.deepEqual(registry.references,[],'no simulated references may enter real-photo registry');
 assert.notEqual(registry.policy.status,'approved','quality policy remains unapproved');
 for(const row of manifest.cases){
  assert.match(row.image,/^commons-\d{4}\.jpg$/);
  const source=fs.readFileSync('benchmark/fixtures/'+row.image);
  const sha=digest(source);
  assert.equal(sha,row.sourceSha256);
  assert.equal(sha,locked.find(x=>x.id===row.id)?.sha256);
  const d=jpegDimensions(source);
  assert.ok(d.width>0&&d.height>0&&d.width*d.height<=12_000_000);
  assert.equal(row.independentReferenceMask,null);
 }
});
