'use strict';
(function(root){
 const keys=['category','itemType','pattern','sleeveLength','fit'];
 const missing=value=>!value||['Unknown','Uncategorized','Not applicable'].includes(value);
 function valid(memory){return memory?.version===1&&typeof memory.modelKey==='string'&&memory.modelKey.length<160&&Array.isArray(memory.features)&&memory.features.length===512&&memory.features.every(Number.isFinite)&&Math.abs(memory.features.reduce((n,x)=>n+x*x,0)-1)<.02;}
 function confirm(item){const details={};for(const key of keys)if(!missing(item[key]))details[key]=item[key];return {...item,confirmedDetails:details};}
 function suggest(item,examples){
  if(!valid(item.recognitionMemory))return null;
  const seen=new Set(),matches=[];
  for(const other of examples){const d=other.confirmedDetails,m=other.recognitionMemory,photo=other.recognitionPhoto?.image||other.image;
   if(other.id===item.id||!d||missing(d.category)||missing(d.itemType)||d.category!==other.category||d.itemType!==other.itemType||!valid(m)||m.modelKey!==item.recognitionMemory.modelKey||seen.has(photo))continue;
   seen.add(photo);let score=0;for(let i=0;i<512;i++)score+=m.features[i]*item.recognitionMemory.features[i];if(score>=.9)matches.push({other,score});
  }
  matches.sort((a,b)=>b.score-a.score);const top=matches.slice(0,3);if(top.length<2)return null;
  const category=top[0].other.confirmedDetails.category,type=top[0].other.confirmedDetails.itemType;
  if(top.some(x=>x.other.confirmedDetails.category!==category||x.other.confirmedDetails.itemType!==type)||!missing(item.category)&&item.category!==category||item.segmentHint&&(item.segmentHint.clipped||!item.segmentHint.categories?.includes(category)||item.segmentHint.types?.length&&!item.segmentHint.types.includes(type)))return null;
  const fields={};for(const key of keys){const value=top[0].other.confirmedDetails[key];if(missing(item[key])&&!missing(value)&&top.every(x=>x.other.confirmedDetails[key]===value&&x.other[key]===value))fields[key]=value;}
  if(!Object.keys(fields).length)return null;
  return {fields,sourceIds:top.map(x=>x.other.id),similarity:top[0].score,requiresConfirmation:true};
 }
 function weekly(item){const proposal=item.weeklySuggestion;if(!proposal?.requiresConfirmation)return null;const fields={};for(const key of keys)if(missing(item[key])&&!missing(proposal.fields?.[key]))fields[key]=proposal.fields[key];return Object.keys(fields).length?{fields,sourceIds:[],requiresConfirmation:true}:null;}
 function apply(item,suggestion){const out={...item};if(!suggestion?.requiresConfirmation)return out;for(const key of keys)if(missing(out[key])&&!missing(suggestion.fields?.[key]))out[key]=suggestion.fields[key];return out;}
 function week(date=new Date()) {const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date),part=name=>parts.find(x=>x.type===name).value;const d=new Date(part('year')+'-'+part('month')+'-'+part('day')+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);}
 const api={valid,confirm,suggest,weekly,apply,week};root.ClothingMemory=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
