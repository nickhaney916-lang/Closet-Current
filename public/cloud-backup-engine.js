'use strict';
(function(root){
 const stateIds=['draft','looks','outfit-board'];
 function canonical(value){if(value===undefined)return 'undefined';if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';}
 const equal=(a,b)=>canonical(a)===canonical(b);
 function validateDocument(value){
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
  validateDocument(local);validateDocument(remote);const ancestor=base||{schemaVersion:1,items:[],state:{}};
  const state=mergeValue(ancestor.state,local.state,remote.state),items=mergeList(ancestor.items,local.items,remote.items);
  if(state.draft?.batch)state.draft={...state.draft,batch:state.draft.batch.filter(x=>!items.some(y=>y.id===x.id))};
  return validateDocument({schemaVersion:1,items,state});
 }
 async function mapImages(value,map){
  if(Array.isArray(value))return Promise.all(value.map(x=>mapImages(x,map)));
  if(value&&typeof value==='object'){const out={};for(const [key,v]of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(key))throw Error('Invalid cloud key');out[key]=key==='image'&&typeof v==='string'&&v?await map(v):await mapImages(v,map);}return out;}return value;
 }
 const api={canonical,equal,validateDocument,mergeDocuments,mapImages,stateIds};root.ClosetBackupEngine=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
