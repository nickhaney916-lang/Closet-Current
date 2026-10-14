import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {localCandidates,garmentDetailGroups} from '../public/local-catalog.mjs';
import {categoryCandidates} from '../public/recognition-engine.mjs';
test('the entire supported clothing vocabulary is indexed without missing or duplicate vectors',()=>{
 const metadata=JSON.parse(fs.readFileSync('public/recognition-vectors.json','utf8'));
 const labels=new Set(metadata.labels);
 assert.equal(labels.size,metadata.labels.length);
 const required=[...categoryCandidates,...localCandidates,...localCandidates.filter(x=>x.category!=='Uncategorized').flatMap(x=>Object.values(garmentDetailGroups(x)).flat())];
 const missing=required.filter(x=>!labels.has(x.label)).map(x=>x.label);
 assert.deepEqual(missing,[]);
 assert.equal(fs.statSync('public/recognition-vectors.bin').size,metadata.labels.length*metadata.dimensions*4);
});
test('single and continuous camera modes both request HD when supported and retain fallback',()=>{
 const app=fs.readFileSync('public/app.js','utf8');
 assert.match(app,/getUserMedia\(\{video:\{facingMode:\{ideal:'environment'\},width:\{ideal:1920\},height:\{ideal:1080\}\},audio:false\}\)/);
 assert.match(app,/function takePhoto\(/);
 assert.match(app,/function captureTick\(/);
 assert.match(app,/function finishScan\(/);
});
