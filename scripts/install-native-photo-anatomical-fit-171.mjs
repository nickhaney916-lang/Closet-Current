import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const donor=resolve(process.argv[2]||'');
if(!process.argv[2]||donor===resolve('.')||donor===resolve('/'))throw Error('P171 requires detached P541+P60 donor path');
const target=resolve(donor,'research/outfit-3d-01/research-panel.mjs');
const original=await readFile(target,'utf8');
const anchor='return {ready:true,privateVisible:dialog.open,viewerReady:ready,';
assert.equal(original.split(anchor).length,2,'P171 pinned donor panel state shape changed');
const patch=[
 'const actualOutfit171=scene?.getState()?.outfit||null;',
 '    // P60 fitted-photo receipts come only from actual attached skinned meshes.',
 '    const one171=k=>actualOutfit171?.[k]?.photoAnatomicalFitReceipt60?',
 '      {receipt:actualOutfit171[k].photoAnatomicalFitReceipt60,',
 '       photoFabricPBR164:actualOutfit171[k].photoFabricPBR164===true,',
 '       sourceSHA256:actualOutfit171[k].sourceSHA256}:null;',
 '    return {ready:true,privateVisible:dialog.open,viewerReady:ready,',
 "     fitReceipts171:{shirt:one171('shirt'),dress:one171('dress'),pants:one171('pants')},"
].join('\n');
await writeFile(target,original.replace(anchor,patch));
console.log(JSON.stringify({priority:171,detachedDonor:donor,geometryMutated:false,
 originalJPEGMutated:false,sourceFromRealP60SkinnedMeshes:true,
 releaseAuthorized:false,familyAlpha:'HOLD'}));