// Audit a saved real-worker report after the mobile flow; blocked readiness is
// a valid diagnostic result and does not turn a research benchmark into a launch pass.
import {readFile,writeFile} from 'node:fs/promises';
import {evaluateWholeOutfitHandoff} from '../benchmark/whole-outfit-handoff-readiness.mjs';
const [input,output]=process.argv.slice(2);
if (!input || !output) throw Error('Usage: node scripts/audit-whole-outfit-handoff.mjs <real-whole-outfit-flow.json> <output.json>');
const report=JSON.parse(await readFile(input,'utf8'));
const result=evaluateWholeOutfitHandoff(report);
await writeFile(output,JSON.stringify(result,null,2)+'\n');
console.log('REAL_WHOLE_OUTFIT_READINESS '+JSON.stringify(result));
