// Isolated browser processes bound decoded-photo retention. This is not a
// continuous-session memory acceptance test; preserve that limitation.
import {spawnSync} from 'node:child_process';
import {readFile,writeFile,unlink} from 'node:fs/promises';
const engine=process.argv[2]||'chromium',model=process.argv[3]||'marqo';
const records=[];
for(let partition=0;partition<5;partition++){
 const child=spawnSync(process.execPath,['scripts/parallel67-browser.mjs',engine,model,'new',String(partition)],{stdio:'inherit',env:process.env});
 if(child.status!==0)throw Error('Incomplete actual browser partition '+partition);
 const path='research/parallel67/'+engine+'-'+model+'-new-browser-part'+partition+'.json';
 records.push(JSON.parse(await readFile(path)));await unlink(path);
}
const rows=records.flatMap(x=>x.rows);
if(rows.length!==19||new Set(rows.map(x=>x.id)).size!==19||records.some(x=>x.manifestSha256!==records[0].manifestSha256||x.networkViolations.length))throw Error('Incompatible/missing original sources');
await writeFile('research/parallel67/'+engine+'-'+model+'-new-browser.json',JSON.stringify({...records[0],partition:null,partitionedBrowserProcesses:true,continuousSessionAcceptance:false,loadMs:records[0].loadMs,workerLoadsMs:records.map(x=>x.loadMs),rows},null,2)+'\n');
