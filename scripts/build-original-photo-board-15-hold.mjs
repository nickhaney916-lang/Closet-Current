import {readFile,writeFile,mkdir,rm,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {join} from 'node:path';
const PIN='b771329a5502cf53e495c860fe8c342d7ca3443a';
const OUT='dist-original-photo-board-15-HOLD';
const base='research/family-alpha-original-board-15/';
const digest=b=>createHash('sha256').update(b).digest('hex');
const frozen=JSON.parse(await readFile(base+'cohort.json','utf8'));
const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
assert.equal(frozen.release,'HOLD');
assert.equal(frozen.visualDecision,'NOT_OWNER_REVIEWED');
assert.equal(frozen.rows.length,15,'15 original photo evidence rows required');
assert.equal(new Set(frozen.rows.map(x=>x.id)).size,15);
assert.equal(frozen.scenarios.length,3);
const existing=new Set(frozen.rows.map(x=>x.id));
for(const scenario of frozen.scenarios){
 assert.ok(scenario.ids.length>=3&&scenario.ids.length<=8);
 assert.equal(new Set(scenario.ids).size,scenario.ids.length);
 assert.ok(scenario.ids.every(id=>existing.has(id)));
}
for(const f of ['board.mjs','policy.mjs','board.css']){
 const path='research/work43-integration/'+f;
 const current=await readFile(path);
 const pinned=execFileSync('git',['show',PIN+':'+path]);
 assert.equal(digest(current),digest(pinned),'Work43 display component source drift: '+path);
}
await rm(OUT,{recursive:true,force:true});await mkdir(join(OUT,'photos'),{recursive:true});
for(const f of ['index.html','runner.mjs'])await copyFile(base+f,join(OUT,f));
for(const f of ['board.mjs','policy.mjs','board.css'])
 await copyFile('research/work43-integration/'+f,join(OUT,f));
const rows=[];
for(const item of frozen.rows){
 const x=sources.find(y=>y.id===item.id);
 assert.ok(x?.verified&&x?.attribution?.license&&x.attribution.source,'Source or license not verified: '+item.id);
 assert.match(x.image,/^commons-\d{4}\.jpg$/);
 const bytes=await readFile('benchmark/fixtures/'+x.image);
 assert.equal(digest(bytes),x.sha256,'Original source byte hash mismatch: '+item.id);
 await writeFile(join(OUT,'photos',x.image),bytes);
 rows.push({...item,image:x.image,sha256:x.sha256,attribution:x.attribution});
}
const report={sourceCommit:PIN,release:'HOLD',visualDecision:'NOT_OWNER_REVIEWED',
 declaredScope:'Independent offline licensed still-photo review, not tested with app auth/wardrobe/recommendation or physical phone',
 ownerApprovedCount:0,rows,scenarios:frozen.scenarios};
await writeFile(join(OUT,'matrix.json'),JSON.stringify(report,null,2)+'\n');
await writeFile(join(OUT,'RELEASE-HOLD.txt'),'Family Alpha HOLD. Photos are licensed source JPEGs. 0 owner visual approvals. This gallery is not a real app or try-on.\n');
console.log('ORIGINAL_PHOTO_15_HOLD',JSON.stringify({count:rows.length,scenarios:report.scenarios.length,release:report.release,ownerApprovedCount:0}));
