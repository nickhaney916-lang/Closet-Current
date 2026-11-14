// Research-only numerical Linux /proc browser-child memory sampling.
// Never records PIDs, command lines, filenames, tokens, photo bytes or account data.
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

const kib=1024;
const integer=(s,key)=>{
  const match=String(s).match(new RegExp('^'+key+':\\s*(\\d+)(?:\\s+kB)?\\s*$', 'm'));
  return match?Number(match[1]):null;
};

/** Root browser PID plus descendants, not unrelated host processes.
 * Summed RSS double-counts shared mappings; summed PSS, if all processes
 * expose smaps_rollup, apportions shared memory. Maxima are sampled only. */
export function snapshotBrowserProcessTree(rootPid,{procRoot='/proc'}={}){
  if(!Number.isSafeInteger(rootPid)||rootPid<=0)return null;
  let names;
  try{names=readdirSync(procRoot).filter(n=>/^[1-9]\d*$/.test(n));}
  catch{return null;}
  const all=new Map();
  for(const name of names){
    const pid=Number(name);
    if(!Number.isSafeInteger(pid))continue;
    let status;
    try{status=readFileSync(join(procRoot,name,'status'),'utf8');}
    catch{continue;} // Process exited during enumeration.
    const ppid=integer(status,'PPid');
    if(ppid===null)continue;
    all.set(pid,{pid,ppid,rssKB:integer(status,'VmRSS'),hwmKB:integer(status,'VmHWM')});
  }
  if(!all.has(rootPid)||all.get(rootPid).rssKB===null)return null;
  const members=[],seen=new Set([rootPid]),queue=[rootPid];
  while(queue.length){
    const pid=queue.shift(),item=all.get(pid);
    if(item)members.push(item);
    for(const candidate of all.values()){
      if(candidate.ppid===pid&&!seen.has(candidate.pid)){
        seen.add(candidate.pid);queue.push(candidate.pid);
      }
    }
  }
  let sumRSSKB=0,sumPSSKB=0,completeRSS=true,completePSS=true;
  for(const item of members){
    if(item.rssKB===null)completeRSS=false;
    else sumRSSKB+=item.rssKB;
    try{
      const rollup=readFileSync(join(procRoot,String(item.pid),'smaps_rollup'),'utf8');
      const pss=integer(rollup,'Pss');
      if(pss===null)completePSS=false;
      else sumPSSKB+=pss;
    }catch{completePSS=false;}
  }
  const root=all.get(rootPid);
  return {
    measured:true,processCount:members.length,
    rootRSSBytes:root.rssKB*kib,
    rootHWMBytes:root.hwmKB===null?null:root.hwmKB*kib,
    summedTreeRSSBytes:completeRSS?sumRSSKB*kib:null,
    proportionalTreePSSBytes:completePSS?sumPSSKB*kib:null,
    rssComplete:completeRSS,pssComplete:completePSS
  };
}
