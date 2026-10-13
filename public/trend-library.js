'use strict';
function safeTrendURL(value){
 try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||!url.hostname.includes('.')||/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.)/.test(url.hostname)||/^\[/.test(url.hostname)||/^\d+(?:\.\d+){3}$/.test(url.hostname))return '';return url.href;}catch{return '';}
}
function normalizeTrendLibrary(value){
 if(value?.schema_version!==1||!Array.isArray(value.sources)||!Array.isArray(value.products)||!Array.isArray(value.directions))throw Error('Invalid recommendation library.');
 const updated=new Date(value.updated_at);if(!Number.isFinite(updated.getTime())||updated.getTime()>Date.now()+86400000)throw Error('Invalid verification date.');
 const text=(v,n=150)=>String(v||'').slice(0,n),audience=v=>['Women','Men','All'].includes(v)?v:'All';
 const sources=value.sources.slice(0,30).filter(x=>safeTrendURL(x.url)&&x.id&&x.title).map(x=>({id:text(x.id,60),title:text(x.title),url:safeTrendURL(x.url),publication:text(x.publication,80),publishedAt:text(x.published_at,40),checked:text(x.checked_at||value.updated_at,40)}));
 const sourceIds=new Set(sources.map(x=>x.id));
 const products=value.products.slice(0,100).filter(x=>safeTrendURL(x.url)&&x.name&&x.type&&x.available!==false).map(x=>({type:text(x.type,60),audience:audience(x.audience),name:text(x.name),url:safeTrendURL(x.url),priceAtCheck:Number.isFinite(x.price_at_check)&&x.price_at_check>=0?x.price_at_check:null,checkedAt:text(x.checked_at||value.updated_at,40),retailer:text(x.retailer,80)}));
 const slots=['top','bottom','layer','shoes','bag','accessory','finish'];
 const directions=value.directions.slice(0,100).filter(x=>slots.includes(x.slot)&&x.type&&sourceIds.has(x.source_id)).map(x=>({id:text(x.id,60),slot:x.slot,type:text(x.type,60),label:text(x.label||x.type,80),color:text(x.color||'neutral',40),reason:text(x.reason,300),audiences:(x.audiences||['All']).filter(a=>['Women','Men','All'].includes(a)),occasions:(x.occasions||[]).filter(a=>['Casual','Work','Dinner','Active'].includes(a)),seasons:(x.seasons||[]).filter(a=>['Spring','Summer','Fall','Winter'].includes(a)),sourceId:x.source_id}));
 const retailers=(value.retailers||[]).slice(0,50).filter(x=>safeTrendURL(x.url)&&x.name).map(x=>({name:text(x.name,80),url:safeTrendURL(x.url),audience:audience(x.audience),types:(x.types||[]).map(t=>text(t,60))}));
 if(sources.length<2||directions.length<3)throw Error('Recommendation library is incomplete.');
 return {updatedAt:updated.toISOString(),nextRefreshAt:text(value.next_refresh_at,40),sources,products,directions,retailers};
}
if(typeof module!=='undefined')module.exports={safeTrendURL,normalizeTrendLibrary};
