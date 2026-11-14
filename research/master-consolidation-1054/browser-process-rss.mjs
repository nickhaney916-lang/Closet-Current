/** Research-only Linux process RSS; process-tree sum double-counts shared pages. */
import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
function parseStatus(status) {
 const parent=/^PPid:\s*(\d+)\s*$/m.exec(status);
 const rss=/^VmRSS:\s*(\d+)\s+kB\s*$/m.exec(status);
 if(!parent||!rss)return null;
 const ppid=Number(parent[1]),rssKB=Number(rss[1]);
 if(!Number.isSafeInteger(ppid)||!Number.isSafeInteger(rssKB))return null;
 return {ppid,rssBytes:rssKB*1024};
}
export async function sampleBrowserProcessRss(rootPid,{procRoot='/proc'}={}){
 if(!Number.isSafeInteger(rootPid)||rootPid<=0)return null;
 let entries;try{entries=await readdir(procRoot,{withFileTypes:true});}catch{return null;}
 const pids=entries.filter(e=>e.isDirectory()&&/^[1-9]\d*$/.test(e.name)).map(e=>Number(e.name));
 const records=await Promise.all(pids.map(async pid=>{
  try{const p=parseStatus(await readFile(join(procRoot,String(pid),'status'),'utf8'));return p?{pid,...p}:null;}
  catch{return null;}
 }));
 const table=new Map(records.filter(Boolean).map(x=>[x.pid,x]));
 if(!table.has(rootPid))return null;
 const children=new Map();
 for(const p of table.values()){
  if(!children.has(p.ppid))children.set(p.ppid,[]);
  children.get(p.ppid).push(p.pid);
 }
 let aggregate=0,count=0;
 const visited=new Set(),stack=[rootPid];
 while(stack.length){
  const pid=stack.pop();if(visited.has(pid))continue;visited.add(pid);
  const p=table.get(pid);if(!p)continue;
  aggregate+=p.rssBytes;count++;
  for(const c of children.get(pid)||[])stack.push(c);
 }
 return {rootRssBytes:table.get(rootPid).rssBytes,treeRssBytes:aggregate,processCount:count,metric:'Linux VmRSS process tree, non-unique shared pages'};
}
