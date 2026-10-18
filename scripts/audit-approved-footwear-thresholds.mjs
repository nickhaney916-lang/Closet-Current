import {readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {compareApprovedSneakerThresholds,SNEAKER_HOLDOUT_IDS} from '../benchmark/approved-footwear-threshold-comparison.mjs';
const root=resolve(process.argv[2]||'benchmark/object-cutout-holdout-review');
const manifest=JSON.parse(await readFile('benchmark/manifest-fresh-11.json','utf8'));
const rows=SNEAKER_HOLDOUT_IDS.map(id=>manifest.find(x=>x.id===id)),a=new Map(),b=new Map();
for(const row of rows){if(!row)throw Error('Missing pinned photo');
 a.set(row.id,JSON.parse(await readFile(join(root,row.id+'.candidate.json'),'utf8')));
 b.set(row.id,JSON.parse(await readFile(join(root,row.id+'.strict-footwear-candidate.json'),'utf8')));
}
const result=compareApprovedSneakerThresholds(rows,a,b);
if(result.approvedOutlines!==0||result.aggregateAccuracy!==null||result.productionAuthorized)
 throw Error('Unapproved mask promoted to accuracy evidence');
await writeFile(join(root,'three-sneaker-reference-gate.json'),JSON.stringify(result,null,2)+'\n');
console.log('SNEAKER_APPROVAL_GATE '+JSON.stringify({photos:3,approved:result.approvedOutlines,
 pending:result.pendingOutlines,measured:result.allOutlinesApproved,
 productionAuthorized:result.productionAuthorized}));
