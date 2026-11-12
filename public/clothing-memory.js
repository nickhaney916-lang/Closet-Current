'use strict';
(function(root){
 const keys=['category','itemType','pattern','sleeveLength','fit'];
 // Review context stays in memory only. Rebuild stored proposals through
 // weekly/suggest instead of replaying a serialized approval on another photo.
 const contexts=new WeakMap();
 const photo=item=>item.recognitionPhoto?.image||item.image;
 const mask=item=>JSON.stringify(item.segmentHint||null);
 function bind(item,suggestion){contexts.set(suggestion,{item,id:item.id,image:item.image,photo:photo(item),category:item.category,itemType:item.itemType,memory:item.recognitionMemory,mask:mask(item)});return suggestion;}
 function compatible(item,fields){return !(!missing(item.category)&&!missing(fields?.category)&&item.category!==fields.category||!missing(item.itemType)&&!missing(fields?.itemType)&&item.itemType!==fields.itemType);}

 const missing=value=>!value||['Unknown','Uncategorized','Not applicable'].includes(value);
 function valid(memory){return memory?.version===1&&typeof memory.modelKey==='string'&&memory.modelKey.length<160&&Array.isArray(memory.features)&&memory.features.length===512&&memory.features.every(Number.isFinite)&&Math.abs(memory.features.reduce((n,x)=>n+x*x,0)-1)<.02;}
 function confirm(item){const details={};for(const key of keys)if(!missing(item[key]))details[key]=item[key];const out={...item,confirmedDetails:details};delete out.learningReviewedWeek;return out;}
 function suggest(item,examples){
  if(!valid(item.recognitionMemory))return null;
  const seen=new Set(),seenIds=new Set(),matches=[],queryPhoto=item.recognitionPhoto?.image||item.image;
  for(const other of examples){const d=other.confirmedDetails,m=other.recognitionMemory,photo=other.recognitionPhoto?.image||other.image;
   if(other.id===item.id||seenIds.has(other.id)||typeof photo!=='string'||!photo||photo===queryPhoto||!d||missing(d.category)||missing(d.itemType)||d.category!==other.category||d.itemType!==other.itemType||!valid(m)||m.modelKey!==item.recognitionMemory.modelKey||seen.has(photo))continue;
   seen.add(photo);seenIds.add(other.id);let score=0;for(let i=0;i<512;i++)score+=m.features[i]*item.recognitionMemory.features[i];if(score>=.9)matches.push({other,score});
  }
  matches.sort((a,b)=>b.score-a.score);const top=matches.slice(0,3);if(top.length<2)return null;
  const category=top[0].other.confirmedDetails.category,type=top[0].other.confirmedDetails.itemType;
  if(top.some(x=>x.other.confirmedDetails.category!==category||x.other.confirmedDetails.itemType!==type)||!missing(item.category)&&item.category!==category||!missing(item.itemType)&&item.itemType!==type||item.segmentHint&&(item.segmentHint.clipped||!item.segmentHint.categories?.includes(category)||item.segmentHint.types?.length&&!item.segmentHint.types.includes(type)))return null;
  const fields={};for(const key of keys){const value=top[0].other.confirmedDetails[key];if(missing(item[key])&&!missing(value)&&top.every(x=>x.other.confirmedDetails[key]===value&&x.other[key]===value))fields[key]=value;}
  if(!Object.keys(fields).length)return null;
  return bind(item,{fields,sourceIds:top.map(x=>x.other.id),similarity:top[0].score,requiresConfirmation:true});
 }
 function weekly(item){const proposal=item.weeklySuggestion;if(proposal?.requiresConfirmation!==true||!compatible(item,proposal.fields))return null;const fields={};for(const key of keys)if(missing(item[key])&&!missing(proposal.fields?.[key]))fields[key]=proposal.fields[key];return Object.keys(fields).length?bind(item,{fields,sourceIds:[],requiresConfirmation:true}):null;}
 function apply(item,suggestion){const out={...item},context=contexts.get(suggestion);
  if(suggestion?.requiresConfirmation!==true||!context||context.item!==item||context.id!==item.id||context.image!==item.image||context.photo!==photo(item)||context.category!==item.category||context.itemType!==item.itemType||context.memory!==item.recognitionMemory||context.mask!==mask(item)||!compatible(item,suggestion.fields))return out;
  for(const key of keys)if(missing(out[key])&&!missing(suggestion.fields?.[key]))out[key]=suggestion.fields[key];return out;}
 function week(date=new Date()) {const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date),part=name=>parts.find(x=>x.type===name).value;const d=new Date(part('year')+'-'+part('month')+'-'+part('day')+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);}

 // Parallel #72 is a SEPARATE, opt-in learning protocol. The legacy confirm()
 // interface is retained only for branches with the experimental gate off.
 // Do not infer owner authentication from a caller-supplied ID: the host must
 // provide and revoke a trusted per-owner session. No network or photo logs.
 const sessions72=new WeakSet(),contexts72=new WeakMap(),pending72=new WeakMap();
 const digest72=async bytes=>{
  if(!root.crypto?.subtle)throw Error('P72_CRYPTO_UNAVAILABLE');
  const digest=await root.crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
 };
 const hashText72=s=>digest72(new TextEncoder().encode(s));
 const original72=item=>item?.recognitionPhoto?.image||item?.image;
 async function photoHash72(url){
  if(typeof url!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(url))
   throw Error('P72_ORIGINAL_JPEG_REQUIRED');
  const binary=atob(url.slice(url.indexOf(',')+1));
  if(binary.length<4||binary.charCodeAt(0)!==255||binary.charCodeAt(1)!==216||
     binary.charCodeAt(binary.length-2)!==255||binary.charCodeAt(binary.length-1)!==217)
   throw Error('P72_INVALID_SOURCE_JPEG');
  return digest72(Uint8Array.from(binary,c=>c.charCodeAt(0)));
 }
 const fieldRecord72=item=>Object.fromEntries([...keys,'color'].map(k=>[k,String(item?.[k]||'')]));
 async function fingerprint72(item){
  if(!item||!item.id||!valid(item.recognitionMemory))return null;
  const sourceSha256=await photoHash72(original72(item));
  const cropSha256=await hashText72(String(item.image||''));
  const maskSha256=await hashText72(JSON.stringify(item.segmentHint||null));
  const modelKey=item.recognitionMemory.modelKey;
  const memorySha256=await hashText72(JSON.stringify(item.recognitionMemory));
  const fieldsSha256=await hashText72(JSON.stringify(fieldRecord72(item)));
  return {itemId:String(item.id),sourceSha256,cropSha256,maskSha256,
   modelKey,memorySha256,fieldsSha256};
 }
 function open72({ownerId,sessionId}={}){
  if(typeof ownerId!=='string'||ownerId.length<3||ownerId.length>160||
     typeof sessionId!=='string'||sessionId.length<8||sessionId.length>160)
   throw Error('P72_OWNER_SESSION_REQUIRED');
  const scope=Object.seal({ownerId,sessionId,active:true});
  sessions72.add(scope);return scope;
 }
 function close72(scope){if(sessions72.has(scope))scope.active=false;}
 function live72(scope){return Boolean(scope&&sessions72.has(scope)&&scope.active);}
 const same72=(a,b)=>Boolean(a&&b&&Object.keys(a).every(k=>a[k]===b[k]));
 async function begin72(item,scope,{reviewedKeys=['category','itemType']}={}){
  if(!live72(scope)||!Array.isArray(reviewedKeys)||reviewedKeys.some(key=>!keys.includes(key))||
     !reviewedKeys.includes('category')||!reviewedKeys.includes('itemType'))return null;
  const evidence=await fingerprint72(item).catch(()=>null);
  if(!live72(scope)||!evidence)return null;
  const token=Object.freeze({type:'owner-photo-review-pending-72'});
  pending72.set(token,{scope,item,evidence,reviewedKeys:[...new Set(reviewedKeys)],consumed:false});return token;
 }
 async function accept72(item,token,scope,{ownerChecked=false}={}){
  const ctx=pending72.get(token);if(!ownerChecked||!live72(scope)||!ctx||
    ctx.consumed||ctx.scope!==scope||ctx.item!==item)return null;
  ctx.consumed=true;pending72.delete(token);
  const current=await fingerprint72(item).catch(()=>null);
  if(!live72(scope)||!same72(current,ctx.evidence))return null;
  const details={};for(const key of ctx.reviewedKeys)
   if(!missing(item[key])&&typeof item[key]==='string')details[key]=item[key];
  if(missing(details.category)||missing(details.itemType)||missing(item.color))return null;
  return {...item,confirmedDetails:details,correctionReceipt72:{
   version:1,ownerId:scope.ownerId,...current,
   fields:fieldRecord72(item),reviewedKeys:ctx.reviewedKeys,
   review:'owner-explicit-photo-consent',
   timestamp:new Date().toISOString()
  }};
 }
 async function verified72(item,scope){
  const receipt=item?.correctionReceipt72;
  if(!live72(scope)||receipt?.version!==1||receipt.ownerId!==scope.ownerId||
    receipt.review!=='owner-explicit-photo-consent'||
    !Array.isArray(receipt.reviewedKeys)||receipt.reviewedKeys.some(key=>!keys.includes(key))||
    !receipt.reviewedKeys.includes('category')||!receipt.reviewedKeys.includes('itemType')||
    !item?.confirmedDetails||missing(item.confirmedDetails.category)||
    missing(item.confirmedDetails.itemType))return false;
  const current=await fingerprint72(item).catch(()=>null);
  if(!current||!same72(current,receipt)||JSON.stringify(receipt.fields)!==
    JSON.stringify(fieldRecord72(item)))return false;
  for(const [key,value] of Object.entries(item.confirmedDetails))
   if(!receipt.reviewedKeys.includes(key)||item[key]!==value||missing(value))return false;
  return true;
 }
 async function suggest72(item,examples,scope){
  if(!live72(scope)||!Array.isArray(examples)||!valid(item?.recognitionMemory))return null;
  const context=await fingerprint72(item).catch(()=>null);
  if(!live72(scope)||!context)return null;
  const eligible=[],origins=new Set(),units=new Set();
  for(const other of examples){
   if(!other||other===item||String(other.id)===String(item.id)||
     !valid(other.recognitionMemory)||other.recognitionMemory.modelKey!==context.modelKey||
     !await verified72(other,scope))continue;
   const receipt=other.correctionReceipt72;
   if(receipt.sourceSha256===context.sourceSha256||
      origins.has(receipt.sourceSha256)||units.has(String(other.ownedUnitId||other.id)))continue;
   let cosine=0;
   for(let i=0;i<512;i++)cosine+=other.recognitionMemory.features[i]*item.recognitionMemory.features[i];
   if(cosine<.90)continue; // Historical guard; NOT calibrated confidence.
   origins.add(receipt.sourceSha256);units.add(String(other.ownedUnitId||other.id));
   eligible.push({other,cosine});
  }
  if(!live72(scope)||eligible.length<2)return null;
  // An eligible contradiction poisons the group, never majority-votes it away.
  const agreed=eligible[0].other.confirmedDetails;
  if(eligible.some(({other})=>other.confirmedDetails.category!==agreed.category||
     other.confirmedDetails.itemType!==agreed.itemType)||
     !missing(item.category)&&item.category!==agreed.category||
     !missing(item.itemType)&&item.itemType!==agreed.itemType||
     item.segmentHint?.clipped||
     item.segmentHint?.categories?.length&&!item.segmentHint.categories.includes(agreed.category)||
     item.segmentHint?.types?.length&&!item.segmentHint.types.includes(agreed.itemType))return null;
  const fields={};
  for(const key of keys){
   if(!missing(item[key]))continue;
   const value=agreed[key];
   if(!missing(value)&&eligible.every(({other})=>
      other.confirmedDetails[key]===value&&other[key]===value))fields[key]=value;
  }
  // Color has no validated transferable feature; NEVER infer it.
  if(!Object.keys(fields).length)return null;
  const proposal=Object.freeze({fields:Object.freeze(fields),evidenceCount:eligible.length,
   requiresConfirmation:true,learningMode:'opt-in-owner-correction-72'});
  contexts72.set(proposal,{scope,item,evidence:context});return proposal;
 }
 async function apply72(item,proposal,scope,{ownerChecked=false}={}){
  const context=contexts72.get(proposal),copy={...item};
  if(!ownerChecked||!live72(scope)||!context||context.scope!==scope||
     context.item!==item||proposal?.requiresConfirmation!==true)return copy;
  contexts72.delete(proposal); // one confirmation, never a replayable token
  const current=await fingerprint72(item).catch(()=>null);
  if(!live72(scope)||!same72(current,context.evidence))return copy;
  for(const key of keys)if(missing(copy[key])&&!missing(proposal.fields?.[key]))
   copy[key]=proposal.fields[key];
  // This is a review-only draft and intentionally creates no training receipt.
  return copy;
 }
 const api={valid,confirm,suggest,weekly,apply,week,open72,close72,begin72,accept72,
  verified72,suggest72,apply72,photoHash72};
 root.ClothingMemory=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
