import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const source=(ref,path)=>execFileSync('git',['show',ref+':'+path]);
test('31 combines exact existing avatar assets and styling implementation without algorithm edits',()=>{
 for(const p of ['family-alpha-2d-photo-renderer.mjs','family-alpha-2d-layer-plan.mjs'])assert.deepEqual(readFileSync('dist-family-alpha-31-hold/'+p),source('68bed0c0f0f25538d0d5a00fbaf9aa34d80b8663','public/'+p));
 for(const p of ['boot.js','workflow.mjs','store.mjs','ui.mjs'])assert.deepEqual(readFileSync('dist-family-alpha-31-hold/__alpha_research/family-alpha-29/'+p),source('97397e80a7cf66e5e656c5b74c924a51e50f0f6f','research/family-alpha-29/'+p));
});
test('31 leaves original-photo app, ownership, cloud and review processor identical to held parent',()=>{
 for(const p of ['app.js','auth.js','cloud-backup.js','family-alpha-2d-saved-board.mjs','__alpha_research/family-alpha-13/garment-photo-preparation.mjs'])assert.deepEqual(readFileSync('dist-family-alpha-31-hold/'+p),readFileSync('dist-family-alpha-29-hold/'+p));
 const m=JSON.parse(readFileSync('dist-family-alpha-31-hold/alpha31-manifest.json'));
 assert.equal(m.release,'HOLD');assert.equal(m.physicalPhonesTested,false);assert.equal(m.realisticFittingValidated,false);assert.equal(m.storageOverlay318Applied,false);
});
