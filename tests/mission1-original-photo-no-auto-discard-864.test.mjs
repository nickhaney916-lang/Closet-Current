/** Mission 1 P864: source-level original-preservation regression.
 * This verifies no destructive recognition heuristic; it does not simulate
 * real human photos, owner accounts or physical phones.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {evaluateMission1Evidence} from '../scripts/m1-release-evidence-851.mjs';
test('P864 no scanner blank/duplicate classifier branch silently deletes a queued owner original',async()=>{
 const app=await readFile('public/app.js','utf8');
 const scanner=app.slice(app.indexOf('async function recognizeItem(item)'),app.indexOf('async function recognizeBatch()'));
 assert.ok(scanner.startsWith('async function recognizeItem(item)'),'real recognition source missing');
 assert.doesNotMatch(scanner,/blank_skipped|exact_duplicate_skipped/);
 assert.doesNotMatch(scanner,/batch=batch\.filter\(x=>x\.id!==item\.id\)/,
  'scanner heuristic must never discard a pending capture directly');
 assert.match(scanner,/if\(quality\.blank\)\{/);
 assert.match(scanner,/if\(matches\.some\(x=>x\.image===item\.image\)\)\{/);
 assert.match(scanner,/Original photo kept/g);
 assert.match(scanner,/requiresOwnershipConfirmation=true/g);
});
test('P864 default owner review and exact original are kept in the existing source path',async()=>{
 const app=await readFile('public/app.js','utf8');
 assert.match(app,/^const reviewFirst836=true;$/m);
 assert.match(app,/const source73=original854\|\|source854/);
 assert.match(app,/const live854=\(\)=>sameOwner854\(\)/);
 assert.match(app,/if\(lease859&&lease859\.item!==item\)return false/);
 assert.match(app,/function persistDraft\(\)/);
});
test('P864 zero human-blind release evidence still blocks Family Alpha',async()=>{
 const gate=evaluateMission1Evidence(null);
 assert.equal(gate.status,'BLOCKED');
 assert.equal(gate.shouldLiftFamilyAlphaHold,false);
});
