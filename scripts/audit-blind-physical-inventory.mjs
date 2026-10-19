#!/usr/bin/env node
// Read ONLY actual locally supplied original-source blind review and approved
// garment mask files. This tool does not generate human reviewers or masks.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {evaluateBlindLinkedPhysicalInventory} from '../benchmark/blind-inventory-mask-gate.mjs';
const args=process.argv.slice(2);
if(args.length!==10)throw Error(
 'Usage: node scripts/audit-blind-physical-inventory.mjs scene.json locked-source.json first-packet.json first-submission.json second-packet.json second-submission.json physical-inventory.json|- approved-masks.json|- model-proposals.json output.json');
const read=async path=>path==='-'?null:JSON.parse(await readFile(path,'utf8'));
const [
 scene,lockedSource,firstPacket,firstSubmission,secondPacket,secondSubmission,
 physicalInventory,maskRows,predRows
]=await Promise.all(args.slice(0,9).map(read));
const rowsToMap=(rows,label,key)=>{
 if(rows===null)return new Map();
 if(!Array.isArray(rows))throw Error(label+' requires a JSON array');
 const result=new Map();
 for(const row of rows){
  if(!row||typeof row.id!=='string'||!row.id||result.has(row.id)||
    !row[key]||typeof row[key]!=='object'||Array.isArray(row[key]))
   throw Error(label+' has missing or duplicate source-matched ids');
  result.set(row.id,row[key]);
 }
 return result;
};
const outcome=evaluateBlindLinkedPhysicalInventory({
 scene,lockedSource,firstPacket,firstSubmission,secondPacket,secondSubmission,
 physicalInventory,approvedMasks:rowsToMap(maskRows,'Approved masks','annotation'),
 modelProposals:rowsToMap(predRows,'Model proposals','prediction')
});
await mkdir(dirname(resolve(args[9])),{recursive:true});
await writeFile(args[9],JSON.stringify(outcome,null,2));
console.log('BLIND_LINKED_PHYSICAL_INVENTORY '+JSON.stringify({
 sourceId:outcome.sourceId,status:outcome.status,
 approvedPhysicalGarments:outcome.approvedPhysicalGarments,
 detectionRecall:outcome.detectionRecall,
 correctCategoryRecall:outcome.categoryConstrainedRecall,
 specificFootwearSubtypeAccuracy:outcome.specificFootwearSubtypeAccuracy,
 canPromoteModel:outcome.canPromoteModel,canRelease:outcome.canRelease
}));
