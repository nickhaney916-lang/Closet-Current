/**
 * M238 research-only pass-through WASM memory-reference snapshots.
 * No buffer contents, owner/source/photo, URLs, raw errors or model weights.
 * Unlike JS Memory.grow calls, byteLength snapshots can witness native
 * WASM-internal memory.grow if the instance imports/exports the same memory.
 * Zero observed memory references do NOT prove absent native growth.
 */
export const M238_WORKER_PROBE="\nconst p238Observed={installed:0,refs:[],imports:0,exports:0};\nconst p238Pages=memory=>{\n try{const n=memory.buffer.byteLength;\n  return Number.isSafeInteger(n)&&n>=0?Math.min(65536,Math.floor(n/65536)):null;\n }catch{return null;}\n};\nconst p238Values=obj=>{\n try{\n  if(!obj||typeof obj!=='object')return [];\n  return Object.values(Object.getOwnPropertyDescriptors(obj))\n   .filter(d=>Object.prototype.hasOwnProperty.call(d,'value'))\n   .map(d=>d.value).slice(0,64);\n }catch{return [];}\n};\nconst p238Keep=(value,kind)=>{\n try{\n  if(!(value instanceof WebAssembly.Memory))return;\n  if(p238Observed.refs.some(x=>x.memory===value))return;\n  if(p238Observed.refs.length>=16)return;\n  p238Observed.refs.push({memory:value,initial:p238Pages(value)});\n  if(kind==='import')p238Observed.imports++;\n  if(kind==='export')p238Observed.exports++;\n }catch{}\n};\nfunction p238ScanImports(value){\n for(const space of p238Values(value).slice(0,16)){\n  p238Keep(space,'import');\n  for(const child of p238Values(space).slice(0,32))p238Keep(child,'import');\n }\n}\nfunction p238ScanInstance(value){\n try{const instance=value?.instance||value;\n  for(const item of p238Values(instance?.exports))p238Keep(item,'export');\n }catch{}\n}\nfunction p238Install(id){\n for(const name of ['instantiate','instantiateStreaming']){\n  const native=WebAssembly[name];\n  if(typeof native!=='function')continue;\n  try{\n   WebAssembly[name]=function(...args){\n    try{p238ScanImports(args[1]);}catch{}\n    const original=Reflect.apply(native,WebAssembly,args);\n    try{\n     if(original&&typeof original.then==='function'){\n      original.then(value=>{try{p238ScanInstance(value);}catch{}},()=>{});\n     }else p238ScanInstance(original);\n    }catch{}\n    return original;\n   };\n   p238Observed.installed++;\n  }catch{}\n }\n self.postMessage({type:'diagnostic',id,phase:'p238_memory_snapshot_hook',\n  outcome:p238Observed.installed===2?'ok':'error',\n  memorySnapshotHooks:p238Observed.installed});\n}\nfunction p238Emit(id){\n let maxStart=0,maxEnd=0,maxIncrease=0,usable=0;\n for(const ref of p238Observed.refs){\n  const start=ref.initial,end=p238Pages(ref.memory);\n  if(start===null||end===null)continue;\n  usable++;\n  maxStart=Math.max(maxStart,start);\n  maxEnd=Math.max(maxEnd,end);\n  maxIncrease=Math.max(maxIncrease,end-start);\n }\n self.postMessage({type:'diagnostic',id,phase:'p238_memory_snapshot',outcome:'ok',\n  memorySnapshotHooks:p238Observed.installed,\n  memoryRefs:Math.min(16,p238Observed.refs.length),\n  importedMemoryRefs:Math.min(16,p238Observed.imports),\n  exportedMemoryRefs:Math.min(16,p238Observed.exports),\n  usableMemoryRefs:Math.min(16,usable),\n  maxStartPages:Math.min(65536,maxStart),\n  maxEndPages:Math.min(65536,maxEnd),\n  maxIncreasePages:Math.min(65536,maxIncrease)});\n}\n";

/**
 * Tiny deterministic WASM programs with native memory.grow instructions.
 * One exports memory, the other imports memory without exporting it.
 */
export function m238SyntheticWasm(imported=false){
 const leb=n=>{const o=[];do{let b=n&127;n>>>=7;if(n)b|=128;o.push(b);}while(n);return o};
 const name=s=>[...leb(Buffer.byteLength(s)),...Buffer.from(s,'utf8')];
 const sec=(id,p)=>[id,...leb(p.length),...p];
 const type=sec(1,[1,0x60,0,1,0x7f]);
 const importedMem=sec(2,[1,...name('env'),...name('m'),2,1,1,4]);
 const func=sec(3,[1,0]);
 const ownMem=sec(5,[1,1,1,4]);
 const exp=imported?sec(7,[1,...name('grow'),0,0]):
  sec(7,[2,...name('memory'),2,0,...name('grow'),0,0]);
 const code=sec(10,[1,6,0,0x41,1,0x40,0,0x0b]);
 return Uint8Array.from([0,97,115,109,1,0,0,0,...type,
  ...(imported?importedMem:[]),...func,...(imported?[]:ownMem),
  ...exp,...code]);
}
