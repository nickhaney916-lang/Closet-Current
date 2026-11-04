import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dir='benchmark/category-color-39-output/';
const rows=JSON.parse(await readFile(dir+'browser-color.json','utf8')),registry=JSON.parse(await readFile('research/recognition-category-color-39/color-manifest.json','utf8'));
const cases=[];
assert.equal(rows.length,6);
for(const engine of ['chromium','webkit'])for(const width of [320,390,430]){
 const x=rows.find(y=>y.engine===engine&&y.width===width),truth=registry.find(y=>y.id===x?.id);
 assert.ok(x&&truth);assert.equal(x.hash,truth.sha256,'Browser source identity mismatch');
 const bytes=await readFile(dir+x.filename),meta=await sharp(bytes).metadata(),stats=await sharp(bytes).stats();
 assert.equal(createHash('sha256').update(bytes).digest('hex'),x.screenshotSHA256);
 assert.equal(meta.format,'png');assert.equal(meta.width,width);assert.equal(meta.height,760);assert.ok(stats.channels.some(z=>z.stdev>6),'Blank screenshot');
 cases.push({engine,width,id:x.id,sourceSHA256:x.hash,screenshotSHA256:x.screenshotSHA256,predictedColor:x.palette?.primary||null,verified:true});
}
const index=JSON.parse(await readFile('benchmark/index-04/results.json','utf8'));
assert.equal(index.evidence.length,3);assert.ok(index.evidence.every(x=>x.actualIndexedDB&&x.mockedModelOutput&&x.originalJpegRetained&&x.savedOwnerIndexRefreshed));
assert.deepEqual(index.outbound,[]);
await writeFile('benchmark/recognition-acceptance-40/browser-audit.json',JSON.stringify({colorCases:cases,actualBrowserColorCases:6,actualIndexedDbFixtureBrowserCases:3,modelOutputInIndexedDbFlow:'MOCKED NOT MODEL ACCURACY',physicalDevice:'UNVERIFIED'},null,2));
console.log('INDEPENDENT40 audited 6 real color browser/screenshots and 3 real IndexedDB flows with MOCKED classification.');
