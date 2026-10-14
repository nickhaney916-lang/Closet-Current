'use strict';
(function(root){
 const stateIds=['draft','looks','outfit-board'];
 function canonical(value){if(value===undefined)return 'undefined';if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';}
 const equal=(a,b)=>canonical(a)===canonical(b);
 function validateDocument(value){
  function safeKeys(x){if(x&&typeof x==='object')for(const [key,v]of Object.entries(x)){if(['__proto__','constructor','prototype'].includes(key))throw Error('Invalid cloud key');safeKeys(v);}}safeKeys(value);
  if(!value||value.schemaVersion!==1||!Array.isArray(value.items)||value.items.length>1000||!value.state||typeof value.state!=='object'||Array.isArray(value.state)||Object.keys(value.state).some(k=>!stateIds.includes(k)))throw Error('Invalid cloud closet');
  for(const [id,row]of Object.entries(value.state)){if(!row||row.id!==id)throw Error('Invalid cloud state');if(id==='draft'&&(!Array.isArray(row.batch)||row.batch.length>60))throw Error('Invalid cloud draft');if(id==='looks'&&(!Array.isArray(row.looks)||row.looks.length>100))throw Error('Invalid cloud looks');if(id==='outfit-board'&&(!row.current||typeof row.current!=='object'||!Array.isArray(row.saved)||row.saved.length>50))throw Error('Invalid cloud outfits');}
  const ids=new Set();for(const item of value.items){if(!item||typeof item.id!=='string'||!item.id||item.id.length>120||ids.has(item.id))throw Error('Invalid cloud item');ids.add(item.id);}
  return value;
 }
 function mergeList(base=[],local=[],remote=[]){
  const maps=[base,local,remote].map(list=>new Map(list.map(x=>[x.id,x]))),merged=[];
  for(const id of new Set(maps.flatMap(m=>[...m.keys()]))){const [b,l,r]=maps.map(m=>m.get(id));const value=mergeValue(b,l,r);if(value!==undefined)merged.push(value);}
  return merged;
 }
 function mergeValue(base,local,remote){
  if(equal(local,remote))return local;if(equal(local,base))return remote;if(equal(remote,base))return local;
  if((base===undefined||Array.isArray(base))&&[local,remote].every(x=>Array.isArray(x)&&x.every(y=>y&&typeof y.id==='string')))return mergeList(base||[],local,remote);
  if((base===undefined||base&&typeof base==='object'&&!Array.isArray(base))&&[local,remote].every(x=>x&&typeof x==='object'&&!Array.isArray(x))){base=base||{};const out={};for(const k of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)])){const value=mergeValue(base[k],local[k],remote[k]);if(value!==undefined)out[k]=value;}return out;}
  const error=Error('Conflicting closet edits');error.code='conflict';throw error;
 }
 function mergeDocuments(base,local,remote){
  validateDocument(local);validateDocument(remote);if(base)validateDocument(base);const ancestor=base||{schemaVersion:1,items:[],state:{}};
  const state=mergeValue(ancestor.state,local.state,remote.state),items=mergeList(ancestor.items,local.items,remote.items);
  if(state.draft?.batch)state.draft={...state.draft,batch:state.draft.batch.filter(x=>!items.some(y=>y.id===x.id))};
  return validateDocument({schemaVersion:1,items,state});
 }
 async function mapImages(value,map){
  if(Array.isArray(value))return Promise.all(value.map(x=>mapImages(x,map)));
  if(value&&typeof value==='object'){const out={};for(const [key,v]of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(key))throw Error('Invalid cloud key');out[key]=key==='image'&&typeof v==='string'&&v?await map(v):await mapImages(v,map);}return out;}return value;
 }
 function keepBothDocuments(base,local,remote,makeId){
  validateDocument(local);validateDocument(remote);if(base)validateDocument(base);base=base||{items:[],state:{}};
  const copiedItems=new Map();
  function copy(row){const value=structuredClone(row);value.id=makeId(row);if(!value.id||value.id===row.id)throw Error('Invalid copy ID');for(const key of ['name','title'])if(typeof value[key]==='string')value[key]=value[key].slice(0,100)+' (saved copy)';return value;}
  function list(b=[],l=[],r=[],track=false){const maps=[b,l,r].map(rows=>new Map(rows.map(x=>[x.id,x]))),out=new Map();for(const id of new Set(maps.flatMap(m=>[...m.keys()]))){const [ancestor,left,right]=maps.map(m=>m.get(id));try{const value=mergeValue(ancestor,left,right);if(value!==undefined){if(out.has(id)&&!equal(out.get(id),value))throw Error('Copy ID collision');out.set(id,value);}}catch(e){if(e.code!=='conflict')throw e;if(right)out.set(id,right);if(left){const value=right?copy(left):left;if(track&&right)copiedItems.set(id,value.id);if(out.has(value.id)&&!equal(out.get(value.id),value))throw Error('Copy ID collision');out.set(value.id,value);}}}return [...out.values()];}
  const items=list(base.items,local.items,remote.items,true),state={};
  for(const [id,key]of [['draft','batch'],['looks','looks']]){const b=base.state[id],l=local.state[id],r=remote.state[id];if(l||r){const rows=list(b?.[key],l?.[key],r?.[key]);state[id]={id,[key]:id==='draft'?rows.filter(x=>!items.some(y=>y.id===x.id)):rows};}}
  const b=base.state['outfit-board'],l=structuredClone(local.state['outfit-board']),r=remote.state['outfit-board'];
  if(l){for(const board of [l.current,...l.saved])for(const [slot,id]of Object.entries(board.slots||{}))if(copiedItems.has(id))board.slots[slot]=copiedItems.get(id);}
  if(l||r){const saved=list(b?.saved,l?.saved,r?.saved);let current;try{current=mergeValue(b?.current,l?.current,r?.current);}catch(e){if(e.code!=='conflict')throw e;current=r?.current||l?.current;if(l?.current&&r?.current){const extra=copy(l.current);const existing=saved.find(x=>x.id===extra.id);if(existing&&!equal(existing,extra))throw Error('Copy ID collision');if(!existing)saved.push(extra);}}state['outfit-board']={id:'outfit-board',current:current||{slots:{}},saved};}
  return validateDocument({schemaVersion:1,items,state});
 }
 const api={canonical,equal,validateDocument,mergeDocuments,keepBothDocuments,mapImages,stateIds};root.ClosetBackupEngine=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
