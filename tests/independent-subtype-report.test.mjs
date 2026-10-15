import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
test('independent subtype report keeps a broad raincoat-to-coat mismatch while accepting specific shirt labels',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'closet-subtypes-'));
 try{
 const manifest=join(dir,'manifest.json'),results=join(dir,'results.json'),report=join(dir,'report.json');
 const items=[{id:'rain',expectedCategory:'Outerwear',expectedType:'Raincoat'},{id:'shirt',expectedCategory:'Tops',expectedType:'Shirt'},{id:'blazer',expectedCategory:'Outerwear',expectedType:'Blazer'}];
 await writeFile(manifest,JSON.stringify(items));
 await writeFile(results,JSON.stringify([{id:'rain',prediction:{category:'Outerwear',type:'Coat'},diagnostics:{acceptedEvidence:{branch:[{type:'Coat',score:.9},{type:'Raincoat',score:.1}],confirmation:[{type:'Coat',score:.8},{type:'Raincoat',score:.2}]},shadowPreprocessing:{originalWholeTypes:[{type:'Coat',score:.75},{type:'Raincoat',score:.25}],originalCenterTypes:[{type:'Coat',score:.7},{type:'Raincoat',score:.3}]}}},{id:'shirt',prediction:{category:'Tops',type:'Button-down shirt'}},{id:'blazer',prediction:{category:'Outerwear',type:'Blazer'}}]));
 const run=spawnSync(process.execPath,['scripts/report-independent-subtypes.mjs',manifest,results,report],{encoding:'utf8'});
 assert.equal(run.status,0,run.stderr);
 const stats=JSON.parse(await readFile(report,'utf8'));
 assert.equal(stats.categoryCorrect,3);assert.equal(stats.exactSubtypeCorrect,1);
 assert.equal(stats.compatibleSpecificCount,1);assert.equal(stats.acceptableSubtypeCount,2);
 assert.equal(stats.items[0].outcome,'subtype-mismatch');
 assert.equal(stats.consensusSubtypeMismatchCount,1);
 assert.equal(stats.items[0].subtypeConsensusMismatch,true);
 assert.ok(Math.abs(stats.items[0].modelViews.branch.margin-.8)<1e-10);
 assert.equal(stats.items[1].subtypeConsensusMismatch,false);
 assert.equal(stats.items[1].modelViews.originalWhole,null);
 assert.equal(stats.items[1].outcome,'compatible-specific-subtype');
 assert.deepEqual(stats.outerwearConfusion.Raincoat.predicted,{Coat:1});
 assert.equal(stats.outerwearConfusion.Raincoat.exactCorrect,0);
 assert.deepEqual(stats.outerwearConfusion.Blazer.predicted,{Blazer:1});
 assert.equal(stats.outerwearConfusion.Jacket.count,0);
 assert.equal(stats.raincoatVsCoat[0].consensusWrongSubtype,true);
 assert.ok(Math.abs(stats.raincoatVsCoat[0].raincoatScoreCenterMinusWhole-0.05)<1e-10);
 assert.equal(stats.raincoatVsCoat[0].cropChangesTopSubtype,false);
 }finally{await rm(dir,{recursive:true,force:true});}
});
